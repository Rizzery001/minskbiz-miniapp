import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import {
  ConsumerBotNotConfiguredError,
  getMyProfile,
  getNearbyBoxes,
} from '../api'
import BookingSuccessSheet from '../components/BookingSuccessSheet'
import BotNotConfiguredScreen from '../components/BotNotConfiguredScreen'
import BoxDetailSheet from '../components/BoxDetailSheet'
import Toast, { useToast } from '../components/Toast'
import type { ConsumerBooking, ConsumerBox } from '../types'
import { hapticFeedback } from '../../lib/telegram'
import { useYandexMapsLoader } from '../../lib/yandexMaps'

const MINSK_CENTER: [number, number] = [53.9006, 27.559]
const INITIAL_ZOOM = 12
const RADIUS_KM = 10
const GEO_TIMEOUT_MS = 5000

interface MarkerEntry {
  pm: YMapsPlacemark
  active: boolean
}

function escapeHtml(input: string): string {
  return input.replace(/[<>&"']/g, (c) => {
    switch (c) {
      case '<':
        return '&lt;'
      case '>':
        return '&gt;'
      case '&':
        return '&amp;'
      case '"':
        return '&quot;'
      case "'":
        return '&#39;'
      default:
        return c
    }
  })
}

function makeBoxIconLayout(
  api: YMapsApi,
  priceByn: number,
  slotsLeft: number,
  active: boolean,
): unknown {
  const priceLabel = escapeHtml(`${priceByn} BYN`)
  const slotsLabel = escapeHtml(`· ${slotsLeft}`)
  const ring = active
    ? '0 0 0 3px var(--tg-link), 0 2px 6px rgba(0,0,0,0.25)'
    : '0 2px 5px rgba(0,0,0,0.2)'
  const scale = active ? 1.1 : 1
  const html = `
    <div style="position:relative;width:0;height:0;">
      <div style="position:absolute;left:0;top:0;transform:translate(-50%,-50%) scale(${scale});padding:5px 10px;border-radius:14px;background:#2481cc;color:#ffffff;border:2px solid #ffffff;box-shadow:${ring};font-size:13px;font-weight:600;line-height:1;white-space:nowrap;display:inline-flex;gap:4px;align-items:center;user-select:none;">
        <span>🎁</span>
        <span>${priceLabel}</span>
        <span style="opacity:0.85;font-weight:500;">${slotsLabel}</span>
      </div>
    </div>
  `
  return api.templateLayoutFactory.createClass(html)
}

