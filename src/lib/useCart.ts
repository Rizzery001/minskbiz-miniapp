import { useSyncExternalStore } from 'react'
import {
  type CartItem,
  getCart,
  getCount,
  getQuantity,
  subscribe,
} from './cart'

export function useCart(): CartItem[] {
  return useSyncExternalStore(subscribe, getCart, getCart)
}

export function useCartCount(): number {
  return useSyncExternalStore(subscribe, getCount, getCount)
}

export function useCartQuantity(listingId: string): number {
  return useSyncExternalStore(
    subscribe,
    () => getQuantity(listingId),
    () => 0,
  )
}
