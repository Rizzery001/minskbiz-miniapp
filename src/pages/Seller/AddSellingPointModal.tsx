import { X } from 'lucide-react'
import { Suspense, lazy, useCallback, useEffect, useState } from 'react'
import { ApiError, apiPost } from '../../api/client'
import type {
  GeocodeResult,
  SellingPoint,
  SellingPointCreatePayload,
} from '../../api/types'
import { backButton, hapticFeedback } from '../../lib/telegram'
import AddressSearch from './AddressSearch'

const LocationPicker = lazy(() => import('./LocationPicker'))

interface Props {
  onClose: () => void
  onCreated: (created: SellingPoint) => void
}

function formatCoord(n: number): string {
  return n.toFixed(5)
}

export default function AddSellingPointModal({ onClose, onCreated }: Props) {
  const [label, setLabel] = useState('')
  const [address, setAddress] = useState('')
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null)
  const [schedule, setSchedule] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const close = useCallback(() => {
    if (submitting) return
    onClose()
  }, [onClose, submitting])

  // BackButton — close the modal first instead of leaving the cabinet.
  useEffect(() => {
    backButton.show()
    backButton.onClick(close)
    return () => {
      backButton.offClick(close)
      // Cabinet manages its own back button state; just hide for safety.
      backButton.hide()
    }
  }, [close])

  // Lock body scroll while the modal is open.
  useEffect(() => {
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = prev
    }
  }, [])

  const handlePick = (res: GeocodeResult) => {
    setAddress(res.label)
    setCoords({ lat: res.lat, lng: res.lng })
  }

  const handleMapDrag = (lat: number, lng: number) => {
    setCoords({ lat, lng })
  }

  const trimmedLabel = label.trim()
  const canSubmit =
    trimmedLabel.length > 0 && coords !== null && !submitting

  const handleSubmit = async () => {
    if (!canSubmit || !coords) return
    setSubmitting(true)
    setError(null)
    hapticFeedback.medium()
    const payload: SellingPointCreatePayload = {
      label: trimmedLabel,
      lat: coords.lat,
      lng: coords.lng,
    }
    const addr = address.trim()
    if (addr) payload.address = addr
    const sched = schedule.trim()
    if (sched) payload.schedule = sched
    try {
      const created = await apiPost<SellingPoint>('/me/selling-points', payload)
      hapticFeedback.success()
      onCreated(created)
    } catch (err: unknown) {
      hapticFeedback.error()
      const message =
        err instanceof ApiError
          ? `${err.message}${err.code ? ` (${err.code})` : ''}`
          : 'Не удалось добавить точку. Попробуйте ещё раз.'
      setError(message)
      setSubmitting(false)
    }
  }

  return (
    <>
      <div
        onClick={close}
        className="fixed inset-0 z-[1700]"
        style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}
        aria-hidden="true"
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Новое место продажи"
        className="fixed inset-x-0 bottom-0 z-[1800] flex flex-col tg-shadow-lg"
        style={{
          backgroundColor: 'var(--tg-bg)',
          color: 'var(--tg-text)',
          maxHeight: '92vh',
          borderTopLeftRadius: 16,
          borderTopRightRadius: 16,
          paddingBottom: 'env(safe-area-inset-bottom, 0px)',
        }}
      >
        <header className="flex items-center justify-between px-4 pt-4 pb-3">
          <h2 className="font-semibold" style={{ fontSize: 17 }}>
            Новое место продажи
          </h2>
          <button
            type="button"
            onClick={close}
            aria-label="Закрыть"
            disabled={submitting}
            className="shrink-0 rounded-full flex items-center justify-center active:opacity-60 disabled:opacity-40 transition"
            style={{
              width: 32,
              height: 32,
              backgroundColor: 'var(--tg-secondary-bg)',
              color: 'var(--tg-text)',
              transitionDuration: '150ms',
            }}
          >
            <X size={18} />
          </button>
        </header>

        <div
          className="flex-1 overflow-y-auto px-4 pb-4 flex flex-col gap-4"
          style={{ WebkitOverflowScrolling: 'touch' }}
        >
          <Field label="Название">
            <input
              type="text"
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              placeholder="Например, Комаровский рынок"
              className="w-full rounded-lg px-3 py-3 outline-none"
              style={{
                backgroundColor: 'var(--tg-secondary-bg)',
                color: 'var(--tg-text)',
                fontSize: 15,
                border: '1px solid var(--tg-hairline)',
              }}
            />
          </Field>

          <Field label="Адрес">
            <AddressSearch onPick={handlePick} />
          </Field>

          {coords && (
            <Field label="Точка на карте">
              <Suspense
                fallback={
                  <div
                    className="rounded-xl"
                    style={{
                      height: 320,
                      backgroundColor: 'var(--tg-secondary-bg)',
                    }}
                  />
                }
              >
                <LocationPicker
                  lat={coords.lat}
                  lng={coords.lng}
                  onChange={handleMapDrag}
                />
              </Suspense>
              <p
                className="mt-2 tabular-nums"
                style={{ fontSize: 12, color: 'var(--tg-hint)' }}
              >
                {formatCoord(coords.lat)}, {formatCoord(coords.lng)} ·
                перетащите маркер для точной корректировки.
              </p>
            </Field>
          )}

          <Field label="Расписание (необязательно)">
            <input
              type="text"
              value={schedule}
              onChange={(e) => setSchedule(e.target.value)}
              placeholder="Сб-Вс 8:00–15:00"
              className="w-full rounded-lg px-3 py-3 outline-none"
              style={{
                backgroundColor: 'var(--tg-secondary-bg)',
                color: 'var(--tg-text)',
                fontSize: 15,
                border: '1px solid var(--tg-hairline)',
              }}
            />
          </Field>

          {error && (
            <div
              className="rounded-lg p-3"
              style={{
                backgroundColor: 'rgba(239,68,68,0.1)',
                color: 'var(--tg-destructive-text, #ff3b30)',
                fontSize: 14,
              }}
            >
              {error}
            </div>
          )}
        </div>

        <div
          className="px-4 pt-3 pb-4"
          style={{ borderTop: '1px solid var(--tg-hairline)' }}
        >
          <button
            type="button"
            onClick={handleSubmit}
            disabled={!canSubmit}
            className="w-full py-4 rounded-xl font-medium active:opacity-80 active:scale-[0.98] disabled:opacity-50 transition"
            style={{
              backgroundColor: 'var(--tg-button)',
              color: 'var(--tg-button-text)',
              fontSize: 16,
              transitionDuration: '150ms',
            }}
          >
            {submitting ? 'Сохраняем…' : 'Сохранить'}
          </button>
          {!canSubmit && !submitting && (
            <p
              className="text-center mt-2"
              style={{ fontSize: 12, color: 'var(--tg-hint)' }}
            >
              Укажите название и найдите адрес на карте.
            </p>
          )}
        </div>
      </div>
    </>
  )
}

function Field({
  label,
  children,
}: {
  label: string
  children: React.ReactNode
}) {
  return (
    <div>
      <label
        className="block mb-1 font-medium"
        style={{ fontSize: 13, color: 'var(--tg-hint)' }}
      >
        {label}
      </label>
      {children}
    </div>
  )
}
