import { Navigate, Route, Routes } from 'react-router-dom'
import AccountPage from './AccountPage'
import LandingPage from './LandingPage'
import PublicStyles from './PublicStyles'
import SiteHeader from './SiteHeader'
import { PALETTE } from './branding'

/**
 * Public plenty.by site — mounted by App.tsx for plain-browser visitors
 * (no Telegram initData, no role param). /boxes is the landing scrolled
 * to the live storefront section; /account is the web cabinet
 * (Telegram Login Widget, same account as the mini-app).
 */
export default function PublicApp() {
  return (
    <div
      className="plenty-site min-h-full flex flex-col"
      style={{ backgroundColor: PALETTE.bg }}
    >
      <PublicStyles />
      <SiteHeader />
      <div className="flex-1">
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/boxes" element={<LandingPage />} />
          <Route path="/account" element={<AccountPage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </div>
    </div>
  )
}
