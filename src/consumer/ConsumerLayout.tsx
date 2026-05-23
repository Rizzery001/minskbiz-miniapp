import { Outlet } from 'react-router-dom'
import ConsumerBottomNav from './ConsumerBottomNav'

/**
 * Chrome for every consumer screen — slim branded top bar + flexible
 * content area + bottom nav. The content area reserves space for the
 * fixed-position nav via paddingBottom, mirroring the buyer Layout.
 */
export default function ConsumerLayout() {
  return (
    <>
      <div
        className="h-full flex flex-col"
        style={{
          paddingBottom:
            'calc(var(--bottom-nav-height) + env(safe-area-inset-bottom, 0px))',
          backgroundColor: 'var(--tg-bg)',
          color: 'var(--tg-text)',
        }}
      >
        <header
          className="flex items-center justify-center shrink-0"
          style={{
            height: 44,
            borderBottom: '1px solid var(--tg-hairline)',
            backgroundColor: 'var(--tg-bg)',
          }}
        >
          <span
            style={{
              fontSize: 15,
              fontWeight: 600,
              color: 'var(--tg-text)',
              letterSpacing: 0.2,
            }}
          >
            🎁 Krana Box
          </span>
        </header>
        <div className="flex-1 min-h-0">
          <Outlet />
        </div>
      </div>
      <ConsumerBottomNav />
    </>
  )
}
