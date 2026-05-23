import {
  ChevronRight,
  FileText,
  Info,
  Package,
  ShieldCheck,
  X,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { useMyOrders, useUserMe } from '../../api/hooks'
import { useAppContext } from '../../lib/context'
import { pluralize } from '../../lib/format'
import { backButton, getTelegramUser, hapticFeedback } from '../../lib/telegram'

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

const VERTICAL_LABELS: Record<string, string> = {
  fb: 'F&B покупатель',
  retail: 'Розница',
}

function formatVertical(vertical?: string): string | null {
  if (!vertical) return null
  return VERTICAL_LABELS[vertical] ?? vertical
}

interface MenuItem {
  to?: string
  onClick?: () => void
  icon: LucideIcon
  label: string
}

const APP_VERSION = 'v0.2'

export default function Profile() {
  const { data: user } = useUserMe()
  const tgUser = useMemo(getTelegramUser, [])
  // Kept unconditionally so the hook count stays stable across context
  // switches and so the screen still has data if the user later changes
  // tabs. Returns [] silently when there are no orders, which is the
  // expected steady state for waste-only users.
  const { data: orders } = useMyOrders({ limit: 100 })
  const context = useAppContext()
  const isWaste = context === 'waste'
  const [aboutOpen, setAboutOpen] = useState(false)

  const subtypeLabel = formatSubtype(user?.subtype)
  const verticalLabel = formatVertical(user?.vertical)

  const displayName = useMemo(() => {
    if (tgUser?.firstName) {
      const parts = [tgUser.firstName, tgUser.lastName].filter(Boolean)
      return parts.join(' ')
    }
    if (tgUser?.username) return `@${tgUser.username}`
    return 'Пользователь'
  }, [tgUser])

  const stats = useMemo(() => {
    if (!orders) return null
    let total = 0
    let active = 0
    let completed = 0
    for (const o of orders) {
      const t = o.estimated_total
      if (typeof t === 'number' && Number.isFinite(t)) total += t
      if (o.status === 'new' || o.status === 'confirmed') active += 1
      else if (o.status === 'delivered') completed += 1
    }
    return {
      count: orders.length,
      total,
      active,
      completed,
      currency: orders[0]?.listing_snapshot.currency ?? 'BYN',
    }
  }, [orders])

  // "Мои заказы" is a buyer-flow link — irrelevant in waste analytics
  // entry-points where the user came in to look at write-off stats, not
  // farmer orders. "О приложении" stays in every context (Privacy /
  // Terms must be reachable for legal compliance).
  const menu: MenuItem[] = [
    ...(isWaste
      ? []
      : [{ to: '/me/orders', icon: Package, label: 'Мои заказы' }]),
    {
      onClick: () => {
        hapticFeedback.light()
        setAboutOpen(true)
      },
      icon: Info,
      label: 'О приложении',
    },
  ]

  return (
    <div
      className="h-full overflow-y-auto p-4"
      style={{ color: 'var(--tg-text)' }}
    >
      <header
        className="flex items-center gap-3 mb-5 pb-5"
        style={{ borderBottom: '1px solid var(--tg-hairline)' }}
      >
        <Avatar photoUrl={tgUser?.photoUrl} fallback={displayName} />
        <div className="min-w-0 flex-1">
          <div
            className="font-semibold truncate"
            style={{ fontSize: 17, lineHeight: 1.2 }}
          >
            {displayName}
          </div>
          {!isWaste && (verticalLabel || subtypeLabel) && (
            <div
              className="mt-0.5 truncate"
              style={{ fontSize: 13, color: 'var(--tg-hint)' }}
            >
              {[verticalLabel, subtypeLabel].filter(Boolean).join(' · ')}
            </div>
          )}
          {tgUser?.username && tgUser.firstName && (
            <div
              className="mt-0.5 truncate"
              style={{ fontSize: 12, color: 'var(--tg-hint)' }}
            >
              @{tgUser.username}
            </div>
          )}
        </div>
      </header>

      {!isWaste && stats && stats.count > 0 && (
        <section
          className="rounded-xl mb-5 grid grid-cols-3"
          style={{
            backgroundColor: 'var(--tg-section-bg, var(--tg-secondary-bg))',
            padding: '14px 8px',
          }}
          aria-label="Статистика заказов"
        >
          <StatCell
            value={stats.count.toString()}
            label={pluralize(stats.count, ['заказ', 'заказа', 'заказов'])}
          />
          <StatCell
            value={`${stats.total.toFixed(0)}`}
            label={stats.currency}
            divider
          />
          <StatCell value={stats.active.toString()} label="в работе" divider />
        </section>
      )}

      <nav className="space-y-1" aria-label="Разделы профиля">
        {menu.map((item, idx) => {
          const Icon = item.icon
          const className =
            'flex items-center justify-between -mx-3 px-3 py-3 rounded-lg active:opacity-70 transition-opacity'
          const content = (
            <>
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
            </>
          )
          if (item.to) {
            return (
              <Link
                key={item.to}
                to={item.to}
                className={className}
                style={{ transitionDuration: '150ms' }}
              >
                {content}
              </Link>
            )
          }
          return (
            <button
              key={`menu-${idx}`}
              type="button"
              onClick={item.onClick}
              className={`w-full text-left ${className}`}
              style={{ transitionDuration: '150ms' }}
            >
              {content}
            </button>
          )
        })}
      </nav>

      <p
        className="mt-8 text-center text-xs"
        style={{ color: 'var(--tg-hint)' }}
      >
        Plenty • {APP_VERSION}
      </p>

      {aboutOpen && <AboutModal onClose={() => setAboutOpen(false)} />}
    </div>
  )
}

function Avatar({
  photoUrl,
  fallback,
}: {
  photoUrl?: string
  fallback: string
}) {
  const [errored, setErrored] = useState(false)
  const showPhoto = !!photoUrl && !errored
  const initial = fallback.trim().charAt(0).toUpperCase() || '👤'
  return (
    <div
      className="shrink-0 flex items-center justify-center rounded-full overflow-hidden"
      style={{
        width: 56,
        height: 56,
        backgroundColor: 'var(--tg-secondary-bg)',
        fontSize: 24,
      }}
      aria-hidden="true"
    >
      {showPhoto ? (
        <img
          src={photoUrl}
          alt=""
          width={56}
          height={56}
          onError={() => setErrored(true)}
          style={{ width: 56, height: 56, objectFit: 'cover' }}
        />
      ) : (
        <span>{initial}</span>
      )}
    </div>
  )
}

function StatCell({
  value,
  label,
  divider,
}: {
  value: string
  label: string
  divider?: boolean
}) {
  return (
    <div
      className="flex flex-col items-center justify-center text-center"
      style={
        divider
          ? { borderLeft: '1px solid var(--tg-hairline)', padding: '0 4px' }
          : { padding: '0 4px' }
      }
    >
      <span
        className="font-semibold tabular-nums"
        style={{ fontSize: 18, lineHeight: 1.1, color: 'var(--tg-text)' }}
      >
        {value}
      </span>
      <span
        className="mt-1"
        style={{ fontSize: 11, color: 'var(--tg-hint)', lineHeight: 1.2 }}
      >
        {label}
      </span>
    </div>
  )
}

function AboutModal({ onClose }: { onClose: () => void }) {
  useEffect(() => {
    backButton.show()
    backButton.onClick(onClose)
    return () => {
      backButton.offClick(onClose)
      backButton.hide()
    }
  }, [onClose])

  useEffect(() => {
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = prev
    }
  }, [])

  return (
    <>
      <div
        onClick={onClose}
        className="fixed inset-0 z-[1700]"
        style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}
        aria-hidden="true"
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-label="О приложении"
        className="fixed inset-x-0 bottom-0 z-[1800] flex flex-col tg-shadow-lg"
        style={{
          backgroundColor: 'var(--tg-bg)',
          color: 'var(--tg-text)',
          borderTopLeftRadius: 16,
          borderTopRightRadius: 16,
          paddingBottom: 'env(safe-area-inset-bottom, 0px)',
        }}
      >
        <header className="flex items-center justify-between px-4 pt-4 pb-3">
          <h2 className="font-semibold" style={{ fontSize: 17 }}>
            О приложении
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Закрыть"
            className="shrink-0 rounded-full flex items-center justify-center active:opacity-60 transition"
            style={{
              width: 32,
              height: 32,
              backgroundColor: 'var(--tg-secondary-bg)',
              color: 'var(--tg-text)',
              transitionDuration: '150ms',
            }}
          >
            <X size={18} />
          </button>
        </header>

        <div className="px-4 pb-5 flex flex-col gap-3">
          <div className="flex items-center gap-3">
            <span style={{ fontSize: 28 }} aria-hidden="true">
              🌾
            </span>
            <div>
              <div className="font-semibold" style={{ fontSize: 16 }}>
                Plenty
              </div>
              <div style={{ fontSize: 13, color: 'var(--tg-hint)' }}>
                {APP_VERSION}
              </div>
            </div>
          </div>
          <p
            style={{
              fontSize: 14,
              color: 'var(--tg-text)',
              lineHeight: 1.5,
            }}
          >
            Маркетплейс фермерских продуктов и аналитика списаний для
            небольших F&B-заведений в Минске и области.
          </p>
          <nav
            className="rounded-lg overflow-hidden"
            style={{
              backgroundColor: 'var(--tg-secondary-bg)',
            }}
            aria-label="Правовые документы"
          >
            <LegalLink
              to="/privacy"
              icon={ShieldCheck}
              label="Политика конфиденциальности"
              onNavigate={onClose}
            />
            <div
              style={{
                height: 1,
                marginLeft: 44,
                backgroundColor: 'var(--tg-hairline)',
              }}
            />
            <LegalLink
              to="/terms"
              icon={FileText}
              label="Условия использования"
              onNavigate={onClose}
            />
          </nav>
          <div
            className="rounded-lg p-3"
            style={{
              backgroundColor: 'var(--tg-secondary-bg)',
              fontSize: 13,
              color: 'var(--tg-hint)',
              lineHeight: 1.45,
            }}
          >
            Разработано <span style={{ color: 'var(--tg-text)' }}>Glitchlab Ltd</span>
            . По вопросам и предложениям пишите в Telegram-чат поддержки.
          </div>
        </div>
      </div>
    </>
  )
}

function LegalLink({
  to,
  icon: Icon,
  label,
  onNavigate,
}: {
  to: string
  icon: LucideIcon
  label: string
  onNavigate: () => void
}) {
  return (
    <Link
      to={to}
      onClick={onNavigate}
      className="flex items-center justify-between gap-3 px-3 py-3 active:opacity-70 transition"
      style={{ transitionDuration: '150ms' }}
    >
      <span className="flex items-center gap-3 min-w-0">
        <Icon
          size={20}
          strokeWidth={2}
          style={{ color: 'var(--tg-link)' }}
          aria-hidden="true"
        />
        <span
          className="truncate"
          style={{ fontSize: 14, color: 'var(--tg-text)' }}
        >
          {label}
        </span>
      </span>
      <ChevronRight
        size={16}
        strokeWidth={2}
        style={{ color: 'var(--tg-hint)' }}
        aria-hidden="true"
      />
    </Link>
  )
}
