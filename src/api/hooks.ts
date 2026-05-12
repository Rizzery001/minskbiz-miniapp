import { useCallback, useEffect, useState } from 'react'
import { apiGet, ApiError } from './client'
import type { Listing, ListingsResponse, UserMe } from './types'

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
      .then((res) => {
        if (!cancelled) setData(res)
      })
      .catch((err: unknown) => {
        if (cancelled) return
        setError(err instanceof ApiError ? err : new ApiError(0, 'Unknown error'))
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [tick])

  const refetch = useCallback(() => setTick((t) => t + 1), [])

  return { data, loading, error, refetch }
}

export interface ListingsParams {
  lat?: number
  lng?: number
  radius_km?: number
}

export function useListings(
  params: ListingsParams | null,
): AsyncResult<Listing[]> {
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
      setData(null)
      setLoading(false)
      setError(null)
      return
    }

    let cancelled = false
    setLoading(true)
    setError(null)

    apiGet<ListingsResponse>('/listings', {
      lat,
      lng,
      radius_km: radiusKm,
    })
      .then((res) => {
        if (!cancelled) setData(res.items)
      })
      .catch((err: unknown) => {
        if (cancelled) return
        setError(err instanceof ApiError ? err : new ApiError(0, 'Unknown error'))
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [enabled, lat, lng, radiusKm, tick])

  const refetch = useCallback(() => setTick((t) => t + 1), [])

  return { data, loading, error, refetch }
}