export default function MapScreen() {
  const { api, loading: mapLoading, error: mapError } = useYandexMapsLoader()

  const containerRef = useRef<HTMLDivElement | null>(null)
  const mapRef = useRef<YMapsMap | null>(null)
  const markersRef = useRef<Map<string, MarkerEntry>>(new Map())

  const [coords, setCoords] = useState<[number, number] | null>(null)
  const [geoDenied, setGeoDenied] = useState(false)
  const [boxes, setBoxes] = useState<ConsumerBox[] | null>(null)
  const [boxesLoading, setBoxesLoading] = useState(false)
  const [botNotConfigured, setBotNotConfigured] = useState(false)
  const [boxesError, setBoxesError] = useState<string | null>(null)
  const [selectedBoxId, setSelectedBoxId] = useState<string | null>(null)
  const [successBooking, setSuccessBooking] =
    useState<ConsumerBooking | null>(null)
  const [toast, showToast] = useToast()

  // 1. Resolve the user's location, preferring the server copy saved by
  //    @krana_box_bot during onboarding. Hitting GET /consumer/me first
  //    means returning users skip the browser geolocation prompt
  //    entirely. Order:
  //      a. GET /consumer/me → use {location.lat, location.lng} if set
  //      b. backend says no saved location → ask the browser
  //      c. browser denies / unsupported → Minsk centre + nudge banner
  //    A 503 from /consumer/me means the consumer bot isn't connected;
  //    we surface the dedicated screen instead of falling through to a
  //    geo prompt that would be useless without a working backend.
  useEffect(() => {
    let cancelled = false

    async function initCoords() {
      try {
        const me = await getMyProfile()
        if (cancelled) return
        if (me?.location?.lat != null && me.location?.lng != null) {
          setCoords([me.location.lat, me.location.lng])
          return
        }
      } catch (err) {
        if (cancelled) return
        if (err instanceof ConsumerBotNotConfiguredError) {
          setBotNotConfigured(true)
          return
        }
        // Non-503 errors are non-fatal here — the browser fallback can
        // still give us coordinates so the map renders.
      }

      if (typeof navigator === 'undefined' || !('geolocation' in navigator)) {
        if (cancelled) return
        setGeoDenied(true)
        setCoords(MINSK_CENTER)
        return
      }
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          if (cancelled) return
          setCoords([pos.coords.latitude, pos.coords.longitude])
        },
        () => {
          if (cancelled) return
          setGeoDenied(true)
          setCoords(MINSK_CENTER)
        },
        {
          timeout: GEO_TIMEOUT_MS,
          enableHighAccuracy: false,
          maximumAge: 60_000,
        },
      )
    }

    void initCoords()

    return () => {
      cancelled = true
    }
  }, [])

  // 2. Once coords are known, fetch nearby boxes.
  useEffect(() => {
    if (!coords) return
    let cancelled = false
    setBoxesLoading(true)
    setBoxesError(null)
    setBotNotConfigured(false)
    getNearbyBoxes(coords[0], coords[1], RADIUS_KM)
      .then((res) => {
        if (cancelled) return
        setBoxes(res)
      })
      .catch((err: unknown) => {
        if (cancelled) return
        if (err instanceof ConsumerBotNotConfiguredError) {
          setBotNotConfigured(true)
          return
        }
        setBoxesError(
          err instanceof Error ? err.message : 'Не удалось загрузить',
        )
      })
      .finally(() => {
        if (!cancelled) setBoxesLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [coords])

  // 3. Initialise the Yandex map once both API and coords are ready.
  useEffect(() => {
    if (!api || !coords) return
    const container = containerRef.current
    if (!container) return

    const map = new api.Map(
      container,
      { center: coords, zoom: INITIAL_ZOOM, controls: [] },
      { suppressMapOpenBlock: true },
    )

    const rafId = window.requestAnimationFrame(() => {
      map.container.fitToViewport()
    })

    mapRef.current = map

    return () => {
      window.cancelAnimationFrame(rafId)
      markersRef.current.clear()
      map.destroy()
      mapRef.current = null
    }
    // coords is captured on first init; the map is destroyed and
    // re-created if coords change (rare — only on first location
    // resolve).
  }, [api, coords])

  // 4. Sync placemarks whenever the box list or selection changes.
  useEffect(() => {
    if (!api) return
    const map = mapRef.current
    if (!map) return
    if (!boxes) return
    const cache = markersRef.current
    const desired = new Set<string>()

    for (const box of boxes) {
      desired.add(box.id)
      const isActive = box.id === selectedBoxId
      const current = cache.get(box.id)
      if (current && current.active === isActive) continue

      if (current) {
        map.geoObjects.remove(current.pm)
      }

      const layout = makeBoxIconLayout(
        api,
        box.price_byn,
        box.slots_left,
        isActive,
      )
      const pm = new api.Placemark(
        [box.business_location.lat, box.business_location.lng],
        {},
        {
          iconLayout: layout,
          iconShape: {
            type: 'Rectangle',
            coordinates: [
              [-40, -16],
              [40, 16],
            ],
          },
          zIndex: isActive ? 1000 : 700,
        },
      )
      const boxId = box.id
      pm.events.add('click', () => {
        hapticFeedback.light()
        setSelectedBoxId(boxId)
      })
      map.geoObjects.add(pm)
      cache.set(boxId, { pm, active: isActive })
    }

    for (const [id, entry] of cache) {
      if (!desired.has(id)) {
        map.geoObjects.remove(entry.pm)
        cache.delete(id)
      }
    }
  }, [api, boxes, selectedBoxId])

  const dismissNudge = useCallback(() => setGeoDenied(false), [])

  const hasBoxes = (boxes?.length ?? 0) > 0
  const showEmptyState = useMemo(
    () => !boxesLoading && !boxesError && !botNotConfigured && boxes !== null && !hasBoxes,
    [boxesLoading, boxesError, botNotConfigured, boxes, hasBoxes],
  )

  const selectedBox = useMemo<ConsumerBox | null>(() => {
    if (!selectedBoxId || !boxes) return null
    return boxes.find((b) => b.id === selectedBoxId) ?? null
  }, [selectedBoxId, boxes])

  const closeDetailSheet = useCallback(() => setSelectedBoxId(null), [])
  const closeSuccessSheet = useCallback(() => setSuccessBooking(null), [])

  const handleBookingSuccess = useCallback((booking: ConsumerBooking) => {
    setSelectedBoxId(null)
    setSuccessBooking(booking)
  }, [])

  if (botNotConfigured) {
    return <BotNotConfiguredScreen />
  }

  return (
    <div className="relative w-full h-full" style={{ minHeight: 0 }}>
      <div ref={containerRef} className="absolute inset-0 w-full h-full" />

      {(mapLoading || coords === null) && (
        <div
          className="absolute inset-0 z-[900] flex items-center justify-center"
          style={{
            backgroundColor: 'var(--tg-bg)',
            color: 'var(--tg-hint)',
            fontSize: 13,
          }}
        >
          Загружаем карту…
        </div>
      )}

      {mapError && (
        <div
          className="absolute inset-x-4 z-[1000] tg-shadow-md rounded-xl text-center"
          style={{
            top: 12,
            padding: '14px 16px',
            backgroundColor: 'var(--tg-bg)',
            color: 'var(--tg-text)',
            border: '1px solid var(--tg-hairline)',
            fontSize: 14,
          }}
        >
          Не удалось загрузить карту. Проверьте подключение.
        </div>
      )}

      {geoDenied && !mapError && (
        <button
          type="button"
          onClick={dismissNudge}
          className="absolute left-3 right-3 z-[1000] tg-shadow-sm rounded-xl text-left active:opacity-80 transition"
          style={{
            top: 'calc(env(safe-area-inset-top, 0px) + 12px)',
            padding: '10px 12px',
            backgroundColor: 'var(--tg-bg)',
            color: 'var(--tg-text)',
            border: '1px solid var(--tg-hairline)',
            fontSize: 13,
            lineHeight: 1.35,
            transitionDuration: '150ms',
          }}
          aria-label="Закрыть подсказку"
        >
          <span aria-hidden="true">📍 </span>
          Поделись локацией для точных рекомендаций
        </button>
      )}

      {boxesLoading && !boxesError && (
        <div
          className="absolute left-1/2 -translate-x-1/2 z-[900] px-4 py-2 rounded-full tg-shadow-sm"
          style={{
            bottom: 24,
            backgroundColor: 'var(--tg-bg)',
            color: 'var(--tg-text)',
            border: '1px solid var(--tg-hairline)',
            fontSize: 13,
          }}
        >
          Загружаем боксы…
        </div>
      )}

      {boxesError && (
        <div
          className="absolute inset-x-4 z-[1000] tg-shadow-md rounded-xl text-center"
          style={{
            bottom: 24,
            padding: '14px 16px',
            backgroundColor: 'var(--tg-bg)',
            color: 'var(--tg-text)',
            border: '1px solid var(--tg-hairline)',
            fontSize: 14,
          }}
        >
          {boxesError}
        </div>
      )}

      {showEmptyState && (
        <div
          className="absolute left-1/2 -translate-x-1/2 z-[900] tg-shadow-md rounded-xl text-center"
          style={{
            top: 'calc(env(safe-area-inset-top, 0px) + 80px)',
            width: 'calc(100% - 32px)',
            maxWidth: 320,
            padding: '18px 20px',
            backgroundColor: 'var(--tg-bg)',
            color: 'var(--tg-text)',
            border: '1px solid var(--tg-hairline)',
          }}
        >
          <div style={{ fontSize: 28 }} aria-hidden="true">
            🗺
          </div>
          <p
            className="mt-1 font-medium"
            style={{ fontSize: 14, lineHeight: 1.35 }}
          >
            Поблизости пока нет Mystery Box'ов
          </p>
          <p
            className="mt-1"
            style={{ fontSize: 12, color: 'var(--tg-hint)', lineHeight: 1.4 }}
          >
            Загляни позже!
          </p>
        </div>
      )}

      {selectedBox && (
        <BoxDetailSheet
          box={selectedBox}
          onClose={closeDetailSheet}
          onBookingSuccess={handleBookingSuccess}
          onTransientError={showToast}
        />
      )}

      {successBooking && (
        <BookingSuccessSheet
          booking={successBooking}
          onClose={closeSuccessSheet}
        />
      )}

      <Toast message={toast} />
    </div>
  )
}
