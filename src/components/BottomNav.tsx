import { BarChart3, MapPin, Package, ShoppingCart, User } from 'lucide-react'
import type { ReactNode } from 'react'
import { NavLink } from 'react-router-dom'
import { useCartCount } from '../lib/useCart'

export default function BottomNav() {
  const count = useCartCount()

  return (
    <nav
      className="bottom-nav fixed inset-x-0 bottom-0 z-[1000] flex"
      style={{
        height:
          'calc(var(--bottom-nav-height) + env(safe-area-inset-bottom, 0px))',
        paddingBottom: 'env(safe-area-inset-bottom, 0px)',
        backgroundColor: 'var(--tg-bottom-bar-bg, var(--tg-bg))',
      }}
      aria-label="Нижняя навигация"
    >
      <NavItem
        to="/farmers"
        label="Карта"
        icon={<MapPin size={24} strokeWidth={2} aria-hidden="true" />}
      />
      <NavItem
        to="/cart"
        label="Корзина"
        icon={<ShoppingCart size={24} strokeWidth={2} aria-hidden="true" />}
        badge={count}
      />
      <NavItem
        to="/orders"
        label="Заказы"
        icon={<Package size={24} strokeWidth={2} aria-hidden="true" />}
      />
      <NavItem
        to="/waste"
        label="Аналитика"
        icon={<BarChart3 size={24} strokeWidth={2} aria-hidden="true" />}
      />
      <NavItem
        to="/me"
        label="Я"
        icon={<User size={24} strokeWidth={2} aria-hidden="true" />}
      />
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
      end={to === '/orders' ? false : undefined}
      className="flex-1 flex flex-col items-center justify-center gap-0.5 active:opacity-70 transition-opacity"
      style={{ transitionDuration: '150ms' }}
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
                    right: -10,
                    minWidth: 18,
                    height: 18,
                    padding: '0 5px',
                    borderRadius: 9,
                    backgroundColor: '#ff3b30',
                    color: '#ffffff',
                    fontSize: 11,
                    fontWeight: 500,
                    lineHeight: '18px',
                    textAlign: 'center',
                    boxShadow:
                      '0 0 0 2px var(--tg-bottom-bar-bg, var(--tg-bg))',
                    boxSizing: 'border-box',
                  }}
                >
                  {badge > 99 ? '99+' : badge}
                </span>
              )}
            </div>
            <span
              style={{
                fontSize: 11,
                fontWeight: isActive ? 500 : 400,
                color,
              }}
            >
              {label}
            </span>
          </>
        )
      }}
    </NavLink>
  )
}
