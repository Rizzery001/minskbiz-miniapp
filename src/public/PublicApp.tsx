import { Navigate, Route, Routes } from 'react-router-dom'
import LandingPage from './LandingPage'

/**
 * Public plenty.by site — mounted by App.tsx for plain-browser visitors
 * (no Telegram initData, no role param). /boxes is the landing scrolled
 * to the live storefront section.
 */
export default function PublicApp() {
  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route path="/boxes" element={<LandingPage />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
