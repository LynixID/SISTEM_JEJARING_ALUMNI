import { useState, useEffect, useRef } from 'react'
import { useAuth } from '../../context/AuthContext'
import { createPost, getConnections } from '../../services/api'
import { getImageUrl } from '../../utils/imageUtils'
import Button from '../common/Button'
import { Image as ImageIcon, X, Loader, Users, Globe, Lock } from 'lucide-react'

const CreatePost = ({ isOpen, onClose, onPostCreated }) => {
  const { user } = useAuth()
  const [content, setContent] = useState('')
  const [image, setImage] = useState(null)
  const [imagePreview, setImagePreview] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [visibility, setVisibility] = useState('PUBLIC')
  const [connectedUsers, setConnectedUsers] = useState([])
  const [mentionSearch, setMentionSearch] = useState('')
  const [showMentionDropdown, setShowMentionDropdown] = useState(false)
  const [selectedMentions, setSelectedMentions] = useState([])
  const mentionInputRef = useRef(null)
  const mentionDropdownRef = useRef(null)

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

  // Fetch connected users untuk mention
  useEffect(() => {
    if (isOpen) {
      const fetchConnectedUsers = async () => {
        try {
          const response = await getConnections()
          setConnectedUsers(response.data.connections || [])
        } catch (err) {
          console.error('Error fetching connected users:', err)
        }
      }
      fetchConnectedUsers()
    }
  }, [isOpen])

  // Reset form saat modal ditutup
  useEffect(() => {
    if (!isOpen) {
      setContent('')
      setImage(null)
      setImagePreview(null)
      setVisibility('PUBLIC')
      setSelectedMentions([])
      setMentionSearch('')
      setShowMentionDropdown(false)
      setError('')
    }
  }, [isOpen])

  // Handle mention search
  const filteredUsers = connectedUsers.filter(user => 
    user.user?.nama?.toLowerCase().includes(mentionSearch.toLowerCase()) ||
    user.user?.email?.toLowerCase().includes(mentionSearch.toLowerCase())
  )

  const handleMentionSelect = (selectedUser) => {
    if (!selectedMentions.find(m => m.id === selectedUser.id)) {
      setSelectedMentions([...selectedMentions, selectedUser])
    }
    setMentionSearch('')
    setShowMentionDropdown(false)
  }

  const handleRemoveMention = (userId) => {
    setSelectedMentions(selectedMentions.filter(m => m.id !== userId))
  }

  // Handle click outside untuk close mention dropdown
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        mentionDropdownRef.current &&
        !mentionDropdownRef.current.contains(event.target) &&
        mentionInputRef.current &&
        !mentionInputRef.current.contains(event.target)
      ) {
        setShowMentionDropdown(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')

    if (!content.trim()) {
      setError('Konten harus diisi')
      return
    }

    setLoading(true)
    try {
      const mentions = selectedMentions.map(m => m.id)
      await createPost({ 
        content: content.trim(), 
        visibility,
        mentions 
      }, image)
      setContent('')
      setImage(null)
      setImagePreview(null)
      setVisibility('PUBLIC')
      setSelectedMentions([])
      setMentionSearch('')
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

            {/* Visibility Selector */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Visibilitas Postingan
              </label>
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setVisibility('PUBLIC')}
                  className={`flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-lg border-2 transition-all ${
                    visibility === 'PUBLIC'
                      ? 'border-blue-500 bg-blue-50 text-blue-700'
                      : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <Globe size={18} />
                  <span className="text-sm font-medium">Publik</span>
                </button>
                <button
                  type="button"
                  onClick={() => setVisibility('CONNECTIONS')}
                  className={`flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-lg border-2 transition-all ${
                    visibility === 'CONNECTIONS'
                      ? 'border-blue-500 bg-blue-50 text-blue-700'
                      : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <Lock size={18} />
                  <span className="text-sm font-medium">Hanya Koneksi</span>
                </button>
              </div>
              <p className="text-xs text-gray-500 mt-2">
                {visibility === 'PUBLIC' 
                  ? 'Semua orang dapat melihat postingan ini' 
                  : 'Hanya koneksi Anda yang dapat melihat postingan ini'}
              </p>
            </div>

            {/* Mention Input */}
            <div className="mb-4 relative">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Sebutkan Seseorang (Hanya Koneksi)
              </label>
              <div className="relative">
                <div className="flex items-center gap-2 flex-wrap min-h-[40px] p-2 border border-gray-300 rounded-lg focus-within:ring-2 focus-within:ring-blue-500 focus-within:border-transparent">
                  {/* Selected Mentions */}
                  {selectedMentions.map((mention) => (
                    <div
                      key={mention.id}
                      className="flex items-center gap-1 px-2 py-1 bg-blue-100 text-blue-700 rounded-full text-sm"
                    >
                      <span>{mention.nama || mention.user?.nama}</span>
                      <button
                        type="button"
                        onClick={() => handleRemoveMention(mention.id)}
                        className="hover:bg-blue-200 rounded-full p-0.5"
                      >
                        <X size={14} />
                      </button>
                    </div>
                  ))}
                  {/* Mention Search Input */}
                  <input
                    ref={mentionInputRef}
                    type="text"
                    value={mentionSearch}
                    onChange={(e) => {
                      setMentionSearch(e.target.value)
                      setShowMentionDropdown(true)
                    }}
                    onFocus={() => setShowMentionDropdown(true)}
                    placeholder={selectedMentions.length === 0 ? "Cari koneksi untuk disebutkan..." : ""}
                    className="flex-1 min-w-[150px] border-none outline-none text-sm"
                  />
                </div>
                
                {/* Mention Dropdown */}
                {showMentionDropdown && mentionSearch && filteredUsers.length > 0 && (
                  <div
                    ref={mentionDropdownRef}
                    className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-48 overflow-y-auto"
                  >
                    {filteredUsers.map((connection) => {
                      const user = connection.user
                      if (!user) return null
                      const isSelected = selectedMentions.find(m => m.id === user.id)
                      return (
                        <button
                          key={user.id}
                          type="button"
                          onClick={() => {
                            if (!isSelected) {
                              handleMentionSelect(user)
                            }
                          }}
                          disabled={isSelected}
                          className={`w-full flex items-center gap-3 px-4 py-2 hover:bg-gray-100 transition-colors ${
                            isSelected ? 'opacity-50 cursor-not-allowed bg-gray-50' : ''
                          }`}
                        >
                          <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                            {user.fotoProfil ? (
                              <img
                                src={getImageUrl(user.fotoProfil, 'profiles')}
                                alt={user.nama}
                                className="w-8 h-8 rounded-full object-cover"
                                onError={(e) => {
                                  e.target.style.display = 'none'
                                }}
                              />
                            ) : (
                              <span className="text-blue-600 text-xs font-semibold">
                                {user.nama?.charAt(0).toUpperCase()}
                              </span>
                            )}
                          </div>
                          <div className="flex-1 text-left">
                            <p className="text-sm font-medium text-gray-900">{user.nama}</p>
                            <p className="text-xs text-gray-500">{user.email}</p>
                          </div>
                          {isSelected && (
                            <span className="text-xs text-blue-600 font-medium">✓ Dipilih</span>
                          )}
                        </button>
                      )
                    })}
                  </div>
                )}
                {showMentionDropdown && mentionSearch && filteredUsers.length === 0 && (
                  <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg p-4 text-center text-sm text-gray-500">
                    Tidak ada koneksi ditemukan
                  </div>
                )}
              </div>
              {connectedUsers.length === 0 && (
                <p className="text-xs text-gray-500 mt-1">
                  Anda belum memiliki koneksi. Buat koneksi terlebih dahulu untuk bisa menyebutkan seseorang.
                </p>
              )}
            </div>

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

