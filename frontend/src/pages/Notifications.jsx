import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { getNotifications, markNotificationAsRead, markAllNotificationsAsRead, deleteNotification, getUnreadCount } from '../services/api'
import { getSocket } from '../config/socket'
import Header from '../components/layout/Header'
import Sidebar from '../components/layout/Sidebar'
import Card from '../components/common/Card'
import Button from '../components/common/Button'
import { Bell, Search, Filter, Check, CheckCheck, Trash2, Heart, MessageCircle, Reply, Megaphone, Calendar, X } from 'lucide-react'

const Notifications = () => {
  const { user, isAuthenticated, isLoading: authLoading } = useAuth()
  const navigate = useNavigate()
  
  // State management
  const [notifications, setNotifications] = useState([])
  const [filteredNotifications, setFilteredNotifications] = useState([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('ALL')
  const [selectedStatus, setSelectedStatus] = useState('ALL') // ALL, READ, UNREAD
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [total, setTotal] = useState(0)
  const [markingAsRead, setMarkingAsRead] = useState(false)
  const limit = 20

  const categories = [
    { value: 'ALL', label: 'Semua', icon: Bell, color: 'gray' },
    { value: 'LIKE', label: 'Like', icon: Heart, color: 'red' },
    { value: 'COMMENT', label: 'Komentar', icon: MessageCircle, color: 'blue' },
    { value: 'REPLY', label: 'Balasan', icon: Reply, color: 'green' },
    { value: 'ANNOUNCEMENT', label: 'Pengumuman', icon: Megaphone, color: 'purple' },
    { value: 'EVENT', label: 'Event', icon: Calendar, color: 'orange' }
  ]

  const statusOptions = [
    { value: 'ALL', label: 'Semua' },
    { value: 'UNREAD', label: 'Belum Dibaca' },
    { value: 'READ', label: 'Sudah Dibaca' }
  ]

  // Redirect jika belum authenticated
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      navigate('/login', { replace: true })
    }
  }, [isAuthenticated, authLoading, navigate])

  // Fetch notifications (fetch all untuk filter di frontend)
  useEffect(() => {
    if (isAuthenticated) {
      fetchNotifications()
      fetchUnreadCount()
    }
  }, [isAuthenticated])

  // Setup Socket.io listener untuk real-time notifications
  useEffect(() => {
    if (!isAuthenticated) return

    const socket = getSocket()
    const handleNewNotification = (notification) => {
      setNotifications(prev => [notification, ...prev])
      setUnreadCount(prev => prev + 1)
      setTotal(prev => prev + 1)
    }

    socket.on('new_notification', handleNewNotification)

    return () => {
      socket.off('new_notification', handleNewNotification)
    }
  }, [isAuthenticated])

  // Reset page saat filter berubah
  useEffect(() => {
    setPage(1)
  }, [searchQuery, selectedCategory, selectedStatus])

  // Filter notifications berdasarkan search query, category, dan status
  useEffect(() => {
    let filtered = [...notifications]

    // Filter by category
    if (selectedCategory !== 'ALL') {
      filtered = filtered.filter(n => n.type === selectedCategory)
    }

    // Filter by status
    if (selectedStatus === 'UNREAD') {
      filtered = filtered.filter(n => !n.read)
    } else if (selectedStatus === 'READ') {
      filtered = filtered.filter(n => n.read)
    }

    // Filter by search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter(n => 
        n.message.toLowerCase().includes(query)
      )
    }

    // Update pagination based on filtered results
    const filteredTotal = filtered.length
    const filteredTotalPages = Math.ceil(filteredTotal / limit)
    setTotalPages(filteredTotalPages)
    setTotal(filteredTotal)

    // Apply pagination to filtered results
    const startIndex = (page - 1) * limit
    const endIndex = startIndex + limit
    const paginated = filtered.slice(startIndex, endIndex)

    setFilteredNotifications(paginated)
  }, [notifications, searchQuery, selectedCategory, selectedStatus, page, limit])

  const fetchNotifications = async () => {
    try {
      setLoading(true)
      // Fetch semua notifikasi untuk filter di frontend (limit besar)
      const params = {
        page: 1,
        limit: 1000 // Fetch banyak untuk filter di frontend
      }

      const response = await getNotifications(params)
      setNotifications(response.data.notifications)
    } catch (error) {
      console.error('Error fetching notifications:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchUnreadCount = async () => {
    try {
      const response = await getUnreadCount()
      setUnreadCount(response.data.unreadCount)
    } catch (error) {
      console.error('Error fetching unread count:', error)
    }
  }

  const handleMarkAsRead = async (id) => {
    try {
      await markNotificationAsRead(id)
      setNotifications(prev => 
        prev.map(n => n.id === id ? { ...n, read: true } : n)
      )
      setUnreadCount(prev => Math.max(0, prev - 1))
    } catch (error) {
      console.error('Error marking notification as read:', error)
    }
  }

  const handleMarkAllAsRead = async () => {
    try {
      setMarkingAsRead(true)
      await markAllNotificationsAsRead()
      setNotifications(prev => prev.map(n => ({ ...n, read: true })))
      setUnreadCount(0)
    } catch (error) {
      console.error('Error marking all as read:', error)
    } finally {
      setMarkingAsRead(false)
    }
  }

  const handleDelete = async (id) => {
    try {
      await deleteNotification(id)
      setNotifications(prev => prev.filter(n => n.id !== id))
      setTotal(prev => prev - 1)
      // Update unread count if deleted notification was unread
      const deleted = notifications.find(n => n.id === id)
      if (deleted && !deleted.read) {
        setUnreadCount(prev => Math.max(0, prev - 1))
      }
    } catch (error) {
      console.error('Error deleting notification:', error)
    }
  }

  const handleNotificationClick = (notification) => {
    // Mark as read jika belum dibaca
    if (!notification.read) {
      handleMarkAsRead(notification.id)
    }

    // Navigate berdasarkan type
    if (notification.relatedType === 'post' && notification.relatedId) {
      navigate(`/posts/${notification.relatedId}`)
    } else if (notification.relatedType === 'announcement' && notification.relatedId) {
      navigate(`/berita/${notification.relatedId}`)
    } else if (notification.relatedType === 'event' && notification.relatedId) {
      navigate(`/events/${notification.relatedId}`)
    }
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
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const getCategoryInfo = (type) => {
    return categories.find(c => c.value === type) || categories[0]
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
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h1 className="text-3xl font-bold text-gray-900">Notifikasi</h1>
                  <p className="text-gray-600 mt-1">
                    {unreadCount > 0 ? `${unreadCount} notifikasi belum dibaca` : 'Semua notifikasi sudah dibaca'}
                  </p>
                </div>
                {unreadCount > 0 && (
                  <Button
                    onClick={handleMarkAllAsRead}
                    disabled={markingAsRead}
                    className="flex items-center gap-2"
                  >
                    <CheckCheck size={18} />
                    {markingAsRead ? 'Memproses...' : 'Tandai Semua Sudah Dibaca'}
                  </Button>
                )}
              </div>

              {/* Search Bar */}
              <div className="relative mb-4">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                <input
                  type="text"
                  placeholder="Cari notifikasi..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    <X size={18} />
                  </button>
                )}
              </div>

              {/* Filters */}
              <div className="flex flex-col gap-4 mb-4">
                {/* Category Filter */}
                <div className="flex items-center gap-2">
                  <Filter size={18} className="text-gray-600" />
                  <span className="text-sm font-medium text-gray-700">Kategori:</span>
                  <div className="flex gap-2 flex-wrap">
                    {categories.map(category => {
                      const Icon = category.icon
                      const isActive = selectedCategory === category.value
                      const colorClasses = {
                        red: isActive ? 'bg-red-100 text-red-700' : 'bg-gray-100 text-gray-600 hover:bg-gray-200',
                        blue: isActive ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-600 hover:bg-gray-200',
                        green: isActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600 hover:bg-gray-200',
                        purple: isActive ? 'bg-purple-100 text-purple-700' : 'bg-gray-100 text-gray-600 hover:bg-gray-200',
                        orange: isActive ? 'bg-orange-100 text-orange-700' : 'bg-gray-100 text-gray-600 hover:bg-gray-200',
                        gray: isActive ? 'bg-gray-200 text-gray-800' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                      }
                      return (
                        <button
                          key={category.value}
                          onClick={() => {
                            setSelectedCategory(category.value)
                            setPage(1)
                          }}
                          className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm transition-colors font-medium ${
                            colorClasses[category.color] || colorClasses.gray
                          }`}
                        >
                          <Icon size={16} />
                          {category.label}
                        </button>
                      )
                    })}
                  </div>
                </div>

                {/* Status Filter */}
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-gray-700">Status:</span>
                  <div className="flex gap-2">
                    {statusOptions.map(status => {
                      const isActive = selectedStatus === status.value
                      return (
                        <button
                          key={status.value}
                          onClick={() => {
                            setSelectedStatus(status.value)
                            setPage(1)
                          }}
                          className={`px-3 py-1.5 rounded-lg text-sm transition-colors ${
                            isActive
                              ? 'bg-blue-100 text-blue-700 font-medium'
                              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                          }`}
                        >
                          {status.label}
                        </button>
                      )
                    })}
                  </div>
                </div>
              </div>
            </div>

            {/* Notifications List */}
            <Card className="p-0 overflow-hidden">
              {filteredNotifications.length === 0 ? (
                <div className="p-12 text-center">
                  <Bell size={48} className="mx-auto mb-4 text-gray-300" />
                  <p className="text-gray-500 text-lg">
                    {searchQuery || selectedCategory !== 'ALL' || selectedStatus !== 'ALL'
                      ? 'Tidak ada notifikasi yang sesuai dengan filter'
                      : 'Tidak ada notifikasi'}
                  </p>
                  {(searchQuery || selectedCategory !== 'ALL' || selectedStatus !== 'ALL') && (
                    <Button
                      onClick={() => {
                        setSearchQuery('')
                        setSelectedCategory('ALL')
                        setSelectedStatus('ALL')
                      }}
                      variant="outline"
                      className="mt-4"
                    >
                      Reset Filter
                    </Button>
                  )}
                </div>
              ) : (
                <>
                  <div className="divide-y divide-gray-200">
                    {filteredNotifications.map((notification) => {
                      const categoryInfo = getCategoryInfo(notification.type)
                      const Icon = categoryInfo.icon
                      
                      return (
                        <div
                          key={notification.id}
                          className={`p-4 hover:bg-gray-50 transition-colors ${
                            !notification.read ? 'bg-blue-50' : ''
                          }`}
                        >
                          <div className="flex items-start gap-4">
                            {/* Icon */}
                            <div className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center ${
                              notification.type === 'LIKE' ? 'bg-red-100 text-red-600' :
                              notification.type === 'COMMENT' ? 'bg-blue-100 text-blue-600' :
                              notification.type === 'REPLY' ? 'bg-green-100 text-green-600' :
                              notification.type === 'ANNOUNCEMENT' ? 'bg-purple-100 text-purple-600' :
                              notification.type === 'EVENT' ? 'bg-orange-100 text-orange-600' :
                              'bg-gray-100 text-gray-600'
                            }`}>
                              <Icon size={20} />
                            </div>

                            {/* Content */}
                            <div 
                              className="flex-1 min-w-0 cursor-pointer"
                              onClick={() => handleNotificationClick(notification)}
                            >
                              <p className={`text-sm ${!notification.read ? 'font-semibold text-gray-900' : 'text-gray-700'}`}>
                                {notification.message}
                              </p>
                              <p className="text-xs text-gray-500 mt-1">
                                {formatTime(notification.createdAt)}
                              </p>
                            </div>

                            {/* Actions */}
                            <div className="flex items-center gap-2 flex-shrink-0">
                              {!notification.read && (
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    handleMarkAsRead(notification.id)
                                  }}
                                  className="p-2 rounded-lg hover:bg-gray-200 transition-colors"
                                  title="Tandai sudah dibaca"
                                >
                                  <Check size={18} className="text-gray-600" />
                                </button>
                              )}
                              <button
                                onClick={(e) => {
                                  e.stopPropagation()
                                  handleDelete(notification.id)
                                }}
                                className="p-2 rounded-lg hover:bg-red-50 transition-colors"
                                title="Hapus notifikasi"
                              >
                                <Trash2 size={18} className="text-gray-600 hover:text-red-600" />
                              </button>
                            </div>
                          </div>
                        </div>
                      )
                    })}
                  </div>

                  {/* Pagination */}
                  {totalPages > 1 && (
                    <div className="p-4 border-t border-gray-200 flex items-center justify-between">
                      <p className="text-sm text-gray-600">
                        Menampilkan {((page - 1) * 20) + 1} - {Math.min(page * 20, total)} dari {total} notifikasi
                      </p>
                      <div className="flex gap-2">
                        <Button
                          onClick={() => setPage(prev => Math.max(1, prev - 1))}
                          disabled={page === 1}
                          variant="outline"
                          size="sm"
                        >
                          Sebelumnya
                        </Button>
                        <span className="px-4 py-2 text-sm text-gray-700">
                          Halaman {page} dari {totalPages}
                        </span>
                        <Button
                          onClick={() => setPage(prev => Math.min(totalPages, prev + 1))}
                          disabled={page === totalPages}
                          variant="outline"
                          size="sm"
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
    </div>
  )
}

export default Notifications

