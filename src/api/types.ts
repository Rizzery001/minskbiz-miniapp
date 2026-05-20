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

export type SellerCategory =
  | 'dairy'
  | 'bakery'
  | 'eggs'
  | 'flour'
  | 'meat'
  | 'vegetables'
  | 'fruits'
  | 'other'

export interface SellingPoint {
  label: string
  address?: string | null
  lat: number
  lng: number
  schedule?: string | null
}

export interface Seller {
  seller_id: string
  name: string
  category: SellerCategory | string
  phone: string
  // Legacy fields (kept for backwards compatibility with older sellers
  // that still have a single location).
  location_lat?: number
  location_lng?: number
  location_label?: string | null
  home_address?: string | null
  home_lat?: number | null
  home_lng?: number | null
  selling_points?: SellingPoint[]
}

export interface SellerCreatePayload {
  name: string
  category: SellerCategory
  phone: string
  home_address?: string
  home_lat?: number
  home_lng?: number
  selling_points: SellingPoint[]
}

export interface GeocodeResult {
  label: string
  lat: number
  lng: number
  kind?: string
}

export interface GeocodeResponse {
  results: GeocodeResult[]
}

export interface SellerCreateResponse {
  seller_id: string
  status: 'created'
}

export interface SellerLoginByPhonePayload {
  phone: string
}

export interface SellerLoginByPhoneResponse {
  seller_id: string
  name: string
  status: 'linked'
}
