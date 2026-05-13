export interface Coordinates {
  lat: number
  lng: number
}

export interface UserMe {
  telegram_id: number
  vertical?: string
  subtype?: string
  language?: string
  location?: Coordinates | null
}

export interface Listing {
  id: string
  title: string
  category: string
  emoji?: string
  price_per_unit: number
  currency: string
  unit: string
  quantity?: number
  seller_id: string
  seller_name: string
  seller_phone?: string
  location_label?: string
  location_lat: number
  location_lng: number
  available_until?: string
  distance_km?: number
}

export interface ListingsResponse {
  count: number
  items: Listing[]
}

export type OrderStatus = 'new' | 'confirmed' | 'delivered' | 'cancelled' | string

export interface Order {
  id: string
  created_at: string
  updated_at?: string
  status: OrderStatus
  listing_snapshot: Listing
  quantity_requested: number
  unit?: string
  estimated_total?: number | null
  pickup_when?: string | null
  comment?: string | null
}

export interface OrdersResponse {
  count: number
  items: Order[]
}
