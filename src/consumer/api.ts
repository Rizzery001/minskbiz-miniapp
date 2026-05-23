import { ApiError, apiGet, apiPost } from '../api/client'
import {
  mockCancelBooking,
  mockCreateBooking,
  mockGetBookings,
  mockGetBox,
  mockGetNearbyBoxes,
  mockGetProfile,
  mockUpdateLocation,
} from './mock'
import type {
  ConsumerBooking,
  ConsumerBookingsResponse,
  ConsumerBox,
  ConsumerBoxesResponse,
  ConsumerProfile,
} from './types'

/**
 * Thrown when the backend returns 503 — meaning the consumer bot
 * (BOX_BOT_TOKEN) is not configured yet. Callers should render a
 * "consumer bot not connected" experience instead of a generic error.
 *
 * In dev builds (`import.meta.env.DEV`), the api wrapper substitutes
 * mock data instead of throwing — see src/consumer/mock.ts. That way
 * the UI is testable before the bot exists.
 */
export class ConsumerBotNotConfiguredError extends Error {
  code = 'BOT_NOT_CONFIGURED' as const
  constructor() {
    super('consumer_bot_not_configured')
    this.name = 'ConsumerBotNotConfiguredError'
  }
}

async function call<T>(
  fn: () => Promise<T>,
  mock?: () => T | Promise<T>,
): Promise<T> {
  try {
    return await fn()
  } catch (err) {
    if (err instanceof ApiError && err.status === 503) {
      if (import.meta.env.DEV && mock) {
        return await mock()
      }
      throw new ConsumerBotNotConfiguredError()
    }
    throw err
  }
}

export function getNearbyBoxes(
  lat: number,
  lng: number,
  radius = 10,
): Promise<ConsumerBox[]> {
  return call(
    async () => {
      const res = await apiGet<ConsumerBoxesResponse>(
        '/consumer/boxes/nearby',
        { lat, lng, radius },
      )
      return res?.items ?? []
    },
    () => mockGetNearbyBoxes(lat, lng),
  )
}

export function getBox(boxId: string): Promise<ConsumerBox> {
  return call(
    () => apiGet<ConsumerBox>(`/consumer/boxes/${boxId}`),
    () => mockGetBox(boxId),
  )
}

export function createBooking(boxId: string): Promise<ConsumerBooking> {
  return call(
    () => apiPost<ConsumerBooking>('/consumer/bookings', { box_id: boxId }),
    () => mockCreateBooking(boxId),
  )
}

export function getMyBookings(
  statusFilter?: string,
): Promise<ConsumerBooking[]> {
  return call(
    async () => {
      const params: Record<string, string> | undefined = statusFilter
        ? { status: statusFilter }
        : undefined
      const res = await apiGet<ConsumerBookingsResponse>(
        '/consumer/bookings',
        params,
      )
      return res?.items ?? []
    },
    () => mockGetBookings(),
  )
}

export function cancelBooking(bookingId: string): Promise<ConsumerBooking> {
  return call(
    () => apiPost<ConsumerBooking>(`/consumer/bookings/${bookingId}/cancel`),
    () => mockCancelBooking(bookingId),
  )
}

export function updateMyLocation(
  lat: number,
  lng: number,
): Promise<{ status: 'ok' }> {
  return call(
    () => apiPost<{ status: 'ok' }>('/consumer/me/location', { lat, lng }),
    () => mockUpdateLocation(),
  )
}

export function getMyProfile(): Promise<ConsumerProfile> {
  return call(
    () => apiGet<ConsumerProfile>('/consumer/me'),
    () => mockGetProfile(),
  )
}
