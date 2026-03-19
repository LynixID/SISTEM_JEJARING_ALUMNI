import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import Input from '../components/common/Input'
import Button from '../components/common/Button'
import Card from '../components/common/Card'

const BACKEND_API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api'
const WILAYAH_PROXY_BASE_URL = `${BACKEND_API_URL}/wilayah`

const PRODI_OPTIONS = [
  'Ahli Madya (D3) Analisis Kimia (Industri)',
  'Sarjana Terapan Akuntansi Perpajakan',
  'Sarjana Terapan Analisis Keuangan (Digital)',
  'Sarjana Terapan Bisnis Digital',
  'Sarjana Akuntansi (Bisnis dan Teknologi)',
  'Sarjana Arsitektur',
  'Sarjana Ekonomi Islam',
  'Sarjana Ekonomi Pembangunan (Digital)',
  'Sarjana Farmasi',
  'Sarjana Hubungan Internasional',
  'Sarjana Hukum Keluarga (Ahwal Syakhshiyah)',
  'Sarjana Hukum',
  'Sarjana Hukum Bisnis',
  'Sarjana Ilmu Komunikasi',
  'Sarjana Kedokteran',
  'Sarjana Komputer (Informatika)',
  'Sarjana Manajemen',
  'Sarjana Pendidikan Agama Islam',
  'Sarjana Pendidikan Bahasa Inggris (Digital Inovatif)',
  'Sarjana Pendidikan Kimia (Digital)',
  'Sarjana Psikologi',
  'Sarjana Kimia (Teknologi Parfum dan Kosmetik)',
  'Sarjana Statistika (Sains Data)',
  'Sarjana Teknik (Rekayasa Tekstil)',
  'Sarjana Teknik (Manajemen Rekayasa)',
  'Sarjana Teknik (Teknik Elektro)',
  'Sarjana Teknik (Teknik Industri)',
  'Sarjana Teknik Kimia (Proses Industri Hijau)',
  'Sarjana Teknik (Teknik Lingkungan)',
  'Sarjana Teknik (Teknik Mesin)',
  'Sarjana Teknik (Teknik Sipil)',
  'Magister Akuntansi',
  'Magister Arsitektur',
  'Magister Farmasi',
  'Magister Hukum',
  'Magister Kenotariatan',
  'Magister Manajemen',
  'Magister Ilmu Agama Islam',
  'Magister Ilmu Ekonomi',
  'Magister Statistika',
  'Magister Kesehatan Masyarakat',
  'Magister Komputer (Informatika)',
  'Magister Teknik (Rekayasa Elektro)',
  'Magister Teknik (Teknik Industri)',
  'Magister Teknik (Teknik Kimia)',
  'Magister Teknik (Teknik Lingkungan)',
  'Magister Teknik (Teknik Sipil)',
  'Magister Sains (Kimia)',
  'Magister Psikologi',
  'Magister Ilmu Komunikasi',
  'Magister Hukum Keluarga Islam',
  'Doktor Farmasi',
  'Doktor Hukum',
  'Doktor Hukum Islam',
  'Doktor Ilmu Ekonomi',
  'Doktor Informatika',
  'Doktor Manajemen',
  'Doktor Rekayasa Industri',
  'Doktor Teknik Sipil',
  'Program Profesi Arsitek',
  'Pendidikan Profesi Apoteker',
  'Program Profesi Dokter',
  'Program Profesi Insinyur',
  'Pendidikan Profesi Psikologi',
]

