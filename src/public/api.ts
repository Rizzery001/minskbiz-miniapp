/**
 * Public storefront API — unauthenticated read-only endpoints
 * (/api/v1/public/*). No initData header on purpose: these must work
 * for any plain-browser visitor.
 */

export interface PublicBox {
  id: string
  title?: string | null
  price_byn: number
  slots_left: number
  slots_total: number
  pickup_window_start: string
  pickup_window_end: string
  tier?: string | null
  cover_id?: string | null
  business_name: string
  address: string
  business_location?: { lat: number; lng: number } | null
  distance_km?: number | null
}

const baseUrl = import.meta.env.VITE_API_BASE

export async function fetchPublicBoxes(): Promise<PublicBox[]> {
  if (!baseUrl) throw new Error('VITE_API_BASE is not configured')
  // No lat/lng/radius: the backend defaults to the whole of Minsk. The
  // public site never asks for geolocation.
  const res = await fetch(`${baseUrl}/public/boxes`, {
    headers: { Accept: 'application/json' },
  })
  if (!res.ok) throw new Error(`public boxes: HTTP ${res.status}`)
  const body = (await res.json()) as { items?: PublicBox[] }
  return body.items ?? []
}
