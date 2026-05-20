import { ChevronLeft, MapPin } from 'lucide-react'
import { Suspense, lazy, useCallback, useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ApiError, apiPatch } from '../../api/client'
import { useSeller } from '../../api/hooks'
import type {
  GeocodeResult,
  SellerCategory,
  SellerUpdatePayload,
  SellerUpdateResponse,
} from '../../api/types'
import ErrorState from '../../components/ErrorState'
import { backButton, hapticFeedback } from '../../lib/telegram'
import AddressSearch from './AddressSearch'
import { SELLER_CATEGORIES } from './categories'
import { isPhoneValid, normalizePhone } from './phone'

const LocationPicker = lazy(() => import('./LocationPicker'))

interface Coords {
  lat: number
  lng: number
}

interface InitialSnapshot {
  name: string
  category: string
  phone: string
  homeEnabled: boolean
  homeAddress: string
  homeCoords: Coords | null
}

function formatCoord(n: number): string {
  return n.toFixed(5)
}

const ERROR_TEXTS: Record<string, string> = {
  invalid_name: 'Название слишком короткое или слишком длинное (2-100 символов)',
  invalid_category: 'Выберите категорию',
  invalid_phone: 'Неверный формат телефона',
  invalid_home_location: 'Неверные координаты',
  update_failed: 'Не удалось сохранить, попробуйте ещё раз',
  empty_payload: 'Ничего не изменено',
}

function describeError(err: unknown, fallback: string): string {
  if (err instanceof ApiError) {
    if (err.code && ERROR_TEXTS[err.code]) return ERROR_TEXTS[err.code]!
    if (err.message) {
      return err.code ? `${err.message} (${err.code})` : err.message
    }
  }
  return fallback
}

function coordsEqual(a: Coords | null, b: Coords | null): boolean {
  if (!a && !b) return true
  if (!a || !b) return false
  return a.lat === b.lat && a.lng === b.lng
}

