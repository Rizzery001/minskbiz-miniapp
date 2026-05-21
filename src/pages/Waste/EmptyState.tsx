import { MIN_RECORDS_FOR_STATS } from './constants'

interface Props {
  reason: 'empty' | 'error'
  message?: string
  onShowDemo?: () => void
  onRetry?: () => void
}

export default function EmptyState({
  reason,
  message,
  onShowDemo,
  onRetry,
}: Props) {
  if (reason === 'error') {
    return (
      <div
        className="h-full flex flex-col items-center justify-center px-6 text-center"
        style={{ color: 'var(--tg-text)' }}
      >
        <div className="text-5xl mb-4" aria-hidden="true">
          ⚠️
        </div>
        <h2 className="text-lg font-semibold mb-2">Что-то пошло не так</h2>
        {message && (
          <p
            className="mb-6 text-sm leading-relaxed"
            style={{ color: 'var(--tg-hint)' }}
          >
            {message}
          </p>
        )}
        {onRetry && (
          <button
            type="button"
            onClick={onRetry}
            className="px-6 py-3 rounded-lg font-medium active:opacity-70 transition-opacity"
            style={{
              backgroundColor: 'var(--tg-button)',
              color: 'var(--tg-button-text)',
              transitionDuration: '150ms',
            }}
          >
            Попробовать снова
          </button>
        )}
      </div>
    )
  }

  return (
    <div
      className="h-full flex flex-col items-center justify-center px-6 text-center"
      style={{ color: 'var(--tg-text)' }}
    >
      <div className="text-5xl mb-4" aria-hidden="true">
        📊
      </div>
      <h2 className="text-lg font-semibold mb-2">Аналитика списаний</h2>
      <p
        className="mb-8 text-sm leading-relaxed max-w-xs"
        style={{ color: 'var(--tg-hint)' }}
      >
        Здесь появятся графики ваших списаний — по дням, причинам и позициям.
        <br />
        <br />
        Нужно записать минимум <b>{MIN_RECORDS_FOR_STATS} списания</b> за
        последний месяц, чтобы собрать статистику.
      </p>
      <div className="flex flex-col gap-3 w-full max-w-xs">
        {onShowDemo && (
          <button
            type="button"
            onClick={onShowDemo}
            className="px-6 py-3 rounded-lg font-medium active:opacity-70 transition-opacity"
            style={{
              backgroundColor: 'var(--tg-button)',
              color: 'var(--tg-button-text)',
              transitionDuration: '150ms',
            }}
          >
            📈 Посмотреть демо
          </button>
        )}
        <button
          type="button"
          onClick={() => window.Telegram?.WebApp?.close()}
          className="px-6 py-3 rounded-lg font-medium active:opacity-70 transition-opacity"
          style={{
            backgroundColor: 'transparent',
            color: 'var(--tg-text)',
            border: '1px solid var(--tg-hairline)',
            transitionDuration: '150ms',
          }}
        >
          Записать первое списание
        </button>
      </div>
    </div>
  )
}
