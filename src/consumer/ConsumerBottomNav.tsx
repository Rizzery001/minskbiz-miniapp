import { ClipboardList, Map as MapIcon, User } from 'lucide-react'
import type { ReactNode } from 'react'
import { NavLink } from 'react-router-dom'

/**
 * Three-tab bottom nav for consumer mode. Identical visual language to
 * the buyer BottomNav (so users moving between roles stay oriented)
 * but with its own route table — strictly Map / Bookings / Profile.
 */
export default function ConsumerBottomNav() {
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
        to="/"
        end
        label="Карта"
        icon={<MapIcon size={24} strokeWidth={2} aria-hidden="true" />}
      />
      <NavItem
        to="/bookings"
        label="Брони"
        icon={<ClipboardList size={24} strokeWidth={2} aria-hidden="true" />}
      />
      <NavItem
        to="/profile"
        label="Профиль"
        icon={<User size={24} strokeWidth={2} aria-hidden="true" />}
      />
    </nav>
  )
}

interface NavItemProps {
  to: string
  label: string
  icon: ReactNode
  end?: boolean
}

function NavItem({ to, label, icon, end }: NavItemProps) {
  return (
    <NavLink
      to={to}
      end={end}
      className="flex-1 flex flex-col items-center justify-center gap-0.5 active:opacity-70 transition-opacity"
      style={{ transitionDuration: '150ms' }}
    >
      {({ isActive }) => {
        const color = isActive ? 'var(--tg-link)' : 'var(--tg-hint)'
        return (
          <>
            <div style={{ color }}>{icon}</div>
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
