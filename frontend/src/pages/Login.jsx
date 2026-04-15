import { useState, useEffect } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import Input from '../components/common/Input'
import Button from '../components/common/Button'
import Card from '../components/common/Card'
import { Eye, X } from 'lucide-react'
import { GoogleLogin } from '@react-oauth/google'

const Login = () => {
  const { login, loginWithGoogle } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  })
  const [error, setError] = useState('')
  const [suspendInfo, setSuspendInfo] = useState(location.state?.suspendInfo || null) // { reason, date }
  const [loading, setLoading] = useState(false)
  const [showCredentials, setShowCredentials] = useState(false)

  // Demo credentials dari seed
  const demoCredentials = [
    { role: 'Alumni', email: 'alumni@demo.com', password: 'password123' },
    { role: 'Pengurus', email: 'pengurus@demo.com', password: 'password123' },
    { role: 'Administrator', email: 'admin@demo.com', password: 'password123' }
  ]

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setSuspendInfo(null)
    setLoading(true)
    
    const result = await login(formData.email, formData.password)
    
    if (result.success) {
      if (result.user.role === 'ADMIN') {
        navigate('/admin', { replace: true })
      } else if (!result.user.nama || !String(result.user.nama).trim()) {
        navigate('/lengkapi-data', { replace: true })
      } else if (!result.user.verified) {
        navigate('/waiting-verification', { replace: true })
      } else {
        navigate('/dashboard', { replace: true })
      }
    } else {
      // Cek apakah kegagalan login karena suspen
      if (result.isSuspended) {
        setSuspendInfo({ reason: result.suspendReason, date: result.suspendedAt })
      } else {
        setError(result.message || 'Email atau password salah')
      }
    }
    
    setLoading(false)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 relative">
      {/* Background decoration */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-blue-200 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-purple-200 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob animation-delay-2000"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-indigo-200 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob animation-delay-4000"></div>
      </div>

      {/* Login Card */}
      <div className="relative w-full max-w-md">
        <Card className="p-8 shadow-2xl border-0 bg-white/90 backdrop-blur-sm">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-2xl mb-4 shadow-lg">
              <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
              </svg>
            </div>
            <h2 className="text-3xl font-bold text-gray-900 mb-2">Selamat Datang</h2>
            <p className="text-gray-600">
              Masuk ke akun Anda atau{' '}
              <Link to="/register" className="text-blue-600 hover:text-blue-700 font-medium">
                daftar akun baru
              </Link>
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Error biasa */}
            {error && (
              <div className="bg-red-50 border-l-4 border-red-500 text-red-700 px-4 py-3 rounded-lg flex items-center gap-2">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
                <span>{error}</span>
              </div>
            )}

            {/* Banner suspen khusus */}
            {suspendInfo && (
              <div className="bg-red-50 border-2 border-red-400 rounded-xl p-4">
                <div className="flex items-center gap-2 mb-2">
                  <svg className="w-6 h-6 text-red-600 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
                  </svg>
                  <span className="font-bold text-red-700 text-base">Akun Ditangguhkan (Suspended)</span>
                </div>
                <p className="text-sm text-red-700 mb-1">
                  Akun Anda tidak dapat mengakses sistem saat ini.
                </p>
                {suspendInfo.reason && (
                  <p className="text-sm text-red-600">
                    <span className="font-semibold">Alasan:</span> {suspendInfo.reason}
                  </p>
                )}
                <p className="text-sm text-red-600 mt-2 font-medium">
                  Harap hubungi admin untuk informasi lebih lanjut.
                </p>
              </div>
            )}

            <div>
              <Input
                label="Email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                required
                placeholder="nama@example.com"
                className="w-full"
              />
            </div>

            <div>
              <Input
                label="Password"
                type="password"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                required
                placeholder="••••••••"
                className="w-full"
              />
            </div>

            <div className="flex items-center justify-between">
              <label className="flex items-center">
                <input type="checkbox" className="rounded border-gray-300 text-blue-600 focus:ring-blue-500" />
                <span className="ml-2 text-sm text-gray-600">Ingat saya</span>
              </label>
              <Link to="#" className="text-sm text-blue-600 hover:text-blue-700 font-medium">
                Lupa password?
              </Link>
            </div>

            <Button type="submit" className="w-full py-3 text-base font-semibold shadow-lg" disabled={loading}>
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Memproses...
                </span>
              ) : (
                'Masuk'
              )}
            </Button>

            <div className="pt-2">
              <div className="flex items-center gap-3 my-2">
                <div className="h-px bg-gray-200 flex-1" />
                <div className="text-xs text-gray-500">atau</div>
                <div className="h-px bg-gray-200 flex-1" />
              </div>
              <div className="flex justify-center">
                <GoogleLogin
                  onSuccess={async (credentialResponse) => {
                    const credential = credentialResponse?.credential
                    if (!credential) {
                      setError('Gagal mendapatkan credential Google')
                      return
                    }
                    setError('')
                    setLoading(true)
                    const result = await loginWithGoogle(credential)
                    if (result.success) {
                      if (result.user.role === 'ADMIN') {
                        navigate('/admin', { replace: true })
                      } else if (!result.user.nama || !String(result.user.nama).trim()) {
                        navigate('/lengkapi-data', { replace: true })
                      } else if (!result.user.verified) {
                        navigate('/waiting-verification', { replace: true })
                      } else {
                        navigate('/dashboard', { replace: true })
                      }
                    } else {
                      setError(result.message)
                    }
                    setLoading(false)
                  }}
                  onError={() => setError('Login Google gagal')}
                  useOneTap={false}
                />
              </div>
            </div>
          </form>
        </Card>

        {/* Credentials Button - Fixed position */}
        <button
          onClick={() => setShowCredentials(!showCredentials)}
          className="absolute bottom-4 right-4 w-10 h-10 bg-blue-600 hover:bg-blue-700 text-white rounded-full shadow-lg flex items-center justify-center transition-all hover:scale-110 z-10"
          title="Lihat Demo Credentials"
        >
          <Eye size={18} />
        </button>

        {/* Credentials Modal */}
        {showCredentials && (
          <>
            {/* Overlay */}
            <div 
              className="fixed inset-0 bg-black bg-opacity-50 z-40"
              onClick={() => setShowCredentials(false)}
            ></div>
            
            {/* Modal */}
            <div className="fixed bottom-4 right-4 w-80 bg-white rounded-xl shadow-2xl z-50 border border-gray-200 animate-in slide-in-from-bottom-5">
              <div className="p-5">
                {/* Header */}
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-gray-900">Demo Credentials</h3>
                  <button
                    onClick={() => setShowCredentials(false)}
                    className="p-1 hover:bg-gray-100 rounded-full transition-colors"
                  >
                    <X size={18} className="text-gray-500" />
                  </button>
                </div>

                {/* Credentials List */}
                <div className="space-y-3">
                  {demoCredentials.map((cred, index) => (
                    <div key={index} className="p-3 bg-gray-50 rounded-lg border border-gray-200">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-semibold text-gray-700 uppercase tracking-wide">
                          {cred.role}
                        </span>
                      </div>
                      <div className="space-y-1.5">
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-gray-500 w-12">Email:</span>
                          <span className="text-sm text-gray-900 font-mono">{cred.email}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-gray-500 w-12">Pass:</span>
                          <span className="text-sm text-gray-900 font-mono">{cred.password}</span>
                        </div>
                      </div>
                      <button
                        onClick={() => {
                          setFormData({ email: cred.email, password: cred.password })
                          setShowCredentials(false)
                        }}
                        className="mt-2 w-full text-xs py-1.5 px-3 bg-blue-600 hover:bg-blue-700 text-white rounded-md transition-colors"
                      >
                        Gunakan Credential Ini
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </>
        )}
      </div>

      <style>{`
        @keyframes blob {
          0% { transform: translate(0px, 0px) scale(1); }
          33% { transform: translate(30px, -50px) scale(1.1); }
          66% { transform: translate(-20px, 20px) scale(0.9); }
          100% { transform: translate(0px, 0px) scale(1); }
        }
        .animate-blob {
          animation: blob 7s infinite;
        }
        .animation-delay-2000 {
          animation-delay: 2s;
        }
        .animation-delay-4000 {
          animation-delay: 4s;
        }
      `}</style>
    </div>
  )
}

export default Login

