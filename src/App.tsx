import { lazy, Suspense, useEffect } from 'react'
import { Navigate, Outlet, Route, Routes } from 'react-router-dom'
import { useUserMe } from './api/hooks'
import BottomNav from './components/BottomNav'
import DemoBanner from './components/DemoBanner'
import ErrorState from './components/ErrorState'
import {
  applyTheme,
  init as tgInit,
  onThemeChanged,
} from './lib/telegram'
import Cart from './pages/Cart'
import FarmersMap from './pages/FarmersMap'
import OrderSuccess from './pages/OrderSuccess'
import Orders from './pages/Orders'

const Profile = lazy(() => import('./pages/Profile'))
const Waste = lazy(() => import('./pages/Waste'))

function PageLoader() {
  return (
    <div
      className="h-full flex items-center justify-center"
      style={{ color: 'var(--tg-hint)' }}
    >
      <div
        className="w-8 h-8 rounded-full animate-spin"
        style={{
          border: '3px solid var(--tg-link)',
          borderTopColor: 'transparent',
        }}
        aria-hidden="true"
      />
    </div>
  )
}

function Layout() {
  return (
    <>
      <div
        className="h-full flex flex-col"
        style={{
          paddingBottom:
            'calc(var(--bottom-nav-height) + env(safe-area-inset-bottom, 0px))',
        }}
      >
        <DemoBanner />
        <div className="flex-1 min-h-0 overflow-y-auto">
          <Outlet />
        </div>
      </div>
      <BottomNav />
    </>
  )
}

export default function App() {
  const { error } = useUserMe()

  useEffect(() => {
    tgInit()
    applyTheme()
    return onThemeChanged(applyTheme)
  }, [])

  if (error?.code === 'unauthorized') {
    return (
      <div
        className="w-full h-full flex items-center justify-center"
        style={{ backgroundColor: 'var(--tg-bg)' }}
      >
        <ErrorState
          title="Откройте через Telegram"
          message="Для доступа к карте нужно открыть приложение из Telegram."
        />
      </div>
    )
  }

  return (
    <Routes>
      <Route path="/" element={<Navigate to="/farmers" replace />} />
      <Route element={<Layout />}>
        <Route path="/farmers" element={<FarmersMap />} />
        <Route path="/cart" element={<Cart />} />
        <Route
          path="/orders"
          element={<Navigate to="/me/orders" replace />}
        />
        <Route
          path="/orders/success"
          element={<Navigate to="/me/orders/success" replace />}
        />
        <Route
          path="/waste"
          element={
            <Suspense fallback={<PageLoader />}>
              <Waste />
            </Suspense>
          }
        />
        <Route
          path="/me"
          element={
            <Suspense fallback={<PageLoader />}>
              <Profile />
            </Suspense>
          }
        />
        <Route path="/me/orders" element={<Orders />} />
        <Route path="/me/orders/success" element={<OrderSuccess />} />
      </Route>
      <Route path="*" element={<Navigate to="/farmers" replace />} />
    </Routes>
  )
}
