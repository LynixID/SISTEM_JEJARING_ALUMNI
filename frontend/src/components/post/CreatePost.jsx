import { useState } from 'react'
import { useAuth } from '../../context/AuthContext'
import { createPost } from '../../services/api'
import { getImageUrl } from '../../utils/imageUtils'
import Button from '../common/Button'
import { Image as ImageIcon, X, Loader } from 'lucide-react'

const CreatePost = ({ isOpen, onClose, onPostCreated }) => {
  const { user } = useAuth()
  const [content, setContent] = useState('')
  const [image, setImage] = useState(null)
  const [imagePreview, setImagePreview] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  // Compress image sebelum upload
  const compressImage = (file, maxWidth = 1920, quality = 0.85) => {
    return new Promise((resolve) => {
      const reader = new FileReader()
      reader.onload = (e) => {
        const img = document.createElement('img')
        img.onload = () => {
          const canvas = document.createElement('canvas')
          let width = img.width
          let height = img.height

          // Resize jika terlalu besar
          if (width > maxWidth) {
            height = (height * maxWidth) / width
            width = maxWidth
          }

          canvas.width = width
          canvas.height = height

          const ctx = canvas.getContext('2d')
          ctx.drawImage(img, 0, 0, width, height)

          // Convert ke blob dengan quality
          canvas.toBlob(
            (blob) => {
              if (blob) {
                const compressedFile = new File([blob], file.name, {
                  type: 'image/jpeg',
                  lastModified: Date.now()
                })
                resolve(compressedFile)
              } else {
                resolve(file)
              }
            },
            'image/jpeg',
            quality
          )
        }
        img.src = e.target.result
      }
      reader.readAsDataURL(file)
    })
  }

  const handleImageChange = async (e) => {
    const file = e.target.files[0]
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        setError('Ukuran gambar maksimal 5MB')
        return
      }

      // Set preview dulu untuk immediate feedback
      const reader = new FileReader()
      reader.onloadend = () => {
        setImagePreview(reader.result)
      }
      reader.readAsDataURL(file)

      // Compress image jika lebih dari 1MB
      let processedFile = file
      if (file.size > 1024 * 1024) {
        try {
          processedFile = await compressImage(file)
          // Update preview dengan compressed file
          const compressedReader = new FileReader()
          compressedReader.onloadend = () => {
            setImagePreview(compressedReader.result)
          }
          compressedReader.readAsDataURL(processedFile)
        } catch (err) {
          console.error('Error compressing image:', err)
        }
      }

      setImage(processedFile)
      setError('')
    }
  }

  const removeImage = () => {
    setImage(null)
    setImagePreview(null)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')

    if (!content.trim()) {
      setError('Konten harus diisi')
      return
    }

    setLoading(true)
    try {
      await createPost({ content: content.trim() }, image)
      setContent('')
      setImage(null)
      setImagePreview(null)
      if (onPostCreated) {
        onPostCreated()
      }
      if (onClose) {
        onClose()
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Gagal membuat post')
    } finally {
      setLoading(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Overlay - background meredup */}
      <div className="absolute inset-0 bg-black bg-opacity-50"></div>
      
      {/* Modal */}
      <div className="relative bg-white rounded-lg shadow-xl w-full max-w-2xl mx-4 max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <h2 className="text-xl font-bold text-gray-900">Buat Postingan</h2>
          <button
            type="button"
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
            disabled={loading}
          >
            <X size={24} className="text-gray-600" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4">
          <form onSubmit={handleSubmit}>
            <div className="flex gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                {user?.profile?.fotoProfil ? (
                  <img
                    src={getImageUrl(user.profile.fotoProfil)}
                    alt={user.nama}
                    className="w-10 h-10 rounded-full object-cover"
                    onError={(e) => {
                      e.target.style.display = 'none'
                    }}
                  />
                ) : (
                  <span className="text-blue-600 font-semibold">
                    {user?.nama?.charAt(0).toUpperCase()}
                  </span>
                )}
              </div>
              <div className="flex-1">
                <textarea
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  placeholder="Apa yang ingin Anda bagikan?"
                  className="w-full p-3 border border-gray-300 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
                  rows="6"
                  maxLength={5000}
                />
                {error && (
                  <p className="text-red-600 text-sm mt-2">{error}</p>
                )}
              </div>
            </div>

            {/* Preview Image */}
            {imagePreview && (
              <div className="relative mb-4 rounded-lg overflow-hidden border border-gray-200">
                <img
                  src={imagePreview}
                  alt="Preview"
                  className="w-full max-h-96 object-cover"
                />
                <button
                  type="button"
                  onClick={removeImage}
                  className="absolute top-2 right-2 bg-black bg-opacity-50 text-white rounded-full p-2 hover:bg-opacity-70 transition-colors"
                >
                  <X size={20} />
                </button>
              </div>
            )}

            {/* Footer */}
            <div className="flex items-center justify-between pt-4 border-t border-gray-200">
              <label className="flex items-center gap-2 text-gray-600 cursor-pointer hover:text-gray-800 transition-colors">
                <ImageIcon size={20} />
                <span className="text-sm font-medium">Tambah Foto</span>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageChange}
                  className="hidden"
                />
              </label>
              <Button
                type="submit"
                disabled={loading || !content.trim()}
                className="px-6"
              >
                {loading ? (
                  <>
                    <Loader className="animate-spin inline mr-2" size={16} />
                    Memposting...
                  </>
                ) : (
                  'Posting'
                )}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}

export default CreatePost

