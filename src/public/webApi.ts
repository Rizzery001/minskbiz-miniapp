/**
 * plenty.by web API client — Bearer-session variants of the consumer
 * endpoints plus /auth/*. Kept separate from src/consumer/api.ts (which
 * authenticates with Telegram initData): same wire shapes, different
 * credential.
 */

import type { ConsumerBooking } from '../consumer/types'

const baseUrl = import.meta.env.VITE_API_BASE

const TOKEN_KEY = 'plenty_web_session'

export function getStoredToken(): string {
  try {
    return window.localStorage.getItem(TOKEN_KEY) ?? ''
  } catch {
    return ''
  }
}

export function storeToken(token: string): void {
  try {
    if (token) window.localStorage.setItem(TOKEN_KEY, token)
    else window.localStorage.removeItem(TOKEN_KEY)
  } catch {
    // storage unavailable — session lives for the page only
  }
}

export class WebApiError extends Error {
  status: number
  code?: string

  constructor(status: number, message: string, code?: string) {
    super(message)
    this.name = 'WebApiError'
    this.status = status
    this.code = code
  }
}

export interface AuthResponse {
  token: string
  telegram_id: number
  first_name?: string | null
  consent_required: boolean
  policy_version: string
  privacy_url: string
  terms_url: string
}

export interface SessionInfo {
  telegram_id: number
  consent_required: boolean
  policy_version: string
  privacy_url: string
  terms_url: string
}

/** Payload the Telegram Login Widget hands to data-onauth. */
export interface TelegramWidgetUser {
  id: number
  first_name?: string
  last_name?: string
  username?: string
  photo_url?: string
  auth_date: number
  hash: string
}

async function request<T>(
  path: string,
  init?: RequestInit & { auth?: boolean },
): Promise<T> {
  if (!baseUrl) throw new WebApiError(0, 'VITE_API_BASE is not configured')
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...((init?.headers as Record<string, string> | undefined) ?? {}),
  }
  if (init?.auth) {
    const token = getStoredToken()
    if (token) headers.Authorization = `Bearer ${token}`
  }
  let res: Response
  try {
    res = await fetch(`${baseUrl}${path}`, { ...init, headers })
  } catch {
    throw new WebApiError(0, 'Нет соединения')
  }
  let body: unknown = null
  try {
    body = await res.json()
  } catch {
    // non-JSON body — leave null
  }
  if (!res.ok) {
    const code =
      body && typeof body === 'object' && 'error' in body
        ? String((body as { error: unknown }).error)
        : undefined
    throw new WebApiError(res.status, code ?? `HTTP ${res.status}`, code)
  }
  return body as T
}

// --- auth -------------------------------------------------------------------

export function loginWithTelegram(
  user: TelegramWidgetUser,
): Promise<AuthResponse> {
  return request<AuthResponse>('/auth/telegram', {
    method: 'POST',
    body: JSON.stringify(user),
  })
}

export function fetchSession(): Promise<SessionInfo> {
  return request<SessionInfo>('/auth/session', { auth: true })
}

export function acceptConsent(): Promise<{ status: string }> {
  return request<{ status: string }>('/auth/consent', {
    method: 'POST',
    auth: true,
  })
}

// --- consumer endpoints over the web session --------------------------------

export function getMyBookingsWeb(): Promise<ConsumerBooking[]> {
  return request<{ items?: ConsumerBooking[] }>('/consumer/bookings', {
    auth: true,
  }).then((r) => r.items ?? [])
}

export function cancelBookingWeb(id: string): Promise<ConsumerBooking> {
  return request<ConsumerBooking>(`/consumer/bookings/${id}/cancel`, {
    method: 'POST',
    auth: true,
  })
}

export function createBookingWeb(boxId: string): Promise<ConsumerBooking> {
  return request<ConsumerBooking>('/consumer/bookings', {
    method: 'POST',
    auth: true,
    body: JSON.stringify({ box_id: boxId }),
  })
}
