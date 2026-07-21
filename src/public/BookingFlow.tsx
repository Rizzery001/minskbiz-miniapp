import { useState } from 'react'
import { Link } from 'react-router-dom'
import type { ConsumerBooking } from '../consumer/types'
import ConsentModal from './ConsentModal'
import TelegramLoginButton from './TelegramLoginButton'
import { useWebAuth } from './auth'
import { PALETTE, boxDeepLink } from './branding'
import { WebApiError, createBookingWeb } from './webApi'

type Stage =
  | { kind: 'idle' }
  | { kind: 'login'; boxId: string }
  | { kind: 'consent'; boxId: string }
  | { kind: 'busy'; boxId: string }
  | { kind: 'success'; booking: ConsumerBooking }
  | { kind: 'error'; boxId: string; message: string }

/**
 * On-site booking state machine for the public storefront. The happy
 * path is book → ticket code; anonymous visitors go through the login
 * widget (and the consent gate on first login), then the pending box
 * is booked automatically — no re-tap needed.
 */
export function useBookingFlow() {
  const auth = useWebAuth()
  const [stage, setStage] = useState<Stage>({ kind: 'idle' })

  const book = async (boxId: string) => {
    setStage({ kind: 'busy', boxId })
    try {
      const booking = await createBookingWeb(boxId)
      setStage({ kind: 'success', booking })
    } catch (err: unknown) {
      if (err instanceof WebApiError && err.code === 'consent_required') {
        setStage({ kind: 'consent', boxId })
        return
      }
      if (err instanceof WebApiError && err.status === 401) {
        setStage({ kind: 'login', boxId })
        return
      }
      const message =
        err instanceof WebApiError && err.status === 409
          ? 'Все слоты разобрали 😔'
          : 'Не получилось забронировать, попробуй ещё раз'
      setStage({ kind: 'error', boxId, message })
    }
  }

  const start = (boxId: string) => {
    if (auth.status !== 'authenticated') {
      setStage({ kind: 'login', boxId })
      return
    }
    if (auth.consentRequired) {
      setStage({ kind: 'consent', boxId })
      return
    }
    void book(boxId)
  }

  const close = () => setStage({ kind: 'idle' })

  const modal = (() => {
    switch (stage.kind) {
      case 'login':
        return (
          <FlowShell onClose={close} label="Вход">
            <div style={{ fontSize: 40 }} aria-hidden="true">
              👨‍🍳
            </div>
            <h2 className="mt-2 font-bold" style={{ fontSize: 20 }}>
              Войди, чтобы забронировать
            </h2>
            <p
              className="mt-2"
              style={{ fontSize: 14, lineHeight: 1.5, color: PALETTE.textMuted }}
            >
              Аккаунт один на сайт и Telegram — бронь будет видна и там, и там.
            </p>
            <div className="mt-5">
              <TelegramLoginButton
                onSuccess={() => void book(stage.boxId)}
                onError={() =>
                  setStage({
                    kind: 'error',
                    boxId: stage.boxId,
                    message: 'Не получилось войти, попробуй ещё раз',
                  })
                }
              />
            </div>
            <a
              href={boxDeepLink(stage.boxId)}
              className="block mt-4"
              style={{ fontSize: 13, color: PALETTE.textMuted, textDecoration: 'underline' }}
            >
              или забронировать в Telegram
            </a>
          </FlowShell>
        )
      case 'consent':
        return (
          <ConsentModal
            onDone={() => void book(stage.boxId)}
            onClose={close}
          />
        )
      case 'busy':
        return (
          <FlowShell onClose={close} label="Бронируем">
            <p style={{ fontSize: 15, color: PALETTE.textMuted }}>Бронируем…</p>
          </FlowShell>
        )
      case 'success':
        return (
          <FlowShell onClose={close} label="Бронь подтверждена">
            <div style={{ fontSize: 40 }} aria-hidden="true">
              ✅
            </div>
            <h2 className="mt-2 font-bold" style={{ fontSize: 20 }}>
              Забронировано!
            </h2>
            <div
              className="mt-4 rounded-xl px-4 py-4 tabular-nums"
              style={{
                backgroundColor: PALETTE.bg,
                border: `1px solid ${PALETTE.hairline}`,
                fontFamily: '"SF Mono", ui-monospace, Menlo, Consolas, monospace',
                fontSize: 34,
                fontWeight: 700,
                letterSpacing: '0.16em',
              }}
            >
              {stage.booking.code}
            </div>
            <p className="mt-2" style={{ fontSize: 13, color: PALETTE.textMuted }}>
              Заведение подтвердит заказ к вечеру — статус появится в{' '}
              <Link
                to="/account"
                style={{ color: PALETTE.gold, textDecoration: 'underline' }}
              >
                кабинете
              </Link>
              . Покажи код при получении.
            </p>
            <button
              type="button"
              onClick={close}
              className="mt-5 w-full py-3 rounded-xl font-semibold active:opacity-80 transition"
              style={{
                backgroundColor: PALETTE.gold,
                color: '#171310',
                fontSize: 15,
                transitionDuration: '150ms',
              }}
            >
              Готово
            </button>
          </FlowShell>
        )
      case 'error':
        return (
          <FlowShell onClose={close} label="Ошибка">
            <p style={{ fontSize: 15, lineHeight: 1.5 }}>{stage.message}</p>
            <button
              type="button"
              onClick={close}
              className="mt-5 w-full py-3 rounded-xl font-semibold active:opacity-80 transition"
              style={{
                backgroundColor: PALETTE.bgElevated,
                border: `1px solid ${PALETTE.hairline}`,
                color: PALETTE.text,
                fontSize: 15,
                transitionDuration: '150ms',
              }}
            >
              Закрыть
            </button>
          </FlowShell>
        )
      default:
        return null
    }
  })()

  return { start, modal }
}

function FlowShell({
  children,
  onClose,
  label,
}: {
  children: React.ReactNode
  onClose: () => void
  label: string
}) {
  return (
    <div
      className="fixed inset-0 z-[2000] flex items-center justify-center px-5"
      style={{ backgroundColor: 'rgba(0,0,0,0.65)' }}
      role="dialog"
      aria-modal="true"
      aria-label={label}
      onClick={onClose}
    >
      <div
        className="w-full rounded-2xl px-6 py-7 text-center"
        style={{
          maxWidth: 400,
          backgroundColor: PALETTE.bgElevated,
          color: PALETTE.text,
          border: `1px solid ${PALETTE.hairline}`,
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {children}
      </div>
    </div>
  )
}
