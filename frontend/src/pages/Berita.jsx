import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Calendar, User as UserIcon, Eye, Search, Filter, MapPin } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import api, { getReadStatus, markAnnouncementAsRead, markEventAsRead } from '../services/api'
import { getImageUrl } from '../utils/imageUtils'
import Header from '../components/layout/Header'
import Sidebar from '../components/layout/Sidebar'
import Card from '../components/common/Card'
import Button from '../components/common/Button'
import Input from '../components/common/Input'

const Berita = () => {
  const { user, isAuthenticated, isLoading } = useAuth()
  const navigate = useNavigate()
  const [activeTab, setActiveTab] = useState('pengumuman') // 'pengumuman' atau 'event'
  const [announcements, setAnnouncements] = useState([])
  const [events, setEvents] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [readStatus, setReadStatus] = useState({ announcements: {}, events: {} })
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 12,
    total: 0,
    totalPages: 0
  })

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      navigate('/login', { replace: true })
    }
  }, [isAuthenticated, isLoading, navigate])

  useEffect(() => {
    if (isAuthenticated) {
      if (activeTab === 'pengumuman') {
        fetchAnnouncements()
      } else {
        fetchEvents()
      }
    }
  }, [pagination.page, isAuthenticated, activeTab])

  const fetchAnnouncements = async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams({
        page: pagination.page,
        limit: pagination.limit,
        published: 'true',
        ...(search && { search })
      })

      const response = await api.get(`/announcements?${params}`)
      setAnnouncements(response.data.announcements)
      setPagination(response.data.pagination)

      // Fetch read status untuk semua announcements
      if (response.data.announcements.length > 0 && isAuthenticated) {
        const announcementIds = response.data.announcements.map(a => a.id)
        try {
          const readStatusResponse = await getReadStatus(announcementIds, [])
          setReadStatus(prev => ({
            ...prev,
            announcements: { ...prev.announcements, ...readStatusResponse.data.announcements }
          }))
        } catch (error) {
          console.error('Error fetching read status:', error)
        }
      }
    } catch (error) {
      console.error('Error fetching announcements:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSearch = (e) => {
    e.preventDefault()
    setPagination({ ...pagination, page: 1 })
    fetchAnnouncements()
  }

  const fetchEvents = async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams({
        page: pagination.page,
        limit: pagination.limit,
        published: 'true',
        ...(search && { search })
      })

      const response = await api.get(`/events?${params}`)
      setEvents(response.data.events || [])
      setPagination(response.data.pagination || { ...pagination, total: 0, totalPages: 0 })

      // Fetch read status untuk semua events
      if (response.data.events && response.data.events.length > 0 && isAuthenticated) {
        const eventIds = response.data.events.map(e => e.id)
        try {
          const readStatusResponse = await getReadStatus([], eventIds)
          setReadStatus(prev => ({
            ...prev,
            events: { ...prev.events, ...readStatusResponse.data.events }
          }))
        } catch (error) {
          console.error('Error fetching read status:', error)
        }
      }
    } catch (error) {
      console.error('Error fetching events:', error)
    } finally {
      setLoading(false)
    }
  }


  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('id-ID', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  if (isLoading && announcements.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="flex">
          <Sidebar />
          <div className="flex-1 flex items-center justify-center min-h-[calc(100vh-4rem)]">
            <div className="text-gray-500">Memuat berita...</div>
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
        <main className="flex-1">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            {/* Header */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 sm:p-8 mb-6">
              <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-2">Berita & Pengumuman</h1>
              <p className="text-gray-600 text-base sm:text-lg">Informasi terbaru dari DPW IKA UII JATENG</p>
            </div>

            {/* Tabs */}
            <div className="bg-white border-b border-gray-200 sticky top-0 z-20 shadow-sm mb-6">
              <div className="flex space-x-1 overflow-x-auto scrollbar-hide">
                <button
                  onClick={() => {
                    setActiveTab('pengumuman')
                    setPagination({ ...pagination, page: 1 })
                  }}
                  className={`flex items-center gap-2 px-5 py-4 border-b-3 transition-all whitespace-nowrap font-medium ${
                    activeTab === 'pengumuman'
                      ? 'border-blue-600 text-blue-600 bg-blue-50/50'
                      : 'border-transparent text-gray-600 hover:text-blue-600 hover:bg-gray-50'
                  }`}
                >
                  Pengumuman
                </button>
                <button
                  onClick={() => {
                    setActiveTab('event')
                    setPagination({ ...pagination, page: 1 })
                  }}
                  className={`flex items-center gap-2 px-5 py-4 border-b-3 transition-all whitespace-nowrap font-medium ${
                    activeTab === 'event'
                      ? 'border-blue-600 text-blue-600 bg-blue-50/50'
                      : 'border-transparent text-gray-600 hover:text-blue-600 hover:bg-gray-50'
                  }`}
                >
                  Event
                </button>
              </div>
            </div>

            {/* Search & Filter */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mb-6">
              <form onSubmit={handleSearch} className="flex gap-4 flex-wrap">
                <div className="flex-1 min-w-[200px]">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                    <Input
                      type="text"
                      placeholder="Cari berita..."
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                      className="pl-10 w-full"
                    />
                  </div>
                </div>
                <div className="flex gap-2 flex-wrap">
                  <Button type="submit" variant="primary">
                    Cari
                  </Button>
                </div>
              </form>
            </div>

            {/* Content Grid */}
            {activeTab === 'pengumuman' ? (
              <>
                {loading && announcements.length === 0 ? (
                  <div className="text-center py-12 text-gray-500">Memuat pengumuman...</div>
                ) : announcements.length === 0 ? (
                  <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-12 text-center">
                    <p className="text-gray-500">Tidak ada pengumuman ditemukan</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-6">
                    {announcements.map((announcement) => {
                      const isUnread = !readStatus.announcements[announcement.id]
                      return (
                      <div
                        key={announcement.id}
                        className={`bg-white rounded-2xl border border-gray-100 overflow-hidden hover:shadow transition-all cursor-pointer group relative ${
                          isUnread 
                            ? 'shadow-lg shadow-blue-200 ring-2 ring-blue-400' 
                            : 'shadow-sm'
                        }`}
                        onClick={async () => {
                          // Mark as read jika belum dibaca
                          if (isUnread && isAuthenticated) {
                            try {
                              await markAnnouncementAsRead(announcement.id)
                              setReadStatus(prev => ({
                                ...prev,
                                announcements: { ...prev.announcements, [announcement.id]: true }
                              }))
                            } catch (error) {
                              console.error('Error marking announcement as read:', error)
                            }
                          }
                          navigate(`/berita/${announcement.slug || announcement.id}`)
                        }}
                      >
                        {/* Badge merah untuk item yang belum dibaca */}
                        {isUnread && (
                          <div className="absolute top-2 right-2 w-3 h-3 bg-red-500 rounded-full z-10 shadow-sm"></div>
                        )}
                        {announcement.image && (
                          <div className="h-48 bg-gray-200 overflow-hidden relative">
                            <img
                              src={getImageUrl(announcement.image)}
                              alt={announcement.title}
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                              onError={(e) => {
                                e.target.style.display = 'none'
                              }}
                            />
                          </div>
                        )}
                        <div className="p-5">
                          <div className="flex items-center justify-end mb-3">
                            <div className="flex items-center gap-1 text-xs text-gray-500">
                              <Eye size={14} />
                              {announcement.views || 0}
                            </div>
                          </div>
                          <h3 className="font-bold text-lg text-gray-900 mb-2 line-clamp-2 group-hover:text-blue-600 transition-colors">
                            {announcement.title}
                          </h3>
                          <div className="flex items-center gap-2 text-xs text-gray-500 mb-3">
                            <Calendar size={14} />
                            {formatDate(announcement.createdAt)}
                          </div>
                          {announcement.content && (
                            <p className="text-sm text-gray-600 line-clamp-3 mb-4">
                              {announcement.content.replace(/<[^>]*>/g, '').substring(0, 150)}...
                            </p>
                          )}
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation()
                              navigate(`/berita/${announcement.slug || announcement.id}`)
                            }}
                            className="w-full rounded-xl"
                          >
                            Baca Selengkapnya
                          </Button>
                        </div>
                      </div>
                      )
                    })}
                  </div>
                )}
              </>
            ) : (
              <>
                {loading && events.length === 0 ? (
                  <div className="text-center py-12 text-gray-500">Memuat event...</div>
                ) : events.length === 0 ? (
                  <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-12 text-center">
                    <p className="text-gray-500">Tidak ada event ditemukan</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-6">
                    {events.map((event) => {
                      const isUnread = !readStatus.events[event.id]
                      return (
                      <div
                        key={event.id}
                        className={`bg-white rounded-2xl border border-gray-100 overflow-hidden hover:shadow transition-all cursor-pointer group relative ${
                          isUnread 
                            ? 'shadow-lg shadow-blue-200/50 ring-2 ring-blue-100' 
                            : 'shadow-sm'
                        }`}
                        onClick={async () => {
                          // Mark as read jika belum dibaca
                          if (isUnread && isAuthenticated) {
                            try {
                              await markEventAsRead(event.id)
                              setReadStatus(prev => ({
                                ...prev,
                                events: { ...prev.events, [event.id]: true }
                              }))
                            } catch (error) {
                              console.error('Error marking event as read:', error)
                            }
                          }
                          navigate(`/events/${event.id}`)
                        }}
                      >
                        {/* Badge merah untuk item yang belum dibaca */}
                        {isUnread && (
                          <div className="absolute top-2 right-2 w-3 h-3 bg-red-500 rounded-full z-10 shadow-sm"></div>
                        )}
                        {event.image && (
                          <div className="h-48 bg-gray-200 overflow-hidden relative">
                            <img
                              src={getImageUrl(event.image, 'events')}
                              alt={event.title}
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                              onError={(e) => {
                                e.target.style.display = 'none'
                              }}
                            />
                          </div>
                        )}
                        <div className="p-5">
                          <div className="flex items-center justify-end mb-3">
                            <div className={`text-xs px-3 py-1 rounded-full font-medium ${
                              new Date(event.tanggal) > new Date() 
                                ? 'bg-green-100 text-green-800' 
                                : 'bg-gray-100 text-gray-800'
                            }`}>
                              {new Date(event.tanggal) > new Date() ? 'Akan datang' : 'Sudah lewat'}
                            </div>
                          </div>
                          <h3 className="font-bold text-lg text-gray-900 mb-2 line-clamp-2 group-hover:text-blue-600 transition-colors">
                            {event.title}
                          </h3>
                          <div className="space-y-1 text-xs text-gray-600 mb-3">
                            <div className="flex items-center gap-1">
                              <Calendar size={14} />
                              {formatDate(event.tanggal)}
                            </div>
                            {event.lokasi && (
                              <div className="flex items-center gap-1">
                                <MapPin size={14} />
                                {event.lokasi}
                              </div>
                            )}
                          </div>
                          {event.description && (
                            <p className="text-sm text-gray-600 line-clamp-3 mb-4">
                              {event.description.substring(0, 150)}...
                            </p>
                          )}
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation()
                              navigate(`/events/${event.id}`)
                            }}
                            className="w-full rounded-xl"
                          >
                            Lihat Detail
                          </Button>
                        </div>
                      </div>
                      )
                    })}
                  </div>
                )}
              </>
            )}

            {/* Pagination */}
            {pagination.totalPages > 1 && (
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                  <div className="text-sm text-gray-700">
                    Menampilkan {(pagination.page - 1) * pagination.limit + 1} sampai{' '}
                    {Math.min(pagination.page * pagination.limit, pagination.total)} dari {pagination.total} {activeTab === 'pengumuman' ? 'pengumuman' : 'event'}
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPagination({ ...pagination, page: pagination.page - 1 })}
                      disabled={pagination.page === 1}
                      className="rounded-xl"
                    >
                      Sebelumnya
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPagination({ ...pagination, page: pagination.page + 1 })}
                      disabled={pagination.page >= pagination.totalPages}
                      className="rounded-xl"
                    >
                      Selanjutnya
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  )
}

export default Berita

