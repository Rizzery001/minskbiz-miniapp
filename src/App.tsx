import { Navigate, Route, Routes } from 'react-router-dom'
import FarmersMap from './pages/FarmersMap'

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/farmers" replace />} />
      <Route path="/farmers" element={<FarmersMap />} />
      <Route path="*" element={<Navigate to="/farmers" replace />} />
    </Routes>
  )
}
