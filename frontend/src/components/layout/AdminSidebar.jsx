import { useState } from 'react'
import {
  LayoutDashboard, Users, LogOut, User, Menu, X, Settings,
  Newspaper, Calendar, ChevronDown, ChevronRight, FileText,
  CalendarCheck, ShieldAlert, MessageSquare, FolderOpen, Briefcase, Monitor
} from 'lucide-react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import ConfirmModal from '../common/ConfirmModal'

const AdminSidebar = () => {
  const [isCollapsed, setIsCollapsed] = useState(false)
  const [isLogoutConfirmOpen, setIsLogoutConfirmOpen] = useState(false)
  const [isDropdownOpen, setIsDropdownOpen] = useState(false)
  const location = useLocation()
  const { user, logout, isLoading } = useAuth()
  const navigate = useNavigate()

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
    <aside className={`${isCollapsed ? 'w-20' : 'w-64'} bg-gray-900 text-white h-screen sticky top-0 flex flex-col transition-all duration-300 z-50`}>
      {/* Toggle Button & Profile Header */}
      <div className="border-b border-gray-800 flex flex-col">
        <div className="p-4 flex items-center justify-between overflow-hidden">
          {!isCollapsed ? (
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
          ) : (
            <button
              onClick={() => {
                setIsCollapsed(false)
                setIsDropdownOpen(true)
              }}
              className="w-9 h-9 bg-blue-600 rounded-full flex items-center justify-center text-white font-semibold flex-shrink-0 shadow-md hover:scale-105 transition-transform"
              title="Buka Profil"
            >
              {user?.nama?.charAt(0) || 'A'}
            </button>
          )}
          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
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
                      <Icon size={20} className={isActive ? 'text-white' : 'group-hover:text-blue-400 transition-colors'} />
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
    </aside>
  )
}

export default AdminSidebar
