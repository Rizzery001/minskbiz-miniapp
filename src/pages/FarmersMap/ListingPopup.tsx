import { useState } from 'react'
import type { Listing } from '../../api/types'
import { addToCart, isInCart } from '../../lib/cart'
import { formatDistance, formatPrice } from '../../lib/format'
import { hapticFeedback } from '../../lib/telegram'
import { getCategoryStyle } from './categoryColors'

interface Props {
  listing: Listing
}

export default function ListingPopup({ listing }: Props) {
  const [inCart, setInCart] = useState<boolean>(() => isInCart(listing.id))
  const style = getCategoryStyle(listing.category)
  const emoji = listing.emoji ?? style.emoji

  const handleAdd = () => {
    if (inCart) return
    addToCart(listing.id)
    hapticFeedback.light()
    setInCart(true)
  }

  return (
    <div className="w-56">
      <div
        className="w-full h-32 rounded-lg mb-2 flex items-center justify-center text-6xl"
        style={{ backgroundColor: style.color }}
      >
        <span aria-hidden="true">{emoji}</span>
      </div>
      <h3
        className="text-base font-semibold mb-0.5 leading-tight"
        style={{ color: 'var(--tg-text)' }}
      >
        {listing.title}
      </h3>
      <p className="text-xs" style={{ color: 'var(--tg-hint)' }}>
        {listing.seller_name}
      </p>
      {listing.location_label && (
        <p className="text-xs mb-1" style={{ color: 'var(--tg-hint)' }}>
          📍 {listing.location_label}
        </p>
      )}
      {listing.available_until && (
        <div className="mb-2">
          <span
            className="inline-block text-[11px] px-2 py-0.5 rounded-full font-medium"
            style={{ backgroundColor: '#fef3c7', color: '#92400e' }}
          >
            ⏰ {listing.available_until}
          </span>
        </div>
      )}
      <div className="flex items-center justify-between mb-1 gap-2">
        <span
          className="text-sm font-medium"
          style={{ color: 'var(--tg-text)' }}
        >
          {formatPrice(listing.price_per_unit, listing.currency, listing.unit)}
        </span>
        {listing.distance_km !== undefined && (
          <span className="text-xs" style={{ color: 'var(--tg-hint)' }}>
            {formatDistance(listing.distance_km)}
          </span>
        )}
      </div>
      {listing.quantity !== undefined && (
        <p
          className="text-[11px] mb-3"
          style={{ color: 'var(--tg-hint)' }}
        >
          осталось {listing.quantity} {listing.unit}
        </p>
      )}
      <button
        type="button"
        onClick={handleAdd}
        disabled={inCart}
        className="w-full py-2 rounded-lg text-sm font-medium active:opacity-80 disabled:active:opacity-100"
        style={{
          backgroundColor: inCart
            ? 'var(--tg-secondary-bg)'
            : 'var(--tg-button)',
          color: inCart ? 'var(--tg-text)' : 'var(--tg-button-text)',
        }}
      >
        {inCart ? '✓ В корзине' : 'В корзину'}
      </button>
    </div>
  )
}
