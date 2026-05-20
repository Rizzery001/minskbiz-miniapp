export function formatPrice(
  value: number,
  currency: string,
  unit: string,
): string {
  const num = value.toFixed(2)
  return `${num} ${currency}/${unit}`
}

export function formatDistance(km: number | undefined | null): string {
  if (km === undefined || km === null || Number.isNaN(km)) return ''
  if (km < 1) {
    const meters = Math.max(0, Math.round(km * 1000))
    return `${meters} м`
  }
  return `${km.toFixed(1)} км`
}

export function pluralize(
  n: number,
  forms: [one: string, few: string, many: string],
): string {
  const abs = Math.abs(n) % 100
  const mod10 = abs % 10
  if (abs >= 11 && abs <= 14) return forms[2]
  if (mod10 === 1) return forms[0]
  if (mod10 >= 2 && mod10 <= 4) return forms[1]
  return forms[2]
}

export function parseFreshness(
  availableUntil?: string,
): { isToday: boolean; text: string } {
  if (!availableUntil) return { isToday: false, text: '' }
  const trimmed = availableUntil.trim()
  if (trimmed.length === 0) return { isToday: false, text: '' }
  const TODAY = 'сегодня'
  if (trimmed.toLowerCase().startsWith(TODAY)) {
    return { isToday: true, text: 'Сегодня' + trimmed.slice(TODAY.length) }
  }
  return { isToday: false, text: trimmed }
}

const MINUTE = 60 * 1000
const HOUR = 60 * MINUTE
const DAY = 24 * HOUR

/**
 * Human-friendly Russian relative time, e.g. "5 минут назад", "вчера",
 * "3 дня назад". Falls back to a short date for things older than a week.
 */
export function formatRelativeTime(
  iso: string | null | undefined,
  now: Date = new Date(),
): string {
  if (!iso) return ''
  const ts = Date.parse(iso)
  if (Number.isNaN(ts)) return ''
  const diff = now.getTime() - ts
  if (diff < 30 * 1000) return 'только что'
  if (diff < HOUR) {
    const mins = Math.max(1, Math.round(diff / MINUTE))
    return `${mins} ${pluralize(mins, ['минуту', 'минуты', 'минут'])} назад`
  }
  if (diff < DAY) {
    const hours = Math.max(1, Math.round(diff / HOUR))
    return `${hours} ${pluralize(hours, ['час', 'часа', 'часов'])} назад`
  }
  if (diff < 2 * DAY) return 'вчера'
  if (diff < 7 * DAY) {
    const days = Math.round(diff / DAY)
    return `${days} ${pluralize(days, ['день', 'дня', 'дней'])} назад`
  }
  // Fall back to a short date for older items.
  const d = new Date(ts)
  const dd = String(d.getDate()).padStart(2, '0')
  const mm = String(d.getMonth() + 1).padStart(2, '0')
  const yyyy = d.getFullYear()
  return `${dd}.${mm}.${yyyy}`
}
