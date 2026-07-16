/**
 * Web-session auth store for plenty.by. Token lives in localStorage;
 * user snapshot lives in memory and is restored via GET /auth/session
 * on first subscription. useSyncExternalStore keeps every consumer of
 * useWebAuth() in step without a context provider.
 */

import { useSyncExternalStore } from 'react'
import {
  fetchSession,
  getStoredToken,
  loginWithTelegram,
  storeToken,
  type TelegramWidgetUser,
} from './webApi'

export interface WebAuthState {
  /** null = restoring from storage; false = anonymous */
  status: 'restoring' | 'anonymous' | 'authenticated'
  telegramId: number | null
  firstName: string | null
  consentRequired: boolean
}

let state: WebAuthState = {
  status: getStoredToken() ? 'restoring' : 'anonymous',
  telegramId: null,
  firstName: null,
  consentRequired: false,
}

const listeners = new Set<() => void>()
let restoreStarted = false

function setState(next: Partial<WebAuthState>): void {
  state = { ...state, ...next }
  listeners.forEach((fn) => fn())
}

function restore(): void {
  if (restoreStarted) return
  restoreStarted = true
  if (!getStoredToken()) return
  fetchSession()
    .then((info) => {
      setState({
        status: 'authenticated',
        telegramId: info.telegram_id,
        consentRequired: info.consent_required,
      })
    })
    .catch(() => {
      storeToken('')
      setState({ status: 'anonymous', telegramId: null })
    })
}

export async function completeLogin(user: TelegramWidgetUser): Promise<void> {
  const res = await loginWithTelegram(user)
  storeToken(res.token)
  setState({
    status: 'authenticated',
    telegramId: res.telegram_id,
    firstName: res.first_name ?? null,
    consentRequired: res.consent_required,
  })
}

export function markConsentAccepted(): void {
  setState({ consentRequired: false })
}

export function logout(): void {
  storeToken('')
  setState({
    status: 'anonymous',
    telegramId: null,
    firstName: null,
    consentRequired: false,
  })
}

export function useWebAuth(): WebAuthState {
  return useSyncExternalStore(
    (fn) => {
      listeners.add(fn)
      restore()
      return () => listeners.delete(fn)
    },
    () => state,
  )
}
