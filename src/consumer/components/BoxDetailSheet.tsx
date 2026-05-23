import { Clock, MapPin, Package, X } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { ApiError } from '../../api/client'
import { backButton, hapticFeedback } from '../../lib/telegram'
import { createBooking } from '../api'
import {
  discountPercent,
  formatDistanceKm,
  formatPickupWindow,
  formatPriceByn,
} from '../format'
import type { ConsumerBooking, ConsumerBox } from '../types'

const ANIM_MS = 200
const SWIPE_CLOSE_THRESHOLD_PX = 100

interface Props {
  box: ConsumerBox
  onClose: () => void
  onBookingSuccess: (booking: ConsumerBooking) => void
  onTransientError: (message: string) => void
}

/**
 * Bottom sheet showing a single Mystery Box. Tapping the booking CTA
 * calls POST /consumer/bookings and surfaces three outcomes:
 *
 *  - 200 / 201 → onBookingSuccess(booking) — caller swaps to success sheet
 *  - 409       → onTransientError("Все слоты разобрали 😔") + close
 *  - other     → onTransientError("Ошибка, попробуй ещё раз")
 */
export default function BoxDetailSheet({
  box,
  onClose,
  onBookingSuccess,
  onTransientError,
}: Props) {
  const [mounted, setMounted] = useState(false)
  const [dragY, setDragY] = useState(0)
  const [submitting, setSubmitting] = useState(false)
  const touchStartY = useRef<number | null>(null)
  const closingRef = useRef(false)

  useEffect(() => {
    const id = window.requestAnimationFrame(() => setMounted(true))
    return () => window.cancelAnimationFrame(id)
  }, [])

  const close = () => {
    if (closingRef.current) return
    closingRef.current = true
    hapticFeedback.light()
    setMounted(false)
    window.setTimeout(onClose, ANIM_MS)
  }

  useEffect(() => {
    const handler = () => {
      if (closingRef.current) return
      closingRef.current = true
      setMounted(false)
      window.setTimeout(onClose, ANIM_MS)
    }
    backButton.show()
    backButton.onClick(handler)
    return () => {
      backButton.offClick(handler)
      backButton.hide()
    }
  }, [onClose])

  const handleTouchStart = (e: React.TouchEvent) => {
    const t = e.touches[0]
    if (!t) return
    touchStartY.current = t.clientY
  }

  const handleTouchMove = (e: React.TouchEvent) => {
    if (touchStartY.current === null) return
    const t = e.touches[0]
    if (!t) return
    const dy = t.clientY - touchStartY.current
    if (dy > 0) setDragY(dy)
  }

  const handleTouchEnd = () => {
    if (touchStartY.current === null) return
    touchStartY.current = null
    if (dragY > SWIPE_CLOSE_THRESHOLD_PX) {
      close()
    } else {
      setDragY(0)
    }
  }

  const handleBook = async () => {
    if (submitting) return
    hapticFeedback.medium()
    setSubmitting(true)
    try {
      const booking = await createBooking(box.id)
      hapticFeedback.success()
      onBookingSuccess(booking)
    } catch (err: unknown) {
      hapticFeedback.error()
      if (err instanceof ApiError && err.status === 409) {
        onTransientError('Все слоты разобрали 😔')
        close()
        return
      }
      onTransientError('Ошибка, попробуй ещё раз')
    } finally {
      setSubmitting(false)
    }
  }

  const sheetTransform = mounted
    ? `translateY(${dragY}px)`
    : 'translateY(100vh)'
  const useTransition = dragY === 0

  const title = box.title?.trim() || 'Mystery Box'
  const discount =
    box.original_price_byn != null
      ? discountPercent(box.price_byn, box.original_price_byn)
      : 0
  const distanceLabel = formatDistanceKm(box.distance_km)

  return (
    <>
      <div
        onClick={submitting ? undefined : close}
        className="fixed inset-0 z-[1500]"
        style={{
          backgroundColor: 'rgba(0,0,0,0.5)',
          opacity: mounted ? 1 : 0,
          transition: `opacity ${ANIM_MS}ms ease-out`,
        }}
        aria-hidden="true"
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-label={`${title} — ${box.business_name}`}
        className="consumer-sheet tg-shadow-lg fixed inset-x-0 bottom-0 z-[1600] flex flex-col"
        style={{
          color: 'var(--tg-text)',
          maxHeight: '85vh',
          borderTopLeftRadius: 16,
          borderTopRightRadius: 16,
          transform: sheetTransform,
          transition: useTransition ? `transform ${ANIM_MS}ms ease-out` : 'none',
          paddingBottom: 'env(safe-area-inset-bottom, 0px)',
        }}
      >
        <div
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
          onTouchCancel={handleTouchEnd}
          style={{ touchAction: 'none' }}
        >
          <div className="flex justify-center pt-2 pb-1">
            <div
              style={{
                width: 36,
                height: 4,
                borderRadius: 2,
                backgroundColor: 'var(--tg-hint)',
                opacity: 0.3,
              }}
            />
          </div>
          <div className="flex items-start gap-3 px-4 pt-2 pb-3">
            <div className="min-w-0 flex-1">
              <h2
                className="font-semibold leading-tight"
                style={{ fontSize: 18 }}
              >
                🎁 {title}
              </h2>
              <p
                className="mt-1 truncate"
                style={{ fontSize: 14, color: 'var(--tg-text)' }}
              >
                {box.business_name}
              </p>
            </div>
            <button
              type="button"
              onClick={close}
              disabled={submitting}
              aria-label="Закрыть"
              className="shrink-0 rounded-full flex items-center justify-center active:opacity-60 active:scale-95 disabled:opacity-50 transition"
              style={{
                width: 32,
                height: 32,
                backgroundColor: 'var(--tg-secondary-bg)',
                color: 'var(--tg-text)',
                transitionDuration: '150ms',
              }}
            >
              <X size={20} />
            </button>
          </div>
          <div
            className="mx-4"
            style={{ height: 1, backgroundColor: 'var(--tg-hairline)' }}
          />
        </div>

        <div
          className="overflow-y-auto px-4 pt-3 pb-4 flex flex-col gap-3"
          style={{ WebkitOverflowScrolling: 'touch' }}
        >
          <div className="flex items-baseline gap-2">
            <span
              className="font-bold tabular-nums"
              style={{ fontSize: 28, color: 'var(--tg-accent-text)' }}
            >
              {formatPriceByn(box.price_byn)}
            </span>
            {box.original_price_byn != null && discount > 0 && (
              <>
                <span
                  className="tabular-nums"
                  style={{
                    fontSize: 15,
                    color: 'var(--tg-hint)',
                    textDecoration: 'line-through',
                  }}
                >
                  {formatPriceByn(box.original_price_byn)}
                </span>
                <span
                  className="inline-flex items-center rounded-full font-semibold"
                  style={{
                    padding: '2px 8px',
                    fontSize: 12,
                    backgroundColor: 'rgba(239, 68, 68, 0.12)',
                    color: '#dc2626',
                  }}
                >
                  -{discount}%
                </span>
              </>
            )}
          </div>

          <InfoRow
            icon={<MapPin size={16} aria-hidden="true" />}
            primary={box.address}
            secondary={distanceLabel || undefined}
          />
          <InfoRow
            icon={<Clock size={16} aria-hidden="true" />}
            primary={formatPickupWindow(
              box.pickup_window_start,
              box.pickup_window_end,
            )}
          />
          <InfoRow
            icon={<Package size={16} aria-hidden="true" />}
            primary={`Осталось: ${box.slots_left} из ${box.slots_total}`}
          />

          {box.description && (
            <p
              className="rounded-xl"
              style={{
                padding: 12,
                backgroundColor: 'var(--tg-secondary-bg)',
                color: 'var(--tg-text)',
                fontSize: 14,
                lineHeight: 1.45,
              }}
            >
              {box.description}
            </p>
          )}
        </div>

        <div
          className="px-4 pt-2 pb-4"
          style={{ borderTop: '1px solid var(--tg-hairline)' }}
        >
          <button
            type="button"
            onClick={handleBook}
            disabled={submitting || box.slots_left <= 0}
            aria-busy={submitting}
            className="w-full py-3 rounded-lg font-semibold active:opacity-80 active:scale-[0.99] disabled:opacity-50 transition"
            style={{
              backgroundColor: 'var(--tg-button)',
              color: 'var(--tg-button-text)',
              fontSize: 15,
              transitionDuration: '150ms',
            }}
          >
            {submitting
              ? 'Бронируем…'
              : box.slots_left <= 0
                ? 'Все слоты разобрали'
                : `Забронировать за ${formatPriceByn(box.price_byn)}`}
          </button>
        </div>
      </div>
    </>
  )
}

function InfoRow({
  icon,
  primary,
  secondary,
}: {
  icon: React.ReactNode
  primary: string
  secondary?: string
}) {
  return (
    <div className="flex items-start gap-2">
      <span
        className="shrink-0 mt-0.5"
        style={{ color: 'var(--tg-hint)' }}
        aria-hidden="true"
      >
        {icon}
      </span>
      <div className="min-w-0 flex-1">
        <p style={{ fontSize: 14, color: 'var(--tg-text)', lineHeight: 1.4 }}>
          {primary}
        </p>
        {secondary && (
          <p
            className="mt-0.5"
            style={{ fontSize: 12, color: 'var(--tg-hint)', lineHeight: 1.35 }}
          >
            {secondary}
          </p>
        )}
      </div>
    </div>
  )
}
