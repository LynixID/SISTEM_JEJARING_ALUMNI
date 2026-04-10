import { useState } from 'react'
import { 
  LayoutDashboard, Users, LogOut, User, Menu, X, Settings, 
  Newspaper, Calendar, ChevronDown, ChevronRight, FileText, 
  CalendarCheck, ShieldAlert, MessageSquare, FolderOpen 
} from 'lucide-react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import NotificationBell from '../admin/NotificationBell'

const AdminSidebar = () => {
  const [isCollapsed, setIsCollapsed] = useState(false)
  const [kelolaBeritaOpen, setKelolaBeritaOpen] = useState(true)
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
        { icon: CalendarCheck, label: 'Event', path: '/admin/events' }
      ]
    },
    {
      title: 'SISTEM',
      items: [
        { icon: FolderOpen, label: 'Manajemen File', path: '/admin/files' },
        { icon: Settings, label: 'Pengaturan', path: '/admin/settings' }
      ]
    }
  ]

  return (
    <aside className={`${isCollapsed ? 'w-20' : 'w-64'} bg-gray-900 text-white h-screen sticky top-0 flex flex-col transition-all duration-300 z-50`}>
      {/* Toggle Button */}
      <div className="p-4 border-b border-gray-800 flex items-center justify-between overflow-hidden">
        {!isCollapsed && <span className="font-bold text-blue-400">ADMIN PANEL</span>}
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="p-2 rounded-lg bg-gray-800 hover:bg-gray-700 transition-colors"
          title={isCollapsed ? 'Expand Sidebar' : 'Collapse Sidebar'}
        >
          {isCollapsed ? <Menu size={20} /> : <X size={20} />}
        </button>
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

      {/* Bottom Section - Profile, Notifikasi, Logout */}
      <div className="border-t border-gray-800 p-4 space-y-2">
        {/* Profile */}
        <div className={`flex items-center ${isCollapsed ? 'justify-center' : 'gap-3'} p-2 rounded-lg bg-gray-800`}>
          <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center text-white font-semibold flex-shrink-0">
            {user?.nama?.charAt(0) || 'A'}
          </div>
          {!isCollapsed && (
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-white truncate">{user?.nama || 'Administrator'}</p>
              <p className="text-xs text-gray-400 truncate">Root Administrator</p>
            </div>
          )}
        </div>

        {/* Notifikasi */}
        <NotificationBell isCollapsed={isCollapsed} />

        {/* Profil Button */}
        <button 
          className={`w-full flex items-center ${isCollapsed ? 'justify-center' : 'gap-2'} px-3 py-2 rounded-lg bg-gray-800 hover:bg-gray-700 transition-colors`}
          title={isCollapsed ? 'Profil' : ''}
        >
          <User size={18} />
          {!isCollapsed && <span className="text-sm">Profil</span>}
        </button>

        {/* Logout */}
        <button
          onClick={handleLogout}
          className={`w-full flex items-center ${isCollapsed ? 'justify-center' : 'gap-3'} px-4 py-2 rounded-lg text-red-400 hover:bg-red-900 hover:bg-opacity-20 hover:text-red-300 transition-colors`}
          title={isCollapsed ? 'Logout' : ''}
        >
          <LogOut size={20} />
          {!isCollapsed && <span>Logout</span>}
        </button>
      </div>
    </aside>
  )
}

export default AdminSidebar

