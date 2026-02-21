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
import { Heart, MessageCircle, Share2, MoreVertical, Trash2, Edit2, Globe, Lock, User } from 'lucide-react'
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

  // Debug: Log post data untuk troubleshooting
  useEffect(() => {
    if (post.mentions) {
      console.log('Post ID:', post.id, 'Mentions:', post.mentions, 'Type:', typeof post.mentions, 'Is Array:', Array.isArray(post.mentions))
    }
  }, [post.id, post.mentions])

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
  const handleLike = async () => {
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
  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: 'Lihat post ini',
        text: post.content.substring(0, 100),
        url: window.location.href
      })
    } else {
      navigator.clipboard.writeText(window.location.href)
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
    navigate(`/posts/${post.id}`)
  }

  return (
    <Card className="p-4 mb-4 cursor-pointer hover:shadow-md transition-shadow" onClick={handleCardClick}>
      {/* Post header dengan author info dan menu */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-3">
          {/* Author avatar - clickable */}
          <button
            onClick={() => navigate(`/profil/${post.author.id}`)}
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
          {/* Author name dan timestamp - clickable */}
          <div className="flex-1">
            <button
              onClick={() => navigate(`/profil/${post.author.id}`)}
              className="text-left hover:opacity-80 transition-opacity"
            >
              <p className="font-semibold text-gray-900 hover:text-blue-600">{post.author?.nama}</p>
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

      {/* Mentions */}
      {post.mentions && Array.isArray(post.mentions) && post.mentions.length > 0 && (
        <div className="mb-3 flex items-center gap-2 flex-wrap text-sm text-gray-600">
          <User size={14} className="text-gray-400 flex-shrink-0" />
          <span>bersama dengan</span>
          {post.mentions.length === 1 ? (
            <button
              onClick={(e) => {
                e.stopPropagation()
                navigate(`/profil/${post.mentions[0].id}`)
              }}
              className="font-medium text-blue-600 hover:text-blue-700 hover:underline"
            >
              {post.mentions[0]?.nama || 'Seseorang'}
            </button>
          ) : (
            <>
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  navigate(`/profil/${post.mentions[0].id}`)
                }}
                className="font-medium text-blue-600 hover:text-blue-700 hover:underline"
              >
                {post.mentions[0]?.nama || 'Seseorang'}
              </button>
              <span>dan {post.mentions.length - 1} lainnya</span>
            </>
          )}
        </div>
      )}

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
      <div className="flex items-center gap-4 pt-3 border-t border-gray-200" onClick={(e) => e.stopPropagation()}>
        <button
          onClick={handleLike}
          disabled={loading}
          className={`flex items-center gap-2 ${isLiked ? 'text-red-600' : 'text-gray-600'} hover:text-red-600 transition-colors`}
        >
          <Heart size={20} fill={isLiked ? 'currentColor' : 'none'} />
          <span className="text-sm font-medium">{likesCount}</span>
        </button>

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
