import { useState } from 'react'
import { markConsentAccepted } from './auth'
import { PALETTE } from './branding'
import { acceptConsent } from './webApi'

/**
 * Web mirror of the bot's consent gate: shown after login while the
 * backend answers consent_required for the current POLICY_VERSION.
 */
export default function ConsentModal({
  onDone,
  onClose,
}: {
  onDone: () => void
  onClose: () => void
}) {
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleAccept = async () => {
    if (busy) return
    setBusy(true)
    setError(null)
    try {
      await acceptConsent()
      markConsentAccepted()
      onDone()
    } catch {
      setError('Не получилось сохранить согласие — попробуй ещё раз')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div
      className="fixed inset-0 z-[2000] flex items-center justify-center px-5"
      style={{ backgroundColor: 'rgba(0,0,0,0.65)' }}
      role="dialog"
      aria-modal="true"
      aria-label="Согласие с условиями"
    >
      <div
        className="w-full rounded-2xl px-6 py-7 text-center"
        style={{
          maxWidth: 420,
          backgroundColor: PALETTE.bgElevated,
          color: PALETTE.text,
          border: `1px solid ${PALETTE.hairline}`,
        }}
      >
        <div style={{ fontSize: 40 }} aria-hidden="true">
          🎁
        </div>
        <h2 className="mt-2 font-bold" style={{ fontSize: 20 }}>
          Почти готово
        </h2>
        <p
          className="mt-3"
          style={{ fontSize: 14, lineHeight: 1.5, color: PALETTE.textMuted }}
        >
          Чтобы бронировать боксы, ознакомься с{' '}
          <a
            href="/privacy"
            target="_blank"
            rel="noreferrer"
            style={{ color: PALETTE.gold, textDecoration: 'underline' }}
          >
            Политикой конфиденциальности
          </a>{' '}
          и{' '}
          <a
            href="/terms"
            target="_blank"
            rel="noreferrer"
            style={{ color: PALETTE.gold, textDecoration: 'underline' }}
          >
            Условиями сервиса
          </a>
          .
        </p>
        {error && (
          <p className="mt-3" style={{ fontSize: 13, color: '#ff6b5e' }}>
            {error}
          </p>
        )}
        <button
          type="button"
          onClick={handleAccept}
          disabled={busy}
          aria-busy={busy}
          className="mt-5 w-full py-3 rounded-xl font-semibold active:opacity-80 disabled:opacity-50 transition"
          style={{
            backgroundColor: PALETTE.gold,
            color: '#171310',
            fontSize: 15,
            transitionDuration: '150ms',
          }}
        >
          {busy ? 'Сохраняем…' : '✅ Принимаю и продолжаю'}
        </button>
        <button
          type="button"
          onClick={onClose}
          disabled={busy}
          className="mt-2 w-full py-2.5 rounded-xl active:opacity-70 transition"
          style={{
            color: PALETTE.textMuted,
            fontSize: 14,
            transitionDuration: '150ms',
          }}
        >
          Позже
        </button>
      </div>
    </div>
  )
}
