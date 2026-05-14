export default function LoadingState() {
  return (
    <div
      className="h-full flex flex-col items-center justify-center"
      style={{ color: 'var(--tg-hint)' }}
    >
      <div
        className="w-10 h-10 rounded-full animate-spin mb-3"
        style={{
          border: '4px solid var(--tg-link)',
          borderTopColor: 'transparent',
        }}
        aria-hidden="true"
      />
      <p style={{ fontSize: 13 }}>Загружаю статистику…</p>
    </div>
  )
}
