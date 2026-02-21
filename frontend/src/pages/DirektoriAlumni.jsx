import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import Header from '../components/layout/Header'
import Sidebar from '../components/layout/Sidebar'
import { getUsers } from '../services/api'
import { getImageUrl } from '../utils/imageUtils'
import { Search, Filter, Grid, List, MapPin, Calendar, GraduationCap, Briefcase, Building2 } from 'lucide-react'
import Input from '../components/common/Input'
import Button from '../components/common/Button'

const DirektoriAlumni = () => {
  const { isAuthenticated } = useAuth()
  const navigate = useNavigate()
  
  // State management
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [viewMode, setViewMode] = useState('grid')
  const [search, setSearch] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [filters, setFilters] = useState({
    angkatan: '',
    domisili: '',
    prodi: '',
    profesi: ''
  })
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 12,
    total: 0,
    totalPages: 0
  })
  const [filterOptions, setFilterOptions] = useState({
    angkatan: [],
    domisili: [],
    prodi: [],
    profesi: []
  })

  // Debounce search input untuk mengurangi API calls
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search)
      setPagination(prev => ({ ...prev, page: 1 }))
    }, 500)
    return () => clearTimeout(timer)
  }, [search])

  // Fetch users dengan filter dan pagination
  const fetchUsers = useCallback(async () => {
    try {
      setLoading(true)
      // Fetch ALUMNI dan PENGURUS secara terpisah lalu gabungkan
      const paramsAlumni = {
        page: 1,
        limit: 1000, // Ambil semua untuk digabungkan
        role: 'ALUMNI',
        ...(debouncedSearch && { search: debouncedSearch }),
        ...(filters.angkatan && { angkatan: filters.angkatan }),
        ...(filters.domisili && { domisili: filters.domisili }),
        ...(filters.prodi && { prodi: filters.prodi }),
        ...(filters.profesi && { profesi: filters.profesi })
      }
      const paramsPengurus = {
        page: 1,
        limit: 1000,
        role: 'PENGURUS',
        ...(debouncedSearch && { search: debouncedSearch }),
        ...(filters.angkatan && { angkatan: filters.angkatan }),
        ...(filters.domisili && { domisili: filters.domisili }),
        ...(filters.prodi && { prodi: filters.prodi }),
        ...(filters.profesi && { profesi: filters.profesi })
      }
      
      const [responseAlumni, responsePengurus] = await Promise.all([
        getUsers(paramsAlumni),
        getUsers(paramsPengurus)
      ])
      
      // Gabungkan hasil dan urutkan berdasarkan nama
      const allUsers = [...(responseAlumni.data.users || []), ...(responsePengurus.data.users || [])]
        .sort((a, b) => (a.nama || '').localeCompare(b.nama || ''))
      
      // Pagination manual
      const startIndex = (pagination.page - 1) * pagination.limit
      const endIndex = startIndex + pagination.limit
      const paginatedUsers = allUsers.slice(startIndex, endIndex)
      
      setUsers(paginatedUsers)
      setPagination({
        ...pagination,
        total: allUsers.length,
        totalPages: Math.ceil(allUsers.length / pagination.limit)
      })
    } catch (error) {
      console.error('Error fetching users:', error)
    } finally {
      setLoading(false)
    }
  }, [pagination.page, pagination.limit, debouncedSearch, filters])

  // Fetch users saat filter berubah
  useEffect(() => {
    if (isAuthenticated) {
      fetchUsers()
    }
  }, [isAuthenticated, fetchUsers])

  // Fetch filter options untuk dropdown
  useEffect(() => {
    const fetchFilterOptions = async () => {
      try {
        const [responseAlumni, responsePengurus] = await Promise.all([
          getUsers({ limit: 1000, role: 'ALUMNI' }),
          getUsers({ limit: 1000, role: 'PENGURUS' })
        ])
        const allUsers = [...(responseAlumni.data.users || []), ...(responsePengurus.data.users || [])]
        
        // Extract unique values untuk setiap filter
        const angkatanSet = new Set()
        const domisiliSet = new Set()
        const prodiSet = new Set()
        const profesiSet = new Set()
        
        allUsers.forEach(user => {
          if (user.angkatan) angkatanSet.add(user.angkatan)
          if (user.domisili) domisiliSet.add(user.domisili)
          if (user.prodi) prodiSet.add(user.prodi)
          if (user.profile?.profesi) profesiSet.add(user.profile.profesi)
        })
        
        setFilterOptions({
          angkatan: Array.from(angkatanSet).sort((a, b) => b - a),
          domisili: Array.from(domisiliSet).sort(),
          prodi: Array.from(prodiSet).sort(),
          profesi: Array.from(profesiSet).sort()
        })
      } catch (error) {
        console.error('Error fetching filter options:', error)
      }
    }
    
    if (isAuthenticated) {
      fetchFilterOptions()
    }
  }, [isAuthenticated])

  // Handler untuk update filter dan reset ke page 1
  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }))
    setPagination(prev => ({ ...prev, page: 1 }))
  }

  // Reset semua filter dan search
  const clearFilters = () => {
    setFilters({ angkatan: '', domisili: '', prodi: '', profesi: '' })
    setSearch('')
    setPagination(prev => ({ ...prev, page: 1 }))
  }

  // Navigate ke detail profil
  const handleViewProfile = (userId) => {
    navigate(`/profil/${userId}`)
  }

  // Redirect jika belum login
  if (!isAuthenticated) {
    navigate('/login', { replace: true })
    return null
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <div className="flex">
        <Sidebar />
        <main className="flex-1">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            {/* Header section */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 sm:p-8 mb-6">
              <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-2">Direktori Alumni & Pengurus</h1>
              <p className="text-gray-600 text-base sm:text-lg">Temukan dan terhubung dengan sesama alumni dan pengurus DPW IKA UII JATENG</p>
            </div>

            {/* Search & Filter section */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5 mb-6">
              {/* Search bar */}
              <div className="mb-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
                  <Input
                    type="text"
                    placeholder="Cari alumni atau pengurus (Nama, NIM, Profesi)..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="pl-10 w-full"
                  />
                </div>
              </div>

              {/* Filter dropdowns, Reset, dan View Mode - All in one row */}
              <div className="flex flex-wrap items-end gap-3">
                {/* Filter dropdowns */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 flex-1 min-w-0">
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1.5">Angkatan</label>
                    <select
                      value={filters.angkatan}
                      onChange={(e) => handleFilterChange('angkatan', e.target.value)}
                      className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                    >
                      <option value="">Semua Angkatan</option>
                      {filterOptions.angkatan.map(angkatan => (
                        <option key={angkatan} value={angkatan}>{angkatan}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1.5">Domisili</label>
                    <select
                      value={filters.domisili}
                      onChange={(e) => handleFilterChange('domisili', e.target.value)}
                      className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                    >
                      <option value="">Semua Domisili</option>
                      {filterOptions.domisili.map(domisili => (
                        <option key={domisili} value={domisili}>{domisili}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1.5">Program Studi</label>
                    <select
                      value={filters.prodi}
                      onChange={(e) => handleFilterChange('prodi', e.target.value)}
                      className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                    >
                      <option value="">Semua Prodi</option>
                      {filterOptions.prodi.map(prodi => (
                        <option key={prodi} value={prodi}>{prodi}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1.5">Profesi</label>
                    <select
                      value={filters.profesi}
                      onChange={(e) => handleFilterChange('profesi', e.target.value)}
                      className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                    >
                      <option value="">Semua Profesi</option>
                      {filterOptions.profesi.map(profesi => (
                        <option key={profesi} value={profesi}>{profesi}</option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Reset Filter Button */}
                <div className="flex-shrink-0">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={clearFilters} 
                    className="rounded-lg h-[38px] px-3"
                  >
                    <Filter size={16} className="mr-1.5" />
                    Reset
                  </Button>
                </div>

                {/* View Mode Toggle */}
                <div className="flex-shrink-0 flex items-center gap-1 bg-gray-100 rounded-lg p-1">
                  <button
                    onClick={() => setViewMode('grid')}
                    className={`p-1.5 rounded transition-colors ${
                      viewMode === 'grid' 
                        ? 'bg-white text-blue-600 shadow-sm' 
                        : 'text-gray-600 hover:text-gray-900'
                    }`}
                    title="Grid View"
                  >
                    <Grid size={16} />
                  </button>
                  <button
                    onClick={() => setViewMode('list')}
                    className={`p-1.5 rounded transition-colors ${
                      viewMode === 'list' 
                        ? 'bg-white text-blue-600 shadow-sm' 
                        : 'text-gray-600 hover:text-gray-900'
                    }`}
                    title="List View"
                  >
                    <List size={16} />
                  </button>
                </div>
              </div>
            </div>

            {/* Results count */}
            <div className="mb-4 text-sm text-gray-600">
              Menampilkan {users.length} dari {pagination.total} alumni & pengurus
            </div>

            {/* Loading state */}
            {loading ? (
              <div className="text-center py-12">
                <div className="text-gray-500">Memuat data alumni...</div>
              </div>
            ) : users.length === 0 ? (
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-12 text-center">
                <p className="text-gray-500">Tidak ada alumni atau pengurus ditemukan</p>
              </div>
            ) : (
              <>
                {/* Grid view */}
                {viewMode === 'grid' ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-6">
                    {users.map((user) => (
                      <div
                        key={user.id}
                        className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md hover:border-blue-300 transition-all cursor-pointer group"
                        onClick={() => handleViewProfile(user.id)}
                      >
                        <div className="flex flex-col items-center text-center">
                          {/* Avatar */}
                          <div className="relative mb-4">
                            {user.profile?.fotoProfil ? (
                              <img
                                src={getImageUrl(user.profile.fotoProfil, 'profiles')}
                                alt={user.nama}
                                className="w-20 h-20 rounded-full object-cover border-3 border-gray-200 group-hover:border-blue-400 transition-colors shadow-sm"
                                onError={(e) => { e.target.style.display = 'none' }}
                              />
                            ) : (
                              <div className="w-20 h-20 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white text-2xl font-bold border-3 border-gray-200 shadow-sm">
                                {user.nama?.charAt(0).toUpperCase()}
                              </div>
                            )}
                          </div>

                          {/* User info */}
                          <h3 className="font-semibold text-base text-gray-900 mb-1 group-hover:text-blue-600 transition-colors">
                            {user.nama}
                          </h3>
                          
                          {/* Role badge */}
                          {user.role === 'ALUMNI' && (
                            <span className="inline-block px-2 py-0.5 bg-blue-100 text-blue-700 text-xs font-medium rounded-full mb-2">
                              Alumni
                            </span>
                          )}
                          {user.role === 'PENGURUS' && (
                            <span className="inline-block px-2 py-0.5 bg-blue-100 text-blue-700 text-xs font-medium rounded-full mb-2">
                              Pengurus
                            </span>
                          )}

                          {user.profile?.profesi && (
                            <p className="text-gray-700 text-sm font-medium mb-1">{user.profile.profesi}</p>
                          )}
                          {user.profile?.jabatan && user.profile?.perusahaan && (
                            <p className="text-gray-500 text-xs mb-3 line-clamp-2">
                              {user.profile.jabatan} di {user.profile.perusahaan}
                            </p>
                          )}

                          {/* Additional details */}
                          <div className="w-full space-y-1.5 mt-3 pt-3 border-t border-gray-100">
                            {user.domisili && (
                              <div className="flex items-center justify-center gap-1.5 text-xs text-gray-600">
                                <MapPin size={12} className="text-gray-400" />
                                <span className="truncate">{user.domisili}</span>
                              </div>
                            )}
                            {user.angkatan && (
                              <div className="flex items-center justify-center gap-1.5 text-xs text-gray-600">
                                <Calendar size={12} className="text-gray-400" />
                                <span>Angkatan {user.angkatan}</span>
                              </div>
                            )}
                            {user.prodi && (
                              <div className="flex items-center justify-center gap-1.5 text-xs text-gray-600">
                                <GraduationCap size={12} className="text-gray-400" />
                                <span className="truncate">{user.prodi}</span>
                              </div>
                            )}
                          </div>

                          <Button
                            variant="primary"
                            size="sm"
                            className="mt-4 w-full rounded-lg text-sm"
                            onClick={(e) => {
                              e.stopPropagation()
                              handleViewProfile(user.id)
                            }}
                          >
                            Lihat Profil
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  /* List view */
                  <div className="space-y-3 mb-6">
                    {users.map((user) => (
                      <div
                        key={user.id}
                        className="bg-white rounded-xl shadow-sm border border-gray-200 p-5 hover:shadow-md hover:border-blue-300 transition-all cursor-pointer group"
                        onClick={() => handleViewProfile(user.id)}
                      >
                        <div className="flex items-center gap-4">
                          {/* Avatar */}
                          <div className="relative flex-shrink-0">
                            {user.profile?.fotoProfil ? (
                              <img
                                src={getImageUrl(user.profile.fotoProfil, 'profiles')}
                                alt={user.nama}
                                className="w-14 h-14 rounded-full object-cover border-2 border-gray-200 group-hover:border-blue-400 transition-colors shadow-sm"
                                onError={(e) => { e.target.style.display = 'none' }}
                              />
                            ) : (
                              <div className="w-14 h-14 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white text-lg font-bold border-2 border-gray-200 shadow-sm">
                                {user.nama?.charAt(0).toUpperCase()}
                              </div>
                            )}
                          </div>

                          {/* User info */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between gap-4">
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 mb-1">
                                  <h3 className="font-semibold text-base text-gray-900 group-hover:text-blue-600 transition-colors truncate">
                                    {user.nama}
                                  </h3>
                                  {user.role === 'ALUMNI' && (
                                    <span className="inline-block px-2 py-0.5 bg-blue-100 text-blue-700 text-xs font-medium rounded-full flex-shrink-0">
                                      Alumni
                                    </span>
                                  )}
                                  {user.role === 'PENGURUS' && (
                                    <span className="inline-block px-2 py-0.5 bg-blue-100 text-blue-700 text-xs font-medium rounded-full flex-shrink-0">
                                      Pengurus
                                    </span>
                                  )}
                                </div>
                                {user.profile?.profesi && (
                                  <p className="text-gray-700 text-sm font-medium mb-1">{user.profile.profesi}</p>
                                )}
                                {user.profile?.jabatan && user.profile?.perusahaan && (
                                  <div className="flex items-center gap-1.5 text-gray-500 text-xs mb-2">
                                    <Briefcase size={12} className="text-gray-400" />
                                    <span className="truncate">{user.profile.jabatan} di {user.profile.perusahaan}</span>
                                  </div>
                                )}
                                <div className="flex flex-wrap items-center gap-3 text-xs text-gray-600">
                                  {user.domisili && (
                                    <div className="flex items-center gap-1.5">
                                      <MapPin size={12} className="text-gray-400" />
                                      <span className="truncate">{user.domisili}</span>
                                    </div>
                                  )}
                                  {user.angkatan && (
                                    <div className="flex items-center gap-1.5">
                                      <Calendar size={12} className="text-gray-400" />
                                      <span>Angkatan {user.angkatan}</span>
                                    </div>
                                  )}
                                  {user.prodi && (
                                    <div className="flex items-center gap-1.5">
                                      <GraduationCap size={12} className="text-gray-400" />
                                      <span className="truncate">{user.prodi}</span>
                                    </div>
                                  )}
                                </div>
                              </div>
                              <Button
                                variant="primary"
                                size="sm"
                                className="rounded-lg flex-shrink-0 text-sm"
                                onClick={(e) => {
                                  e.stopPropagation()
                                  handleViewProfile(user.id)
                                }}
                              >
                                Lihat Profil
                              </Button>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Pagination */}
                {pagination.totalPages > 1 && (
                  <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                    <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                      <div className="text-sm text-gray-700">
                        Halaman {pagination.page} dari {pagination.totalPages}
                      </div>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setPagination(prev => ({ ...prev, page: prev.page - 1 }))}
                          disabled={pagination.page === 1}
                          className="rounded-xl"
                        >
                          Sebelumnya
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setPagination(prev => ({ ...prev, page: prev.page + 1 }))}
                          disabled={pagination.page >= pagination.totalPages}
                          className="rounded-xl"
                        >
                          Selanjutnya
                        </Button>
                      </div>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </main>
      </div>
    </div>
  )
}

export default DirektoriAlumni
