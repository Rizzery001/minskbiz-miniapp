import { Check, X } from 'lucide-react'
import { useCallback, useMemo, useState } from 'react'
import { ApiError, apiPost } from '../../api/client'
import { useSellerOrders } from '../../api/hooks'
import type { Order, OrderActionResponse } from '../../api/types'
import { formatRelativeTime } from '../../lib/format'
import { hapticFeedback } from '../../lib/telegram'

type TabKey = 'new' | 'confirmed' | 'cancelled'

interface TabDef {
  key: TabKey
  label: string
  empty: string
}

const TABS: TabDef[] = [
  { key: 'new', label: 'Ожидают', empty: 'Пока нет ожидающих заказов' },
  { key: 'confirmed', label: 'Принятые', empty: 'Пока нет принятых заказов' },
  {
    key: 'cancelled',
    label: 'Отклонённые',
    empty: 'Пока нет отклонённых заказов',
  },
]

export default function OrdersSection() {
  const { data, loading, error, refetch } = useSellerOrders(true)
  const [activeTab, setActiveTab] = useState<TabKey>('new')
  const [actionId, setActionId] = useState<string | null>(null)
  const [actionError, setActionError] = useState<string | null>(null)

  const orders = data ?? []

  const byStatus = useMemo(() => {
    const groups: Record<TabKey, Order[]> = {
      new: [],
      confirmed: [],
      cancelled: [],
    }
    for (const o of orders) {
      if (o.status === 'new') groups.new.push(o)
      else if (o.status === 'confirmed') groups.confirmed.push(o)
      else if (o.status === 'cancelled') groups.cancelled.push(o)
    }
    // Backend likely already sorts by created_at desc; sort defensively.
    for (const k of Object.keys(groups) as TabKey[]) {
      groups[k].sort((a, b) => {
        const da = Date.parse(a.created_at) || 0
        const db = Date.parse(b.created_at) || 0
        return db - da
      })
    }
    return groups
  }, [orders])

  const newCount = byStatus.new.length

  const runAction = useCallback(
    async (order: Order, kind: 'accept' | 'reject') => {
      if (actionId) return
      if (kind === 'reject') {
        const ok = window.confirm('Отклонить заказ?')
        if (!ok) return
      }
      hapticFeedback.medium()
      setActionId(order.id)
      setActionError(null)
      try {
        await apiPost<OrderActionResponse>(
          `/me/orders/${encodeURIComponent(order.id)}/${kind}`,
        )
        hapticFeedback.success()
        refetch()
      } catch (err: unknown) {
        hapticFeedback.error()
        const msg =
          err instanceof ApiError
            ? describeOrderActionError(err, kind)
            : kind === 'accept'
              ? 'Не удалось принять заказ. Попробуйте ещё раз.'
              : 'Не удалось отклонить заказ. Попробуйте ещё раз.'
        setActionError(msg)
      } finally {
        setActionId(null)
      }
    },
    [actionId, refetch],
  )

  const currentList = byStatus[activeTab]
  const currentTab = TABS.find((t) => t.key === activeTab)!

  return (
    <section className="mt-5" aria-label="Мои заказы">
      <h2
        className="font-semibold mb-2"
        style={{ fontSize: 16, color: 'var(--tg-text)' }}
      >
        📦 Мои заказы
      </h2>

      <div className="flex gap-2 mb-3 overflow-x-auto scrollbar-hide">
        {TABS.map((t) => {
          const active = t.key === activeTab
          const showBadge = t.key === 'new' && newCount > 0
          return (
            <button
              key={t.key}
              type="button"
              onClick={() => {
                hapticFeedback.light()
                setActiveTab(t.key)
              }}
              className="shrink-0 rounded-full whitespace-nowrap active:opacity-70 active:scale-[0.97] transition"
              style={{
                padding: '6px 12px',
                backgroundColor: active
                  ? 'var(--tg-link)'
                  : 'var(--tg-secondary-bg)',
                color: active ? '#ffffff' : 'var(--tg-text)',
                fontSize: 13,
                fontWeight: active ? 500 : 400,
                transitionDuration: '150ms',
              }}
            >
              {t.label}
              {showBadge && ` (${newCount})`}
            </button>
          )
        })}
      </div>

      {loading && orders.length === 0 && (
        <p
          className="py-2"
          style={{ fontSize: 13, color: 'var(--tg-hint)' }}
        >
          Загрузка заказов…
        </p>
      )}

      {error && (
        <div
          className="rounded-lg p-3 mb-3"
          style={{
            backgroundColor: 'rgba(239,68,68,0.1)',
            color: 'var(--tg-destructive-text, #ff3b30)',
            fontSize: 14,
          }}
        >
          <div>{error.message}</div>
          <button
            type="button"
            onClick={refetch}
            className="mt-2 active:opacity-70 transition"
            style={{
              color: 'var(--tg-link)',
              fontSize: 13,
              transitionDuration: '150ms',
            }}
          >
            Повторить
          </button>
        </div>
      )}

      {!loading && !error && currentList.length === 0 && (
        <p
          style={{ fontSize: 13, color: 'var(--tg-hint)', lineHeight: 1.4 }}
        >
          {currentTab.empty}
        </p>
      )}

      <div className="flex flex-col gap-3">
        {currentList.map((order) => (
          <OrderCard
            key={order.id}
            order={order}
            busy={actionId === order.id}
            onAccept={() => runAction(order, 'accept')}
            onReject={() => runAction(order, 'reject')}
          />
        ))}
      </div>

      {actionError && (
        <p
          className="mt-2"
          style={{
            fontSize: 13,
            color: 'var(--tg-destructive-text, #ff3b30)',
          }}
        >
          {actionError}
        </p>
      )}
    </section>
  )
}

