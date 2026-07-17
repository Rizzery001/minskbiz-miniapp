import { useEffect, useRef, useState } from 'react'
import { coverGradient } from '../consumer/covers'
import { formatPickupWindow, formatPriceByn } from '../consumer/format'
import { useYandexMapsLoader } from '../lib/yandexMaps'
import { makeBoxIconLayout } from '../shared/boxPins'
import Reveal from './Reveal'
import { fetchPublicBoxes, type PublicBox } from './api'
import { useBookingFlow } from './BookingFlow'
import { boxDeepLink, CONSUMER_BOT_URL, PALETTE } from './branding'

const MINSK_CENTER: [number, number] = [53.902, 27.561]
const MAP_ZOOM = 12

/**
 * Live storefront (#boxes): map + a responsive card grid. Cards carry
 * the cover art with grain, a price pill, venue avatar, scarcity meter
 * and the on-site booking CTA. No geolocation prompt — whole city.
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
      className="px-5 py-16 mx-auto w-full"
      style={{ maxWidth: 1080, scrollMarginTop: 56 }}
    >
      <Reveal>
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="p-kicker flex items-center gap-2">
              <span className="p-live" aria-hidden="true" />
              Сегодня вечером
            </p>
            <h2
              className="p-display mt-3"
              style={{ fontSize: 'clamp(28px, 4.5vw, 44px)' }}
            >
              Боксы на карте
            </h2>
          </div>
          {!!boxes?.length && (
            <p style={{ fontSize: 14, color: PALETTE.textMuted }}>
              {boxes.length}{' '}
              {plural(boxes.length, 'бокс', 'бокса', 'боксов')} · Минск
            </p>
          )}
        </div>
      </Reveal>

      {mapWanted && !!boxes?.length && <StorefrontMap boxes={boxes} />}

      {boxes === null && !failed && (
        <div className="mt-8 grid gap-4 sm:grid-cols-2">
          {[0, 1].map((i) => (
            <div
              key={i}
              className="rounded-2xl"
              style={{
                height: 220,
                background:
                  'linear-gradient(100deg, #1c1917 40%, #232019 50%, #1c1917 60%)',
                backgroundSize: '200% 100%',
                animation: 'p-marquee 1.6s linear infinite',
              }}
            />
          ))}
        </div>
      )}

      {(empty || failed) && (
        <Reveal>
          <div
            className="mt-8 rounded-3xl px-6 py-12 text-center"
            style={{
              border: `1px dashed ${PALETTE.hairline}`,
            }}
          >
            <div style={{ fontSize: 40 }} aria-hidden="true">
              🌙
            </div>
            <p className="mt-3 font-bold" style={{ fontSize: 18 }}>
              Боксы появляются к вечеру
            </p>
            <p className="mt-1" style={{ fontSize: 14, color: PALETTE.textMuted }}>
              Загляни после 17:00 — или включи уведомления в боте
            </p>
            <a
              href={CONSUMER_BOT_URL}
              className="p-pill p-pill-gold mt-6 px-7"
              style={{ height: 48, fontSize: 15 }}
            >
              Открыть в Telegram
            </a>
          </div>
        </Reveal>
      )}

      {!!boxes?.length && (
        <div className="mt-8 grid gap-4 sm:grid-cols-2">
          {boxes.map((box, i) => (
            <Reveal key={box.id} delay={Math.min(i * 80, 240)}>
              <PublicBoxCard box={box} onBook={startBooking} />
            </Reveal>
          ))}
        </div>
      )}

      {bookingModal}
    </section>
  )
}

function plural(n: number, one: string, few: string, many: string): string {
  const mod10 = n % 10
  const mod100 = n % 100
  if (mod10 === 1 && mod100 !== 11) return one
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14)) return few
  return many
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

  if (!api) return null

  return (
    <div
      ref={containerRef}
      className="mt-8 w-full rounded-3xl overflow-hidden"
      style={{
        height: 340,
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
  const lastOne = box.slots_left === 1
  const ratio =
    box.slots_total > 0
      ? Math.max(0.06, Math.min(1, box.slots_left / box.slots_total))
      : 0
  return (
    <article id={`box-${box.id}`} className="p-card overflow-hidden flex flex-col">
      <div
        className="p-grain relative"
        style={{ aspectRatio: '16 / 7', background: coverGradient(box.cover_id) }}
      >
        <span
          className="absolute flex items-center justify-center"
          style={{ inset: 0, fontSize: 44, filter: 'drop-shadow(0 2px 8px rgba(0,0,0,0.4))' }}
          aria-hidden="true"
        >
          👨‍🍳
        </span>
        <span
          className="absolute rounded-full px-3 py-1.5 font-bold tabular-nums"
          style={{
            top: 10,
            right: 10,
            fontSize: 14,
            backgroundColor: 'rgba(18, 17, 16, 0.8)',
            color: PALETTE.gold,
            backdropFilter: 'blur(4px)',
          }}
        >
          {formatPriceByn(box.price_byn)}
        </span>
        {lastOne && (
          <span
            className="absolute rounded-full px-3 py-1.5 font-bold"
            style={{
              top: 10,
              left: 10,
              fontSize: 12,
              background: 'linear-gradient(180deg, #f6b83e, #ef9d0e)',
              color: '#171310',
            }}
          >
            Остался последний
          </span>
        )}
      </div>

      <div className="flex-1 flex flex-col px-5 pt-4 pb-5">
        <div className="flex items-center gap-3">
          <span
            className="shrink-0 flex items-center justify-center rounded-full font-bold"
            style={{
              width: 36,
              height: 36,
              fontSize: 15,
              background: 'rgba(245, 166, 35, 0.15)',
              color: PALETTE.gold,
            }}
            aria-hidden="true"
          >
            {box.business_name.trim().charAt(0).toUpperCase()}
          </span>
          <div className="min-w-0">
            <h3 className="font-bold truncate" style={{ fontSize: 17 }}>
              {box.business_name}
            </h3>
            <p className="truncate" style={{ fontSize: 12.5, color: PALETTE.textMuted }}>
              {box.address}
            </p>
          </div>
        </div>

        <div className="mt-4">
          <div
            className="flex items-baseline justify-between"
            style={{ fontSize: 13 }}
          >
            <span
              className="font-semibold"
              style={{ color: lastOne ? PALETTE.gold : PALETTE.text }}
            >
              {lastOne
                ? 'Остался последний'
                : `Осталось ${box.slots_left} из ${box.slots_total}`}
            </span>
            <span style={{ color: PALETTE.textMuted }}>
              🕐 {formatPickupWindow(box.pickup_window_start, box.pickup_window_end)}
            </span>
          </div>
          <div className="p-meter mt-2" aria-hidden="true">
            <span style={{ width: `${ratio * 100}%` }} />
          </div>
        </div>

        <div className="mt-auto pt-4">
          <button
            type="button"
            onClick={() => onBook(box.id)}
            className="p-pill p-pill-gold w-full"
            style={{ height: 48, fontSize: 15 }}
          >
            Забронировать
          </button>
          <a
            href={boxDeepLink(box.id)}
            className="block mt-2 text-center"
            style={{ fontSize: 12.5, color: PALETTE.textMuted, textDecoration: 'underline' }}
          >
            или в Telegram
          </a>
        </div>
      </div>
    </article>
  )
}
