import { Minus, Plus, ShoppingCart, Store, Trash2 } from 'lucide-react'
import { Fragment, useCallback, useEffect, useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { ApiError, apiPost } from '../../api/client'
import ConfirmModal from '../../components/ConfirmModal'
import DemoNotice from '../../components/DemoNotice'
import {
  type CartItem,
  clearCart,
  removeFromCart,
  setQuantity,
} from '../../lib/cart'
import { formatPrice, pluralize } from '../../lib/format'
import { hapticFeedback, mainButton } from '../../lib/telegram'
import { useCart } from '../../lib/useCart'
import { getCategoryStyle } from '../FarmersMap/categoryColors'
import type { OrderResult } from './types'

interface OrderResponse {
  id: string
  status: string
}

export default function Cart() {
  const cart = useCart()
  const navigate = useNavigate()
  const [submitting, setSubmitting] = useState(false)
  const [clearConfirmOpen, setClearConfirmOpen] = useState(false)

  const grouped = useMemo<Array<[string, CartItem[]]>>(() => {
    const map = new Map<string, CartItem[]>()
    for (const item of cart) {
      const sellerId = item.listing_snapshot.seller_id
      const list = map.get(sellerId) ?? []
      list.push(item)
      map.set(sellerId, list)
    }
    return Array.from(map.entries())
  }, [cart])

  const grandTotal = useMemo(() => {
    let total = 0
    for (const item of cart) {
      total += item.quantity * item.listing_snapshot.price_per_unit
    }
    return total
  }, [cart])

  const handleSubmit = useCallback(async () => {
    if (cart.length === 0 || submitting) return
    hapticFeedback.warning()
    setSubmitting(true)
    // One cart_id per checkout. Backend uses this to group N orders
    // into a single notification to the supplier and the buyer.
    const cartId =
      typeof crypto !== 'undefined' && 'randomUUID' in crypto
        ? crypto.randomUUID()
        : `cart_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`
    try {
      const settled = await Promise.allSettled(
        cart.map((item) =>
          apiPost<OrderResponse>('/orders', {
            listing_id: item.listing_id,
            quantity: item.quantity,
            cart_id: cartId,
          }),
        ),
      )
      const results: OrderResult[] = []
      for (let i = 0; i < cart.length; i++) {
        const item = cart[i]
        const r = settled[i]
        if (!item || !r) continue
        if (r.status === 'fulfilled') {
          results.push({ item, success: true, orderId: r.value.id })
        } else {
          const reason: unknown = r.reason
          const msg =
            reason instanceof ApiError
              ? reason.message
              : reason instanceof Error
                ? reason.message
                : 'Неизвестная ошибка'
          results.push({ item, success: false, error: msg })
        }
      }
      const allOk = results.every((r) => r.success)
      if (allOk) {
        clearCart()
        hapticFeedback.success()
      } else {
        hapticFeedback.error()
      }
      navigate('/me/orders/success', { state: { results } })
    } finally {
      setSubmitting(false)
    }
  }, [cart, submitting, navigate])

  useEffect(() => {
    if (cart.length === 0) {
      mainButton.hide()
      mainButton.hideProgress()
      return
    }
    if (submitting) {
      mainButton.setText('Отправка…')
      mainButton.showProgress()
    } else {
      mainButton.setText(
        `Оформить ${cart.length} ${pluralize(cart.length, [
          'товар',
          'товара',
          'товаров',
        ])}`,
      )
      mainButton.hideProgress()
    }
    mainButton.show()
  }, [cart.length, submitting])

  useEffect(() => {
    mainButton.onClick(handleSubmit)
    return () => mainButton.offClick(handleSubmit)
  }, [handleSubmit])

  useEffect(() => {
    return () => {
      mainButton.hide()
      mainButton.hideProgress()
    }
  }, [])

  const requestClear = () => {
    if (cart.length === 0) return
    hapticFeedback.light()
    setClearConfirmOpen(true)
  }

  const performClear = () => {
    hapticFeedback.medium()
    clearCart()
    setClearConfirmOpen(false)
  }

  return (
    <div
      className="h-full overflow-y-auto"
      style={{ backgroundColor: 'var(--tg-bg)', color: 'var(--tg-text)' }}
    >
      <div className="px-4 pt-4 pb-6">
        <h1
          className="font-semibold mb-4"
          style={{ fontSize: 22, lineHeight: 1.2 }}
        >
          Корзина
        </h1>
        {cart.length === 0 ? (
          <EmptyState />
        ) : (
          <>
            <div className="flex flex-col gap-3">
              {grouped.map(([sellerId, items]) => (
                <SellerGroup key={sellerId} items={items} />
              ))}
            </div>
            <div className="mt-4">
              <GrandTotalCard
                grandTotal={grandTotal}
                orderCount={cart.length}
              />
            </div>
            <div className="mt-4">
              <DemoNotice text="Это тестовый режим. Заказ создаётся в системе, но реальный продавец уведомление пока не получит." />
            </div>
            <button
              type="button"
              onClick={requestClear}
              className="w-full mt-2 py-3 rounded-lg font-medium flex items-center justify-center gap-2 active:opacity-60 transition"
              style={{
                backgroundColor: 'transparent',
                color: 'var(--tg-destructive-text, #ff3b30)',
                fontSize: 14,
                transitionDuration: '150ms',
              }}
            >
              <Trash2 size={16} strokeWidth={2} />
              <span>Очистить корзину</span>
            </button>
          </>
        )}
      </div>
      {clearConfirmOpen && (
        <ConfirmModal
          title="Очистить корзину?"
          message="Все товары из корзины будут удалены. Это действие нельзя отменить."
          confirmLabel="Очистить"
          danger
          onCancel={() => setClearConfirmOpen(false)}
          onConfirm={performClear}
        />
      )}
    </div>
  )
}

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center text-center py-12">
      <ShoppingCart
        size={64}
        strokeWidth={1.5}
        style={{ color: 'var(--tg-hint)' }}
        aria-hidden="true"
      />
      <h2 className="font-medium mt-4 mb-1" style={{ fontSize: 17 }}>
        Корзина пуста
      </h2>
      <p
        className="mb-5"
        style={{ fontSize: 14, color: 'var(--tg-hint)' }}
      >
        Добавь товары на карте
      </p>
      <Link
        to="/farmers"
        className="rounded-lg font-medium active:opacity-70 active:scale-[0.97] transition"
        style={{
          padding: '10px 20px',
          backgroundColor: 'var(--tg-secondary-bg)',
          color: 'var(--tg-text)',
          fontSize: 14,
          transitionDuration: '150ms',
        }}
      >
        К карте
      </Link>
    </div>
  )
}

