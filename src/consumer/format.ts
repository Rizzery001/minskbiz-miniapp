/**
 * Consumer-side display helpers. Lives in its own module to keep
 * MapScreen / sheet code thin and avoid leaking units (BYN, "сегодня",
 * etc.) into multiple call sites.
 */

export function formatPickupWindow(startIso: string, endIso: string): string {
  return `сегодня ${formatTime(startIso)} – ${formatTime(endIso)}`
}

function formatTime(iso: string): string {
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return ''
  const hh = String(d.getHours()).padStart(2, '0')
  const mm = String(d.getMinutes()).padStart(2, '0')
  return `${hh}:${mm}`
}

export function formatPriceByn(value: number): string {
  return `${value.toFixed(0)} BYN`
}

export function discountPercent(price: number, original: number): number {
  if (!Number.isFinite(price) || !Number.isFinite(original) || original <= 0) {
    return 0
  }
  if (price >= original) return 0
  return Math.round((1 - price / original) * 100)
}

export function formatDistanceKm(km: number | null | undefined): string {
  if (km === null || km === undefined || !Number.isFinite(km)) return ''
  if (km < 1) {
    const meters = Math.max(0, Math.round(km * 1000))
    return `${meters} м от вас`
  }
  return `${km.toFixed(1)} км от вас`
}
