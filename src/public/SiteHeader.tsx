import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useWebAuth } from './auth'
import { PALETTE } from './branding'

/** Sticky top bar of the public site. */
export default function SiteHeader() {
  const auth = useWebAuth()
  const navigate = useNavigate()
  const location = useLocation()

  const goToSection = (id: string) => {
    if (location.pathname !== '/') {
      navigate(`/#${id}`)
      return
    }
    document
      .getElementById(id)
      ?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  return (
    <header
      className="sticky top-0 z-[1000] flex items-center justify-between px-5"
      style={{
        height: 56,
        backgroundColor: 'rgba(18, 17, 16, 0.92)',
        backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)',
        borderBottom: `1px solid ${PALETTE.hairline}`,
        color: PALETTE.text,
      }}
    >
      <Link
        to="/"
        className="font-bold flex items-center gap-1.5"
        style={{ fontSize: 18, color: PALETTE.text }}
      >
        <span aria-hidden="true">👨‍🍳</span>
        <span>Plenty</span>
      </Link>

      <nav className="hidden sm:flex items-center gap-5">
        <button
          type="button"
          onClick={() => goToSection('boxes')}
          style={{ fontSize: 14, color: PALETTE.textMuted }}
        >
          Боксы
        </button>
        <button
          type="button"
          onClick={() => goToSection('partners')}
          style={{ fontSize: 14, color: PALETTE.textMuted }}
        >
          Заведениям
        </button>
      </nav>

      <Link
        to="/account"
        className="px-4 py-2 rounded-xl font-semibold active:opacity-80 transition"
        style={{
          fontSize: 14,
          transitionDuration: '150ms',
          ...(auth.status === 'authenticated'
            ? {
                border: `1px solid ${PALETTE.hairline}`,
                color: PALETTE.text,
              }
            : { backgroundColor: PALETTE.gold, color: '#171310' }),
        }}
      >
        {auth.status === 'authenticated' ? 'Кабинет' : 'Войти'}
      </Link>
    </header>
  )
}
