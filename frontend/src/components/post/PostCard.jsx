import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { toggleLike, deletePost } from '../../services/api'
import { getSocket } from '../../config/socket'
import { getImageUrl } from '../../utils/imageUtils'
import Card from '../common/Card'
import Button from '../common/Button'
import AlertModal from '../common/AlertModal'
import ConfirmModal from '../common/ConfirmModal'
import { Heart, MessageCircle, Share2, MoreVertical, Trash2, Edit2 } from 'lucide-react'
import CommentSection from '../comment/CommentSection'
import EditPost from './EditPost'

const PostCard = ({ post, onPostDeleted, onPostUpdated }) => {
  const { user } = useAuth()
  const navigate = useNavigate()
  
  // State management
  const [isLiked, setIsLiked] = useState(post.isLiked || false)
  const [likesCount, setLikesCount] = useState(post.likesCount || 0)
  const [commentsCount, setCommentsCount] = useState(post.commentsCount || 0)
  const [showComments, setShowComments] = useState(false)
  const [loading, setLoading] = useState(false)
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

  // Setup Socket.io listener untuk real-time like updates
  useEffect(() => {
    const socket = getSocket()
    const handlePostLiked = (data) => {
      if (data.postId === post.id) {
        setLikesCount(data.likesCount)
      }
    }
    socket.on('post_liked', handlePostLiked)
    return () => socket.off('post_liked', handlePostLiked)
  }, [post.id])

  // Check apakah post milik user saat ini
  const isOwnPost = user?.id === post.author.id

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

  // Handler untuk toggle like dengan optimistic update
  const handleLike = async (e) => {
    e.stopPropagation() // Prevent card click
    if (loading) return
    setLoading(true)
    
    // Optimistic update untuk UX yang lebih baik
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
          await deletePost(post.id)
          if (onPostDeleted) onPostDeleted(post.id)
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
  const handleShare = (e) => {
    if (e) {
      e.preventDefault()
      e.stopPropagation() // Prevent card click
    }
    
    const postUrl = `${window.location.origin}/posts/${post.id}`
    const shareText = post.content ? post.content.substring(0, 100) : 'Lihat postingan ini'
    
    console.log('Share clicked, URL:', postUrl) // Debug log
    
    if (navigator.share) {
      navigator.share({
        title: `Postingan dari ${post.author?.nama || 'Alumni'}`,
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

  // Handler untuk navigate ke detail post
  const handleCardClick = () => {
    navigate(`/posts/${post.id}`)
  }

  return (
    <Card 
      className="p-4 mb-4"
      onClick={handleCardClick}
    >
      {/* Post header dengan author info dan menu */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-3">
          {/* Author avatar - clickable ke profil */}
          <button
            onClick={(e) => {
              e.stopPropagation() // Prevent card click
              navigate(`/profil/${post.author.id}`)
            }}
            className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0 hover:ring-2 hover:ring-blue-300 transition-all cursor-pointer"
          >
            {post.author?.fotoProfil ? (
              <img
                src={getImageUrl(post.author.fotoProfil, 'profiles')}
                alt={post.author.nama}
                className="w-10 h-10 rounded-full object-cover"
                onError={(e) => { e.target.style.display = 'none' }}
              />
            ) : (
              <span className="text-blue-600 font-semibold">
                {post.author?.nama?.charAt(0).toUpperCase()}
              </span>
            )}
          </button>
          {/* Author name dan timestamp - clickable ke profil */}
          <button
            onClick={(e) => {
              e.stopPropagation() // Prevent card click
              navigate(`/profil/${post.author.id}`)
            }}
            className="text-left hover:opacity-80 transition-opacity"
          >
            <p className="font-semibold text-gray-900 hover:text-blue-600">{post.author?.nama}</p>
            <p className="text-sm text-gray-500">{formatDate(post.createdAt)}</p>
          </button>
        </div>

        {/* Edit/Delete menu untuk post owner */}
        {isOwnPost && (
          <div className="relative" onClick={(e) => e.stopPropagation()}>
            <button
              onClick={() => setShowMenu(!showMenu)}
              className="p-1 rounded-full hover:bg-gray-100"
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

      {/* Post content text */}
      <div className="mb-3">
        <p className="text-gray-900 whitespace-pre-wrap">{post.content}</p>
      </div>

      {/* Post image jika ada */}
      {post.media && (
        <div className="mb-3 rounded-lg overflow-hidden">
          <img
            src={getImageUrl(post.media, 'posts')}
            alt="Post"
            className="w-full max-h-96 object-cover"
            onError={(e) => { e.target.style.display = 'none' }}
          />
        </div>
      )}

      {/* Action buttons: Like, Comment, Share */}
      <div 
        className="flex items-center gap-4 pt-3 border-t border-gray-200" 
        onClick={(e) => e.stopPropagation()}
        onMouseDown={(e) => e.stopPropagation()}
      >
        <button
          onClick={handleLike}
          disabled={loading}
          className={`flex items-center gap-2 ${isLiked ? 'text-red-600' : 'text-gray-600'} hover:text-red-600 transition-colors cursor-pointer`}
          type="button"
        >
          <Heart size={20} fill={isLiked ? 'currentColor' : 'none'} />
          <span className="text-sm font-medium">{likesCount}</span>
        </button>

        <button
          onClick={(e) => {
            e.stopPropagation()
            setShowComments(!showComments)
          }}
          className="flex items-center gap-2 text-gray-600 hover:text-blue-600 transition-colors cursor-pointer"
          type="button"
        >
          <MessageCircle size={20} />
          <span className="text-sm font-medium">{commentsCount}</span>
        </button>

        <button
          onClick={handleShare}
          onMouseDown={(e) => e.stopPropagation()}
          className="flex items-center gap-2 text-gray-600 hover:text-green-600 transition-colors cursor-pointer relative z-10"
          type="button"
        >
          <Share2 size={20} />
          <span className="text-sm">Bagikan</span>
        </button>
      </div>

      {/* Comments section (toggleable) */}
      {showComments && post?.id && (
        <div className="mt-4 pt-4 border-t border-gray-200" onClick={(e) => e.stopPropagation()}>
          <CommentSection 
            key={post.id} 
            postId={post.id} 
            onCommentAdded={() => setCommentsCount(prev => prev + 1)}
            onCommentDeleted={() => setCommentsCount(prev => Math.max(0, prev - 1))}
          />
        </div>
      )}

      {/* Edit post modal */}
      <EditPost
        isOpen={showEditModal}
        onClose={() => setShowEditModal(false)}
        post={post}
        onPostUpdated={() => {
          setShowEditModal(false)
          if (onPostUpdated) onPostUpdated()
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
    </Card>
  )
}

export default PostCard
