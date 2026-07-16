import { useEffect, useRef, useState } from 'react'
import { coverGradient } from '../consumer/covers'
import { formatPickupWindow, formatPriceByn } from '../consumer/format'
import { useYandexMapsLoader } from '../lib/yandexMaps'
import { makeBoxIconLayout } from '../shared/boxPins'
import { fetchPublicBoxes, type PublicBox } from './api'
import { useBookingFlow } from './BookingFlow'
import { boxDeepLink, CONSUMER_BOT_URL, PALETTE } from './branding'

const MINSK_CENTER: [number, number] = [53.902, 27.561]
const MAP_ZOOM = 12

/**
 * Live read-only storefront (#boxes). Cards reuse the consumer cover
 * gradients and formatters; pins come from the shared layout so the
 * public map matches the mini-app. No geolocation prompt — the whole
 * city is shown from the Minsk centre. Booking is a Telegram deep link.
 *
 * The map mounts lazily (IntersectionObserver) so the landing stays
 * light until the visitor actually scrolls to the storefront.
 */
export default function StorefrontSection() {
  const { start: startBooking, modal: bookingModal } = useBookingFlow()
  const [boxes, setBoxes] = useState<PublicBox[] | null>(null)
  const [failed, setFailed] = useState(false)
  const [mapWanted, setMapWanted] = useState(false)
  const sectionRef = useRef<HTMLElement | null>(null)

  useEffect(() => {
    let cancelled = false
    fetchPublicBoxes()
      .then((items) => {
        if (!cancelled) setBoxes(items)
      })
      .catch(() => {
        if (!cancelled) setFailed(true)
      })
    return () => {
      cancelled = true
    }
  }, [])

  useEffect(() => {
    const el = sectionRef.current
    if (!el || typeof IntersectionObserver === 'undefined') {
      setMapWanted(true)
      return
    }
    const io = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          setMapWanted(true)
          io.disconnect()
        }
      },
      { rootMargin: '400px' },
    )
    io.observe(el)
    return () => io.disconnect()
  }, [])

  const empty = !failed && boxes !== null && boxes.length === 0

  return (
    <section
      id="boxes"
      ref={sectionRef}
      className="px-5 py-12 mx-auto w-full"
      style={{ maxWidth: 680, scrollMarginTop: 16 }}
    >
      <h2 className="font-bold text-center" style={{ fontSize: 24 }}>
        Боксы сегодня
      </h2>

      {mapWanted && !!boxes?.length && <StorefrontMap boxes={boxes} />}

      {boxes === null && !failed && (
        <p
          className="mt-6 text-center"
          style={{ fontSize: 14, color: PALETTE.textMuted }}
        >
          Загружаем…
        </p>
      )}

      {(empty || failed) && (
        <div className="mt-6 text-center">
          <p style={{ fontSize: 15, color: PALETTE.textMuted }}>
            Боксы появляются к вечеру
          </p>
          <a
            href={CONSUMER_BOT_URL}
            className="inline-block mt-4 px-6 py-3 rounded-xl font-semibold active:opacity-80 transition"
            style={{
              backgroundColor: PALETTE.gold,
              color: '#171310',
              fontSize: 15,
              transitionDuration: '150ms',
            }}
          >
            Открыть в Telegram
          </a>
        </div>
      )}

      {!!boxes?.length && (
        <div className="mt-6 flex flex-col gap-4">
          {boxes.map((box) => (
            <PublicBoxCard key={box.id} box={box} onBook={startBooking} />
          ))}
        </div>
      )}

      {bookingModal}
    </section>
  )
}

