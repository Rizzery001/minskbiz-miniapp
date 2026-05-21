import { lazy, Suspense, useEffect, useMemo } from 'react'
import {
  Navigate,
  Outlet,
  Route,
  Routes,
  useLocation,
  useNavigate,
} from 'react-router-dom'
import { useSeller, useUserMe } from './api/hooks'
import BottomNav from './components/BottomNav'
import DemoBanner from './components/DemoBanner'
import ErrorState from './components/ErrorState'
import { getAppContext } from './lib/context'
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
const SellerWelcome = lazy(() => import('./pages/Seller/Welcome'))
const SellerRegister = lazy(() => import('./pages/Seller/Register'))
const SellerLogin = lazy(() => import('./pages/Seller/Login'))
const SellerCabinet = lazy(() => import('./pages/Seller/Cabinet'))
const SellerEdit = lazy(() => import('./pages/Seller/Edit'))

const SELLER_ROLE_KEY = 'krana_role'

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

function SellerLayout() {
  return (
    <div
      className="h-full overflow-y-auto"
      style={{ backgroundColor: 'var(--tg-bg)', color: 'var(--tg-text)' }}
    >
      <Outlet />
    </div>
  )
}

function isSellerRole(): boolean {
  if (typeof window === 'undefined') return false
  const params = new URLSearchParams(window.location.search)
  if (params.get('role') === 'seller') {
    try {
      window.sessionStorage.setItem(SELLER_ROLE_KEY, '1')
    } catch {
      // ignore storage errors
    }
    return true
  }
  try {
    return window.sessionStorage.getItem(SELLER_ROLE_KEY) === '1'
  } catch {
    return false
  }
}

function SellerGate() {
  const navigate = useNavigate()
  const location = useLocation()
  const { data, loading, notFound, error, refetch } = useSeller(true)

  useEffect(() => {
    if (loading || error) return
    if (location.pathname !== '/' && location.pathname !== '/seller') return
    if (data) {
      navigate('/seller/cabinet', { replace: true })
    } else if (notFound) {
      navigate('/seller/welcome', { replace: true })
    }
  }, [data, loading, notFound, error, location.pathname, navigate])

  if (loading) {
    return <PageLoader />
  }

  if (error) {
    return (
      <div
        className="w-full h-full flex items-center justify-center"
        style={{ backgroundColor: 'var(--tg-bg)' }}
      >
        <ErrorState
          title="Не удалось загрузить"
          message={error.message}
          onRetry={refetch}
        />
      </div>
    )
  }

  return null
}

export default function App() {
  const sellerMode = useMemo(() => isSellerRole(), [])
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

  if (sellerMode) {
    return (
      <Routes>
        <Route path="/" element={<SellerGate />} />
        <Route path="/seller" element={<SellerGate />} />
        <Route element={<SellerLayout />}>
          <Route
            path="/seller/welcome"
            element={
              <Suspense fallback={<PageLoader />}>
                <SellerWelcome />
              </Suspense>
            }
          />
          <Route
            path="/seller/register"
            element={
              <Suspense fallback={<PageLoader />}>
                <SellerRegister />
              </Suspense>
            }
          />
          <Route
            path="/seller/login"
            element={
              <Suspense fallback={<PageLoader />}>
                <SellerLogin />
              </Suspense>
            }
          />
          <Route
            path="/seller/cabinet"
            element={
              <Suspense fallback={<PageLoader />}>
                <SellerCabinet />
              </Suspense>
            }
          />
          <Route
            path="/seller/edit"
            element={
              <Suspense fallback={<PageLoader />}>
                <SellerEdit />
              </Suspense>
            }
          />
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    )
  }

  // Default landing route depends on entry-point context — waste users
  // should land on the analytics screen, not the farmers map.
  const defaultRoute = getAppContext() === 'waste' ? '/waste' : '/farmers'

  return (
    <Routes>
      <Route path="/" element={<Navigate to={defaultRoute} replace />} />
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
      <Route path="*" element={<Navigate to={defaultRoute} replace />} />
    </Routes>
  )
}
