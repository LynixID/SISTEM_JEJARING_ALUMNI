import { useState, useEffect } from 'react'
import {
  LayoutDashboard, Users, LogOut, User, Menu, X, Settings,
  Newspaper, Calendar, ChevronDown, ChevronRight, FileText,
  CalendarCheck, ShieldAlert, MessageSquare, FolderOpen, Briefcase, Monitor, ShieldCheck
} from 'lucide-react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import ConfirmModal from '../common/ConfirmModal'
import api from '../../services/api'

const AdminSidebar = () => {
  const [isCollapsed, setIsCollapsed] = useState(() => {
    if (typeof window !== 'undefined') {
      if (window.innerWidth < 768) {
        return true // Always start collapsed on mobile viewports
      }
      const persisted = localStorage.getItem('admin-sidebar-collapsed')
      if (persisted !== null) {
        return persisted === 'true'
      }
    }
    return false
  })
  const [isLogoutConfirmOpen, setIsLogoutConfirmOpen] = useState(false)
  const [isDropdownOpen, setIsDropdownOpen] = useState(false)
  const location = useLocation()
  const { user, logout, isLoading } = useAuth()
  const navigate = useNavigate()
  const [pendingCount, setPendingCount] = useState(0)

  useEffect(() => {
    let isMounted = true

    const fetchPendingCount = async () => {
      try {
        const response = await api.get('/admin/statistics')
        if (isMounted && response.data?.statistics) {
          setPendingCount(response.data.statistics.pendingUsers || 0)
        }
      } catch (error) {
        console.error('Error fetching pending users count:', error)
      }
    }

    if (user && user.role === 'ADMIN') {
      fetchPendingCount()
    }

    // Poll statistics every 30 seconds
    const interval = setInterval(() => {
      if (user && user.role === 'ADMIN') {
        fetchPendingCount()
      }
    }, 30000)

    // Listen for custom verification events
    const handleVerificationChange = () => {
      fetchPendingCount()
    }
    window.addEventListener('user-verification-changed', handleVerificationChange)

    return () => {
      isMounted = false
      clearInterval(interval)
      window.removeEventListener('user-verification-changed', handleVerificationChange)
    }
  }, [user, location.pathname])

  const toggleCollapse = () => {
    setIsCollapsed(prev => {
      const nextValue = !prev
      if (window.innerWidth >= 768) {
        localStorage.setItem('admin-sidebar-collapsed', String(nextValue))
      }
      return nextValue
    })
  }

  // Auto-collapse sidebar on route changes for mobile viewports
  useEffect(() => {
    if (window.innerWidth < 768) {
      setIsCollapsed(true)
    }
  }, [location.pathname])

  // Prevent rendering if user is not loaded
  if (isLoading || !user) {
    return null
  }

  const handleLogout = () => {
    logout()
    navigate('/login', { replace: true })
  }

  const navigationGroups = [
    {
      title: 'UTAMA',
      items: [
        { icon: LayoutDashboard, label: 'Dashboard', path: '/admin' }
      ]
    },
    {
      title: 'DATA PENGGUNA',
      items: [
        { icon: Users, label: 'Manajemen User', path: '/admin/users' },
        { icon: ShieldCheck, label: 'Manajemen Admin', path: '/admin/admins' },
        { icon: ShieldAlert, label: 'Laporan Konten', path: '/admin/laporan' },
        { icon: MessageSquare, label: 'Manajemen Komentar', path: '/admin/komentar' }
      ]
    },
    {
      title: 'KONTEN & BERITA',
      items: [
        { icon: FileText, label: 'Pengumuman', path: '/admin/announcements' },
        { icon: CalendarCheck, label: 'Event', path: '/admin/events' },
        { icon: Newspaper, label: 'Manajemen Postingan', path: '/admin/posts' },
        { icon: MessageSquare, label: 'Manajemen Forum', path: '/admin/forum' },
        { icon: Briefcase, label: 'Manajemen Loker', path: '/admin/loker' }
      ]
    },
    {
      title: 'SISTEM',
      items: [
        { icon: Monitor, label: 'Display Home Page', path: '/admin/display-home-page' },
        { icon: FolderOpen, label: 'Manajemen File', path: '/admin/files' },
        { icon: Settings, label: 'Pengaturan', path: '/admin/settings' }
      ]
    }
  ]

  return (
    <>
      <style>{`
        @media (max-width: 767px) {
          /* Force page wrapper container to flex-col to occupy 100% viewport width on mobile */
          div.flex:has(> aside) {
            flex-direction: column !important;
          }
          
          /* Add top spacing to the page content container on mobile screens */
          aside + div {
            padding-top: 4.5rem !important;
          }
        }
      `}</style>

      {/* Floating Toggle Button for Mobile Screens */}
      {isCollapsed && (
        <button
          onClick={toggleCollapse}
          className="fixed top-4 left-4 z-40 p-2.5 rounded-lg bg-gray-900 text-white shadow-lg md:hidden border border-gray-800 hover:bg-gray-800 active:scale-95 transition-all"
        >
          <Menu size={20} />
        </button>
      )}

      {/* Backdrop overlay for mobile screens when expanded */}
      {!isCollapsed && (
        <div
          className="fixed inset-0 bg-black/60 z-40 md:hidden backdrop-blur-sm transition-opacity duration-300"
          onClick={toggleCollapse}
        />
      )}

      <aside className={`
        bg-gray-900 text-white h-screen flex flex-col transition-all duration-300 z-50
        fixed md:sticky top-0 left-0
        ${isCollapsed ? 'w-20 -translate-x-full md:translate-x-0' : 'w-64 translate-x-0'}
      `}>
        {/* Toggle Button & Profile Header */}
        <div className="border-b border-gray-800 flex flex-col">
          <div className={`p-4 flex items-center ${isCollapsed ? 'justify-center' : 'justify-between'} overflow-hidden`}>
            {!isCollapsed && (
              <button
                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                className="flex items-center gap-3 hover:bg-gray-800 p-1.5 rounded-lg transition-all duration-200 text-left flex-1 min-w-0 mr-2 group"
              >
                <div className="w-9 h-9 bg-blue-600 rounded-full flex items-center justify-center text-white font-semibold flex-shrink-0 shadow-md group-hover:scale-105 transition-transform">
                  {user?.nama?.charAt(0) || 'A'}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-white truncate leading-tight">{user?.nama || 'Administrator'}</p>
                  <p className="text-[11px] text-gray-400 truncate flex items-center gap-1">
                    <span>Root Admin</span>
                    <ChevronDown size={12} className={`transition-transform duration-200 ${isDropdownOpen ? 'rotate-180' : ''}`} />
                  </p>
                </div>
              </button>
            )}
            <button
              onClick={toggleCollapse}
              className="p-2 rounded-lg bg-gray-800 hover:bg-gray-700 transition-colors flex-shrink-0"
              title={isCollapsed ? 'Expand Sidebar' : 'Collapse Sidebar'}
            >
              {isCollapsed ? <Menu size={18} /> : <X size={18} />}
            </button>
          </div>

        {/* Dropdown Menu */}
        {!isCollapsed && isDropdownOpen && (
          <div className="px-4 pb-3">
            <div className="bg-gray-850 border border-gray-700/50 rounded-lg p-1.5 shadow-xl space-y-1">
              <button
                onClick={() => {
                  navigate('/admin/settings')
                  setIsDropdownOpen(false)
                }}
                className="w-full flex items-center gap-2.5 px-3 py-2 rounded-md hover:bg-gray-700 transition-colors text-left text-sm text-gray-300 hover:text-white"
              >
                <User size={16} />
                <span>Pengaturan Profil</span>
              </button>
              <button
                onClick={() => {
                  setIsLogoutConfirmOpen(true)
                  setIsDropdownOpen(false)
                }}
                className="w-full flex items-center gap-2.5 px-3 py-2 rounded-md text-red-400 hover:bg-red-950/30 hover:text-red-300 transition-colors text-left text-sm font-medium"
              >
                <LogOut size={16} />
                <span>Logout</span>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Navigation Menu */}
      <nav className="flex-1 overflow-y-auto p-4 custom-scrollbar">
        {navigationGroups.map((group, groupIdx) => (
          <div key={group.title} className={groupIdx > 0 ? 'mt-6' : ''}>
            {!isCollapsed && (
              <h3 className="text-[10px] font-bold text-gray-500 uppercase tracking-widest px-4 mb-2">
                {group.title}
              </h3>
            )}
            <ul className="space-y-1">
              {group.items.map((item) => {
                const Icon = item.icon
                const isActive = location.pathname === item.path || 
                               (item.path === '/admin/users' && location.pathname.startsWith('/admin/users'))
                
                return (
                  <li key={item.path}>
                    <Link
                      to={item.path}
                      className={`flex items-center ${isCollapsed ? 'justify-center' : 'gap-3'} px-4 py-3 rounded-lg transition-all duration-200 group relative ${
                        isActive
                          ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/50'
                          : 'text-gray-400 hover:bg-gray-800 hover:text-white'
                      }`}
                      title={isCollapsed ? item.label : ''}
                    >
                      <div className="relative">
                        <Icon size={20} className={isActive ? 'text-white' : 'group-hover:text-blue-400 transition-colors'} />
                        {item.path === '/admin/users' && pendingCount > 0 && (
                          <span className="absolute -top-1.5 -right-1.5 flex h-2.5 w-2.5 z-10">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-red-500 border border-gray-900"></span>
                          </span>
                        )}
                      </div>
                      {!isCollapsed && <span className="text-sm font-medium">{item.label}</span>}
                      {isActive && !isCollapsed && (
                        <div className="absolute right-2 w-1.5 h-1.5 rounded-full bg-white shadow-glow" />
                      )}
                    </Link>
                  </li>
                )
              })}
            </ul>
          </div>
        ))}
      </nav>



    </aside>

    <ConfirmModal
      isOpen={isLogoutConfirmOpen}
      onClose={() => setIsLogoutConfirmOpen(false)}
      onConfirm={handleLogout}
      title="Konfirmasi Logout"
      message="Apakah Anda yakin ingin keluar dari panel admin?"
      confirmText="Logout"
      cancelText="Batal"
      variant="danger"
    />
  </>
  )
}

export default AdminSidebar