const Register = () => {
  const { requestOTP } = useAuth()
  const navigate = useNavigate()
  const [formData, setFormData] = useState({
    nama: '',
    nim: '',
    email: '',
    whatsapp: '',
    prodi: '',
    prodiLainnya: '',
    angkatan: '',
    domisili: '', // akan dirangkai dari dropdown wilayah
    password: '',
    confirmPassword: '',
    agreeToTerms: false
  })
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [loading, setLoading] = useState(false)

  const [provinces, setProvinces] = useState([])
  const [regencies, setRegencies] = useState([])
  const [wilayahLoading, setWilayahLoading] = useState({
    provinces: false,
    regencies: false,
  })

  const [selectedProvinceCode, setSelectedProvinceCode] = useState('')
  const [selectedRegencyCode, setSelectedRegencyCode] = useState('')

  const selectedProvince = useMemo(
    () => provinces.find(p => p.code === selectedProvinceCode) || null,
    [provinces, selectedProvinceCode]
  )
  const selectedRegency = useMemo(
    () => regencies.find(r => r.code === selectedRegencyCode) || null,
    [regencies, selectedRegencyCode]
  )

  useEffect(() => {
    const fetchProvinces = async () => {
      try {
        setWilayahLoading(prev => ({ ...prev, provinces: true }))
        const res = await fetch(`${WILAYAH_PROXY_BASE_URL}/provinces`)
        if (!res.ok) throw new Error('Gagal memuat provinsi')
        const json = await res.json()
        setProvinces(json?.data || [])
      } catch (e) {
        console.error(e)
        // tidak hard fail; user masih bisa lanjut isi form lain
      } finally {
        setWilayahLoading(prev => ({ ...prev, provinces: false }))
      }
    }

    fetchProvinces()
  }, [])

  useEffect(() => {
    const fetchRegencies = async () => {
      if (!selectedProvinceCode) {
        setRegencies([])
        setSelectedRegencyCode('')
        return
      }
      try {
        setWilayahLoading(prev => ({ ...prev, regencies: true }))
        const res = await fetch(`${WILAYAH_PROXY_BASE_URL}/regencies/${selectedProvinceCode}`)
        if (!res.ok) throw new Error('Gagal memuat kabupaten/kota')
        const json = await res.json()
        setRegencies(json?.data || [])
      } catch (e) {
        console.error(e)
        setRegencies([])
      } finally {
        setWilayahLoading(prev => ({ ...prev, regencies: false }))
      }
    }

    fetchRegencies()
  }, [selectedProvinceCode])

  const domisiliText = useMemo(() => {
    const parts = [
      selectedRegency?.name,
      selectedProvince?.name
    ].filter(Boolean)
    return parts.join(', ')
  }, [selectedRegency, selectedProvince])

  const finalProdi = useMemo(() => {
    if (formData.prodi === 'LAINNYA') return (formData.prodiLainnya || '').trim()
    return (formData.prodi || '').trim()
  }, [formData.prodi, formData.prodiLainnya])

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

    if (!finalProdi) {
      setError('Program studi wajib diisi')
      setLoading(false)
      return
    }

    if (!selectedProvinceCode || !selectedRegencyCode) {
      setError('Domisili wajib diisi (Provinsi dan Kab/Kota)')
      setLoading(false)
      return
    }

    const domisili = domisiliText
    if (!domisili) {
      setError('Domisili tidak valid')
      setLoading(false)
      return
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
            prodi: finalProdi,
            angkatan: formData.angkatan,
            domisili,
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
              <div className="w-full">
                <label className="block text-sm font-medium text-gray-700 mb-1">Provinsi</label>
                <select
                  value={selectedProvinceCode}
                  onChange={(e) => setSelectedProvinceCode(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                  required
                  disabled={wilayahLoading.provinces}
                >
                  <option value="">
                    {wilayahLoading.provinces ? 'Memuat provinsi...' : 'Pilih provinsi'}
                  </option>
                  {provinces.map((p) => (
                    <option key={p.code} value={p.code}>
                      {p.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="w-full">
                <label className="block text-sm font-medium text-gray-700 mb-1">Kabupaten/Kota</label>
                <select
                  value={selectedRegencyCode}
                  onChange={(e) => setSelectedRegencyCode(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                  required
                  disabled={!selectedProvinceCode || wilayahLoading.regencies}
                >
                  <option value="">
                    {wilayahLoading.regencies ? 'Memuat kab/kota...' : 'Pilih kabupaten/kota'}
                  </option>
                  {regencies.map((r) => (
                    <option key={r.code} value={r.code}>
                      {r.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {domisiliText && (
              <div className="bg-gray-50 border border-gray-200 rounded-lg px-4 py-3 text-sm text-gray-700">
                <span className="font-medium">Domisili terpilih:</span> {domisiliText}
              </div>
            )}

            <div className="grid md:grid-cols-2 gap-4">
              <div className="w-full">
                <label className="block text-sm font-medium text-gray-700 mb-1">Program Studi</label>
                <select
                  value={formData.prodi}
                  onChange={(e) => setFormData({ ...formData, prodi: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                  required
                >
                  <option value="">Pilih program studi</option>
                  {PRODI_OPTIONS.map((p) => (
                    <option key={p} value={p}>
                      {p}
                    </option>
                  ))}
                  <option value="LAINNYA">Lainnya</option>
                </select>
                {formData.prodi === 'LAINNYA' && (
                  <div className="mt-2">
                    <Input
                      label="Program Studi (Lainnya)"
                      value={formData.prodiLainnya}
                      onChange={(e) => setFormData({ ...formData, prodiLainnya: e.target.value })}
                      placeholder="Ketik program studi kamu..."
                      required
                    />
                  </div>
                )}
              </div>
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

