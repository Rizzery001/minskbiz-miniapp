/**
 * Booking ticket presentation, shared by the mini-app BookingsScreen
 * and the plenty.by web cabinet. Styled with --tg-* vars: inside
 * Telegram they come from the theme, on the web the cabinet container
 * scopes a dark override (src/public/tgDarkVars.ts).
 */

import { Check, Navigation } from 'lucide-react'
import { formatPickupWindow, formatPriceByn } from '../consumer/format'
import type { ConsumerBooking } from '../consumer/types'

export function formatCountdown(endIso: string, nowMs: number): string {
  const end = new Date(endIso).getTime()
  if (!Number.isFinite(end)) return ''
  const left = end - nowMs
  if (left <= 0) return 'Окно выдачи истекло'
  const totalMin = Math.ceil(left / 60_000)
  const h = Math.floor(totalMin / 60)
  const m = totalMin % 60
  if (h > 0) return `осталось ${h} ч ${m} мин`
  return `осталось ${m} мин`
}

export function routeUrl(address: string): string {
  return `https://yandex.by/maps/?text=${encodeURIComponent(address)}`
}

export function ActiveBookingCard({
  booking,
  nowMs,
  onCancel,
}: {
  booking: ConsumerBooking
  nowMs: number
  onCancel: () => void
}) {
  const countdown = formatCountdown(booking.pickup_window_end, nowMs)
  const expired = countdown === 'Окно выдачи истекло'
  return (
    <article
      className="rounded-2xl"
      style={{
        padding: 14,
        backgroundColor: 'var(--tg-secondary-bg)',
        border: '1px solid var(--tg-hairline)',
      }}
    >
      <div
        className="flex items-center justify-center rounded-xl"
        style={{
          padding: '12px 8px',
          backgroundColor: 'var(--tg-bg)',
          border: '1px solid var(--tg-hairline)',
        }}
      >
        <span
          className="tabular-nums"
          style={{
            fontFamily:
              '"SF Mono", ui-monospace, Menlo, Consolas, monospace',
            fontSize: 28,
            fontWeight: 700,
            letterSpacing: '0.16em',
            color: 'var(--tg-text)',
          }}
        >
          {booking.code}
        </span>
      </div>

      <p
        className="mt-1.5 text-center"
        style={{ fontSize: 12, color: 'var(--tg-hint)' }}
      >
        Покажи код при получении
      </p>

      <div className="mt-3 flex flex-col gap-1">
        <p className="font-semibold" style={{ fontSize: 16, lineHeight: 1.3 }}>
          {booking.box.business_name}
        </p>
        <p style={{ fontSize: 13, color: 'var(--tg-text)', lineHeight: 1.4 }}>
          🕐{' '}
          {formatPickupWindow(
            booking.pickup_window_start,
            booking.pickup_window_end,
          )}
          {' · '}
          <span
            className="font-medium"
            style={{ color: expired ? 'var(--tg-hint)' : '#f5a623' }}
          >
            {countdown}
          </span>
        </p>
        <p
          style={{ fontSize: 13, color: 'var(--tg-hint)', lineHeight: 1.4 }}
        >
          {booking.box.address}
        </p>
        <p
          className="font-semibold tabular-nums"
          style={{ fontSize: 13, color: 'var(--tg-accent-text)' }}
        >
          {formatPriceByn(booking.box.price_byn)}
        </p>
      </div>

      <div className="mt-3 flex gap-2">
        <a
          href={routeUrl(booking.box.address)}
          target="_blank"
          rel="noreferrer"
          className="flex-1 inline-flex items-center justify-center gap-1.5 py-2.5 rounded-lg font-medium active:opacity-80 transition"
          style={{
            backgroundColor: 'var(--tg-secondary-bg)',
            color: 'var(--tg-text)',
            fontSize: 13,
            transitionDuration: '150ms',
          }}
        >
          <Navigation size={14} aria-hidden="true" />
          <span>Маршрут</span>
        </a>
        <button
          type="button"
          onClick={onCancel}
          className="flex-1 py-2.5 rounded-lg font-medium active:opacity-70 transition"
          style={{
            backgroundColor: 'transparent',
            color: 'var(--tg-destructive-text, #ff3b30)',
            border: '1px solid var(--tg-hairline)',
            fontSize: 13,
            transitionDuration: '150ms',
          }}
        >
          Отменить
        </button>
      </div>
    </article>
  )
}

export function HistoryBookingRow({ booking }: { booking: ConsumerBooking }) {
  const label = STATUS_LABELS[booking.status] ?? booking.status
  const pickedUp = booking.status === 'picked_up'
  const cancelled = booking.status === 'cancelled'
  return (
    <div
      className="rounded-xl"
      style={{
        padding: '10px 12px',
        backgroundColor: 'var(--tg-secondary-bg)',
        opacity: cancelled ? 0.6 : 0.85,
      }}
    >
      <div className="flex items-baseline justify-between gap-2">
        <span
          className="font-medium truncate"
          style={{
            fontSize: 13,
            color: cancelled ? 'var(--tg-hint)' : 'var(--tg-text)',
          }}
        >
          {booking.box.business_name}
        </span>
        <span
          className="shrink-0 inline-flex items-center gap-1"
          style={{
            fontSize: 11,
            color: pickedUp ? '#34c759' : 'var(--tg-hint)',
          }}
        >
          {pickedUp && <Check size={12} aria-hidden="true" />}
          {label}
        </span>
      </div>
      <div
        className="mt-0.5 truncate"
        style={{ fontSize: 12, color: 'var(--tg-hint)' }}
      >
        {booking.box.address} · код {booking.code}
      </div>
    </div>
  )
}

export const STATUS_LABELS: Record<string, string> = {
  picked_up: 'Получено',
  expired: 'Истекло',
  cancelled: 'Отменено',
}
