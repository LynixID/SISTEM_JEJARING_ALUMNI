import { useState, useEffect } from 'react'
import { Home, Users, MessageCircle, Bell, User, Newspaper, UserPlus, Edit, ChevronDown, ChevronRight, FileText, CalendarCheck } from 'lucide-react'
import { Link, useLocation } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { getUnreadCount, getConnectionRequests } from '../../services/api'
import { getSocket } from '../../config/socket'

const Sidebar = () => {
  const location = useLocation()
  const { user, isAuthenticated } = useAuth()
  const [kelolaBeritaOpen, setKelolaBeritaOpen] = useState(true)
  const [unreadCount, setUnreadCount] = useState(0)
  const [pendingConnectionsCount, setPendingConnectionsCount] = useState(0)

  // Fetch unread count
  useEffect(() => {
    if (!isAuthenticated || user?.role === 'ADMIN') return

    const fetchUnreadCount = async () => {
      try {
        const response = await getUnreadCount()
        setUnreadCount(response.data.unreadCount)
      } catch (error) {
        console.error('Error fetching unread count:', error)
      }
    }

    fetchUnreadCount()

    // Setup Socket.io listener untuk real-time updates
    const socket = getSocket()
    const handleNewNotification = () => {
      // Refresh unread count saat ada notifikasi baru
      fetchUnreadCount()
    }

    socket.on('new_notification', handleNewNotification)

    // Polling setiap 30 detik untuk update
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

  const getProfilePath = () => {
    return user?.id ? `/profil/${user.id}` : '/profil'
  }

  const menuItems = [
    { icon: Home, label: 'Beranda', path: '/dashboard', disabled: false },
    { icon: Users, label: 'Direktori', path: '/direktori', disabled: false },
    { icon: Newspaper, label: 'Berita', path: '/berita', disabled: false },
    { icon: UserPlus, label: 'Koneksi', path: '/koneksi', disabled: false },
    { icon: MessageCircle, label: 'Pesan', path: '/pesan', disabled: true },
    { icon: Bell, label: 'Notifikasi', path: '/notifikasi', disabled: false },
    { icon: User, label: 'Profil', path: getProfilePath(), disabled: false }
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
              (item.path === '/berita' && location.pathname.startsWith('/berita')) ||
              (item.path === '/notifikasi' && location.pathname.startsWith('/notifikasi')) ||
              (item.path === '/koneksi' && location.pathname.startsWith('/koneksi')) ||
              (item.path.startsWith('/profil') && location.pathname.startsWith('/profil'))
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
            
            // Tambahkan badge untuk Notifikasi jika ada unread
            const showNotificationBadge = item.path === '/notifikasi' && unreadCount > 0 && user?.role !== 'ADMIN'
            // Tambahkan badge untuk Koneksi jika ada pending requests
            const showConnectionBadge = item.path === '/koneksi' && pendingConnectionsCount > 0 && user?.role !== 'ADMIN'

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
                </Link>
              </li>
            )
          })}
          
          {/* Kelola Berita dengan Submenu untuk PENGURUS */}
          {user?.role === 'PENGURUS' && (
            <li>
              <button
                onClick={() => setKelolaBeritaOpen(!kelolaBeritaOpen)}
                className={`w-full flex items-center justify-between px-4 py-3 rounded-lg transition-colors ${
                  location.pathname === '/pengurus/berita' || location.pathname === '/pengurus/events' ||
                  location.pathname.startsWith('/pengurus/berita/') || location.pathname.startsWith('/pengurus/events/')
                    ? 'bg-blue-50 text-blue-600 font-medium'
                    : 'text-gray-700 hover:bg-gray-100'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Edit size={20} />
                  <span>Kelola Berita</span>
                </div>
                {kelolaBeritaOpen ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
              </button>
              {kelolaBeritaOpen && (
                <ul className="mt-2 ml-4 space-y-1 border-l-2 border-gray-200 pl-2">
                  {kelolaBeritaSubmenu.map((subItem) => {
                    const SubIcon = subItem.icon
                    const isSubActive = location.pathname === subItem.path || 
                                      (subItem.path === '/pengurus/berita' && location.pathname.startsWith('/pengurus/berita/')) ||
                                      (subItem.path === '/pengurus/events' && location.pathname.startsWith('/pengurus/events/'))
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


