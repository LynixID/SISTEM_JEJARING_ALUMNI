import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import Input from '../components/common/Input'
import Button from '../components/common/Button'
import Card from '../components/common/Card'

const Login = () => {
  const { login } = useAuth()
  const navigate = useNavigate()
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    
    // Panggil fungsi login dari AuthContext
    const result = await login(formData.email, formData.password)
    
    if (result.success) {
      // Redirect sesuai role dan status verifikasi
      if (result.user.role === 'ADMIN') {
        navigate('/admin', { replace: true })
      } else if (!result.user.verified) {
        navigate('/waiting-verification', { replace: true })
      } else {
        navigate('/dashboard', { replace: true })
      }
    } else {
      setError(result.message || 'Email atau password salah')
    }
    
    setLoading(false)
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <Card className="w-full max-w-md p-8">
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold text-gray-900">Masuk ke Akun</h2>
          <p className="mt-2 text-sm text-gray-600">
            Atau{' '}
            <Link to="/register" className="text-blue-600 hover:text-blue-700">
              daftar akun baru
            </Link>
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
              {error}
            </div>
          )}

          <Input
            label="Email"
            type="email"
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            required
            placeholder="nama@example.com"
          />

          <Input
            label="Password"
            type="password"
            value={formData.password}
            onChange={(e) => setFormData({ ...formData, password: e.target.value })}
            required
            placeholder="••••••••"
          />

          <div className="flex items-center justify-between">
            <label className="flex items-center">
              <input type="checkbox" className="rounded border-gray-300 text-blue-600" />
              <span className="ml-2 text-sm text-gray-600">Ingat saya</span>
            </label>
            <Link to="#" className="text-sm text-blue-600 hover:text-blue-700">
              Lupa password?
            </Link>
          </div>

          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? 'Memproses...' : 'Masuk'}
          </Button>
        </form>

        <div className="mt-6 p-4 bg-blue-50 rounded-lg">
          <p className="text-sm font-semibold text-gray-900 mb-2">Demo Credentials:</p>
          <div className="space-y-1 text-xs text-gray-700">
            <p><strong>Alumni:</strong> alumni@demo.com / password123</p>
            <p><strong>Pengurus:</strong> pengurus@demo.com / password123</p>
            <p><strong>Administrator:</strong> admin@demo.com / password123</p>
          </div>
        </div>
      </Card>
    </div>
  )
}

export default Login