function GrandTotalCard({
  grandTotal,
  orderCount,
}: {
  grandTotal: number
  orderCount: number
}) {
  return (
    <div
      className="tg-shadow-sm rounded-xl"
      style={{
        backgroundColor: 'var(--tg-section-bg, var(--tg-bg))',
        padding: 16,
      }}
    >
      <div className="flex items-baseline justify-between">
        <span style={{ fontSize: 14, color: 'var(--tg-hint)' }}>Всего</span>
        <span
          className="font-medium tabular-nums"
          style={{ fontSize: 17, color: 'var(--tg-accent-text)' }}
        >
          {grandTotal.toFixed(2)} BYN
        </span>
      </div>
      <p
        className="mt-1"
        style={{ fontSize: 13, color: 'var(--tg-hint)' }}
      >
        К оформлению: {orderCount}{' '}
        {pluralize(orderCount, ['заказ', 'заказа', 'заказов'])}
      </p>
    </div>
  )
}

function SellerGroup({ items }: { items: CartItem[] }) {
  const first = items[0]
  if (!first) return null
  const { seller_name, location_label } = first.listing_snapshot
  let groupTotal = 0
  for (const i of items) groupTotal += i.quantity * i.listing_snapshot.price_per_unit
  const currency = first.listing_snapshot.currency

  return (
    <section
      className="tg-shadow-sm rounded-xl"
      style={{
        backgroundColor: 'var(--tg-section-bg, var(--tg-bg))',
        padding: 16,
      }}
    >
      <header className="flex items-start gap-3 mb-3">
        <div
          className="shrink-0 rounded-full flex items-center justify-center"
          style={{
            width: 40,
            height: 40,
            backgroundColor: 'var(--tg-secondary-bg)',
            color: 'var(--tg-hint)',
          }}
          aria-hidden="true"
        >
          <Store size={20} />
        </div>
        <div className="min-w-0 flex-1">
          <h2
            className="font-medium leading-tight truncate"
            style={{ fontSize: 15 }}
          >
            {seller_name}
          </h2>
          {location_label && (
            <p
              className="mt-0.5 truncate"
              style={{ fontSize: 13, color: 'var(--tg-hint)' }}
            >
              {location_label}
            </p>
          )}
        </div>
      </header>
      <div>
        {items.map((item, idx) => (
          <Fragment key={item.listing_id}>
            {idx > 0 && (
              <div
                style={{ height: 1, backgroundColor: 'var(--tg-hairline)' }}
              />
            )}
            <CartRow item={item} />
          </Fragment>
        ))}
      </div>
      <div
        className="flex items-center justify-between mt-2 pt-3"
        style={{ borderTop: '1px solid var(--tg-hairline)' }}
      >
        <span style={{ fontSize: 14, color: 'var(--tg-hint)' }}>Итого:</span>
        <span
          className="font-medium tabular-nums"
          style={{ fontSize: 14, color: 'var(--tg-accent-text)' }}
        >
          {groupTotal.toFixed(2)} {currency}
        </span>
      </div>
    </section>
  )
}

