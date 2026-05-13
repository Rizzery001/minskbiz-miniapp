import { useMemo } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Package, Clock, CheckCircle2, XCircle, RotateCcw, ShoppingCart } from 'lucide-react'
import { useMyOrders } from '../../api/hooks'
import type { Order } from '../../api/types'
import { addToCart } from '../../lib/cart'
import { formatPrice } from '../../lib/format'
import { hapticFeedback } from '../../lib/telegram'
import DemoNotice from '../../components/DemoNotice'
import ErrorState from '../../components/ErrorState'
import { getCategoryStyle } from '../FarmersMap/categoryColors'

type StatusInfo = {
  label: string
  color: string
  bg: string
  icon: typeof Clock
}

function getStatusInfo(status: string): StatusInfo {
  switch (status) {
    case 'new':
      return { label: 'В обработке', color: '#92400e', bg: 'rgba(245,158,11,0.15)', icon: Clock }
    case 'confirmed':
      return { label: 'Подтверждён', color: '#047857', bg: 'rgba(16,185,129,0.15)', icon: CheckCircle2 }
    case 'delivered':
      return { label: 'Получен', color: '#047857', bg: 'rgba(16,185,129,0.15)', icon: CheckCircle2 }
    case 'cancelled':
      return { label: 'Отменён', color: '#991b1b', bg: 'rgba(239,68,68,0.15)', icon: XCircle }
    default:
      return { label: status, color: 'var(--tg-hint)', bg: 'var(--tg-secondary-bg)', icon: Clock }
  }
}

function startOfDay(d: Date): number {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime()
}

function groupLabel(orderDate: Date): string {
  const now = new Date()
  const today = startOfDay(now)
  const yesterday = today - 24 * 60 * 60 * 1000
  const orderDay = startOfDay(orderDate)
  if (orderDay === today) return 'Сегодня'
  if (orderDay === yesterday) return 'Вчера'
  const diff = today - orderDay
  if (diff < 7 * 24 * 60 * 60 * 1000) return 'На этой неделе'
  return 'Раньше'
}

function formatOrderTime(iso: string): string {
  const d = new Date(iso)
  const hh = d.getHours().toString().padStart(2, '0')
  const mm = d.getMinutes().toString().padStart(2, '0')
  return `${hh}:${mm}`
}

function OrderCard({ order, onRepeat }: { order: Order; onRepeat: (o: Order) => void }) {
  const status = getStatusInfo(order.status)
  const StatusIcon = status.icon
  const listing = order.listing_snapshot
  const style = getCategoryStyle(listing.category)
  const emoji = listing.emoji ?? style.emoji

  return (
    <div
      className="p-3 rounded-xl tg-shadow-sm flex gap-3"
      style={{ backgroundColor: 'var(--tg-section-bg, var(--tg-bg))' }}
    >
      <div
        className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl shrink-0"
        style={{ backgroundColor: style.color + '26' }}
      >
        <span aria-hidden="true">{emoji}</span>
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <div className="text-sm font-medium truncate" style={{ color: 'var(--tg-text)' }}>
              {listing.title}
            </div>
            <div className="text-xs truncate" style={{ color: 'var(--tg-hint)' }}>
              {listing.seller_name}
            </div>
          </div>
          <div className="text-xs whitespace-nowrap" style={{ color: 'var(--tg-hint)' }}>
            {formatOrderTime(order.created_at)}
          </div>
        </div>
        <div className="flex items-center justify-between mt-2 gap-2">
          <div className="text-sm" style={{ color: 'var(--tg-text)' }}>
            {order.quantity_requested} {order.unit ?? listing.unit}
            {order.estimated_total != null && (
              <span style={{ color: 'var(--tg-accent-text, var(--tg-link))', marginLeft: 8, fontWeight: 600 }}>
                {formatPrice(order.estimated_total, listing.currency, '').replace(/\/$/, '').trim()}
              </span>
            )}
          </div>
          <div
            className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium"
            style={{ backgroundColor: status.bg, color: status.color }}
          >
            <StatusIcon size={12} />
            {status.label}
          </div>
        </div>
        <button
          type="button"
          onClick={() => onRepeat(order)}
          className="mt-2 inline-flex items-center gap-1 text-xs active:opacity-60"
          style={{ color: 'var(--tg-link)' }}
        >
          <RotateCcw size={12} />
          Повторить
        </button>
      </div>
    </div>
  )
}

export default function OrdersPage() {
  const { data: orders, loading, error, refetch } = useMyOrders({ limit: 50 })
  const navigate = useNavigate()

  const groups = useMemo(() => {
    if (!orders) return []
    const map = new Map<string, Order[]>()
    for (const o of orders) {
      const label = groupLabel(new Date(o.created_at))
      const arr = map.get(label) ?? []
      arr.push(o)
      map.set(label, arr)
    }
    const order = ['Сегодня', 'Вчера', 'На этой неделе', 'Раньше']
    return order
      .filter((k) => map.has(k))
      .map((k) => ({ label: k, items: map.get(k) ?? [] }))
  }, [orders])

  const handleRepeat = (order: Order) => {
    addToCart(order.listing_snapshot, Math.max(1, Math.round(order.quantity_requested)))
    hapticFeedback.success()
    navigate('/cart')
  }

  if (loading) {
    return (
      <div className="px-4 pt-4 pb-4">
        <h1 className="text-xl font-semibold mb-3" style={{ color: 'var(--tg-text)' }}>
          Мои заказы
        </h1>
        <div className="text-sm" style={{ color: 'var(--tg-hint)' }}>Загрузка…</div>
      </div>
    )
  }

  if (error && error.code !== 'unauthorized') {
    return (
      <div className="px-4 pt-4 pb-4">
        <h1 className="text-xl font-semibold mb-3" style={{ color: 'var(--tg-text)' }}>
          Мои заказы
        </h1>
        <ErrorState title="Не удалось загрузить" message={error.message} onRetry={refetch} />
      </div>
    )
  }

  if (!orders || orders.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] px-6 text-center">
        <Package size={64} style={{ color: 'var(--tg-hint)' }} />
        <div className="mt-4 text-base font-medium" style={{ color: 'var(--tg-text)' }}>
          Заказов пока нет
        </div>
        <div className="mt-1 text-sm" style={{ color: 'var(--tg-hint)' }}>
          Оформите первый заказ на карте
        </div>
        <Link
          to="/farmers"
          className="mt-5 inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium active:opacity-80"
          style={{
            backgroundColor: 'var(--tg-secondary-bg)',
            color: 'var(--tg-text)',
          }}
        >
          <ShoppingCart size={16} />
          К карте
        </Link>
      </div>
    )
  }

  return (
    <div className="px-4 pt-4 pb-4">
      <h1 className="text-xl font-semibold mb-3" style={{ color: 'var(--tg-text)' }}>
        Мои заказы
      </h1>
      <div className="flex flex-col gap-5">
        {groups.map((group) => (
          <section key={group.label}>
            <div className="text-xs font-medium uppercase tracking-wide mb-2 px-1" style={{ color: 'var(--tg-hint)' }}>
              {group.label}
            </div>
            <div className="flex flex-col gap-2">
              {group.items.map((o) => (
                <OrderCard key={o.id} order={o} onRepeat={handleRepeat} />
              ))}
            </div>
          </section>
        ))}
      </div>
      <div className="mt-5">
        <DemoNotice text="Это тестовый режим. Реальный продавец уведомление пока не получает." />
      </div>
    </div>
  )
}
