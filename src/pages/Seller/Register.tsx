import { ChevronLeft, MapPin } from 'lucide-react'
import { lazy, Suspense, useCallback, useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ApiError, apiPost } from '../../api/client'
import type {
  SellerCategory,
  SellerCreatePayload,
  SellerCreateResponse,
} from '../../api/types'
import { backButton, hapticFeedback } from '../../lib/telegram'
import { SELLER_CATEGORIES } from './categories'
import { isPhoneValid, normalizePhone } from './phone'

const LocationPicker = lazy(() => import('./LocationPicker'))

interface Coords {
  lat: number
  lng: number
}

function formatCoord(n: number): string {
  return n.toFixed(5)
}

export default function SellerRegister() {
  const navigate = useNavigate()
  const [name, setName] = useState('')
  const [category, setCategory] = useState<SellerCategory | null>(null)
  const [coords, setCoords] = useState<Coords | null>(null)
  const [locationLabel, setLocationLabel] = useState('')
  const [showPicker, setShowPicker] = useState(false)
  const [geoLoading, setGeoLoading] = useState(false)
  const [geoError, setGeoError] = useState<string | null>(null)
  const [phone, setPhone] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)

  const goBack = useCallback(() => navigate('/seller/welcome'), [navigate])

  useEffect(() => {
    backButton.show()
    backButton.onClick(goBack)
    return () => {
      backButton.offClick(goBack)
      backButton.hide()
    }
  }, [goBack])

  const requestGeolocation = useCallback(() => {
    if (!('geolocation' in navigator)) {
      setGeoError('Геолокация не поддерживается этим устройством')
      return
    }
    setGeoLoading(true)
    setGeoError(null)
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        hapticFeedback.success()
        setCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude })
        setGeoLoading(false)
      },
      (err) => {
        hapticFeedback.error()
        const msg =
          err.code === err.PERMISSION_DENIED
            ? 'Доступ к геолокации запрещён. Можно выбрать точку на карте.'
            : 'Не удалось определить локацию. Попробуйте ещё раз или выберите точку на карте.'
        setGeoError(msg)
        setGeoLoading(false)
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 },
    )
  }, [])

  const trimmedName = name.trim()
  const nameValid = trimmedName.length >= 2 && trimmedName.length <= 100
  const phoneValid = isPhoneValid(phone)
  const canSubmit =
    nameValid && category !== null && coords !== null && phoneValid && !submitting

  const handleSubmit = async () => {
    if (!canSubmit || !category || !coords) return
    setSubmitting(true)
    setSubmitError(null)
    hapticFeedback.medium()
    const payload: SellerCreatePayload = {
      name: trimmedName,
      category,
      phone: normalizePhone(phone),
      location_lat: coords.lat,
      location_lng: coords.lng,
    }
    const label = locationLabel.trim()
    if (label) payload.location_label = label
    try {
      await apiPost<SellerCreateResponse>('/me/seller', payload)
      hapticFeedback.success()
      navigate('/seller/cabinet', { replace: true })
    } catch (err: unknown) {
      hapticFeedback.error()
      const message =
        err instanceof ApiError
          ? `${err.message}${err.code ? ` (${err.code})` : ''}`
          : 'Не удалось создать ферму. Попробуйте ещё раз.'
      setSubmitError(message)
      setSubmitting(false)
    }
  }

  return (
    <div className="p-4" style={{ paddingBottom: 120 }}>
      <header className="flex items-center gap-2 mb-4">
        <button
          type="button"
          onClick={goBack}
          aria-label="Назад"
          className="rounded-full flex items-center justify-center active:opacity-70 transition"
          style={{
            width: 36,
            height: 36,
            backgroundColor: 'var(--tg-secondary-bg)',
            color: 'var(--tg-text)',
            transitionDuration: '150ms',
          }}
        >
          <ChevronLeft size={20} strokeWidth={2} />
        </button>
        <h1
          className="font-semibold"
          style={{ fontSize: 20, lineHeight: 1.2 }}
        >
          Регистрация фермы
        </h1>
      </header>

      <div className="flex flex-col gap-5">
        <Field label="Название фермы" hint="От 2 до 100 символов">
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            maxLength={120}
            placeholder="Например: Сыроварня «Грин Хилл»"
            className="w-full rounded-lg px-3 py-3 outline-none"
            style={{
              backgroundColor: 'var(--tg-secondary-bg)',
              color: 'var(--tg-text)',
              fontSize: 15,
              border: '1px solid var(--tg-hairline)',
            }}
          />
          {name.length > 0 && !nameValid && (
            <FieldError>Название должно быть от 2 до 100 символов</FieldError>
          )}
        </Field>

        <Field label="Категория">
          <div className="grid grid-cols-2 gap-2">
            {SELLER_CATEGORIES.map((opt) => {
              const active = category === opt.value
              return (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => {
                    hapticFeedback.light()
                    setCategory(opt.value)
                  }}
                  className="flex items-center gap-2 px-3 py-3 rounded-lg active:opacity-80 active:scale-[0.97] transition"
                  style={{
                    backgroundColor: active
                      ? 'var(--tg-link)'
                      : 'var(--tg-secondary-bg)',
                    color: active ? '#ffffff' : 'var(--tg-text)',
                    border: '1px solid var(--tg-hairline)',
                    fontSize: 14,
                    transitionDuration: '150ms',
                  }}
                >
                  <span style={{ fontSize: 18, lineHeight: 1 }} aria-hidden="true">
                    {opt.emoji}
                  </span>
                  <span className="truncate">{opt.label}</span>
                </button>
              )
            })}
          </div>
        </Field>

        <Field label="Локация">
          {!coords ? (
            <button
              type="button"
              onClick={requestGeolocation}
              disabled={geoLoading}
              className="w-full flex items-center justify-center gap-2 py-3 rounded-lg active:opacity-80 transition disabled:opacity-60"
              style={{
                backgroundColor: 'var(--tg-secondary-bg)',
                color: 'var(--tg-link)',
                border: '1px solid var(--tg-hairline)',
                fontSize: 15,
                fontWeight: 500,
                transitionDuration: '150ms',
              }}
            >
              <MapPin size={18} strokeWidth={2} aria-hidden="true" />
              <span>
                {geoLoading
                  ? 'Определяем…'
                  : 'Определить мою локацию'}
              </span>
            </button>
          ) : (
            <div
              className="rounded-lg p-3"
              style={{
                backgroundColor: 'var(--tg-secondary-bg)',
                border: '1px solid var(--tg-hairline)',
              }}
            >
              <div className="flex items-center gap-2">
                <MapPin
                  size={18}
                  strokeWidth={2}
                  style={{ color: 'var(--tg-link)' }}
                  aria-hidden="true"
                />
                <span
                  className="tabular-nums"
                  style={{ fontSize: 14, color: 'var(--tg-text)' }}
                >
                  {formatCoord(coords.lat)}, {formatCoord(coords.lng)}
                </span>
              </div>
              <button
                type="button"
                onClick={() => setShowPicker((v) => !v)}
                className="mt-2 active:opacity-70 transition"
                style={{
                  color: 'var(--tg-link)',
                  fontSize: 13,
                  transitionDuration: '150ms',
                }}
              >
                {showPicker ? 'Скрыть карту' : 'Выбрать другую точку'}
              </button>
            </div>
          )}
          {geoError && <FieldError>{geoError}</FieldError>}
          {coords && showPicker && (
            <div className="mt-3">
              <Suspense
                fallback={
                  <div
                    className="rounded-xl"
                    style={{
                      height: 240,
                      backgroundColor: 'var(--tg-secondary-bg)',
                    }}
                  />
                }
              >
                <LocationPicker
                  lat={coords.lat}
                  lng={coords.lng}
                  onChange={(lat, lng) => setCoords({ lat, lng })}
                />
              </Suspense>
              <p
                className="mt-2"
                style={{ fontSize: 12, color: 'var(--tg-hint)' }}
              >
                Перетащите маркер или нажмите на карту, чтобы выбрать точку.
              </p>
            </div>
          )}
          {coords && (
            <div className="mt-3">
              <label
                className="block mb-1"
                style={{ fontSize: 13, color: 'var(--tg-hint)' }}
              >
                Адрес (необязательно)
              </label>
              <input
                type="text"
                value={locationLabel}
                onChange={(e) => setLocationLabel(e.target.value)}
                placeholder="Например: д. Лесное, Минский р-н"
                className="w-full rounded-lg px-3 py-3 outline-none"
                style={{
                  backgroundColor: 'var(--tg-secondary-bg)',
                  color: 'var(--tg-text)',
                  fontSize: 15,
                  border: '1px solid var(--tg-hairline)',
                }}
              />
            </div>
          )}
        </Field>

        <Field label="Телефон" hint="Минимум 7 цифр">
          <input
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="+375 29 123-45-67"
            inputMode="tel"
            autoComplete="tel"
            className="w-full rounded-lg px-3 py-3 outline-none"
            style={{
              backgroundColor: 'var(--tg-secondary-bg)',
              color: 'var(--tg-text)',
              fontSize: 15,
              border: '1px solid var(--tg-hairline)',
            }}
          />
          {phone.length > 0 && !phoneValid && (
            <FieldError>Введите номер минимум из 7 цифр</FieldError>
          )}
        </Field>

        {submitError && (
          <div
            className="rounded-lg p-3"
            style={{
              backgroundColor: 'rgba(239,68,68,0.1)',
              color: 'var(--tg-destructive-text, #ff3b30)',
              fontSize: 14,
            }}
          >
            {submitError}
          </div>
        )}

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
          {submitting ? 'Создаём…' : 'Создать ферму'}
        </button>
      </div>
    </div>
  )
}

function Field({
  label,
  hint,
  children,
}: {
  label: string
  hint?: string
  children: React.ReactNode
}) {
  return (
    <div>
      <div className="flex items-baseline justify-between mb-2">
        <label
          className="font-medium"
          style={{ fontSize: 14, color: 'var(--tg-text)' }}
        >
          {label}
        </label>
        {hint && (
          <span style={{ fontSize: 12, color: 'var(--tg-hint)' }}>{hint}</span>
        )}
      </div>
      {children}
    </div>
  )
}

function FieldError({ children }: { children: React.ReactNode }) {
  return (
    <p
      className="mt-1"
      style={{
        fontSize: 12,
        color: 'var(--tg-destructive-text, #ff3b30)',
      }}
    >
      {children}
    </p>
  )
}
