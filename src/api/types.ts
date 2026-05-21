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
  photo_url?: string | null
  price_per_unit: number
  currency: string
  unit: string
  quantity?: number
  status?: string
  seller_id: string
  seller_name: string
  seller_phone?: string
  // Legacy single-location fields. Still present on older listings; kept
  // optional so we can fall back when pin_* is missing.
  location_label?: string | null
  location_lat?: number
  location_lng?: number
  // Primary pin coordinates returned by the backend — closest selling
  // point to the requesting buyer.
  pin_lat?: number
  pin_lng?: number
  selling_points?: SellingPoint[]
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
  // Populated on seller-facing endpoints (GET /me/orders) — describes
  // who placed the order. Optional because the buyer-facing /orders/my
  // shape omits these.
  buyer_business_name?: string | null
  buyer_phone?: string | null
  cart_id?: string | null
}

export interface OrdersResponse {
  count: number
  items: Order[]
}

export interface OrderActionResponse {
  id: string
  status: OrderStatus
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
  id?: string
  label: string
  address?: string | null
  lat: number
  lng: number
  schedule?: string | null
}

export interface SellingPointsResponse {
  items: SellingPoint[]
}

export interface SellingPointCreatePayload {
  label: string
  address?: string
  lat: number
  lng: number
  schedule?: string
}

export interface SellingPointDeleteResponse {
  id: string
  status: 'deleted'
}

export type ListingStatus = 'active' | 'paused' | 'sold' | string

// Listing shape returned by GET /me/listings — the seller's own catalog.
// Buyer-facing /listings uses the richer `Listing` type above (with
// seller_*, pin_*, location_* etc.); seller endpoints don't need those.
export interface MyListing {
  id: string
  title: string
  category: string
  emoji?: string | null
  photo_url?: string | null
  quantity: number
  unit: string
  price_per_unit: number
  currency: string
  available_until?: string | null
  status: ListingStatus
  created_at: string
  updated_at?: string
}

export interface MyListingsResponse {
  count: number
  items: MyListing[]
}

export interface ListingCreatePayload {
  title: string
  category: SellerCategory | string
  emoji?: string
  quantity: number
  unit: string
  price_per_unit: number
  currency?: string
  available_until?: string
}

export interface ListingUpdatePayload {
  title?: string
  category?: SellerCategory | string
  emoji?: string | null
  quantity?: number
  unit?: string
  price_per_unit?: number
  currency?: string
  available_until?: string | null
  status?: ListingStatus
}

export interface ListingDeleteResponse {
  id: string
  status: 'deleted'
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

export interface SellerUpdatePayload {
  name?: string
  category?: SellerCategory | string
  phone?: string
  // null clears the existing value on the backend.
  home_address?: string | null
  home_lat?: number | null
  home_lng?: number | null
}

export interface SellerUpdateResponse {
  seller_id: string
  status: 'updated'
  fields: string[]
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
