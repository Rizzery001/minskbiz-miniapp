import { useEffect, useMemo } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { backButton } from '../../lib/telegram'
import type { OrderResult } from '../Cart/types'

function isOrderResultArray(x: unknown): x is OrderResult[] {
  if (!Array.isArray(x)) return false
  return x.every((r) => {
    if (typeof r !== 'object' || r === null) return false
    const o = r as Record<string, unknown>
    return (
      typeof o.success === 'boolean' &&
      typeof o.item === 'object' &&
      o.item !== null
    )
  })
}

export default function OrderSuccess() {
  const location = useLocation()
  const navigate = useNavigate()

  const results = useMemo<OrderResult[] | null>(() => {
    const state = location.state
    if (typeof state !== 'object' || state === null) return null
    const r = (state as { results?: unknown }).results
    return isOrderResultArray(r) ? r : null
  }, [location.state])

  useEffect(() => {
    if (results === null) {
      navigate('/cart', { replace: true })
    }
  }, [results, navigate])

  useEffect(() => {
    const handler = () => navigate('/farmers', { replace: true })
    backButton.show()
    backButton.onClick(handler)
    return () => {
      backButton.offClick(handler)
      backButton.hide()
    }
  }, [navigate])

  if (results === null) return null

  const successes = results.filter((r) => r.success)
  const failures = results.filter((r) => !r.success)
  const allOk = failures.length === 0

  return (
    <div
      className="h-full overflow-y-auto"
      style={{ backgroundColor: 'var(--tg-bg)', color: 'var(--tg-text)' }}
    >
      <div className="px-4 pt-6 pb-6">
        <div className="flex flex-col items-center text-center mb-6">
          <div
            className="w-16 h-16 rounded-full flex items-center justify-center text-3xl mb-3"
            style={{
              backgroundColor: allOk ? '#dcfce7' : '#fef3c7',
              color: allOk ? '#16a34a' : '#b45309',
            }}
            aria-hidden="true"
          >
            {allOk ? '✓' : '⚠'}
          </div>
          <h1 className="text-xl font-semibold">
            {allOk ? 'Заказы отправлены' : 'Часть заказов не прошла'}
          </h1>
          {allOk && (
            <p className="text-sm mt-1" style={{ color: 'var(--tg-hint)' }}>
              Продавцы свяжутся с вами через Telegram
            </p>
          )}
        </div>

        {allOk ? (
          <div className="flex flex-col gap-2">
            {successes.map((r) => (
              <SuccessRow key={r.item.listing_id} result={r} />
            ))}
          </div>
        ) : (
          <>
            {successes.length > 0 && (
              <section className="mb-5">
                <h2
                  className="text-xs uppercase tracking-wide mb-2 px-1"
                  style={{ color: 'var(--tg-hint)' }}
                >
                  Отправлены
                </h2>
                <div className="flex flex-col gap-2">
                  {successes.map((r) => (
                    <SuccessRow key={r.item.listing_id} result={r} />
                  ))}
                </div>
              </section>
            )}
            <section>
              <h2
                className="text-xs uppercase tracking-wide mb-2 px-1"
                style={{ color: 'var(--tg-hint)' }}
              >
                Не удалось
              </h2>
              <div className="flex flex-col gap-2">
                {failures.map((r) => (
                  <FailureRow key={r.item.listing_id} result={r} />
                ))}
              </div>
            </section>
          </>
        )}

        <div className="flex flex-col gap-2 mt-6">
          {!allOk && (
            <button
              type="button"
              onClick={() => navigate('/cart')}
              className="w-full py-3 rounded-lg text-sm font-medium active:opacity-80"
              style={{
                backgroundColor: 'var(--tg-button)',
                color: 'var(--tg-button-text)',
              }}
            >
              Вернуться в корзину
            </button>
          )}
          <button
            type="button"
            onClick={() => navigate('/farmers', { replace: true })}
            className="w-full py-3 rounded-lg text-sm font-medium active:opacity-80"
            style={{
              backgroundColor: allOk ? 'var(--tg-button)' : 'var(--tg-secondary-bg)',
              color: allOk ? 'var(--tg-button-text)' : 'var(--tg-text)',
            }}
          >
            {allOk ? 'Вернуться к карте' : 'К карте'}
          </button>
        </div>
      </div>
    </div>
  )
}

function SuccessRow({ result }: { result: OrderResult }) {
  const l = result.item.listing_snapshot
  return (
    <div
      className="rounded-xl p-3"
      style={{ backgroundColor: 'var(--tg-secondary-bg)' }}
    >
      <div className="flex items-baseline justify-between gap-2">
        <h3 className="text-sm font-medium leading-tight truncate">{l.title}</h3>
        <span
          className="text-xs whitespace-nowrap"
          style={{ color: 'var(--tg-hint)' }}
        >
          ×{result.item.quantity}
        </span>
      </div>
      <p className="text-xs mt-0.5" style={{ color: 'var(--tg-hint)' }}>
        {l.seller_name}
      </p>
      {result.orderId && (
        <p className="text-xs mt-1" style={{ color: 'var(--tg-hint)' }}>
          Заказ #{result.orderId}
        </p>
      )}
    </div>
  )
}

function FailureRow({ result }: { result: OrderResult }) {
  const l = result.item.listing_snapshot
  return (
    <div
      className="rounded-xl p-3"
      style={{ backgroundColor: '#fef2f2', color: '#7f1d1d' }}
    >
      <div className="flex items-baseline justify-between gap-2">
        <h3 className="text-sm font-medium leading-tight truncate">{l.title}</h3>
        <span className="text-xs whitespace-nowrap">×{result.item.quantity}</span>
      </div>
      <p className="text-xs mt-0.5" style={{ opacity: 0.8 }}>
        {l.seller_name}
      </p>
      {result.error && <p className="text-xs mt-1">⚠ {result.error}</p>}
    </div>
  )
}
