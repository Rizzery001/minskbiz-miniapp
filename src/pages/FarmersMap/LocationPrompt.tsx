interface Props {
  onUseMinsk: () => void
}

export default function LocationPrompt({ onUseMinsk }: Props) {
  return (
    <div
      className="absolute inset-x-4 top-1/2 -translate-y-1/2 z-[1000] rounded-2xl p-5 shadow-2xl"
      style={{ backgroundColor: 'var(--tg-bg)' }}
    >
      <h2
        className="text-lg font-semibold mb-2"
        style={{ color: 'var(--tg-text)' }}
      >
        Где вы находитесь?
      </h2>
      <p className="text-sm mb-4" style={{ color: 'var(--tg-hint)' }}>
        Не удалось определить местоположение. Выберите вариант:
      </p>
      <button
        type="button"
        onClick={onUseMinsk}
        className="w-full py-3 rounded-xl text-sm font-medium mb-2 active:opacity-80"
        style={{
          backgroundColor: 'var(--tg-button)',
          color: 'var(--tg-button-text)',
        }}
      >
        Использовать центр Минска
      </button>
      {/* TODO День 2+: ввод адреса с геокодированием через Nominatim */}
      <button
        type="button"
        disabled
        className="w-full py-3 rounded-xl text-sm font-medium opacity-50 cursor-not-allowed"
        style={{
          backgroundColor: 'var(--tg-secondary-bg)',
          color: 'var(--tg-text)',
        }}
      >
        Ввести адрес (скоро)
      </button>
    </div>
  )
}
