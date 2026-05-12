import { Minus, Plus, Sparkles, Store, X } from 'lucide-react'
import { useEffect, useMemo, useRef, useState } from 'react'
import type { Listing } from '../../api/types'
import {
  addToCart,
  removeFromCart,
  setQuantity,
} from '../../lib/cart'
import { formatPrice, parseFreshness } from '../../lib/format'
import { backButton, hapticFeedback } from '../../lib/telegram'
import { useCartQuantity } from '../../lib/useCart'
import { getCategoryStyle } from './categoryColors'

interface Props {
  sellerId: string
  listings: Listing[]
  onClose: () => void
}

const ANIM_MS = 200
const SWIPE_CLOSE_THRESHOLD_PX = 100

export default function FarmerSheet({ sellerId, listings, onClose }: Props) {
  const sellerListings = useMemo(
    () => listings.filter((l) => l.seller_id === sellerId),
    [listings, sellerId],
  )
  const seller = sellerListings[0]

  const [mounted, setMounted] = useState(false)
  const [dragY, setDragY] = useState(0)
  const touchStartY = useRef<number | null>(null)
  const closingRef = useRef(false)

  useEffect(() => {
    const id = window.requestAnimationFrame(() => setMounted(true))
    return () => window.cancelAnimationFrame(id)
  }, [])

  useEffect(() => {
    const close = () => {
      if (closingRef.current) return
      closingRef.current = true
      setMounted(false)
      window.setTimeout(onClose, ANIM_MS)
    }
    backButton.show()
    backButton.onClick(close)
    return () => {
      backButton.offClick(close)
      backButton.hide()
    }
  }, [onClose])

  const close = () => {
    if (closingRef.current) return
    closingRef.current = true
    hapticFeedback.light()
    setMounted(false)
    window.setTimeout(onClose, ANIM_MS)
  }

  const handleTouchStart = (e: React.TouchEvent) => {
    const t = e.touches[0]
    if (!t) return
    touchStartY.current = t.clientY
  }

  const handleTouchMove = (e: React.TouchEvent) => {
    if (touchStartY.current === null) return
    const t = e.touches[0]
    if (!t) return
    const dy = t.clientY - touchStartY.current
    if (dy > 0) setDragY(dy)
  }

  const handleTouchEnd = () => {
    if (touchStartY.current === null) return
    touchStartY.current = null
    if (dragY > SWIPE_CLOSE_THRESHOLD_PX) {
      close()
    } else {
      setDragY(0)
    }
  }

  if (!seller) return null

  const sheetTransform = mounted
    ? `translateY(${dragY}px)`
    : 'translateY(100vh)'
  const useTransition = dragY === 0

  return (
    <>
      <div
        onClick={close}
        className="fixed inset-0 z-[1500]"
        style={{
          backgroundColor: 'rgba(0,0,0,0.5)',
          opacity: mounted ? 1 : 0,
          transition: `opacity ${ANIM_MS}ms ease-out`,
        }}
        aria-hidden="true"
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-label={`Профиль продавца ${seller.seller_name}`}
        className="farmer-sheet tg-shadow-lg fixed inset-x-0 bottom-0 z-[1600] flex flex-col"
        style={{
          color: 'var(--tg-text)',
          maxHeight: '85vh',
          borderTopLeftRadius: 16,
          borderTopRightRadius: 16,
          transform: sheetTransform,
          transition: useTransition ? `transform ${ANIM_MS}ms ease-out` : 'none',
          paddingBottom: 'env(safe-area-inset-bottom, 0px)',
        }}
      >
        <div
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
          onTouchCancel={handleTouchEnd}
          style={{ touchAction: 'none' }}
        >
          <div className="flex justify-center pt-2 pb-1">
            <div
              style={{
                width: 36,
                height: 4,
                borderRadius: 2,
                backgroundColor: 'var(--tg-hint)',
                opacity: 0.3,
              }}
            />
          </div>
          <div className="flex items-start gap-3 px-4 pt-2 pb-4">
            <div
              className="shrink-0 w-12 h-12 rounded-full flex items-center justify-center"
              style={{
                backgroundColor: 'var(--tg-secondary-bg)',
                color: 'var(--tg-hint)',
              }}
              aria-hidden="true"
            >
              <Store size={24} />
            </div>
            <div className="min-w-0 flex-1">
              <h2
                className="font-medium leading-tight truncate"
                style={{ fontSize: 17 }}
              >
                {seller.seller_name}
              </h2>
              {seller.location_label && (
                <p
                  className="mt-0.5 truncate"
                  style={{ fontSize: 13, color: 'var(--tg-hint)' }}
                >
                  {seller.location_label}
                </p>
              )}
              {seller.available_until && (
                <p
                  className="mt-0.5 truncate"
                  style={{ fontSize: 13, color: 'var(--tg-accent-text)' }}
                >
                  {seller.available_until}
                </p>
              )}
            </div>
            <button
              type="button"
              onClick={close}
              aria-label="Закрыть"
              className="shrink-0 rounded-full flex items-center justify-center active:opacity-60 active:scale-95 transition"
              style={{
                width: 32,
                height: 32,
                backgroundColor: 'var(--tg-secondary-bg)',
                color: 'var(--tg-text)',
                transitionDuration: '150ms',
              }}
            >
              <X size={20} />
            </button>
          </div>
          <div
            className="mx-4"
            style={{ height: 1, backgroundColor: 'var(--tg-hairline)' }}
          />
        </div>

        <div
          className="overflow-y-auto p-4 flex flex-col gap-3"
          style={{ WebkitOverflowScrolling: 'touch' }}
        >
          {sellerListings.map((listing) => (
            <OfferCard key={listing.id} listing={listing} />
          ))}
        </div>
      </div>
    </>
  )
}