interface OrderCardProps {
  order: Order
  busy: boolean
  onAccept: () => void
  onReject: () => void
}

function OrderCard({ order, busy, onAccept, onReject }: OrderCardProps) {
  const listing = order.listing_snapshot
  const emoji = listing.emoji ?? '📦'
  const qty = order.quantity_requested
  const unit = order.unit ?? listing.unit
  const price = listing.price_per_unit
  const currency = listing.currency
  const total =
    typeof order.estimated_total === 'number' ? order.estimated_total : qty * price
  const buyerName = order.buyer_business_name?.trim() || 'Покупатель'
  const phone = order.buyer_phone?.trim()
  const phoneHref = phone ? `tel:${phone.replace(/\s+/g, '')}` : null
  const createdRelative = formatRelativeTime(order.created_at)
  const isNew = order.status === 'new'
  const isConfirmed = order.status === 'confirmed'
  const isCancelled = order.status === 'cancelled'

  return (
    <article
      className="tg-shadow-sm rounded-xl"
      style={{
        backgroundColor: 'var(--tg-section-bg, var(--tg-bg))',
        padding: 14,
        border: '1px solid var(--tg-hairline)',
      }}
    >
      {(isConfirmed || isCancelled) && (
        <div className="mb-2">
          <StatusPill
            label={isConfirmed ? 'Принят' : 'Отклонён'}
          />
        </div>
      )}

      <header className="flex items-start gap-2">
        <div
          className="shrink-0 flex items-center justify-center"
          style={{
            width: 40,
            height: 40,
            borderRadius: 12,
            backgroundColor: 'var(--tg-secondary-bg)',
            fontSize: 22,
            lineHeight: 1,
          }}
          aria-hidden="true"
        >
          {emoji}
        </div>
        <div className="min-w-0 flex-1">
          <h3
            className="font-medium leading-tight truncate"
            style={{ fontSize: 15, color: 'var(--tg-text)' }}
          >
            {listing.title}
          </h3>
          {createdRelative && (
            <p
              className="mt-0.5"
              style={{ fontSize: 12, color: 'var(--tg-hint)' }}
            >
              {createdRelative}
            </p>
          )}
        </div>
      </header>

      <dl className="mt-3 flex flex-col gap-1">
        <Row
          label="Сумма"
          value={
            <span className="tabular-nums">
              {formatQty(qty)} {unit} × {price.toFixed(2)} {currency} ={' '}
              <span style={{ color: 'var(--tg-accent-text)', fontWeight: 500 }}>
                {total.toFixed(2)} {currency}
              </span>
            </span>
          }
        />
        <Row label="Покупатель" value={buyerName} />
        {phone && (
          <Row
            label="Телефон"
            value={
              phoneHref ? (
                <a
                  href={phoneHref}
                  className="active:opacity-70 transition"
                  style={{
                    color: 'var(--tg-link)',
                    transitionDuration: '150ms',
                  }}
                >
                  {phone}
                </a>
              ) : (
                <span>{phone}</span>
              )
            }
          />
        )}
        {order.pickup_when && (
          <Row label="Самовывоз" value={order.pickup_when} />
        )}
      </dl>

      {order.comment && (
        <p
          className="mt-2"
          style={{
            fontSize: 13,
            color: 'var(--tg-hint)',
            fontStyle: 'italic',
            lineHeight: 1.4,
          }}
        >
          💬 {order.comment}
        </p>
      )}

      {isNew && (
        <div className="mt-3 flex gap-2">
          <button
            type="button"
            onClick={onAccept}
            disabled={busy}
            className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-lg font-medium active:opacity-80 active:scale-[0.98] disabled:opacity-50 transition"
            style={{
              backgroundColor: 'var(--tg-button)',
              color: 'var(--tg-button-text)',
              fontSize: 14,
              transitionDuration: '150ms',
            }}
          >
            <Check size={16} strokeWidth={2.5} aria-hidden="true" />
            <span>Принять</span>
          </button>
          <button
            type="button"
            onClick={onReject}
            disabled={busy}
            className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-lg font-medium active:opacity-70 disabled:opacity-50 transition"
            style={{
              backgroundColor: 'var(--tg-secondary-bg)',
              color: 'var(--tg-destructive-text, #ff3b30)',
              fontSize: 14,
              transitionDuration: '150ms',
            }}
          >
            <X size={16} strokeWidth={2.5} aria-hidden="true" />
            <span>Отклонить</span>
          </button>
        </div>
      )}
    </article>
  )
}

