export interface LatLng {
  lat: number
  lng: number
}

export interface ConsumerBox {
  id: string
  title?: string | null
  business_name: string
  address: string
  business_location: LatLng
  distance_km?: number | null
  price_byn: number
  original_price_byn?: number | null
  // Pickup window — ISO datetimes for today. The UI extracts HH:MM
  // for display ("сегодня 18:00 – 20:00").
  pickup_window_start: string
  pickup_window_end: string
  description?: string | null
  slots_left: number
  slots_total: number
}

export interface ConsumerBoxesResponse {
  count: number
  items: ConsumerBox[]
}

export type ConsumerBookingStatus =
  | 'pending'
  | 'picked_up'
  | 'expired'
  | 'cancelled'

export interface ConsumerBookingBoxSnapshot {
  id?: string
  title?: string | null
  business_name: string
  address: string
  price_byn: number
}

export interface ConsumerBooking {
  id: string
  code: string
  status: ConsumerBookingStatus
  created_at: string
  pickup_window_start: string
  pickup_window_end: string
  box: ConsumerBookingBoxSnapshot
}

export interface ConsumerBookingsResponse {
  count: number
  items: ConsumerBooking[]
}

export interface ConsumerProfile {
  telegram_id: number
  location?: LatLng | null
}
