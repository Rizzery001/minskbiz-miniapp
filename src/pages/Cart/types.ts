import type { CartItem } from '../../lib/cart'

export interface OrderResult {
  item: CartItem
  success: boolean
  orderId?: string
  error?: string
}
