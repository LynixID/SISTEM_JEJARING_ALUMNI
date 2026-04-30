import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Card from '../components/common/Card'
import Button from '../components/common/Button'
import Input from '../components/common/Input'
import { useAuth } from '../context/AuthContext'
import { completeProfile as completeProfileApi } from '../services/api'

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

const CompleteProfile = () => {
  const { user, isAuthenticated, isLoading, refreshUser } = useAuth()
  const navigate = useNavigate()

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const [form, setForm] = useState({
    nama: '',
    nim: '',
    whatsapp: '',
    prodi: '',
    prodiLainnya: '',
    angkatan: '',
    domisili: '',
    allowEmailNotification: true,
  })
  const [selectedProvinceCode, setSelectedProvinceCode] = useState('')
  const [selectedRegencyCode, setSelectedRegencyCode] = useState('')
  const [provinces, setProvinces] = useState([])
  const [regencies, setRegencies] = useState([])
  const [wilayahLoading, setWilayahLoading] = useState({
    provinces: false,
    regencies: false,
  })

  const isProfileIncomplete = useMemo(() => {
    const nama = (user?.nama || '').trim()
    return !nama
  }, [user?.nama])

  const selectedProvince = useMemo(
    () => provinces.find((p) => p.code === selectedProvinceCode) || null,
    [provinces, selectedProvinceCode]
  )
  const selectedRegency = useMemo(
    () => regencies.find((r) => r.code === selectedRegencyCode) || null,
    [regencies, selectedRegencyCode]
  )
  const domisiliText = useMemo(() => {
    const parts = [selectedRegency?.name, selectedProvince?.name].filter(Boolean)
    return parts.join(', ')
  }, [selectedRegency, selectedProvince])
  const finalProdi = useMemo(() => {
    if (form.prodi === 'LAINNYA') return (form.prodiLainnya || '').trim()
    return (form.prodi || '').trim()
  }, [form.prodi, form.prodiLainnya])

  useEffect(() => {
    if (!isLoading && !isAuthenticated) navigate('/login', { replace: true })
  }, [isAuthenticated, isLoading, navigate])

  useEffect(() => {
    if (!user) return
    if (user.role === 'ADMIN') navigate('/admin', { replace: true })
  }, [user, navigate])

  useEffect(() => {
    if (!user) return
    const prodiInList = PRODI_OPTIONS.includes(user.prodi || '')
    setForm({
      nama: user.nama || '',
      nim: user.nim || '',
      whatsapp: user.whatsapp || '',
      prodi: user.prodi ? (prodiInList ? user.prodi : 'LAINNYA') : '',
      prodiLainnya: user.prodi && !prodiInList ? user.prodi : '',
      angkatan: user.angkatan ? String(user.angkatan) : '',
      domisili: user.domisili || '',
      allowEmailNotification: user.allowEmailNotification ?? true,
    })
  }, [user])

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

  const submit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const finalDomisili = domisiliText || form.domisili
      await completeProfileApi({
        nama: form.nama,
        nim: form.nim,
        whatsapp: form.whatsapp,
        prodi: finalProdi,
        angkatan: form.angkatan,
        domisili: finalDomisili,
        allowEmailNotification: form.allowEmailNotification,
      })
      await refreshUser()

      // Setelah lengkap data diri, tetap harus verifikasi admin (untuk non-admin)
      navigate('/waiting-verification', { replace: true })
    } catch (err) {
      setError(err.response?.data?.error || 'Gagal menyimpan data diri')
    } finally {
      setLoading(false)
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-gray-500">Loading...</div>
      </div>
    )
  }

  if (!isAuthenticated || !user) return null

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
          <div className="w-full max-w-lg">
        <Card className="p-8 shadow-2xl border-0 bg-white/90 backdrop-blur-sm">
          <div className="mb-6 text-center">
            <h1 className="text-2xl font-bold text-gray-900">Lengkapi Data Diri</h1>
            <p className="text-gray-600 mt-1">
              Hai <span className="font-semibold">{user.email}</span>,
              {isProfileIncomplete
                ? ' lengkapi dulu data dirimu agar akun bisa diproses untuk verifikasi admin.'
                : ' data dirimu sudah terisi, tapi kamu masih bisa memperbaruinya di sini.'}
            </p>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl px-4 py-3 mb-4">
              {error}
            </div>
          )}

          <form onSubmit={submit} className="space-y-4">
            <Input
              label="Nama Lengkap"
              value={form.nama}
              onChange={(e) => setForm(prev => ({ ...prev, nama: e.target.value }))}
              required
            />

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Input
                label="NIM"
                value={form.nim}
                onChange={(e) => setForm(prev => ({ ...prev, nim: e.target.value.replace(/\D/g, '') }))}
                placeholder="20918291"
                maxLength={20}
              />
              <Input
                label="Nomor WhatsApp"
                value={form.whatsapp}
                onChange={(e) => setForm(prev => ({ ...prev, whatsapp: e.target.value.replace(/\D/g, '') }))}
                placeholder="6281234567890"
                maxLength={15}
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="w-full">
                <label className="block text-sm font-medium text-gray-700 mb-1">Program Studi</label>
                <select
                  value={form.prodi}
                  onChange={(e) => setForm(prev => ({ ...prev, prodi: e.target.value }))}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                >
                  <option value="">Pilih program studi</option>
                  {PRODI_OPTIONS.map((p) => (
                    <option key={p} value={p}>
                      {p}
                    </option>
                  ))}
                  <option value="LAINNYA">Lainnya</option>
                </select>
                {form.prodi === 'LAINNYA' && (
                  <div className="mt-2">
                    <Input
                      label="Program Studi (Lainnya)"
                      value={form.prodiLainnya}
                      onChange={(e) => setForm(prev => ({ ...prev, prodiLainnya: e.target.value }))}
                      placeholder="Ketik program studi kamu..."
                    />
                  </div>
                )}
              </div>
              <Input
                label="Angkatan"
                type="number"
                value={form.angkatan}
                onChange={(e) => setForm(prev => ({ ...prev, angkatan: e.target.value }))}
                placeholder="2005"
                min="1945"
                max={new Date().getFullYear() + 1}
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="w-full">
                <label className="block text-sm font-medium text-gray-700 mb-1">Provinsi</label>
                <select
                  value={selectedProvinceCode}
                  onChange={(e) => setSelectedProvinceCode(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
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

            
            
            <div className="flex items-center gap-3 p-4 bg-primary-50 rounded-lg border border-primary-100">
              <input
                type="checkbox"
                id="allowEmailNotification"
                name="allowEmailNotification"
                checked={form.allowEmailNotification}
                onChange={(e) => setForm(prev => ({ ...prev, allowEmailNotification: e.target.checked }))}
                className="w-5 h-5 text-primary-600 border-gray-300 rounded focus:ring-primary-500 cursor-pointer"
              />
              <label htmlFor="allowEmailNotification" className="text-sm font-medium text-primary-900 cursor-pointer">
                Dapatkan Notifikasi Berita & Pengumuman via Email
                <p className="text-xs text-primary-700 font-normal mt-0.5">Kami akan mengirimkan email bertahap untuk info alumni terbaru.</p>
              </label>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button type="submit" disabled={loading}>
                {loading ? 'Menyimpan...' : 'Simpan'}
              </Button>
            </div>
          </form>
        </Card>
      </div>
    </div>
  )
}

export default CompleteProfile