export default function SellerEdit() {
  const navigate = useNavigate()
  const { data: seller, loading, notFound, error, refetch } = useSeller(true)

  const initial = useMemo<InitialSnapshot | null>(() => {
    if (!seller) return null
    const homeCoords =
      typeof seller.home_lat === 'number' &&
      typeof seller.home_lng === 'number' &&
      Number.isFinite(seller.home_lat) &&
      Number.isFinite(seller.home_lng)
        ? { lat: seller.home_lat, lng: seller.home_lng }
        : null
    return {
      name: seller.name ?? '',
      category: (seller.category as string) ?? '',
      phone: seller.phone ?? '',
      homeEnabled: !!(homeCoords || (seller.home_address ?? '').trim()),
      homeAddress: seller.home_address ?? '',
      homeCoords,
    }
  }, [seller])

  const [name, setName] = useState('')
  const [category, setCategory] = useState<string>('')
  const [phone, setPhone] = useState('')
  const [homeEnabled, setHomeEnabled] = useState(false)
  const [homeAddress, setHomeAddress] = useState('')
  const [homeCoords, setHomeCoords] = useState<Coords | null>(null)
  const [hydrated, setHydrated] = useState(false)
  const [geoLoading, setGeoLoading] = useState(false)
  const [geoError, setGeoError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)

  // Hydrate the form once seller data arrives. Don't override afterwards
  // so the user's edits aren't blown away by a refetch.
  useEffect(() => {
    if (hydrated || !initial) return
    setName(initial.name)
    setCategory(initial.category)
    setPhone(initial.phone)
    setHomeEnabled(initial.homeEnabled)
    setHomeAddress(initial.homeAddress)
    setHomeCoords(initial.homeCoords)
    setHydrated(true)
  }, [hydrated, initial])

  const goBack = useCallback(() => navigate('/seller/cabinet'), [navigate])

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
        setHomeCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude })
        setGeoLoading(false)
      },
      (err) => {
        hapticFeedback.error()
        const msg =
          err.code === err.PERMISSION_DENIED
            ? 'Доступ к геолокации запрещён.'
            : 'Не удалось определить локацию. Попробуйте ещё раз.'
        setGeoError(msg)
        setGeoLoading(false)
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 },
    )
  }, [])

  const handlePickAddress = (res: GeocodeResult) => {
    setHomeAddress(res.label)
    setHomeCoords({ lat: res.lat, lng: res.lng })
  }

  const handleMapDrag = (lat: number, lng: number) => {
    setHomeCoords({ lat, lng })
  }

  const trimmedName = name.trim()
  const trimmedAddress = homeAddress.trim()
  const nameValid = trimmedName.length >= 2 && trimmedName.length <= 100
  const phoneValid = isPhoneValid(phone)
  const categoryValid = category.trim().length > 0

  const formValid = nameValid && phoneValid && categoryValid

  // Build diff with the initial snapshot — only changed fields go to PATCH.
  const diff = useMemo<SellerUpdatePayload>(() => {
    if (!initial) return {}
    const out: SellerUpdatePayload = {}
    if (trimmedName !== initial.name) out.name = trimmedName
    if (category !== initial.category) out.category = category
    const normalizedPhone = normalizePhone(phone)
    if (normalizedPhone !== initial.phone) out.phone = normalizedPhone
    if (homeEnabled) {
      if (trimmedAddress !== (initial.homeAddress ?? '').trim()) {
        out.home_address = trimmedAddress.length > 0 ? trimmedAddress : null
      }
      if (!coordsEqual(homeCoords, initial.homeCoords)) {
        out.home_lat = homeCoords ? homeCoords.lat : null
        out.home_lng = homeCoords ? homeCoords.lng : null
      }
    } else if (initial.homeEnabled) {
      // User unchecked the home-address block — clear all three fields.
      if ((initial.homeAddress ?? '').trim()) out.home_address = null
      if (initial.homeCoords) {
        out.home_lat = null
        out.home_lng = null
      }
    }
    return out
  }, [
    initial,
    trimmedName,
    category,
    phone,
    homeEnabled,
    trimmedAddress,
    homeCoords,
  ])

  const hasChanges = Object.keys(diff).length > 0
  const canSubmit = formValid && hasChanges && !submitting && !!initial

  const disabledReason = useMemo(() => {
    if (submitting) return null
    if (!hydrated) return null
    if (!nameValid) return 'Укажите название фермы (2–100 символов)'
    if (!categoryValid) return 'Выберите категорию'
    if (!phoneValid) return 'Укажите телефон минимум из 7 цифр'
    if (!hasChanges) return 'Ничего не изменено'
    return null
  }, [submitting, hydrated, nameValid, categoryValid, phoneValid, hasChanges])

  const handleSubmit = async () => {
    if (!canSubmit) return
    setSubmitting(true)
    setSubmitError(null)
    hapticFeedback.medium()
    try {
      await apiPatch<SellerUpdateResponse>('/me/seller', diff)
      hapticFeedback.success()
      navigate('/seller/cabinet', { replace: true })
    } catch (err: unknown) {
      hapticFeedback.error()
      setSubmitError(
        describeError(err, 'Не удалось сохранить, попробуйте ещё раз'),
      )
      setSubmitting(false)
    }
  }

  if (loading || !hydrated) {
    if (loading) {
      return <Spinner />
    }
    // Initial may be null briefly while hydrating — render a spinner.
    return <Spinner />
  }

  if (notFound) {
    return (
      <div
        className="w-full h-full flex items-center justify-center"
        style={{ backgroundColor: 'var(--tg-bg)' }}
      >
        <ErrorState
          title="Ферма не найдена"
          message="Сначала зарегистрируйте ферму."
          onRetry={() => navigate('/seller/welcome', { replace: true })}
        />
      </div>
    )
  }

  if (error || !seller) {
    return (
      <div
        className="w-full h-full flex items-center justify-center"
        style={{ backgroundColor: 'var(--tg-bg)' }}
      >
        <ErrorState
          title="Не удалось загрузить"
          message={error?.message ?? 'Не удалось загрузить данные фермы'}
          onRetry={refetch}
        />
      </div>
    )
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
          className="font-semibold flex-1 min-w-0"
          style={{ fontSize: 20, lineHeight: 1.2 }}
        >
          Редактировать ферму
        </h1>
        <button
          type="button"
          onClick={goBack}
          disabled={submitting}
          className="rounded-lg active:opacity-70 disabled:opacity-40 transition"
          style={{
            padding: '6px 10px',
            color: 'var(--tg-link)',
            fontSize: 14,
            transitionDuration: '150ms',
          }}
        >
          Отмена
        </button>
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
                    setCategory(opt.value as SellerCategory)
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
                  <span
                    style={{ fontSize: 18, lineHeight: 1 }}
                    aria-hidden="true"
                  >
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
                  setGeoError(null)
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
                Указать адрес самой фермы
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
              <AddressSearch onPick={handlePickAddress} />
              {homeAddress && (
                <div
                  className="rounded-lg p-3"
                  style={{
                    backgroundColor: 'var(--tg-secondary-bg)',
                    border: '1px solid var(--tg-hairline)',
                    fontSize: 14,
                    color: 'var(--tg-text)',
                    lineHeight: 1.35,
                  }}
                >
                  {homeAddress}
                </div>
              )}

              {!homeCoords ? (
                <button
                  type="button"
                  onClick={requestGeolocation}
                  disabled={geoLoading}
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
                    {geoLoading
                      ? 'Определяем…'
                      : 'Использовать мою геолокацию'}
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
                      {formatCoord(homeCoords.lat)},{' '}
                      {formatCoord(homeCoords.lng)}
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
              {geoError && <FieldError>{geoError}</FieldError>}

              {homeCoords && (
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
                    lat={homeCoords.lat}
                    lng={homeCoords.lng}
                    onChange={handleMapDrag}
                  />
                </Suspense>
              )}
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

        {disabledReason && !submitError && (
          <p
            className="text-center"
            style={{ fontSize: 12, color: 'var(--tg-hint)' }}
          >
            {disabledReason}
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
          {submitting ? 'Сохраняем…' : 'Сохранить'}
        </button>
      </div>
    </div>
  )
}

function Spinner() {
  return (
    <div
      className="h-full flex items-center justify-center"
      style={{ color: 'var(--tg-hint)' }}
    >
      <div
        className="w-8 h-8 rounded-full animate-spin"
        style={{
          border: '3px solid var(--tg-link)',
          borderTopColor: 'transparent',
        }}
        aria-hidden="true"
      />
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
