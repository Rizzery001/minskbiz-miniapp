import { useCallback, useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import ConfirmModal from '../components/ConfirmModal'
import type { ConsumerBooking } from '../consumer/types'
import { ActiveBookingCard, HistoryBookingRow } from '../shared/bookingCards'
import ConsentModal from './ConsentModal'
import TelegramLoginButton from './TelegramLoginButton'
import { logout, useWebAuth } from './auth'
import { CONSUMER_BOT_URL, PALETTE } from './branding'
import { TG_DARK_VARS } from './tgDarkVars'
import { WebApiError, cancelBookingWeb, getMyBookingsWeb } from './webApi'

const HISTORY_STATUSES = new Set(['picked_up', 'expired', 'cancelled'])

/**
 * plenty.by cabinet — the same account as the Telegram mini-app
 * (identical telegram_id), so tickets/history here and in the bot are
 * one list. Reuses the shared booking-ticket components under a scoped
 * dark --tg-* override.
 */
export default function AccountPage() {
  const auth = useWebAuth()
  const [showConsent, setShowConsent] = useState(false)

  useEffect(() => {
    if (auth.status === 'authenticated' && auth.consentRequired) {
      setShowConsent(true)
    }
  }, [auth.status, auth.consentRequired])

  if (auth.status === 'restoring') {
    return (
      <CenteredNote>Загружаем…</CenteredNote>
    )
  }

  if (auth.status === 'anonymous') {
    return (
      <div
        className="px-5 py-16 mx-auto text-center"
        style={{ maxWidth: 420, color: PALETTE.text }}
      >
        <div style={{ fontSize: 48 }} aria-hidden="true">
          👨‍🍳
        </div>
        <h1 className="mt-3 font-bold" style={{ fontSize: 24 }}>
          Личный кабинет
        </h1>
        <p
          className="mt-3"
          style={{ fontSize: 14, lineHeight: 1.5, color: PALETTE.textMuted }}
        >
          Войди через Telegram — брони с сайта и из бота живут в одном
          аккаунте.
        </p>
        <div className="mt-6">
          <TelegramLoginButton />
        </div>
      </div>
    )
  }

  return (
    <div style={TG_DARK_VARS}>
      {showConsent && (
        <ConsentModal
          onDone={() => setShowConsent(false)}
          onClose={() => setShowConsent(false)}
        />
      )}
      <CabinetBody consentPending={auth.consentRequired} />
    </div>
  )
}

function CabinetBody({ consentPending }: { consentPending: boolean }) {
  const navigate = useNavigate()
  const [bookings, setBookings] = useState<ConsumerBooking[] | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [tick, setTick] = useState(0)
  const [nowMs, setNowMs] = useState(() => Date.now())
  const [pendingCancelId, setPendingCancelId] = useState<string | null>(null)
  const [cancelling, setCancelling] = useState(false)

  useEffect(() => {
    const id = window.setInterval(() => setNowMs(Date.now()), 60_000)
    return () => window.clearInterval(id)
  }, [])

  useEffect(() => {
    if (consentPending) return
    let cancelled = false
    setError(null)
    getMyBookingsWeb()
      .then((res) => {
        if (!cancelled) setBookings(res)
      })
      .catch((err: unknown) => {
        if (cancelled) return
        if (err instanceof WebApiError && err.code === 'consent_required') {
          setError('Сначала прими условия сервиса')
          return
        }
        setError('Не удалось загрузить брони')
      })
    return () => {
      cancelled = true
    }
  }, [tick, consentPending])

  const refetch = useCallback(() => setTick((t) => t + 1), [])

  const { active, history } = useMemo(() => {
    const a: ConsumerBooking[] = []
    const h: ConsumerBooking[] = []
    for (const b of bookings ?? []) {
      if (b.status === 'pending') a.push(b)
      else if (HISTORY_STATUSES.has(b.status)) h.push(b)
    }
    a.sort((x, y) => y.created_at.localeCompare(x.created_at))
    h.sort((x, y) => y.created_at.localeCompare(x.created_at))
    return { active: a, history: h }
  }, [bookings])

  const handleCancelConfirm = async () => {
    if (!pendingCancelId || cancelling) return
    setCancelling(true)
    try {
      await cancelBookingWeb(pendingCancelId)
      setPendingCancelId(null)
      refetch()
    } catch {
      setError('Не удалось отменить бронь')
    } finally {
      setCancelling(false)
    }
  }

  return (
    <div
      className="px-5 py-8 mx-auto"
      style={{ maxWidth: 560, color: PALETTE.text }}
    >
      <div className="flex items-center justify-between">
        <h1 className="font-bold" style={{ fontSize: 24 }}>
          Мои брони
        </h1>
        <button
          type="button"
          onClick={logout}
          style={{ fontSize: 13, color: PALETTE.textMuted }}
        >
          Выйти
        </button>
      </div>

      <a
        href={CONSUMER_BOT_URL}
        className="mt-4 block rounded-xl px-4 py-3 active:opacity-80 transition"
        style={{
          backgroundColor: PALETTE.bgElevated,
          border: `1px solid ${PALETTE.hairline}`,
          fontSize: 13,
          lineHeight: 1.45,
          color: PALETTE.textMuted,
          transitionDuration: '150ms',
        }}
      >
        💬 Открой бота <span style={{ color: PALETTE.gold }}>@plentybox_bot</span>,
        чтобы получать код и статусы брони прямо в Telegram
      </a>

      {error && (
        <p className="mt-6 text-center" style={{ fontSize: 14, color: '#ff6b5e' }}>
          {error}{' '}
          <button
            type="button"
            onClick={refetch}
            style={{ color: PALETTE.gold, textDecoration: 'underline' }}
          >
            Повторить
          </button>
        </p>
      )}

      {!error && bookings === null && (
        <p className="mt-8 text-center" style={{ fontSize: 14, color: PALETTE.textMuted }}>
          Загружаем брони…
        </p>
      )}

      {!error && bookings !== null && active.length === 0 && history.length === 0 && (
        <div className="mt-10 text-center">
          <div style={{ fontSize: 44 }} aria-hidden="true">
            📋
          </div>
          <p className="mt-2 font-medium" style={{ fontSize: 15 }}>
            Пока нет броней
          </p>
          <p className="mt-1" style={{ fontSize: 13, color: PALETTE.textMuted }}>
            Найди свой первый Шеф-бокс на карте
          </p>
          <button
            type="button"
            onClick={() => navigate('/boxes')}
            className="mt-5 px-6 py-3 rounded-xl font-semibold active:opacity-80 transition"
            style={{
              backgroundColor: PALETTE.gold,
              color: '#171310',
              fontSize: 14,
              transitionDuration: '150ms',
            }}
          >
            Смотреть боксы
          </button>
        </div>
      )}

      {active.length > 0 && (
        <section className="mt-6">
          <SectionHeader title="Активные" count={active.length} />
          <div className="flex flex-col gap-3 mt-2">
            {active.map((b) => (
              <ActiveBookingCard
                key={b.id}
                booking={b}
                nowMs={nowMs}
                onCancel={() => setPendingCancelId(b.id)}
              />
            ))}
          </div>
        </section>
      )}

      {history.length > 0 && (
        <section className="mt-6">
          <SectionHeader title="История" count={history.length} />
          <div className="flex flex-col gap-2 mt-2">
            {history.map((b) => (
              <HistoryBookingRow key={b.id} booking={b} />
            ))}
          </div>
        </section>
      )}

      {pendingCancelId && (
        <ConfirmModal
          title="Отменить бронь?"
          message="После отмены слот вернётся другим покупателям."
          confirmLabel="Отменить бронь"
          cancelLabel="Не отменять"
          danger
          busy={cancelling}
          onConfirm={handleCancelConfirm}
          onCancel={() => {
            if (!cancelling) setPendingCancelId(null)
          }}
        />
      )}
    </div>
  )
}

function SectionHeader({ title, count }: { title: string; count: number }) {
  return (
    <div className="flex items-center justify-between px-1">
      <h2
        className="font-semibold uppercase tracking-wide"
        style={{ fontSize: 12, color: PALETTE.textMuted }}
      >
        {title}
      </h2>
      <span className="tabular-nums" style={{ fontSize: 12, color: PALETTE.textMuted }}>
        {count}
      </span>
    </div>
  )
}

function CenteredNote({ children }: { children: string }) {
  return (
    <div
      className="py-24 text-center"
      style={{ fontSize: 14, color: PALETTE.textMuted }}
    >
      {children}
    </div>
  )
}
