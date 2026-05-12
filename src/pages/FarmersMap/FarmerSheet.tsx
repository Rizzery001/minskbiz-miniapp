import { useEffect, useMemo, useRef, useState } from 'react'
import type { Listing } from '../../api/types'
import {
  addToCart,
  removeFromCart,
  setQuantity,
} from '../../lib/cart'
import { formatPrice } from '../../lib/format'
import { backButton, hapticFeedback } from '../../lib/telegram'
import { useCartQuantity } from '../../lib/useCart'
import { getCategoryStyle } from './categoryColors'

interface Props {
  sellerId: string
  listings: Listing[]
  onClose: () => void
}

const ANIM_MS = 250
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
        className="fixed inset-x-0 bottom-0 z-[1600] flex flex-col rounded-t-2xl shadow-2xl"
        style={{
          backgroundColor: 'var(--tg-bg)',
          color: 'var(--tg-text)',
          maxHeight: '85vh',
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
              className="w-10 h-1 rounded-full"
              style={{ backgroundColor: 'var(--tg-hint)', opacity: 0.5 }}
            />
          </div>
          <div className="flex items-start justify-between px-4 pb-3 pt-1 gap-3">
            <div className="min-w-0 flex-1">
              <h2 className="text-lg font-semibold leading-tight truncate">
                {seller.seller_name}
              </h2>
              {seller.location_label && (
                <p
                  className="text-xs mt-0.5 truncate"
                  style={{ color: 'var(--tg-hint)' }}
                >
                  📍 {seller.location_label}
                </p>
              )}
              {seller.available_until && (
                <p
                  className="text-xs mt-0.5 truncate"
                  style={{ color: 'var(--tg-hint)' }}
                >
                  ⏰ {seller.available_until}
                </p>
              )}
            </div>
            <button
              type="button"
              onClick={close}
              aria-label="Закрыть"
              className="shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-lg leading-none"
              style={{
                backgroundColor: 'var(--tg-secondary-bg)',
                color: 'var(--tg-text)',
              }}
            >
              ✕
            </button>
          </div>
        </div>

        <div
          className="overflow-y-auto px-4 pb-4 pt-1"
          style={{ WebkitOverflowScrolling: 'touch' }}
        >
          <p
            className="text-xs uppercase tracking-wide mb-2"
            style={{ color: 'var(--tg-hint)' }}
          >
            {sellerListings.length}{' '}
            {pluralizeOffers(sellerListings.length)}
          </p>
          <div className="flex flex-col gap-2">
            {sellerListings.map((listing) => (
              <OfferCard key={listing.id} listing={listing} />
            ))}
          </div>
        </div>
      </div>
    </>
  )
}

function pluralizeOffers(n: number): string {
  const mod10 = n % 10
  const mod100 = n % 100
  if (mod10 === 1 && mod100 !== 11) return 'предложение'
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 10 || mod100 >= 20)) {
    return 'предложения'
  }
  return 'предложений'
}

function OfferCard({ listing }: { listing: Listing }) {
  const qty = useCartQuantity(listing.id)
  const style = getCategoryStyle(listing.category)
  const emoji = listing.emoji ?? style.emoji
  const max = listing.quantity
  const canIncrement = max === undefined || qty < max

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
      className="flex items-center gap-3 rounded-xl p-3"
      style={{ backgroundColor: 'var(--tg-secondary-bg)' }}
    >
      <div
        className="shrink-0 w-12 h-12 rounded-lg flex items-center justify-center text-2xl"
        style={{ backgroundColor: style.color + '33' }}
        aria-hidden="true"
      >
        {emoji}
      </div>
      <div className="min-w-0 flex-1">
        <h3 className="text-sm font-medium leading-tight truncate">
          {listing.title}
        </h3>
        <p className="text-sm mt-0.5">
          {formatPrice(listing.price_per_unit, listing.currency, listing.unit)}
        </p>
        {max !== undefined && (
          <p className="text-xs mt-0.5" style={{ color: 'var(--tg-hint)' }}>
            осталось {max} {listing.unit}
          </p>
        )}
      </div>
      <div className="shrink-0 flex items-center gap-1.5">
        <button
          type="button"
          onClick={dec}
          disabled={qty === 0}
          aria-label="Уменьшить"
          className="w-8 h-8 rounded-full flex items-center justify-center text-lg leading-none active:opacity-70 disabled:opacity-30"
          style={{
            backgroundColor: 'var(--tg-bg)',
            color: 'var(--tg-text)',
            border: '1px solid var(--tg-hint)',
          }}
        >
          −
        </button>
        <span
          className="min-w-[1.5rem] text-center text-sm tabular-nums"
          aria-live="polite"
        >
          {qty}
        </span>
        <button
          type="button"
          onClick={inc}
          disabled={!canIncrement}
          aria-label="Увеличить"
          className="w-8 h-8 rounded-full flex items-center justify-center text-lg leading-none active:opacity-80 disabled:opacity-30"
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
