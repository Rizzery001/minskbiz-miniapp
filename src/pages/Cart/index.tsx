import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { ApiError, apiPost } from '../../api/client'
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
    try {
      const settled = await Promise.allSettled(
        cart.map((item) =>
          apiPost<OrderResponse>('/orders', {
            listing_id: item.listing_id,
            quantity: item.quantity,
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
      navigate('/orders/success', { state: { results } })
    } finally {
      setSubmitting(false)
    }
  }, [cart, submitting, navigate])

  // MainButton text + visibility
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

  // MainButton click wiring
  useEffect(() => {
    mainButton.onClick(handleSubmit)
    return () => mainButton.offClick(handleSubmit)
  }, [handleSubmit])

  // Hide on unmount
  useEffect(() => {
    return () => {
      mainButton.hide()
      mainButton.hideProgress()
    }
  }, [])

  const handleClear = () => {
    if (cart.length === 0) return
    const ok = window.confirm('Очистить корзину?')
    if (!ok) return
    hapticFeedback.medium()
    clearCart()
  }

  return (
    <div
      className="h-full overflow-y-auto"
      style={{ backgroundColor: 'var(--tg-bg)', color: 'var(--tg-text)' }}
    >
      <div className="px-4 pt-4 pb-6">
        <h1 className="text-2xl font-semibold mb-4">Корзина</h1>
        {cart.length === 0 ? (
          <EmptyState />
        ) : (
          <>
            <div className="flex flex-col gap-3">
              {grouped.map(([sellerId, items]) => (
                <SellerGroup key={sellerId} items={items} />
              ))}
            </div>
            <div
              className="mt-6 rounded-xl p-4"
              style={{ backgroundColor: 'var(--tg-secondary-bg)' }}
            >
              <div className="flex justify-between items-center mb-1">
                <span className="text-sm">Всего:</span>
                <span className="text-base font-semibold tabular-nums">
                  {grandTotal.toFixed(2)} BYN
                </span>
              </div>
              <div className="text-xs" style={{ color: 'var(--tg-hint)' }}>
                Заказов будет создано: {cart.length}
              </div>
            </div>
            <button
              type="button"
              onClick={handleClear}
              className="w-full mt-4 py-3 rounded-lg text-sm active:opacity-70"
              style={{
                backgroundColor: 'var(--tg-secondary-bg)',
                color: 'var(--tg-text)',
              }}
            >
              Очистить корзину
            </button>
          </>
        )}
      </div>
    </div>
  )
}

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center text-center py-16">
      <div className="text-6xl mb-3" aria-hidden="true">
        🛒
      </div>
      <h2 className="text-lg font-semibold mb-1">Корзина пуста</h2>
      <p className="text-sm mb-5" style={{ color: 'var(--tg-hint)' }}>
        Добавь товары на карте
      </p>
      <Link
        to="/farmers"
        className="px-5 py-2.5 rounded-lg text-sm font-medium active:opacity-80"
        style={{
          backgroundColor: 'var(--tg-button)',
          color: 'var(--tg-button-text)',
        }}
      >
        К карте
      </Link>
    </div>
  )
}

function SellerGroup({ items }: { items: CartItem[] }) {
  const first = items[0]
  if (!first) return null
  const { seller_name, location_label, available_until } = first.listing_snapshot
  let groupTotal = 0
  for (const i of items) groupTotal += i.quantity * i.listing_snapshot.price_per_unit
  const currency = first.listing_snapshot.currency

  return (
    <section
      className="rounded-xl p-3"
      style={{ backgroundColor: 'var(--tg-secondary-bg)' }}
    >
      <header className="mb-2 px-1">
        <h2 className="text-sm font-semibold leading-tight">{seller_name}</h2>
        {location_label && (
          <p className="text-xs mt-0.5" style={{ color: 'var(--tg-hint)' }}>
            📍 {location_label}
          </p>
        )}
        {available_until && (
          <p className="text-xs mt-0.5" style={{ color: 'var(--tg-hint)' }}>
            ⏰ {available_until}
          </p>
        )}
      </header>
      <div className="flex flex-col gap-2">
        {items.map((item) => (
          <CartRow key={item.listing_id} item={item} />
        ))}
      </div>
      <div
        className="mt-3 pt-2 flex justify-between items-center text-sm"
        style={{ borderTop: '1px solid var(--tg-bg)' }}
      >
        <span>Итого:</span>
        <span className="font-semibold tabular-nums">
          {groupTotal.toFixed(2)} {currency}
        </span>
      </div>
      <p className="text-xs mt-1" style={{ color: 'var(--tg-hint)' }}>
        К оформлению этому продавцу: {items.length}{' '}
        {pluralize(items.length, ['заказ', 'заказа', 'заказов'])}
      </p>
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
    <div
      className="flex items-start gap-2 rounded-lg p-2"
      style={{ backgroundColor: 'var(--tg-bg)' }}
    >
      <div
        className="shrink-0 w-10 h-10 rounded-md flex items-center justify-center text-xl"
        style={{ backgroundColor: style.color + '33' }}
        aria-hidden="true"
      >
        {emoji}
      </div>
      <div className="min-w-0 flex-1">
        <h3 className="text-sm font-medium leading-tight truncate">{l.title}</h3>
        <p className="text-xs" style={{ color: 'var(--tg-hint)' }}>
          {formatPrice(l.price_per_unit, l.currency, l.unit)}
        </p>
        <p className="text-xs mt-0.5 tabular-nums" style={{ color: 'var(--tg-hint)' }}>
          × {qty} = {rowTotal.toFixed(2)} {l.currency}
        </p>
      </div>
      <div className="shrink-0 flex items-center gap-1.5 pt-1">
        <button
          type="button"
          onClick={dec}
          aria-label="Уменьшить"
          className="w-7 h-7 rounded-full flex items-center justify-center text-base leading-none active:opacity-70"
          style={{
            backgroundColor: 'var(--tg-secondary-bg)',
            color: 'var(--tg-text)',
            border: '1px solid var(--tg-hint)',
          }}
        >
          −
        </button>
        <span className="min-w-[1.5rem] text-center text-sm tabular-nums">
          {qty}
        </span>
        <button
          type="button"
          onClick={inc}
          disabled={!canInc}
          aria-label="Увеличить"
          className="w-7 h-7 rounded-full flex items-center justify-center text-base leading-none active:opacity-80 disabled:opacity-30"
          style={{
            backgroundColor: 'var(--tg-button)',
            color: 'var(--tg-button-text)',
          }}
        >
          +
        </button>
      </div>
    </div>
  )
}
