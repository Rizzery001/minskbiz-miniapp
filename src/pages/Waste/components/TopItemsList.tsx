import type { WasteTopItem } from '../types'

interface Props {
  items: WasteTopItem[]
  totalAmount: number
  limit?: number
}

export default function TopItemsList({
  items,
  totalAmount,
  limit = 10,
}: Props) {
  if (items.length === 0) return null
  const sorted = [...items]
    .sort((a, b) => b.amount_byn - a.amount_byn)
    .slice(0, limit)
  const max = sorted[0]?.amount_byn ?? 0

  return (
    <ul className="flex flex-col gap-3">
      {sorted.map((item) => {
        const widthPct = max > 0 ? (item.amount_byn / max) * 100 : 0
        const sharePct =
          totalAmount > 0 ? (item.amount_byn / totalAmount) * 100 : 0
        return (
          <li key={item.name}>
            <div className="flex items-baseline justify-between gap-2">
              <span
                className="font-medium truncate"
                style={{ fontSize: 13 }}
              >
                {item.name}
              </span>
              <span
                className="tabular-nums shrink-0"
                style={{ fontSize: 13, color: 'var(--tg-accent-text)' }}
              >
                {item.amount_byn.toFixed(2)} BYN
              </span>
            </div>
            <div
              className="flex items-center gap-2 mt-1"
              style={{ fontSize: 11, color: 'var(--tg-hint)' }}
            >
              <span className="tabular-nums shrink-0">
                {item.quantity} {item.unit}
              </span>
              <div
                className="flex-1 rounded-full overflow-hidden"
                style={{
                  height: 4,
                  backgroundColor: 'var(--tg-secondary-bg)',
                }}
              >
                <div
                  style={{
                    width: `${widthPct}%`,
                    height: '100%',
                    backgroundColor: 'var(--tg-link)',
                    borderRadius: 999,
                  }}
                />
              </div>
              <span className="tabular-nums shrink-0">
                {sharePct.toFixed(0)}%
              </span>
            </div>
          </li>
        )
      })}
    </ul>
  )
}
