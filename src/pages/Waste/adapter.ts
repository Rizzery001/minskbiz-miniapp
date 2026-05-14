import type {
  WasteByDay,
  WasteByReason,
  WasteData,
  WasteTopItem,
  WasteWeekComparison,
} from './types'

function asNumber(value: unknown, fallback = 0): number {
  if (typeof value === 'number' && Number.isFinite(value)) return value
  if (typeof value === 'string') {
    const n = Number(value)
    if (Number.isFinite(n)) return n
  }
  return fallback
}

function asString(value: unknown, fallback = ''): string {
  if (typeof value === 'string') return value
  if (typeof value === 'number') return String(value)
  return fallback
}

function record(value: unknown): Record<string, unknown> | null {
  if (typeof value !== 'object' || value === null) return null
  return value as Record<string, unknown>
}

function adaptByDay(value: unknown): WasteByDay[] {
  if (!Array.isArray(value)) return []
  const out: WasteByDay[] = []
  for (const raw of value) {
    const o = record(raw)
    if (!o) continue
    const date = asString(o.date)
    if (!date) continue
    out.push({
      date,
      amount_byn: asNumber(o.amount_byn ?? o.amount),
      count: asNumber(o.count),
    })
  }
  return out
}

function adaptByReason(value: unknown): WasteByReason[] {
  if (!Array.isArray(value)) return []
  const out: WasteByReason[] = []
  for (const raw of value) {
    const o = record(raw)
    if (!o) continue
    const reason = asString(o.reason)
    if (!reason) continue
    out.push({
      reason,
      reason_label: asString(o.reason_label ?? o.label, reason),
      amount_byn: asNumber(o.amount_byn ?? o.amount),
      count: asNumber(o.count),
    })
  }
  return out
}

function adaptTopItems(value: unknown): WasteTopItem[] {
  if (!Array.isArray(value)) return []
  const out: WasteTopItem[] = []
  for (const raw of value) {
    const o = record(raw)
    if (!o) continue
    const name = asString(o.name ?? o.title)
    if (!name) continue
    out.push({
      name,
      amount_byn: asNumber(o.amount_byn ?? o.amount),
      quantity: asNumber(o.quantity ?? o.qty),
      unit: asString(o.unit, 'шт'),
    })
  }
  return out
}

function adaptWeekComparison(value: unknown): WasteWeekComparison {
  const o = record(value)
  if (!o) return { current_week_byn: 0, prev_week_byn: 0, delta_pct: 0 }
  const current = asNumber(o.current_week_byn ?? o.current)
  const prev = asNumber(o.prev_week_byn ?? o.previous ?? o.prev)
  const delta =
    typeof o.delta_pct === 'number'
      ? o.delta_pct
      : prev > 0
        ? ((current - prev) / prev) * 100
        : 0
  return {
    current_week_byn: current,
    prev_week_byn: prev,
    delta_pct: Math.round(delta * 10) / 10,
  }
}

export function adaptWasteStats(raw: unknown): WasteData | null {
  const o = record(raw)
  if (!o) return null
  const byDay = adaptByDay(o.by_day)
  const byReason = adaptByReason(o.by_reason)
  const topItems = adaptTopItems(o.top_items)
  const weekComparison = adaptWeekComparison(o.week_comparison)
  return {
    total_records: asNumber(o.total_records),
    total_amount_byn: asNumber(o.total_amount_byn ?? o.total_amount),
    by_day: byDay,
    by_reason: byReason,
    top_items: topItems,
    week_comparison: weekComparison,
  }
}
