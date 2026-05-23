import { MapPin } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import {
  ConsumerBotNotConfiguredError,
  getMyProfile,
  updateMyLocation,
} from '../api'
import BotNotConfiguredScreen from '../components/BotNotConfiguredScreen'
import Toast, { useToast } from '../components/Toast'
import type { ConsumerProfile } from '../types'
import { getTelegramUser, hapticFeedback } from '../../lib/telegram'

const GEO_TIMEOUT_MS = 8000

export default function ProfileScreen() {
  const tgUser = useMemo(getTelegramUser, [])
  const [profile, setProfile] = useState<ConsumerProfile | null>(null)
  const [profileLoaded, setProfileLoaded] = useState(false)
  const [botNotConfigured, setBotNotConfigured] = useState(false)
  const [updating, setUpdating] = useState(false)
  const [toast, showToast] = useToast()

  useEffect(() => {
    let cancelled = false
    getMyProfile()
      .then((res) => {
        if (cancelled) return
        setProfile(res)
      })
      .catch((err: unknown) => {
        if (cancelled) return
        if (err instanceof ConsumerBotNotConfiguredError) {
          setBotNotConfigured(true)
        }
        // Other errors are silent here — the profile screen still works
        // with Telegram data + an "не указана" location label.
      })
      .finally(() => {
        if (!cancelled) setProfileLoaded(true)
      })
    return () => {
      cancelled = true
    }
  }, [])

  const displayName = useMemo(() => {
    if (tgUser?.firstName) {
      return [tgUser.firstName, tgUser.lastName].filter(Boolean).join(' ')
    }
    if (tgUser?.username) return `@${tgUser.username}`
    return 'Пользователь'
  }, [tgUser])

  const handleUpdateLocation = () => {
    if (updating) return
    if (typeof navigator === 'undefined' || !('geolocation' in navigator)) {
      showToast('Геолокация недоступна')
      return
    }
    hapticFeedback.light()
    setUpdating(true)
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        try {
          await updateMyLocation(pos.coords.latitude, pos.coords.longitude)
          hapticFeedback.success()
          showToast('Локация обновлена')
          // Mark the profile as "has location" without reading coords back.
          setProfile((prev) => ({
            telegram_id: prev?.telegram_id ?? tgUser?.id ?? 0,
            location: {
              lat: pos.coords.latitude,
              lng: pos.coords.longitude,
            },
          }))
        } catch (err: unknown) {
          hapticFeedback.error()
          if (err instanceof ConsumerBotNotConfiguredError) {
            showToast('Сервис временно недоступен')
          } else {
            const msg =
              err instanceof Error ? err.message : 'Не удалось обновить'
            showToast(msg)
          }
        } finally {
          setUpdating(false)
        }
      },
      (err) => {
        setUpdating(false)
        hapticFeedback.error()
        if (err.code === err.PERMISSION_DENIED) {
          showToast('Геолокация недоступна')
        } else {
          showToast('Не удалось определить локацию')
        }
      },
      { timeout: GEO_TIMEOUT_MS, enableHighAccuracy: true, maximumAge: 0 },
    )
  }

  if (botNotConfigured) {
    return <BotNotConfiguredScreen />
  }

  if (!profileLoaded) {
    return (
      <div
        className="h-full flex items-center justify-center"
        style={{ color: 'var(--tg-hint)', fontSize: 13 }}
      >
        Загружаем…
      </div>
    )
  }

  const hasLocation = !!profile?.location
  const locationLabel = hasLocation ? 'Локация сохранена' : 'Не указана'

  return (
    <div
      className="h-full overflow-y-auto px-4 pt-5 pb-8"
      style={{ color: 'var(--tg-text)' }}
    >
      <header
        className="flex items-center gap-3 mb-5 pb-5"
        style={{ borderBottom: '1px solid var(--tg-hairline)' }}
      >
        <Avatar photoUrl={tgUser?.photoUrl} fallback={displayName} />
        <div className="min-w-0 flex-1">
          <div
            className="font-semibold truncate"
            style={{ fontSize: 17, lineHeight: 1.2 }}
          >
            {displayName}
          </div>
          {tgUser?.username && tgUser.firstName && (
            <div
              className="mt-0.5 truncate"
              style={{ fontSize: 12, color: 'var(--tg-hint)' }}
            >
              @{tgUser.username}
            </div>
          )}
        </div>
      </header>

      <section className="mb-5">
        <h2
          className="font-semibold uppercase tracking-wide mb-2 px-1"
          style={{ fontSize: 12, color: 'var(--tg-hint)' }}
        >
          Локация
        </h2>
        <div
          className="rounded-xl"
          style={{
            padding: 14,
            backgroundColor: 'var(--tg-secondary-bg)',
          }}
        >
          <div className="flex items-center gap-2">
            <span aria-hidden="true">📍</span>
            <span style={{ fontSize: 14, color: 'var(--tg-text)' }}>
              {locationLabel}
            </span>
          </div>
          <button
            type="button"
            onClick={handleUpdateLocation}
            disabled={updating}
            aria-busy={updating}
            className="mt-3 w-full inline-flex items-center justify-center gap-2 py-2.5 rounded-lg font-medium active:opacity-80 active:scale-[0.98] disabled:opacity-50 transition"
            style={{
              backgroundColor: 'var(--tg-button)',
              color: 'var(--tg-button-text)',
              fontSize: 14,
              transitionDuration: '150ms',
            }}
          >
            <MapPin size={16} aria-hidden="true" />
            <span>
              {updating ? 'Обновляем…' : 'Обновить локацию'}
            </span>
          </button>
        </div>
      </section>

      <section className="mb-6">
        <h2
          className="font-semibold uppercase tracking-wide mb-2 px-1"
          style={{ fontSize: 12, color: 'var(--tg-hint)' }}
        >
          О Krana Box
        </h2>
        <div
          className="rounded-xl"
          style={{
            padding: 14,
            backgroundColor: 'var(--tg-secondary-bg)',
            fontSize: 13,
            color: 'var(--tg-text)',
            lineHeight: 1.5,
          }}
        >
          Krana Box помогает забрать несъеденную еду из кафе и пекарен по
          символической цене. Каждая бронь — это меньше выброшенной еды и
          небольшая поддержка для локального бизнеса.
        </div>
      </section>

      <footer
        className="mt-2 text-center"
        style={{
          fontSize: 11,
          color: 'var(--tg-hint)',
          lineHeight: 1.5,
        }}
      >
        © 2026 Glitchlab Ltd. Krana is a product of Glitchlab Ltd.
        <br />
        Companies House: SC870130.
      </footer>

      <Toast message={toast} />
    </div>
  )
}

function Avatar({
  photoUrl,
  fallback,
}: {
  photoUrl?: string
  fallback: string
}) {
  const [errored, setErrored] = useState(false)
  const showPhoto = !!photoUrl && !errored
  const initial = fallback.trim().charAt(0).toUpperCase() || '👤'
  return (
    <div
      className="shrink-0 flex items-center justify-center rounded-full overflow-hidden"
      style={{
        width: 56,
        height: 56,
        backgroundColor: 'var(--tg-secondary-bg)',
        fontSize: 24,
      }}
      aria-hidden="true"
    >
      {showPhoto ? (
        <img
          src={photoUrl}
          alt=""
          width={56}
          height={56}
          onError={() => setErrored(true)}
          style={{ width: 56, height: 56, objectFit: 'cover' }}
        />
      ) : (
        <span>{initial}</span>
      )}
    </div>
  )
}
