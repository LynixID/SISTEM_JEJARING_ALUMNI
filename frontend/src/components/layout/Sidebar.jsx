import { useState, useEffect } from 'react'
import { Home, Users, MessageCircle, Newspaper, UserPlus, Edit, ChevronDown, ChevronRight, FileText, CalendarCheck, MessageSquareText, BriefcaseBusiness, Clock, Bell } from 'lucide-react'
import { Link, useLocation } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { getJobs, getPendingJobs, getConnectionRequests, getUnreadNewsCount, getUnreadCount } from '../../services/api'
import { getSocket } from '../../config/socket'

const Sidebar = () => {
  const location = useLocation()
  const { user, isAuthenticated } = useAuth()
  const [kelolaInformasiOpen, setKelolaInformasiOpen] = useState(true)
  const [unreadCount, setUnreadCount] = useState(0)
  const [pendingConnectionsCount, setPendingConnectionsCount] = useState(0)
  const [unreadNewsCount, setUnreadNewsCount] = useState(0)
  const [newApprovedJobsCount, setNewApprovedJobsCount] = useState(0) // alumni & pengurus: approved since last seen
  const [pendingJobsCount, setPendingJobsCount] = useState(0) // pengurus pending approvals

  // Fetch unread notifications count
  useEffect(() => {
    if (!isAuthenticated || user?.role === 'ADMIN') return

    const fetchUnreadCount = async () => {
      try {
        const response = await getUnreadCount()
        setUnreadCount(response.data.unreadCount || 0)
      } catch (error) {
        console.error('Error fetching unread count:', error)
      }
    }

    fetchUnreadCount()

    const socket = getSocket()
    const handleNewNotification = () => {
      fetchUnreadCount()
    }

    socket.on('new_notification', handleNewNotification)

    const interval = setInterval(fetchUnreadCount, 30000)

    return () => {
      socket.off('new_notification', handleNewNotification)
      clearInterval(interval)
    }
  }, [isAuthenticated, user])

  // Fetch pending connections count
  useEffect(() => {
    if (!isAuthenticated || user?.role === 'ADMIN') return

    const fetchPendingConnections = async () => {
      try {
        const response = await getConnectionRequests('PENDING')
        setPendingConnectionsCount(response.data?.requests?.length || 0)
      } catch (error) {
        console.error('Error fetching pending connections:', error)
      }
    }

    fetchPendingConnections()

    // Setup Socket.io listener untuk real-time updates
    const socket = getSocket()
    const handleConnectionNotification = (notification) => {
      if (notification.type === 'CONNECTION_REQUEST' || notification.type === 'CONNECTION_ACCEPTED') {
        fetchPendingConnections()
      }
    }

    socket.on('new_notification', handleConnectionNotification)

    // Polling setiap 30 detik untuk update
    const interval = setInterval(fetchPendingConnections, 30000)

    return () => {
      socket.off('new_notification', handleConnectionNotification)
      clearInterval(interval)
    }
  }, [isAuthenticated, user])

  // Fetch unread news count (announcement + event)
  useEffect(() => {
    if (!isAuthenticated || user?.role === 'ADMIN') return

    const fetchUnreadNewsCount = async () => {
      try {
        const response = await getUnreadNewsCount()
        setUnreadNewsCount(response.data.unreadCount || 0)
      } catch (error) {
        console.error('Error fetching unread news count:', error)
      }
    }

    fetchUnreadNewsCount()

    // Polling setiap 30 detik untuk update
    const interval = setInterval(fetchUnreadNewsCount, 30000)

    return () => {
      clearInterval(interval)
    }
  }, [isAuthenticated, user])

  // Jobs badge:
  // - Alumni & Pengurus: badge angka pada menu Lowongan jika ada lowongan APPROVED baru sejak terakhir buka /lowongan
  // - Pengurus: badge angka pada submenu Daftar Lowongan jika ada job PENDING yang perlu persetujuan
  useEffect(() => {
    if (!isAuthenticated || user?.role === 'ADMIN') return

    const fetchJobsBadge = async () => {
      try {
        const lastSeen = localStorage.getItem('jobsLastSeenAt')
        const lastSeenMs = lastSeen ? Date.parse(lastSeen) : 0
        const [approvedRes, pendingRes] = await Promise.all([
          getJobs({ page: 1, limit: 50 }),
          user?.role === 'PENGURUS' ? getPendingJobs() : Promise.resolve(null)
        ])

        const approvedJobs = approvedRes.data?.jobs || []
        const newerCount = approvedJobs.reduce((acc, j) => {
          const createdMs = j?.createdAt ? Date.parse(j.createdAt) : 0
          return createdMs > lastSeenMs ? acc + 1 : acc
        }, 0)
        setNewApprovedJobsCount(newerCount)

        if (user?.role === 'PENGURUS') {
          const count = pendingRes?.data?.jobs?.length || 0
          setPendingJobsCount(count)
        } else {
          setPendingJobsCount(0)
        }
      } catch (e) {
        // silent fail
      }
    }

    fetchJobsBadge()

    const interval = setInterval(fetchJobsBadge, 30000)
    return () => clearInterval(interval)
  }, [isAuthenticated, user])

  const menuItems = [
    { icon: Home, label: 'Beranda', path: '/dashboard', disabled: false },
    { icon: Newspaper, label: 'Berita', path: '/berita', disabled: false },
    { icon: Bell, label: 'Notifikasi', path: '/notifikasi', disabled: false },
    { icon: MessageCircle, label: 'Pesan', path: '/pesan', disabled: false },
    { icon: UserPlus, label: 'Koneksi', path: '/koneksi', disabled: false },
    { icon: Users, label: 'Direktori', path: '/direktori', disabled: false },
    { icon: MessageSquareText, label: 'Forum Diskusi', path: '/diskusi', disabled: false },
    { icon: BriefcaseBusiness, label: 'Lowongan', path: '/lowongan', disabled: false }
  ]

  // Sub menu Kelola Berita untuk PENGURUS
  const kelolaBeritaSubmenu = [
    { icon: FileText, label: 'Pengumuman', path: '/pengurus/berita' },
    { icon: CalendarCheck, label: 'Event', path: '/pengurus/events' }
  ]

  return (
    <aside className="hidden lg:block w-64 bg-white border-r border-gray-200 h-[calc(100vh-4rem)] sticky top-16 overflow-y-auto">
      <nav className="p-4">
        <ul className="space-y-2">
          {menuItems.map((item) => {
            const Icon = item.icon
            const isActive = !item.disabled && (
              location.pathname === item.path || 
              (item.path === '/diskusi' && location.pathname.startsWith('/diskusi')) ||
              (item.path === '/lowongan' && location.pathname.startsWith('/lowongan')) ||
              (item.path === '/pesan' && (location.pathname === '/pesan' || location.pathname.startsWith('/pesan/'))) ||
              (item.path === '/berita' && location.pathname.startsWith('/berita')) ||
              (item.path === '/notifikasi' && location.pathname.startsWith('/notifikasi')) ||
              (item.path === '/koneksi' && location.pathname.startsWith('/koneksi'))
            )
            const isDisabled = item.disabled
            
            if (isDisabled) {
              return (
                <li key={item.path}>
                  <div
                    className="flex items-center gap-3 px-4 py-3 rounded-lg text-gray-400 cursor-not-allowed opacity-60"
                    title="Fitur sedang dalam pengembangan"
                  >
                    <Icon size={20} />
                    <span>{item.label}</span>
                  </div>
                </li>
              )
            }
            
            // Tambahkan badge untuk Koneksi jika ada pending requests
            const showConnectionBadge = item.path === '/koneksi' && pendingConnectionsCount > 0 && user?.role !== 'ADMIN'
            // Tambahkan badge untuk Notifikasi jika ada unread
            const showNotificationBadge = item.path === '/notifikasi' && unreadCount > 0 && user?.role !== 'ADMIN'
            // Tambahkan badge untuk Berita jika ada unread announcement/event
            const showNewsBadge = item.path === '/berita' && unreadNewsCount > 0 && user?.role !== 'ADMIN'
            // Badge untuk Lowongan (angka) untuk alumni & pengurus
            const showLowonganBadge = item.path === '/lowongan' && newApprovedJobsCount > 0 && user?.role !== 'ADMIN'

            return (
              <li key={item.path}>
                <Link
                  to={item.path}
                  className={`flex items-center justify-between px-4 py-3 rounded-lg transition-colors ${
                    isActive
                      ? 'bg-blue-50 text-blue-600 font-medium'
                      : 'text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Icon size={20} />
                    <span>{item.label}</span>
                  </div>
                  {showLowonganBadge && (
                    <span className="bg-red-500 text-white text-xs font-semibold rounded-full w-5 h-5 flex items-center justify-center">
                      {newApprovedJobsCount > 9 ? '9+' : newApprovedJobsCount}
                    </span>
                  )}
                  {showNotificationBadge && (
                    <span className="bg-red-500 text-white text-xs font-semibold rounded-full w-5 h-5 flex items-center justify-center">
                      {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                  )}
                  {showConnectionBadge && (
                    <span className="bg-red-500 text-white text-xs font-semibold rounded-full w-5 h-5 flex items-center justify-center">
                      {pendingConnectionsCount > 9 ? '9+' : pendingConnectionsCount}
                    </span>
                  )}
                  {showNewsBadge && (
                    <span className="bg-red-500 text-white text-xs font-semibold rounded-full w-5 h-5 flex items-center justify-center">
                      {unreadNewsCount > 9 ? '9+' : unreadNewsCount}
                    </span>
                  )}
                </Link>
              </li>
            )
          })}
          
          {/* Kelola Berita dengan Submenu untuk PENGURUS */}
          {user?.role === 'PENGURUS' && (
            <li>
              <button
                onClick={() => setKelolaInformasiOpen(!kelolaInformasiOpen)}
                className={`w-full flex items-center justify-between px-4 py-3 rounded-lg transition-colors ${
                  location.pathname === '/pengurus/berita' || location.pathname === '/pengurus/events' || location.pathname === '/pengurus/lowongan' ||
                  location.pathname.startsWith('/pengurus/berita/') || location.pathname.startsWith('/pengurus/events/') || location.pathname.startsWith('/pengurus/lowongan')
                    ? 'bg-blue-50 text-blue-600 font-medium'
                    : 'text-gray-700 hover:bg-gray-100'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Edit size={20} />
                  <span>Kelola Informasi</span>
                </div>
                <div className="flex items-center gap-2">
                  {pendingJobsCount > 0 && (
                    <span className="bg-red-500 text-white text-xs font-semibold rounded-full w-5 h-5 flex items-center justify-center">
                      {pendingJobsCount > 9 ? '9+' : pendingJobsCount}
                    </span>
                  )}
                  {kelolaInformasiOpen ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                </div>
              </button>
              {kelolaInformasiOpen && (
                <ul className="mt-2 ml-4 space-y-1 border-l-2 border-gray-200 pl-2">
                  {[
                    ...kelolaBeritaSubmenu,
                    { icon: Clock, label: 'Daftar Lowongan', path: '/pengurus/lowongan' }
                  ].map((subItem) => {
                    const SubIcon = subItem.icon
                    const isSubActive = location.pathname === subItem.path || 
                                      (subItem.path === '/pengurus/berita' && location.pathname.startsWith('/pengurus/berita/')) ||
                                      (subItem.path === '/pengurus/events' && location.pathname.startsWith('/pengurus/events/')) ||
                                      (subItem.path === '/pengurus/lowongan' && location.pathname.startsWith('/pengurus/lowongan'))
                    return (
                      <li key={subItem.path}>
                        <Link
                          to={subItem.path}
                          className={`flex items-center gap-3 px-4 py-2 rounded-lg transition-colors ${
                            isSubActive
                              ? 'bg-blue-50 text-blue-600 font-medium'
                              : 'text-gray-600 hover:bg-gray-100'
                          }`}
                        >
                          <SubIcon size={18} />
                          <span>{subItem.label}</span>
                          {subItem.path === '/pengurus/lowongan' && pendingJobsCount > 0 && (
                            <span className="ml-auto bg-red-500 text-white text-xs font-semibold rounded-full w-5 h-5 flex items-center justify-center">
                              {pendingJobsCount > 9 ? '9+' : pendingJobsCount}
                            </span>
                          )}
                        </Link>
                      </li>
                    )
                  })}
                </ul>
              )}
            </li>
          )}
        </ul>
      </nav>
    </aside>
  )
}

export default Sidebar


