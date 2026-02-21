import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import './store/authStore' // hydrate auth from localStorage before any route
import AppLayout from './components/AppLayout'
import HomePage from './pages/HomePage'
import AlertsPage from './pages/AlertsPage'
import MessagesPage from './pages/MessagesPage'
import OpportunitiesPage from './pages/OpportunitiesPage'
import ProfilePage from './pages/ProfilePage'
import NetworkPage from './pages/NetworkPage'
import SettingsPage from './pages/SettingsPage'
import WeatherPage from './pages/WeatherPage'
import MarketPage from './pages/MarketPage'
import Login from './pages/Login'
import Register from './pages/Register'
import ForgotPassword from './pages/ForgotPassword'

function App() {
  return (
    <Router>
      <Toaster position="top-center" toastOptions={{ duration: 4000 }} />
      <Routes>
        {/* Auth routes: no sidebar layout */}
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />

        {/* App routes: shared AppLayout (sidebar + Outlet) */}
        <Route element={<AppLayout />}>
          <Route path="/" element={<HomePage />} />
          <Route path="/feed" element={<HomePage />} />
          <Route path="/alerts" element={<AlertsPage />} />
          <Route path="/notifications" element={<AlertsPage />} />
          <Route path="/messages" element={<MessagesPage />} />
          <Route path="/opportunities" element={<div><center><br/><br/><br/><br/><br/><br/><br/><br/><br/><br/><br/><br/><br/><br/><br/>Opportunities page is coming soon...</center></div>} />
          <Route path="/jobs" element={<OpportunitiesPage />} />
          <Route path="/profile" element={<ProfilePage />} />
          <Route path="/profile/:userId" element={<ProfilePage />} />
          <Route path="/network" element={<NetworkPage />} />
          <Route path="/settings" element={<SettingsPage />} />
          <Route path="/weather" element={<WeatherPage />} />
          <Route path="/market" element={<MarketPage />} />
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  )
}

export default App
