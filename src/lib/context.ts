import { useState } from 'react'

const CONTEXT_KEY = 'krana_context'

export type AppContext = 'farmers' | 'waste' | 'unified'

function isAppContext(x: unknown): x is AppContext {
  return x === 'farmers' || x === 'waste' || x === 'unified'
}

/**
 * Resolve the app context for buyer-mode tab visibility.
 *
 * Priority: URL `?context=` (writes through to sessionStorage so it
 * survives in-app navigation) → sessionStorage → 'unified' fallback.
 * 'unified' mirrors the pre-existing behaviour (all tabs visible).
 */
export function getAppContext(): AppContext {
  if (typeof window === 'undefined') return 'unified'
  try {
    const fromUrl = new URLSearchParams(window.location.search).get('context')
    if (isAppContext(fromUrl)) {
      try {
        window.sessionStorage.setItem(CONTEXT_KEY, fromUrl)
      } catch {
        // ignore storage errors
      }
      return fromUrl
    }
    const fromStorage = window.sessionStorage.getItem(CONTEXT_KEY)
    if (isAppContext(fromStorage)) return fromStorage
  } catch {
    // ignore
  }
  return 'unified'
}

export function useAppContext(): AppContext {
  const [ctx] = useState(getAppContext)
  return ctx
}
