import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import Header from '../components/layout/Header'
import Sidebar from '../components/layout/Sidebar'
import Card from '../components/common/Card'
import Button from '../components/common/Button'
import { getConnectionRequests, getConnections, acceptConnection, rejectConnection } from '../services/api'
import { getImageUrl } from '../utils/imageUtils'
import { UserPlus, Check, X, Users, Clock, User, MessageCircle } from 'lucide-react'
import { getSocket } from '../config/socket'

const Connections = () => {
  const { user, isAuthenticated, isLoading: authLoading } = useAuth()
  const navigate = useNavigate()
  
  const [activeTab, setActiveTab] = useState('requests') // 'requests' or 'connections'
  const [requests, setRequests] = useState([])
  const [connections, setConnections] = useState([])
  const [loading, setLoading] = useState(true)
  const [processingId, setProcessingId] = useState(null)

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

  if (authLoading || loading) {
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
              <div className="flex gap-2 border-b border-gray-200">
                <button
                  onClick={() => setActiveTab('requests')}
                  className={`px-6 py-3 font-medium text-sm transition-colors relative ${
                    activeTab === 'requests'
                      ? 'text-blue-600 border-b-2 border-blue-600'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <Clock size={18} />
                    Permintaan Koneksi
                    {requests.length > 0 && (
                      <span className="bg-red-500 text-white text-xs rounded-full px-2 py-0.5">
                        {requests.length}
                      </span>
                    )}
                  </div>
                </button>
                <button
                  onClick={() => setActiveTab('connections')}
                  className={`px-6 py-3 font-medium text-sm transition-colors relative ${
                    activeTab === 'connections'
                      ? 'text-blue-600 border-b-2 border-blue-600'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <Users size={18} />
                    Koneksi Saya
                    {connections.length > 0 && (
                      <span className="bg-gray-200 text-gray-700 text-xs rounded-full px-2 py-0.5">
                        {connections.length}
                      </span>
                    )}
                  </div>
                </button>
              </div>
            </div>

            {/* Content */}
            {activeTab === 'requests' ? (
              <Card className="p-0 overflow-hidden">
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
                        <div className="flex items-start gap-4">
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

                          {/* Actions */}
                          <div className="flex flex-col items-end gap-2 flex-shrink-0">
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
              <Card className="p-0 overflow-hidden">
                {connections.length === 0 ? (
                  <div className="p-12 text-center">
                    <Users size={48} className="mx-auto mb-4 text-gray-300" />
                    <p className="text-gray-500 text-lg">Belum ada koneksi</p>
                    <p className="text-gray-400 text-sm mt-2">Koneksi yang sudah diterima akan muncul di sini</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 p-6">
                    {connections.map((connection) => (
                      <div
                        key={connection.id}
                        className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow cursor-pointer"
                        onClick={() => handleViewProfile(connection.user.id)}
                      >
                        <div className="flex items-center gap-3">
                          {/* Avatar */}
                          <div className="flex-shrink-0">
                            {connection.user.fotoProfil ? (
                              <img
                                src={getImageUrl(connection.user.fotoProfil, 'profiles')}
                                alt={connection.user.nama}
                                className="w-12 h-12 rounded-full object-cover border-2 border-gray-200"
                                onError={(e) => {
                                  e.target.style.display = 'none'
                                  const fallback = e.target.nextElementSibling
                                  if (fallback) fallback.style.display = 'flex'
                                }}
                              />
                            ) : null}
                            <div 
                              className={`w-12 h-12 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-full flex items-center justify-center text-white font-bold ${connection.user.fotoProfil ? 'hidden' : ''}`}
                              style={{ display: connection.user.fotoProfil ? 'none' : 'flex' }}
                            >
                              {connection.user.nama?.charAt(0) || 'U'}
                            </div>
                          </div>

                          {/* Info */}
                          <div className="flex-1 min-w-0">
                            <h3 className="font-semibold text-gray-900 truncate">
                              {connection.user.nama}
                            </h3>
                            {connection.user.angkatan && (
                              <p className="text-xs text-gray-600">
                                Angkatan {connection.user.angkatan}
                              </p>
                            )}
                            {connection.user.domisili && (
                              <p className="text-xs text-gray-600 truncate">
                                {connection.user.domisili}
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </Card>
            )}
          </div>
        </main>
      </div>
    </div>
  )
}

export default Connections

