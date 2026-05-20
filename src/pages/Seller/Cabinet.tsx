import {
  LogOut,
  Pause,
  Pencil,
  Play,
  Plus,
  Trash2,
} from 'lucide-react'
import { useCallback, useMemo, useState } from 'react'
import { ApiError, apiDelete, apiPatch } from '../../api/client'
import { useMyListings, useSeller, useSellingPoints } from '../../api/hooks'
import type {
  ListingDeleteResponse,
  ListingStatus,
  ListingUpdatePayload,
  MyListing,
  SellingPoint,
  SellingPointDeleteResponse,
} from '../../api/types'
import ErrorState from '../../components/ErrorState'
import { hapticFeedback } from '../../lib/telegram'
import AddSellingPointModal from './AddSellingPointModal'
import ListingFormModal from './ListingFormModal'
import { SELLER_CATEGORIES } from './categories'

export default function SellerCabinet() {
  const { data: seller, loading, error, refetch } = useSeller(true)
  const {
    data: sellingPoints,
    loading: spLoading,
    error: spError,
    refetch: refetchPoints,
  } = useSellingPoints(true)

  const {
    data: listings,
    loading: listingsLoading,
    error: listingsError,
    refetch: refetchListings,
  } = useMyListings(true)

  const [showAddModal, setShowAddModal] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [deleteError, setDeleteError] = useState<string | null>(null)

  // Listings CRUD state.
  const [listingModalOpen, setListingModalOpen] = useState(false)
  const [editingListing, setEditingListing] = useState<MyListing | null>(null)
  const [listingActionId, setListingActionId] = useState<string | null>(null)
  const [listingActionError, setListingActionError] = useState<string | null>(
    null,
  )

  const points = sellingPoints ?? []
  const canDelete = points.length > 1
  const items = listings ?? []

  const handleAddClick = useCallback(() => {
    hapticFeedback.light()
    setShowAddModal(true)
  }, [])

  const handleModalClose = useCallback(() => {
    setShowAddModal(false)
  }, [])

  const handleCreated = useCallback(
    (_created: SellingPoint) => {
      setShowAddModal(false)
      refetchPoints()
    },
    [refetchPoints],
  )

  const handleDelete = useCallback(
    async (point: SellingPoint) => {
      if (!point.id) return
      if (!canDelete) return
      if (deletingId) return
      const confirmed = window.confirm('Удалить эту точку?')
      if (!confirmed) return
      hapticFeedback.medium()
      setDeletingId(point.id)
      setDeleteError(null)
      try {
        await apiDelete<SellingPointDeleteResponse>(
          `/me/selling-points/${encodeURIComponent(point.id)}`,
        )
        hapticFeedback.success()
        refetchPoints()
      } catch (err: unknown) {
        hapticFeedback.error()
        const msg =
          err instanceof ApiError
            ? `${err.message}${err.code ? ` (${err.code})` : ''}`
            : 'Не удалось удалить точку. Попробуйте ещё раз.'
        setDeleteError(msg)
      } finally {
        setDeletingId(null)
      }
    },
    [canDelete, deletingId, refetchPoints],
  )

  const openCreateListing = useCallback(() => {
    hapticFeedback.light()
    setEditingListing(null)
    setListingActionError(null)
    setListingModalOpen(true)
  }, [])

  const openEditListing = useCallback((listing: MyListing) => {
    hapticFeedback.light()
    setEditingListing(listing)
    setListingActionError(null)
    setListingModalOpen(true)
  }, [])

  const closeListingModal = useCallback(() => {
    setListingModalOpen(false)
    setEditingListing(null)
  }, [])

  const handleListingSaved = useCallback(
    (_saved: MyListing) => {
      setListingModalOpen(false)
      setEditingListing(null)
      refetchListings()
    },
    [refetchListings],
  )

  const handleListingToggleStatus = useCallback(
    async (listing: MyListing) => {
      if (listingActionId) return
      const nextStatus: ListingStatus =
        listing.status === 'paused' ? 'active' : 'paused'
      hapticFeedback.light()
      setListingActionId(listing.id)
      setListingActionError(null)
      try {
        const patch: ListingUpdatePayload = { status: nextStatus }
        await apiPatch<MyListing>(
          `/me/listings/${encodeURIComponent(listing.id)}`,
          patch,
        )
        hapticFeedback.success()
        refetchListings()
      } catch (err: unknown) {
        hapticFeedback.error()
        const msg =
          err instanceof ApiError
            ? `${err.message}${err.code ? ` (${err.code})` : ''}`
            : 'Не удалось изменить статус. Попробуйте ещё раз.'
        setListingActionError(msg)
      } finally {
        setListingActionId(null)
      }
    },
    [listingActionId, refetchListings],
  )

  const handleListingDelete = useCallback(
    async (listing: MyListing) => {
      if (listingActionId) return
      const confirmed = window.confirm(`Удалить товар «${listing.title}»?`)
      if (!confirmed) return
      hapticFeedback.medium()
      setListingActionId(listing.id)
      setListingActionError(null)
      try {
        await apiDelete<ListingDeleteResponse>(
          `/me/listings/${encodeURIComponent(listing.id)}`,
        )
        hapticFeedback.success()
        refetchListings()
      } catch (err: unknown) {
        hapticFeedback.error()
        const msg =
          err instanceof ApiError
            ? `${err.message}${err.code ? ` (${err.code})` : ''}`
            : 'Не удалось удалить товар. Попробуйте ещё раз.'
        setListingActionError(msg)
      } finally {
        setListingActionId(null)
      }
    },
    [listingActionId, refetchListings],
  )

  if (loading) {
    return <Spinner />
  }

  if (error || !seller) {
    return (
      <div
        className="w-full h-full flex items-center justify-center"
        style={{ backgroundColor: 'var(--tg-bg)' }}
      >
        <ErrorState
          title="Не удалось загрузить"
          message={error?.message ?? 'Кабинет недоступен'}
          onRetry={refetch}
        />
      </div>
    )
  }

  const categoryLabel =
    SELLER_CATEGORIES.find((c) => c.value === seller.category)?.label ??
    seller.category

  const handleLogout = () => {
    hapticFeedback.light()
    window.alert('В следующей версии можно будет выйти.')
  }

  return (
    <div className="p-4 flex flex-col" style={{ minHeight: '100%' }}>
      <header className="pt-4 pb-6 text-center">
        <div className="text-5xl mb-3" aria-hidden="true">
          👋
        </div>
        <h1
          className="font-semibold mb-2"
          style={{ fontSize: 22, lineHeight: 1.2 }}
        >
          Здравствуйте, {seller.name}!
        </h1>
        <p
          className="mx-auto"
          style={{
            fontSize: 14,
            color: 'var(--tg-hint)',
            lineHeight: 1.45,
            maxWidth: 320,
          }}
        >
          Скоро здесь появятся ваши товары и заказы. Мы уже работаем над этим.
        </p>
      </header>

      <section
        className="tg-shadow-sm rounded-xl"
        style={{
          backgroundColor: 'var(--tg-section-bg, var(--tg-bg))',
          padding: 16,
        }}
        aria-label="Сведения о ферме"
      >
        <InfoRow label="Категория" value={categoryLabel} />
        <Divider />
        <InfoRow label="Телефон" value={seller.phone} />
        {seller.home_address && (
          <>
            <Divider />
            <InfoRow label="Адрес фермы" value={seller.home_address} />
          </>
        )}
        {!seller.home_address && seller.location_label && (
          <>
            <Divider />
            <InfoRow label="Адрес" value={seller.location_label} />
          </>
        )}
      </section>

      <section className="mt-5" aria-label="Мои места продажи">
        <h2
          className="font-semibold mb-2"
          style={{ fontSize: 16, color: 'var(--tg-text)' }}
        >
          📍 Мои места продажи
        </h2>

        {spLoading && points.length === 0 && (
          <div className="py-6 flex justify-center">
            <Spinner inline />
          </div>
        )}

        {spError && (
          <div
            className="rounded-lg p-3 mb-3"
            style={{
              backgroundColor: 'rgba(239,68,68,0.1)',
              color: 'var(--tg-destructive-text, #ff3b30)',
              fontSize: 14,
            }}
          >
            <div>{spError.message}</div>
            <button
              type="button"
              onClick={refetchPoints}
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

        {!spLoading && !spError && points.length === 0 && (
          <p
            className="mb-3"
            style={{ fontSize: 13, color: 'var(--tg-hint)', lineHeight: 1.4 }}
          >
            У вас пока нет мест продажи. Добавьте хотя бы одно, чтобы
            покупатели могли вас найти.
          </p>
        )}

        <div className="flex flex-col gap-3">
          {points.map((point) => (
            <SellingPointCard
              key={point.id ?? `${point.lat},${point.lng}`}
              point={point}
              canDelete={canDelete}
              deleting={deletingId === point.id}
              onDelete={() => handleDelete(point)}
            />
          ))}
        </div>

        {deleteError && (
          <p
            className="mt-2"
            style={{
              fontSize: 13,
              color: 'var(--tg-destructive-text, #ff3b30)',
            }}
          >
            {deleteError}
          </p>
        )}

        <button
          type="button"
          onClick={handleAddClick}
          className="mt-3 w-full flex items-center justify-center gap-2 py-3 rounded-lg active:opacity-80 transition"
          style={{
            backgroundColor: 'var(--tg-secondary-bg)',
            color: 'var(--tg-link)',
            border: '1px dashed var(--tg-hairline)',
            fontSize: 14,
            fontWeight: 500,
            transitionDuration: '150ms',
          }}
        >
          <Plus size={16} strokeWidth={2} aria-hidden="true" />
          <span>Добавить место продажи</span>
        </button>
      </section>

      <section className="mt-5" aria-label="Мои товары">
        <h2
          className="font-semibold mb-2"
          style={{ fontSize: 16, color: 'var(--tg-text)' }}
        >
          🛒 Мои товары
        </h2>

        {listingsLoading && items.length === 0 && (
          <p
            className="py-2"
            style={{ fontSize: 13, color: 'var(--tg-hint)' }}
          >
            Загрузка товаров…
          </p>
        )}

        {listingsError && (
          <div
            className="rounded-lg p-3 mb-3"
            style={{
              backgroundColor: 'rgba(239,68,68,0.1)',
              color: 'var(--tg-destructive-text, #ff3b30)',
              fontSize: 14,
            }}
          >
            <div>{listingsError.message}</div>
            <button
              type="button"
              onClick={refetchListings}
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

        {!listingsLoading && !listingsError && items.length === 0 && (
          <p
            className="mb-3"
            style={{ fontSize: 13, color: 'var(--tg-hint)', lineHeight: 1.4 }}
          >
            Пока нет товаров. Добавьте первый, чтобы покупатели могли его
            увидеть.
          </p>
        )}

        <div className="flex flex-col gap-3">
          {items.map((listing) => (
            <ListingCard
              key={listing.id}
              listing={listing}
              busy={listingActionId === listing.id}
              onEdit={() => openEditListing(listing)}
              onToggle={() => handleListingToggleStatus(listing)}
              onDelete={() => handleListingDelete(listing)}
            />
          ))}
        </div>

        {listingActionError && (
          <p
            className="mt-2"
            style={{
              fontSize: 13,
              color: 'var(--tg-destructive-text, #ff3b30)',
            }}
          >
            {listingActionError}
          </p>
        )}

        <button
          type="button"
          onClick={openCreateListing}
          className="mt-3 w-full flex items-center justify-center gap-2 py-3 rounded-lg active:opacity-80 transition"
          style={{
            backgroundColor: 'var(--tg-secondary-bg)',
            color: 'var(--tg-link)',
            border: '1px dashed var(--tg-hairline)',
            fontSize: 14,
            fontWeight: 500,
            transitionDuration: '150ms',
          }}
        >
          <Plus size={16} strokeWidth={2} aria-hidden="true" />
          <span>Добавить товар</span>
        </button>
      </section>

      <div className="mt-auto pt-6">
        <button
          type="button"
          onClick={handleLogout}
          className="w-full py-3 rounded-lg font-medium flex items-center justify-center gap-2 active:opacity-60 transition"
          style={{
            backgroundColor: 'transparent',
            color: 'var(--tg-destructive-text, #ff3b30)',
            fontSize: 14,
            transitionDuration: '150ms',
          }}
        >
          <LogOut size={16} strokeWidth={2} aria-hidden="true" />
          <span>Выйти из аккаунта</span>
        </button>
      </div>

      {showAddModal && (
        <AddSellingPointModal
          onClose={handleModalClose}
          onCreated={handleCreated}
        />
      )}

      <ListingFormModal
        open={listingModalOpen}
        onClose={closeListingModal}
        onSaved={handleListingSaved}
        initial={editingListing}
      />
    </div>
  )
}

interface ListingCardProps {
  listing: MyListing
  busy: boolean
  onEdit: () => void
  onToggle: () => void
  onDelete: () => void
}

function ListingCard({
  listing,
  busy,
  onEdit,
  onToggle,
  onDelete,
}: ListingCardProps) {
  const categoryOpt = useMemo(
    () => SELLER_CATEGORIES.find((c) => c.value === listing.category),
    [listing.category],
  )
  const emoji = listing.emoji || categoryOpt?.emoji || '📦'
  const categoryLine = categoryOpt
    ? `${categoryOpt.emoji} ${categoryOpt.label}`
    : listing.category

  const priceStr = `${formatNumber(listing.price_per_unit)} ${listing.currency} / ${listing.unit}`
  const qtyStr = `Осталось: ${formatNumber(listing.quantity)} ${listing.unit}`
  const availableLine = formatAvailableUntil(listing.available_until)

  const isPaused = listing.status === 'paused'
  const isSold = listing.status === 'sold'
  const canToggle = !isSold
  const toggleLabel = isPaused ? 'Возобновить' : 'Поставить на паузу'

  return (
    <article
      className="tg-shadow-sm rounded-xl"
      style={{
        backgroundColor: 'var(--tg-section-bg, var(--tg-bg))',
        padding: 14,
        border: '1px solid var(--tg-hairline)',
      }}
    >
      <div className="flex items-start gap-3">
        <div
          className="shrink-0 flex items-center justify-center"
          style={{
            width: 44,
            height: 44,
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
          <div className="flex items-start gap-2">
            <h3
              className="font-medium leading-tight"
              style={{ fontSize: 15, color: 'var(--tg-text)' }}
            >
              {listing.title}
            </h3>
            <StatusBadge status={listing.status} />
          </div>
          <p
            className="mt-1 tabular-nums"
            style={{ fontSize: 14, color: 'var(--tg-accent-text)' }}
          >
            {priceStr}
          </p>
          <p
            className="mt-0.5 tabular-nums"
            style={{ fontSize: 13, color: 'var(--tg-hint)' }}
          >
            {qtyStr}
          </p>
          {availableLine && (
            <p
              className="mt-0.5"
              style={{ fontSize: 13, color: 'var(--tg-hint)' }}
            >
              {availableLine}
            </p>
          )}
          <p
            className="mt-0.5"
            style={{ fontSize: 12, color: 'var(--tg-hint)' }}
          >
            {categoryLine}
          </p>
        </div>
        <div className="shrink-0 flex items-center gap-1">
          <IconButton
            label="Редактировать"
            onClick={onEdit}
            disabled={busy}
          >
            <Pencil size={16} strokeWidth={2} />
          </IconButton>
          <IconButton
            label={toggleLabel}
            onClick={onToggle}
            disabled={busy || !canToggle}
          >
            {isPaused ? (
              <Play size={16} strokeWidth={2} />
            ) : (
              <Pause size={16} strokeWidth={2} />
            )}
          </IconButton>
          <IconButton
            label="Удалить"
            onClick={onDelete}
            disabled={busy}
            tone="destructive"
          >
            <Trash2 size={16} strokeWidth={2} />
          </IconButton>
        </div>
      </div>
    </article>
  )
}

function StatusBadge({ status }: { status: ListingStatus }) {
  if (status === 'active') return null
  const label = status === 'paused' ? 'На паузе' : 'Продано'
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

interface IconButtonProps {
  label: string
  onClick: () => void
  disabled?: boolean
  tone?: 'default' | 'destructive'
  children: React.ReactNode
}

function IconButton({
  label,
  onClick,
  disabled = false,
  tone = 'default',
  children,
}: IconButtonProps) {
  const color =
    tone === 'destructive'
      ? 'var(--tg-destructive-text, #ff3b30)'
      : 'var(--tg-text)'
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={label}
      title={label}
      className="rounded-full flex items-center justify-center active:opacity-70 disabled:opacity-30 transition"
      style={{
        width: 32,
        height: 32,
        backgroundColor: 'var(--tg-secondary-bg)',
        color,
        transitionDuration: '150ms',
      }}
    >
      {children}
    </button>
  )
}

function formatNumber(value: number): string {
  if (!Number.isFinite(value)) return String(value)
  const fixed = Number.isInteger(value) ? value.toFixed(0) : value.toFixed(2)
  // Strip trailing zeros after a decimal point ("10.50" → "10.5").
  return fixed.includes('.') ? fixed.replace(/\.?0+$/, '') : fixed
}

function formatAvailableUntil(raw: string | null | undefined): string | null {
  if (!raw) return null
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(raw)
  if (!m) return null
  const [, y, mo, d] = m
  return `Доступно до ${d}.${mo}.${y}`
}

interface CardProps {
  point: SellingPoint
  canDelete: boolean
  deleting: boolean
  onDelete: () => void
}

function SellingPointCard({ point, canDelete, deleting, onDelete }: CardProps) {
  return (
    <article
      className="tg-shadow-sm rounded-xl"
      style={{
        backgroundColor: 'var(--tg-section-bg, var(--tg-bg))',
        padding: 14,
        border: '1px solid var(--tg-hairline)',
      }}
    >
      <div className="flex items-start gap-3">
        <div className="min-w-0 flex-1">
          <div
            className="font-medium leading-tight"
            style={{ fontSize: 15, color: 'var(--tg-text)' }}
          >
            {point.label}
          </div>
          {point.address && (
            <div
              className="mt-1"
              style={{ fontSize: 13, color: 'var(--tg-hint)', lineHeight: 1.4 }}
            >
              {point.address}
            </div>
          )}
          {point.schedule && (
            <div
              className="mt-1"
              style={{ fontSize: 13, color: 'var(--tg-hint)', lineHeight: 1.4 }}
            >
              🕐 {point.schedule}
            </div>
          )}
        </div>
        <button
          type="button"
          onClick={onDelete}
          disabled={!canDelete || deleting || !point.id}
          aria-label="Удалить эту точку"
          className="shrink-0 rounded-full flex items-center justify-center active:opacity-70 disabled:opacity-30 transition"
          style={{
            width: 32,
            height: 32,
            backgroundColor: 'var(--tg-secondary-bg)',
            color: 'var(--tg-destructive-text, #ff3b30)',
            transitionDuration: '150ms',
          }}
          title={!canDelete ? 'Должно остаться минимум одно место' : undefined}
        >
          <Trash2 size={16} strokeWidth={2} />
        </button>
      </div>
    </article>
  )
}

function Spinner({ inline = false }: { inline?: boolean }) {
  const spinner = (
    <div
      className="w-8 h-8 rounded-full animate-spin"
      style={{
        border: '3px solid var(--tg-link)',
        borderTopColor: 'transparent',
      }}
      aria-hidden="true"
    />
  )
  if (inline) return spinner
  return (
    <div
      className="h-full flex items-center justify-center"
      style={{ color: 'var(--tg-hint)' }}
    >
      {spinner}
    </div>
  )
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start justify-between gap-3 py-1">
      <span style={{ fontSize: 14, color: 'var(--tg-hint)' }}>{label}</span>
      <span
        className="text-right"
        style={{ fontSize: 14, color: 'var(--tg-text)' }}
      >
        {value}
      </span>
    </div>
  )
}

function Divider() {
  return (
    <div
      className="my-2"
      style={{ height: 1, backgroundColor: 'var(--tg-hairline)' }}
    />
  )
}
