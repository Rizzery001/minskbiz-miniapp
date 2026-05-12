import { useEffect } from 'react'
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
        <div className="flex-1 min-h-0">
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
        <Route path="/orders/success" element={<OrderSuccess />} />
      </Route>
      <Route path="*" element={<Navigate to="/farmers" replace />} />
    </Routes>
  )
}
