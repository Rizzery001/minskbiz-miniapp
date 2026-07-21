/**
 * Consumer-side display helpers. Lives in its own module to keep
 * MapScreen / sheet code thin and avoid leaking units (BYN, "сегодня",
 * etc.) into multiple call sites.
 */

export function formatPickupWindow(startIso: string, endIso: string): string {
  const day = dayWord(startIso)
  return `${day} ${formatTime(startIso)} – ${formatTime(endIso)}`
}

function dayWord(iso: string): string {
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return 'сегодня'
  const now = new Date()
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const that = new Date(d.getFullYear(), d.getMonth(), d.getDate())
  const diffDays = Math.round((that.getTime() - today.getTime()) / 86_400_000)
  if (diffDays <= 0) return 'сегодня'
  if (diffDays === 1) return 'завтра'
  const dd = String(d.getDate()).padStart(2, '0')
  const mm = String(d.getMonth() + 1).padStart(2, '0')
  return `${dd}.${mm}`
}

function formatTime(iso: string): string {
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return ''
  const hh = String(d.getHours()).padStart(2, '0')
  const mm = String(d.getMinutes()).padStart(2, '0')
  return `${hh}:${mm}`
}

export function formatPriceByn(value: number): string {
  return `${value.toFixed(0)} р.`
}

export function formatDistanceKm(km: number | null | undefined): string {
  if (km === null || km === undefined || !Number.isFinite(km)) return ''
  if (km < 1) {
    const meters = Math.max(0, Math.round(km * 1000))
    return `${meters} м от вас`
  }
  return `${km.toFixed(1)} км от вас`
}
