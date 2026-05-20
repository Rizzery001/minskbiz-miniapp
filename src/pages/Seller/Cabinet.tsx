import { LogOut, Plus, Trash2 } from 'lucide-react'
import { useCallback, useState } from 'react'
import { ApiError, apiDelete } from '../../api/client'
import { useSeller, useSellingPoints } from '../../api/hooks'
import type { SellingPoint, SellingPointDeleteResponse } from '../../api/types'
import ErrorState from '../../components/ErrorState'
import { hapticFeedback } from '../../lib/telegram'
import AddSellingPointModal from './AddSellingPointModal'
import { SELLER_CATEGORIES } from './categories'

export default function SellerCabinet() {
  const { data: seller, loading, error, refetch } = useSeller(true)
  const {
    data: sellingPoints,
    loading: spLoading,
    error: spError,
    refetch: refetchPoints,
  } = useSellingPoints(true)

  const [showAddModal, setShowAddModal] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [deleteError, setDeleteError] = useState<string | null>(null)

  const points = sellingPoints ?? []
  const canDelete = points.length > 1

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
    </div>
  )
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
