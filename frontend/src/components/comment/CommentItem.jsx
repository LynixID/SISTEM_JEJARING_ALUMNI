import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { deleteComment, createComment } from '../../services/api'
import { getImageUrl } from '../../utils/imageUtils'
import UserBadge from '../common/UserBadge'
import { Trash2, MoreVertical, Reply, Send, Loader, Edit2, ChevronDown, ChevronUp } from 'lucide-react'
import EditComment from './EditComment'
import ConfirmModal from '../common/ConfirmModal'
import AlertModal from '../common/AlertModal'

const CommentItem = ({ comment, postId, onDeleted, onReplyAdded, onCommentUpdated, isReply = false, isFeedMode = false }) => {
  const { user } = useAuth()
  const navigate = useNavigate()
  
  // State management untuk UI interactions
  const [showMenu, setShowMenu] = useState(false)
  const [showReplyForm, setShowReplyForm] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [replyContent, setReplyContent] = useState('')
  const [submittingReply, setSubmittingReply] = useState(false)
  const [showReplies, setShowReplies] = useState(false)
  const [showAllReplies, setShowAllReplies] = useState(false)

  // Modals state
  const [isDeleting, setIsDeleting] = useState(false)
  const [alertModal, setAlertModal] = useState({ isOpen: false, title: '', message: '', variant: 'info' })
  const [confirmModal, setConfirmModal] = useState({ 
    isOpen: false, 
    title: '', 
    message: '', 
    variant: 'warning',
    onConfirm: () => {}
  })
  
  // Check ownership dan comment type
  const isOwnComment = user?.id === comment.author.id
  const isParentComment = !comment.parentId && !isReply

  // Format date menjadi relative time (e.g., "5 menit yang lalu")
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
    return date.toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })
  }

  // Handler untuk delete comment dengan confirmation
  const handleDelete = () => {
    setConfirmModal({
      isOpen: true,
      title: 'Hapus Komentar',
      message: 'Apakah Anda yakin ingin menghapus komentar ini?',
      variant: 'danger',
      onConfirm: async () => {
        setIsDeleting(true)
        try {
          await deleteComment(comment.id)
          if (onDeleted) onDeleted(comment.id, isReply, comment.parentId)
        } catch (err) {
          console.error('Error deleting comment:', err)
          setAlertModal({
            isOpen: true,
            title: 'Error',
            message: err.response?.data?.error || 'Gagal menghapus komentar',
            variant: 'error'
          })
        } finally {
          setIsDeleting(false)
        }
      }
    })
  }

  // Handler untuk submit reply
  const handleReplySubmit = async (e) => {
    e.preventDefault()
    if (!replyContent.trim() || submittingReply) return

    setSubmittingReply(true)
    try {
      const targetParentId = isReply ? comment.parentId : comment.id
      const response = await createComment(postId, replyContent.trim(), targetParentId)
      setReplyContent('')
      setShowReplyForm(false)
      setShowReplies(true) // Auto expand replies when replying
      if (onReplyAdded) onReplyAdded(targetParentId, response.data.comment)
    } catch (err) {
      alert(err.response?.data?.error || 'Gagal membalas komentar')
    } finally {
      setSubmittingReply(false)
    }
  }

  const handleProfileClick = (e) => {
    e.stopPropagation()
    if (comment.author?.id) {
      navigate(`/profil/${comment.author.id}`)
    }
  }

  return (
    <div className={isReply ? "ml-8 mt-2" : ""}>
      <div className="flex gap-2">
        <div 
          onClick={handleProfileClick}
          className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0 cursor-pointer hover:opacity-80 transition-opacity"
        >
          {comment.author?.fotoProfil ? (
            <img
              src={getImageUrl(comment.author.fotoProfil, 'profiles')}
              alt={comment.author.nama}
              className="w-8 h-8 rounded-full object-cover"
              onError={(e) => {
                e.target.style.display = 'none'
                const nextSibling = e.target.nextElementSibling
                if (nextSibling && nextSibling.style) {
                  nextSibling.style.display = 'flex'
                }
              }}
            />
          ) : null}
          {!comment.author?.fotoProfil && (
            <span className="text-blue-600 text-xs font-semibold">
              {comment.author?.nama?.charAt(0).toUpperCase()}
            </span>
          )}
        </div>
        <div className="flex-1">
          <div className={`rounded-lg p-3 ${isReply ? 'bg-gray-100' : 'bg-gray-50'}`}>
            <div className="flex items-start justify-between mb-1">
              <div>
                <p 
                  onClick={handleProfileClick}
                  className="font-semibold text-sm text-gray-900 cursor-pointer hover:text-blue-600 transition-colors"
                >
                  {comment.author?.nama}
                  <UserBadge role={comment.author?.role} size="sm" />
                </p>
                <p className="text-xs text-gray-500">{formatDate(comment.createdAt)}</p>
              </div>
              {isOwnComment && (
                <div className="relative">
                  <button
                    onClick={() => setShowMenu(!showMenu)}
                    className="p-1 rounded-full hover:bg-gray-200"
                  >
                    <MoreVertical size={14} className="text-gray-600" />
                  </button>
                  {showMenu && (
                    <div className="absolute right-0 mt-1 w-32 bg-white border border-gray-200 rounded-lg shadow-lg z-10">
                      <button
                        onClick={() => {
                          setShowMenu(false)
                          setShowEditModal(true)
                        }}
                        className="w-full px-3 py-2 text-left text-xs text-gray-700 hover:bg-gray-100 flex items-center gap-2"
                      >
                        <Edit2 size={14} />
                        Edit
                      </button>
                      <button
                        onClick={() => {
                          setShowMenu(false)
                          handleDelete()
                        }}
                        className="w-full px-3 py-2 text-left text-xs text-red-600 hover:bg-gray-100 flex items-center gap-2"
                      >
                        <Trash2 size={14} />
                        Hapus
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
            <p className="text-gray-900 text-sm whitespace-pre-wrap">{comment.content}</p>
            
            {/* Actions: Balas & Tampilkan Balasan */}
            <div className="mt-2 flex items-center gap-3">
              {user && (
                <button
                  onClick={() => setShowReplyForm(!showReplyForm)}
                  className="text-xs text-gray-500 hover:text-blue-600 flex items-center gap-1 cursor-pointer font-medium py-1 px-2 rounded hover:bg-gray-100 transition-colors"
                >
                  <Reply size={12} />
                  Balas
                </button>
              )}
              {isParentComment && comment.replies && comment.replies.length > 0 && (
                <button
                  onClick={() => setShowReplies(!showReplies)}
                  className="text-xs font-semibold text-blue-600 hover:text-blue-700 bg-blue-50 hover:bg-blue-100 px-3 py-1 rounded-full transition-colors flex items-center gap-1 cursor-pointer border border-blue-200 shadow-sm"
                >
                  {showReplies ? (
                    <>
                      <ChevronUp size={12} className="text-blue-500" />
                      Sembunyikan Balasan
                    </>
                  ) : (
                    <>
                      <ChevronDown size={12} className="text-blue-500" />
                      Tampilkan Balasan ({comment.replies.length})
                    </>
                  )}
                </button>
              )}
            </div>
          </div>

          {/* Reply Form */}
          {showReplyForm && user && (
            <form onSubmit={handleReplySubmit} className="mt-2 flex gap-2">
              <div className="w-6 h-6 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                {user?.profile?.fotoProfil ? (
                  <img
                    src={getImageUrl(user.profile.fotoProfil, 'profiles')}
                    alt={user.nama}
                    className="w-6 h-6 rounded-full object-cover"
                    onError={(e) => {
                      e.target.style.display = 'none'
                      const nextSibling = e.target.nextElementSibling
                      if (nextSibling && nextSibling.style) {
                        nextSibling.style.display = 'flex'
                      }
                    }}
                  />
                ) : null}
                {!user?.profile?.fotoProfil && (
                  <span className="text-blue-600 text-[10px] font-semibold">
                    {user?.nama?.charAt(0).toUpperCase()}
                  </span>
                )}
              </div>
              <div className="flex-1">
                <input
                  type="text"
                  value={replyContent}
                  onChange={(e) => setReplyContent(e.target.value)}
                  placeholder="Tulis balasan..."
                  className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  maxLength={1000}
                />
              </div>
              <button
                type="submit"
                disabled={!replyContent.trim() || submittingReply}
                className="px-2 py-1.5 text-blue-600 hover:text-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {submittingReply ? (
                  <Loader className="animate-spin" size={14} />
                ) : (
                  <Send size={14} />
                )}
              </button>
            </form>
          )}

          {/* Replies List */}
          {isParentComment && showReplies && comment.replies && comment.replies.length > 0 && (
            <div className="mt-2 space-y-2">
              {(showAllReplies ? comment.replies : comment.replies.slice(0, 5)).map((reply, index) => (
                <CommentItem
                  key={`reply-${reply.id}-${index}`}
                  comment={reply}
                  postId={postId}
                  isReply={true}
                  isFeedMode={isFeedMode}
                  onDeleted={onDeleted}
                  onCommentUpdated={onCommentUpdated}
                  onReplyAdded={(parentId, newReply) => {
                    setShowReplies(true) // Auto expand on reply addition
                    if (onReplyAdded) onReplyAdded(parentId, newReply)
                  }}
                />
              ))}
              
              {!showAllReplies && comment.replies.length > 5 && (
                <button
                  onClick={() => {
                    if (isFeedMode) {
                      navigate(`/posts/${postId}`)
                    } else {
                      setShowAllReplies(true)
                    }
                  }}
                  className="ml-8 text-xs font-semibold text-blue-600 hover:text-blue-700 bg-blue-50/50 hover:bg-blue-50 px-3.5 py-1.5 rounded-lg transition-colors cursor-pointer border border-blue-100 flex items-center gap-1 shadow-sm mt-1"
                >
                  Lihat Selengkapnya
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Edit Comment Modal */}
      <EditComment
        isOpen={showEditModal}
        onClose={() => setShowEditModal(false)}
        comment={comment}
        onCommentUpdated={() => {
          setShowEditModal(false)
          // Trigger refresh di parent component
          if (onCommentUpdated) {
            onCommentUpdated()
          }
        }}
      />

      {/* Confirm Modal */}
      <ConfirmModal
        isOpen={confirmModal.isOpen}
        onClose={() => setConfirmModal({ ...confirmModal, isOpen: false })}
        onConfirm={confirmModal.onConfirm}
        title={confirmModal.title}
        message={confirmModal.message}
        variant={confirmModal.variant}
        isLoading={isDeleting}
      />

      {/* Alert Modal */}
      <AlertModal
        isOpen={alertModal.isOpen}
        onClose={() => setAlertModal({ ...alertModal, isOpen: false })}
        title={alertModal.title}
        message={alertModal.message}
        variant={alertModal.variant}
      />
    </div>
  )
}

export default CommentItem

