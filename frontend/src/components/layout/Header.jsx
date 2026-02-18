import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { getImageUrl } from '../../utils/imageUtils'
import { LogOut, User, Settings, Menu } from 'lucide-react'
import NotificationBell from '../common/NotificationBell'

const Header = () => {
  const { user, logout, isAuthenticated } = useAuth()
  const [showProfileMenu, setShowProfileMenu] = useState(false)
  const navigate = useNavigate()

  const handleLogout = () => {
    logout()
    navigate('/login', { replace: true })
  }

  if (!isAuthenticated) {
    return (
      <header className="bg-white border-b border-gray-200 sticky top-0 z-40 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <Link to="/" className="flex items-center">
              <div className="text-2xl font-bold text-blue-600">DPW IKA UII JATENG</div>
            </Link>
            <div className="flex items-center gap-4">
              <Link to="/login" className="text-gray-700 hover:text-blue-600">Login</Link>
              <Link to="/register" className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                Daftar
              </Link>
            </div>
          </div>
        </div>
      </header>
    )
  }

  return (
    <header className="bg-white border-b border-gray-200 sticky top-0 z-40 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <Link to="/dashboard" className="flex items-center">
            <div className="text-2xl font-bold text-blue-600">IKA UII JATENG</div>
          </Link>

          <div className="flex items-center gap-4">
            {/* Notifications - hanya untuk user yang bukan admin */}
            {user?.role !== 'ADMIN' && <NotificationBell />}
            
            {/* User Info */}
            <div className="flex items-center gap-3">
              <div className="text-right hidden sm:block">
                <div className="text-sm font-medium text-gray-900">{user?.nama || 'User'}</div>
                <div className="text-xs text-gray-500 capitalize">{user?.role?.toLowerCase() || 'alumni'}</div>
              </div>
              
              {/* Profile Menu */}
              <div className="relative">
                <button
                  onClick={() => setShowProfileMenu(!showProfileMenu)}
                  className="flex items-center gap-2 p-2 rounded-lg hover:bg-gray-100 transition"
                >
                  {user?.profile?.fotoProfil ? (
                    <img
                      src={getImageUrl(user.profile.fotoProfil, 'profiles')}
                      alt={user?.nama || 'User'}
                      className="w-10 h-10 rounded-full object-cover border-2 border-gray-200"
                      onError={(e) => {
                        e.target.style.display = 'none'
                        const fallback = e.target.nextElementSibling
                        if (fallback) fallback.style.display = 'flex'
                      }}
                    />
                  ) : null}
                  <div 
                    className={`w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center text-white font-semibold ${user?.profile?.fotoProfil ? 'hidden' : ''}`}
                    style={{ display: user?.profile?.fotoProfil ? 'none' : 'flex' }}
                  >
                    {user?.nama?.charAt(0) || 'U'}
                  </div>
                </button>

                {showProfileMenu && (
                  <>
                    <div
                      className="fixed inset-0 z-10"
                      onClick={() => setShowProfileMenu(false)}
                    />
                    <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-20">
                      <Link
                        to={`/profil/${user?.id || ''}`}
                        className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                        onClick={() => setShowProfileMenu(false)}
                      >
                        <User size={16} />
                        Profil Saya
                      </Link>
                      
                      {user?.role === 'PENGURUS' && (
                        <Link
                          to="/pengurus/berita"
                          className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                          onClick={() => setShowProfileMenu(false)}
                        >
                          <Settings size={16} />
                          Kelola Berita
                        </Link>
                      )}
                      
                      {user?.role === 'ADMIN' && (
                        <Link
                          to="/admin"
                          className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                          onClick={() => setShowProfileMenu(false)}
                        >
                          <Settings size={16} />
                          Admin Panel
                        </Link>
                      )}
                      
                      <div className="border-t border-gray-200 my-1"></div>
                      
                      <button
                        onClick={handleLogout}
                        className="flex items-center gap-2 w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-gray-100"
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
      </div>
    </header>
  )
}

export default Header


