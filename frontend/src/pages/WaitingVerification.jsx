import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import Card from '../components/common/Card'
import { Clock, Mail, LogOut } from 'lucide-react'
import Button from '../components/common/Button'

const WaitingVerification = () => {
  const { user, logout, checkAuth, isLoading } = useAuth()
  const navigate = useNavigate()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    // Check auth status periodically
    const interval = setInterval(() => {
      checkAuth()
    }, 30000) // Check every 30 seconds

    return () => clearInterval(interval)
  }, [checkAuth])

  useEffect(() => {
    // If user is verified, redirect to dashboard
    if (user?.verified) {
      if (user.role === 'ADMIN') {
        navigate('/admin', { replace: true })
      } else {
        navigate('/dashboard', { replace: true })
      }
    }
  }, [user, navigate])

  useEffect(() => {
    // Redirect to login if no user (after loading is done)
    if (!isLoading && !user) {
      navigate('/login', { replace: true })
    }
  }, [isLoading, user, navigate])

  const handleLogout = () => {
    logout()
    navigate('/login', { replace: true })
  }

  // Debug: Log user state (only in development)
  if (import.meta.env.DEV) {
    console.log('WaitingVerification - User state:', { user, isLoading, mounted, verified: user?.verified })
  }

  // Show loading while checking auth or not mounted
  if (isLoading || !mounted) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-gray-500 mb-2">Loading...</div>
        </div>
      </div>
    )
  }

  // If no user, show loading (redirect handled by useEffect)
  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-gray-500 mb-2">Mengarahkan ke halaman login...</div>
        </div>
      </div>
    )
  }

  // If user is already verified, show loading (redirect handled by useEffect)
  if (user.verified) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-gray-500 mb-2">Mengarahkan ke dashboard...</div>
        </div>
      </div>
    )
  }

  // Render main content
  try {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
        <Card className="w-full max-w-md p-8 text-center">
          <div className="mb-6">
            <div className="mx-auto w-20 h-20 bg-yellow-100 rounded-full flex items-center justify-center mb-4">
              <Clock className="w-10 h-10 text-yellow-600" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              Menunggu Verifikasi Admin
            </h2>
            <p className="text-gray-600">
              Akun Anda sedang menunggu persetujuan dari administrator
            </p>
          </div>

        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6 text-left">
          <div className="flex items-start gap-3">
            <Mail className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
            <div>
              <h3 className="font-semibold text-blue-900 mb-1">Status Akun</h3>
              <p className="text-sm text-blue-800 mb-2">
                Email Anda telah terverifikasi, namun akun Anda masih perlu disetujui oleh administrator sebelum dapat digunakan.
              </p>
              <div className="text-xs text-blue-700 space-y-1">
                <p>✓ Email telah terverifikasi</p>
                <p>⏳ Menunggu persetujuan admin</p>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-gray-50 rounded-lg p-4 mb-6 text-left">
          <h3 className="font-semibold text-gray-900 mb-2 text-sm">Informasi Akun</h3>
          <div className="space-y-1 text-sm text-gray-600">
            <p><strong>Nama:</strong> {user?.nama || '-'}</p>
            <p><strong>Email:</strong> {user?.email || '-'}</p>
            <p><strong>NIM:</strong> {user?.nim || '-'}</p>
          </div>
        </div>

        <div className="space-y-3">
          <div className="text-sm text-gray-600">
            <p>Kami akan mengirimkan notifikasi ke email Anda setelah akun disetujui.</p>
            <p className="mt-2">Halaman ini akan otomatis refresh setiap 30 detik.</p>
          </div>

          <div className="flex gap-3">
            <Button
              variant="outline"
              onClick={() => window.location.reload()}
              className="flex-1"
            >
              Refresh
            </Button>
            <Button
              variant="danger"
              onClick={handleLogout}
              className="flex-1"
            >
              <LogOut size={16} className="mr-2" />
              Logout
            </Button>
          </div>
        </div>
      </Card>
    </div>
    )
  } catch (error) {
    console.error('Error rendering WaitingVerification:', error)
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-500 mb-2">Error loading page</div>
          <button 
            onClick={() => window.location.reload()} 
            className="text-blue-600 hover:text-blue-700"
          >
            Reload Page
          </button>
        </div>
      </div>
    )
  }
}

export default WaitingVerification