function CartRow({ item }: { item: CartItem }) {
  const l = item.listing_snapshot
  const qty = item.quantity
  const style = getCategoryStyle(l.category)
  const emoji = l.emoji ?? style.emoji
  const max = l.quantity
  const canInc = max === undefined || qty < max
  const rowTotal = qty * l.price_per_unit

  const inc = () => {
    if (!canInc) return
    setQuantity(item.listing_id, qty + 1)
    hapticFeedback.light()
  }
  const dec = () => {
    if (qty <= 1) {
      removeFromCart(item.listing_id)
    } else {
      setQuantity(item.listing_id, qty - 1)
    }
    hapticFeedback.light()
  }

  return (
    <div className="flex items-center gap-3 py-3">
      <div
        className="shrink-0 flex items-center justify-center"
        style={{
          width: 36,
          height: 36,
          borderRadius: 10,
          backgroundColor: style.color + '26',
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
          style={{ fontSize: 14 }}
        >
          {l.title}
        </h3>
        <p
          className="mt-0.5 tabular-nums"
          style={{ fontSize: 13, color: 'var(--tg-hint)' }}
        >
          {formatPrice(l.price_per_unit, l.currency, l.unit)} · {rowTotal.toFixed(2)} {l.currency}
        </p>
      </div>
      <div className="shrink-0 flex items-center gap-1">
        <button
          type="button"
          onClick={dec}
          aria-label="Уменьшить"
          className="rounded-full flex items-center justify-center active:opacity-70 active:scale-[0.95] transition"
          style={{
            width: 32,
            height: 32,
            backgroundColor: 'var(--tg-secondary-bg)',
            color: 'var(--tg-text)',
            transitionDuration: '150ms',
          }}
        >
          <Minus size={16} strokeWidth={2} />
        </button>
        <span
          className="text-center tabular-nums font-medium"
          style={{ minWidth: 24, fontSize: 15 }}
          aria-live="polite"
        >
          {qty}
        </span>
        <button
          type="button"
          onClick={inc}
          disabled={!canInc}
          aria-label="Увеличить"
          className="rounded-full flex items-center justify-center active:opacity-80 active:scale-[0.95] disabled:opacity-30 transition"
          style={{
            width: 32,
            height: 32,
            backgroundColor: 'var(--tg-button)',
            color: 'var(--tg-button-text)',
            transitionDuration: '150ms',
          }}
        >
          <Plus size={16} strokeWidth={2} />
        </button>
      </div>
    </div>
  )
}
