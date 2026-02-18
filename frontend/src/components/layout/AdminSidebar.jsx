import { useState } from 'react'
import { LayoutDashboard, Users, LogOut, User, Menu, X, Settings, Newspaper, Calendar, ChevronDown, ChevronRight, FileText, CalendarCheck } from 'lucide-react'
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

  const menuItems = [
    { icon: LayoutDashboard, label: 'Dashboard', path: '/admin' },
    { icon: Users, label: 'Manajemen User', path: '/admin/users' },
    { icon: Settings, label: 'Pengaturan', path: '/admin/settings' }
  ]

  const kelolaBeritaSubmenu = [
    { icon: FileText, label: 'Pengumuman', path: '/admin/announcements' },
    { icon: CalendarCheck, label: 'Event', path: '/admin/events' }
  ]

  return (
    <aside className={`${isCollapsed ? 'w-20' : 'w-64'} bg-gray-900 text-white h-screen sticky top-0 flex flex-col transition-all duration-300`}>
      {/* Toggle Button */}
      <div className="p-4 border-b border-gray-800">
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="w-full flex items-center justify-center p-2 rounded-lg bg-gray-800 hover:bg-gray-700 transition-colors"
          title={isCollapsed ? 'Expand Sidebar' : 'Collapse Sidebar'}
        >
          {isCollapsed ? <Menu size={20} /> : <X size={20} />}
        </button>
      </div>

      {/* Navigation Menu */}
      <nav className="flex-1 overflow-y-auto p-4">
        <ul className="space-y-2">
          {menuItems.slice(0, 2).map((item) => {
            const Icon = item.icon
            const isActive = location.pathname === item.path || 
                           (item.path === '/admin/users' && location.pathname.startsWith('/admin/users'))
            return (
              <li key={item.path}>
                <Link
                  to={item.path}
                  className={`flex items-center ${isCollapsed ? 'justify-center' : 'gap-3'} px-4 py-3 rounded-lg transition-colors ${
                    isActive
                      ? 'bg-blue-600 text-white'
                      : 'text-gray-300 hover:bg-gray-800 hover:text-white'
                  }`}
                  title={isCollapsed ? item.label : ''}
                >
                  <Icon size={20} />
                  {!isCollapsed && <span>{item.label}</span>}
                </Link>
              </li>
            )
          })}
          
          {/* Kelola Berita dengan Submenu */}
          <li>
            {isCollapsed ? (
              <div className="px-4 py-3 rounded-lg bg-gray-800">
                <Newspaper size={20} className="mx-auto" title="Kelola Berita" />
              </div>
            ) : (
              <>
                <button
                  onClick={() => setKelolaBeritaOpen(!kelolaBeritaOpen)}
                  className={`w-full flex items-center justify-between px-4 py-3 rounded-lg transition-colors ${
                    location.pathname === '/admin/announcements' || location.pathname === '/admin/events'
                      ? 'bg-blue-600 text-white'
                      : 'text-gray-300 hover:bg-gray-800 hover:text-white'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Newspaper size={20} />
                    <span>Kelola Berita</span>
                  </div>
                  {kelolaBeritaOpen ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                </button>
                {kelolaBeritaOpen && (
                  <ul className="mt-2 ml-4 space-y-1 border-l-2 border-gray-700 pl-2">
                    {kelolaBeritaSubmenu.map((subItem) => {
                      const SubIcon = subItem.icon
                      const isSubActive = location.pathname === subItem.path
                      return (
                        <li key={subItem.path}>
                          <Link
                            to={subItem.path}
                            className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-colors ${
                              isSubActive
                                ? 'bg-blue-700 text-white'
                                : 'text-gray-400 hover:bg-gray-800 hover:text-gray-200'
                            }`}
                          >
                            <SubIcon size={16} />
                            <span>{subItem.label}</span>
                          </Link>
                        </li>
                      )
                    })}
                  </ul>
                )}
              </>
            )}
          </li>

          {/* Menu Pengaturan (di bawah Kelola Berita) */}
          {menuItems.slice(2).map((item) => {
            const Icon = item.icon
            const isActive = location.pathname === item.path
            return (
              <li key={item.path}>
                <Link
                  to={item.path}
                  className={`flex items-center ${isCollapsed ? 'justify-center' : 'gap-3'} px-4 py-3 rounded-lg transition-colors ${
                    isActive
                      ? 'bg-blue-600 text-white'
                      : 'text-gray-300 hover:bg-gray-800 hover:text-white'
                  }`}
                  title={isCollapsed ? item.label : ''}
                >
                  <Icon size={20} />
                  {!isCollapsed && <span>{item.label}</span>}
                </Link>
              </li>
            )
          })}
        </ul>
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

