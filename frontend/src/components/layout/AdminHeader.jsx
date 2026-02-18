import { Bell, LogOut } from 'lucide-react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'

const AdminHeader = () => {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  const handleLogout = () => {
    logout()
    navigate('/login', { replace: true })
  }

  return (
    <header className="bg-white border-b border-gray-200 sticky top-0 z-40">
      <div className="px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Dashboard Administrator</h1>
            <p className="text-sm text-gray-500">Sistem Jejaring Alumni DPW IKA UII JATENG</p>
          </div>
          
          <div className="flex items-center gap-4">
            <Link to="/dashboard" className="text-gray-600 hover:text-blue-600 text-sm">
              Kembali ke Dashboard
            </Link>
            
            <button className="relative text-gray-600 hover:text-blue-600">
              <Bell size={24} />
              <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                0
              </span>
            </button>

            <div className="flex items-center gap-3 border-l border-gray-200 pl-4">
              <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center text-white font-semibold">
                {user?.nama?.charAt(0) || 'A'}
              </div>
              <div>
                <p className="text-sm font-medium text-gray-900">{user?.nama || 'Administrator'}</p>
                <p className="text-xs text-gray-500">Root Administrator</p>
              </div>
              <button
                onClick={handleLogout}
                className="ml-2 text-gray-600 hover:text-red-600 transition"
                title="Logout"
              >
                <LogOut size={20} />
              </button>
            </div>
          </div>
        </div>
      </div>
    </header>
  )
}

export default AdminHeader


