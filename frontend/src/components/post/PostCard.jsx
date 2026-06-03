import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { toggleLike, deletePost } from '../../services/api'
import { getSocket } from '../../config/socket'
import { getImageUrl } from '../../utils/imageUtils'
import Card from '../common/Card'
import Button from '../common/Button'
import AlertModal from '../common/AlertModal'
import ConfirmModal from '../common/ConfirmModal'
import UserBadge from '../common/UserBadge'
import { Heart, MessageCircle, Share2, MoreVertical, Trash2, Edit2, Globe, Lock, User } from 'lucide-react'
import CommentSection from '../comment/CommentSection'
import LikesModal from './LikesModal'

// Helper: potong teks dengan ellipsis jika exceeds maxLength
const truncateText = (text, maxLength) => {
  if (!text || text.length <= maxLength) return text
  return text.substring(0, maxLength) + '...'
}

const PostCard = ({ post, onPostDeleted, onPostUpdated }) => {
  const { user } = useAuth()
  const navigate = useNavigate()

  // State untuk deteksi lebar layar (responsive breakpoints)
  // sm: 640px+ (tablet), md: 768px+ (tablet besar/desktop kecil)
  // Di bawah sm = phone
  const [windowWidth, setWindowWidth] = useState(
    typeof window !== 'undefined' ? window.innerWidth : 1200
  )

  useEffect(() => {
    const handleResize = () => setWindowWidth(window.innerWidth)
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  // State management
  const [localPost, setLocalPost] = useState(post)
  const [isLiked, setIsLiked] = useState(post.isLiked || false)
  const [likesCount, setLikesCount] = useState(post.likesCount || 0)
  const [commentsCount, setCommentsCount] = useState(post.commentsCount || 0)
  const [showComments, setShowComments] = useState(false)
  const [loading, setLoading] = useState(false)
  const [showMenu, setShowMenu] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [showLikesModal, setShowLikesModal] = useState(false)
  const [alertModal, setAlertModal] = useState({ isOpen: false, title: '', message: '', variant: 'info' })
  const [confirmModal, setConfirmModal] = useState({ 
    isOpen: false, 
    title: '', 
    message: '', 
    variant: 'warning',
    onConfirm: () => {}
  })

  // Sync state if post prop changes from parent
  useEffect(() => {
    setLocalPost(post)
    setIsLiked(post.isLiked || false)
    setLikesCount(post.likesCount || 0)
    setCommentsCount(post.commentsCount || 0)
  }, [post])

  const images = localPost.images || []

  // Helper: render single image tile untuk grid (di feed TIDAK bisa klik untuk perbesar)
  const renderImageTile = (img, idx, extraClass = '', overlayCount = null) => (
    <div
      key={img.id || idx}
      className={`relative overflow-hidden bg-gray-100 group/tile ${extraClass}`}
    >
      <img
        src={getImageUrl(img.imageUrl)}
        alt={`Foto ${idx + 1}`}
        className="w-full h-full object-cover"
        draggable={false}
      />
      {/* More images overlay (+N) */}
      {overlayCount !== null && (
        <div className="absolute inset-0 bg-black bg-opacity-55 flex items-center justify-center">
          <span className="text-white text-2xl font-bold">+{overlayCount}</span>
        </div>
      )}
    </div>
  )

  // Setup Socket.io listener untuk real-time updates
  useEffect(() => {
    const socket = getSocket()
    
    const handlePostLiked = (data) => {
      if (data.postId === localPost.id) {
        setLikesCount(data.likesCount)
      }
    }

    const handleNewComment = (comment) => {
      if (comment.postId === localPost.id) {
        setCommentsCount(prev => prev + 1)
      }
    }

    const handleCommentDeleted = (data) => {
      if (data.postId === localPost.id) {
        // Jika parent comment dihapus, semua replies juga ikut terhapus di backend
        const countToRemove = 1 + (data.repliesCount || 0)
        setCommentsCount(prev => Math.max(0, prev - countToRemove))
      }
    }

    const handlePostUpdated = (updatedPost) => {
      if (updatedPost.id === localPost.id) {
        setLocalPost(updatedPost)
        if (updatedPost.likesCount !== undefined) setLikesCount(updatedPost.likesCount)
        if (updatedPost.commentsCount !== undefined) setCommentsCount(updatedPost.commentsCount)
        if (onPostUpdated) {
          onPostUpdated(updatedPost)
        }
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
  }, [localPost.id, onPostUpdated])

  // Check apakah post milik user saat ini
  const isOwnPost = user?.id === localPost.author?.id

  // Format date menjadi relative time
  const formatDate = (dateString) => {
    if (!dateString) return ''
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

  // Handler untuk toggle like dengan optimistic update
  const handleLike = async () => {
    if (loading) return
    setLoading(true)
    
    // Optimistic update untuk UX yang lebih baik
    const newIsLiked = !isLiked
    setIsLiked(newIsLiked)
    setLikesCount(prev => newIsLiked ? prev + 1 : prev - 1)

    try {
      await toggleLike(localPost.id)
    } catch (err) {
      // Revert optimistic update jika error
      setIsLiked(!newIsLiked)
      setLikesCount(prev => newIsLiked ? prev - 1 : prev + 1)
      console.error('Error toggling like:', err)
    } finally {
      setLoading(false)
    }
  }

  // Handler untuk delete post dengan confirmation
  const handleDelete = async () => {
    setConfirmModal({
      isOpen: true,
      title: 'Hapus Post',
      message: 'Apakah Anda yakin ingin menghapus post ini?',
      variant: 'danger',
      onConfirm: async () => {
        try {
          await deletePost(localPost.id)
          if (onPostDeleted) onPostDeleted(localPost.id)
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

  // Handler untuk share post (native share API atau copy link)
  const handleShare = () => {
    const postUrl = `${window.location.origin}/posts/${localPost.id}`
    if (navigator.share) {
      navigator.share({
        title: 'Lihat post ini',
        text: localPost.content?.substring(0, 100) || '',
        url: postUrl
      })
    } else {
      navigator.clipboard.writeText(postUrl)
      setAlertModal({
        isOpen: true,
        title: 'Berhasil',
        message: 'Link berhasil disalin!',
        variant: 'success'
      })
    }
  }

  // Handler untuk klik card (navigasi ke detail post)
  const handleCardClick = (e) => {
    // Jangan navigate jika klik pada elemen interaktif (button, link, dll)
    if (e.target.closest('button') || e.target.closest('a') || e.target.closest('[role="button"]')) {
      return
    }
    navigate(`/posts/${localPost.id}`)
  }

  return (
    <Card className="p-4 mb-4 cursor-pointer hover:shadow-md transition-shadow" onClick={handleCardClick}>
      {/* Post header dengan author info dan menu */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-3">
          {/* Author avatar - clickable */}
          <button
            onClick={() => navigate(`/profil/${localPost.author?.id}`)}
            className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0 hover:ring-2 hover:ring-blue-300 transition-all cursor-pointer"
          >
            {localPost.author?.fotoProfil ? (
              <img
                src={getImageUrl(localPost.author.fotoProfil, 'profiles')}
                alt={localPost.author.nama}
                className="w-10 h-10 rounded-full object-cover"
                onError={(e) => { e.target.style.display = 'none' }}
              />
            ) : (
              <span className="text-blue-600 font-semibold">
                {localPost.author?.nama?.charAt(0).toUpperCase()}
              </span>
            )}
          </button>
          {/* Author name dan timestamp - clickable */}
          <div className="flex-1">
            <button
              onClick={() => navigate(`/profil/${localPost.author?.id}`)}
              className="text-left hover:opacity-80 transition-opacity"
            >
              <p className="font-semibold text-gray-900 hover:text-blue-600">
                {localPost.author?.nama}
                <UserBadge role={localPost.author?.role} size="sm" />
              </p>
              <div className="flex items-center gap-2 flex-wrap">
                <p className="text-sm text-gray-500">{formatDate(localPost.createdAt)}</p>
                {/* Visibility badge di samping waktu */}
                {localPost.visibility && (
                  <span className={`inline-flex items-center gap-1 px-2 py-0.5 text-xs font-medium rounded-full ${
                    localPost.visibility === 'PUBLIC' 
                      ? 'bg-blue-50 text-blue-600' 
                      : 'bg-gray-100 text-gray-700'
                  }`}>
                    {localPost.visibility === 'PUBLIC' ? <Globe size={12} /> : <Lock size={12} />}
                    {localPost.visibility === 'PUBLIC' ? 'Publik' : 'Hanya Koneksi'}
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
              className="p-1 rounded-full hover:bg-gray-100"
            >
              <MoreVertical size={20} className="text-gray-600" />
            </button>
            {showMenu && (
              <div className="absolute right-0 mt-2 w-40 bg-white border border-gray-200 rounded-lg shadow-lg z-10">
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    setShowMenu(false)
                    navigate(`/posts/${localPost.id}?edit=true`, { state: { openEdit: true } })
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
      {localPost.mentions && Array.isArray(localPost.mentions) && localPost.mentions.length > 0 && (
        <div className="mb-3 flex items-center gap-2 flex-wrap text-sm text-gray-600">
          <User size={14} className="text-gray-400 flex-shrink-0" />
          <span>bersama dengan</span>
          {localPost.mentions.length === 1 ? (
            <button
              onClick={(e) => {
                e.stopPropagation()
                navigate(`/profil/${localPost.mentions[0].id}`)
              }}
              className="font-medium text-blue-600 hover:text-blue-700 hover:underline"
            >
              {localPost.mentions[0]?.nama || 'Seseorang'}
            </button>
          ) : (
            <>
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  navigate(`/profil/${localPost.mentions[0].id}`)
                }}
                className="font-medium text-blue-600 hover:text-blue-700 hover:underline"
              >
                {localPost.mentions[0]?.nama || 'Seseorang'}
              </button>
              <span>dan {localPost.mentions.length - 1} lainnya</span>
            </>
          )}
        </div>
      )}

      {/* Post content text — responsive truncation */}
      <div className="mb-3">
        <p className="text-gray-900 whitespace-pre-wrap">
          {windowWidth < 640
            ? truncateText(localPost.content, 400)
            : windowWidth < 1024
            ? truncateText(localPost.content, 600)
            : localPost.content
          }
        </p>
      </div>

      {/* Post images — grid layout (di feed tidak bisa klik perbesar, klik card → detail) */}
      {/* Responsive aspect ratios: mobile (phone <640px): 1-2 gambar→3:2, 3+ gambar→1:1 */}
      {images.length > 0 && (
        <div className="mb-3 rounded-xl overflow-hidden">

          {/* 1 gambar: full width */}
          {images.length === 1 && (
            <div className="rounded-xl overflow-hidden w-full bg-gray-50 aspect-[3/2] md:aspect-[3/1]">
              {renderImageTile(images[0], 0, 'h-full w-full')}
            </div>
          )}

          {/* 2 gambar: [1, 2] berdampingan */}
          {images.length === 2 && (
            <div className="grid grid-cols-2 gap-1 rounded-xl overflow-hidden w-full bg-gray-50 aspect-[3/2] md:aspect-[3/1]">
              {renderImageTile(images[0], 0, 'h-full w-full')}
              {renderImageTile(images[1], 1, 'h-full w-full')}
            </div>
          )}

          {/* 3 gambar: [1] atas-kiri, [2] bawah-kiri | [3] kanan-full */}
          {images.length === 3 && (
            <div className="grid grid-cols-2 grid-rows-2 gap-1 rounded-xl overflow-hidden w-full bg-gray-50 aspect-square md:aspect-[2/1]">
              {renderImageTile(images[0], 0, 'col-start-1 row-start-1 w-full h-full')}
              {renderImageTile(images[1], 1, 'col-start-1 row-start-2 w-full h-full')}
              {renderImageTile(images[2], 2, 'col-start-2 row-start-1 row-span-2 w-full h-full')}
            </div>
          )}

          {/* 4+ gambar: [1,2] / [3,4] grid simetris */}
          {images.length >= 4 && (
            <div className="grid grid-cols-2 grid-rows-2 gap-1 rounded-xl overflow-hidden w-full bg-gray-50 aspect-square md:aspect-[2/1]">
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
      <div className="flex items-center gap-4 pt-3 border-t border-gray-200" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center gap-1">
          <button
            onClick={handleLike}
            disabled={loading}
            className={`flex items-center justify-center p-1.5 rounded-full hover:bg-red-50 transition-colors ${isLiked ? 'text-red-600' : 'text-gray-600'} hover:text-red-600`}
          >
            <Heart size={20} fill={isLiked ? 'currentColor' : 'none'} />
          </button>
          <button
            onClick={() => likesCount > 0 && setShowLikesModal(true)}
            className={`text-sm font-medium transition-colors ${likesCount > 0 ? 'hover:text-blue-600 cursor-pointer hover:underline' : 'cursor-default text-gray-600'}`}
          >
            {likesCount}
          </button>
        </div>

        <button
          onClick={() => setShowComments(!showComments)}
          className="flex items-center gap-2 text-gray-600 hover:text-blue-600 transition-colors"
        >
          <MessageCircle size={20} />
          <span className="text-sm font-medium">{commentsCount}</span>
        </button>

        <button
          onClick={handleShare}
          className="flex items-center gap-2 text-gray-600 hover:text-green-600 transition-colors"
        >
          <Share2 size={20} />
          <span className="text-sm">Bagikan</span>
        </button>
      </div>

      {/* Comments section (toggleable) */}
      {showComments && localPost?.id && (
        <div className="mt-4 pt-4 border-t border-gray-200" onClick={(e) => e.stopPropagation()}>
          <CommentSection 
            key={localPost.id} 
            postId={localPost.id} 
            onCommentAdded={() => setCommentsCount(prev => prev + 1)}
            onCommentDeleted={() => setCommentsCount(prev => Math.max(0, prev - 1))}
          />
        </div>
      )}


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

      {/* Likes Modal */}
      <LikesModal
        isOpen={showLikesModal}
        onClose={() => setShowLikesModal(false)}
        postId={localPost.id}
      />
    </Card>
  )
}

export default PostCard