function StorefrontMap({ boxes }: { boxes: PublicBox[] }) {
  const { api } = useYandexMapsLoader()
  const containerRef = useRef<HTMLDivElement | null>(null)
  const mapRef = useRef<YMapsMap | null>(null)

  useEffect(() => {
    if (!api) return
    const container = containerRef.current
    if (!container) return
    const map = new api.Map(
      container,
      { center: MINSK_CENTER, zoom: MAP_ZOOM, controls: [] },
      { suppressMapOpenBlock: true },
    )
    mapRef.current = map
    for (const box of boxes) {
      const loc = box.business_location
      if (!loc) continue
      const pm = new api.Placemark(
        [loc.lat, loc.lng],
        {},
        {
          iconLayout: makeBoxIconLayout(
            api,
            box.price_byn,
            box.slots_left,
            false,
          ),
          iconShape: {
            type: 'Rectangle',
            coordinates: [
              [-40, -16],
              [40, 16],
            ],
          },
          zIndex: 700,
        },
      )
      pm.events.add('click', () => {
        document
          .getElementById(`box-${box.id}`)
          ?.scrollIntoView({ behavior: 'smooth', block: 'center' })
      })
      map.geoObjects.add(pm)
    }
    return () => {
      map.destroy()
      mapRef.current = null
    }
  }, [api, boxes])

  // The loader rejects without a configured API key — in that case the
  // section silently degrades to the card list.
  if (!api) return null

  return (
    <div
      ref={containerRef}
      className="mt-6 w-full rounded-2xl overflow-hidden"
      style={{
        height: 320,
        border: `1px solid ${PALETTE.hairline}`,
        backgroundColor: PALETTE.bgElevated,
      }}
    />
  )
}

function PublicBoxCard({
  box,
  onBook,
}: {
  box: PublicBox
  onBook: (boxId: string) => void
}) {
  const scarcity =
    box.slots_left === 1
      ? 'Остался последний'
      : `Осталось ${box.slots_left} из ${box.slots_total}`
  return (
    <article
      id={`box-${box.id}`}
      className="rounded-2xl overflow-hidden"
      style={{
        backgroundColor: PALETTE.bgElevated,
        border: `1px solid ${PALETTE.hairline}`,
      }}
    >
      <div
        className="relative flex items-center justify-center"
        style={{
          aspectRatio: '16 / 6',
          background: coverGradient(box.cover_id),
        }}
      >
        <span
          aria-hidden="true"
          style={{
            fontSize: 40,
            filter: 'drop-shadow(0 2px 6px rgba(0,0,0,0.35))',
          }}
        >
          👨‍🍳
        </span>
      </div>
      <div className="px-4 pt-3 pb-4">
        <div className="flex items-baseline justify-between gap-3">
          <h3 className="font-bold min-w-0 truncate" style={{ fontSize: 17 }}>
            {box.business_name}
          </h3>
          <span
            className="shrink-0 font-bold tabular-nums"
            style={{ fontSize: 17, color: PALETTE.gold }}
          >
            {formatPriceByn(box.price_byn)}
          </span>
        </div>
        <p
          className="mt-0.5 truncate"
          style={{ fontSize: 13, color: PALETTE.textMuted }}
        >
          {box.address}
        </p>
        <p
          className="mt-2 font-semibold"
          style={{
            fontSize: 14,
            color: box.slots_left === 1 ? PALETTE.gold : PALETTE.text,
          }}
        >
          {scarcity}
          <span
            className="font-normal"
            style={{ color: PALETTE.textMuted }}
          >
            {' · '}
            {formatPickupWindow(
              box.pickup_window_start,
              box.pickup_window_end,
            )}
          </span>
        </p>
        <button
          type="button"
          onClick={() => onBook(box.id)}
          className="block w-full mt-3 py-3 rounded-xl font-semibold text-center active:opacity-80 transition"
          style={{
            backgroundColor: PALETTE.gold,
            color: '#171310',
            fontSize: 15,
            transitionDuration: '150ms',
          }}
        >
          Забронировать
        </button>
        <a
          href={boxDeepLink(box.id)}
          className="block mt-2 text-center"
          style={{ fontSize: 13, color: PALETTE.textMuted, textDecoration: 'underline' }}
        >
          или в Telegram
        </a>
      </div>
    </article>
  )
}
