import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { getImageUrl } from '../../utils/imageUtils'
import { LogOut, User, Settings, Menu, Search, UserPlus, Compass } from 'lucide-react'
import NotificationBell from '../common/NotificationBell'
import ConfirmModal from '../common/ConfirmModal'

const Header = () => {
  const { user, logout, isAuthenticated } = useAuth()
  const [showProfileMenu, setShowProfileMenu] = useState(false)
  const [isLogoutConfirmOpen, setIsLogoutConfirmOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const navigate = useNavigate()
  const [sidebarBadgeCount, setSidebarBadgeCount] = useState(0)

  // Dengarkan total badge dari Sidebar
  useEffect(() => {
    const handleBadgeUpdate = (e) => setSidebarBadgeCount(e.detail?.total ?? 0)
    window.addEventListener('sidebarBadgeUpdate', handleBadgeUpdate)
    return () => window.removeEventListener('sidebarBadgeUpdate', handleBadgeUpdate)
  }, [])

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

  const getPageInfo = () => {
    const path = window.location.pathname
    if (path.startsWith('/berita')) {
      return { event: 'startBeritaTour', label: 'Tur Panduan (Berita)' }
    }
    if (path.startsWith('/pesan')) {
      return { event: 'startPesanTour', label: 'Tur Panduan (Pesan)' }
    }
    if (path.startsWith('/koneksi')) {
      return { event: 'startKoneksiTour', label: 'Tur Panduan (Koneksi)' }
    }
    if (path.startsWith('/direktori')) {
      return { event: 'startDirektoriTour', label: 'Tur Panduan (Direktori)' }
    }
    if (path.startsWith('/diskusi')) {
      return { event: 'startDiskusiTour', label: 'Tur Panduan (Diskusi)' }
    }
    if (path.startsWith('/lowongan')) {
      return { event: 'startLowonganTour', label: 'Tur Panduan (Lowongan)' }
    }
    
    if (path.endsWith('/edit') && path.includes('/profil')) {
      return { event: 'startEditProfilTour', label: 'Tur Panduan (Edit Profil)' }
    }

    const isOwnProfilePage = path === `/profil/${user?.id}` || 
                             path === '/profil' || 
                             path === '/profil/'
    if (isOwnProfilePage) {
      return { event: 'startProfileTour', label: 'Tur Panduan (Profil)' }
    }
    if (path === '/dashboard') {
      return { event: 'startOnboardingTour', label: 'Tur Panduan (Beranda)' }
    }
    return { event: 'startOnboardingTour', label: 'Tur Panduan (Beranda)', redirect: true }
  }

  const handleStartTour = () => {
    setShowProfileMenu(false)
    const info = getPageInfo()
    if (info.redirect) {
      localStorage.setItem('trigger_tour_on_mount', 'true')
      navigate('/dashboard')
    } else {
      window.dispatchEvent(new Event(info.event))
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
          <div className="flex items-center gap-1.5 sm:gap-3 shrink-0">
            <button
              id="tour-mobile-menu"
              onClick={() => {
                window.dispatchEvent(new Event('toggleMobileMenu'))
              }}
              className="lg:hidden relative p-1.5 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <Menu size={24} />
              {sidebarBadgeCount > 0 && user?.role !== 'ADMIN' && (
                <span className="absolute -top-1 -right-1 bg-blue-600 text-white text-[10px] font-bold rounded-full w-4 h-4 flex items-center justify-center leading-none">
                  {sidebarBadgeCount > 9 ? '9+' : sidebarBadgeCount}
                </span>
              )}
            </button>
            <Link to="/dashboard" className="flex items-center gap-2 sm:gap-3 group">
              <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl overflow-hidden shadow-sm group-hover:shadow transition-shadow">
                <img src="/icon_web.png" alt="UII Connect Logo" className="w-full h-full object-cover" />
              </div>
              <div className="text-lg sm:text-xl font-extrabold text-blue-900 tracking-tight hidden md:block">UII CONNECT</div>
            </Link>
          </div>

          {/* Center/Right-aligned: Search Bar */}
          <div className="flex-1 max-w-[140px] xs:max-w-[200px] sm:max-w-xl md:max-w-2xl px-1 sm:px-2 block ml-auto">
            <form id="tour-search" onSubmit={handleSearch} className="relative w-full group">
              <div className="absolute inset-y-0 left-0 pl-3 sm:pl-4 flex items-center pointer-events-none">
                <Search className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-gray-400 group-focus-within:text-blue-500 transition-colors" />
              </div>
              <input
                type="text"
                className="block w-full pl-8 sm:pl-10 pr-3 sm:pr-4 md:pr-12 py-1.5 sm:py-2 border border-gray-200 rounded-xl bg-gray-50 text-xs sm:text-sm placeholder-gray-400 focus:outline-none focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                placeholder="Cari..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none hidden md:flex">
                <span className="text-[10px] text-gray-400 font-medium border border-gray-200 rounded px-1.5 py-0.5 bg-white">⌘ K</span>
              </div>
            </form>
          </div>

          {/* Right: Actions & Profile */}
          <div className="flex items-center gap-2 sm:gap-4 shrink-0">
            
            {/* Notifications - hanya untuk user yang bukan admin */}
            {user?.role !== 'ADMIN' && (
              <div id="tour-notifications" className="flex items-center">
                <NotificationBell />
              </div>
            )}
            
            {/* User Info & Dropdown */}
            <div className="relative flex items-center ml-2 border-l border-gray-200 pl-4">
              <button
                id="tour-profile"
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

                    {user?.role !== 'ADMIN' && (
                      <button
                        onClick={handleStartTour}
                        className="flex items-center gap-3 w-full text-left px-4 py-2.5 text-sm text-gray-700 hover:bg-blue-50 hover:text-blue-600 transition-colors"
                      >
                        <Compass size={16} className="text-blue-500" />
                        {getPageInfo().label}
                      </button>
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


