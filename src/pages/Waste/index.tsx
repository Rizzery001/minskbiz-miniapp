import { useCallback, useEffect, useState } from 'react'
import { ApiError, apiGet } from '../../api/client'
import EmptyState from './EmptyState'
import LoadingState from './LoadingState'

interface WasteStatsSummary {
  total_records?: number
  [key: string]: unknown
}

const MIN_RECORDS_FOR_STATS = 7

export default function Waste() {
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState<WasteStatsSummary | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [demoMode, setDemoMode] = useState(false)

  const fetchStats = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const data = await apiGet<WasteStatsSummary>('/waste/stats')
      setStats(data ?? null)
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

  if (loading) return <LoadingState />
  if (error)
    return (
      <EmptyState reason="error" message={error} onRetry={() => void fetchStats()} />
    )

  const hasEnoughData = (stats?.total_records ?? 0) >= MIN_RECORDS_FOR_STATS

  if (!hasEnoughData && !demoMode) {
    return <EmptyState reason="empty" onShowDemo={() => setDemoMode(true)} />
  }

  return (
    <div
      className="h-full overflow-y-auto p-4"
      style={{ color: 'var(--tg-text)' }}
    >
      <h1 className="text-xl font-bold mb-1">📊 Аналитика списаний</h1>
      {demoMode && (
        <div
          className="inline-block text-[11px] rounded px-2 py-1 mt-1 mb-3"
          style={{
            backgroundColor: 'rgba(245, 158, 11, 0.15)',
            color: 'var(--tg-text)',
          }}
        >
          Демо-данные • не ваши реальные
        </div>
      )}
      <p
        className="text-sm leading-relaxed"
        style={{ color: 'var(--tg-hint)' }}
      >
        {demoMode
          ? 'Демо-данные для вашего типа заведения. Реальные графики появятся, когда у вас будет 7+ списаний.'
          : 'Графики появятся в Phase 2.'}
      </p>
    </div>
  )
}
