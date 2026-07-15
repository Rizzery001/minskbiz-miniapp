import { Outlet } from 'react-router-dom'
import ConsumerBottomNav from './ConsumerBottomNav'

/**
 * Chrome for every consumer screen — content area + bottom nav. The
 * WebApp system title ("Plenty") is the only header; content starts
 * at the top. The content area reserves space for the fixed-position
 * nav via paddingBottom, mirroring the buyer Layout.
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
        <div className="flex-1 min-h-0">
          <Outlet />
        </div>
      </div>
      <ConsumerBottomNav />
    </>
  )
}
