export default function Profile() {
  return (
    <div
      className="h-full flex flex-col items-center justify-center px-6 text-center"
      style={{ color: 'var(--tg-text)' }}
    >
      <div className="text-5xl mb-4" aria-hidden="true">
        👤
      </div>
      <h2 className="text-lg font-semibold mb-2">Профиль</h2>
      <p
        className="text-sm leading-relaxed max-w-xs"
        style={{ color: 'var(--tg-hint)' }}
      >
        Скоро здесь будут настройки и сводка по аккаунту.
      </p>
    </div>
  )
}
