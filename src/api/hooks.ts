import { useCallback, useEffect, useState } from 'react'
import { apiGet, ApiError } from './client'
import type {
  Listing,
  ListingsResponse,
  MyListing,
  MyListingsResponse,
  Order,
  OrdersResponse,
  Seller,
  SellingPoint,
  SellingPointsResponse,
  UserMe,
} from './types'

export interface AsyncResult<T> {
  data: T | null
  loading: boolean
  error: ApiError | null
  refetch: () => void
}

export function useUserMe(): AsyncResult<UserMe> {
  const [data, setData] = useState<UserMe | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<ApiError | null>(null)
  const [tick, setTick] = useState(0)

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    setError(null)
    apiGet<UserMe>('/user/me')
      .then((res) => { if (!cancelled) setData(res) })
      .catch((err: unknown) => {
        if (cancelled) return
        setError(err instanceof ApiError ? err : new ApiError(0, 'Unknown error'))
      })
      .finally(() => { if (!cancelled) setLoading(false) })
    return () => { cancelled = true }
  }, [tick])

  const refetch = useCallback(() => setTick((t) => t + 1), [])
  return { data, loading, error, refetch }
}

export interface ListingsParams {
  lat?: number
  lng?: number
  radius_km?: number
}

export function useListings(params: ListingsParams | null): AsyncResult<Listing[]> {
  const [data, setData] = useState<Listing[] | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<ApiError | null>(null)
  const [tick, setTick] = useState(0)

  const lat = params?.lat
  const lng = params?.lng
  const radiusKm = params?.radius_km
  const enabled = params !== null

  useEffect(() => {
    if (!enabled) {
      setData(null); setLoading(false); setError(null); return
    }
    let cancelled = false
    setLoading(true); setError(null)
    apiGet<ListingsResponse>('/listings', { lat, lng, radius_km: radiusKm })
      .then((res) => { if (!cancelled) setData(res?.items ?? []) })
      .catch((err: unknown) => {
        if (cancelled) return
        setError(err instanceof ApiError ? err : new ApiError(0, 'Unknown error'))
      })
      .finally(() => { if (!cancelled) setLoading(false) })
    return () => { cancelled = true }
  }, [enabled, lat, lng, radiusKm, tick])

  const refetch = useCallback(() => setTick((t) => t + 1), [])
  return { data, loading, error, refetch }
}

export interface SellerResult {
  data: Seller | null
  loading: boolean
  notFound: boolean
  error: ApiError | null
  refetch: () => void
}

export function useSeller(enabled: boolean): SellerResult {
  const [data, setData] = useState<Seller | null>(null)
  const [loading, setLoading] = useState(enabled)
  const [notFound, setNotFound] = useState(false)
  const [error, setError] = useState<ApiError | null>(null)
  const [tick, setTick] = useState(0)

  useEffect(() => {
    if (!enabled) {
      setData(null); setLoading(false); setNotFound(false); setError(null)
      return
    }
    let cancelled = false
    setLoading(true); setError(null); setNotFound(false)
    apiGet<Seller>('/me/seller')
      .then((res) => { if (!cancelled) setData(res) })
      .catch((err: unknown) => {
        if (cancelled) return
        if (err instanceof ApiError && err.status === 404) {
          setNotFound(true)
          return
        }
        setError(err instanceof ApiError ? err : new ApiError(0, 'Unknown error'))
      })
      .finally(() => { if (!cancelled) setLoading(false) })
    return () => { cancelled = true }
  }, [enabled, tick])

  const refetch = useCallback(() => setTick((t) => t + 1), [])
  return { data, loading, notFound, error, refetch }
}

export function useSellingPoints(enabled: boolean): AsyncResult<SellingPoint[]> {
  const [data, setData] = useState<SellingPoint[] | null>(null)
  const [loading, setLoading] = useState(enabled)
  const [error, setError] = useState<ApiError | null>(null)
  const [tick, setTick] = useState(0)

  useEffect(() => {
    if (!enabled) {
      setData(null); setLoading(false); setError(null); return
    }
    let cancelled = false
    setLoading(true); setError(null)
    apiGet<SellingPointsResponse>('/me/selling-points')
      .then((res) => { if (!cancelled) setData(res?.items ?? []) })
      .catch((err: unknown) => {
        if (cancelled) return
        setError(err instanceof ApiError ? err : new ApiError(0, 'Unknown error'))
      })
      .finally(() => { if (!cancelled) setLoading(false) })
    return () => { cancelled = true }
  }, [enabled, tick])

  const refetch = useCallback(() => setTick((t) => t + 1), [])
  return { data, loading, error, refetch }
}

export function useMyListings(enabled: boolean): AsyncResult<MyListing[]> {
  const [data, setData] = useState<MyListing[] | null>(null)
  const [loading, setLoading] = useState(enabled)
  const [error, setError] = useState<ApiError | null>(null)
  const [tick, setTick] = useState(0)

  useEffect(() => {
    if (!enabled) {
      setData(null); setLoading(false); setError(null); return
    }
    let cancelled = false
    setLoading(true); setError(null)
    apiGet<MyListingsResponse>('/me/listings')
      .then((res) => { if (!cancelled) setData(res?.items ?? []) })
      .catch((err: unknown) => {
        if (cancelled) return
        setError(err instanceof ApiError ? err : new ApiError(0, 'Unknown error'))
      })
      .finally(() => { if (!cancelled) setLoading(false) })
    return () => { cancelled = true }
  }, [enabled, tick])

  const refetch = useCallback(() => setTick((t) => t + 1), [])
  return { data, loading, error, refetch }
}

// Seller-side: GET /me/orders → all orders placed against this seller.
// Separate from useMyOrders (buyer-side /orders/my) so we don't collide
// with the existing buyer Profile flow.
export function useSellerOrders(enabled: boolean): AsyncResult<Order[]> {
  const [data, setData] = useState<Order[] | null>(null)
  const [loading, setLoading] = useState(enabled)
  const [error, setError] = useState<ApiError | null>(null)
  const [tick, setTick] = useState(0)

  useEffect(() => {
    if (!enabled) {
      setData(null); setLoading(false); setError(null); return
    }
    let cancelled = false
    setLoading(true); setError(null)
    apiGet<OrdersResponse>('/me/orders', { limit: 50 })
      .then((res) => { if (!cancelled) setData(res?.items ?? []) })
      .catch((err: unknown) => {
        if (cancelled) return
        setError(err instanceof ApiError ? err : new ApiError(0, 'Unknown error'))
      })
      .finally(() => { if (!cancelled) setLoading(false) })
    return () => { cancelled = true }
  }, [enabled, tick])

  const refetch = useCallback(() => setTick((t) => t + 1), [])
  return { data, loading, error, refetch }
}

export interface MyOrdersParams {
  limit?: number
  status?: string
}

export function useMyOrders(params: MyOrdersParams = {}): AsyncResult<Order[]> {
  const [data, setData] = useState<Order[] | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<ApiError | null>(null)
  const [tick, setTick] = useState(0)

  const limit = params.limit
  const status = params.status

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    setError(null)
    apiGet<OrdersResponse>('/orders/my', { limit, status })
      .then((res) => { if (!cancelled) setData(res?.items ?? []) })
      .catch((err: unknown) => {
        if (cancelled) return
        setError(err instanceof ApiError ? err : new ApiError(0, 'Unknown error'))
      })
      .finally(() => { if (!cancelled) setLoading(false) })
    return () => { cancelled = true }
  }, [limit, status, tick])

  const refetch = useCallback(() => setTick((t) => t + 1), [])
  return { data, loading, error, refetch }
}
