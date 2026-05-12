import { AlertTriangle, CheckCircle2 } from 'lucide-react'
import { Fragment, useEffect, useMemo } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import DemoNotice from '../../components/DemoNotice'
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
      <div className="mx-auto px-4 pt-6 pb-6" style={{ maxWidth: 320 }}>
        <div className="flex flex-col items-center text-center mb-6">
          <div style={{ padding: 24 }}>
            {allOk ? (
              <CheckCircle2
                size={80}
                strokeWidth={1.5}
                color="#34c759"
                aria-hidden="true"
              />
            ) : (
              <AlertTriangle
                size={48}
                strokeWidth={1.75}
                color="#f59e0b"
                aria-hidden="true"
              />
            )}
          </div>
          <h1 className="font-bold" style={{ fontSize: 22, lineHeight: 1.2 }}>
            {allOk ? 'Заказы отправлены' : 'Часть заказов не прошла'}
          </h1>
          {allOk && (
            <p
              className="mt-2"
              style={{
                fontSize: 15,
                color: 'var(--tg-hint)',
                lineHeight: 1.4,
              }}
            >
              Продавцы свяжутся с вами через Telegram
            </p>
          )}
        </div>

        {allOk ? (
          <CompactList results={successes} />
        ) : (
          <>
            {successes.length > 0 && (
              <CompactList results={successes} title="Отправлены" />
            )}
            <div className={successes.length > 0 ? 'mt-4' : ''}>
              <CompactList results={failures} title="Не удалось" />
            </div>
          </>
        )}

        <div className="mt-6">
          <DemoNotice text="Это тестовый режим. Реальный продавец уведомление пока не получает. Когда подключим живых фермеров — заказы будут отправляться им автоматически." />
        </div>

        <div className="mt-4 flex flex-col gap-2">
          {!allOk && (
            <button
              type="button"
              onClick={() => navigate('/cart')}
              className="w-full py-3 rounded-lg font-medium active:opacity-80 active:scale-[0.97] transition"
              style={{
                backgroundColor: 'var(--tg-button)',
                color: 'var(--tg-button-text)',
                fontSize: 15,
                transitionDuration: '150ms',
              }}
            >
              Вернуться в корзину
            </button>
          )}
          <button
            type="button"
            onClick={() => navigate('/farmers', { replace: true })}
            className="w-full py-3 rounded-lg font-medium active:opacity-80 active:scale-[0.97] transition"
            style={{
              backgroundColor: allOk ? 'var(--tg-button)' : 'var(--tg-secondary-bg)',
              color: allOk ? 'var(--tg-button-text)' : 'var(--tg-text)',
              fontSize: 15,
              transitionDuration: '150ms',
            }}
          >
            К карте
          </button>
        </div>
      </div>
    </div>
  )
}

function CompactList({
  results,
  title,
}: {
  results: OrderResult[]
  title?: string
}) {
  if (results.length === 0) return null
  return (
    <section>
      {title && (
        <h2
          className="uppercase tracking-wide mb-2 px-1 text-left"
          style={{ fontSize: 12, color: 'var(--tg-hint)' }}
        >
          {title}
        </h2>
      )}
      <div
        className="tg-shadow-sm rounded-xl overflow-hidden"
        style={{ backgroundColor: 'var(--tg-section-bg, var(--tg-bg))' }}
      >
        {results.map((r, idx) => (
          <Fragment key={r.item.listing_id}>
            {idx > 0 && (
              <div
                className="mx-3"
                style={{ height: 1, backgroundColor: 'var(--tg-hairline)' }}
              />
            )}
            <CompactRow result={r} />
          </Fragment>
        ))}
      </div>
    </section>
  )
}

function CompactRow({ result }: { result: OrderResult }) {
  const l = result.item.listing_snapshot
  return (
    <div className="px-3 py-2.5 text-left">
      <div className="flex items-baseline justify-between gap-2">
        <span
          className="font-medium truncate"
          style={{ fontSize: 13 }}
        >
          {l.title}
        </span>
        <span
          className="shrink-0 tabular-nums"
          style={{ fontSize: 13, color: 'var(--tg-hint)' }}
        >
          ×{result.item.quantity}
        </span>
      </div>
      <div className="flex items-baseline justify-between gap-2 mt-0.5">
        <span
          className="truncate"
          style={{ fontSize: 12, color: 'var(--tg-hint)' }}
        >
          {l.seller_name}
        </span>
        {result.success && result.orderId && (
          <span
            className="shrink-0 tabular-nums"
            style={{ fontSize: 12, color: 'var(--tg-hint)' }}
          >
            #{result.orderId}
          </span>
        )}
        {!result.success && result.error && (
          <span
            className="text-right"
            style={{ fontSize: 12, color: 'var(--tg-destructive-text, #ff3b30)' }}
          >
            {result.error}
          </span>
        )}
      </div>
    </div>
  )
}
