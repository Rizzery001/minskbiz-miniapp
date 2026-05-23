import { useSyncExternalStore } from 'react'

const CONSUMER_ROLE_KEY = 'krana_consumer_role'
const SELLER_ROLE_KEY = 'krana_role'
const listeners = new Set<() => void>()

function readFromUrl(): boolean {
  if (typeof window === 'undefined') return false
  try {
    return new URLSearchParams(window.location.search).get('role') === 'consumer'
  } catch {
    return false
  }
}

function readFromStorage(): boolean {
  if (typeof window === 'undefined') return false
  try {
    return window.sessionStorage.getItem(CONSUMER_ROLE_KEY) === '1'
  } catch {
    return false
  }
}

/**
 * True when the mini-app is operating in consumer mode (Mystery Box
 * flow). The ?role=consumer URL param promotes the session permanently
 * (sessionStorage) so the mode survives in-app navigation. Promotion
 * also drops the opposite seller flag — a single tab can't be both
 * seller and consumer simultaneously.
 */
export function isConsumerRole(): boolean {
  if (readFromUrl()) {
    try {
      window.sessionStorage.setItem(CONSUMER_ROLE_KEY, '1')
      window.sessionStorage.removeItem(SELLER_ROLE_KEY)
    } catch {
      // ignore storage errors
    }
    return true
  }
  return readFromStorage()
}

function subscribe(fn: () => void): () => void {
  listeners.add(fn)
  return () => {
    listeners.delete(fn)
  }
}

export function useConsumerRole(): boolean {
  return useSyncExternalStore(subscribe, isConsumerRole, isConsumerRole)
}
