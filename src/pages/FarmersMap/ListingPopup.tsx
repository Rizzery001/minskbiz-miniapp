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

  const handleAdd = () => {
    if (inCart) return
    addToCart(listing.id)
    hapticFeedback.light()
    setInCart(true)
  }

  return (
    <div className="w-56">
      <div
        className="w-full h-32 rounded-lg mb-2 flex items-center justify-center text-5xl overflow-hidden"
        style={{ backgroundColor: 'var(--tg-secondary-bg)' }}
      >
        {listing.photo_url ? (
          <img
            src={listing.photo_url}
            alt={listing.product}
            className="w-full h-full object-cover"
            loading="lazy"
          />
        ) : (
          <span aria-hidden="true">{style.emoji}</span>
        )}
      </div>
      <h3
        className="text-base font-semibold mb-0.5 leading-tight"
        style={{ color: 'var(--tg-text)' }}
      >
        {listing.product}
      </h3>
      <p className="text-xs mb-2" style={{ color: 'var(--tg-hint)' }}>
        {listing.farmer.name}
      </p>
      <div className="flex items-center justify-between mb-3 gap-2">
        <span
          className="text-sm font-medium"
          style={{ color: 'var(--tg-text)' }}
        >
          {formatPrice(listing.price, listing.currency, listing.unit)}
        </span>
        {listing.distance_km !== undefined && (
          <span className="text-xs" style={{ color: 'var(--tg-hint)' }}>
            {formatDistance(listing.distance_km)}
          </span>
        )}
      </div>
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
