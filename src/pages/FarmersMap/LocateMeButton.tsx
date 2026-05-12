import { Locate, LoaderCircle } from 'lucide-react'
import { useEffect, useState } from 'react'
import { hapticFeedback } from '../../lib/telegram'

interface Props {
  onLocate: (coords: [number, number]) => void
}

const TIMEOUT_MS = 5000
const TOAST_MS = 3000

export default function LocateMeButton({ onLocate }: Props) {
  const [loading, setLoading] = useState(false)
  const [toast, setToast] = useState<string | null>(null)

  useEffect(() => {
    if (!toast) return
    const t = window.setTimeout(() => setToast(null), TOAST_MS)
    return () => window.clearTimeout(t)
  }, [toast])

  const handleClick = () => {
    if (loading) return
    if (typeof navigator === 'undefined' || !('geolocation' in navigator)) {
      setToast('Геолокация недоступна')
      return
    }
    hapticFeedback.light()
    setLoading(true)
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLoading(false)
        onLocate([pos.coords.latitude, pos.coords.longitude])
      },
      (err) => {
        setLoading(false)
        if (err.code === err.PERMISSION_DENIED) {
          setToast('Геолокация недоступна')
        } else {
          setToast('Не удалось определить местоположение')
        }
      },
      { timeout: TIMEOUT_MS, enableHighAccuracy: false, maximumAge: 30_000 },
    )
  }

  return (
    <>
      <button
        type="button"
        onClick={handleClick}
        aria-label="Найти меня"
        aria-busy={loading}
        className="tg-shadow-md absolute z-[1100] w-12 h-12 rounded-full flex items-center justify-center active:scale-[0.95] active:opacity-80 transition"
        style={{
          bottom: 16,
          right: 16,
          backgroundColor: 'var(--tg-bg)',
          color: 'var(--tg-text)',
          border: '1px solid var(--tg-hairline)',
          transitionDuration: '150ms',
        }}
      >
        {loading ? (
          <LoaderCircle size={22} className="animate-spin" aria-hidden="true" />
        ) : (
          <Locate size={22} aria-hidden="true" />
        )}
      </button>
      {toast && (
        <div
          role="status"
          aria-live="polite"
          className="tg-shadow-md absolute left-1/2 -translate-x-1/2 z-[1200] px-4 py-2 rounded-full text-[13px]"
          style={{
            top: 'calc(env(safe-area-inset-top, 0px) + 12px)',
            backgroundColor: 'var(--tg-bg)',
            color: 'var(--tg-text)',
            border: '1px solid var(--tg-hairline)',
          }}
        >
          {toast}
        </div>
      )}
    </>
  )
}
