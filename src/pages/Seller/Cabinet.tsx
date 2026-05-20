import { LogOut } from 'lucide-react'
import { useSeller } from '../../api/hooks'
import ErrorState from '../../components/ErrorState'
import { hapticFeedback } from '../../lib/telegram'
import { SELLER_CATEGORIES } from './categories'

export default function SellerCabinet() {
  const { data: seller, loading, error, refetch } = useSeller(true)

  if (loading) {
    return (
      <div
        className="h-full flex items-center justify-center"
        style={{ color: 'var(--tg-hint)' }}
      >
        <div
          className="w-8 h-8 rounded-full animate-spin"
          style={{
            border: '3px solid var(--tg-link)',
            borderTopColor: 'transparent',
          }}
          aria-hidden="true"
        />
      </div>
    )
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
        {seller.location_label && (
          <>
            <Divider />
            <InfoRow label="Адрес" value={seller.location_label} />
          </>
        )}
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
