import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import type { Listing } from '../../api/types'
import ErrorState from '../../components/ErrorState'
import { useListings, useUserMe } from '../../api/hooks'
import { hapticFeedback } from '../../lib/telegram'
import { useYandexMapsLoader } from '../../lib/yandexMaps'
import FarmerSheet from './FarmerSheet'
import LocateMeButton from './LocateMeButton'
import SearchInput from './SearchInput'
import { getCategoryStyle, normalizeCategory } from './categoryColors'

const MINSK_CENTER: [number, number] = [53.9006, 27.559]
const INITIAL_ZOOM = 11
const LOCATE_ZOOM = 14
const FOCUS_ZOOM = 14
const SHOW_ALL_MINSK_ZOOM = 10
const MIN_RADIUS_KM = 1
const MAX_RADIUS_KM = 200
const DEBOUNCE_MS = 400

function isValidLatLng(lat: unknown, lng: unknown): lat is number {
  return (
    typeof lat === 'number' &&
    Number.isFinite(lat) &&
    typeof lng === 'number' &&
    Number.isFinite(lng)
  )
}

function getPinCoords(listing: Listing): [number, number] | null {
  if (isValidLatLng(listing.pin_lat, listing.pin_lng)) {
    return [listing.pin_lat as number, listing.pin_lng as number]
  }
  if (isValidLatLng(listing.location_lat, listing.location_lng)) {
    return [listing.location_lat as number, listing.location_lng as number]
  }
  return null
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

/**
 * Build a Yandex Maps icon layout (templateLayoutFactory class) for a
 * single farmer pin. Returns a class object the Placemark accepts via
 * `iconLayout`.
 *
 * The layout is centred — translate(-50%, -50%) keeps the pin anchored
 * at the exact lat/lng.
 */
function makeFarmerIconLayout(
  api: YMapsApi,
  color: string,
  emoji: string,
  active: boolean,
): unknown {
  const safeColor = escapeHtml(color)
  const safeEmoji = escapeHtml(emoji)
  const size = active ? 44 : 36
  const fontSize = active ? 22 : 18
  const shadow = active
    ? '0 0 0 3px var(--tg-link), 0 2px 6px rgba(0,0,0,0.25)'
    : '0 2px 4px rgba(0,0,0,0.15)'
  const html = `
    <div style="position:relative;width:0;height:0;">
      <div style="position:absolute;left:0;top:0;transform:translate(-50%,-50%);width:${size}px;height:${size}px;border-radius:50%;background:${safeColor};border:3px solid #ffffff;box-shadow:${shadow};display:flex;align-items:center;justify-content:center;font-size:${fontSize}px;line-height:1;user-select:none;">
        ${safeEmoji}
      </div>
    </div>
  `
  return api.templateLayoutFactory.createClass(html)
}

/**
 * Pulsing blue dot for the buyer's own location.
 */
function makeUserLocationLayout(api: YMapsApi): unknown {
  // CSS keyframes are injected once globally (see ensureUserLocationStyle).
  const html = `
    <div style="position:relative;width:0;height:0;">
      <div class="krana-user-dot-pulse"></div>
      <div class="krana-user-dot"></div>
    </div>
  `
  return api.templateLayoutFactory.createClass(html)
}

const USER_DOT_STYLE_ID = 'krana-user-dot-style'

function ensureUserLocationStyle(): void {
  if (typeof document === 'undefined') return
  if (document.getElementById(USER_DOT_STYLE_ID)) return
  const style = document.createElement('style')
  style.id = USER_DOT_STYLE_ID
  style.textContent = `
    .krana-user-dot {
      position: absolute;
      left: 0;
      top: 0;
      transform: translate(-50%, -50%);
      width: 16px;
      height: 16px;
      border-radius: 50%;
      background: #2563eb;
      border: 3px solid #ffffff;
      box-shadow: 0 1px 4px rgba(0,0,0,0.3);
      pointer-events: none;
    }
    .krana-user-dot-pulse {
      position: absolute;
      left: 0;
      top: 0;
      transform: translate(-50%, -50%);
      width: 16px;
      height: 16px;
      border-radius: 50%;
      background: rgba(37, 99, 235, 0.35);
      animation: krana-user-dot-pulse 1.8s ease-out infinite;
      pointer-events: none;
    }
    @keyframes krana-user-dot-pulse {
      0%   { width: 16px;  height: 16px;  opacity: 0.6; }
      100% { width: 56px;  height: 56px;  opacity: 0;   }
    }
  `
  document.head.appendChild(style)
}

interface ViewState {
  lat: number
  lng: number
  radius_km: number
}

interface SellerPin {
  sellerId: string
  sellerName: string
  coords: [number, number]
  category: string
  emoji?: string
}

interface MarkerEntry {
  pm: YMapsPlacemark
  active: boolean
}

export default function FarmersMap() {
  const { api, loading: mapLoading, error: mapError } = useYandexMapsLoader()

  const containerRef = useRef<HTMLDivElement | null>(null)
  const mapRef = useRef<YMapsMap | null>(null)
  const sellerMarkersRef = useRef<Map<string, MarkerEntry>>(new Map())
  const userMarkerRef = useRef<YMapsPlacemark | null>(null)

  const [selectedCategories, setSelectedCategories] = useState<Set<string>>(
    new Set(),
  )
  const [view, setView] = useState<ViewState | null>(null)
  const [debouncedView, setDebouncedView] = useState<ViewState | null>(null)
  const [selectedSellerId, setSelectedSellerId] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [debouncedQuery, setDebouncedQuery] = useState('')
  const [focusedOfferId, setFocusedOfferId] = useState<string | null>(null)
  const [liveUserCoords, setLiveUserCoords] = useState<
    [number, number] | null
  >(null)
  const focusHandledRef = useRef(false)

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const targetOfferId = params.get('offer')
    if (targetOfferId) setFocusedOfferId(targetOfferId)
  }, [])

  const { data: user } = useUserMe()

  // Combine the cached telegram-known location with whatever the
  // LocateMeButton has surfaced. The live value wins when present.
  const userLocation = useMemo<[number, number] | null>(() => {
    if (liveUserCoords) return liveUserCoords
    const loc = user?.location
    if (!loc) return null
    if (!isValidLatLng(loc.lat, loc.lng)) return null
    return [loc.lat, loc.lng]
  }, [user, liveUserCoords])

  const initialCenter: [number, number] = userLocation ?? MINSK_CENTER

  // Use a ref to expose the latest setView to the map-once-init effect
  // without re-creating the map every time view changes.
  const onViewChangeRef = useRef(setView)
  useEffect(() => {
    onViewChangeRef.current = setView
  }, [])

  // Initialise the Yandex map once the API is loaded and the container
  // is mounted. Destroys on unmount.
  useEffect(() => {
    if (!api) return
    const container = containerRef.current
    if (!container) return

    ensureUserLocationStyle()

    const map = new api.Map(
      container,
      { center: initialCenter, zoom: INITIAL_ZOOM, controls: [] },
      { suppressMapOpenBlock: true },
    )

    const computeView = () => {
      try {
        const center = map.getCenter()
        const bounds = map.getBounds()
        // bounds = [[minLat, minLng], [maxLat, maxLng]] — north-east corner
        // is `bounds[1]`. Distance from center to NE = half the diagonal.
        const ne = bounds[1]
        const distMeters = api.coordSystem.geo.getDistance(center, ne)
        const radius = Math.min(
          MAX_RADIUS_KM,
          Math.max(MIN_RADIUS_KM, Math.round(distMeters / 1000)),
        )
        if (isValidLatLng(center[0], center[1])) {
          onViewChangeRef.current({
            lat: center[0],
            lng: center[1],
            radius_km: radius,
          })
        }
      } catch {
        // Ignore — map may not be fully laid out yet on first call.
      }
    }

    map.events.add('boundschange', computeView)
    // Schedule an initial compute after layout settles.
    const rafId = window.requestAnimationFrame(() => {
      map.container.fitToViewport()
      computeView()
    })

    mapRef.current = map

    return () => {
      window.cancelAnimationFrame(rafId)
      map.events.remove('boundschange', computeView)
      sellerMarkersRef.current.clear()
      userMarkerRef.current = null
      map.destroy()
      mapRef.current = null
    }
    // initialCenter is intentionally captured once on first init; later
    // recentering uses panTo. eslint-disable-next-line react-hooks/exhaustive-deps
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [api])

  // Debounce viewport changes before triggering the listings query.
  useEffect(() => {
    if (!view) return
    const t = window.setTimeout(() => setDebouncedView(view), DEBOUNCE_MS)
    return () => window.clearTimeout(t)
  }, [view])

  useEffect(() => {
    const t = window.setTimeout(() => setDebouncedQuery(searchQuery), 200)
    return () => window.clearTimeout(t)
  }, [searchQuery])

  const {
    data: listings,
    loading: listingsLoading,
    error: listingsError,
    refetch: refetchListings,
  } = useListings(
    debouncedView
      ? {
          lat: debouncedView.lat,
          lng: debouncedView.lng,
          radius_km: debouncedView.radius_km,
        }
      : null,
  )

  const visibleListings = useMemo(() => {
    if (!listings) return []
    const q = debouncedQuery.trim().toLowerCase()
    return listings.filter((l) => {
      if (!getPinCoords(l)) return false
      if (
        selectedCategories.size > 0 &&
        !selectedCategories.has(normalizeCategory(l.category))
      ) {
        return false
      }
      if (q) {
        const hit =
          l.title.toLowerCase().includes(q) ||
          l.seller_name.toLowerCase().includes(q)
        if (!hit) return false
      }
      return true
    })
  }, [listings, selectedCategories, debouncedQuery])

  // One pin per farm (group by seller_id). Backend sends the same
  // pin_* coords across all listings of one seller — first one wins.
  const sellerPins = useMemo<SellerPin[]>(() => {
    const seen = new Set<string>()
    const pins: SellerPin[] = []
    for (const l of visibleListings) {
      if (seen.has(l.seller_id)) continue
      const coords = getPinCoords(l)
      if (!coords) continue
      seen.add(l.seller_id)
      pins.push({
        sellerId: l.seller_id,
        sellerName: l.seller_name,
        coords,
        category: l.category,
        emoji: l.emoji,
      })
    }
    return pins
  }, [visibleListings])

  // Sync seller placemarks on the map whenever the desired set changes
  // or the active selection changes. We track each placemark + its
  // active-state to avoid rebuilding ones that haven't logically
  // changed.
  useEffect(() => {
    if (!api) return
    const map = mapRef.current
    if (!map) return
    const cache = sellerMarkersRef.current
    const desired = new Set<string>()

    for (const pin of sellerPins) {
      desired.add(pin.sellerId)
      const isActive = pin.sellerId === selectedSellerId
      const current = cache.get(pin.sellerId)
      if (current && current.active === isActive) continue

      if (current) {
        map.geoObjects.remove(current.pm)
      }

      const style = getCategoryStyle(pin.category)
      const emoji = pin.emoji ?? style.emoji
      const layout = makeFarmerIconLayout(api, style.color, emoji, isActive)
      const pm = new api.Placemark(
        pin.coords,
        {},
        {
          iconLayout: layout,
          iconShape: {
            type: 'Circle',
            coordinates: [0, 0],
            radius: isActive ? 22 : 18,
          },
          zIndex: isActive ? 1000 : 700,
        },
      )
      const sellerId = pin.sellerId
      const handleClick = () => {
        hapticFeedback.light()
        setSelectedSellerId(sellerId)
      }
      pm.events.add('click', handleClick)
      map.geoObjects.add(pm)
      cache.set(sellerId, { pm, active: isActive })
    }

    for (const [id, entry] of cache) {
      if (!desired.has(id)) {
        map.geoObjects.remove(entry.pm)
        cache.delete(id)
      }
    }
  }, [api, sellerPins, selectedSellerId])

  // Sync the user-location placemark (blue pulsing dot).
  useEffect(() => {
    if (!api) return
    const map = mapRef.current
    if (!map) return

    if (!userLocation) {
      if (userMarkerRef.current) {
        map.geoObjects.remove(userMarkerRef.current)
        userMarkerRef.current = null
      }
      return
    }

    const existing = userMarkerRef.current
    if (existing) {
      existing.geometry.setCoordinates(userLocation)
      return
    }

    const pm = new api.Placemark(
      userLocation,
      {},
      {
        iconLayout: makeUserLocationLayout(api),
        iconShape: { type: 'Circle', coordinates: [0, 0], radius: 8 },
        zIndex: 600,
      },
    )
    map.geoObjects.add(pm)
    userMarkerRef.current = pm
  }, [api, userLocation])

  // Recenter the map to the user when location first becomes known
  // (only on initial reveal — don't fight subsequent map panning by
  // the user).
  const didRecenterToUserRef = useRef(false)
  useEffect(() => {
    if (didRecenterToUserRef.current) return
    if (!api || !mapRef.current) return
    if (!userLocation) return
    didRecenterToUserRef.current = true
    void mapRef.current.panTo(userLocation, { duration: 300 })
  }, [api, userLocation])

  const availableCategories = useMemo<string[]>(() => {
    if (!listings) return []
    const set = new Set<string>()
    for (const l of listings) set.add(normalizeCategory(l.category))
    return Array.from(set).sort()
  }, [listings])

  const toggleCategory = (cat: string) => {
    setSelectedCategories((prev) => {
      const next = new Set(prev)
      if (next.has(cat)) next.delete(cat)
      else next.add(cat)
      return next
    })
  }

  const handleLocate = useCallback((coords: [number, number]) => {
    setLiveUserCoords(coords)
    const map = mapRef.current
    if (!map) return
    map.setCenter(coords, LOCATE_ZOOM, { duration: 300 })
  }, [])

  const showAllInMinsk = useCallback(() => {
    hapticFeedback.light()
    const map = mapRef.current
    if (!map) return
    map.setCenter(MINSK_CENTER, SHOW_ALL_MINSK_ZOOM, { duration: 300 })
  }, [])

  const closeSheet = useCallback(() => setSelectedSellerId(null), [])

  // Deep-link: if ?offer=<id> is set, fly to that seller's pin and open
  // the sheet once listings arrive.
  useEffect(() => {
    if (focusHandledRef.current) return
    if (!focusedOfferId) return
    if (!listings || listings.length === 0) return
    const target = listings.find((l) => l.id === focusedOfferId)
    if (!target) return
    focusHandledRef.current = true
    const targetCoords = getPinCoords(target)
    const map = mapRef.current
    if (map && targetCoords) {
      map.setCenter(targetCoords, FOCUS_ZOOM, { duration: 300 })
    }
    setSelectedSellerId(target.seller_id)
    const url = new URL(window.location.href)
    url.searchParams.delete('offer')
    window.history.replaceState({}, '', url.toString())
  }, [focusedOfferId, listings])

  const clearFocusedOffer = useCallback(() => setFocusedOfferId(null), [])

  if (mapError) {
    return (
      <div
        className="w-full h-full flex items-center justify-center"
        style={{ backgroundColor: 'var(--tg-bg)' }}
      >
        <ErrorState
          title="Не удалось загрузить карту"
          message="Не удалось загрузить карту, проверьте подключение."
          onRetry={() => window.location.reload()}
        />
      </div>
    )
  }

  return (
    <div className="relative w-full h-full" style={{ minHeight: 0 }}>
      <div ref={containerRef} className="absolute inset-0 w-full h-full" />

      {mapLoading && (
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

      {/* Floating status panel */}
      <div
        className="tg-shadow-md absolute z-[1000] left-3 right-3 rounded-xl"
        style={{
          top: 'calc(env(safe-area-inset-top, 0px) + 12px)',
          backgroundColor: 'var(--tg-bg)',
          padding: 12,
        }}
      >
        <SearchInput
          value={searchQuery}
          onChange={setSearchQuery}
          placeholder="Найти товар..."
        />
        <div className="mt-2 flex items-center justify-between gap-2 px-1">
          <h2
            className="font-medium"
            style={{ fontSize: 15, color: 'var(--tg-text)' }}
          >
            Фермеры рядом
          </h2>
          <span
            className="inline-flex items-center justify-center tabular-nums"
            style={{
              minWidth: 20,
              height: 20,
              padding: '0 6px',
              borderRadius: 10,
              backgroundColor: 'var(--tg-link)',
              color: '#ffffff',
              fontSize: 11,
              fontWeight: 500,
              lineHeight: 1,
            }}
          >
            {sellerPins.length}
          </span>
        </div>
        {availableCategories.length > 0 && (
          <div className="flex gap-2 overflow-x-auto -mx-3 px-3 mt-2 scrollbar-hide">
            {availableCategories.map((cat) => {
              const style = getCategoryStyle(cat)
              const active = selectedCategories.has(cat)
              return (
                <button
                  key={cat}
                  type="button"
                  onClick={() => toggleCategory(cat)}
                  className="flex items-center gap-1.5 rounded-full whitespace-nowrap active:opacity-70 active:scale-[0.97] transition"
                  style={{
                    padding: '6px 12px',
                    backgroundColor: active
                      ? 'var(--tg-link)'
                      : 'var(--tg-secondary-bg)',
                    color: active ? '#ffffff' : 'var(--tg-text)',
                    fontSize: 13,
                    transitionDuration: '150ms',
                  }}
                >
                  <span
                    style={{ fontSize: 14, lineHeight: 1 }}
                    aria-hidden="true"
                  >
                    {style.emoji}
                  </span>
                  <span>{style.label}</span>
                </button>
              )
            })}
          </div>
        )}
      </div>

      {debouncedQuery.trim() !== '' &&
        visibleListings.length === 0 &&
        !listingsLoading &&
        !listingsError && (
          <div
            className="tg-shadow-sm absolute left-1/2 -translate-x-1/2 z-[900] px-4 py-2 rounded-full text-center"
            style={{
              top: 'calc(env(safe-area-inset-top, 0px) + 200px)',
              maxWidth: 'calc(100% - 24px)',
              backgroundColor: 'var(--tg-bg)',
              color: 'var(--tg-text)',
              fontSize: 13,
              border: '1px solid var(--tg-hairline)',
            }}
          >
            Ничего не найдено по запросу «{debouncedQuery.trim()}»
          </div>
        )}

      {debouncedQuery.trim() === '' &&
        selectedCategories.size === 0 &&
        visibleListings.length === 0 &&
        !listingsLoading &&
        !listingsError &&
        debouncedView !== null && (
          <div
            className="tg-shadow-md absolute left-1/2 -translate-x-1/2 z-[900] rounded-xl text-center"
            style={{
              top: 'calc(env(safe-area-inset-top, 0px) + 200px)',
              width: 'calc(100% - 32px)',
              maxWidth: 320,
              backgroundColor: 'var(--tg-bg)',
              color: 'var(--tg-text)',
              padding: '16px 18px',
              border: '1px solid var(--tg-hairline)',
            }}
          >
            <div className="text-3xl mb-1" aria-hidden="true">
              🌾
            </div>
            <p
              className="font-medium"
              style={{ fontSize: 14, lineHeight: 1.35 }}
            >
              В этой зоне фермеров пока нет
            </p>
            <p
              className="mt-1"
              style={{ fontSize: 12, color: 'var(--tg-hint)', lineHeight: 1.4 }}
            >
              Попробуйте отдалить карту или показать всех фермеров Минска.
            </p>
            <button
              type="button"
              onClick={showAllInMinsk}
              className="mt-3 inline-flex items-center justify-center px-4 py-2 rounded-lg font-medium active:opacity-80 active:scale-[0.97] transition"
              style={{
                backgroundColor: 'var(--tg-button)',
                color: 'var(--tg-button-text)',
                fontSize: 13,
                transitionDuration: '150ms',
              }}
            >
              Показать всех в Минске
            </button>
          </div>
        )}

      <LocateMeButton onLocate={handleLocate} />

      {listingsLoading && !listingsError && (
        <div
          className="tg-shadow-sm absolute left-1/2 -translate-x-1/2 z-[900] px-4 py-2 rounded-full"
          style={{
            top: 'calc(env(safe-area-inset-top, 0px) + 120px)',
            backgroundColor: 'var(--tg-bg)',
            color: 'var(--tg-text)',
            fontSize: 13,
            border: '1px solid var(--tg-hairline)',
          }}
        >
          Загрузка…
        </div>
      )}

      {listingsError && listingsError.code !== 'unauthorized' && (
        <div
          className="tg-shadow-lg absolute bottom-4 inset-x-4 z-[1000] rounded-xl"
          style={{ backgroundColor: 'var(--tg-bg)' }}
        >
          <ErrorState
            title="Не удалось загрузить"
            message={listingsError.message}
            onRetry={refetchListings}
          />
        </div>
      )}

      {selectedSellerId !== null && (
        <FarmerSheet
          sellerId={selectedSellerId}
          listings={listings ?? []}
          onClose={closeSheet}
          focusedOfferId={focusedOfferId}
          onFocusHandled={clearFocusedOffer}
        />
      )}
    </div>
  )
}
