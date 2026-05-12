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
