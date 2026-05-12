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
