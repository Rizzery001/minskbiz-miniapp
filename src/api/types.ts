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

export interface Farmer {
  id: string
  name: string
  phone?: string
}

export interface Listing {
  id: string
  farmer: Farmer
  product: string
  category: string
  price: number
  currency: string
  unit: string
  photo_url?: string
  location: Coordinates
  distance_km?: number
}
