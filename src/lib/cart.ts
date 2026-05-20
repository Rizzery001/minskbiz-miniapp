import type { Listing } from '../api/types'

const CART_KEY = 'minskbiz.cart.v2'
const CART_EVENT = 'minskbiz:cart-changed'

export interface CartItem {
  listing_id: string
  quantity: number
  listing_snapshot: Listing
}

type Listener = () => void
const listeners = new Set<Listener>()
let cached: CartItem[] = []

function isListing(x: unknown): x is Listing {
  if (typeof x !== 'object' || x === null) return false
  const o = x as Record<string, unknown>
  const hasPin =
    typeof o.pin_lat === 'number' && typeof o.pin_lng === 'number'
  const hasLegacy =
    typeof o.location_lat === 'number' && typeof o.location_lng === 'number'
  return (
    typeof o.id === 'string' &&
    typeof o.title === 'string' &&
    typeof o.category === 'string' &&
    typeof o.price_per_unit === 'number' &&
    typeof o.currency === 'string' &&
    typeof o.unit === 'string' &&
    typeof o.seller_id === 'string' &&
    typeof o.seller_name === 'string' &&
    (hasPin || hasLegacy)
  )
}

function isCartItem(x: unknown): x is CartItem {
  if (typeof x !== 'object' || x === null) return false
  const o = x as Record<string, unknown>
  return (
    typeof o.listing_id === 'string' &&
    typeof o.quantity === 'number' &&
    Number.isFinite(o.quantity) &&
    (o.quantity as number) > 0 &&
    isListing(o.listing_snapshot)
  )
}

function read(): CartItem[] {
  if (typeof localStorage === 'undefined') return []
  try {
    const raw = localStorage.getItem(CART_KEY)
    if (!raw) return []
    const parsed: unknown = JSON.parse(raw)
    if (!Array.isArray(parsed)) return []
    return parsed.filter(isCartItem)
  } catch {
    return []
  }
}

function persist(items: CartItem[]): void {
  if (typeof localStorage === 'undefined') return
  try {
    localStorage.setItem(CART_KEY, JSON.stringify(items))
  } catch {
    // quota or disabled storage — ignore
  }
}

function notify(): void {
  listeners.forEach((l) => l())
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent(CART_EVENT))
  }
}

cached = read()

if (typeof window !== 'undefined') {
  window.addEventListener('storage', (e) => {
    if (e.key !== CART_KEY) return
    cached = read()
    listeners.forEach((l) => l())
  })
}

export function getCart(): CartItem[] {
  return cached
}

export function getCount(): number {
  let total = 0
  for (const item of cached) total += item.quantity
  return total
}

export function getQuantity(listingId: string): number {
  for (const item of cached) {
    if (item.listing_id === listingId) return item.quantity
  }
  return 0
}

export function addToCart(listing: Listing, qty = 1): void {
  if (qty <= 0) return
  const next: CartItem[] = []
  let found = false
  for (const item of cached) {
    if (item.listing_id === listing.id) {
      found = true
      next.push({
        listing_id: item.listing_id,
        quantity: item.quantity + qty,
        listing_snapshot: listing,
      })
    } else {
      next.push(item)
    }
  }
  if (!found) {
    next.push({
      listing_id: listing.id,
      quantity: qty,
      listing_snapshot: listing,
    })
  }
  cached = next
  persist(next)
  notify()
}

export function setQuantity(listingId: string, qty: number): void {
  if (qty <= 0) {
    removeFromCart(listingId)
    return
  }
  const next: CartItem[] = []
  let found = false
  for (const item of cached) {
    if (item.listing_id === listingId) {
      found = true
      next.push({
        listing_id: item.listing_id,
        quantity: qty,
        listing_snapshot: item.listing_snapshot,
      })
    } else {
      next.push(item)
    }
  }
  if (!found) return
  cached = next
  persist(next)
  notify()
}

export function removeFromCart(listingId: string): void {
  const next = cached.filter((i) => i.listing_id !== listingId)
  if (next.length === cached.length) return
  cached = next
  persist(next)
  notify()
}

export function clearCart(): void {
  if (cached.length === 0) return
  cached = []
  persist(cached)
  notify()
}

export function subscribe(listener: Listener): () => void {
  listeners.add(listener)
  return () => {
    listeners.delete(listener)
  }
}
