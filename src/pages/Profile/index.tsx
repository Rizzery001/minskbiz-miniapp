import { ChevronRight, Package } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { Link } from 'react-router-dom'
import { useUserMe } from '../../api/hooks'

const SUBTYPE_LABELS: Record<string, string> = {
  fb_coffee: '☕ Кофейня',
  fb_bakery: '🥐 Пекарня',
  fb_bar: '🍷 Бар / винотека',
  fb_bistro: '🍲 Бистро / столовая',
  fb_foodtruck: '🚚 Фудтрак',
  fb_other: '🍕 F&B заведение',
}

function formatSubtype(subtype?: string): string | null {
  if (!subtype) return null
  return SUBTYPE_LABELS[subtype] ?? 'F&B заведение'
}

interface MenuItem {
  to: string
  icon: LucideIcon
  label: string
}

const MENU: MenuItem[] = [{ to: '/me/orders', icon: Package, label: 'Мои заказы' }]

export default function Profile() {
  const { data: user } = useUserMe()
  const subtypeLabel = formatSubtype(user?.subtype)

  return (
    <div
      className="h-full overflow-y-auto p-4"
      style={{ color: 'var(--tg-text)' }}
    >
      <header
        className="flex items-center gap-3 mb-6 pb-6"
        style={{ borderBottom: '1px solid var(--tg-hairline)' }}
      >
        <div
          className="flex items-center justify-center rounded-full text-2xl"
          style={{
            width: 56,
            height: 56,
            backgroundColor: 'var(--tg-secondary-bg)',
          }}
          aria-hidden="true"
        >
          👤
        </div>
        <div className="min-w-0 flex-1">
          <div className="font-semibold text-base truncate">Пользователь</div>
          {subtypeLabel && (
            <div
              className="text-sm truncate"
              style={{ color: 'var(--tg-hint)' }}
            >
              {subtypeLabel}
            </div>
          )}
        </div>
      </header>

      <nav className="space-y-1" aria-label="Разделы профиля">
        {MENU.map((item) => {
          const Icon = item.icon
          return (
            <Link
              key={item.to}
              to={item.to}
              className="flex items-center justify-between -mx-3 px-3 py-3 rounded-lg active:opacity-70 transition-opacity"
              style={{ transitionDuration: '150ms' }}
            >
              <div className="flex items-center gap-3">
                <Icon
                  size={20}
                  strokeWidth={2}
                  style={{ color: 'var(--tg-link)' }}
                  aria-hidden="true"
                />
                <span className="font-medium">{item.label}</span>
              </div>
              <ChevronRight
                size={16}
                strokeWidth={2}
                style={{ color: 'var(--tg-hint)' }}
                aria-hidden="true"
              />
            </Link>
          )
        })}
      </nav>

      <p
        className="mt-8 text-center text-xs"
        style={{ color: 'var(--tg-hint)' }}
      >
        Krana • v0.1
      </p>
    </div>
  )
}
