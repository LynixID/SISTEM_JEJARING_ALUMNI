import { useState, useEffect } from 'react'
import { useAuth } from '../../context/AuthContext'
import api from '../../services/api'
import AdminSidebar from '../../components/layout/AdminSidebar'
import Button from '../../components/common/Button'
import Card from '../../components/common/Card'
import AlertModal from '../../components/common/AlertModal'
import ConfirmModal from '../../components/common/ConfirmModal'
import Modal from '../../components/common/Modal'
import UserBadge from '../../components/common/UserBadge'
import { Trash2, MessageSquare, Users, Eye, Search, HelpCircle, Image as ImageIcon, Calendar } from 'lucide-react'
import { getImageUrl } from '../../utils/imageUtils'

const ManageForum = () => {
  const [threads, setThreads] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0
  })
  
  const [selectedThread, setSelectedThread] = useState(null)
  const [isDetailOpen, setIsDetailOpen] = useState(false)
  const [alertModal, setAlertModal] = useState({ isOpen: false, title: '', message: '', variant: 'info' })
  const [confirmModal, setConfirmModal] = useState({ 
    isOpen: false, 
    title: '', 
    message: '', 
    variant: 'warning',
    onConfirm: () => {}
  })

  useEffect(() => {
    fetchThreads()
  }, [pagination.page, search])

  const fetchThreads = async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams({
        page: pagination.page,
        limit: pagination.limit,
        search
      })

      const response = await api.get(`/admin/threads?${params}`)
      setThreads(response.data.threads)
      setPagination(response.data.pagination)
    } catch (error) {
      console.error('Error fetching threads:', error)
      setAlertModal({
        isOpen: true,
        title: 'Error',
        message: 'Gagal mengambil data forum thread',
        variant: 'error'
      })
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (threadId) => {
    setConfirmModal({
      isOpen: true,
      title: 'Hapus Forum Thread',
      message: 'Apakah Anda yakin ingin menghapus forum thread ini? Seluruh anggota dan riwayat pesan di dalam thread ini juga akan ikut terhapus secara permanen.',
      variant: 'danger',
      onConfirm: async () => {
        try {
          await api.delete(`/admin/threads/${threadId}`)
          fetchThreads()
          setIsDetailOpen(false)
          setAlertModal({
            isOpen: true,
            title: 'Berhasil',
            message: 'Forum thread berhasil dihapus',
            variant: 'success'
          })
        } catch (error) {
          setAlertModal({
            isOpen: true,
            title: 'Error',
            message: error.response?.data?.error || 'Gagal menghapus forum thread',
            variant: 'error'
          })
        }
      }
    })
  }

  const handleShowDetail = (thread) => {
    setSelectedThread(thread)
    setIsDetailOpen(true)
  }

  const formatDate = (dateString) => {
    const options = { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }
    return new Date(dateString).toLocaleDateString('id-ID', options)
  }

  return (
    <div className="min-h-screen bg-gray-50 flex">
      <AdminSidebar />
      
      <div className="flex-1 flex flex-col">
        <main className="flex-1 overflow-y-auto">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
            <div className="mb-6">
              <h1 className="text-3xl font-bold text-gray-900">Manajemen Forum</h1>
              <p className="text-gray-600 mt-1">Moderasi dan pantau seluruh forum diskusi / thread komunitas</p>
            </div>

            {/* Search Filter Card */}
            <Card className="p-4 mb-6">
              <div className="flex flex-col md:flex-row gap-4">
                <div className="relative flex-1">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Search className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    type="text"
                    placeholder="Cari forum berdasarkan judul, deskripsi, atau pembuat..."
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    value={search}
                    onChange={(e) => {
                      setSearch(e.target.value)
                      setPagination({ ...pagination, page: 1 })
                    }}
                  />
                </div>
                <Button onClick={fetchThreads} variant="outline" className="w-full md:w-auto px-6">
                  Refresh
                </Button>
              </div>
            </Card>

            {/* Threads Table Card */}
            <Card className="overflow-hidden">
              {loading ? (
                <div className="p-8 text-center text-gray-500">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
                  <p>Memuat data forum...</p>
                </div>
              ) : threads.length === 0 ? (
                <div className="p-12 text-center">
                  <div className="bg-gray-50 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 text-gray-400">
                    <HelpCircle size={32} />
                  </div>
                  <p className="text-gray-500">Tidak ada forum thread ditemukan</p>
                </div>
              ) : (
                <>
                  <div className="overflow-x-auto">
                    <table className="w-full text-left">
                      <thead className="bg-gray-50 border-b border-gray-200">
                        <tr>
                          <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider w-[100px]">Cover</th>
                          <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Judul & Deskripsi</th>
                          <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Pembuat</th>
                          <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider text-center">Statistik</th>
                          <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Dibuat</th>
                          <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider text-center">Aksi</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {threads.map((thread) => (
                          <tr key={thread.id} className="hover:bg-blue-50/30 transition-colors">
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="w-16 h-10 rounded-lg overflow-hidden border border-gray-100 bg-gray-100 flex items-center justify-center">
                                {thread.image ? (
                                  <img 
                                    src={getImageUrl(thread.image)} 
                                    alt={thread.title}
                                    className="w-full h-full object-cover"
                                  />
                                ) : (
                                  <ImageIcon size={16} className="text-gray-400" />
                                )}
                              </div>
                            </td>
                            <td className="px-6 py-4">
                              <div className="max-w-xs md:max-w-md">
                                <h3 className="text-sm font-bold text-gray-900 line-clamp-1">{thread.title}</h3>
                                <p className="text-xs text-gray-500 break-words line-clamp-2 mt-0.5">
                                  {thread.content}
                                </p>
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="flex items-center gap-2">
                                <img 
                                  src={thread.author.fotoProfil ? getImageUrl(thread.author.fotoProfil) : "https://via.placeholder.com/32"} 
                                  alt={thread.author.nama}
                                  className="w-7 h-7 rounded-full object-cover border border-gray-200"
                                />
                                <div>
                                  <div className="text-xs font-semibold text-gray-900 flex items-center">
                                    {thread.author.nama}
                                    <UserBadge role={thread.author.role} size="sm" />
                                  </div>
                                  <div className="text-[10px] text-gray-500">{thread.author.email}</div>
                                </div>
                              </div>
                            </td>
                            <td className="px-6 py-4 text-center whitespace-nowrap">
                              <div className="flex justify-center items-center gap-3 text-xs">
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 font-medium" title={`${thread.membersCount} Anggota`}>
                                  <Users size={12} />
                                  {thread.membersCount}
                                </span>
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 font-medium" title={`${thread.messagesCount} Pesan`}>
                                  <MessageSquare size={12} />
                                  {thread.messagesCount}
                                </span>
                              </div>
                            </td>
                            <td className="px-6 py-4 text-xs text-gray-500 whitespace-nowrap">
                              {formatDate(thread.createdAt)}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="flex justify-center gap-2">
                                <button 
                                  onClick={() => handleShowDetail(thread)}
                                  className="text-gray-400 hover:text-blue-600 transition-colors p-1"
                                  title="Lihat Detail"
                                >
                                  <Eye size={18} />
                                </button>
                                <button 
                                  onClick={() => handleDelete(thread.id)}
                                  className="text-gray-400 hover:text-red-600 transition-colors p-1"
                                  title="Hapus Forum"
                                >
                                  <Trash2 size={18} />
                                </button>
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
                      <p className="text-sm text-gray-500">
                        Menampilkan <span className="font-medium">{(pagination.page - 1) * pagination.limit + 1}</span> hingga{' '}
                        <span className="font-medium">{Math.min(pagination.page * pagination.limit, pagination.total)}</span> dari{' '}
                        <span className="font-medium">{pagination.total}</span> forum thread
                      </p>
                      <div className="flex gap-1.5">
                        <Button 
                          variant="outline" 
                          size="sm" 
                          disabled={pagination.page === 1}
                          onClick={() => setPagination({ ...pagination, page: pagination.page - 1 })}
                        >
                          Sebelumnya
                        </Button>
                        {[...Array(pagination.totalPages)].map((_, index) => (
                          <button
                            key={index + 1}
                            onClick={() => setPagination({ ...pagination, page: index + 1 })}
                            className={`px-3 py-1 rounded-lg text-sm font-medium transition-colors ${
                              pagination.page === index + 1 
                                ? 'bg-blue-600 text-white font-semibold' 
                                : 'bg-white text-gray-500 hover:bg-gray-100 border border-gray-200'
                            }`}
                          >
                            {index + 1}
                          </button>
                        ))}
                        <Button 
                          variant="outline" 
                          size="sm" 
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

      {/* Detail Modal */}
      {selectedThread && (
        <Modal
          isOpen={isDetailOpen}
          onClose={() => setIsDetailOpen(false)}
          title="Detail Forum Thread"
          size="lg"
        >
          <div className="space-y-6">
            {/* Cover Image */}
            {selectedThread.image && (
              <div className="border border-gray-100 rounded-2xl overflow-hidden bg-gray-50 flex items-center justify-center max-h-[250px]">
                <img 
                  src={getImageUrl(selectedThread.image)} 
                  alt="Thread cover" 
                  className="max-h-[250px] w-full object-cover"
                />
              </div>
            )}

            {/* Header info */}
            <div className="flex items-start justify-between border-b border-gray-100 pb-4">
              <div>
                <h2 className="text-xl font-bold text-gray-900">{selectedThread.title}</h2>
                <p className="text-xs text-gray-400 mt-1 flex items-center gap-1">
                  <Calendar size={12} />
                  Dibuat pada {formatDate(selectedThread.createdAt)}
                </p>
              </div>
              
              <Button 
                variant="danger" 
                size="sm" 
                onClick={() => handleDelete(selectedThread.id)}
                className="flex items-center gap-1.5"
              >
                <Trash2 size={14} />
                Hapus Forum
              </Button>
            </div>

            {/* Pembuat */}
            <div className="bg-gray-50 rounded-2xl p-4 flex items-center gap-3">
              <img 
                src={selectedThread.author.fotoProfil ? getImageUrl(selectedThread.author.fotoProfil) : "https://via.placeholder.com/40"} 
                alt={selectedThread.author.nama}
                className="w-10 h-10 rounded-full object-cover border border-gray-200"
              />
              <div>
                <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">Pembuat Forum</p>
                <h4 className="text-sm font-bold text-gray-900 flex items-center">
                  {selectedThread.author.nama}
                  <UserBadge role={selectedThread.author.role} size="sm" />
                </h4>
                <p className="text-xs text-gray-500">{selectedThread.author.email}</p>
              </div>
            </div>

            {/* Forum Description */}
            <div className="space-y-2">
              <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider">Deskripsi Forum</h4>
              <p className="text-sm text-gray-800 leading-relaxed whitespace-pre-wrap">
                {selectedThread.content}
              </p>
            </div>

            {/* Statistics */}
            <div className="grid grid-cols-2 gap-4 border-t border-gray-100 pt-4">
              <div className="bg-blue-50/50 rounded-xl p-3 text-center">
                <Users className="mx-auto text-blue-600 mb-1" size={20} />
                <span className="text-xs text-gray-500">Anggota Terdaftar</span>
                <p className="text-lg font-bold text-blue-700">{selectedThread.membersCount}</p>
              </div>
              <div className="bg-emerald-50/50 rounded-xl p-3 text-center">
                <MessageSquare className="mx-auto text-emerald-600 mb-1" size={20} />
                <span className="text-xs text-gray-500">Total Obrolan / Pesan</span>
                <p className="text-lg font-bold text-emerald-700">{selectedThread.messagesCount}</p>
              </div>
            </div>
          </div>
        </Modal>
      )}

      {/* Alerts & Confirmations */}
      <AlertModal
        isOpen={alertModal.isOpen}
        onClose={() => setAlertModal({ ...alertModal, isOpen: false })}
        title={alertModal.title}
        message={alertModal.message}
        variant={alertModal.variant}
      />

      <ConfirmModal
        isOpen={confirmModal.isOpen}
        onClose={() => setConfirmModal({ ...confirmModal, isOpen: false })}
        onConfirm={confirmModal.onConfirm}
        title={confirmModal.title}
        message={confirmModal.message}
        variant={confirmModal.variant}
      />
    </div>
  )
}

export default ManageForum
