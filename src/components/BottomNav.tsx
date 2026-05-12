import { NavLink } from 'react-router-dom'
import type { ReactNode } from 'react'
import { useCartCount } from '../lib/useCart'

export default function BottomNav() {
  const count = useCartCount()

  return (
    <nav
      className="fixed inset-x-0 bottom-0 z-[1000] flex"
      style={{
        height: 'calc(var(--bottom-nav-height) + env(safe-area-inset-bottom, 0px))',
        paddingBottom: 'env(safe-area-inset-bottom, 0px)',
        backgroundColor: 'var(--tg-bg)',
        boxShadow: '0 -1px 4px rgba(0,0,0,0.08)',
      }}
      aria-label="Нижняя навигация"
    >
      <NavItem to="/farmers" label="Карта" icon={<MapPinIcon />} />
      <NavItem to="/cart" label="Корзина" icon={<CartIcon />} badge={count} />
    </nav>
  )
}

interface NavItemProps {
  to: string
  label: string
  icon: ReactNode
  badge?: number
}

function NavItem({ to, label, icon, badge }: NavItemProps) {
  return (
    <NavLink
      to={to}
      className="flex-1 flex flex-col items-center justify-center gap-0.5 active:opacity-70"
    >
      {({ isActive }) => {
        const color = isActive ? 'var(--tg-link)' : 'var(--tg-hint)'
        return (
          <>
            <div className="relative" style={{ color }}>
              {icon}
              {badge !== undefined && badge > 0 && (
                <span
                  aria-label={`${badge} в корзине`}
                  style={{
                    position: 'absolute',
                    top: -4,
                    right: -8,
                    backgroundColor: '#ef4444',
                    color: '#ffffff',
                    fontSize: 10,
                    fontWeight: 600,
                    minWidth: 16,
                    height: 16,
                    padding: '0 4px',
                    borderRadius: 8,
                    lineHeight: '16px',
                    textAlign: 'center',
                    boxSizing: 'border-box',
                  }}
                >
                  {badge > 99 ? '99+' : badge}
                </span>
              )}
            </div>
            <span className="text-xs" style={{ color }}>
              {label}
            </span>
          </>
        )
      }}
    </NavLink>
  )
}

function MapPinIcon() {
  return (
    <svg
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0z" />
      <circle cx="12" cy="10" r="3" />
    </svg>
  )
}

function CartIcon() {
  return (
    <svg
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <circle cx="9" cy="21" r="1" />
      <circle cx="20" cy="21" r="1" />
      <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" />
    </svg>
  )
}
