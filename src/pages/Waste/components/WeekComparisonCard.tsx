import { TrendingDown, TrendingUp, Minus } from 'lucide-react'
import type { WasteWeekComparison } from '../types'

interface Props {
  data: WasteWeekComparison
}

function formatByn(value: number): string {
  return `${value.toFixed(2)} BYN`
}

export default function WeekComparisonCard({ data }: Props) {
  const { current_week_byn, prev_week_byn, delta_pct } = data
  const improving = delta_pct < 0
  const flat = Math.abs(delta_pct) < 0.1
  const Icon = flat ? Minus : improving ? TrendingDown : TrendingUp
  const deltaColor = flat
    ? 'var(--tg-hint)'
    : improving
      ? '#10b981'
      : '#ef4444'
  const deltaLabel = flat
    ? '0%'
    : `${improving ? '' : '+'}${delta_pct.toFixed(1)}%`

  return (
    <section
      className="tg-shadow-sm rounded-xl"
      style={{
        backgroundColor: 'var(--tg-section-bg, var(--tg-bg))',
        padding: 16,
      }}
    >
      <h2
        className="mb-3"
        style={{ fontSize: 13, color: 'var(--tg-hint)' }}
      >
        Эта неделя
      </h2>
      <div className="flex items-baseline justify-between gap-3">
        <div>
          <div
            className="font-bold tabular-nums"
            style={{ fontSize: 24, lineHeight: 1.1 }}
          >
            {formatByn(current_week_byn)}
          </div>
          <div
            className="mt-1 tabular-nums"
            style={{ fontSize: 12, color: 'var(--tg-hint)' }}
          >
            Прошлая: {formatByn(prev_week_byn)}
          </div>
        </div>
        <div
          className="inline-flex items-center gap-1 px-2 py-1 rounded-full"
          style={{
            backgroundColor: `${deltaColor}22`,
            color: deltaColor,
          }}
        >
          <Icon size={14} strokeWidth={2.5} aria-hidden="true" />
          <span
            className="font-semibold tabular-nums"
            style={{ fontSize: 13 }}
          >
            {deltaLabel}
          </span>
        </div>
      </div>
      {!flat && (
        <p
          className="mt-2"
          style={{ fontSize: 12, color: 'var(--tg-hint)' }}
        >
          {improving
            ? 'Списаний меньше, чем неделей раньше'
            : 'Списаний больше, чем неделей раньше'}
        </p>
      )}
    </section>
  )
}
