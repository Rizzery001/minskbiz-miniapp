import {
  Bar,
  BarChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import type { WasteByDay } from '../types'

interface Props {
  data: WasteByDay[]
}

function shortDate(iso: string): string {
  const day = iso.slice(8, 10)
  const month = iso.slice(5, 7)
  return `${day}.${month}`
}

interface TooltipPayload {
  payload: WasteByDay
}

function CustomTooltip({
  active,
  payload,
}: {
  active?: boolean
  payload?: TooltipPayload[]
}) {
  if (!active || !payload || payload.length === 0) return null
  const entry = payload[0]
  if (!entry) return null
  const row = entry.payload
  return (
    <div
      className="rounded-lg tg-shadow-md"
      style={{
        backgroundColor: 'var(--tg-bg)',
        color: 'var(--tg-text)',
        border: '1px solid var(--tg-hairline)',
        padding: '6px 10px',
        fontSize: 12,
      }}
    >
      <div className="font-medium">{shortDate(row.date)}</div>
      <div className="tabular-nums" style={{ color: 'var(--tg-hint)' }}>
        {row.amount_byn.toFixed(2)} BYN · {row.count} зап.
      </div>
    </div>
  )
}

export default function ByDayChart({ data }: Props) {
  if (data.length === 0) return null
  return (
    <ResponsiveContainer width="100%" height={180}>
      <BarChart data={data} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
        <XAxis
          dataKey="date"
          tickFormatter={shortDate}
          interval="preserveStartEnd"
          minTickGap={24}
          tick={{ fontSize: 10, fill: 'var(--tg-hint)' }}
          axisLine={false}
          tickLine={false}
        />
        <YAxis
          tick={{ fontSize: 10, fill: 'var(--tg-hint)' }}
          axisLine={false}
          tickLine={false}
          width={48}
        />
        <Tooltip
          cursor={{ fill: 'var(--tg-secondary-bg)' }}
          content={<CustomTooltip />}
        />
        <Bar
          dataKey="amount_byn"
          fill="var(--tg-link)"
          radius={[3, 3, 0, 0]}
          maxBarSize={14}
        />
      </BarChart>
    </ResponsiveContainer>
  )
}
