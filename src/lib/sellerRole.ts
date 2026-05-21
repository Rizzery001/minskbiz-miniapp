import { useSyncExternalStore } from 'react'

const SELLER_ROLE_KEY = 'krana_role'
const listeners = new Set<() => void>()

function readFromUrl(): boolean {
  if (typeof window === 'undefined') return false
  try {
    return new URLSearchParams(window.location.search).get('role') === 'seller'
  } catch {
    return false
  }
}

function readFromStorage(): boolean {
  if (typeof window === 'undefined') return false
  try {
    return window.sessionStorage.getItem(SELLER_ROLE_KEY) === '1'
  } catch {
    return false
  }
}

/**
 * True when the mini-app is operating in seller mode. The ?role=seller
 * URL param promotes the session permanently (sessionStorage) so the
 * mode survives in-app navigation. Cleared via exitSellerRole().
 */
export function isSellerRole(): boolean {
  if (readFromUrl()) {
    try {
      window.sessionStorage.setItem(SELLER_ROLE_KEY, '1')
    } catch {
      // ignore storage errors
    }
    return true
  }
  return readFromStorage()
}

export function exitSellerRole(): void {
  try {
    window.sessionStorage.removeItem(SELLER_ROLE_KEY)
  } catch {
    // ignore
  }
  // Also drop the ?role=seller bit from the URL so a subsequent
  // isSellerRole() doesn't immediately re-promote.
  try {
    const url = new URL(window.location.href)
    if (url.searchParams.get('role') === 'seller') {
      url.searchParams.delete('role')
      window.history.replaceState({}, '', url.toString())
    }
  } catch {
    // ignore history errors
  }
  for (const fn of listeners) fn()
}

function subscribe(fn: () => void): () => void {
  listeners.add(fn)
  return () => {
    listeners.delete(fn)
  }
}

export function useSellerRole(): boolean {
  return useSyncExternalStore(subscribe, isSellerRole, isSellerRole)
}
