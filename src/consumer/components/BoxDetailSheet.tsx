import { Clock, MapPin, X } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { ApiError } from '../../api/client'
import { backButton, hapticFeedback } from '../../lib/telegram'
import { createBooking } from '../api'
import { coverGradient, coverImageUrl } from '../covers'
import {
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
 * Bottom sheet showing a single chef box. Layout, top to bottom:
 * 16:9 cover (gradient placeholder by cover_id, real image is a
 * progressive enhancement), venue name, address + distance, scarcity
 * line, description, pickup window, one full-width booking CTA.
 *
 * Booking outcomes:
 *  - 200 / 201 → onBookingSuccess(booking) — caller swaps to success sheet
 *  - 409       → onTransientError("Все слоты разобрали 😔") + close
 *  - other     → onTransientError("Ошибка, попробуй ещё раз")
 *
 * The CTA is disabled and re-labelled when submitting, sold out, or the
 * pickup window already closed (backstop for the gap before the 5-min
 * auto-expire sweep marks the box expired server-side).
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
  const [coverImgFailed, setCoverImgFailed] = useState(false)
  const touchStartY = useRef<number | null>(null)
  const closingRef = useRef(false)

  const isPickupExpired =
    !!box.pickup_window_end &&
    new Date(box.pickup_window_end).getTime() < Date.now()
  const isSoldOut = box.slots_left <= 0
  const cannotBook = isSoldOut || isPickupExpired

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

  const distanceLabel = formatDistanceKm(box.distance_km)
  const scarcityLabel =
    box.slots_left === 1
      ? 'Остался последний'
      : `Осталось ${box.slots_left} из ${box.slots_total}`

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
        aria-label={`Шеф-бокс — ${box.business_name}`}
        className="consumer-sheet tg-shadow-lg fixed inset-x-0 bottom-0 z-[1600] flex flex-col"
        style={{
          color: 'var(--tg-text)',
          maxHeight: '85vh',
          borderTopLeftRadius: 16,
          borderTopRightRadius: 16,
          transform: sheetTransform,
          transition: useTransition ? `transform ${ANIM_MS}ms ease-out` : 'none',
          paddingBottom: 'env(safe-area-inset-bottom, 0px)',
          overflow: 'hidden',
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

          {/* Cover — gradient placeholder, image is progressive enhancement */}
          <div
            className="relative mx-4 mt-1 rounded-2xl overflow-hidden"
            style={{
              aspectRatio: '16 / 9',
              background: coverGradient(box.cover_id),
            }}
          >
            {!coverImgFailed && (
              <img
                src={coverImageUrl(box.cover_id)}
                alt=""
                onError={() => setCoverImgFailed(true)}
                className="absolute inset-0 w-full h-full"
                style={{ objectFit: 'cover' }}
              />
            )}
            {coverImgFailed && (
              <span
                aria-hidden="true"
                className="absolute inset-0 flex items-center justify-center"
                style={{
                  fontSize: 52,
                  filter: 'drop-shadow(0 2px 6px rgba(0,0,0,0.35))',
                }}
              >
                👨‍🍳
              </span>
            )}
            <button
              type="button"
              onClick={close}
              disabled={submitting}
              aria-label="Закрыть"
              className="absolute top-2 right-2 rounded-full flex items-center justify-center active:opacity-60 active:scale-95 disabled:opacity-50 transition"
              style={{
                width: 32,
                height: 32,
                backgroundColor: 'rgba(0,0,0,0.45)',
                color: '#ffffff',
                transitionDuration: '150ms',
              }}
            >
              <X size={18} />
            </button>
          </div>
        </div>

        <div
          className="overflow-y-auto px-4 pt-3 pb-4 flex flex-col gap-3"
          style={{ WebkitOverflowScrolling: 'touch' }}
        >
          <div>
            <h2 className="font-bold leading-tight" style={{ fontSize: 21 }}>
              {box.business_name}
            </h2>
            <div className="mt-1 flex items-start gap-1.5">
              <MapPin
                size={14}
                aria-hidden="true"
                className="shrink-0 mt-0.5"
                style={{ color: 'var(--tg-hint)' }}
              />
              <p
                style={{
                  fontSize: 13,
                  color: 'var(--tg-hint)',
                  lineHeight: 1.4,
                }}
              >
                {box.address}
                {distanceLabel ? ` · ${distanceLabel}` : ''}
              </p>
            </div>
          </div>

          <p
            className="font-semibold"
            style={{
              fontSize: 15,
              color:
                box.slots_left === 1 ? '#f5a623' : 'var(--tg-accent-text)',
            }}
          >
            {scarcityLabel}
          </p>

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

          <div className="flex items-center gap-2">
            <Clock
              size={16}
              aria-hidden="true"
              className="shrink-0"
              style={{ color: 'var(--tg-hint)' }}
            />
            <p style={{ fontSize: 14, lineHeight: 1.4 }}>
              Забрать{' '}
              {formatPickupWindow(
                box.pickup_window_start,
                box.pickup_window_end,
              )}
            </p>
          </div>
        </div>

        <div
          className="px-4 pt-2 pb-4"
          style={{ borderTop: '1px solid var(--tg-hairline)' }}
        >
          <button
            type="button"
            onClick={handleBook}
            disabled={submitting || cannotBook}
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
              : isPickupExpired
                ? 'Срок выдачи прошёл'
                : isSoldOut
                  ? 'Все слоты разобрали'
                  : `Забронировать · ${formatPriceByn(box.price_byn)}`}
          </button>
        </div>
      </div>
    </>
  )
}