function FreshnessBadge({ isToday, text }: { isToday: boolean; text: string }) {
  if (isToday) {
    return (
      <span
        className="badge-today inline-flex items-center gap-1 rounded-full"
        style={{
          padding: '3px 8px',
          fontSize: 11,
          fontWeight: 500,
          lineHeight: 1,
        }}
      >
        <Sparkles size={12} aria-hidden="true" />
        <span>{text}</span>
      </span>
    )
  }
  return (
    <span
      className="inline-flex items-center rounded-full"
      style={{
        padding: '3px 8px',
        backgroundColor: 'var(--tg-secondary-bg)',
        color: 'var(--tg-hint)',
        fontSize: 11,
        fontWeight: 500,
        lineHeight: 1,
      }}
    >
      {text}
    </span>
  )
}

function OfferCard({ listing }: { listing: Listing }) {
  const qty = useCartQuantity(listing.id)
  const style = getCategoryStyle(listing.category)
  const emoji = listing.emoji ?? style.emoji
  const max = listing.quantity
  const canIncrement = max === undefined || qty < max
  const freshness = parseFreshness(listing.available_until)

  const inc = () => {
    if (!canIncrement) return
    if (qty === 0) addToCart(listing, 1)
    else setQuantity(listing.id, qty + 1)
    hapticFeedback.light()
  }

  const dec = () => {
    if (qty <= 0) return
    if (qty === 1) removeFromCart(listing.id)
    else setQuantity(listing.id, qty - 1)
    hapticFeedback.light()
  }

  return (
    <div
      className="farmer-offer-card flex items-center gap-3 rounded-xl p-3"
    >
      <div
        className="shrink-0 flex items-center justify-center"
        style={{
          width: 48,
          height: 48,
          borderRadius: 12,
          backgroundColor: style.color + '26',
          fontSize: 24,
          lineHeight: 1,
        }}
        aria-hidden="true"
      >
        {emoji}
      </div>
      <div className="min-w-0 flex-1">
        <h3
          className="font-medium leading-tight truncate"
          style={{ fontSize: 15 }}
        >
          {listing.title}
        </h3>
        {freshness.text && (
          <div className="mt-1">
            <FreshnessBadge isToday={freshness.isToday} text={freshness.text} />
          </div>
        )}
        <p
          className="font-bold mt-1 tabular-nums"
          style={{ fontSize: 14, color: 'var(--tg-accent-text)' }}
        >
          {formatPrice(listing.price_per_unit, listing.currency, listing.unit)}
        </p>
        {max !== undefined && (
          <p
            className="mt-0.5"
            style={{ fontSize: 12, color: 'var(--tg-hint)' }}
          >
            осталось {max} {listing.unit}
          </p>
        )}
      </div>
      <div className="shrink-0">
        {qty === 0 ? (
          <button
            type="button"
            onClick={inc}
            disabled={!canIncrement}
            className="flex items-center gap-1 rounded-lg active:opacity-80 active:scale-[0.97] disabled:opacity-40 transition"
            style={{
              height: 32,
              padding: '0 12px',
              backgroundColor: 'var(--tg-button)',
              color: 'var(--tg-button-text)',
              fontSize: 14,
              fontWeight: 500,
              transitionDuration: '150ms',
            }}
          >
            <Plus size={16} strokeWidth={2} />
            <span>Добавить</span>
          </button>
        ) : (
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={dec}
              aria-label="Уменьшить"
              className="flex items-center justify-center rounded-full active:opacity-70 active:scale-[0.95] transition"
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
              disabled={!canIncrement}
              aria-label="Увеличить"
              className="flex items-center justify-center rounded-full active:opacity-80 active:scale-[0.95] disabled:opacity-30 transition"
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
        )}
      </div>
    </div>
  )
}
