import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import Input from '../components/common/Input'
import Button from '../components/common/Button'
import Card from '../components/common/Card'

const Register = () => {
  const { requestOTP } = useAuth()
  const navigate = useNavigate()
  const [formData, setFormData] = useState({
    nama: '',
    nim: '',
    email: '',
    whatsapp: '',
    prodi: '',
    angkatan: '',
    domisili: '',
    profesi: '',
    password: '',
    confirmPassword: '',
    agreeToTerms: false
  })
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    // Validasi
    if (!formData.nama || formData.nama.trim().length < 2) {
      setError('Nama harus diisi minimal 2 karakter')
      setLoading(false)
      return
    }

    if (!formData.nim || formData.nim.trim().length < 8) {
      setError('NIM harus diisi minimal 8 karakter')
      setLoading(false)
      return
    }

    if (!/^[0-9]+$/.test(formData.nim)) {
      setError('NIM harus berupa angka')
      setLoading(false)
      return
    }

    // Validasi email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(formData.email)) {
      setError('Format email tidak valid')
      setLoading(false)
      return
    }

    // Validasi WhatsApp
    if (formData.whatsapp && !/^(08|628)[0-9]{9,12}$/.test(formData.whatsapp.replace(/\s/g, ''))) {
      setError('Nomor WhatsApp tidak valid. Format: 08xxxxxxxxxx atau 628xxxxxxxxxx')
      setLoading(false)
      return
    }

    // Validasi angkatan
    if (formData.angkatan) {
      const angkatan = parseInt(formData.angkatan)
      const currentYear = new Date().getFullYear()
      if (isNaN(angkatan) || angkatan < 1945 || angkatan > currentYear + 1) {
        setError(`Angkatan harus antara 1945-${currentYear + 1}`)
        setLoading(false)
        return
      }
    }

    if (formData.password !== formData.confirmPassword) {
      setError('Password tidak cocok')
      setLoading(false)
      return
    }

    if (formData.password.length < 6) {
      setError('Password minimal 6 karakter')
      setLoading(false)
      return
    }

    // Validasi password strength (opsional, bisa diaktifkan)
    // const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/
    // if (!passwordRegex.test(formData.password)) {
    //   setError('Password harus mengandung huruf besar, huruf kecil, dan angka')
    //   setLoading(false)
    //   return
    // }

    if (!formData.agreeToTerms) {
      setError('Anda harus menyetujui kebijakan privasi')
      setLoading(false)
      return
    }

    // Request OTP
    const result = await requestOTP(formData.email)

    if (result.success) {
      // Redirect ke halaman verifikasi OTP dengan data user
      navigate('/verify-otp', {
        state: {
          email: formData.email,
          userData: {
            nama: formData.nama,
            nim: formData.nim,
            whatsapp: formData.whatsapp,
            prodi: formData.prodi,
            angkatan: formData.angkatan,
            domisili: formData.domisili,
            profesi: formData.profesi,
            password: formData.password
          },
          expiresIn: result.expiresIn
        }
      })
    } else {
      setError(result.message || 'Terjadi kesalahan')
      setLoading(false)
    }
  }


  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-2xl mx-auto">
        <Card className="p-8">
          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold text-gray-900">Daftar Akun Alumni</h2>
            <p className="mt-2 text-sm text-gray-600">
              Sudah punya akun?{' '}
              <Link to="/login" className="text-blue-600 hover:text-blue-700">
                Masuk di sini
              </Link>
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
                {error}
              </div>
            )}

            <div className="grid md:grid-cols-2 gap-4">
              <Input
                label="Nama Lengkap"
                value={formData.nama}
                onChange={(e) => setFormData({ ...formData, nama: e.target.value })}
                required
              />
              <Input
                label="NIM"
                type="text"
                value={formData.nim}
                onChange={(e) => {
                  // Hanya allow angka
                  const value = e.target.value.replace(/\D/g, '')
                  setFormData({ ...formData, nim: value })
                }}
                placeholder="Contoh: 123456789"
                required
                maxLength={20}
              />
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <Input
                label="Email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                required
              />
              <Input
                label="Nomor WhatsApp"
                type="tel"
                value={formData.whatsapp}
                onChange={(e) => {
                  // Hanya allow angka, bisa mulai dengan 08 atau 628
                  const value = e.target.value.replace(/\D/g, '')
                  setFormData({ ...formData, whatsapp: value })
                }}
                placeholder="08xxxxxxxxxx atau 628xxxxxxxxxx"
                required
                maxLength={15}
              />
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <Input
                label="Program Studi"
                value={formData.prodi}
                onChange={(e) => setFormData({ ...formData, prodi: e.target.value })}
                required
              />
              <Input
                label="Angkatan"
                type="number"
                value={formData.angkatan}
                onChange={(e) => setFormData({ ...formData, angkatan: e.target.value })}
                placeholder="Contoh: 2020"
                required
                min="1945"
                max={new Date().getFullYear() + 1}
              />
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <Input
                label="Domisili"
                value={formData.domisili}
                onChange={(e) => setFormData({ ...formData, domisili: e.target.value })}
                required
              />
              <Input
                label="Pekerjaan/Profesi"
                value={formData.profesi}
                onChange={(e) => setFormData({ ...formData, profesi: e.target.value })}
              />
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <Input
                label="Password"
                type="password"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                required
              />
              <Input
                label="Konfirmasi Password"
                type="password"
                value={formData.confirmPassword}
                onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                required
              />
            </div>

            <div className="flex items-start">
              <input
                type="checkbox"
                checked={formData.agreeToTerms}
                onChange={(e) => setFormData({ ...formData, agreeToTerms: e.target.checked })}
                className="mt-1 rounded border-gray-300 text-blue-600"
                required
              />
              <label className="ml-2 text-sm text-gray-600">
                Saya menyetujui{' '}
                <Link to="#" className="text-blue-600 hover:text-blue-700">
                  kebijakan privasi
                </Link>
              </label>
            </div>

            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? 'Memproses...' : 'Daftar'}
            </Button>
          </form>
        </Card>
      </div>
    </div>
  )
}

export default Register

