import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { getLikes } from '../../services/api'
import { getImageUrl } from '../../utils/imageUtils'
import Modal from '../common/Modal'
import { Loader, User } from 'lucide-react'

const LikesModal = ({ postId, isOpen, onClose }) => {
  const navigate = useNavigate()
  const [likes, setLikes] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 0
  })

  useEffect(() => {
    if (isOpen && postId) {
      fetchLikes(1)
    } else if (!isOpen) {
      // Reset state saat modal tutup
      setLikes([])
      setError(null)
    }
  }, [isOpen, postId])

  const fetchLikes = async (page) => {
    try {
      setLoading(true)
      const response = await getLikes(postId, { page, limit: 20 })
      
      if (page === 1) {
        setLikes(response.data.likes)
      } else {
        setLikes(prev => [...prev, ...response.data.likes])
      }
      
      setPagination(response.data.pagination)
    } catch (err) {
      console.error('Error fetching likes:', err)
      setError('Gagal memuat daftar penyuka')
    } finally {
      setLoading(false)
    }
  }

  const handleLoadMore = () => {
    if (pagination.page < pagination.totalPages && !loading) {
      fetchLikes(pagination.page + 1)
    }
  }

  const handleUserClick = (userId) => {
    onClose()
    navigate(`/profil/${userId}`)
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Disukai oleh"
      size="sm"
    >
      <div className="max-h-[60vh] overflow-y-auto pr-1">
        {loading && likes.length === 0 ? (
          <div className="flex justify-center py-8">
            <Loader className="animate-spin text-blue-600" size={24} />
          </div>
        ) : error ? (
          <div className="text-center py-8 text-red-500">
            {error}
          </div>
        ) : likes.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            Belum ada yang menyukai postingan ini
          </div>
        ) : (
          <div className="space-y-4">
            {likes.map((like) => (
              <div 
                key={like.id}
                className="flex items-center justify-between group"
              >
                <button
                  onClick={() => handleUserClick(like.user.id)}
                  className="flex items-center gap-3 text-left hover:opacity-80 transition-opacity flex-1"
                >
                  <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                    {like.user.fotoProfil ? (
                      <img
                        src={getImageUrl(like.user.fotoProfil, 'profiles')}
                        alt={like.user.nama}
                        className="w-10 h-10 rounded-full object-cover"
                        onError={(e) => { e.target.style.display = 'none' }}
                      />
                    ) : (
                      <span className="text-blue-600 font-semibold uppercase">
                        {like.user.nama?.charAt(0)}
                      </span>
                    )}
                  </div>
                  <div className="flex flex-col">
                    <span className="font-semibold text-gray-900 group-hover:text-blue-600 transition-colors">
                      {like.user.nama}
                    </span>
                  </div>
                </button>
                <button
                  onClick={() => handleUserClick(like.user.id)}
                  className="text-xs font-medium text-blue-600 hover:text-blue-700 bg-blue-50 hover:bg-blue-100 px-3 py-1.5 rounded-full transition-colors"
                >
                  View Profile
                </button>
              </div>
            ))}

            {pagination.page < pagination.totalPages && (
              <button
                onClick={handleLoadMore}
                disabled={loading}
                className="w-full py-2 text-sm text-blue-600 hover:text-blue-700 font-medium transition-colors"
              >
                {loading ? 'Memuat...' : 'Lihat lebih banyak'}
              </button>
            )}
          </div>
        )}
      </div>
    </Modal>
  )
}

export default LikesModal
