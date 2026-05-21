import { useEffect } from 'react'
import { backButton } from '../lib/telegram'

interface Props {
  title: string
  message?: string
  confirmLabel: string
  cancelLabel?: string
  danger?: boolean
  busy?: boolean
  onConfirm: () => void
  onCancel: () => void
}

/**
 * Lightweight centred confirm modal — replaces window.confirm() for
 * destructive actions where a polished UI matters. Hooks into the
 * Telegram BackButton so a "back" gesture dismisses the modal instead
 * of leaving the screen behind it.
 */
export default function ConfirmModal({
  title,
  message,
  confirmLabel,
  cancelLabel = 'Отмена',
  danger = false,
  busy = false,
  onConfirm,
  onCancel,
}: Props) {
  useEffect(() => {
    backButton.show()
    backButton.onClick(onCancel)
    return () => {
      backButton.offClick(onCancel)
      backButton.hide()
    }
  }, [onCancel])

  useEffect(() => {
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = prev
    }
  }, [])

  const confirmBg = danger
    ? 'var(--tg-destructive-text, #ff3b30)'
    : 'var(--tg-button)'
  const confirmFg = danger ? '#ffffff' : 'var(--tg-button-text)'

  return (
    <>
      <div
        onClick={busy ? undefined : onCancel}
        className="fixed inset-0 z-[1900]"
        style={{ backgroundColor: 'rgba(0,0,0,0.55)' }}
        aria-hidden="true"
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className="fixed left-1/2 top-1/2 z-[2000] -translate-x-1/2 -translate-y-1/2 rounded-2xl tg-shadow-lg"
        style={{
          width: 'calc(100% - 32px)',
          maxWidth: 320,
          backgroundColor: 'var(--tg-bg)',
          color: 'var(--tg-text)',
          padding: 20,
        }}
      >
        <h3
          className="font-semibold"
          style={{ fontSize: 17, lineHeight: 1.3 }}
        >
          {title}
        </h3>
        {message && (
          <p
            className="mt-2"
            style={{ fontSize: 14, color: 'var(--tg-hint)', lineHeight: 1.4 }}
          >
            {message}
          </p>
        )}
        <div className="mt-4 flex gap-2">
          <button
            type="button"
            onClick={onCancel}
            disabled={busy}
            className="flex-1 py-3 rounded-lg font-medium active:opacity-70 disabled:opacity-40 transition"
            style={{
              backgroundColor: 'var(--tg-secondary-bg)',
              color: 'var(--tg-text)',
              fontSize: 14,
              transitionDuration: '150ms',
            }}
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={busy}
            className="flex-1 py-3 rounded-lg font-medium active:opacity-80 active:scale-[0.98] disabled:opacity-50 transition"
            style={{
              backgroundColor: confirmBg,
              color: confirmFg,
              fontSize: 14,
              transitionDuration: '150ms',
            }}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </>
  )
}
