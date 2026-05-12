export interface Coordinates {
  lat: number
  lng: number
}

export interface UserMe {
  telegram_id: number
  vertical?: string
  subtype?: string
  language?: string
  location?: Coordinates
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
