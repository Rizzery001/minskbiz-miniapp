// Временный stub корзины на localStorage. Полная корзина — День 2.

const CART_KEY = 'minskbiz_cart_v1'

export interface CartItem {
  listingId: string
  addedAt: number
}

function read(): CartItem[] {
  try {
    const raw = localStorage.getItem(CART_KEY)
    if (!raw) return []
    const parsed: unknown = JSON.parse(raw)
    if (!Array.isArray(parsed)) return []
    return parsed.filter(
      (item): item is CartItem =>
        typeof item === 'object' &&
        item !== null &&
        typeof (item as { listingId?: unknown }).listingId === 'string' &&
        typeof (item as { addedAt?: unknown }).addedAt === 'number',
    )
  } catch {
    return []
  }
}

function write(items: CartItem[]): void {
  try {
    localStorage.setItem(CART_KEY, JSON.stringify(items))
  } catch {
    // quota or disabled storage — silently ignore for now
  }
}

export function getCart(): CartItem[] {
  return read()
}

export function addToCart(listingId: string): void {
  const items = read()
  if (items.some((i) => i.listingId === listingId)) return
  items.push({ listingId, addedAt: Date.now() })
  write(items)
}

export function removeFromCart(listingId: string): void {
  write(read().filter((i) => i.listingId !== listingId))
}

export function isInCart(listingId: string): boolean {
  return read().some((i) => i.listingId === listingId)
}
