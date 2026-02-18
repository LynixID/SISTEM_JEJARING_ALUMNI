import { useState, useEffect } from 'react'
import { useAuth } from '../../context/AuthContext'
import { updateComment } from '../../services/api'
import { getImageUrl } from '../../utils/imageUtils'
import Button from '../common/Button'
import { X, Loader } from 'lucide-react'

const EditComment = ({ isOpen, onClose, comment, onCommentUpdated }) => {
  const { user } = useAuth()
  const [content, setContent] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  // Initialize form dengan data comment saat modal dibuka
  useEffect(() => {
    if (comment && isOpen) {
      setContent(comment.content || '')
      setError('')
    }
  }, [comment, isOpen])

  // Handler untuk submit edit comment dengan validasi
  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')

    // Validasi content tidak kosong
    if (!content.trim()) {
      setError('Konten komentar harus diisi')
      return
    }

    // Validasi max length
    if (content.trim().length > 1000) {
      setError('Konten komentar maksimal 1000 karakter')
      return
    }

    setLoading(true)
    try {
      // Update comment via API
      await updateComment(comment.id, content.trim())
      
      if (onCommentUpdated) onCommentUpdated()
      if (onClose) onClose()
    } catch (err) {
      console.error('Error updating comment:', err)
      const errorMessage = err.response?.data?.error || err.response?.data?.errors?.[0]?.msg || 'Gagal mengupdate komentar'
      setError(errorMessage)
    } finally {
      setLoading(false)
    }
  }

  if (!isOpen || !comment) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Overlay */}
      <div 
        className="absolute inset-0 bg-black bg-opacity-50"
        onClick={onClose}
      ></div>
      
      {/* Modal */}
      <div className="relative bg-white rounded-lg shadow-xl w-full max-w-lg mx-4">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <h2 className="text-lg font-bold text-gray-900">Edit Komentar</h2>
          <button
            type="button"
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
            disabled={loading}
          >
            <X size={20} className="text-gray-600" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4">
          <form onSubmit={handleSubmit}>
            <div className="flex gap-3 mb-4">
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
                <textarea
                  value={content}
                  onChange={(e) => {
                    setContent(e.target.value)
                    setError('')
                  }}
                  placeholder="Tulis komentar..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
                  rows="4"
                  maxLength={1000}
                />
                <div className="flex items-center justify-between mt-1">
                  {error && (
                    <p className="text-red-600 text-xs">{error}</p>
                  )}
                  <p className={`text-xs ml-auto ${content.length > 900 ? 'text-red-600' : 'text-gray-500'}`}>
                    {content.length}/1000
                  </p>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="flex items-center justify-end gap-2 pt-4 border-t border-gray-200">
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
                disabled={loading}
              >
                Batal
              </Button>
              <Button
                type="submit"
                disabled={loading || !content.trim() || content.trim() === comment.content}
                className="px-6"
              >
                {loading ? (
                  <>
                    <Loader className="animate-spin inline mr-2" size={16} />
                    Menyimpan...
                  </>
                ) : (
                  'Simpan'
                )}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}

export default EditComment

