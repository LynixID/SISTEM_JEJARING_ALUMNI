import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import Header from '../components/layout/Header'
import Sidebar from '../components/layout/Sidebar'
import Card from '../components/common/Card'
import Button from '../components/common/Button'
import UserBadge from '../components/common/UserBadge'
import { getConnectionRequests, getConnections, acceptConnection, rejectConnection } from '../services/api'
import { getImageUrl } from '../utils/imageUtils'
import { UserPlus, Check, X, Users, Clock, User, MessageCircle, Search, LayoutGrid, List as ListIcon } from 'lucide-react'
import { getSocket } from '../config/socket'
import OnboardingTour from '../components/common/OnboardingTour'
import useTourStatus from '../hooks/useTourStatus'

const Connections = () => {
  const { user, isAuthenticated, isLoading: authLoading } = useAuth()
  const navigate = useNavigate()
  
  const [activeTab, setActiveTab] = useState('requests') // 'requests' or 'connections'
  const [requests, setRequests] = useState([])
  const [connections, setConnections] = useState([])
  const [loading, setLoading] = useState(true)
  const [isInitialLoad, setIsInitialLoad] = useState(true)
  const [processingId, setProcessingId] = useState(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [viewType, setViewType] = useState('grid') // 'grid' or 'list'
  const [showTour, setShowTour] = useState(false)
  const { shouldShowTour, markTourComplete } = useTourStatus('koneksi')

  useEffect(() => {
    const handleStartTour = () => {
      setShowTour(true)
    }
    window.addEventListener('startKoneksiTour', handleStartTour)
    return () => {
      window.removeEventListener('startKoneksiTour', handleStartTour)
    }
  }, [])

  // Auto-trigger tur untuk user yang belum pernah melihat (via DB)
  useEffect(() => {
    if (!shouldShowTour) return
    const timer = setTimeout(() => {
      setShowTour(true)
    }, 200)
    return () => clearTimeout(timer)
  }, [shouldShowTour])

  // Listen to step changes to switch tabs dynamically
  useEffect(() => {
    const handleStepChange = (e) => {
      const { selector } = e.detail
      if (selector === '#tour-connections-requests-content') {
        setActiveTab('requests')
      } else if (selector === '#tour-connections-list-content') {
        setActiveTab('connections')
      }
    }
    window.addEventListener('tourStepChange', handleStepChange)
    return () => {
      window.removeEventListener('tourStepChange', handleStepChange)
    }
  }, [])

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      navigate('/login', { replace: true })
      return
    }
    if (isAuthenticated) {
      fetchData()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated, authLoading, navigate, activeTab])

  // Setup Socket.io listener untuk real-time updates
  useEffect(() => {
    if (!isAuthenticated) return

    const socket = getSocket()
    const handleNewNotification = () => {
      // Refresh data saat ada notifikasi baru
      fetchData()
    }

    socket.on('new_notification', handleNewNotification)

    return () => {
      socket.off('new_notification', handleNewNotification)
    }
  }, [isAuthenticated])

  const fetchData = async () => {
    try {
      setLoading(true)
      if (activeTab === 'requests') {
        const response = await getConnectionRequests('PENDING')
        setRequests(response.data?.requests || [])
      } else {
        const response = await getConnections()
        setConnections(response.data?.connections || [])
      }
    } catch (error) {
      // Set empty arrays on error
      if (activeTab === 'requests') {
        setRequests([])
      } else {
        setConnections([])
      }
    } finally {
      setLoading(false)
      setIsInitialLoad(false)
    }
  }

  const handleAccept = async (requestId) => {
    try {
      setProcessingId(requestId)
      await acceptConnection(requestId)
      // Refresh data
      await fetchData()
    } catch (error) {
      alert(error.response?.data?.error || 'Gagal menerima request koneksi')
    } finally {
      setProcessingId(null)
    }
  }

  const handleReject = async (requestId) => {
    if (!window.confirm('Apakah Anda yakin ingin menolak request koneksi ini?')) {
      return
    }

    try {
      setProcessingId(requestId)
      await rejectConnection(requestId)
      // Refresh data
      await fetchData()
    } catch (error) {
      alert(error.response?.data?.error || 'Gagal menolak request koneksi')
    } finally {
      setProcessingId(null)
    }
  }

  const handleViewProfile = (userId) => {
    navigate(`/profil/${userId}`)
  }

  const formatTime = (dateString) => {
    const date = new Date(dateString)
    const now = new Date()
    const diff = now - date
    const minutes = Math.floor(diff / 60000)
    const hours = Math.floor(diff / 3600000)
    const days = Math.floor(diff / 86400000)

    if (minutes < 1) return 'Baru saja'
    if (minutes < 60) return `${minutes} menit yang lalu`
    if (hours < 24) return `${hours} jam yang lalu`
    if (days < 7) return `${days} hari yang lalu`
    return date.toLocaleDateString('id-ID', { 
      day: 'numeric', 
      month: 'short', 
      year: 'numeric'
    })
  }

  const formatConnectedSince = (dateString) => {
    if (!dateString) return ''
    const date = new Date(dateString)
    const now = new Date()
    const diff = now - date
    
    const minutes = Math.floor(diff / 60000)
    const hours = Math.floor(diff / 3600000)
    const days = Math.floor(diff / 86400000)
    const months = Math.floor(days / 30)
    const years = Math.floor(days / 365)

    if (years >= 1) return `Terkoneksi sejak ${years} tahun`
    if (months >= 1) return `Terkoneksi sejak ${months} bulan`
    if (days >= 1) return `Terkoneksi sejak ${days} hari`
    if (hours >= 1) return `Terkoneksi sejak ${hours} jam`
    if (minutes >= 1) return `Terkoneksi sejak ${minutes} menit`
    return 'Baru saja terkoneksi'
  }

  const filteredConnections = connections.filter(connection => 
    connection.user.nama.toLowerCase().includes(searchTerm.toLowerCase())
  )

  if (authLoading || isInitialLoad) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="flex">
          <Sidebar />
          <div className="flex-1 flex items-center justify-center min-h-[calc(100vh-4rem)]">
            <div className="text-gray-500">Loading...</div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <div className="flex">
        <Sidebar />
        <main className="flex-1 p-6">
          <div className="max-w-6xl mx-auto">
            {/* Header */}
            <div className="mb-6">
              <h1 className="text-3xl font-bold text-gray-900 mb-2">Koneksi</h1>
              <p className="text-gray-600">Kelola permintaan koneksi dan koneksi Anda</p>
            </div>

            {/* Tabs */}
            <div className="mb-6">
              <div id="tour-connections-tabs" className="flex bg-gray-100/80 p-1 rounded-xl border border-gray-200/40 gap-1 w-fit">
                <button
                  type="button"
                  onClick={() => setActiveTab('requests')}
                  className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-all duration-200 ${
                    activeTab === 'requests'
                      ? 'bg-white text-blue-600 shadow-sm'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-white/40'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <Clock size={16} />
                    <span>Permintaan Koneksi</span>
                    {requests.length > 0 && (
                      <span className={`text-xs rounded-full px-2 py-0.5 font-semibold ${
                        activeTab === 'requests' ? 'bg-blue-100 text-blue-700' : 'bg-blue-600 text-white'
                      }`}>
                        {requests.length}
                      </span>
                    )}
                  </div>
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('connections')}
                  className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-all duration-200 ${
                    activeTab === 'connections'
                      ? 'bg-white text-blue-600 shadow-sm'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-white/40'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <Users size={16} />
                    <span>Koneksi Saya</span>
                    {connections.length > 0 && (
                      <span className={`text-xs rounded-full px-2 py-0.5 font-semibold ${
                        activeTab === 'connections' ? 'bg-blue-50 text-blue-600' : 'bg-gray-200 text-gray-700'
                      }`}>
                        {connections.length}
                      </span>
                    )}
                  </div>
                </button>
              </div>
            </div>

            {/* Content */}
            <div id="tour-connections-card">
              {activeTab === 'requests' ? (
              <Card id="tour-connections-requests-content" className="p-0 overflow-hidden">
                {loading ? (
                  <div className="p-12 text-center">
                    <div className="text-gray-500">Memuat permintaan koneksi...</div>
                  </div>
                ) : requests.length === 0 ? (
                  <div className="p-12 text-center">
                    <UserPlus size={48} className="mx-auto mb-4 text-gray-300" />
                    <p className="text-gray-500 text-lg">Tidak ada permintaan koneksi</p>
                    <p className="text-gray-400 text-sm mt-2">Permintaan koneksi yang masuk akan muncul di sini</p>
                  </div>
                ) : (
                  <div className="divide-y divide-gray-100">
                    {requests.map((request) => (
                      <div key={request.id} className="p-5 hover:bg-gray-50 transition-colors">
                        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                          <div className="flex items-start gap-4 w-full flex-1">
                          {/* Avatar */}
                          <div className="flex-shrink-0">
                            {request.user.fotoProfil ? (
                              <img
                                src={getImageUrl(request.user.fotoProfil, 'profiles')}
                                alt={request.user.nama}
                                className="w-14 h-14 rounded-full object-cover border-2 border-gray-100 shadow-sm"
                                onError={(e) => {
                                  e.target.style.display = 'none'
                                  const fallback = e.target.nextElementSibling
                                  if (fallback) fallback.style.display = 'flex'
                                }}
                              />
                            ) : null}
                            <div 
                              className={`w-14 h-14 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center text-white text-lg font-semibold shadow-sm ${request.user.fotoProfil ? 'hidden' : ''}`}
                              style={{ display: request.user.fotoProfil ? 'none' : 'flex' }}
                            >
                              {request.user.nama?.charAt(0).toUpperCase() || 'U'}
                            </div>
                          </div>

                          {/* Content */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between gap-4">
                              <div className="flex-1">
                                <h3 
                                  className="text-base font-semibold text-gray-900 cursor-pointer hover:text-blue-600 transition-colors"
                                  onClick={() => handleViewProfile(request.user.id)}
                                >
                                  {request.user.nama}
                                  <UserBadge role={request.user.role} size="sm" />
                                </h3>
                                <div className="flex items-center gap-3 mt-1.5">
                                  {request.user.angkatan && (
                                    <span className="text-xs text-gray-500">
                                      Angkatan {request.user.angkatan}
                                    </span>
                                  )}
                                  {request.user.angkatan && request.user.domisili && (
                                    <span className="text-gray-300">•</span>
                                  )}
                                  {request.user.domisili && (
                                    <span className="text-xs text-gray-500">
                                      {request.user.domisili}
                                    </span>
                                  )}
                                </div>
                                {request.message && (
                                  <div className="mt-3 p-3 bg-blue-50 rounded-lg border border-blue-100">
                                    <div className="flex items-start gap-2">
                                      <MessageCircle size={14} className="text-blue-500 mt-0.5 flex-shrink-0" />
                                      <p className="text-sm text-gray-700 leading-relaxed">{request.message}</p>
                                    </div>
                                  </div>
                                )}
                                <p className="text-xs text-gray-400 mt-2.5">
                                  {formatTime(request.createdAt)}
                                </p>
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Actions */}
                        <div className="flex flex-row sm:flex-col items-center sm:items-end gap-2 w-full sm:w-auto mt-2 sm:mt-0 flex-shrink-0">
                            <Button
                              variant="primary"
                              size="sm"
                              onClick={() => handleAccept(request.id)}
                              disabled={processingId === request.id}
                              className="flex items-center gap-2 shadow-sm hover:shadow transition-shadow w-full justify-center"
                            >
                              <Check size={16} />
                              {processingId === request.id ? 'Memproses...' : 'Terima'}
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleReject(request.id)}
                              disabled={processingId === request.id}
                              className="text-red-600 border-red-200 hover:bg-red-50 hover:border-red-300 transition-colors w-full justify-center"
                            >
                              <X size={16} />
                              Tolak
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </Card>
            ) : (
              <Card id="tour-connections-list-content" className="p-0 overflow-hidden">
                {loading ? (
                  <div className="p-12 text-center">
                    <div className="text-gray-500">Memuat koneksi...</div>
                  </div>
                ) : connections.length === 0 ? (
                  <div className="p-12 text-center">
                    <Users size={48} className="mx-auto mb-4 text-gray-300" />
                    <p className="text-gray-500 text-lg">Belum ada koneksi</p>
                    <p className="text-gray-400 text-sm mt-2">Koneksi yang sudah diterima akan muncul di sini</p>
                  </div>
                ) : (
                  <div className="flex flex-col h-full">
                    {/* Toolbar */}
                    <div id="tour-connections-toolbar" className="p-4 border-b border-gray-100 bg-gray-50/50 flex items-center justify-between gap-3">
                      <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                        <input
                          type="text"
                          placeholder="Cari nama koneksi..."
                          value={searchTerm}
                          onChange={(e) => setSearchTerm(e.target.value)}
                          className="w-full pl-9 pr-4 py-1.5 bg-white border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                        />
                      </div>
                      <div className="flex items-center gap-1 bg-white p-1 rounded-lg border border-gray-200 shadow-sm flex-shrink-0">
                        <button
                          onClick={() => setViewType('grid')}
                          className={`p-1.5 rounded-md transition-all ${
                            viewType === 'grid' 
                              ? 'bg-blue-50 text-blue-600 shadow-sm' 
                              : 'text-gray-400 hover:text-gray-600 hover:bg-gray-50'
                          }`}
                          title="Grid View"
                        >
                          <LayoutGrid size={16} />
                        </button>
                        <button
                          onClick={() => setViewType('list')}
                          className={`p-1.5 rounded-md transition-all ${
                            viewType === 'list' 
                              ? 'bg-blue-50 text-blue-600 shadow-sm' 
                              : 'text-gray-400 hover:text-gray-600 hover:bg-gray-50'
                          }`}
                          title="List View"
                        >
                          <ListIcon size={16} />
                        </button>
                      </div>
                    </div>

                    {filteredConnections.length === 0 ? (
                      <div className="p-12 text-center">
                        <Search size={48} className="mx-auto mb-4 text-gray-200" />
                        <p className="text-gray-500">Tidak ada koneksi yang cocok dengan "{searchTerm}"</p>
                      </div>
                    ) : viewType === 'grid' ? (
                      /* Grid View */
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 p-6">
                        {filteredConnections.map((connection) => (
                          <div
                            key={connection.id}
                            className="bg-white border border-gray-200 rounded-xl p-4 hover:shadow-lg hover:border-blue-200 transition-all cursor-pointer group"
                            onClick={() => handleViewProfile(connection.user.id)}
                          >
                            <div className="flex items-start gap-4">
                              {/* Avatar */}
                              <div className="flex-shrink-0">
                                {connection.user.fotoProfil ? (
                                  <img
                                    src={getImageUrl(connection.user.fotoProfil, 'profiles')}
                                    alt={connection.user.nama}
                                    className="w-14 h-14 rounded-full object-cover border-2 border-gray-100 group-hover:border-blue-100 transition-colors shadow-sm"
                                    onError={(e) => {
                                      e.target.style.display = 'none'
                                      const fallback = e.target.nextElementSibling
                                      if (fallback) fallback.style.display = 'flex'
                                    }}
                                  />
                                ) : null}
                                <div 
                                  className={`w-14 h-14 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center text-white text-lg font-bold shadow-sm ${connection.user.fotoProfil ? 'hidden' : ''}`}
                                  style={{ display: connection.user.fotoProfil ? 'none' : 'flex' }}
                                >
                                  {connection.user.nama?.charAt(0) || 'U'}
                                </div>
                              </div>
    
                              {/* Info */}
                              <div className="flex-1 min-w-0">
                                <h3 className="font-bold text-gray-900 truncate group-hover:text-blue-600 transition-colors">
                                  {connection.user.nama}
                                  <UserBadge role={connection.user.role} size="sm" />
                                </h3>
                                {connection.user.angkatan && (
                                  <p className="text-xs text-gray-500 mt-0.5">
                                    Angkatan {connection.user.angkatan}
                                  </p>
                                )}
                                {connection.user.domisili && (
                                  <p className="text-xs text-gray-500 truncate mb-2">
                                    {connection.user.domisili}
                                  </p>
                                )}
                                <div className="mt-auto">
                                  <span className="text-[10px] font-semibold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full inline-block border border-blue-100">
                                    {formatConnectedSince(connection.updatedAt || connection.createdAt)}
                                  </span>
                                </div>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (                     /* List View */
                      <div className="divide-y divide-gray-100">
                        {filteredConnections.map((connection) => (
                          <div
                            key={connection.id}
                            className="py-2.5 px-4 hover:bg-blue-50/30 transition-colors flex items-center justify-between gap-3 cursor-pointer group"
                            onClick={() => handleViewProfile(connection.user.id)}
                          >
                            <div className="flex items-center gap-3 min-w-0 flex-1">
                              {/* Minimal Avatar */}
                              <div className="flex-shrink-0">
                                {connection.user.fotoProfil ? (
                                  <img
                                    src={getImageUrl(connection.user.fotoProfil, 'profiles')}
                                    alt={connection.user.nama}
                                    className="w-9 h-9 rounded-full object-cover border border-gray-100 group-hover:border-blue-200 transition-colors"
                                    onError={(e) => {
                                      e.target.style.display = 'none'
                                      const fallback = e.target.nextElementSibling
                                      if (fallback) fallback.style.display = 'flex'
                                    }}
                                  />
                                ) : null}
                                <div 
                                  className={`w-9 h-9 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center text-white text-xs font-bold shadow-sm ${connection.user.fotoProfil ? 'hidden' : ''}`}
                                  style={{ display: connection.user.fotoProfil ? 'none' : 'flex' }}
                                >
                                  {connection.user.nama?.charAt(0).toUpperCase() || 'U'}
                                </div>
                              </div>
                              
                              <div className="min-w-0 flex-1">
                                <div className="flex items-center gap-1.5 flex-wrap">
                                  <h4 className="font-semibold text-sm text-gray-900 group-hover:text-blue-600 transition-colors truncate">
                                    {connection.user.nama}
                                  </h4>
                                  <span className="hidden sm:inline-flex">
                                    <UserBadge role={connection.user.role} size="sm" />
                                  </span>
                                </div>
                                <div className="text-[11px] text-gray-500 mt-0.5">
                                  {/* Desktop View: Angkatan and Domisili */}
                                  <div className="hidden sm:flex items-center gap-1.5">
                                    <span>Angkatan {connection.user.angkatan}</span>
                                    {connection.user.domisili && (
                                      <>
                                        <span>•</span>
                                        <span className="truncate">{connection.user.domisili}</span>
                                      </>
                                    )}
                                  </div>
                                  {/* Mobile View: Only Domisili (Address) */}
                                  {connection.user.domisili && (
                                    <div className="block sm:hidden truncate text-gray-500">
                                      {connection.user.domisili}
                                    </div>
                                  )}
                                </div>
                              </div>
                            </div>

                            <div className="hidden sm:block flex-shrink-0 text-right">
                              <span className="text-[10px] font-medium text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full border border-blue-100 whitespace-nowrap">
                                {formatConnectedSince(connection.updatedAt || connection.createdAt)}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </Card>
            )}
            </div>
          </div>
        </main>
      </div>
      <OnboardingTour
        isOpen={showTour}
        onClose={() => {
          setShowTour(false)
          markTourComplete()
        }}
        type="koneksi"
      />

    </div>
  )
}

export default Connections

