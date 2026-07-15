import type {
  ConsumerBooking,
  ConsumerBox,
  ConsumerProfile,
} from './types'

/**
 * In-memory dev fallback used when the backend returns 503
 * ("consumer_bot_not_configured"). Gated by import.meta.env.DEV in the
 * api wrapper — never reached in production builds. State lives at
 * module scope so a booking made in MapScreen shows up in
 * BookingsScreen within the same session.
 */

type BoxSeed = {
  id: string
  business_name: string
  address: string
  lat: number
  lng: number
  price: number
  originalPrice: number
  windowStart: string
  windowEnd: string
  description: string
  slots_total: number
}

const BOX_SEEDS: readonly BoxSeed[] = [
  {
    id: 'mock-box-1',
    business_name: 'Кофейня «Утро»',
    address: 'пр. Независимости, 18',
    lat: 53.9006,
    lng: 27.559,
    price: 5,
    originalPrice: 15,
    windowStart: '18:00',
    windowEnd: '20:00',
    description: 'Свежая выпечка из дневного остатка.',
    slots_total: 5,
  },
  {
    id: 'mock-box-2',
    business_name: 'Бистро «Полонез»',
    address: 'ул. Немига, 5',
    lat: 53.9095,
    lng: 27.576,
    price: 7,
    originalPrice: 20,
    windowStart: '19:00',
    windowEnd: '21:00',
    description: 'Остатки горячего цеха.',
    slots_total: 4,
  },
  {
    id: 'mock-box-3',
    business_name: 'Кондитерская «Сладко»',
    address: 'пл. Победы, 3',
    lat: 53.892,
    lng: 27.545,
    price: 4,
    originalPrice: 12,
    windowStart: '17:30',
    windowEnd: '19:30',
    description: '3–4 десерта на выбор.',
    slots_total: 3,
  },
]

const mockBookings: ConsumerBooking[] = []

function todayAt(hhmm: string): string {
  const parts = hhmm.split(':')
  const h = Number(parts[0] ?? 0)
  const m = Number(parts[1] ?? 0)
  const d = new Date()
  d.setHours(h, m, 0, 0)
  return d.toISOString()
}

function haversineKm(
  a: { lat: number; lng: number },
  b: { lat: number; lng: number },
): number {
  const R = 6371
  const toRad = (deg: number) => (deg * Math.PI) / 180
  const dLat = toRad(b.lat - a.lat)
  const dLng = toRad(b.lng - a.lng)
  const lat1 = toRad(a.lat)
  const lat2 = toRad(b.lat)
  const aa =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2
  return 2 * R * Math.asin(Math.sqrt(aa))
}

function slotsLeftFor(boxId: string, total: number): number {
  const used = mockBookings.filter(
    (b) => b.box.id === boxId && b.status === 'pending',
  ).length
  return Math.max(0, total - used)
}

function seedToBox(seed: BoxSeed, fromLat: number, fromLng: number): ConsumerBox {
  return {
    id: seed.id,
    title: 'Шеф-бокс',
    business_name: seed.business_name,
    address: seed.address,
    business_location: { lat: seed.lat, lng: seed.lng },
    distance_km: haversineKm(
      { lat: fromLat, lng: fromLng },
      { lat: seed.lat, lng: seed.lng },
    ),
    price_byn: seed.price,
    original_price_byn: seed.originalPrice,
    pickup_window_start: todayAt(seed.windowStart),
    pickup_window_end: todayAt(seed.windowEnd),
    description: seed.description,
    slots_left: slotsLeftFor(seed.id, seed.slots_total),
    slots_total: seed.slots_total,
  }
}

function generateCode(): string {
  // Crockford-ish alphabet — no 0/O, 1/I/L confusion.
  const ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  let out = ''
  for (let i = 0; i < 6; i++) {
    const idx = Math.floor(Math.random() * ALPHABET.length)
    out += ALPHABET.charAt(idx)
  }
  return out
}

export function mockGetNearbyBoxes(lat: number, lng: number): ConsumerBox[] {
  return BOX_SEEDS.map((seed) => seedToBox(seed, lat, lng))
}

export function mockGetBox(boxId: string): ConsumerBox {
  const seed = BOX_SEEDS.find((s) => s.id === boxId)
  if (!seed) throw new Error('Mock box not found')
  return seedToBox(seed, seed.lat, seed.lng)
}

export function mockCreateBooking(boxId: string): ConsumerBooking {
  const seed = BOX_SEEDS.find((s) => s.id === boxId)
  if (!seed) throw new Error('Mock box not found')
  const booking: ConsumerBooking = {
    id: `mock-booking-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    code: generateCode(),
    status: 'pending',
    created_at: new Date().toISOString(),
    pickup_window_start: todayAt(seed.windowStart),
    pickup_window_end: todayAt(seed.windowEnd),
    box: {
      id: seed.id,
      title: 'Шеф-бокс',
      business_name: seed.business_name,
      address: seed.address,
      price_byn: seed.price,
    },
  }
  mockBookings.unshift(booking)
  return booking
}

export function mockGetBookings(): ConsumerBooking[] {
  return mockBookings.slice()
}

export function mockCancelBooking(bookingId: string): ConsumerBooking {
  const idx = mockBookings.findIndex((b) => b.id === bookingId)
  if (idx === -1) throw new Error('Mock booking not found')
  const existing = mockBookings[idx]
  if (!existing) throw new Error('Mock booking not found')
  const updated: ConsumerBooking = { ...existing, status: 'cancelled' }
  mockBookings[idx] = updated
  return updated
}

export function mockUpdateLocation(): { status: 'ok' } {
  return { status: 'ok' }
}

export function mockGetProfile(): ConsumerProfile {
  return { telegram_id: 0, location: null }
}
