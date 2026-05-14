export const REASON_COLORS: Record<string, string> = {
  не_продано: '#f59e0b',
  просрочка: '#ef4444',
  бой: '#8b5cf6',
  брак: '#ec4899',
  пролив: '#3b82f6',
}

export const DEFAULT_REASON_COLOR = '#9ca3af'

export function colorForReason(reason: string): string {
  return REASON_COLORS[reason] ?? DEFAULT_REASON_COLOR
}
