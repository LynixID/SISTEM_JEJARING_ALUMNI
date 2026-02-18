import { useState, useEffect } from 'react'
import { useAuth } from '../../context/AuthContext'
import { getComments, createComment } from '../../services/api'
import { getSocket } from '../../config/socket'
import { getImageUrl } from '../../utils/imageUtils'
import Button from '../common/Button'
import { Send, Loader } from 'lucide-react'
import CommentItem from './CommentItem'

const CommentSection = ({ postId, onCommentAdded, onCommentDeleted }) => {
  const { user } = useAuth()
  
  // State management untuk comments dan form
  const [comments, setComments] = useState([])
  const [content, setContent] = useState('')
  const [loading, setLoading] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [page, setPage] = useState(1)
  const [hasMore, setHasMore] = useState(true)

  // Load comments dengan pagination dan duplicate prevention
  const loadComments = async (pageNum = 1) => {
    setLoading(true)
    try {
      const response = await getComments(postId, { page: pageNum, limit: 20 })
      if (pageNum === 1) {
        setComments(response.data.comments)
      } else {
        setComments(prev => {
          const existingIds = new Set(prev.map(c => c.id))
          const newComments = response.data.comments.filter(c => !existingIds.has(c.id))
          return [...prev, ...newComments]
        })
      }
      setHasMore(response.data.pagination.page < response.data.pagination.totalPages)
    } catch (err) {
      console.error('Error loading comments:', err)
    } finally {
      setLoading(false)
    }
  }

  // Reset state dan load comments saat postId berubah
  useEffect(() => {
    setComments([])
    setContent('')
    setPage(1)
    setHasMore(true)
    loadComments()
  }, [postId])

  // Setup Socket.io listeners untuk real-time updates
  useEffect(() => {
    const socket = getSocket()
    
    // Handler untuk new comment dari real-time
    const handleNewComment = (comment) => {
      if (comment.postId === postId) {
        setComments(prev => {
          if (comment.parentId) {
            return prev.map(c => {
              if (c.id === comment.parentId) {
                const replyExists = c.replies?.find(r => r.id === comment.id)
                if (replyExists) return c
                return { ...c, replies: [...(c.replies || []), comment] }
              }
              return c
            })
          }
          const exists = prev.find(c => c.id === comment.id)
          if (exists) return prev
          return [{ ...comment, replies: [] }, ...prev]
        })
      }
    }

    // Handler untuk deleted comment dari real-time
    const handleCommentDeleted = (data) => {
      if (data.postId === postId) {
        setComments(prev => {
          if (data.parentId) {
            return prev.map(c => 
              c.id === data.parentId
                ? { ...c, replies: c.replies?.filter(r => r.id !== data.commentId) || [] }
                : c
            )
          }
          return prev.filter(c => c.id !== data.commentId)
        })
        if (onCommentDeleted) {
          const deletedCount = data.isParentComment ? (1 + (data.repliesCount || 0)) : 1
          for (let i = 0; i < deletedCount; i++) {
            onCommentDeleted()
          }
        }
      }
    }

    // Handler untuk updated comment dari real-time
    const handleCommentUpdatedSocket = (data) => {
      if (data.postId === postId) {
        setComments(prev => {
          if (data.parentId) {
            return prev.map(c => 
              c.id === data.parentId
                ? { 
                    ...c, 
                    replies: c.replies?.map(r => 
                      r.id === data.commentId ? { ...r, ...data.comment } : r
                    ) || [] 
                  }
                : c
            )
          }
          return prev.map(c => 
            c.id === data.commentId ? { ...c, ...data.comment } : c
          )
        })
      }
    }

    // Register socket event listeners
    socket.on('new_comment', handleNewComment)
    socket.on('comment_deleted', handleCommentDeleted)
    socket.on('comment_updated', handleCommentUpdatedSocket)

    // Cleanup listeners saat unmount
    return () => {
      socket.off('new_comment', handleNewComment)
      socket.off('comment_deleted', handleCommentDeleted)
      socket.off('comment_updated', handleCommentUpdatedSocket)
    }
  }, [postId, onCommentDeleted])

  // Handler untuk submit new comment
  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!content.trim() || submitting || !postId) return

    setSubmitting(true)
    try {
      const response = await createComment(postId, content.trim())
      const newComment = response.data.comment
      setComments(prev => {
        const exists = prev.find(c => c.id === newComment.id)
        if (exists) return prev
        if (newComment.parentId) {
          return prev.map(c => 
            c.id === newComment.parentId
              ? { ...c, replies: [...(c.replies || []), newComment] }
              : c
          )
        }
        return [{ ...newComment, replies: [] }, ...prev]
      })
      setContent('')
      if (onCommentAdded) onCommentAdded()
    } catch (err) {
      const errorMessage = err.response?.data?.error || err.response?.data?.errors?.[0]?.msg || 'Gagal membuat komentar'
      console.error('Error creating comment:', err.response?.data)
      alert(errorMessage)
    } finally {
      setSubmitting(false)
    }
  }

  // Handler untuk add reply dari CommentItem
  const handleReplyAdded = (parentId, reply) => {
    setComments(prev => 
      prev.map(c => {
        if (c.id === parentId) {
          const replyExists = c.replies?.find(r => r.id === reply.id)
          if (replyExists) return c
          return { ...c, replies: [...(c.replies || []), reply] }
        }
        return c
      })
    )
    if (onCommentAdded) onCommentAdded()
  }

  // Handler untuk load more comments
  const handleLoadMore = () => {
    const nextPage = page + 1
    setPage(nextPage)
    loadComments(nextPage)
  }

  // Handler untuk reload comments setelah edit
  const handleCommentUpdated = () => {
    loadComments(1)
  }

  return (
    <div>
      {/* Comment Form */}
      {user && (
        <form onSubmit={handleSubmit} className="mb-4">
          <div className="flex gap-2">
            <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
              {user?.profile?.fotoProfil ? (
                <img
                  src={getImageUrl(user.profile.fotoProfil, 'profiles')}
                  alt={user.nama}
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
              {!user?.profile?.fotoProfil && (
                <span className="text-blue-600 text-xs font-semibold">
                  {user?.nama?.charAt(0).toUpperCase()}
                </span>
              )}
            </div>
            <div className="flex-1">
              <input
                type="text"
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="Tulis komentar..."
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                maxLength={1000}
              />
            </div>
            <Button
              type="submit"
              disabled={!content.trim() || submitting}
              size="sm"
            >
              {submitting ? (
                <Loader className="animate-spin" size={16} />
              ) : (
                <Send size={16} />
              )}
            </Button>
          </div>
        </form>
      )}

      {/* Comments List */}
      {loading && comments.length === 0 ? (
        <p className="text-gray-500 text-sm text-center py-4">Memuat komentar...</p>
      ) : comments.length === 0 ? (
        <p className="text-gray-500 text-sm text-center py-4">Belum ada komentar</p>
      ) : (
        <>
          <div className="space-y-3">
            {comments.map((comment, index) => (
              <CommentItem
                key={`${comment.id}-${comment.createdAt || index}`}
                comment={comment}
                postId={postId}
                onDeleted={(id, isReply, parentId) => {
                  if (isReply && parentId) {
                    // Hapus reply dari parent
                    setComments(prev => 
                      prev.map(c => 
                        c.id === parentId
                          ? { ...c, replies: c.replies?.filter(r => r.id !== id) || [] }
                          : c
                      )
                    )
                    // Hanya kurangi 1 untuk reply
                    if (onCommentDeleted) {
                      onCommentDeleted()
                    }
                  } else {
                    // Hapus parent comment - cari jumlah replies yang akan ikut terhapus
                    setComments(prev => {
                      const commentToDelete = prev.find(c => c.id === id)
                      const repliesCount = commentToDelete?.replies?.length || 0
                      
                      // Update comment count: 1 parent + jumlah replies
                      if (onCommentDeleted) {
                        for (let i = 0; i < (1 + repliesCount); i++) {
                          onCommentDeleted()
                        }
                      }
                      
                      // Hapus parent comment dari list (replies akan ikut terhapus karena cascade)
                      return prev.filter(c => c.id !== id)
                    })
                  }
                }}
                onReplyAdded={handleReplyAdded}
                onCommentUpdated={handleCommentUpdated}
              />
            ))}
          </div>
          {hasMore && (
            <button
              onClick={handleLoadMore}
              className="mt-4 text-sm text-blue-600 hover:text-blue-700"
            >
              Muat lebih banyak komentar
            </button>
          )}
        </>
      )}
    </div>
  )
}

export default CommentSection

