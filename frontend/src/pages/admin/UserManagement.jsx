import { useState, useEffect } from 'react'
import { useAuth } from '../../context/AuthContext'
import api from '../../services/api'
import AdminSidebar from '../../components/layout/AdminSidebar'
import Button from '../../components/common/Button'
import Card from '../../components/common/Card'
import Input from '../../components/common/Input'
import AlertModal from '../../components/common/AlertModal'
import ConfirmModal from '../../components/common/ConfirmModal'
import Modal from '../../components/common/Modal'
import UserBadge from '../../components/common/UserBadge'
import ExportUserModal from '../../components/admin/ExportUserModal'
import { FileSpreadsheet } from 'lucide-react'

const UserManagement = () => {
  const { user } = useAuth()
  const [users, setUsers] = useState([])
  const [statistics, setStatistics] = useState(null)
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [filterVerified, setFilterVerified] = useState('all')
  const [filterRole, setFilterRole] = useState('all')
  const [filterProdi, setFilterProdi] = useState('all')
  const [filterDomisili, setFilterDomisili] = useState('all')
  const [filterAngkatan, setFilterAngkatan] = useState('all')
  const [filterOptions, setFilterOptions] = useState({ prodis: [], domisilis: [], angkatans: [] })
  
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0
  })
  const [alertModal, setAlertModal] = useState({ isOpen: false, title: '', message: '', variant: 'info' })
  const [confirmModal, setConfirmModal] = useState({ 
    isOpen: false, 
    title: '', 
    message: '', 
    variant: 'warning',
    onConfirm: () => {}
  })
  const [suspendModal, setSuspendModal] = useState({
    isOpen: false,
    userId: null,
    isLoading: false
  })
  const [isExportModalOpen, setIsExportModalOpen] = useState(false)

  useEffect(() => {
    fetchUsers()
    fetchStatistics()
    fetchFilterOptions()
  }, [pagination.page, search, filterVerified, filterRole, filterProdi, filterDomisili, filterAngkatan])

  const fetchFilterOptions = async () => {
    try {
      const response = await api.get('/admin/users/filter-options')
      setFilterOptions(response.data)
    } catch (error) {
      console.error('Error fetching filter options:', error)
    }
  }

  const fetchUsers = async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams({
        page: pagination.page,
        limit: pagination.limit,
        search,
        ...(filterVerified !== 'all' && { verified: filterVerified }),
        ...(filterRole !== 'all' && { role: filterRole }),
        ...(filterProdi !== 'all' && { prodi: filterProdi }),
        ...(filterDomisili !== 'all' && { domisili: filterDomisili }),
        ...(filterAngkatan !== 'all' && { angkatan: filterAngkatan })
      })

      const response = await api.get(`/admin/users?${params}`)
      setUsers(response.data.users)
      setPagination(response.data.pagination)
    } catch (error) {
      console.error('Error fetching users:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchStatistics = async () => {
    try {
      const response = await api.get('/admin/statistics')
      setStatistics(response.data.statistics)
    } catch (error) {
      console.error('Error fetching statistics:', error)
    }
  }

  const handleVerify = async (userId) => {
    try {
      await api.patch(`/admin/users/${userId}/verify`)
      fetchUsers()
      fetchStatistics()
      setAlertModal({
        isOpen: true,
        title: 'Berhasil',
        message: 'User berhasil diverifikasi',
        variant: 'success'
      })
    } catch (error) {
      setAlertModal({
        isOpen: true,
        title: 'Error',
        message: error.response?.data?.error || 'Gagal memverifikasi user',
        variant: 'error'
      })
    }
  }

  const handleReject = async (userId) => {
    setConfirmModal({
      isOpen: true,
      title: 'Tolak User',
      message: 'Apakah Anda yakin ingin menolak user ini?',
      variant: 'danger',
      onConfirm: async () => {
        try {
          await api.patch(`/admin/users/${userId}/reject`)
          fetchUsers()
          fetchStatistics()
        } catch (error) {
          setAlertModal({
            isOpen: true,
            title: 'Error',
            message: error.response?.data?.error || 'Gagal menolak user',
            variant: 'error'
          })
        }
      }
    })
  }

  const handleRoleChange = async (userId, newRole) => {
    try {
      await api.patch(`/admin/users/${userId}/role`, { role: newRole })
      fetchUsers()
      setAlertModal({
        isOpen: true,
        title: 'Berhasil',
        message: 'Role user berhasil diubah',
        variant: 'success'
      })
    } catch (error) {
      setAlertModal({
        isOpen: true,
        title: 'Error',
        message: error.response?.data?.error || 'Gagal mengubah role',
        variant: 'error'
      })
    }
  }

  const handleSuspendModal = (userId) => {
    setSuspendModal({ isOpen: true, userId, isLoading: false })
  }

  const handleSuspend = async () => {
    if (!suspendModal.userId) return

    try {
      setSuspendModal(prev => ({ ...prev, isLoading: true }))
      await api.patch(`/admin/users/${suspendModal.userId}/suspend`)
      fetchUsers()
      setSuspendModal({ isOpen: false, userId: null, isLoading: false })
      setAlertModal({
        isOpen: true,
        title: 'Berhasil',
        message: 'User telah ditangguhkan',
        variant: 'success'
      })
    } catch (error) {
      setSuspendModal(prev => ({ ...prev, isLoading: false }))
      setAlertModal({
        isOpen: true,
        title: 'Error',
        message: error.response?.data?.error || 'Gagal menangguhkan user',
        variant: 'error'
      })
    }
  }

  const handleDeleteUser = async (userId) => {
    setConfirmModal({
      isOpen: true,
      title: 'Hapus User',
      message: 'Apakah Anda yakin ingin menghapus user ini secara permanen? Semua data terkait (postingan, komentar, profil, dll) juga akan terhapus.',
      variant: 'danger',
      onConfirm: async () => {
        try {
          await api.delete(`/admin/users/${userId}`)
          fetchUsers()
          fetchStatistics()
          setAlertModal({
            isOpen: true,
            title: 'Berhasil',
            message: 'User berhasil dihapus secara permanen',
            variant: 'success'
          })
        } catch (error) {
          setAlertModal({
            isOpen: true,
            title: 'Error',
            message: error.response?.data?.error || 'Gagal menghapus user',
            variant: 'error'
          })
        }
      }
    })
  }

  const handleUnsuspend = async (userId) => {
    setConfirmModal({
      isOpen: true,
      title: 'Buka Penangguhan',
      message: 'Apakah Anda yakin ingin memulihkan akses akun ini?',
      variant: 'info',
      onConfirm: async () => {
        try {
          await api.patch(`/admin/users/${userId}/unsuspend`)
          fetchUsers()
          setAlertModal({
            isOpen: true,
            title: 'Berhasil',
            message: 'Penangguhan dicabut',
            variant: 'success'
          })
        } catch (error) {
          setAlertModal({
            isOpen: true,
            title: 'Error',
            message: error.response?.data?.error || 'Gagal mencabut penangguhan',
            variant: 'error'
          })
        }
      }
    })
  }

  const getRoleBadge = (role) => {
    const colors = {
      ALUMNI: 'bg-blue-100 text-blue-800',
      PENGURUS: 'bg-purple-100 text-purple-800',
      ADMIN: 'bg-red-100 text-red-800'
    }
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${colors[role] || 'bg-gray-100 text-gray-800'}`}>
        {role}
      </span>
    )
  }

  const getVerifiedBadge = (user) => {
    if (user.isSuspended) {
      return (
        <span className="px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
          Ditangguhkan
        </span>
      )
    }
    return user.verified ? (
      <span className="px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
        Terverifikasi
      </span>
    ) : (
      <span className="px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
        Pending
      </span>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 flex">
      <AdminSidebar />
      
      <div className="flex-1 flex flex-col">
        <main className="flex-1 overflow-y-auto">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
            <div className="mb-6">
              <h1 className="text-3xl font-bold text-gray-900">Manajemen User</h1>
              <p className="text-gray-600 mt-1">Kelola alumni dan pengurus</p>
            </div>
            
            <div className="flex justify-end mb-6">
              <Button 
                variant="outline" 
                onClick={() => setIsExportModalOpen(true)}
                className="flex items-center space-x-2"
              >
                <FileSpreadsheet className="w-4 h-4 mr-2" />
                Ekspor ke Excel
              </Button>
            </div>

        {/* Statistics */}
        {statistics && (
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
            <Card className="p-4">
              <div className="text-sm text-gray-600">Total User</div>
              <div className="text-2xl font-bold text-gray-900">{statistics.totalUsers}</div>
            </Card>
            <Card className="p-4">
              <div className="text-sm text-gray-600">Terverifikasi</div>
              <div className="text-2xl font-bold text-green-600">{statistics.verifiedUsers}</div>
            </Card>
            <Card className="p-4">
              <div className="text-sm text-gray-600">Pending</div>
              <div className="text-2xl font-bold text-yellow-600">{statistics.pendingUsers}</div>
            </Card>
            <Card className="p-4">
              <div className="text-sm text-gray-600">Alumni</div>
              <div className="text-2xl font-bold text-blue-600">{statistics.alumniCount}</div>
            </Card>
            <Card className="p-4">
              <div className="text-sm text-gray-600">Pengurus</div>
              <div className="text-2xl font-bold text-purple-600">{statistics.pengurusCount}</div>
            </Card>
          </div>
        )}

        {/* Filters */}
        <Card className="p-4 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
            <Input
              label="Cari"
              placeholder="Nama, email, atau NIM..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value)
                setPagination({ ...pagination, page: 1 })
              }}
            />
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
              <select
                className="w-full px-4 py-2 border border-gray-300 rounded-lg text-sm"
                value={filterVerified}
                onChange={(e) => {
                  setFilterVerified(e.target.value)
                  setPagination({ ...pagination, page: 1 })
                }}
              >
                <option value="all">Semua</option>
                <option value="true">Terverifikasi</option>
                <option value="false">Pending</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Role</label>
              <select
                className="w-full px-4 py-2 border border-gray-300 rounded-lg text-sm"
                value={filterRole}
                onChange={(e) => {
                  setFilterRole(e.target.value)
                  setPagination({ ...pagination, page: 1 })
                }}
              >
                <option value="all">Semua</option>
                <option value="ALUMNI">Alumni</option>
                <option value="PENGURUS">Pengurus</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Prodi</label>
              <select
                className="w-full px-4 py-2 border border-gray-300 rounded-lg text-sm"
                value={filterProdi}
                onChange={(e) => {
                  setFilterProdi(e.target.value)
                  setPagination({ ...pagination, page: 1 })
                }}
              >
                <option value="all">Semua Prodi</option>
                {filterOptions.prodis.map((p, i) => (
                  <option key={i} value={p}>{p}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Wilayah</label>
              <select
                className="w-full px-4 py-2 border border-gray-300 rounded-lg text-sm"
                value={filterDomisili}
                onChange={(e) => {
                  setFilterDomisili(e.target.value)
                  setPagination({ ...pagination, page: 1 })
                }}
              >
                <option value="all">Semua Wilayah</option>
                {filterOptions.domisilis.map((d, i) => (
                  <option key={i} value={d}>{d}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Angkatan</label>
              <select
                className="w-full px-4 py-2 border border-gray-300 rounded-lg text-sm"
                value={filterAngkatan}
                onChange={(e) => {
                  setFilterAngkatan(e.target.value)
                  setPagination({ ...pagination, page: 1 })
                }}
              >
                <option value="all">Semua Angkatan</option>
                {filterOptions.angkatans.map((a, i) => (
                  <option key={i} value={a}>{a}</option>
                ))}
              </select>
            </div>
          </div>
        </Card>

        {/* Users Table */}
        <Card className="overflow-hidden">
          {loading ? (
            <div className="p-8 text-center">Memuat data...</div>
          ) : users.length === 0 ? (
            <div className="p-8 text-center text-gray-500">Tidak ada data</div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Nama</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Email</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">NIM</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Role</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {users.map((user) => (
                      <tr key={user.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">
                            {user.nama}
                            <UserBadge role={user.role} size="sm" />
                          </div>
                          {user.profile?.profesi && (
                            <div className="text-sm text-gray-500">{user.profile.profesi}</div>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">{user.email}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">{user.nim || '-'}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {getRoleBadge(user.role)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {getVerifiedBadge(user)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <div className="flex gap-2">
                            {!user.verified && (
                              <Button
                                variant="primary"
                                size="sm"
                                onClick={() => handleVerify(user.id)}
                              >
                                Verifikasi
                              </Button>
                            )}
                            {!user.verified && (
                              <Button
                                variant="danger"
                                size="sm"
                                onClick={() => handleReject(user.id)}
                              >
                                Tolak
                              </Button>
                            )}
                            <select
                              className="px-2 py-1 border border-gray-300 rounded text-xs"
                              value={user.role}
                              onChange={(e) => handleRoleChange(user.id, e.target.value)}
                            >
                              <option value="ALUMNI">Alumni</option>
                              <option value="PENGURUS">Pengurus</option>
                            </select>

                            {!user.isSuspended ? (
                              <Button
                                variant="warning"
                                size="sm"
                                onClick={() => setSuspendModal({ 
                                  isOpen: true, 
                                  userId: user.id, 
                                  isLoading: false 
                                })}
                              >
                                Suspend
                              </Button>
                            ) : (
                              <Button
                                variant="secondary"
                                size="sm"
                                onClick={() => handleUnsuspend(user.id)}
                              >
                                Unsuspend
                              </Button>
                            )}
                            
                            <Button
                              variant="danger"
                              size="sm"
                              onClick={() => handleDeleteUser(user.id)}
                            >
                              Hapus
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              {pagination.totalPages > 1 && (
                <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-between">
                  <div className="text-sm text-gray-700">
                    Menampilkan {(pagination.page - 1) * pagination.limit + 1} sampai{' '}
                    {Math.min(pagination.page * pagination.limit, pagination.total)} dari {pagination.total}
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      disabled={pagination.page === 1}
                      onClick={() => setPagination({ ...pagination, page: pagination.page - 1 })}
                    >
                      Sebelumnya
                    </Button>
                    <Button
                      variant="outline"
                      disabled={pagination.page === pagination.totalPages}
                      onClick={() => setPagination({ ...pagination, page: pagination.page + 1 })}
                    >
                      Selanjutnya
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </Card>
          </div>
        </main>
      </div>

      {/* Alert Modal */}
      <AlertModal
        isOpen={alertModal.isOpen}
        onClose={() => setAlertModal({ ...alertModal, isOpen: false })}
        title={alertModal.title}
        message={alertModal.message}
        variant={alertModal.variant}
      />

      {/* Confirm Modal */}
      <ConfirmModal
        isOpen={confirmModal.isOpen}
        onClose={() => setConfirmModal({ ...confirmModal, isOpen: false })}
        onConfirm={confirmModal.onConfirm}
        title={confirmModal.title}
        message={confirmModal.message}
        variant={confirmModal.variant}
      />

      {/* Suspend Modal */}
      <Modal
        isOpen={suspendModal.isOpen}
        onClose={() => setSuspendModal({ ...suspendModal, isOpen: false })}
        title="Tangguhkan User"
        size="md"
        showCloseButton={!suspendModal.isLoading}
      >
        <div className="space-y-4">
          <div className="flex items-start gap-4">
            <div className="flex-shrink-0 p-3 bg-red-100 rounded-xl">
              <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-gray-900 mb-1">Konfirmasi Penangguhan</h3>
              <p className="text-sm text-gray-600">
                Apakah Anda yakin ingin menangguhkan akun ini? User tidak akan bisa login ke sistem.
              </p>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
            <Button
              variant="outline"
              onClick={() => setSuspendModal({ ...suspendModal, isOpen: false })}
              disabled={suspendModal.isLoading}
            >
              Batal
            </Button>
            <Button
              variant="danger"
              onClick={handleSuspend}
              disabled={suspendModal.isLoading}
            >
              {suspendModal.isLoading ? 'Memproses...' : 'Tangguhkan User'}
            </Button>
          </div>
        </div>
      </Modal>
      <ExportUserModal 
        isOpen={isExportModalOpen} 
        onClose={() => setIsExportModalOpen(false)} 
      />

      <ConfirmModal 
        isOpen={confirmModal.isOpen}
        title={confirmModal.title}
        message={confirmModal.message}
        onConfirm={confirmModal.onConfirm}
        onClose={() => setConfirmModal({ ...confirmModal, isOpen: false })}
        variant={confirmModal.variant}
      />

      <AlertModal 
        isOpen={alertModal.isOpen}
        title={alertModal.title}
        message={alertModal.message}
        onClose={() => setAlertModal({ ...alertModal, isOpen: false })}
        variant={alertModal.variant}
      />
    </div>
  )
}

export default UserManagement

