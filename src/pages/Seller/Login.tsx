import { ChevronLeft } from 'lucide-react'
import { useCallback, useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ApiError, apiPost } from '../../api/client'
import type {
  SellerLoginByPhonePayload,
  SellerLoginByPhoneResponse,
} from '../../api/types'
import { backButton, hapticFeedback } from '../../lib/telegram'
import { isPhoneValid, normalizePhone } from './phone'

type LoginErrorKind = 'not_found' | 'already_claimed' | 'generic'

interface LoginError {
  kind: LoginErrorKind
  message: string
}

function classifyError(err: unknown): LoginError {
  if (err instanceof ApiError) {
    if (err.status === 404 || err.code === 'not_found') {
      return {
        kind: 'not_found',
        message:
          'Не нашли ферму с таким номером. Хотите создать новую?',
      }
    }
    if (
      err.status === 409 ||
      err.code === 'already_claimed_by_other' ||
      err.code === 'already_claimed'
    ) {
      return {
        kind: 'already_claimed',
        message:
          'Эта ферма уже привязана к другому Telegram-аккаунту. Если это ваша ферма — напишите в поддержку.',
      }
    }
    return { kind: 'generic', message: err.message }
  }
  return { kind: 'generic', message: 'Не удалось войти. Попробуйте ещё раз.' }
}

export default function SellerLogin() {
  const navigate = useNavigate()
  const [phone, setPhone] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<LoginError | null>(null)

  const goBack = useCallback(() => navigate('/seller/welcome'), [navigate])

  useEffect(() => {
    backButton.show()
    backButton.onClick(goBack)
    return () => {
      backButton.offClick(goBack)
      backButton.hide()
    }
  }, [goBack])

  const phoneValid = isPhoneValid(phone)
  const canSubmit = phoneValid && !submitting

  const handleSubmit = async () => {
    if (!canSubmit) return
    setSubmitting(true)
    setError(null)
    hapticFeedback.medium()
    const payload: SellerLoginByPhonePayload = {
      phone: normalizePhone(phone),
    }
    try {
      await apiPost<SellerLoginByPhoneResponse>(
        '/me/seller/login_by_phone',
        payload,
      )
      hapticFeedback.success()
      navigate('/seller/cabinet', { replace: true })
    } catch (err: unknown) {
      hapticFeedback.error()
      setError(classifyError(err))
      setSubmitting(false)
    }
  }

  return (
    <div className="p-4">
      <header className="flex items-center gap-2 mb-4">
        <button
          type="button"
          onClick={goBack}
          aria-label="Назад"
          className="rounded-full flex items-center justify-center active:opacity-70 transition"
          style={{
            width: 36,
            height: 36,
            backgroundColor: 'var(--tg-secondary-bg)',
            color: 'var(--tg-text)',
            transitionDuration: '150ms',
          }}
        >
          <ChevronLeft size={20} strokeWidth={2} />
        </button>
        <h1
          className="font-semibold"
          style={{ fontSize: 20, lineHeight: 1.2 }}
        >
          Вход для фермера
        </h1>
      </header>

      <p
        className="mb-5"
        style={{ fontSize: 14, color: 'var(--tg-hint)', lineHeight: 1.45 }}
      >
        Введите номер телефона, который вы указали при регистрации фермы.
      </p>

      <div className="flex flex-col gap-4">
        <div>
          <label
            className="block mb-2 font-medium"
            style={{ fontSize: 14, color: 'var(--tg-text)' }}
          >
            Телефон
          </label>
          <input
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="+375 29 123-45-67"
            inputMode="tel"
            autoComplete="tel"
            className="w-full rounded-lg px-3 py-3 outline-none"
            style={{
              backgroundColor: 'var(--tg-secondary-bg)',
              color: 'var(--tg-text)',
              fontSize: 15,
              border: '1px solid var(--tg-hairline)',
            }}
          />
          {phone.length > 0 && !phoneValid && (
            <p
              className="mt-1"
              style={{
                fontSize: 12,
                color: 'var(--tg-destructive-text, #ff3b30)',
              }}
            >
              Введите номер минимум из 7 цифр
            </p>
          )}
        </div>

        {error && (
          <div
            className="rounded-lg p-3"
            style={{
              backgroundColor:
                error.kind === 'generic'
                  ? 'rgba(239,68,68,0.1)'
                  : 'var(--tg-secondary-bg)',
              color:
                error.kind === 'generic'
                  ? 'var(--tg-destructive-text, #ff3b30)'
                  : 'var(--tg-text)',
              fontSize: 14,
              lineHeight: 1.4,
            }}
          >
            <p>{error.message}</p>
            {error.kind === 'not_found' && (
              <button
                type="button"
                onClick={() => {
                  hapticFeedback.light()
                  navigate('/seller/register')
                }}
                className="mt-2 px-3 py-2 rounded-lg font-medium active:opacity-80 transition"
                style={{
                  backgroundColor: 'var(--tg-button)',
                  color: 'var(--tg-button-text)',
                  fontSize: 13,
                  transitionDuration: '150ms',
                }}
              >
                Создать ферму
              </button>
            )}
          </div>
        )}

        <button
          type="button"
          onClick={handleSubmit}
          disabled={!canSubmit}
          className="w-full py-4 rounded-xl font-medium active:opacity-80 active:scale-[0.98] disabled:opacity-50 transition"
          style={{
            backgroundColor: 'var(--tg-button)',
            color: 'var(--tg-button-text)',
            fontSize: 16,
            transitionDuration: '150ms',
          }}
        >
          {submitting ? 'Входим…' : 'Войти'}
        </button>
      </div>
    </div>
  )
}
