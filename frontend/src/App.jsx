import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './context/AuthContext'
import Login from './pages/Login'
import Register from './pages/Register'
import VerifyOTP from './pages/VerifyOTP'
import WaitingVerification from './pages/WaitingVerification'
import Dashboard from './pages/Dashboard'
import Berita from './pages/Berita'
import AnnouncementDetail from './pages/AnnouncementDetail'
import EventDetail from './pages/EventDetail'
import AdminDashboard from './pages/admin/AdminDashboard'
import UserManagement from './pages/admin/UserManagement'
import ManageAnnouncements from './pages/admin/ManageAnnouncements'
import CreateAnnouncement from './pages/admin/CreateAnnouncement'
import ManageEvents from './pages/admin/ManageEvents'
import CreateEvent from './pages/admin/CreateEvent'
import Settings from './pages/admin/Settings'
import Profile from './pages/Profile'
import EditProfile from './pages/EditProfile'
import DirektoriAlumni from './pages/DirektoriAlumni'
import PostDetail from './pages/PostDetail'
import Notifications from './pages/Notifications'
import Connections from './pages/Connections'
import Chat from './pages/Chat'

// Komponen untuk protect route: cek login, role, dan verified status
const ProtectedRoute = ({ children, requireAdmin = false, requireAdminOrPengurus = false, allowUnverified = false }) => {
  const { isAuthenticated, user, isLoading } = useAuth()

  if (isLoading) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>
  }

  // Jika belum login, redirect ke login
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />
  }

  // Cek verified status (kecuali allowUnverified atau ADMIN)
  if (!allowUnverified && !requireAdmin && !requireAdminOrPengurus && user?.role !== 'ADMIN' && !user?.verified) {
    return <Navigate to="/waiting-verification" replace />
  }

  // Cek role untuk akses admin
  if (requireAdmin && user?.role !== 'ADMIN') {
    return <Navigate to="/dashboard" replace />
  }

  // Cek role untuk akses admin atau pengurus
  if (requireAdminOrPengurus && user?.role !== 'ADMIN' && user?.role !== 'PENGURUS') {
    return <Navigate to="/dashboard" replace />
  }

  return children
}

// Komponen Public Route (redirect jika sudah login)
const PublicRoute = ({ children }) => {
  const { isAuthenticated, user, isLoading } = useAuth()

  if (isLoading) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>
  }

  if (isAuthenticated) {
    // Cek apakah user perlu verifikasi admin
    if (user?.role !== 'ADMIN' && !user?.verified) {
      return <Navigate to="/waiting-verification" replace />
    }
    
    if (user?.role === 'ADMIN') {
      return <Navigate to="/admin" replace />
    }
    return <Navigate to="/dashboard" replace />
  }

  return children
}

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route
            path="/login"
            element={
              <PublicRoute>
                <Login />
              </PublicRoute>
            }
          />
          <Route
            path="/register"
            element={
              <PublicRoute>
                <Register />
              </PublicRoute>
            }
          />
          <Route
            path="/verify-otp"
            element={
              <PublicRoute>
                <VerifyOTP />
              </PublicRoute>
            }
          />
          <Route
            path="/waiting-verification"
            element={
              <ProtectedRoute allowUnverified={true}>
                <WaitingVerification />
              </ProtectedRoute>
            }
          />
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/posts/:id"
            element={
              <ProtectedRoute>
                <PostDetail />
              </ProtectedRoute>
            }
          />
          <Route
            path="/berita"
            element={
              <ProtectedRoute>
                <Berita />
              </ProtectedRoute>
            }
          />
          <Route
            path="/berita/:id"
            element={
              <ProtectedRoute>
                <AnnouncementDetail />
              </ProtectedRoute>
            }
          />
          <Route
            path="/events/:id"
            element={
              <ProtectedRoute>
                <EventDetail />
              </ProtectedRoute>
            }
          />
          <Route
            path="/profil/:id/edit"
            element={
              <ProtectedRoute>
                <EditProfile />
              </ProtectedRoute>
            }
          />
          <Route
            path="/profil/:id?"
            element={
              <ProtectedRoute>
                <Profile />
              </ProtectedRoute>
            }
          />
          <Route
            path="/direktori"
            element={
              <ProtectedRoute>
                <DirektoriAlumni />
              </ProtectedRoute>
            }
          />
          <Route
            path="/notifikasi"
            element={
              <ProtectedRoute>
                <Notifications />
              </ProtectedRoute>
            }
          />
          <Route
            path="/koneksi"
            element={
              <ProtectedRoute>
                <Connections />
              </ProtectedRoute>
            }
          />
          <Route
            path="/chat/:userId?"
            element={
              <ProtectedRoute>
                <Chat />
              </ProtectedRoute>
            }
          />
          <Route
            path="/pengurus/berita"
            element={
              <ProtectedRoute requireAdminOrPengurus={true}>
                <ManageAnnouncements />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin"
            element={
              <ProtectedRoute requireAdmin={true}>
                <AdminDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/users"
            element={
              <ProtectedRoute requireAdmin={true}>
                <UserManagement />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/announcements"
            element={
              <ProtectedRoute requireAdminOrPengurus={true}>
                <ManageAnnouncements />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/announcements/create"
            element={
              <ProtectedRoute requireAdminOrPengurus={true}>
                <CreateAnnouncement />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/announcements/edit/:id"
            element={
              <ProtectedRoute requireAdminOrPengurus={true}>
                <CreateAnnouncement />
              </ProtectedRoute>
            }
          />
          <Route
            path="/pengurus/berita/create"
            element={
              <ProtectedRoute requireAdminOrPengurus={true}>
                <CreateAnnouncement />
              </ProtectedRoute>
            }
          />
          <Route
            path="/pengurus/berita/edit/:id"
            element={
              <ProtectedRoute requireAdminOrPengurus={true}>
                <CreateAnnouncement />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/events"
            element={
              <ProtectedRoute requireAdminOrPengurus={true}>
                <ManageEvents />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/events/create"
            element={
              <ProtectedRoute requireAdminOrPengurus={true}>
                <CreateEvent />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/events/edit/:id"
            element={
              <ProtectedRoute requireAdminOrPengurus={true}>
                <CreateEvent />
              </ProtectedRoute>
            }
          />
          <Route
            path="/pengurus/events"
            element={
              <ProtectedRoute requireAdminOrPengurus={true}>
                <ManageEvents />
              </ProtectedRoute>
            }
          />
          <Route
            path="/pengurus/events/create"
            element={
              <ProtectedRoute requireAdminOrPengurus={true}>
                <CreateEvent />
              </ProtectedRoute>
            }
          />
          <Route
            path="/pengurus/events/edit/:id"
            element={
              <ProtectedRoute requireAdminOrPengurus={true}>
                <CreateEvent />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/settings"
            element={
              <ProtectedRoute requireAdmin={true}>
                <Settings />
              </ProtectedRoute>
            }
          />
          <Route path="/" element={<Navigate to="/login" replace />} />
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </Router>
    </AuthProvider>
  )
}

export default App
