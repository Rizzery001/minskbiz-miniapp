import { Navigate, Route, Routes } from 'react-router-dom'
import ConsumerLayout from './ConsumerLayout'
import BookingsScreen from './screens/BookingsScreen'
import MapScreen from './screens/MapScreen'
import ProfileScreen from './screens/ProfileScreen'

/**
 * Root of the consumer (chef-box) experience. Mounted by App.tsx
 * whenever ?role=consumer is detected. Holds its own router so the
 * routes never collide with the buyer/seller route tables.
 */
export default function ConsumerApp() {
  return (
    <Routes>
      <Route element={<ConsumerLayout />}>
        <Route path="/" element={<MapScreen />} />
        <Route path="/bookings" element={<BookingsScreen />} />
        <Route path="/profile" element={<ProfileScreen />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
