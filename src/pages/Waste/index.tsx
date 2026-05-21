import { useCallback, useEffect, useMemo, useState } from 'react'
import { ApiError, apiGet } from '../../api/client'
import { useUserMe } from '../../api/hooks'
import { getDemoForSubtype } from '../../demo/waste-demo'
import { pluralize } from '../../lib/format'
import EmptyState from './EmptyState'
import LoadingState from './LoadingState'
import { adaptWasteStats } from './adapter'
import { MIN_RECORDS_FOR_STATS } from './constants'
import type { WasteData } from './types'
import ByDayChart from './components/ByDayChart'
import ByReasonChart from './components/ByReasonChart'
import ChartCard from './components/ChartCard'
import TopItemsList from './components/TopItemsList'
import WeekComparisonCard from './components/WeekComparisonCard'

const MIN_RECORDS_FOR_WEEK_COMPARISON = 14

export default function Waste() {
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState<WasteData | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [demoMode, setDemoMode] = useState(false)
  const { data: user } = useUserMe()

  const fetchStats = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const raw = await apiGet<unknown>('/waste/stats')
      setStats(adaptWasteStats(raw))
    } catch (e) {
      const msg =
        e instanceof ApiError
          ? e.message
          : e instanceof Error
            ? e.message
            : 'Не удалось загрузить статистику'
      setError(msg)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void fetchStats()
  }, [fetchStats])

  const realDataReady =
    stats !== null && stats.total_records >= MIN_RECORDS_FOR_STATS

  const demoData = useMemo(
    () => (demoMode ? getDemoForSubtype(user?.subtype) : null),
    [demoMode, user?.subtype],
  )

  if (loading) return <LoadingState />
  if (error) {
    return (
      <EmptyState
        reason="error"
        message={error}
        onRetry={() => void fetchStats()}
      />
    )
  }

  if (!realDataReady && !demoMode) {
    return (
      <EmptyState reason="empty" onShowDemo={() => setDemoMode(true)} />
    )
  }

  const data = demoMode ? demoData : stats
  if (!data) return null

  const showWeekComparison =
    data.total_records >= MIN_RECORDS_FOR_WEEK_COMPARISON &&
    data.week_comparison.prev_week_byn > 0

  return (
    <div
      className="h-full overflow-y-auto"
      style={{ backgroundColor: 'var(--tg-bg)', color: 'var(--tg-text)' }}
    >
      <div className="px-4 pt-4 pb-6 flex flex-col gap-4">
        <header>
          <h1 className="font-semibold" style={{ fontSize: 22, lineHeight: 1.2 }}>
            📊 Аналитика списаний
          </h1>
          <p
            className="mt-1"
            style={{ fontSize: 13, color: 'var(--tg-hint)' }}
          >
            Всего {data.total_records}{' '}
            {pluralize(data.total_records, ['запись', 'записи', 'записей'])} ·{' '}
            <span className="tabular-nums">
              {data.total_amount_byn.toFixed(2)} BYN
            </span>
          </p>
        </header>

        {demoMode && (
          <DemoBanner onExit={() => setDemoMode(false)} />
        )}

        {showWeekComparison && (
          <WeekComparisonCard data={data.week_comparison} />
        )}

        <ChartCard
          title="Списания по дням"
          subtitle="Последние 30 дней"
        >
          <ByDayChart data={data.by_day} />
        </ChartCard>

        <ChartCard title="По причинам">
          <ByReasonChart data={data.by_reason} />
        </ChartCard>

        <ChartCard title="Топ позиций">
          <TopItemsList
            items={data.top_items}
            totalAmount={data.total_amount_byn}
          />
        </ChartCard>
      </div>
    </div>
  )
}

function DemoBanner({ onExit }: { onExit: () => void }) {
  return (
    <div
      className="flex items-center justify-between gap-3 rounded-lg"
      style={{
        backgroundColor: 'rgba(245, 158, 11, 0.15)',
        color: '#92400e',
        padding: '8px 12px',
      }}
    >
      <span style={{ fontSize: 12, lineHeight: 1.3 }}>
        Демо-данные для вашего типа заведения · реальные графики появятся
        после {MIN_RECORDS_FOR_STATS}+ записей
      </span>
      <button
        type="button"
        onClick={onExit}
        className="shrink-0 rounded-md font-medium active:opacity-70 transition-opacity"
        style={{
          padding: '4px 10px',
          backgroundColor: 'rgba(255, 255, 255, 0.5)',
          color: '#92400e',
          fontSize: 12,
          transitionDuration: '150ms',
        }}
      >
        Скрыть
      </button>
    </div>
  )
}
