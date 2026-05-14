export interface WasteByDay {
  date: string
  amount_byn: number
  count: number
}

export interface WasteByReason {
  reason: string
  reason_label: string
  amount_byn: number
  count: number
}

export interface WasteTopItem {
  name: string
  amount_byn: number
  quantity: number
  unit: string
}

export interface WasteWeekComparison {
  current_week_byn: number
  prev_week_byn: number
  delta_pct: number
}

export interface WasteData {
  total_records: number
  total_amount_byn: number
  by_day: WasteByDay[]
  by_reason: WasteByReason[]
  top_items: WasteTopItem[]
  week_comparison: WasteWeekComparison
}
