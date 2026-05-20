import { ChevronLeft, MapPin, Plus, X } from 'lucide-react'
import { lazy, Suspense, useCallback, useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ApiError, apiPost } from '../../api/client'
import type {
  GeocodeResult,
  SellerCategory,
  SellerCreatePayload,
  SellerCreateResponse,
  SellingPoint,
} from '../../api/types'
import { backButton, hapticFeedback } from '../../lib/telegram'
import AddressSearch from './AddressSearch'
import { SELLER_CATEGORIES } from './categories'
import { isPhoneValid, normalizePhone } from './phone'

const LocationPicker = lazy(() => import('./LocationPicker'))

interface SellingPointDraft {
  id: string
  label: string
  address: string
  lat: number | null
  lng: number | null
  schedule: string
}

function newPointId(): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return crypto.randomUUID()
  }
  return `sp_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`
}

function emptyPoint(): SellingPointDraft {
  return {
    id: newPointId(),
    label: '',
    address: '',
    lat: null,
    lng: null,
    schedule: '',
  }
}

function formatCoord(n: number): string {
  return n.toFixed(5)
}

function isPointReady(p: SellingPointDraft): boolean {
  return p.label.trim().length > 0 && p.lat !== null && p.lng !== null
}

export default function SellerRegister() {
  const navigate = useNavigate()
  const [name, setName] = useState('')
  const [category, setCategory] = useState<SellerCategory | null>(null)
  const [phone, setPhone] = useState('')
  const [points, setPoints] = useState<SellingPointDraft[]>(() => [emptyPoint()])

  // Optional home address for the farm itself.
  const [homeEnabled, setHomeEnabled] = useState(false)
  const [homeAddress, setHomeAddress] = useState('')
  const [homeCoords, setHomeCoords] = useState<{ lat: number; lng: number } | null>(
    null,
  )
  const [homeGeoLoading, setHomeGeoLoading] = useState(false)
  const [homeGeoError, setHomeGeoError] = useState<string | null>(null)

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

  const requestHomeGeolocation = useCallback(() => {
    if (!('geolocation' in navigator)) {
      setHomeGeoError('Геолокация не поддерживается этим устройством')
      return
    }
    setHomeGeoLoading(true)
    setHomeGeoError(null)
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        hapticFeedback.success()
        setHomeCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude })
        setHomeGeoLoading(false)
      },
      (err) => {
        hapticFeedback.error()
        const msg =
          err.code === err.PERMISSION_DENIED
            ? 'Доступ к геолокации запрещён.'
            : 'Не удалось определить локацию. Попробуйте ещё раз.'
        setHomeGeoError(msg)
        setHomeGeoLoading(false)
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 },
    )
  }, [])

  const updatePoint = useCallback(
    (id: string, patch: Partial<SellingPointDraft>) => {
      setPoints((prev) =>
        prev.map((p) => (p.id === id ? { ...p, ...patch } : p)),
      )
    },
    [],
  )

  const addPoint = useCallback(() => {
    hapticFeedback.light()
    setPoints((prev) => [...prev, emptyPoint()])
  }, [])

  const removePoint = useCallback((id: string) => {
    hapticFeedback.light()
    setPoints((prev) => prev.filter((p) => p.id !== id))
  }, [])

  const trimmedName = name.trim()
  const nameValid = trimmedName.length >= 2 && trimmedName.length <= 100
  const phoneValid = isPhoneValid(phone)
  const pointsValid = points.length >= 1 && points.every(isPointReady)
  const canSubmit =
    nameValid && category !== null && phoneValid && pointsValid && !submitting

  const submitDisabledReason = useMemo(() => {
    if (submitting) return null
    if (!nameValid) return 'Укажите название фермы (2–100 символов)'
    if (category === null) return 'Выберите категорию'
    if (!phoneValid) return 'Укажите телефон минимум из 7 цифр'
    if (points.length === 0) return 'Добавьте хотя бы одно место продажи'
    if (!pointsValid) {
      return 'У каждой точки должно быть название и координаты на карте'
    }
    return null
  }, [submitting, nameValid, category, phoneValid, points.length, pointsValid])

  const handleSubmit = async () => {
    if (!canSubmit || !category) return
    setSubmitting(true)
    setSubmitError(null)
    hapticFeedback.medium()

    const sellingPoints: SellingPoint[] = points.map((p) => {
      const sp: SellingPoint = {
        label: p.label.trim(),
        lat: p.lat as number,
        lng: p.lng as number,
      }
      const addr = p.address.trim()
      if (addr) sp.address = addr
      const sched = p.schedule.trim()
      if (sched) sp.schedule = sched
      return sp
    })

    const payload: SellerCreatePayload = {
      name: trimmedName,
      category,
      phone: normalizePhone(phone),
      selling_points: sellingPoints,
    }
    if (homeEnabled && homeCoords) {
      payload.home_lat = homeCoords.lat
      payload.home_lng = homeCoords.lng
      const homeAddr = homeAddress.trim()
      if (homeAddr) payload.home_address = homeAddr
    }

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

        <section>
          <div className="mb-2">
            <h2
              className="font-semibold"
              style={{ fontSize: 16, color: 'var(--tg-text)' }}
            >
              📍 Места продажи
            </h2>
            <p
              className="mt-1"
              style={{ fontSize: 13, color: 'var(--tg-hint)', lineHeight: 1.4 }}
            >
              Где вы продаёте? Можно несколько мест.
            </p>
          </div>

          <div className="flex flex-col gap-3">
            {points.map((point, idx) => (
              <SellingPointCard
                key={point.id}
                index={idx}
                point={point}
                canRemove={points.length > 1}
                onChange={(patch) => updatePoint(point.id, patch)}
                onRemove={() => removePoint(point.id)}
              />
            ))}
          </div>

          <button
            type="button"
            onClick={addPoint}
            className="mt-3 w-full flex items-center justify-center gap-2 py-3 rounded-lg active:opacity-80 transition"
            style={{
              backgroundColor: 'var(--tg-secondary-bg)',
              color: 'var(--tg-link)',
              border: '1px dashed var(--tg-hairline)',
              fontSize: 14,
              fontWeight: 500,
              transitionDuration: '150ms',
            }}
          >
            <Plus size={16} strokeWidth={2} aria-hidden="true" />
            <span>Добавить место продажи</span>
          </button>
        </section>

        <section>
          <label
            className="flex items-start gap-3 cursor-pointer active:opacity-80 transition"
            style={{ transitionDuration: '150ms' }}
          >
            <input
              type="checkbox"
              checked={homeEnabled}
              onChange={(e) => {
                setHomeEnabled(e.target.checked)
                if (!e.target.checked) {
                  setHomeCoords(null)
                  setHomeAddress('')
                  setHomeGeoError(null)
                }
              }}
              className="mt-0.5"
              style={{ width: 18, height: 18 }}
            />
            <div className="flex-1">
              <div
                className="font-medium"
                style={{ fontSize: 14, color: 'var(--tg-text)' }}
              >
                Указать также адрес самой фермы
              </div>
              <div
                className="mt-0.5"
                style={{ fontSize: 12, color: 'var(--tg-hint)' }}
              >
                Необязательно. Помогает находить вас на карте поставщиков.
              </div>
            </div>
          </label>

          {homeEnabled && (
            <div className="mt-3 flex flex-col gap-3">
              <input
                type="text"
                value={homeAddress}
                onChange={(e) => setHomeAddress(e.target.value)}
                placeholder="Адрес фермы (необязательно)"
                className="w-full rounded-lg px-3 py-3 outline-none"
                style={{
                  backgroundColor: 'var(--tg-secondary-bg)',
                  color: 'var(--tg-text)',
                  fontSize: 15,
                  border: '1px solid var(--tg-hairline)',
                }}
              />
              {!homeCoords ? (
                <button
                  type="button"
                  onClick={requestHomeGeolocation}
                  disabled={homeGeoLoading}
                  className="w-full flex items-center justify-center gap-2 py-3 rounded-lg active:opacity-80 transition disabled:opacity-60"
                  style={{
                    backgroundColor: 'var(--tg-secondary-bg)',
                    color: 'var(--tg-link)',
                    border: '1px solid var(--tg-hairline)',
                    fontSize: 14,
                    fontWeight: 500,
                    transitionDuration: '150ms',
                  }}
                >
                  <MapPin size={16} strokeWidth={2} aria-hidden="true" />
                  <span>
                    {homeGeoLoading
                      ? 'Определяем…'
                      : 'Определить мою локацию'}
                  </span>
                </button>
              ) : (
                <div
                  className="rounded-lg p-3 flex items-center justify-between gap-2"
                  style={{
                    backgroundColor: 'var(--tg-secondary-bg)',
                    border: '1px solid var(--tg-hairline)',
                  }}
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <MapPin
                      size={16}
                      strokeWidth={2}
                      style={{ color: 'var(--tg-link)' }}
                      aria-hidden="true"
                    />
                    <span
                      className="tabular-nums truncate"
                      style={{ fontSize: 13, color: 'var(--tg-text)' }}
                    >
                      {formatCoord(homeCoords.lat)}, {formatCoord(homeCoords.lng)}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setHomeCoords(null)}
                    className="shrink-0 active:opacity-70 transition"
                    style={{
                      color: 'var(--tg-link)',
                      fontSize: 13,
                      transitionDuration: '150ms',
                    }}
                  >
                    Сбросить
                  </button>
                </div>
              )}
              {homeGeoError && <FieldError>{homeGeoError}</FieldError>}
            </div>
          )}
        </section>

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

        {submitDisabledReason && !submitError && (
          <p
            className="text-center"
            style={{ fontSize: 12, color: 'var(--tg-hint)' }}
          >
            {submitDisabledReason}
          </p>
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

interface SellingPointCardProps {
  index: number
  point: SellingPointDraft
  canRemove: boolean
  onChange: (patch: Partial<SellingPointDraft>) => void
  onRemove: () => void
}

function SellingPointCard({
  index,
  point,
  canRemove,
  onChange,
  onRemove,
}: SellingPointCardProps) {
  const handleGeocodePick = (result: GeocodeResult) => {
    onChange({
      address: result.label,
      lat: result.lat,
      lng: result.lng,
    })
  }

  const handleMapDrag = (lat: number, lng: number) => {
    onChange({ lat, lng })
  }

  return (
    <article
      className="rounded-xl"
      style={{
        backgroundColor: 'var(--tg-section-bg, var(--tg-bg))',
        border: '1px solid var(--tg-hairline)',
        padding: 14,
      }}
    >
      <header className="flex items-center justify-between mb-3 gap-2">
        <span
          className="font-medium"
          style={{ fontSize: 14, color: 'var(--tg-hint)' }}
        >
          Место №{index + 1}
        </span>
        {canRemove && (
          <button
            type="button"
            onClick={onRemove}
            aria-label="Удалить эту точку"
            className="flex items-center gap-1 active:opacity-70 transition"
            style={{
              color: 'var(--tg-destructive-text, #ff3b30)',
              fontSize: 13,
              transitionDuration: '150ms',
            }}
          >
            <X size={14} strokeWidth={2} aria-hidden="true" />
            <span>Удалить</span>
          </button>
        )}
      </header>

      <div className="flex flex-col gap-3">
        <div>
          <label
            className="block mb-1"
            style={{ fontSize: 13, color: 'var(--tg-hint)' }}
          >
            Название
          </label>
          <input
            type="text"
            value={point.label}
            onChange={(e) => onChange({ label: e.target.value })}
            placeholder="Например, Комаровский рынок"
            className="w-full rounded-lg px-3 py-3 outline-none"
            style={{
              backgroundColor: 'var(--tg-secondary-bg)',
              color: 'var(--tg-text)',
              fontSize: 15,
              border: '1px solid var(--tg-hairline)',
            }}
          />
        </div>

        <div>
          <label
            className="block mb-1"
            style={{ fontSize: 13, color: 'var(--tg-hint)' }}
          >
            Адрес
          </label>
          <AddressSearch onPick={handleGeocodePick} />
        </div>

        {point.lat !== null && point.lng !== null && (
          <div>
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
                lat={point.lat}
                lng={point.lng}
                onChange={handleMapDrag}
              />
            </Suspense>
            <p
              className="mt-2 tabular-nums"
              style={{ fontSize: 12, color: 'var(--tg-hint)' }}
            >
              {formatCoord(point.lat)}, {formatCoord(point.lng)} · перетащите
              маркер для точной корректировки.
            </p>
          </div>
        )}

        <div>
          <label
            className="block mb-1"
            style={{ fontSize: 13, color: 'var(--tg-hint)' }}
          >
            Расписание (необязательно)
          </label>
          <input
            type="text"
            value={point.schedule}
            onChange={(e) => onChange({ schedule: e.target.value })}
            placeholder="Сб-Вс 8:00–15:00"
            className="w-full rounded-lg px-3 py-3 outline-none"
            style={{
              backgroundColor: 'var(--tg-secondary-bg)',
              color: 'var(--tg-text)',
              fontSize: 15,
              border: '1px solid var(--tg-hairline)',
            }}
          />
        </div>
      </div>
    </article>
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
