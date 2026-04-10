import { useState, useEffect } from 'react'
import { useAuth } from '../../context/AuthContext'
import api from '../../services/api'
import AdminSidebar from '../../components/layout/AdminSidebar'
import Button from '../../components/common/Button'
import Card from '../../components/common/Card'
import Input from '../../components/common/Input'
import AlertModal from '../../components/common/AlertModal'
import ConfirmModal from '../../components/common/ConfirmModal'
import { Trash2, MessageCircle, ExternalLink, Search, MoreVertical } from 'lucide-react'
import { Link } from 'react-router-dom'
import { getImageUrl } from '../../utils/imageUtils'

const ManageComments = () => {
  const [comments, setComments] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [selectedComments, setSelectedComments] = useState([])
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

  useEffect(() => {
    fetchComments()
  }, [pagination.page, search])

  const fetchComments = async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams({
        page: pagination.page,
        limit: pagination.limit,
        search
      })

      const response = await api.get(`/admin/comments?${params}`)
      setComments(response.data.comments)
      setPagination(response.data.pagination)
    } catch (error) {
      console.error('Error fetching comments:', error)
      setAlertModal({
        isOpen: true,
        title: 'Error',
        message: 'Gagal mengambil data komentar',
        variant: 'error'
      })
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (commentId) => {
    setConfirmModal({
      isOpen: true,
      title: 'Hapus Komentar',
      message: 'Apakah Anda yakin ingin menghapus komentar ini? Balasan (replies) juga akan terhapus.',
      variant: 'danger',
      onConfirm: async () => {
        try {
          await api.delete(`/admin/comments/${commentId}`)
          fetchComments()
          setAlertModal({
            isOpen: true,
            title: 'Berhasil',
            message: 'Komentar berhasil dihapus',
            variant: 'success'
          })
        } catch (error) {
          setAlertModal({
            isOpen: true,
            title: 'Error',
            message: error.response?.data?.error || 'Gagal menghapus komentar',
            variant: 'error'
          })
        }
      }
    })
  }

  const handleBulkDelete = async () => {
    if (selectedComments.length === 0) return

    setConfirmModal({
      isOpen: true,
      title: 'Hapus Massal',
      message: `Apakah Anda yakin ingin menghapus ${selectedComments.length} komentar terpilih?`,
      variant: 'danger',
      onConfirm: async () => {
        try {
          await api.delete('/admin/comments', { data: { ids: selectedComments } })
          setSelectedComments([])
          fetchComments()
          setAlertModal({
            isOpen: true,
            title: 'Berhasil',
            message: 'Komentar berhasil dihapus secara massal',
            variant: 'success'
          })
        } catch (error) {
          setAlertModal({
            isOpen: true,
            title: 'Error',
            message: error.response?.data?.error || 'Gagal menghapus komentar',
            variant: 'error'
          })
        }
      }
    })
  }

  const toggleSelectComment = (id) => {
    if (selectedComments.includes(id)) {
      setSelectedComments(selectedComments.filter(item => item !== id))
    } else {
      setSelectedComments([...selectedComments, id])
    }
  }

  const toggleSelectAll = () => {
    if (selectedComments.length === comments.length) {
      setSelectedComments([])
    } else {
      setSelectedComments(comments.map(c => c.id))
    }
  }

  const formatDate = (dateString) => {
    const options = { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }
    return new Date(dateString).toLocaleDateString('id-ID', options)
  }

  return (
    <div className="min-h-screen bg-gray-50 flex">
      <AdminSidebar />
      
      <div className="flex-1 flex flex-col h-screen overflow-hidden">
        <main className="flex-1 overflow-y-auto">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Manajemen Komentar</h1>
                <p className="text-gray-600 mt-1">Moderasi seluruh komentar di platform</p>
              </div>
              
              {selectedComments.length > 0 && (
                <Button 
                  variant="danger" 
                  onClick={handleBulkDelete}
                  className="flex items-center gap-2"
                >
                  <Trash2 size={18} />
                  Hapus Terpilih ({selectedComments.length})
                </Button>
              )}
            </div>

            {/* Main Content */}
            <Card className="mb-6 p-4">
              <div className="flex flex-col md:flex-row gap-4 mb-6">
                <div className="relative flex-1">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Search className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    type="text"
                    placeholder="Cari konten komentar..."
                    className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-xl bg-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    value={search}
                    onChange={(e) => {
                      setSearch(e.target.value)
                      setPagination({ ...pagination, page: 1 })
                    }}
                  />
                </div>
                <Button onClick={fetchComments} variant="outline" className="md:w-32">
                  Refresh
                </Button>
              </div>

              {/* Comments Table */}
              <div className="overflow-x-auto border border-gray-100 rounded-xl">
                {loading ? (
                  <div className="p-12 text-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
                    <p className="text-gray-500">Memuat data komentar...</p>
                  </div>
                ) : comments.length === 0 ? (
                  <div className="p-12 text-center">
                    <div className="bg-gray-50 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 text-gray-400">
                      <MessageCircle size={32} />
                    </div>
                    <p className="text-gray-500">Tidak ada komentar ditemukan</p>
                  </div>
                ) : (
                  <table className="w-full text-left">
                    <thead className="bg-gray-50 border-b border-gray-100">
                      <tr>
                        <th className="px-6 py-4">
                          <input 
                            type="checkbox" 
                            className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 h-4 w-4"
                            checked={selectedComments.length === comments.length && comments.length > 0}
                            onChange={toggleSelectAll}
                          />
                        </th>
                        <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Isi Komentar</th>
                        <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Penulis</th>
                        <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Post Terkait</th>
                        <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Waktu</th>
                        <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Aksi</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                      {comments.map((comment) => (
                        <tr key={comment.id} className="hover:bg-blue-50/30 transition-colors">
                          <td className="px-6 py-4">
                            <input 
                              type="checkbox" 
                              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 h-4 w-4"
                              checked={selectedComments.includes(comment.id)}
                              onChange={() => toggleSelectComment(comment.id)}
                            />
                          </td>
                          <td className="px-6 py-4">
                            <div className="max-w-xs md:max-w-md">
                              <p className="text-sm text-gray-900 break-words line-clamp-3">
                                {comment.content}
                              </p>
                              {comment._count.replies > 0 && (
                                <span className="inline-flex items-center mt-1 px-2 py-0.5 rounded text-xs font-medium bg-blue-50 text-blue-700">
                                  {comment._count.replies} Balasan
                                </span>
                              )}
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-3">
                              <Link 
                                to={`/profil/${comment.author.id}`} 
                                className="flex items-center gap-3 group"
                                title="Lihat Profil"
                              >
                                <img 
                                  src={comment.author.profile?.fotoProfil ? getImageUrl(comment.author.profile.fotoProfil) : "https://via.placeholder.com/40"} 
                                  alt={comment.author.nama}
                                  className="w-8 h-8 rounded-full object-cover border border-gray-200 group-hover:border-blue-400 transition-colors"
                                />
                                <div className="text-sm font-medium text-gray-900 group-hover:text-blue-600 transition-colors">
                                  {comment.author.nama}
                                </div>
                              </Link>
                            </div>
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-500">
                            <div className="flex items-center gap-1 text-blue-600 hover:text-blue-800">
                              <Link to={`/post/${comment.postId}`} target="_blank" className="truncate max-w-[150px]">
                                {comment.post?.content || "Lihat Post"}
                              </Link>
                              <ExternalLink size={14} />
                            </div>
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-500 whitespace-nowrap">
                            {formatDate(comment.createdAt)}
                          </td>
                          <td className="px-6 py-4">
                            <button 
                              onClick={() => handleDelete(comment.id)}
                              className="text-gray-400 hover:text-red-500 transition-colors p-1"
                              title="Hapus Komentar"
                            >
                              <Trash2 size={18} />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>

              {/* Pagination */}
              {!loading && pagination.totalPages > 1 && (
                <div className="flex items-center justify-between mt-6 px-2">
                  <p className="text-sm text-gray-500">
                    Menampilkan <span className="font-medium">{(pagination.page - 1) * pagination.limit + 1}</span> hingga{' '}
                    <span className="font-medium">{Math.min(pagination.page * pagination.limit, pagination.total)}</span> dari{' '}
                    <span className="font-medium">{pagination.total}</span> komentar
                  </p>
                  <div className="flex gap-2">
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
                            ? 'bg-blue-600 text-white' 
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
                      Berikutnya
                    </Button>
                  </div>
                </div>
              )}
            </Card>
          </div>
        </main>
      </div>

      {/* Modals */}
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

export default ManageComments
