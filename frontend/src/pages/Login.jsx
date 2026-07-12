import { useState, useEffect } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import Input from '../components/common/Input'
import Button from '../components/common/Button'
import Card from '../components/common/Card'
import Modal from '../components/common/Modal'

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

  useEffect(() => {
    const params = new URLSearchParams(location.search)
    if (params.get('suspended') === 'true') {
      const reason = params.get('reason') || 'Pelanggaran ketentuan layanan'
      setSuspendInfo({
        reason,
        date: new Date().toISOString()
      })
      navigate('/login', { replace: true })
    }
  }, [location, navigate])


  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setSuspendInfo(null)
    setLoading(true)
    
    const result = await login(formData.email, formData.password)
    
    if (result.success) {
      if (result.user.role !== 'ADMIN' && (!result.user.nama || !String(result.user.nama).trim())) {
        navigate('/lengkapi-data', { replace: true })
      } else if (result.user.role !== 'ADMIN' && !result.user.verified) {
        navigate('/waiting-verification', { replace: true })
      } else {
        let from = location.state?.from 
          ? (location.state.from.pathname + location.state.from.search + location.state.from.hash)
          : null
        
        // Prevent redirecting back to restricted onboarding pages if user is already verified & complete
        if (from && (from.startsWith('/waiting-verification') || from.startsWith('/lengkapi-data') || from.startsWith('/login') || from.startsWith('/register') || from.startsWith('/verify-otp'))) {
          from = null
        }

        if (!from) {
          from = result.user.role === 'ADMIN' ? '/admin' : '/dashboard'
        }
        navigate(from, { replace: true })
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
            <div className="flex justify-center mb-6">
              <img 
                src="/icon_web.png" 
                alt="Logo" 
                className="w-24 h-24 object-contain"
              />
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
                      if (result.user.role !== 'ADMIN' && (!result.user.nama || !String(result.user.nama).trim())) {
                        navigate('/lengkapi-data', { replace: true })
                      } else if (result.user.role !== 'ADMIN' && !result.user.verified) {
                        navigate('/waiting-verification', { replace: true })
                      } else {
                        let from = location.state?.from 
                          ? (location.state.from.pathname + location.state.from.search + location.state.from.hash)
                          : null
                        
                        // Prevent redirecting back to restricted onboarding pages if user is already verified & complete
                        if (from && (from.startsWith('/waiting-verification') || from.startsWith('/lengkapi-data') || from.startsWith('/login') || from.startsWith('/register') || from.startsWith('/verify-otp'))) {
                          from = null
                        }

                        if (!from) {
                          from = result.user.role === 'ADMIN' ? '/admin' : '/dashboard'
                        }
                        navigate(from, { replace: true })
                      }
                    } else {
                      if (result.isSuspended) {
                        setSuspendInfo({ reason: result.suspendReason, date: result.suspendedAt })
                      } else {
                        setError(result.message)
                      }
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

      </div>

      <Modal
        isOpen={!!suspendInfo}
        onClose={() => setSuspendInfo(null)}
        title="Status Akses Akun"
        size="sm"
      >
        <div className="text-center py-2">
          <div className="w-16 h-16 bg-red-50 text-red-600 rounded-full flex items-center justify-center mx-auto mb-4 border-2 border-red-100">
            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          
          <h3 className="text-lg font-bold text-gray-900 mb-2">Akun Ditangguhkan (Suspended)</h3>
          <p className="text-sm text-gray-600 mb-4">
            Mohon maaf, saat ini akun Anda tidak diizinkan untuk mengakses sistem UII Connect.
          </p>

          {suspendInfo?.reason && (
            <div className="bg-red-50/80 border border-red-100 rounded-2xl p-4 mb-4 text-left shadow-sm">
              <span className="block text-xs font-bold uppercase tracking-wider text-red-800 mb-1">Alasan Penangguhan:</span>
              <p className="text-sm text-red-700 font-medium italic">"{suspendInfo.reason}"</p>
            </div>
          )}

          <div className="bg-blue-50/50 border border-blue-100 rounded-2xl p-4 mb-6 text-left flex items-start gap-3">
            <svg className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <p className="text-xs text-blue-700 leading-relaxed">
              Jika Anda ingin mengajukan pemulihan akun, silakan hubungi administrator sekretariat IKA UII Jawa Tengah untuk informasi lebih lanjut.
            </p>
          </div>

          <Button 
            onClick={() => setSuspendInfo(null)}
            className="w-full py-2.5 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white font-semibold rounded-xl shadow-lg shadow-red-600/20 transition-all duration-300"
          >
            Tutup
          </Button>
        </div>
      </Modal>

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

