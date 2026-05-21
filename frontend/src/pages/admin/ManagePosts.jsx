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
import { Trash2, Heart, MessageCircle, Eye, Search, FileText, Image as ImageIcon, Calendar, X, ChevronLeft, ChevronRight } from 'lucide-react'
import { Link } from 'react-router-dom'
import { getImageUrl } from '../../utils/imageUtils'

const ManagePosts = () => {
  const [posts, setPosts] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0
  })
  
  const [selectedPost, setSelectedPost] = useState(null)
  const [isDetailOpen, setIsDetailOpen] = useState(false)
  const [isLightboxOpen, setIsLightboxOpen] = useState(false)
  const [lightboxIndex, setLightboxIndex] = useState(0)
  const [alertModal, setAlertModal] = useState({ isOpen: false, title: '', message: '', variant: 'info' })
  const [confirmModal, setConfirmModal] = useState({ 
    isOpen: false, 
    title: '', 
    message: '', 
    variant: 'warning',
    onConfirm: () => {}
  })

  useEffect(() => {
    fetchPosts()
  }, [pagination.page, search])

  const fetchPosts = async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams({
        page: pagination.page,
        limit: pagination.limit,
        search
      })

      const response = await api.get(`/admin/posts?${params}`)
      setPosts(response.data.posts)
      setPagination(response.data.pagination)
    } catch (error) {
      console.error('Error fetching posts:', error)
      setAlertModal({
        isOpen: true,
        title: 'Error',
        message: 'Gagal mengambil data postingan',
        variant: 'error'
      })
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (postId) => {
    setConfirmModal({
      isOpen: true,
      title: 'Hapus Postingan',
      message: 'Apakah Anda yakin ingin menghapus postingan ini? Tindakan ini tidak dapat dibatalkan dan semua data terkait seperti komentar dan likes akan ikut terhapus.',
      variant: 'danger',
      onConfirm: async () => {
        try {
          await api.delete(`/admin/posts/${postId}`)
          fetchPosts()
          setIsDetailOpen(false)
          setAlertModal({
            isOpen: true,
            title: 'Berhasil',
            message: 'Postingan berhasil dihapus',
            variant: 'success'
          })
        } catch (error) {
          setAlertModal({
            isOpen: true,
            title: 'Error',
            message: error.response?.data?.error || 'Gagal menghapus postingan',
            variant: 'error'
          })
        }
      }
    })
  }

  const handleShowDetail = (post) => {
    setSelectedPost(post)
    setIsDetailOpen(true)
    setIsLightboxOpen(false)
  }

  const openLightbox = (index) => {
    setLightboxIndex(index)
    setIsLightboxOpen(true)
  }

  const closeLightbox = () => {
    setIsLightboxOpen(false)
  }

  const nextImage = (e) => {
    if (e) e.stopPropagation()
    const imgs = selectedPost?.images || []
    setLightboxIndex((prev) => (prev === imgs.length - 1 ? 0 : prev + 1))
  }

  const prevImage = (e) => {
    if (e) e.stopPropagation()
    const imgs = selectedPost?.images || []
    setLightboxIndex((prev) => (prev === 0 ? imgs.length - 1 : prev - 1))
  }

  const handleKeyDown = (e) => {
    if (e.key === 'ArrowRight') nextImage()
    if (e.key === 'ArrowLeft') prevImage()
    if (e.key === 'Escape') closeLightbox()
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
              <h1 className="text-3xl font-bold text-gray-900">Manajemen Postingan</h1>
              <p className="text-gray-600 mt-1">Moderasi dan manajemen seluruh postingan alumni di platform</p>
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
                    placeholder="Cari postingan berdasarkan konten, nama, atau email..."
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    value={search}
                    onChange={(e) => {
                      setSearch(e.target.value)
                      setPagination({ ...pagination, page: 1 })
                    }}
                  />
                </div>
                <Button onClick={fetchPosts} variant="outline" className="w-full md:w-auto px-6">
                  Refresh
                </Button>
              </div>
            </Card>

            {/* Posts Table Card */}
            <Card className="overflow-hidden">
              {loading ? (
                <div className="p-8 text-center text-gray-500">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
                  <p>Memuat data postingan...</p>
                </div>
              ) : posts.length === 0 ? (
                <div className="p-12 text-center">
                  <div className="bg-gray-50 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 text-gray-400">
                    <FileText size={32} />
                  </div>
                  <p className="text-gray-500">Tidak ada postingan ditemukan</p>
                </div>
              ) : (
                <>
                  <div className="overflow-x-auto">
                    <table className="w-full text-left">
                      <thead className="bg-gray-50 border-b border-gray-200">
                        <tr>
                          <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Penulis</th>
                          <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Konten</th>
                          <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider text-center">Interaksi</th>
                          <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Waktu</th>
                          <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider text-center">Aksi</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {posts.map((post) => (
                          <tr key={post.id} className="hover:bg-blue-50/30 transition-colors">
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="flex items-center gap-3">
                                <img 
                                  src={post.author.fotoProfil ? getImageUrl(post.author.fotoProfil) : "https://via.placeholder.com/40"} 
                                  alt={post.author.nama}
                                  className="w-9 h-9 rounded-full object-cover border border-gray-200"
                                />
                                <div>
                                  <div className="text-sm font-semibold text-gray-900 flex items-center">
                                    {post.author.nama}
                                    <UserBadge role={post.author.role} />
                                  </div>
                                  <div className="text-xs text-gray-500">{post.author.email}</div>
                                </div>
                              </div>
                            </td>
                            <td className="px-6 py-4">
                              <div className="max-w-xs md:max-w-md">
                                <p className="text-sm text-gray-900 break-words line-clamp-2">
                                  {post.content}
                                </p>
                                {post.images && post.images.length > 0 && (
                                  <span className="inline-flex items-center mt-1 gap-1 px-2 py-0.5 rounded text-xs font-medium bg-blue-50 text-blue-700">
                                    <ImageIcon size={12} />
                                    {post.images.length} Gambar
                                  </span>
                                )}
                              </div>
                            </td>
                            <td className="px-6 py-4 text-center whitespace-nowrap">
                              <div className="flex justify-center items-center gap-4 text-xs text-gray-500">
                                <span className="flex items-center gap-1" title={`${post.likesCount} Suka`}>
                                  <Heart size={14} className="text-red-500 fill-red-500" />
                                  {post.likesCount}
                                </span>
                                <span className="flex items-center gap-1" title={`${post.commentsCount} Komentar`}>
                                  <MessageCircle size={14} className="text-blue-500 fill-blue-50" />
                                  {post.commentsCount}
                                </span>
                              </div>
                            </td>
                            <td className="px-6 py-4 text-sm text-gray-500 whitespace-nowrap">
                              {formatDate(post.createdAt)}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="flex justify-center gap-2">
                                <button 
                                  onClick={() => handleShowDetail(post)}
                                  className="text-gray-400 hover:text-blue-600 transition-colors p-1"
                                  title="Lihat Detail"
                                >
                                  <Eye size={18} />
                                </button>
                                <button 
                                  onClick={() => handleDelete(post.id)}
                                  className="text-gray-400 hover:text-red-600 transition-colors p-1"
                                  title="Hapus Postingan"
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
                        <span className="font-medium">{pagination.total}</span> postingan
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
      {selectedPost && (
        <Modal
          isOpen={isDetailOpen}
          onClose={() => setIsDetailOpen(false)}
          title="Detail Postingan"
          size="lg"
        >
          <div className="space-y-6">
            {/* Header info */}
            <div className="flex items-start justify-between border-b border-gray-100 pb-4">
              <div className="flex gap-3">
                <img 
                  src={selectedPost.author.fotoProfil ? getImageUrl(selectedPost.author.fotoProfil) : "https://via.placeholder.com/40"} 
                  alt={selectedPost.author.nama}
                  className="w-12 h-12 rounded-full object-cover border border-gray-200"
                />
                <div>
                  <h4 className="text-base font-bold text-gray-900 flex items-center">
                    {selectedPost.author.nama}
                    <UserBadge role={selectedPost.author.role} />
                  </h4>
                  <p className="text-xs text-gray-500">{selectedPost.author.email}</p>
                  <p className="text-xs text-gray-400 mt-1 flex items-center gap-1">
                    <Calendar size={12} />
                    {formatDate(selectedPost.createdAt)}
                  </p>
                </div>
              </div>
              
              <Button 
                variant="danger" 
                size="sm" 
                onClick={() => handleDelete(selectedPost.id)}
                className="flex items-center gap-1.5"
              >
                <Trash2 size={14} />
                Hapus Post
              </Button>
            </div>

            {/* Post Content */}
            <div className="text-sm text-gray-800 leading-relaxed whitespace-pre-wrap">
              {selectedPost.content}
            </div>

            {/* Post Media */}
            {selectedPost.images && selectedPost.images.length > 0 && (
              <div className="mb-3">
                {selectedPost.images.length === 1 && (
                  <div className="rounded-xl overflow-hidden border border-gray-100 shadow-sm cursor-zoom-in">
                    <img
                      src={getImageUrl(selectedPost.images[0].imageUrl)}
                      alt="Post"
                      className="w-full max-h-[350px] object-cover hover:scale-[1.01] transition-transform duration-500 animate-fade-in"
                      onClick={() => openLightbox(0)}
                    />
                  </div>
                )}

                {selectedPost.images.length === 2 && (
                  <div className="grid grid-cols-2 gap-1.5 rounded-xl overflow-hidden border border-gray-100 shadow-sm cursor-zoom-in">
                    {selectedPost.images.slice(0, 2).map((img, index) => (
                      <img
                        key={img.id || index}
                        src={getImageUrl(img.imageUrl)}
                        alt={`Post ${index + 1}`}
                        className="w-full h-48 object-cover hover:opacity-95 transition-opacity"
                        onClick={() => openLightbox(index)}
                      />
                    ))}
                  </div>
                )}

                {selectedPost.images.length === 3 && (
                  <div className="grid grid-cols-3 gap-1.5 rounded-xl overflow-hidden border border-gray-100 shadow-sm cursor-zoom-in h-60">
                    <div className="col-span-2 h-full">
                      <img
                        src={getImageUrl(selectedPost.images[0].imageUrl)}
                        alt="Post 1"
                        className="w-full h-full object-cover hover:opacity-95 transition-opacity"
                        onClick={() => openLightbox(0)}
                      />
                    </div>
                    <div className="grid grid-rows-2 gap-1.5 h-full">
                      {selectedPost.images.slice(1, 3).map((img, index) => (
                        <img
                          key={img.id || index}
                          src={getImageUrl(img.imageUrl)}
                          alt={`Post ${index + 2}`}
                          className="w-full h-full object-cover hover:opacity-95 transition-opacity"
                          onClick={() => openLightbox(index + 1)}
                        />
                      ))}
                    </div>
                  </div>
                )}

                {selectedPost.images.length >= 4 && (
                  <div className="grid grid-cols-2 gap-1.5 rounded-xl overflow-hidden border border-gray-100 shadow-sm cursor-zoom-in">
                    {selectedPost.images.slice(0, 3).map((img, index) => (
                      <img
                        key={img.id || index}
                        src={getImageUrl(img.imageUrl)}
                        alt={`Post ${index + 1}`}
                        className="w-full h-36 object-cover hover:opacity-95 transition-opacity"
                        onClick={() => openLightbox(index)}
                      />
                    ))}
                    <div className="relative h-36">
                      <img
                        src={getImageUrl(selectedPost.images[3].imageUrl)}
                        alt="Post 4"
                        className="w-full h-full object-cover"
                        onClick={() => openLightbox(3)}
                      />
                      {selectedPost.images.length > 4 && (
                        <div
                          onClick={() => openLightbox(3)}
                          className="absolute inset-0 bg-black bg-opacity-60 flex items-center justify-center text-white text-lg font-bold cursor-pointer hover:bg-opacity-50 transition-all"
                        >
                          +{selectedPost.images.length - 3}
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Stats Footer */}
            <div className="flex items-center gap-6 border-t border-gray-100 pt-4 text-sm text-gray-500">
              <span className="flex items-center gap-1.5">
                <Heart size={16} className="text-red-500 fill-red-500" />
                <strong>{selectedPost.likesCount}</strong> Menyukai
              </span>
              <span className="flex items-center gap-1.5">
                <MessageCircle size={16} className="text-blue-500 fill-blue-50" />
                <strong>{selectedPost.commentsCount}</strong> Komentar
              </span>
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

      {/* Lightbox Carousel Modal */}
      {isLightboxOpen && selectedPost && selectedPost.images && selectedPost.images.length > 0 && (
        <div 
          className="fixed inset-0 z-[110] bg-black bg-opacity-95 flex flex-col justify-between p-4 outline-none"
          onClick={closeLightbox}
          onKeyDown={handleKeyDown}
          tabIndex={0}
          ref={(el) => el && el.focus()}
        >
          {/* Top Bar */}
          <div className="flex justify-between items-center w-full z-10 p-2">
            <span className="text-white text-sm font-semibold select-none">
              {lightboxIndex + 1} / {selectedPost.images.length}
            </span>
            <button 
              onClick={closeLightbox}
              className="text-white hover:text-red-500 bg-white bg-opacity-10 hover:bg-opacity-25 rounded-full p-2 transition-all"
            >
              <X size={24} />
            </button>
          </div>

          {/* Main Content Area */}
          <div className="flex-1 flex items-center justify-center relative w-full select-none">
            {/* Left navigation */}
            {selectedPost.images.length > 1 && (
              <button 
                onClick={prevImage}
                className="absolute left-2 sm:left-4 z-10 text-white hover:text-blue-500 bg-black bg-opacity-50 hover:bg-opacity-70 p-2.5 rounded-full transition-all border border-gray-800"
              >
                <ChevronLeft size={24} />
              </button>
            )}

            {/* Current Image */}
            <div className="max-w-[90vw] max-h-[80vh] flex items-center justify-center p-2" onClick={(e) => e.stopPropagation()}>
              <img 
                src={getImageUrl(selectedPost.images[lightboxIndex]?.imageUrl)} 
                alt={`Slide ${lightboxIndex + 1}`}
                className="max-w-full max-h-[70vh] sm:max-h-[80vh] object-contain rounded-lg shadow-2xl transition-all duration-300"
              />
            </div>

            {/* Right navigation */}
            {selectedPost.images.length > 1 && (
              <button 
                onClick={nextImage}
                className="absolute right-2 sm:right-4 z-10 text-white hover:text-blue-500 bg-black bg-opacity-50 hover:bg-opacity-70 p-2.5 rounded-full transition-all border border-gray-800"
              >
                <ChevronRight size={24} />
              </button>
            )}
          </div>

          {/* Bottom Caption Area */}
          <div className="text-center text-gray-300 text-xs sm:text-sm max-w-2xl mx-auto p-4 z-10 bg-black bg-opacity-40 rounded-lg select-none mb-2 border border-gray-900">
            {selectedPost.content.length > 120 ? `${selectedPost.content.substring(0, 120)}...` : selectedPost.content}
          </div>
        </div>
      )}
    </div>
  )
}

export default ManagePosts