function StatusPill({ label }: { label: string }) {
  return (
    <span
      className="inline-flex items-center rounded-full whitespace-nowrap"
      style={{
        padding: '2px 8px',
        backgroundColor: 'var(--tg-secondary-bg)',
        color: 'var(--tg-hint)',
        fontSize: 11,
        fontWeight: 500,
        lineHeight: 1.4,
      }}
    >
      {label}
    </span>
  )
}

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-baseline justify-between gap-3">
      <dt style={{ fontSize: 13, color: 'var(--tg-hint)' }}>{label}</dt>
      <dd
        className="text-right min-w-0"
        style={{ fontSize: 13, color: 'var(--tg-text)' }}
      >
        {value}
      </dd>
    </div>
  )
}

function formatQty(value: number): string {
  if (!Number.isFinite(value)) return String(value)
  if (Number.isInteger(value)) return value.toFixed(0)
  return value.toFixed(2).replace(/\.?0+$/, '')
}

function describeOrderActionError(
  err: ApiError,
  kind: 'accept' | 'reject',
): string {
  if (err.status === 403 || err.code === 'forbidden') {
    return 'У вас нет доступа к этому заказу'
  }
  if (err.status === 404 || err.code === 'not_found') {
    return 'Заказ не найден'
  }
  if (err.status === 409 || err.code === 'already_processed') {
    return 'Заказ уже обработан'
  }
  if (err.message) return err.code ? `${err.message} (${err.code})` : err.message
  return kind === 'accept'
    ? 'Не удалось принять заказ. Попробуйте ещё раз.'
    : 'Не удалось отклонить заказ. Попробуйте ещё раз.'
}
