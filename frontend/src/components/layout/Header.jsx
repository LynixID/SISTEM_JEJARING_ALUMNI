import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { getImageUrl } from '../../utils/imageUtils'
import { LogOut, User, Settings, Menu, Search, UserPlus } from 'lucide-react'
import NotificationBell from '../common/NotificationBell'
import ConfirmModal from '../common/ConfirmModal'

const Header = () => {
  const { user, logout, isAuthenticated } = useAuth()
  const [showProfileMenu, setShowProfileMenu] = useState(false)
  const [isLogoutConfirmOpen, setIsLogoutConfirmOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const navigate = useNavigate()

  const handleLogout = () => {
    logout()
    navigate('/login', { replace: true })
  }

  const handleSearch = (e) => {
    e.preventDefault()
    if (searchQuery.trim()) {
      navigate(`/dashboard?search=${encodeURIComponent(searchQuery.trim())}`)
    } else {
      navigate('/dashboard')
    }
  }

  if (!isAuthenticated) {
    return (
      <header className="bg-white border-b border-gray-200 sticky top-0 z-40 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <Link to="/" className="flex items-center gap-3 group">
              <div className="w-9 h-9 rounded-xl overflow-hidden shadow-sm group-hover:shadow transition-shadow">
                <img src="/icon_web.png" alt="UII Connect Logo" className="w-full h-full object-cover" />
              </div>
              <div className="text-xl font-bold text-blue-900 tracking-tight hidden sm:block">UII CONNECT</div>
            </Link>
            <div className="flex items-center gap-4">
              <Link to="/login" className="text-gray-700 hover:text-blue-600 font-medium">Login</Link>
              <Link to="/register" className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium transition-colors">
                Daftar
              </Link>
            </div>
          </div>
        </div>
      </header>
    )
  }

  return (
    <header className="bg-white border-b border-gray-100 sticky top-0 z-40">
      <div className="max-w-screen-2xl mx-auto px-4 sm:px-6">
        <div className="flex items-center justify-between h-16 gap-4">
          
          {/* Left: Logo & Mobile Menu */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => {
                window.dispatchEvent(new Event('toggleMobileMenu'))
              }}
              className="lg:hidden p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <Menu size={24} />
            </button>
            <Link to="/dashboard" className="flex items-center gap-3 group">
              <div className="w-10 h-10 rounded-xl overflow-hidden shadow-sm group-hover:shadow transition-shadow">
                <img src="/icon_web.png" alt="UII Connect Logo" className="w-full h-full object-cover" />
              </div>
              <div className="text-xl font-extrabold text-blue-900 tracking-tight hidden sm:block">UII CONNECT</div>
            </Link>
          </div>

          {/* Center: Search Bar */}
          <div className="flex-1 max-w-2xl px-2 hidden md:block">
            <form onSubmit={handleSearch} className="relative w-full group">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <Search className="h-4 w-4 text-gray-400 group-focus-within:text-blue-500 transition-colors" />
              </div>
              <input
                type="text"
                className="block w-full pl-11 pr-12 py-2.5 border border-gray-200 rounded-xl bg-gray-50 text-sm placeholder-gray-400 focus:outline-none focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                placeholder="Cari sesuatu di UII Connect..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                <span className="text-[10px] text-gray-400 font-medium border border-gray-200 rounded px-1.5 py-0.5 bg-white">⌘ K</span>
              </div>
            </form>
          </div>

          {/* Right: Actions & Profile */}
          <div className="flex items-center gap-2 sm:gap-4 shrink-0">
            
            {/* Notifications - hanya untuk user yang bukan admin */}
            {user?.role !== 'ADMIN' && <NotificationBell />}
            
            {/* User Info & Dropdown */}
            <div className="relative flex items-center ml-2 border-l border-gray-200 pl-4">
              <button
                onClick={() => setShowProfileMenu(!showProfileMenu)}
                className="flex items-center gap-3 p-1 rounded-xl hover:bg-gray-50 transition group"
              >
                {user?.profile?.fotoProfil ? (
                  <img
                    src={getImageUrl(user.profile.fotoProfil, 'profiles')}
                    alt={user?.nama || 'User'}
                    className="w-9 h-9 rounded-full object-cover border border-gray-200"
                    onError={(e) => {
                      e.target.style.display = 'none'
                      const fallback = e.target.nextElementSibling
                      if (fallback) fallback.style.display = 'flex'
                    }}
                  />
                ) : null}
                <div 
                  className={`w-9 h-9 bg-blue-600 rounded-full flex items-center justify-center text-white font-semibold text-sm ${user?.profile?.fotoProfil ? 'hidden' : ''}`}
                  style={{ display: user?.profile?.fotoProfil ? 'none' : 'flex' }}
                >
                  {user?.nama?.charAt(0) || 'U'}
                </div>
                
                <div className="text-left hidden lg:block">
                  <div className="text-sm font-semibold text-gray-700 group-hover:text-gray-900">{user?.nama || 'User'}</div>
                  <div className="text-xs text-gray-500 capitalize">{user?.role?.toLowerCase() || 'alumni'}</div>
                </div>
              </button>

              {showProfileMenu && (
                <>
                  <div
                    className="fixed inset-0 z-10"
                    onClick={() => setShowProfileMenu(false)}
                  />
                  <div className="absolute right-0 top-full mt-2 w-56 bg-white rounded-xl shadow-lg border border-gray-100 py-2 z-20">
                    <Link
                      to={`/profil/${user?.id || ''}`}
                      className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-blue-50 hover:text-blue-600 transition-colors"
                      onClick={() => setShowProfileMenu(false)}
                    >
                      <User size={16} />
                      Profil Saya
                    </Link>
                    
                    {user?.role === 'PENGURUS' && (
                      <Link
                        to="/pengurus/berita"
                        className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-blue-50 hover:text-blue-600 transition-colors"
                        onClick={() => setShowProfileMenu(false)}
                      >
                        <Settings size={16} />
                        Kelola Berita
                      </Link>
                    )}
                    
                    {user?.role === 'ADMIN' && (
                      <Link
                        to="/admin"
                        className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-blue-50 hover:text-blue-600 transition-colors"
                        onClick={() => setShowProfileMenu(false)}
                      >
                        <Settings size={16} />
                        Admin Panel
                      </Link>
                    )}
                    
                    <div className="border-t border-gray-100 my-1"></div>
                    
                    <button
                      onClick={() => {
                        setShowProfileMenu(false)
                        setIsLogoutConfirmOpen(true)
                      }}
                      className="flex items-center gap-3 w-full text-left px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition-colors"
                    >
                      <LogOut size={16} />
                      Logout
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      <ConfirmModal
        isOpen={isLogoutConfirmOpen}
        onClose={() => setIsLogoutConfirmOpen(false)}
        onConfirm={handleLogout}
        title="Konfirmasi Logout"
        message="Apakah Anda yakin ingin keluar dari akun Anda?"
        confirmText="Logout"
        cancelText="Batal"
        variant="danger"
      />
    </header>
  )
}

export default Header


