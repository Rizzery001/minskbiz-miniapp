import { Search } from 'lucide-react'
import { useState } from 'react'
import { ApiError, apiPost } from '../../api/client'
import type { GeocodeResponse, GeocodeResult } from '../../api/types'
import { hapticFeedback } from '../../lib/telegram'

interface Props {
  onPick: (result: GeocodeResult) => void
  // Optional proximity hint — if a caller already knows roughly where
  // the seller is (e.g. a first selling-point), pass it so the geocoder
  // can bias results toward that point. Defaults to Minsk centre.
  near?: { lat: number; lng: number }
}

// Minsk centre — used as the default bias when the caller doesn't have
// a better hint. Mirrors FarmersMap.MINSK_CENTER.
const DEFAULT_NEAR = { lat: 53.9006, lng: 27.559 }

export default function AddressSearch({ onPick, near }: Props) {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<GeocodeResult[] | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const trimmed = query.trim()
  const canSearch = trimmed.length >= 2 && !loading

  const runSearch = async () => {
    if (!canSearch) return
    setLoading(true)
    setError(null)
    setResults(null)
    try {
      const res = await apiPost<GeocodeResponse>('/geocode', {
        query: trimmed,
        limit: 5,
        country: 'BY',
        near: near ?? DEFAULT_NEAR,
      })
      setResults(res?.results ?? [])
    } catch (err: unknown) {
      const msg =
        err instanceof ApiError
          ? err.message
          : 'Не удалось выполнить поиск. Попробуйте ещё раз.'
      setError(msg)
    } finally {
      setLoading(false)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      void runSearch()
    }
  }

  const handlePick = (result: GeocodeResult) => {
    hapticFeedback.light()
    onPick(result)
    setResults(null)
    setQuery(result.label)
  }

  return (
    <div>
      <div className="flex gap-2">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Адрес или название места (например, Комаровский рынок)"
          className="flex-1 min-w-0 rounded-lg px-3 py-3 outline-none"
          style={{
            backgroundColor: 'var(--tg-secondary-bg)',
            color: 'var(--tg-text)',
            fontSize: 15,
            border: '1px solid var(--tg-hairline)',
          }}
        />
        <button
          type="button"
          onClick={runSearch}
          disabled={!canSearch}
          className="shrink-0 rounded-lg flex items-center justify-center gap-1.5 px-4 py-3 font-medium active:opacity-80 disabled:opacity-50 transition"
          style={{
            backgroundColor: 'var(--tg-button)',
            color: 'var(--tg-button-text)',
            fontSize: 14,
            transitionDuration: '150ms',
          }}
        >
          <Search size={16} strokeWidth={2} aria-hidden="true" />
          <span>Найти</span>
        </button>
      </div>

      {loading && (
        <p
          className="mt-2"
          style={{ fontSize: 13, color: 'var(--tg-hint)' }}
        >
          Ищем адрес…
        </p>
      )}

      {error && (
        <p
          className="mt-2"
          style={{
            fontSize: 13,
            color: 'var(--tg-destructive-text, #ff3b30)',
          }}
        >
          {error}
        </p>
      )}

      {!loading && !error && results !== null && results.length === 0 && (
        <p
          className="mt-2"
          style={{ fontSize: 13, color: 'var(--tg-hint)' }}
        >
          Не найдено, попробуйте ввести точнее.
        </p>
      )}

      {results !== null && results.length > 0 && (
        <ul
          className="mt-2 rounded-lg overflow-hidden"
          style={{
            backgroundColor: 'var(--tg-secondary-bg)',
            border: '1px solid var(--tg-hairline)',
          }}
        >
          {results.map((r, idx) => (
            <li
              key={`${r.lat},${r.lng},${idx}`}
              style={
                idx > 0
                  ? { borderTop: '1px solid var(--tg-hairline)' }
                  : undefined
              }
            >
              <button
                type="button"
                onClick={() => handlePick(r)}
                className="w-full text-left px-3 py-3 active:opacity-70 transition"
                style={{
                  color: 'var(--tg-text)',
                  fontSize: 14,
                  lineHeight: 1.35,
                  transitionDuration: '150ms',
                }}
              >
                {r.label}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
