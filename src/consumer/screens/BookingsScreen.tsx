import { Map as MapIcon } from 'lucide-react'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import ConfirmModal from '../../components/ConfirmModal'
import ErrorState from '../../components/ErrorState'
import { hapticFeedback } from '../../lib/telegram'
import {
  ConsumerBotNotConfiguredError,
  cancelBooking,
  getMyBookings,
} from '../api'
import BotNotConfiguredScreen from '../components/BotNotConfiguredScreen'
import Toast, { useToast } from '../components/Toast'
import { ActiveBookingCard, HistoryBookingRow } from '../../shared/bookingCards'
import type { ConsumerBooking } from '../types'

const HISTORY_STATUSES = new Set(['picked_up', 'expired', 'cancelled', 'rejected'])

export default function BookingsScreen() {
  const navigate = useNavigate()
  const [bookings, setBookings] = useState<ConsumerBooking[] | null>(null)
  const [loading, setLoading] = useState(true)
  const [botNotConfigured, setBotNotConfigured] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [tick, setTick] = useState(0)
  const [pendingCancelId, setPendingCancelId] = useState<string | null>(null)
  const [cancelling, setCancelling] = useState(false)
  const [toast, showToast] = useToast()
  // Minute tick drives the live countdown on active tickets.
  const [nowMs, setNowMs] = useState(() => Date.now())

  useEffect(() => {
    const id = window.setInterval(() => setNowMs(Date.now()), 60_000)
    return () => window.clearInterval(id)
  }, [])

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    setError(null)
    setBotNotConfigured(false)
    getMyBookings()
      .then((res) => {
        if (cancelled) return
        setBookings(res)
      })
      .catch((err: unknown) => {
        if (cancelled) return
        if (err instanceof ConsumerBotNotConfiguredError) {
          setBotNotConfigured(true)
          return
        }
        setError(err instanceof Error ? err.message : 'Не удалось загрузить')
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [tick])

  const refetch = useCallback(() => setTick((t) => t + 1), [])

  const { active, history } = useMemo(() => {
    const a: ConsumerBooking[] = []
    const h: ConsumerBooking[] = []
    for (const b of bookings ?? []) {
      if (b.status === 'pending' || b.status === 'confirmed') a.push(b)
      else if (HISTORY_STATUSES.has(b.status)) h.push(b)
    }
    // Newest first.
    a.sort((x, y) => y.created_at.localeCompare(x.created_at))
    h.sort((x, y) => y.created_at.localeCompare(x.created_at))
    return { active: a, history: h }
  }, [bookings])

  const handleCancelConfirm = async () => {
    if (!pendingCancelId || cancelling) return
    setCancelling(true)
    try {
      await cancelBooking(pendingCancelId)
      hapticFeedback.success()
      showToast('Бронь отменена')
      setPendingCancelId(null)
      refetch()
    } catch (err: unknown) {
      hapticFeedback.error()
      const msg = err instanceof Error ? err.message : 'Не удалось отменить'
      showToast(msg)
    } finally {
      setCancelling(false)
    }
  }

  if (botNotConfigured) {
    return <BotNotConfiguredScreen />
  }

  if (loading && bookings === null) {
    return (
      <div
        className="h-full flex items-center justify-center"
        style={{ color: 'var(--tg-hint)', fontSize: 13 }}
      >
        Загружаем брони…
      </div>
    )
  }

  if (error) {
    return (
      <div
        className="h-full flex items-center justify-center"
        style={{ backgroundColor: 'var(--tg-bg)' }}
      >
        <ErrorState
          title="Не удалось загрузить"
          message={error}
          onRetry={refetch}
        />
      </div>
    )
  }

  const empty = active.length === 0 && history.length === 0

  if (empty) {
    return (
      <div
        className="h-full flex flex-col items-center justify-center text-center px-6"
        style={{ color: 'var(--tg-text)' }}
      >
        <div style={{ fontSize: 48 }} aria-hidden="true">
          📋
        </div>
        <p
          className="mt-3 font-medium"
          style={{ fontSize: 15, lineHeight: 1.35 }}
        >
          Пока нет броней
        </p>
        <p
          className="mt-1"
          style={{
            fontSize: 13,
            color: 'var(--tg-hint)',
            lineHeight: 1.4,
            maxWidth: 260,
          }}
        >
          Найди свой первый Шеф-бокс на карте
        </p>
        <button
          type="button"
          onClick={() => navigate('/')}
          className="mt-5 inline-flex items-center justify-center gap-2 px-5 py-3 rounded-lg font-semibold active:opacity-80 active:scale-[0.98] transition"
          style={{
            backgroundColor: 'var(--tg-button)',
            color: 'var(--tg-button-text)',
            fontSize: 14,
            transitionDuration: '150ms',
          }}
        >
          <MapIcon size={16} aria-hidden="true" />
          <span>На карту</span>
        </button>
      </div>
    )
  }

  return (
    <div className="h-full overflow-y-auto px-4 pt-4 pb-6">
      {active.length > 0 && (
        <section className="mb-5">
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
        <section>
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

      <Toast message={toast} />
    </div>
  )
}

function SectionHeader({ title, count }: { title: string; count: number }) {
  return (
    <div className="flex items-center justify-between px-1">
      <h2
        className="font-semibold uppercase tracking-wide"
        style={{ fontSize: 12, color: 'var(--tg-hint)' }}
      >
        {title}
      </h2>
      <span
        className="tabular-nums"
        style={{ fontSize: 12, color: 'var(--tg-hint)' }}
      >
        {count}
      </span>
    </div>
  )
}

