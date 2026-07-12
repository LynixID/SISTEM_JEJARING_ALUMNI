import { useState, useEffect } from 'react'
import { useAuth } from '../../context/AuthContext'
import api, { API_URL } from '../../services/api'
import AdminSidebar from '../../components/layout/AdminSidebar'
import Button from '../../components/common/Button'
import Card from '../../components/common/Card'
import Input from '../../components/common/Input'
import AlertModal from '../../components/common/AlertModal'
import ConfirmModal from '../../components/common/ConfirmModal'
import SwipeConfirmModal from '../../components/common/SwipeConfirmModal'
import Modal from '../../components/common/Modal'
import UserBadge from '../../components/common/UserBadge'
import ExportUserModal from '../../components/admin/ExportUserModal'
import { FileSpreadsheet } from 'lucide-react'
import { getImageUrl } from '../../utils/imageUtils'

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

const UserManagement = () => {
  const { user } = useAuth()
  const [users, setUsers] = useState([])
  const [statistics, setStatistics] = useState(null)
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [filterVerified, setFilterVerified] = useState('all')
  const [filterRole, setFilterRole] = useState('all')
  const [filterProdi, setFilterProdi] = useState('all')
  const [filterDomisili, setFilterDomisili] = useState('all')
  const [filterAngkatan, setFilterAngkatan] = useState('all')
  const [filterOptions, setFilterOptions] = useState({ prodis: [], domisilis: [], angkatans: [] })
  
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0
  })
  const [alertModal, setAlertModal] = useState({ isOpen: false, title: '', message: '', variant: 'info' })
  const [confirmModal, setConfirmModal] = useState({ 
    isOpen: false, 
    title: '', 
    message: '', 
    variant: 'warning',
    isLoading: false,
    onConfirm: () => {}
  })
  const [swipeConfirmModal, setSwipeConfirmModal] = useState({
    isOpen: false,
    title: '',
    message: '',
    isLoading: false,
    onConfirm: () => {}
  })
  const [suspendModal, setSuspendModal] = useState({
    isOpen: false,
    userId: null,
    reason: '',
    isLoading: false
  })
  const [isExportModalOpen, setIsExportModalOpen] = useState(false)

  // Edit User states
  const [isEditUserOpen, setIsEditUserOpen] = useState(false)
  const [editUserFormData, setEditUserFormData] = useState({
    id: '',
    nama: '',
    nim: '',
    email: '',
    whatsapp: '',
    prodi: '',
    prodiLainnya: '',
    angkatan: '',
    domisili: '',
    role: 'ALUMNI'
  })
  const [editUserError, setEditUserError] = useState('')
  const [editUserLoading, setEditUserLoading] = useState(false)
  const [openDropdownId, setOpenDropdownId] = useState(null)

  // Listen for clicks outside dropdowns to close them
  useEffect(() => {
    const handleOutsideClick = () => {
      setOpenDropdownId(null)
    }
    window.addEventListener('click', handleOutsideClick)
    return () => window.removeEventListener('click', handleOutsideClick)
  }, [])

  // Add User states
  const [isAddUserOpen, setIsAddUserOpen] = useState(false)
  const [isImportModalOpen, setIsImportModalOpen] = useState(false)
  const [addUserFormData, setAddUserFormData] = useState({
    nama: '',
    nim: '',
    email: '',
    whatsapp: '',
    prodi: '',
    prodiLainnya: '',
    angkatan: '',
    domisili: '',
    password: '',
    role: 'ALUMNI'
  })
  const [addProvinceCode, setAddProvinceCode] = useState('')
  const [addRegencyCode, setAddRegencyCode] = useState('')
  const [addProvinces, setAddProvinces] = useState([])
  const [addRegencies, setAddRegencies] = useState([])
  const [addWilayahLoading, setAddWilayahLoading] = useState({
    provinces: false,
    regencies: false
  })
  const [addUserError, setAddUserError] = useState('')
  const [addUserLoading, setAddUserLoading] = useState(false)

  // Fetch provinces when modal is opened
  useEffect(() => {
    if (isAddUserOpen && addProvinces.length === 0) {
      const fetchProvinces = async () => {
        try {
          setAddWilayahLoading(prev => ({ ...prev, provinces: true }))
          const res = await fetch(`${API_URL}/wilayah/provinces`)
          if (!res.ok) throw new Error('Gagal memuat provinsi')
          const json = await res.json()
          setAddProvinces(json?.data || [])
        } catch (e) {
          console.error(e)
        } finally {
          setAddWilayahLoading(prev => ({ ...prev, provinces: false }))
        }
      }
      fetchProvinces()
    }
  }, [isAddUserOpen, addProvinces.length])

  // Fetch regencies when province changes
  useEffect(() => {
    const fetchRegencies = async () => {
      if (!addProvinceCode) {
        setAddRegencies([])
        setAddRegencyCode('')
        return
      }
      try {
        setAddWilayahLoading(prev => ({ ...prev, regencies: true }))
        const res = await fetch(`${API_URL}/wilayah/regencies/${addProvinceCode}`)
        if (!res.ok) throw new Error('Gagal memuat kabupaten/kota')
        const json = await res.json()
        setAddRegencies(json?.data || [])
      } catch (e) {
        console.error(e)
        setAddRegencies([])
      } finally {
        setAddWilayahLoading(prev => ({ ...prev, regencies: false }))
      }
    }
    fetchRegencies()
  }, [addProvinceCode])

  const selectedProvince = addProvinces.find(p => p.code === addProvinceCode) || null
  const selectedRegency = addRegencies.find(r => r.code === addRegencyCode) || null
  const addDomisiliText = [
    selectedRegency?.name,
    selectedProvince?.name
  ].filter(Boolean).join(', ')

  const finalProdi = addUserFormData.prodi === 'LAINNYA' 
    ? (addUserFormData.prodiLainnya || '').trim()
    : (addUserFormData.prodi || '').trim()

  const handleAddUserSubmit = async (e) => {
    e.preventDefault()
    setAddUserError('')
    setAddUserLoading(true)

    // Validasi
    if (!addUserFormData.nama || addUserFormData.nama.trim().length < 2) {
      setAddUserError('Nama harus diisi minimal 2 karakter')
      setAddUserLoading(false)
      return
    }

    if (!addUserFormData.nim || addUserFormData.nim.trim().length < 8) {
      setAddUserError('NIM harus diisi minimal 8 karakter')
      setAddUserLoading(false)
      return
    }

    if (!/^[0-9]+$/.test(addUserFormData.nim)) {
      setAddUserError('NIM harus berupa angka')
      setAddUserLoading(false)
      return
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(addUserFormData.email)) {
      setAddUserError('Format email tidak valid')
      setAddUserLoading(false)
      return
    }

    if (addUserFormData.whatsapp && !/^(08|628)[0-9]{9,12}$/.test(addUserFormData.whatsapp.replace(/\s/g, ''))) {
      setAddUserError('Nomor WhatsApp tidak valid. Format: 08xxxxxxxxxx atau 628xxxxxxxxxx')
      setAddUserLoading(false)
      return
    }

    if (addUserFormData.angkatan) {
      const angkatan = parseInt(addUserFormData.angkatan)
      const currentYear = new Date().getFullYear()
      if (isNaN(angkatan) || angkatan < 1945 || angkatan > currentYear + 1) {
        setAddUserError(`Angkatan harus antara 1945-${currentYear + 1}`)
        setAddUserLoading(false)
        return
      }
    }

    if (!finalProdi) {
      setAddUserError('Program studi wajib diisi')
      setAddUserLoading(false)
      return
    }

    if (!addProvinceCode || !addRegencyCode) {
      setAddUserError('Domisili wajib diisi (Provinsi dan Kab/Kota)')
      setAddUserLoading(false)
      return
    }

    if (addUserFormData.password && addUserFormData.password.length < 6) {
      setAddUserError('Password minimal 6 karakter')
      setAddUserLoading(false)
      return
    }

    try {
      const payload = {
        nama: addUserFormData.nama,
        nim: addUserFormData.nim,
        email: addUserFormData.email,
        whatsapp: addUserFormData.whatsapp,
        prodi: finalProdi,
        angkatan: addUserFormData.angkatan,
        domisili: addDomisiliText,
        password: addUserFormData.password,
        role: addUserFormData.role
      }

      await api.post('/admin/users', payload)
      
      // Reset form
      setAddUserFormData({
        nama: '',
        nim: '',
        email: '',
        whatsapp: '',
        prodi: '',
        prodiLainnya: '',
        angkatan: '',
        domisili: '',
        password: '',
        role: 'ALUMNI'
      })
      setAddProvinceCode('')
      setAddRegencyCode('')
      setIsAddUserOpen(false)
      
      // Refresh list
      fetchUsers()
      fetchStatistics()
      window.dispatchEvent(new Event('user-verification-changed'))
      
      setAlertModal({
        isOpen: true,
        title: 'Berhasil',
        message: 'User baru berhasil ditambahkan',
        variant: 'success'
      })
    } catch (err) {
      setAddUserError(err.response?.data?.error || 'Gagal menambahkan user')
    } finally {
      setAddUserLoading(false)
    }
  }

  const handleEditClick = (user) => {
    const isProdiInOptions = PRODI_OPTIONS.includes(user.prodi)
    setEditUserFormData({
      id: user.id,
      nama: user.nama || '',
      nim: user.nim || '',
      email: user.email || '',
      whatsapp: user.whatsapp || '',
      prodi: isProdiInOptions ? user.prodi : 'LAINNYA',
      prodiLainnya: isProdiInOptions ? '' : (user.prodi || ''),
      angkatan: user.angkatan || '',
      domisili: user.domisili || '',
      role: user.role || 'ALUMNI'
    })
    setEditUserError('')
    setIsEditUserOpen(true)
  }

  const handleEditUserSubmit = async (e) => {
    e.preventDefault()
    setEditUserError('')
    setEditUserLoading(true)

    // Validasi
    if (!editUserFormData.nama || editUserFormData.nama.trim().length < 2) {
      setEditUserError('Nama harus diisi minimal 2 karakter')
      setEditUserLoading(false)
      return
    }

    if (!editUserFormData.nim || editUserFormData.nim.trim().length < 8) {
      setEditUserError('NIM harus diisi minimal 8 karakter')
      setEditUserLoading(false)
      return
    }

    if (!/^[0-9]+$/.test(editUserFormData.nim)) {
      setEditUserError('NIM harus berupa angka')
      setEditUserLoading(false)
      return
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(editUserFormData.email)) {
      setEditUserError('Format email tidak valid')
      setEditUserLoading(false)
      return
    }

    if (editUserFormData.whatsapp && !/^(08|628)[0-9]{9,12}$/.test(editUserFormData.whatsapp.replace(/\s/g, ''))) {
      setEditUserError('Nomor WhatsApp tidak valid. Format: 08xxxxxxxxxx atau 628xxxxxxxxxx')
      setEditUserLoading(false)
      return
    }

    if (editUserFormData.angkatan) {
      const angkatan = parseInt(editUserFormData.angkatan)
      const currentYear = new Date().getFullYear()
      if (isNaN(angkatan) || angkatan < 1945 || angkatan > currentYear + 1) {
        setEditUserError(`Angkatan harus antara 1945-${currentYear + 1}`)
        setEditUserLoading(false)
        return
      }
    }

    const finalProdi = editUserFormData.prodi === 'LAINNYA' 
      ? (editUserFormData.prodiLainnya || '').trim()
      : (editUserFormData.prodi || '').trim()

    if (!finalProdi) {
      setEditUserError('Program studi wajib diisi')
      setEditUserLoading(false)
      return
    }

    if (!editUserFormData.domisili || !editUserFormData.domisili.trim()) {
      setEditUserError('Domisili wajib diisi')
      setEditUserLoading(false)
      return
    }

    try {
      const payload = {
        nama: editUserFormData.nama,
        nim: editUserFormData.nim,
        email: editUserFormData.email,
        whatsapp: editUserFormData.whatsapp,
        prodi: finalProdi,
        angkatan: editUserFormData.angkatan,
        domisili: editUserFormData.domisili,
        role: editUserFormData.role
      }

      await api.put(`/admin/users/${editUserFormData.id}`, payload)
      setIsEditUserOpen(false)
      
      // Refresh list
      fetchUsers()
      fetchStatistics()
      
      // Dispatch event to sync sidebar red dot
      window.dispatchEvent(new Event('user-verification-changed'))

      setAlertModal({
        isOpen: true,
        title: 'Berhasil',
        message: 'Data user berhasil diperbarui',
        variant: 'success'
      })
    } catch (err) {
      setEditUserError(err.response?.data?.error || 'Gagal memperbarui data user')
    } finally {
      setEditUserLoading(false)
    }
  }

  useEffect(() => {
    fetchUsers()
    fetchStatistics()
    fetchFilterOptions()
  }, [pagination.page, search, filterVerified, filterRole, filterProdi, filterDomisili, filterAngkatan])

  const fetchFilterOptions = async () => {
    try {
      const response = await api.get('/admin/users/filter-options')
      setFilterOptions(response.data)
    } catch (error) {
      console.error('Error fetching filter options:', error)
    }
  }

  const fetchUsers = async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams({
        page: pagination.page,
        limit: pagination.limit,
        search,
        ...(filterVerified !== 'all' && { verified: filterVerified }),
        ...(filterRole !== 'all' && { role: filterRole }),
        ...(filterProdi !== 'all' && { prodi: filterProdi }),
        ...(filterDomisili !== 'all' && { domisili: filterDomisili }),
        ...(filterAngkatan !== 'all' && { angkatan: filterAngkatan })
      })

      const response = await api.get(`/admin/users?${params}`)
      setUsers(response.data.users)
      setPagination(response.data.pagination)
    } catch (error) {
      console.error('Error fetching users:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchStatistics = async () => {
    try {
      const response = await api.get('/admin/statistics')
      setStatistics(response.data.statistics)
    } catch (error) {
      console.error('Error fetching statistics:', error)
    }
  }

  const handleVerify = (userId) => {
    setConfirmModal({
      isOpen: true,
      title: 'Setujui Pendaftaran',
      message: 'Apakah Anda yakin ingin menyetujui pendaftaran user ini?',
      variant: 'success',
      isLoading: false,
      onConfirm: async () => {
        try {
          setConfirmModal(prev => ({ ...prev, isLoading: true }))
          await api.patch(`/admin/users/${userId}/verify`)
          fetchUsers()
          fetchStatistics()
          window.dispatchEvent(new Event('user-verification-changed'))
          setAlertModal({
            isOpen: true,
            title: 'Berhasil',
            message: 'User berhasil diverifikasi',
            variant: 'success'
          })
        } catch (error) {
          setAlertModal({
            isOpen: true,
            title: 'Error',
            message: error.response?.data?.error || 'Gagal memverifikasi user',
            variant: 'error'
          })
        } finally {
          setConfirmModal(prev => ({ ...prev, isLoading: false }))
        }
      }
    })
  }

  const handleReject = async (userId) => {
    setConfirmModal({
      isOpen: true,
      title: 'Tolak User',
      message: 'Apakah Anda yakin ingin menolak user ini?',
      variant: 'danger',
      isLoading: false,
      onConfirm: async () => {
        try {
          setConfirmModal(prev => ({ ...prev, isLoading: true }))
          await api.patch(`/admin/users/${userId}/reject`)
          fetchUsers()
          fetchStatistics()
          window.dispatchEvent(new Event('user-verification-changed'))
        } catch (error) {
          setAlertModal({
            isOpen: true,
            title: 'Error',
            message: error.response?.data?.error || 'Gagal menolak user',
            variant: 'error'
          })
        } finally {
          setConfirmModal(prev => ({ ...prev, isLoading: false }))
        }
      }
    })
  }

  const handleRoleChange = async (userId, newRole) => {
    try {
      await api.patch(`/admin/users/${userId}/role`, { role: newRole })
      fetchUsers()
      setAlertModal({
        isOpen: true,
        title: 'Berhasil',
        message: 'Role user berhasil diubah',
        variant: 'success'
      })
    } catch (error) {
      setAlertModal({
        isOpen: true,
        title: 'Error',
        message: error.response?.data?.error || 'Gagal mengubah role',
        variant: 'error'
      })
    }
  }

  const handleSuspendModal = (userId) => {
    setSuspendModal({ isOpen: true, userId, reason: '', isLoading: false })
  }

  const handleSuspend = async () => {
    if (!suspendModal.userId) return

    try {
      setSuspendModal(prev => ({ ...prev, isLoading: true }))
      await api.patch(`/admin/users/${suspendModal.userId}/suspend`, {
        reason: suspendModal.reason || 'Pelanggaran kebijakan komunitas'
      })
      fetchUsers()
      setSuspendModal({ isOpen: false, userId: null, reason: '', isLoading: false })
      setAlertModal({
        isOpen: true,
        title: 'Berhasil',
        message: 'User telah ditangguhkan',
        variant: 'success'
      })
    } catch (error) {
      setSuspendModal(prev => ({ ...prev, isLoading: false }))
      setAlertModal({
        isOpen: true,
        title: 'Error',
        message: error.response?.data?.error || 'Gagal menangguhkan user',
        variant: 'error'
      })
    }
  }

  const handleDeleteUser = async (userId) => {
    setSwipeConfirmModal({
      isOpen: true,
      title: 'Hapus User',
      message: (
        <span>
          Apakah Anda yakin ingin menghapus user ini secara permanen?{' '}
          <strong className="font-bold text-gray-900">
            Semua data terkait (postingan, komentar, profil, dll) juga akan terhapus secara permanen dari sistem.
          </strong>
        </span>
      ),
      isLoading: false,
      onConfirm: async () => {
        try {
          setSwipeConfirmModal(prev => ({ ...prev, isLoading: true }))
          await api.delete(`/admin/users/${userId}`)
          fetchUsers()
          fetchStatistics()
          window.dispatchEvent(new Event('user-verification-changed'))
          setAlertModal({
            isOpen: true,
            title: 'Berhasil',
            message: 'User berhasil dihapus secara permanen',
            variant: 'success'
          })
        } catch (error) {
          setAlertModal({
            isOpen: true,
            title: 'Error',
            message: error.response?.data?.error || 'Gagal menghapus user',
            variant: 'error'
          })
        } finally {
          setSwipeConfirmModal(prev => ({ ...prev, isLoading: false }))
        }
      }
    })
  }

  const handleUnsuspend = async (userId) => {
    setConfirmModal({
      isOpen: true,
      title: 'Buka Penangguhan',
      message: 'Apakah Anda yakin ingin memulihkan akses akun ini?',
      variant: 'info',
      isLoading: false,
      onConfirm: async () => {
        try {
          setConfirmModal(prev => ({ ...prev, isLoading: true }))
          await api.patch(`/admin/users/${userId}/unsuspend`)
          fetchUsers()
          setAlertModal({
            isOpen: true,
            title: 'Berhasil',
            message: 'Penangguhan dicabut',
            variant: 'success'
          })
        } catch (error) {
          setAlertModal({
            isOpen: true,
            title: 'Error',
            message: error.response?.data?.error || 'Gagal mencabut penangguhan',
            variant: 'error'
          })
        } finally {
          setConfirmModal(prev => ({ ...prev, isLoading: false }))
        }
      }
    })
  }

  const getRoleBadge = (role) => {
    const colors = {
      ALUMNI: 'bg-blue-100 text-blue-800',
      PENGURUS: 'bg-purple-100 text-purple-800',
      ADMIN: 'bg-red-100 text-red-800'
    }
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${colors[role] || 'bg-gray-100 text-gray-800'}`}>
        {role}
      </span>
    )
  }

  const getVerifiedBadge = (user) => {
    if (user.isSuspended) {
      return (
        <span className="px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
          Ditangguhkan
        </span>
      )
    }
    return user.verified ? (
      <span className="px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
        Terverifikasi
      </span>
    ) : (
      <span className="px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
        Pending
      </span>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 flex">
      <AdminSidebar />
      
      <div className="flex-1 flex flex-col">
        <main className="flex-1 overflow-y-auto">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
            <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 mb-6">
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Manajemen User</h1>
                <p className="text-gray-600 mt-1">Kelola alumni dan pengurus</p>
              </div>
              <div className="flex gap-3">
                <Button
                  variant="primary"
                  onClick={() => setIsAddUserOpen(true)}
                  className="flex items-center space-x-2"
                >
                  <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  Tambah User
                </Button>
                <Button 
                  variant="outline" 
                  onClick={() => setIsImportModalOpen(true)}
                  className="flex items-center space-x-2 border-emerald-500 text-emerald-600 hover:bg-emerald-50 active:scale-95 transition-all font-semibold"
                >
                  <FileSpreadsheet className="w-4 h-4 mr-1 text-emerald-500" />
                  Import Excel
                </Button>
              </div>
            </div>

        {/* Statistics */}
        {statistics && (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-6">
            <Card className="p-4">
              <div className="text-sm text-gray-600">Total User</div>
              <div className="text-2xl font-bold text-gray-900">{statistics.totalUsers}</div>
            </Card>
            <Card className="p-4">
              <div className="text-sm text-gray-600">Terverifikasi</div>
              <div className="text-2xl font-bold text-green-600">{statistics.verifiedUsers}</div>
            </Card>
            <Card className="p-4">
              <div className="text-sm text-gray-600">Pending</div>
              <div className="text-2xl font-bold text-yellow-600">{statistics.pendingUsers}</div>
            </Card>
            <Card className="p-4">
              <div className="text-sm text-gray-600">Alumni</div>
              <div className="text-2xl font-bold text-blue-600">{statistics.alumniCount}</div>
            </Card>
            <Card className="p-4">
              <div className="text-sm text-gray-600">Pengurus</div>
              <div className="text-2xl font-bold text-purple-600">{statistics.pengurusCount}</div>
            </Card>
            <Card
              onClick={() => setIsExportModalOpen(true)}
              className="p-4 flex flex-col justify-between cursor-pointer border border-blue-200/60 bg-blue-50/20 hover:bg-blue-50/60 hover:border-blue-300 transition-all duration-200 shadow-sm hover:shadow-md hover:-translate-y-0.5 active:scale-[0.98] group"
            >
              <div className="text-xs font-semibold text-blue-800 uppercase tracking-wider">Ekspor Data</div>
              <div className="mt-3 flex items-center justify-between">
                <span className="text-sm font-bold text-blue-700 group-hover:text-blue-800 transition-colors">Unduh Excel</span>
                <div className="p-2 rounded-lg bg-blue-100/50 border border-blue-200/50 text-blue-600 group-hover:bg-blue-100 group-hover:text-blue-700 transition-colors shadow-sm flex items-center justify-center">
                  <FileSpreadsheet className="w-4 h-4 flex-shrink-0" />
                </div>
              </div>
            </Card>
          </div>
        )}

        {/* Filters */}
        <Card className="p-4 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
            <Input
              label="Cari"
              placeholder="Nama, email, atau NIM..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value)
                setPagination({ ...pagination, page: 1 })
              }}
            />
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
              <select
                className="w-full px-4 py-2 border border-gray-300 rounded-lg text-sm"
                value={filterVerified}
                onChange={(e) => {
                  setFilterVerified(e.target.value)
                  setPagination({ ...pagination, page: 1 })
                }}
              >
                <option value="all">Semua</option>
                <option value="true">Terverifikasi</option>
                <option value="false">Pending</option>
                <option value="suspended">Ditangguhkan</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Role</label>
              <select
                className="w-full px-4 py-2 border border-gray-300 rounded-lg text-sm"
                value={filterRole}
                onChange={(e) => {
                  setFilterRole(e.target.value)
                  setPagination({ ...pagination, page: 1 })
                }}
              >
                <option value="all">Semua</option>
                <option value="ALUMNI">Alumni</option>
                <option value="PENGURUS">Pengurus</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Prodi</label>
              <select
                className="w-full px-4 py-2 border border-gray-300 rounded-lg text-sm"
                value={filterProdi}
                onChange={(e) => {
                  setFilterProdi(e.target.value)
                  setPagination({ ...pagination, page: 1 })
                }}
              >
                <option value="all">Semua Prodi</option>
                {filterOptions.prodis.map((p, i) => (
                  <option key={i} value={p}>{p}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Wilayah</label>
              <select
                className="w-full px-4 py-2 border border-gray-300 rounded-lg text-sm"
                value={filterDomisili}
                onChange={(e) => {
                  setFilterDomisili(e.target.value)
                  setPagination({ ...pagination, page: 1 })
                }}
              >
                <option value="all">Semua Wilayah</option>
                {filterOptions.domisilis.map((d, i) => (
                  <option key={i} value={d}>{d}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Angkatan</label>
              <select
                className="w-full px-4 py-2 border border-gray-300 rounded-lg text-sm"
                value={filterAngkatan}
                onChange={(e) => {
                  setFilterAngkatan(e.target.value)
                  setPagination({ ...pagination, page: 1 })
                }}
              >
                <option value="all">Semua Angkatan</option>
                {filterOptions.angkatans.map((a, i) => (
                  <option key={i} value={a}>{a}</option>
                ))}
              </select>
            </div>
          </div>
        </Card>

        {/* Users Table */}
        <Card className="overflow-hidden">
          {loading ? (
            <div className="p-8 text-center">Memuat data...</div>
          ) : users.length === 0 ? (
            <div className="p-8 text-center text-gray-500">Tidak ada data</div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase w-12">No.</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Nama</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Email</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">NIM</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Role</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {users.map((user, index) => (
                      <tr key={user.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-medium">
                          {(pagination.page - 1) * pagination.limit + index + 1}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full overflow-hidden bg-gray-100 flex-shrink-0 border border-gray-200">
                              {user.profile?.fotoProfil ? (
                                <img 
                                  src={getImageUrl(user.profile.fotoProfil, 'profiles')} 
                                  alt={user.nama} 
                                  className="w-full h-full object-cover"
                                  loading="lazy"
                                />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center bg-blue-50 text-blue-600 font-bold text-sm">
                                  {user.nama ? user.nama.charAt(0).toUpperCase() : '?'}
                                </div>
                              )}
                            </div>
                            <div>
                              <div className="text-sm font-semibold text-gray-900 flex items-center gap-1.5">
                                {user.nama}
                                <UserBadge role={user.role} size="sm" />
                              </div>
                              {user.profile?.profesi && (
                                <div className="text-xs text-gray-500">{user.profile.profesi}</div>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">{user.email}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">{user.nim || '-'}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {getRoleBadge(user.role)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {getVerifiedBadge(user)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <div className="flex gap-2">
                            {!user.verified && !user.emailVerified && (
                              <Button
                                variant="danger"
                                size="sm"
                                onClick={() => handleReject(user.id)}
                              >
                                Tolak
                              </Button>
                            )}

                            {!user.verified && user.emailVerified && (
                              <>
                                <Button
                                  variant="primary"
                                  size="sm"
                                  onClick={() => handleVerify(user.id)}
                                >
                                  Verifikasi
                                </Button>
                                <Button
                                  variant="danger"
                                  size="sm"
                                  onClick={() => handleReject(user.id)}
                                >
                                  Tolak
                                </Button>
                              </>
                            )}

                            {user.verified && (
                              <div className="flex items-center gap-2">
                                <select
                                  className="px-2 py-1.5 border border-gray-300 rounded-lg text-xs font-semibold text-gray-700 bg-white hover:bg-gray-50 focus:outline-none transition-colors shadow-sm cursor-pointer"
                                  value={user.role}
                                  onChange={(e) => handleRoleChange(user.id, e.target.value)}
                                >
                                  <option value="ALUMNI">Alumni</option>
                                  <option value="PENGURUS">Pengurus</option>
                                </select>
                                
                                <select
                                  className="px-2 py-1.5 border border-gray-300 rounded-lg text-xs font-semibold text-gray-700 bg-white hover:bg-gray-50 focus:outline-none transition-colors shadow-sm cursor-pointer"
                                  value=""
                                  onChange={(e) => {
                                    const action = e.target.value
                                    if (action === 'edit') handleEditClick(user)
                                    else if (action === 'suspend') handleSuspendModal(user.id)
                                    else if (action === 'unsuspend') handleUnsuspend(user.id)
                                    else if (action === 'delete') handleDeleteUser(user.id)
                                  }}
                                >
                                  <option value="" disabled className="text-gray-400">Aksi</option>
                                  <option value="edit" className="text-blue-600 font-medium" style={{ color: '#2563eb' }}>Edit</option>
                                  {!user.isSuspended ? (
                                    <option value="suspend" className="text-amber-600 font-medium" style={{ color: '#d97706' }}>Suspend</option>
                                  ) : (
                                    <option value="unsuspend" className="text-blue-600 font-medium" style={{ color: '#2563eb' }}>Unsuspend</option>
                                  )}
                                  <option value="delete" className="text-red-600 font-semibold" style={{ color: '#dc2626' }}>Hapus</option>
                                </select>
                              </div>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              {pagination.totalPages > 1 && (
                <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-between">
                  <div className="text-sm text-gray-700">
                    Menampilkan {(pagination.page - 1) * pagination.limit + 1} sampai{' '}
                    {Math.min(pagination.page * pagination.limit, pagination.total)} dari {pagination.total}
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      disabled={pagination.page === 1}
                      onClick={() => setPagination({ ...pagination, page: pagination.page - 1 })}
                    >
                      Sebelumnya
                    </Button>
                    <Button
                      variant="outline"
                      disabled={pagination.page === pagination.totalPages}
                      onClick={() => setPagination({ ...pagination, page: pagination.page + 1 })}
                    >
                      Selanjutnya
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </Card>
          </div>
        </main>
      </div>



      {/* Suspend Modal */}
      <Modal
        isOpen={suspendModal.isOpen}
        onClose={() => setSuspendModal({ ...suspendModal, isOpen: false })}
        title="Tangguhkan User"
        size="md"
        showCloseButton={!suspendModal.isLoading}
      >
        <div className="space-y-4">
          <div className="flex items-start gap-4">
            <div className="flex-shrink-0 p-3 bg-amber-100 rounded-xl">
              <svg className="w-6 h-6 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-gray-900 mb-1">Konfirmasi Penangguhan</h3>
              <p className="text-sm text-gray-600">
                Apakah Anda yakin ingin menangguhkan akun ini? User tidak akan bisa login ke sistem.
              </p>
            </div>
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-semibold text-gray-700">Alasan Penangguhan</label>
            <textarea
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 text-sm"
              rows={3}
              placeholder="Masukkan alasan penangguhan (misal: spamming, konten tidak pantas)..."
              value={suspendModal.reason}
              onChange={(e) => setSuspendModal(prev => ({ ...prev, reason: e.target.value }))}
              disabled={suspendModal.isLoading}
            />
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
            <Button
              variant="outline"
              onClick={() => setSuspendModal({ ...suspendModal, isOpen: false })}
              disabled={suspendModal.isLoading}
            >
              Batal
            </Button>
            <Button
              variant="warning"
              onClick={handleSuspend}
              disabled={suspendModal.isLoading}
            >
              {suspendModal.isLoading ? 'Memproses...' : 'Tangguhkan User'}
            </Button>
          </div>
        </div>
      </Modal>
      <ExportUserModal 
        isOpen={isExportModalOpen} 
        onClose={() => setIsExportModalOpen(false)} 
      />

      {/* Import Excel Modal */}
      <Modal
        isOpen={isImportModalOpen}
        onClose={() => setIsImportModalOpen(false)}
        closeOnOverlayClick={false}
        title="Import User via Excel"
        size="md"
        showCloseButton={true}
      >
        <ImportUserContent 
          onClose={() => setIsImportModalOpen(false)} 
          fetchUsers={fetchUsers} 
          fetchStatistics={fetchStatistics}
          setAlertModal={setAlertModal}
        />
      </Modal>

      {/* Tambah User Modal */}
      <Modal
        isOpen={isAddUserOpen}
        onClose={() => setIsAddUserOpen(false)}
        closeOnOverlayClick={false}
        title="Tambah User Baru"
        size="lg"
      >
        <form onSubmit={handleAddUserSubmit} className="space-y-4">
          {addUserError && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
              {addUserError}
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="Nama Lengkap"
              value={addUserFormData.nama}
              onChange={(e) => setAddUserFormData({ ...addUserFormData, nama: e.target.value })}
              required
            />
            <Input
              label="NIM"
              type="text"
              value={addUserFormData.nim}
              onChange={(e) => {
                const value = e.target.value.replace(/\D/g, '')
                setAddUserFormData({ ...addUserFormData, nim: value })
              }}
              placeholder="Contoh: 123456789"
              required
              maxLength={20}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="Email"
              type="email"
              value={addUserFormData.email}
              onChange={(e) => setAddUserFormData({ ...addUserFormData, email: e.target.value })}
              required
            />
            <Input
              label="Nomor WhatsApp"
              type="tel"
              value={addUserFormData.whatsapp}
              onChange={(e) => {
                const value = e.target.value.replace(/\D/g, '')
                setAddUserFormData({ ...addUserFormData, whatsapp: value })
              }}
              placeholder="08xxxxxxxxxx atau 628xxxxxxxxxx"
              required
              maxLength={15}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="w-full">
              <label className="block text-sm font-medium text-gray-700 mb-1">Provinsi</label>
              <select
                value={addProvinceCode}
                onChange={(e) => setAddProvinceCode(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-sm"
                required
                disabled={addWilayahLoading.provinces}
              >
                <option value="">
                  {addWilayahLoading.provinces ? 'Memuat provinsi...' : 'Pilih provinsi'}
                </option>
                {addProvinces.map((p) => (
                  <option key={p.code} value={p.code}>
                    {p.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="w-full">
              <label className="block text-sm font-medium text-gray-700 mb-1">Kabupaten/Kota</label>
              <select
                value={addRegencyCode}
                onChange={(e) => setAddRegencyCode(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-sm"
                required
                disabled={!addProvinceCode || addWilayahLoading.regencies}
              >
                <option value="">
                  {addWilayahLoading.regencies ? 'Memuat kab/kota...' : 'Pilih kabupaten/kota'}
                </option>
                {addRegencies.map((r) => (
                  <option key={r.code} value={r.code}>
                    {r.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {addDomisiliText && (
            <div className="bg-gray-50 border border-gray-200 rounded-lg px-4 py-2 text-xs text-gray-700">
              <span className="font-semibold">Domisili terpilih:</span> {addDomisiliText}
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="w-full">
              <label className="block text-sm font-medium text-gray-700 mb-1">Program Studi</label>
              <select
                value={addUserFormData.prodi}
                onChange={(e) => setAddUserFormData({ ...addUserFormData, prodi: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-sm"
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
              {addUserFormData.prodi === 'LAINNYA' && (
                <div className="mt-2">
                  <Input
                    label="Program Studi (Lainnya)"
                    value={addUserFormData.prodiLainnya}
                    onChange={(e) => setAddUserFormData({ ...addUserFormData, prodiLainnya: e.target.value })}
                    placeholder="Ketik program studi kamu..."
                    required
                  />
                </div>
              )}
            </div>
            <Input
              label="Angkatan"
              type="number"
              value={addUserFormData.angkatan}
              onChange={(e) => setAddUserFormData({ ...addUserFormData, angkatan: e.target.value })}
              placeholder="Contoh: 2020"
              required
              min="1945"
              max={new Date().getFullYear() + 1}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="Password (Kosongkan untuk default)"
              type="password"
              value={addUserFormData.password}
              onChange={(e) => setAddUserFormData({ ...addUserFormData, password: e.target.value })}
              placeholder="Default: password123"
            />
            <div className="w-full">
              <label className="block text-sm font-medium text-gray-700 mb-1">Role</label>
              <select
                value={addUserFormData.role}
                onChange={(e) => setAddUserFormData({ ...addUserFormData, role: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-sm"
                required
              >
                <option value="ALUMNI">Alumni</option>
                <option value="PENGURUS">Pengurus</option>
              </select>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
            <Button
              variant="primary"
              type="submit"
              disabled={addUserLoading}
              className="w-full sm:w-auto"
            >
              {addUserLoading ? 'Memproses...' : 'Simpan User'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Edit User Modal */}
      <Modal
        isOpen={isEditUserOpen}
        onClose={() => setIsEditUserOpen(false)}
        closeOnOverlayClick={false}
        title="Edit Data User"
        size="lg"
      >
        <form onSubmit={handleEditUserSubmit} className="space-y-4">
          {editUserError && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
              {editUserError}
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="Nama Lengkap"
              value={editUserFormData.nama}
              onChange={(e) => setEditUserFormData({ ...editUserFormData, nama: e.target.value })}
              required
            />
            <Input
              label="NIM"
              type="text"
              value={editUserFormData.nim}
              onChange={(e) => {
                const value = e.target.value.replace(/\D/g, '')
                setEditUserFormData({ ...editUserFormData, nim: value })
              }}
              placeholder="Contoh: 123456789"
              required
              maxLength={20}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="Email"
              type="email"
              value={editUserFormData.email}
              onChange={(e) => setEditUserFormData({ ...editUserFormData, email: e.target.value })}
              required
            />
            <Input
              label="Nomor WhatsApp"
              type="tel"
              value={editUserFormData.whatsapp}
              onChange={(e) => {
                const value = e.target.value.replace(/\D/g, '')
                setEditUserFormData({ ...editUserFormData, whatsapp: value })
              }}
              placeholder="08xxxxxxxxxx atau 628xxxxxxxxxx"
              required
              maxLength={15}
            />
          </div>

          <div className="w-full">
            <Input
              label="Domisili"
              value={editUserFormData.domisili}
              onChange={(e) => setEditUserFormData({ ...editUserFormData, domisili: e.target.value })}
              placeholder="Contoh: Kabupaten Sleman, D.I. Yogyakarta"
              required
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="w-full">
              <label className="block text-sm font-medium text-gray-700 mb-1">Program Studi</label>
              <select
                value={editUserFormData.prodi}
                onChange={(e) => setEditUserFormData({ ...editUserFormData, prodi: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-sm"
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
              {editUserFormData.prodi === 'LAINNYA' && (
                <div className="mt-2">
                  <Input
                    label="Program Studi (Lainnya)"
                    value={editUserFormData.prodiLainnya}
                    onChange={(e) => setEditUserFormData({ ...editUserFormData, prodiLainnya: e.target.value })}
                    placeholder="Ketik program studi kamu..."
                    required
                  />
                </div>
              )}
            </div>
            <Input
              label="Angkatan"
              type="number"
              value={editUserFormData.angkatan}
              onChange={(e) => setEditUserFormData({ ...editUserFormData, angkatan: e.target.value })}
              placeholder="Contoh: 2020"
              required
              min="1945"
              max={new Date().getFullYear() + 1}
            />
          </div>

          <div className="w-full">
            <label className="block text-sm font-medium text-gray-700 mb-1">Role</label>
            <select
              value={editUserFormData.role}
              onChange={(e) => setEditUserFormData({ ...editUserFormData, role: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-sm"
              required
            >
              <option value="ALUMNI">Alumni</option>
              <option value="PENGURUS">Pengurus</option>
            </select>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
            <Button
              variant="outline"
              type="button"
              onClick={() => setIsEditUserOpen(false)}
              disabled={editUserLoading}
            >
              Batal
            </Button>
            <Button
              variant="primary"
              type="submit"
              disabled={editUserLoading}
              className="w-full sm:w-auto"
            >
              {editUserLoading ? 'Memproses...' : 'Simpan Perubahan'}
            </Button>
          </div>
        </form>
      </Modal>

      <ConfirmModal 
        isOpen={confirmModal.isOpen}
        title={confirmModal.title}
        message={confirmModal.message}
        onConfirm={confirmModal.onConfirm}
        onClose={() => setConfirmModal({ ...confirmModal, isOpen: false })}
        variant={confirmModal.variant}
        isLoading={confirmModal.isLoading}
      />

      <SwipeConfirmModal
        isOpen={swipeConfirmModal.isOpen}
        title={swipeConfirmModal.title}
        message={swipeConfirmModal.message}
        onConfirm={swipeConfirmModal.onConfirm}
        onClose={() => setSwipeConfirmModal({ ...swipeConfirmModal, isOpen: false })}
        isLoading={swipeConfirmModal.isLoading}
      />

      <AlertModal 
        isOpen={alertModal.isOpen}
        title={alertModal.title}
        message={alertModal.message}
        onClose={() => setAlertModal({ ...alertModal, isOpen: false })}
        variant={alertModal.variant}
      />
    </div>
  )
}

const ImportUserContent = ({ onClose, fetchUsers, fetchStatistics, setAlertModal }) => {
  const [file, setFile] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [result, setResult] = useState(null)

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0]
    if (selectedFile) {
      if (!selectedFile.name.endsWith('.xlsx') && !selectedFile.name.endsWith('.xls')) {
        setError('Hanya file Excel (.xlsx atau .xls) yang diperbolehkan')
        setFile(null)
        return
      }
      setFile(selectedFile)
      setError('')
      setResult(null)
    }
  }

  const handleDownloadTemplate = async () => {
    try {
      const response = await api.get('/admin/users/import-template', {
        responseType: 'blob'
      })
      const blob = new Blob([response.data], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' })
      const url = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.setAttribute('download', 'Template_Import_User.xlsx')
      document.body.appendChild(link)
      link.click()
      link.removeAttribute('download')
      link.remove()
      window.URL.revokeObjectURL(url)
    } catch (err) {
      console.error('Download template error:', err)
      setAlertModal({
        isOpen: true,
        title: 'Error',
        message: 'Gagal mendownload template Excel',
        variant: 'error'
      })
    }
  }

  const handleImportSubmit = async (e) => {
    e.preventDefault()
    if (!file) {
      setError('Pilih file Excel terlebih dahulu')
      return
    }

    setLoading(true)
    setError('')
    setResult(null)

    const formData = new FormData()
    formData.append('file', file)

    try {
      const response = await api.post('/admin/users/import', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      })
      
      setResult(response.data)
      fetchUsers()
      fetchStatistics()
      
      // Sync sidebar red dot
      window.dispatchEvent(new Event('user-verification-changed'))

      if (response.data.success) {
        setAlertModal({
          isOpen: true,
          title: 'Import Berhasil',
          message: `Selamat! Seluruh data (${response.data.createdCount} user) berhasil diimport ke database tanpa ada masalah.`,
          variant: 'success'
        })
        setFile(null)
      } else {
        setAlertModal({
          isOpen: true,
          title: 'Import Dibatalkan sepenuhnya',
          message: `Proses import dibatalkan karena ada ${response.data.failedCount} baris data yang error. Silakan periksa rincian di bawah.`,
          variant: 'error'
        })
      }

    } catch (err) {
      console.error('Import error:', err)
      const errMsg = err.response?.data?.error || 'Gagal memproses import data user'
      setError(errMsg)
      setAlertModal({
        isOpen: true,
        title: 'Gagal Memproses Excel',
        message: errMsg,
        variant: 'error'
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-4">
      <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 flex items-start gap-3">
        <svg className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <div className="flex-1">
          <p className="text-sm font-semibold text-blue-900">Petunjuk Import</p>
          <p className="text-xs text-blue-700 mt-1 leading-relaxed">
            Pastikan format kolom Excel Anda sama persis dengan template. Kolom password tidak perlu ada, password user baru akan diset otomatis menjadi <code className="bg-blue-100 px-1 py-0.5 rounded font-mono font-semibold">password123</code>.
          </p>
          <button
            type="button"
            onClick={handleDownloadTemplate}
            className="mt-3 inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold shadow-sm transition active:scale-95"
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
            Download Template Excel
          </button>
        </div>
      </div>

      <form onSubmit={handleImportSubmit} className="space-y-4">
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm font-medium">
            {error}
          </div>
        )}

        <div className={`relative border-2 border-dashed rounded-xl p-6 transition flex flex-col items-center justify-center cursor-pointer ${
          file 
            ? 'border-emerald-500 bg-emerald-50/50 hover:bg-emerald-50' 
            : 'border-gray-300 hover:bg-gray-50'
        }`}>
          <input
            type="file"
            accept=".xlsx, .xls"
            onChange={handleFileChange}
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
            disabled={loading}
          />
          {file ? (
            <svg className="w-10 h-10 text-emerald-500 mb-2 transition-transform duration-200 scale-110" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          ) : (
            <svg className="w-10 h-10 text-gray-400 mb-2 transition-transform duration-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
            </svg>
          )}
          <p className={`text-sm font-semibold ${file ? 'text-emerald-800' : 'text-gray-700'}`}>
            {file ? file.name : 'Pilih file Excel Anda (.xlsx)'}
          </p>
          {file && (
            <p className="text-xs text-emerald-600 mt-1.5 font-medium bg-emerald-100/50 px-2.5 py-0.5 rounded-full shadow-sm">
              Ukuran: {(file.size / 1024).toFixed(2)} KB
            </p>
          )}
        </div>

        {result && (
          <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 space-y-2">
            <h4 className="text-sm font-semibold text-gray-900">Hasil Import:</h4>
            <div className="grid grid-cols-2 gap-4 text-xs font-semibold">
              <div className="bg-green-50 border border-green-100 text-green-800 p-2.5 rounded-lg">
                Berhasil: {result.createdCount} user
              </div>
              <div className="bg-red-50 border border-red-100 text-red-800 p-2.5 rounded-lg">
                Gagal: {result.failedCount} user
              </div>
            </div>

            {result.errors && result.errors.length > 0 && (
              <div className="space-y-1.5 pt-2">
                <div className="bg-amber-50 border border-amber-200 text-amber-800 p-2.5 rounded-lg text-xs font-semibold">
                  ⚠️ Import dibatalkan sepenuhnya karena terdapat baris bermasalah. Tidak ada data yang disimpan ke database.
                </div>
                <p className="text-xs font-semibold text-red-700">Rincian Error:</p>
                <div className="max-h-40 overflow-y-auto border border-red-100 rounded-lg p-2 bg-red-50/30 text-[11px] font-medium text-red-800 space-y-1 custom-scrollbar">
                  {result.errors.map((err, idx) => (
                    <div key={idx} className="border-b border-red-50 last:border-b-0 pb-1">
                      <span className="font-bold">Baris {err.row}:</span> {err.errors.join(', ')}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        <div className="flex justify-end gap-3 pt-2">
          <Button
            variant="primary"
            type="submit"
            disabled={loading || !file}
            className="w-full"
          >
            {loading ? 'Mengimport Data...' : 'Mulai Import'}
          </Button>
        </div>
      </form>
    </div>
  )
}

export default UserManagement

