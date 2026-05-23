import { useEffect, useState } from 'react'

const DEFAULT_TIMEOUT_MS = 3000

/**
 * Tiny ephemeral toast — sits above sheets/modals so it remains visible
 * regardless of what's open underneath. Pair with the useToast() hook:
 *
 *   const [toast, showToast] = useToast()
 *   <Toast message={toast} />
 *   showToast('Бронь отменена')
 */
export default function Toast({ message }: { message: string | null }) {
  if (!message) return null
  return (
    <div
      role="status"
      aria-live="polite"
      className="tg-shadow-md fixed left-1/2 -translate-x-1/2 z-[2100] px-4 py-2 rounded-full"
      style={{
        top: 'calc(env(safe-area-inset-top, 0px) + 12px)',
        maxWidth: 'calc(100% - 32px)',
        backgroundColor: 'var(--tg-bg)',
        color: 'var(--tg-text)',
        border: '1px solid var(--tg-hairline)',
        fontSize: 13,
        lineHeight: 1.35,
        textAlign: 'center',
      }}
    >
      {message}
    </div>
  )
}

export function useToast(
  autoDismissMs: number = DEFAULT_TIMEOUT_MS,
): [string | null, (msg: string) => void] {
  const [msg, setMsg] = useState<string | null>(null)
  useEffect(() => {
    if (!msg) return
    const t = window.setTimeout(() => setMsg(null), autoDismissMs)
    return () => window.clearTimeout(t)
  }, [msg, autoDismissMs])
  return [msg, setMsg]
}
