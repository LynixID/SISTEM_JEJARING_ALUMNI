import { useState, useEffect } from 'react'
import { useParams, useNavigate, useLocation } from 'react-router-dom'
import { ArrowLeft, Heart, MessageCircle, Share2, MoreVertical, Trash2, Edit2, Globe, Lock, User, ChevronLeft, ChevronRight, X } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { getPostById, toggleLike, deletePost } from '../services/api'
import { getImageUrl } from '../utils/imageUtils'
import Header from '../components/layout/Header'
import Sidebar from '../components/layout/Sidebar'
import Card from '../components/common/Card'
import Button from '../components/common/Button'
import CommentSection from '../components/comment/CommentSection'
import EditPost from '../components/post/EditPost'
import AlertModal from '../components/common/AlertModal'
import ConfirmModal from '../components/common/ConfirmModal'
import { Loader } from 'lucide-react'
import { getSocket } from '../config/socket'
import ReportModal from '../components/common/ReportModal'
import LikesModal from '../components/post/LikesModal'

const PostDetail = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const location = useLocation()
  const { user, isAuthenticated, isLoading: authLoading } = useAuth()
  
  // State management
  const [post, setPost] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [isLiked, setIsLiked] = useState(false)
  const [likesCount, setLikesCount] = useState(0)
  const [commentsCount, setCommentsCount] = useState(0)
  const [showComments, setShowComments] = useState(true) // Auto show comments di detail
  const [showMenu, setShowMenu] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [alertModal, setAlertModal] = useState({ isOpen: false, title: '', message: '', variant: 'info' })
  const [confirmModal, setConfirmModal] = useState({ 
    isOpen: false, 
    title: '', 
    message: '', 
    variant: 'warning',
    onConfirm: () => {}
  })
  const [reportModal, setReportModal] = useState(false)
  const [showLikesModal, setShowLikesModal] = useState(false)

  // Lightbox Carousel States & Methods
  const [isLightboxOpen, setIsLightboxOpen] = useState(false)
  const [lightboxIndex, setLightboxIndex] = useState(0)
  const images = post?.images || []

  const openLightbox = (index) => {
    setLightboxIndex(index)
    setIsLightboxOpen(true)
    document.body.style.overflow = 'hidden'
  }

  const closeLightbox = () => {
    setIsLightboxOpen(false)
    document.body.style.overflow = 'unset'
  }

  const nextImage = (e) => {
    if (e) e.stopPropagation()
    setLightboxIndex((prev) => (prev === images.length - 1 ? 0 : prev + 1))
  }

  const prevImage = (e) => {
    if (e) e.stopPropagation()
    setLightboxIndex((prev) => (prev === 0 ? images.length - 1 : prev - 1))
  }

  const handleKeyDown = (e) => {
    if (e.key === 'ArrowRight') nextImage()
    if (e.key === 'ArrowLeft') prevImage()
    if (e.key === 'Escape') closeLightbox()
  }

  useEffect(() => {
    return () => {
      document.body.style.overflow = 'unset'
    }
  }, [])

  // Handle auto-open edit modal if state or query param is set
  useEffect(() => {
    if (post && (location.state?.openEdit || new URLSearchParams(location.search).get('edit') === 'true')) {
      setShowEditModal(true)
      // Bersihkan state/search param agar tidak memicu pop-up lagi saat reload
      navigate(location.pathname, { replace: true, state: {} })
    }
  }, [post, location, navigate])

  // Helper: render single image tile untuk grid (di detail BISA klik untuk perbesar lightbox)
  const renderImageTile = (img, idx, extraClass = '', overlayCount = null) => (
    <div
      key={img.id || idx}
      className={`relative overflow-hidden bg-gray-100 cursor-zoom-in group/tile ${extraClass}`}
      onClick={() => openLightbox(idx)}
    >
      <img
        src={getImageUrl(img.imageUrl)}
        alt={`Foto ${idx + 1}`}
        className="w-full h-full object-cover transition-transform duration-300 group-hover/tile:scale-[1.02]"
        draggable={false}
      />
      {/* Hover overlay shimmer */}
      <div className="absolute inset-0 bg-black opacity-0 group-hover/tile:opacity-10 transition-opacity duration-300" />
      {/* More images overlay (+N) */}
      {overlayCount !== null && (
        <div className="absolute inset-0 bg-black bg-opacity-55 flex items-center justify-center">
          <span className="text-white text-2xl font-bold">+{overlayCount}</span>
        </div>
      )}
    </div>
  )

  // Redirect ke login jika belum authenticated
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      navigate('/login', { replace: true })
    }
  }, [isAuthenticated, authLoading, navigate])

  // Fetch post detail saat component mount
  useEffect(() => {
    if (isAuthenticated && id) {
      fetchPost()
    }
  }, [id, isAuthenticated])

  // Setup Socket.io listener untuk real-time updates
  useEffect(() => {
    if (!post) return
    
    const socket = getSocket()
    
    const handlePostLiked = (data) => {
      if (data.postId === post.id) {
        setLikesCount(data.likesCount)
        if (data.userId === user?.id) {
          setIsLiked(data.action === 'like')
        }
      }
    }

    const handleNewComment = (comment) => {
      if (comment.postId === post.id) {
        setCommentsCount(prev => prev + 1)
      }
    }

    const handleCommentDeleted = (data) => {
      if (data.postId === post.id) {
        // Jika parent comment dihapus, semua replies juga ikut terhapus di backend
        const countToRemove = 1 + (data.repliesCount || 0)
        setCommentsCount(prev => Math.max(0, prev - countToRemove))
      }
    }

    const handlePostUpdated = (updatedPost) => {
      if (updatedPost.id === post.id) {
        setPost(updatedPost)
        if (updatedPost.likesCount !== undefined) setLikesCount(updatedPost.likesCount)
        if (updatedPost.commentsCount !== undefined) setCommentsCount(updatedPost.commentsCount)
        
        // Safety cap for lightbox index if images were removed
        const numImages = updatedPost.images?.length || 0
        setLightboxIndex(prev => {
          if (numImages === 0) return 0
          if (prev >= numImages) return numImages - 1
          return prev
        })
      }
    }

    socket.on('post_liked', handlePostLiked)
    socket.on('new_comment', handleNewComment)
    socket.on('comment_deleted', handleCommentDeleted)
    socket.on('post_updated', handlePostUpdated)

    return () => {
      socket.off('post_liked', handlePostLiked)
      socket.off('new_comment', handleNewComment)
      socket.off('comment_deleted', handleCommentDeleted)
      socket.off('post_updated', handlePostUpdated)
    }
  }, [post, user])


  // Fetch post dari API
  const fetchPost = async () => {
    try {
      setLoading(true)
      setError('')
      const response = await getPostById(id)
      const postData = response.data.post
      setPost(postData)
      setIsLiked(postData.isLiked || false)
      setLikesCount(postData.likesCount || 0)
      setCommentsCount(postData.commentsCount || 0)
    } catch (err) {
      console.error('Error fetching post:', err)
      setError(err.response?.data?.error || 'Gagal memuat postingan')
    } finally {
      setLoading(false)
    }
  }

  // Format date menjadi relative time
  const formatDate = (dateString) => {
    const date = new Date(dateString)
    const now = new Date()
    const diff = now - date
    const minutes = Math.floor(diff / 60000)
    const hours = Math.floor(diff / 3600000)
    const days = Math.floor(diff / 86400000)

    if (minutes < 1) return 'Baru saja'
    if (minutes < 60) return `${minutes} menit yang lalu`
    if (hours < 24) return `${hours} jam yang lalu`
    if (days < 7) return `${days} hari yang lalu`
    return date.toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })
  }

  // Check apakah post milik user saat ini
  const isOwnPost = user?.id === post?.author?.id

  // Handler untuk toggle like
  const handleLike = async () => {
    if (!post) return
    
    const newIsLiked = !isLiked
    setIsLiked(newIsLiked)
    setLikesCount(prev => newIsLiked ? prev + 1 : prev - 1)

    try {
      await toggleLike(post.id)
    } catch (err) {
      // Revert optimistic update jika error
      setIsLiked(!newIsLiked)
      setLikesCount(prev => newIsLiked ? prev - 1 : prev + 1)
      console.error('Error toggling like:', err)
    }
  }

  // Handler untuk delete post
  const handleDelete = async () => {
    setConfirmModal({
      isOpen: true,
      title: 'Hapus Post',
      message: 'Apakah Anda yakin ingin menghapus post ini?',
      variant: 'danger',
      onConfirm: async () => {
        try {
          await deletePost(post.id)
          setAlertModal({
            isOpen: true,
            title: 'Berhasil',
            message: 'Post berhasil dihapus',
            variant: 'success'
          })
          setTimeout(() => {
            navigate('/dashboard')
          }, 1500)
        } catch (err) {
          setAlertModal({
            isOpen: true,
            title: 'Error',
            message: err.response?.data?.error || 'Gagal menghapus post',
            variant: 'error'
          })
        }
      }
    })
  }

  // Handler untuk share post
  const handleShare = (e) => {
    if (e) {
      e.preventDefault()
      e.stopPropagation()
    }
    
    const postUrl = window.location.href // Sudah di halaman detail, jadi URL sudah benar
    const shareText = post?.content ? post.content.substring(0, 100) : 'Lihat postingan ini'
    
    console.log('Share clicked, URL:', postUrl) // Debug log
    
    if (navigator.share) {
      navigator.share({
        title: `Postingan dari ${post?.author?.nama || 'Alumni'}`,
        text: shareText,
        url: postUrl
      }).catch((err) => {
        // Jika user cancel share, tidak perlu tampilkan error
        if (err.name !== 'AbortError') {
          console.error('Error sharing:', err)
        }
      })
    } else {
      // Fallback: copy to clipboard
      navigator.clipboard.writeText(postUrl).then(() => {
        setAlertModal({
          isOpen: true,
          title: 'Berhasil',
          message: 'Link postingan berhasil disalin!',
          variant: 'success'
        })
      }).catch((err) => {
        console.error('Error copying to clipboard:', err)
        setAlertModal({
          isOpen: true,
          title: 'Error',
          message: 'Gagal menyalin link',
          variant: 'error'
        })
      })
    }
  }

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="flex">
          <Sidebar />
          <div className="flex-1 flex items-center justify-center min-h-[calc(100vh-4rem)]">
            <Loader className="animate-spin text-blue-600" size={32} />
          </div>
        </div>
      </div>
    )
  }

  if (error || !post) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="flex">
          <Sidebar />
          <main className="flex-1 p-6">
            <div className="max-w-4xl mx-auto">
              <Card className="p-12 text-center">
                <p className="text-red-600 mb-4">{error || 'Postingan tidak ditemukan'}</p>
                <Button onClick={() => navigate('/dashboard')}>
                  Kembali ke Dashboard
                </Button>
              </Card>
            </div>
          </main>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <div className="flex">
        <Sidebar />
        <main className="flex-1 p-6">
          <div className="max-w-4xl mx-auto">
            {/* Back Button */}
            <Button
              variant="outline"
              onClick={() => navigate('/dashboard')}
              className="mb-6 flex items-center gap-2"
            >
              <ArrowLeft size={18} />
              Kembali ke Dashboard
            </Button>

            <Card className="overflow-hidden">
              {/* Post Header */}
              <div className="p-6 border-b border-gray-200">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3 flex-1">
                    {/* Author avatar */}
                    <button
                      onClick={() => navigate(`/profil/${post.author.id}`)}
                      className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0 hover:ring-2 hover:ring-blue-300 transition-all cursor-pointer"
                    >
                      {post.author?.fotoProfil ? (
                        <img
                          src={getImageUrl(post.author.fotoProfil, 'profiles')}
                          alt={post.author.nama}
                          className="w-12 h-12 rounded-full object-cover"
                          onError={(e) => { e.target.style.display = 'none' }}
                        />
                      ) : (
                        <span className="text-blue-600 font-semibold text-lg">
                          {post.author?.nama?.charAt(0).toUpperCase()}
                        </span>
                      )}
                    </button>
                    {/* Author name dan timestamp */}
                    <div className="flex-1">
                      <button
                        onClick={() => navigate(`/profil/${post.author.id}`)}
                        className="text-left hover:opacity-80 transition-opacity"
                      >
                        <p className="font-semibold text-gray-900 hover:text-blue-600 text-lg">
                          {post.author?.nama}
                        </p>
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="text-sm text-gray-500">{formatDate(post.createdAt)}</p>
                          {/* Visibility badge di samping waktu */}
                          {post.visibility && (
                            <span className={`inline-flex items-center gap-1 px-2 py-0.5 text-xs font-medium rounded-full ${
                              post.visibility === 'PUBLIC' 
                                ? 'bg-blue-50 text-blue-600' 
                                : 'bg-gray-100 text-gray-700'
                            }`}>
                              {post.visibility === 'PUBLIC' ? <Globe size={12} /> : <Lock size={12} />}
                              {post.visibility === 'PUBLIC' ? 'Publik' : 'Hanya Koneksi'}
                            </span>
                          )}
                        </div>
                      </button>
                    </div>
                  </div>

                  {/* Edit/Delete menu untuk post owner */}
                  {isOwnPost && (
                    <div className="relative">
                      <button
                        onClick={() => setShowMenu(!showMenu)}
                        className="p-2 rounded-full hover:bg-gray-100"
                      >
                        <MoreVertical size={20} className="text-gray-600" />
                      </button>
                      {showMenu && (
                        <div className="absolute right-0 mt-2 w-40 bg-white border border-gray-200 rounded-lg shadow-lg z-10">
                          <button
                            onClick={() => {
                              setShowMenu(false)
                              setShowEditModal(true)
                            }}
                            className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-2"
                          >
                            <Edit2 size={16} />
                            Edit
                          </button>
                          <button
                            onClick={() => {
                              setShowMenu(false)
                              handleDelete()
                            }}
                            className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-gray-100 flex items-center gap-2"
                          >
                            <Trash2 size={16} />
                            Hapus
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Mentions */}
                {post.mentions && Array.isArray(post.mentions) && post.mentions.length > 0 && (
                  <div className="mb-4 flex items-center gap-2 flex-wrap text-base text-gray-600">
                    <User size={16} className="text-gray-400 flex-shrink-0" />
                    <span>bersama dengan</span>
                    {post.mentions.map((mention, index) => (
                      <span key={mention.id}>
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            navigate(`/profil/${mention.id}`)
                          }}
                          className="font-medium text-blue-600 hover:text-blue-700 hover:underline"
                        >
                          {mention.nama || mention.user?.nama || 'Seseorang'}
                        </button>
                        {index < post.mentions.length - 1 && <span>,</span>}
                      </span>
                    ))}
                  </div>
                )}

                {/* Post content text */}
                <div className="mb-4">
                  <p className="text-gray-900 whitespace-pre-wrap text-lg leading-relaxed">
                    {post.content}
                  </p>
                </div>

                {/* Post images — smart adaptive grid layout (klik untuk perbesar) */}
                {images.length > 0 && (
                  <div className="mb-4 rounded-xl overflow-hidden">

                    {/* 1 gambar: full width */}
                    {images.length === 1 && (
                      <div className="rounded-xl overflow-hidden aspect-[3/1] w-full bg-gray-50">
                        {renderImageTile(images[0], 0, 'h-full w-full')}
                      </div>
                    )}

                    {/* 2 gambar: [1, 2] berdampingan */}
                    {images.length === 2 && (
                      <div className="grid grid-cols-2 gap-1 rounded-xl overflow-hidden aspect-[3/1] w-full bg-gray-50">
                        {renderImageTile(images[0], 0, 'h-full w-full')}
                        {renderImageTile(images[1], 1, 'h-full w-full')}
                      </div>
                    )}

                    {/* 3 gambar: [1] atas-kiri, [2] bawah-kiri | [3] kanan-full */}
                    {images.length === 3 && (
                      <div className="grid grid-cols-2 grid-rows-2 gap-1 rounded-xl overflow-hidden aspect-[2/1] w-full bg-gray-50">
                        {renderImageTile(images[0], 0, 'col-start-1 row-start-1 w-full h-full')}
                        {renderImageTile(images[1], 1, 'col-start-1 row-start-2 w-full h-full')}
                        {renderImageTile(images[2], 2, 'col-start-2 row-start-1 row-span-2 w-full h-full')}
                      </div>
                    )}

                    {/* 4+ gambar: [1,2] / [3,4] grid simetris */}
                    {images.length >= 4 && (
                      <div className="grid grid-cols-2 grid-rows-2 gap-1 rounded-xl overflow-hidden aspect-[2/1] w-full bg-gray-50">
                        {renderImageTile(images[0], 0, 'col-start-1 row-start-1 w-full h-full')}
                        {renderImageTile(images[1], 1, 'col-start-2 row-start-1 w-full h-full')}
                        {renderImageTile(images[2], 2, 'col-start-1 row-start-2 w-full h-full')}
                        {renderImageTile(
                          images[3],
                          3,
                          'col-start-2 row-start-2 w-full h-full',
                          images.length > 4 ? images.length - 4 : null
                        )}
                      </div>
                    )}

                  </div>
                )}

                {/* Action buttons: Like, Comment, Share */}
                <div className="flex items-center gap-6 pt-4 border-t border-gray-200">
                  <div className="flex items-center gap-1">
                    <button
                      onClick={handleLike}
                      className={`flex items-center justify-center p-1.5 rounded-full hover:bg-red-50 transition-colors ${isLiked ? 'text-red-600' : 'text-gray-600'} hover:text-red-600`}
                    >
                      <Heart size={22} fill={isLiked ? 'currentColor' : 'none'} />
                    </button>
                    <button
                      onClick={() => likesCount > 0 && setShowLikesModal(true)}
                      className={`text-base font-medium transition-colors ${likesCount > 0 ? 'hover:text-blue-600 cursor-pointer hover:underline' : 'cursor-default text-gray-600'}`}
                    >
                      {likesCount}
                    </button>
                  </div>

                  <button
                    onClick={() => setShowComments(!showComments)}
                    className="flex items-center gap-2 text-gray-600 hover:text-blue-600 transition-colors"
                  >
                    <MessageCircle size={22} />
                    <span className="text-base font-medium">{commentsCount}</span>
                  </button>

                  <button
                    onClick={handleShare}
                    className="flex items-center gap-2 text-gray-600 hover:text-green-600 transition-colors cursor-pointer"
                    type="button"
                  >
                    <Share2 size={22} />
                    <span className="text-base">Bagikan</span>
                  </button>

                  {/* Tombol Laporkan — hanya untuk post milik orang lain */}
                  {!isOwnPost && (
                    <button
                      onClick={() => setReportModal(true)}
                      className="ml-auto flex items-center gap-1.5 text-gray-400 hover:text-red-500 transition-colors text-sm"
                      title="Laporkan postingan ini"
                    >
                      🚩 Laporkan
                    </button>
                  )}
                </div>
              </div>

              {/* Comments section */}
              {showComments && post?.id && (
                <div className="p-6 bg-gray-50">
                  <CommentSection 
                    key={post.id} 
                    postId={post.id} 
                    onCommentAdded={() => setCommentsCount(prev => prev + 1)}
                    onCommentDeleted={() => setCommentsCount(prev => Math.max(0, prev - 1))}
                  />
                </div>
              )}
            </Card>
          </div>
        </main>
      </div>

      {/* Edit post modal */}
      <EditPost
        isOpen={showEditModal}
        onClose={() => setShowEditModal(false)}
        post={post}
        onPostUpdated={() => {
          setShowEditModal(false)
          fetchPost() // Refresh post data
        }}
      />

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

      {/* Report Modal */}
      <ReportModal
        isOpen={reportModal}
        onClose={() => setReportModal(false)}
        targetType="POST"
        targetId={post?.id}
        targetName={post?.content}
      />

      {/* Likes Modal */}
      <LikesModal
        isOpen={showLikesModal}
        onClose={() => setShowLikesModal(false)}
        postId={post?.id}
      />

      {/* Lightbox Modal */}
      {isLightboxOpen && images.length > 0 && (
        <div 
          className="fixed inset-0 z-[100] bg-black bg-opacity-97 flex flex-col outline-none"
          onClick={closeLightbox}
          onKeyDown={handleKeyDown}
          tabIndex={0}
          ref={(el) => el && el.focus()}
        >
          {/* Top Bar */}
          <div className="flex justify-between items-center px-4 py-3 flex-shrink-0" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center overflow-hidden flex-shrink-0">
                {post.author?.fotoProfil ? (
                  <img src={getImageUrl(post.author.fotoProfil, 'profiles')} alt="" className="w-full h-full object-cover" />
                ) : (
                  <span className="text-blue-600 text-xs font-bold">{post.author?.nama?.charAt(0).toUpperCase()}</span>
                )}
              </div>
              <span className="text-white text-sm font-medium select-none">{post.author?.nama}</span>
              <span className="text-gray-500 text-xs select-none">•</span>
              <span className="bg-white bg-opacity-15 text-white text-xs px-2.5 py-0.5 rounded-full font-medium select-none">
                {lightboxIndex + 1} / {images.length}
              </span>
            </div>
            <button 
              onClick={closeLightbox}
              className="text-gray-400 hover:text-white bg-white bg-opacity-10 hover:bg-opacity-20 rounded-full p-2 transition-all"
            >
              <X size={20} />
            </button>
          </div>

          {/* Main Image Area */}
          <div className="flex-1 flex items-center justify-center relative w-full select-none min-h-0">
            {/* Left arrow */}
            {images.length > 1 && (
              <button 
                onClick={prevImage}
                className="absolute left-3 sm:left-5 z-10 text-white bg-white bg-opacity-10 hover:bg-opacity-25 p-2.5 rounded-full transition-all border border-white border-opacity-10 hover:border-opacity-30"
              >
                <ChevronLeft size={22} />
              </button>
            )}

            {/* Current Image */}
            <div 
              className="max-w-[92vw] max-h-[75vh] flex items-center justify-center" 
              onClick={(e) => e.stopPropagation()}
            >
              <img 
                src={getImageUrl(images[lightboxIndex]?.imageUrl)} 
                alt={`Foto ${lightboxIndex + 1}`}
                className="max-w-full max-h-[75vh] object-contain rounded-xl shadow-2xl"
                draggable={false}
              />
            </div>

            {/* Right arrow */}
            {images.length > 1 && (
              <button 
                onClick={nextImage}
                className="absolute right-3 sm:right-5 z-10 text-white bg-white bg-opacity-10 hover:bg-opacity-25 p-2.5 rounded-full transition-all border border-white border-opacity-10 hover:border-opacity-30"
              >
                <ChevronRight size={22} />
              </button>
            )}
          </div>

          {/* Bottom: Thumbnail strip (hanya jika > 1 gambar) */}
          {images.length > 1 && (
            <div 
              className="flex-shrink-0 flex items-center justify-center gap-2 py-3 px-4 overflow-x-auto"
              onClick={(e) => e.stopPropagation()}
            >
              {images.map((img, idx) => (
                <button
                  key={img.id || idx}
                  onClick={(e) => { e.stopPropagation(); setLightboxIndex(idx) }}
                  className={`flex-shrink-0 w-12 h-12 rounded-lg overflow-hidden border-2 transition-all duration-200 ${
                    lightboxIndex === idx 
                      ? 'border-blue-400 scale-110 shadow-lg shadow-blue-500/30' 
                      : 'border-transparent opacity-50 hover:opacity-80'
                  }`}
                >
                  <img 
                    src={getImageUrl(img.imageUrl)} 
                    alt={`Thumbnail ${idx + 1}`}
                    className="w-full h-full object-cover"
                    draggable={false}
                  />
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export default PostDetail

