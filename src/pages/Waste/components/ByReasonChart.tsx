import {
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
} from 'recharts'
import type { WasteByReason } from '../types'
import { colorForReason } from './reasonColors'

interface Props {
  data: WasteByReason[]
}

interface TooltipPayload {
  payload: WasteByReason
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
      <div className="font-medium">{row.reason_label}</div>
      <div className="tabular-nums" style={{ color: 'var(--tg-hint)' }}>
        {row.amount_byn.toFixed(2)} BYN · {row.count} зап.
      </div>
    </div>
  )
}

export default function ByReasonChart({ data }: Props) {
  if (data.length === 0) return null
  const total = data.reduce((acc, d) => acc + d.amount_byn, 0)

  return (
    <div className="flex items-center gap-3">
      <div style={{ width: 140, height: 140, flexShrink: 0 }}>
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              dataKey="amount_byn"
              nameKey="reason_label"
              cx="50%"
              cy="50%"
              innerRadius={40}
              outerRadius={68}
              paddingAngle={2}
              stroke="none"
            >
              {data.map((entry) => (
                <Cell
                  key={entry.reason}
                  fill={colorForReason(entry.reason)}
                />
              ))}
            </Pie>
            <Tooltip content={<CustomTooltip />} />
          </PieChart>
        </ResponsiveContainer>
      </div>
      <ul className="flex-1 min-w-0 flex flex-col gap-1.5">
        {data.map((entry) => {
          const pct = total > 0 ? (entry.amount_byn / total) * 100 : 0
          return (
            <li
              key={entry.reason}
              className="flex items-center gap-2"
              style={{ fontSize: 12 }}
            >
              <span
                aria-hidden="true"
                style={{
                  width: 10,
                  height: 10,
                  borderRadius: 3,
                  backgroundColor: colorForReason(entry.reason),
                  flexShrink: 0,
                }}
              />
              <span className="truncate flex-1">{entry.reason_label}</span>
              <span
                className="tabular-nums"
                style={{ color: 'var(--tg-hint)' }}
              >
                {pct.toFixed(0)}%
              </span>
            </li>
          )
        })}
      </ul>
    </div>
  )
}
