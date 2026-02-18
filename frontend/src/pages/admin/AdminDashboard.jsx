import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { Users, AlertCircle, CheckCircle, Clock, TrendingUp } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import api from '../../services/api'
import AdminSidebar from '../../components/layout/AdminSidebar'
import Card from '../../components/common/Card'
import Button from '../../components/common/Button'

const AdminDashboard = () => {
  const { user, isLoading: authLoading } = useAuth()
  const [statistics, setStatistics] = useState(null)
  const [recentUsers, setRecentUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    if (!authLoading && user) {
      fetchStatistics()
      fetchRecentUsers()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authLoading, user])

  const fetchStatistics = async () => {
    try {
      const response = await api.get('/admin/statistics')
      setStatistics(response.data.statistics)
      setError(null)
    } catch (error) {
      console.error('Error fetching statistics:', error)
      setError('Gagal memuat statistik. Silakan refresh halaman.')
    } finally {
      setLoading(false)
    }
  }

  const fetchRecentUsers = async () => {
    try {
      const response = await api.get('/admin/users?page=1&limit=5')
      setRecentUsers(response.data.users || [])
    } catch (error) {
      console.error('Error fetching recent users:', error)
      // Don't set error here, just log it
    }
  }

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-gray-500 mb-2">Loading...</div>
          <div className="text-sm text-gray-400">Memuat dashboard admin</div>
        </div>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-500 mb-2">Error: User tidak ditemukan</div>
          <button 
            onClick={() => window.location.href = '/login'} 
            className="text-blue-600 hover:text-blue-700"
          >
            Kembali ke Login
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 flex">
      <AdminSidebar />
      
      <div className="flex-1 flex flex-col">
        <main className="flex-1 overflow-y-auto">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Dashboard Administrator</h1>
                <p className="text-gray-600 mt-1">Overview sistem dan statistik</p>
              </div>
              <Link to="/admin/users">
                <Button variant="secondary">Manajemen User</Button>
              </Link>
            </div>

            {error && (
              <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
                {error}
                <button 
                  onClick={() => {
                    setError(null)
                    setLoading(true)
                    fetchStatistics()
                    fetchRecentUsers()
                  }}
                  className="ml-4 text-red-800 underline hover:text-red-900"
                >
                  Coba Lagi
                </button>
              </div>
            )}

            {/* Stats Cards */}
            {statistics && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                <Card className="p-6 bg-gradient-to-br from-blue-500 to-blue-600 text-white">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-blue-100 text-sm">Total User</p>
                      <p className="text-3xl font-bold">{statistics.totalUsers}</p>
                      <p className="text-blue-100 text-xs mt-1">
                        {statistics.alumniCount} alumni, {statistics.pengurusCount} pengurus
                      </p>
                    </div>
                    <Users className="text-blue-200" size={40} />
                  </div>
                </Card>

                <Card className="p-6 bg-gradient-to-br from-green-500 to-green-600 text-white">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-green-100 text-sm">Terverifikasi</p>
                      <p className="text-3xl font-bold">{statistics.verifiedUsers}</p>
                      <p className="text-green-100 text-xs mt-1">User aktif</p>
                    </div>
                    <CheckCircle className="text-green-200" size={40} />
                  </div>
                </Card>

                <Card className="p-6 bg-gradient-to-br from-yellow-500 to-yellow-600 text-white">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-yellow-100 text-sm">Menunggu Verifikasi</p>
                      <p className="text-3xl font-bold">{statistics.pendingUsers}</p>
                      <p className="text-yellow-100 text-xs mt-1">Perlu tindakan</p>
                    </div>
                    <AlertCircle className="text-yellow-200" size={40} />
                  </div>
                </Card>

                <Card className="p-6 bg-gradient-to-br from-purple-500 to-purple-600 text-white">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-purple-100 text-sm">Total Alumni</p>
                      <p className="text-3xl font-bold">{statistics.alumniCount}</p>
                      <p className="text-purple-100 text-xs mt-1">Alumni terdaftar</p>
                    </div>
                    <Users className="text-purple-200" size={40} />
                  </div>
                </Card>
              </div>
            )}

            {/* Main Content Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
              {/* Recent Users */}
              <Card className="p-6 lg:col-span-2">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-semibold text-gray-900">User Terbaru</h2>
                  <Link to="/admin/users" className="text-sm text-blue-600 hover:text-blue-700">
                    Lihat Semua →
                  </Link>
                </div>
                <div className="space-y-3">
                  {recentUsers.length > 0 ? (
                    recentUsers.map((user) => (
                      <div key={user.id} className="flex items-center justify-between p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition">
                        <div className="flex items-center gap-3">
                          <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                            user.verified ? 'bg-green-100' : 'bg-yellow-100'
                          }`}>
                            {user.verified ? (
                              <CheckCircle className="text-green-600" size={20} />
                            ) : (
                              <Clock className="text-yellow-600" size={20} />
                            )}
                          </div>
                          <div>
                            <p className="font-medium text-gray-900">{user.nama}</p>
                            <p className="text-sm text-gray-500">{user.email}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                            user.role === 'PENGURUS'
                              ? 'bg-purple-100 text-purple-800'
                              : 'bg-blue-100 text-blue-800'
                          }`}>
                            {user.role}
                          </span>
                          <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                            user.verified
                              ? 'bg-green-100 text-green-800'
                              : 'bg-yellow-100 text-yellow-800'
                          }`}>
                            {user.verified ? 'Terverifikasi' : 'Menunggu'}
                          </span>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-8 text-gray-500">
                      Belum ada user
                    </div>
                  )}
                </div>
              </Card>

              {/* Quick Actions */}
              <Card className="p-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">Quick Actions</h2>
                <div className="space-y-3">
                  <Link to="/admin/users" className="block p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                    <div className="flex items-center gap-3">
                      <Users className="text-blue-600" size={24} />
                      <div>
                        <p className="font-semibold text-gray-900">Manajemen User</p>
                        <p className="text-sm text-gray-600">
                          {statistics?.pendingUsers || 0} menunggu verifikasi
                        </p>
                      </div>
                    </div>
                  </Link>
                  
                  <Link to="/admin/users" className="block p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                    <div className="flex items-center gap-3">
                      <CheckCircle className="text-green-600" size={24} />
                      <div>
                        <p className="font-semibold text-gray-900">User Terverifikasi</p>
                        <p className="text-sm text-gray-600">
                          {statistics?.verifiedUsers || 0} user aktif
                        </p>
                      </div>
                    </div>
                  </Link>
                  
                  <Link to="/admin/users" className="block p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                    <div className="flex items-center gap-3">
                      <AlertCircle className="text-yellow-600" size={24} />
                      <div>
                        <p className="font-semibold text-gray-900">Pending Verification</p>
                        <p className="text-sm text-gray-600">
                          {statistics?.pendingUsers || 0} perlu verifikasi
                        </p>
                      </div>
                    </div>
                  </Link>
                </div>
              </Card>
            </div>

            {/* Summary Stats */}
            <Card className="p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Ringkasan Statistik</h2>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                <div className="text-center">
                  <div className="flex items-center justify-center mb-2">
                    <Users className="text-blue-600" size={32} />
                  </div>
                  <p className="text-2xl font-bold text-gray-900">{statistics?.totalUsers || 0}</p>
                  <p className="text-sm text-gray-600">Total User</p>
                </div>
                <div className="text-center">
                  <div className="flex items-center justify-center mb-2">
                    <CheckCircle className="text-green-600" size={32} />
                  </div>
                  <p className="text-2xl font-bold text-gray-900">{statistics?.verifiedUsers || 0}</p>
                  <p className="text-sm text-gray-600">Terverifikasi</p>
                </div>
                <div className="text-center">
                  <div className="flex items-center justify-center mb-2">
                    <Clock className="text-yellow-600" size={32} />
                  </div>
                  <p className="text-2xl font-bold text-gray-900">{statistics?.pendingUsers || 0}</p>
                  <p className="text-sm text-gray-600">Pending</p>
                </div>
                <div className="text-center">
                  <div className="flex items-center justify-center mb-2">
                    <TrendingUp className="text-purple-600" size={32} />
                  </div>
                  <p className="text-2xl font-bold text-gray-900">{statistics?.pengurusCount || 0}</p>
                  <p className="text-sm text-gray-600">Pengurus</p>
                </div>
              </div>
            </Card>
          </div>
        </main>
      </div>
    </div>
  )
}

export default AdminDashboard

