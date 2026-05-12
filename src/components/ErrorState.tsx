interface Props {
  title?: string
  message: string
  onRetry?: () => void
}

export default function ErrorState({
  title = 'Что-то пошло не так',
  message,
  onRetry,
}: Props) {
  return (
    <div className="flex flex-col items-center justify-center p-6 text-center">
      <div className="text-4xl mb-2" aria-hidden="true">
        😕
      </div>
      <h2 className="text-lg font-semibold mb-1" style={{ color: 'var(--tg-text)' }}>
        {title}
      </h2>
      <p className="text-sm mb-4" style={{ color: 'var(--tg-hint)' }}>
        {message}
      </p>
      {onRetry && (
        <button
          type="button"
          onClick={onRetry}
          className="px-4 py-2 rounded-lg text-sm font-medium active:opacity-80"
          style={{
            backgroundColor: 'var(--tg-button)',
            color: 'var(--tg-button-text)',
          }}
        >
          Попробовать ещё раз
        </button>
      )}
    </div>
  )
}
