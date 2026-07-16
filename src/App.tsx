import { lazy, Suspense, useEffect } from 'react'
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
import { useConsumerRole } from './lib/consumerRole'
import { getAppContext } from './lib/context'
import { useSellerRole } from './lib/sellerRole'
import {
  applyTheme,
  getInitData,
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
const PrivacyPage = lazy(() => import('./pages/Legal/PrivacyPage'))
const TermsPage = lazy(() => import('./pages/Legal/TermsPage'))
const ConsumerApp = lazy(() => import('./consumer/ConsumerApp'))
const PublicApp = lazy(() => import('./public/PublicApp'))

const LEGAL_PATHS = new Set(['/privacy', '/terms'])

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
  const location = useLocation()
  const sellerMode = useSellerRole()
  const consumerMode = useConsumerRole()
  const { error } = useUserMe()

  useEffect(() => {
    tgInit()
    applyTheme()
    return onThemeChanged(applyTheme)
  }, [])

  // Public legal pages — accessible without Telegram auth, no chrome.
  // Rendered before the unauthorized gate so they work in plain
  // browsers (App Store, support emails, About modal external links).
  if (LEGAL_PATHS.has(location.pathname)) {
    return (
      <Suspense fallback={<PageLoader />}>
        <Routes>
          <Route path="/privacy" element={<PrivacyPage />} />
          <Route path="/terms" element={<TermsPage />} />
        </Routes>
      </Suspense>
    )
  }

  // Consumer mode is its own isolated flow signed by a different bot
  // (BOX_BOT_TOKEN), so /user/me 401s from the main-bot initData check
  // shouldn't gate it. Mount ConsumerApp before the unauthorized branch.
  if (consumerMode) {
    return (
      <Suspense fallback={<PageLoader />}>
        <ConsumerApp />
      </Suspense>
    )
  }

  // Plain-browser visitor (no Telegram initData, no role param) — the
  // public plenty.by site. Inside Telegram initData is always present,
  // so every mini-app mode is untouched.
  if (!getInitData() && !sellerMode) {
    return (
      <Suspense fallback={<PageLoader />}>
        <PublicApp />
      </Suspense>
    )
  }

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
