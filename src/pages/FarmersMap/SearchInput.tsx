import { Search, X } from 'lucide-react'

interface Props {
  value: string
  onChange: (v: string) => void
  placeholder?: string
}

export default function SearchInput({ value, onChange, placeholder }: Props) {
  return (
    <div
      className="search-input-wrapper flex items-center gap-2 rounded-xl transition"
      style={{
        backgroundColor: 'var(--tg-bg)',
        border: '1px solid var(--tg-hairline)',
        padding: '10px 12px',
        transitionDuration: '150ms',
      }}
    >
      <Search
        size={16}
        aria-hidden="true"
        style={{ color: 'var(--tg-hint)', flexShrink: 0 }}
      />
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="search-input flex-1 min-w-0 bg-transparent outline-none"
        style={{ fontSize: 14, color: 'var(--tg-text)' }}
        aria-label={placeholder ?? 'Поиск'}
        enterKeyHint="search"
        autoCapitalize="none"
        autoCorrect="off"
      />
      {value !== '' && (
        <button
          type="button"
          onClick={() => onChange('')}
          aria-label="Очистить поиск"
          className="shrink-0 active:opacity-60 inline-flex items-center justify-center"
          style={{ color: 'var(--tg-hint)' }}
        >
          <X size={16} />
        </button>
      )}
    </div>
  )
}
