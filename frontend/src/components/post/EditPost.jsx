import { useState, useEffect } from 'react'
import { useAuth } from '../../context/AuthContext'
import { updatePost, deletePostImage } from '../../services/api'
import { getImageUrl } from '../../utils/imageUtils'
import Button from '../common/Button'
import { Image as ImageIcon, X, Loader, Plus, Trash2 } from 'lucide-react'

const EditPost = ({ isOpen, onClose, post, onPostUpdated }) => {
  const { user } = useAuth()
  const [content, setContent] = useState('')

  // Gambar existing (dari server) — array of { id, imageUrl }
  const [existingImages, setExistingImages] = useState([])
  // Gambar baru (File objects dipilih user)
  const [newFiles, setNewFiles] = useState([])
  // Preview URL untuk gambar baru
  const [newPreviews, setNewPreviews] = useState([])

  const [loading, setLoading] = useState(false)
  const [deletingImageId, setDeletingImageId] = useState(null)
  const [error, setError] = useState('')
  const [imageDeleted, setImageDeleted] = useState(false)

  // Initialize form saat modal dibuka
  useEffect(() => {
    if (post && isOpen) {
      setContent(post.content || '')
      setExistingImages(post.images || [])
      setNewFiles([])
      setNewPreviews([])
      setError('')
      setImageDeleted(false)
    }
  }, [post, isOpen])

  // Helper to handle closing the modal, calling onPostUpdated if any image was deleted
  const handleClose = () => {
    if (imageDeleted && onPostUpdated) {
      onPostUpdated()
    }
    if (onClose) onClose()
  }

  // Compress image menggunakan Canvas API
  const compressImage = (file, maxWidth = 1920, quality = 0.85) => {
    return new Promise((resolve) => {
      const reader = new FileReader()
      reader.onload = (e) => {
        const img = document.createElement('img')
        img.onload = () => {
          const canvas = document.createElement('canvas')
          let width = img.width
          let height = img.height
          if (width > maxWidth) {
            height = (height * maxWidth) / width
            width = maxWidth
          }
          canvas.width = width
          canvas.height = height
          const ctx = canvas.getContext('2d')
          ctx.drawImage(img, 0, 0, width, height)
          canvas.toBlob(
            (blob) => {
              if (blob) {
                resolve(new File([blob], file.name, { type: 'image/jpeg', lastModified: Date.now() }))
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

  // Tambah gambar baru (tidak menggantikan existing)
  const handleAddImages = async (e) => {
    const files = Array.from(e.target.files)
    if (files.length === 0) return

    const totalImages = existingImages.length + newFiles.length + files.length
    if (totalImages > 10) {
      setError(`Maksimal 10 gambar per postingan. Saat ini sudah ada ${existingImages.length + newFiles.length} gambar.`)
      e.target.value = ''
      return
    }

    setError('')
    const addedFiles = []
    const addedPreviews = []

    for (const file of files) {
      if (file.size > 5 * 1024 * 1024) {
        setError(`File "${file.name}" melebihi 5MB, dilewati.`)
        continue
      }

      // Buat preview URL
      const previewUrl = await new Promise((resolve) => {
        const reader = new FileReader()
        reader.onloadend = () => resolve(reader.result)
        reader.readAsDataURL(file)
      })
      addedPreviews.push(previewUrl)

      // Compress jika perlu
      let processed = file
      if (file.size > 1024 * 1024) {
        try { processed = await compressImage(file) } catch (_) {}
      }
      addedFiles.push(processed)
    }

    setNewFiles(prev => [...prev, ...addedFiles])
    setNewPreviews(prev => [...prev, ...addedPreviews])
    e.target.value = ''
  }

  // Hapus gambar existing (via API langsung)
  const handleDeleteExisting = async (imageId) => {
    if (!post?.id) return
    setDeletingImageId(imageId)
    try {
      await deletePostImage(post.id, imageId)
      setExistingImages(prev => prev.filter(img => img.id !== imageId))
      setImageDeleted(true)
    } catch (err) {
      setError(err.response?.data?.error || 'Gagal menghapus gambar')
    } finally {
      setDeletingImageId(null)
    }
  }

  // Hapus gambar baru (sebelum submit)
  const handleRemoveNew = (index) => {
    setNewFiles(prev => prev.filter((_, i) => i !== index))
    setNewPreviews(prev => prev.filter((_, i) => i !== index))
  }

  // Submit: update content + upload gambar baru (existing sudah diatur via deleteExisting)
  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!content.trim()) {
      setError('Konten harus diisi')
      return
    }

    setLoading(true)
    setError('')
    try {
      // Kirim content + gambar baru saja (existing tidak disentuh)
      const imagesToUpload = newFiles.length > 0 ? newFiles : undefined
      await updatePost(post.id, { content: content.trim() }, imagesToUpload)
      if (onPostUpdated) onPostUpdated()
      if (onClose) onClose()
    } catch (err) {
      setError(err.response?.data?.error || 'Gagal mengupdate postingan')
    } finally {
      setLoading(false)
    }
  }

  const totalImageCount = existingImages.length + newFiles.length

  if (!isOpen || !post) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black bg-opacity-55" onClick={!loading ? handleClose : undefined} />

      {/* Modal */}
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-2xl mx-4 max-h-[92vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <h2 className="text-lg font-bold text-gray-900">Edit Postingan</h2>
          <button
            type="button"
            onClick={handleClose}
            disabled={loading}
            className="p-1.5 hover:bg-gray-100 rounded-full transition-colors text-gray-500 hover:text-gray-700"
          >
            <X size={20} />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto">
          <form onSubmit={handleSubmit}>
            {/* Author + Textarea */}
            <div className="flex gap-3 p-5 pb-3">
              <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0 overflow-hidden">
                {user?.profile?.fotoProfil ? (
                  <img
                    src={getImageUrl(user.profile.fotoProfil, 'profiles')}
                    alt={user.nama}
                    className="w-full h-full object-cover"
                    onError={(e) => { e.target.style.display = 'none' }}
                  />
                ) : (
                  <span className="text-blue-600 font-semibold text-sm">
                    {user?.nama?.charAt(0).toUpperCase()}
                  </span>
                )}
              </div>
              <div className="flex-1">
                <textarea
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  placeholder="Apa yang ingin Anda bagikan?"
                  className="w-full p-3 border border-gray-200 rounded-xl resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 placeholder-gray-400 bg-gray-50 focus:bg-white transition-colors"
                  rows="5"
                  maxLength={5000}
                  disabled={loading}
                />
                <div className="flex justify-between items-center mt-1">
                  {error ? (
                    <p className="text-red-500 text-xs">{error}</p>
                  ) : (
                    <span />
                  )}
                  <span className="text-xs text-gray-400">{content.length}/5000</span>
                </div>
              </div>
            </div>

            {/* Image Preview Area */}
            {(existingImages.length > 0 || newFiles.length > 0) && (
              <div className="px-5 pb-3">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                    Foto ({totalImageCount}/10)
                  </span>
                  {existingImages.length > 0 && newFiles.length === 0 && (
                    <span className="text-xs text-gray-400">— klik ✕ untuk hapus gambar tertentu</span>
                  )}
                </div>

                <div className="flex flex-wrap gap-2">
                  {/* Gambar Existing (dari server) */}
                  {existingImages.map((img) => (
                    <div
                      key={img.id}
                      className="relative w-20 h-20 rounded-xl overflow-hidden border border-gray-200 group bg-gray-100 flex-shrink-0 shadow-sm"
                    >
                      <img
                        src={getImageUrl(img.imageUrl)}
                        alt="Foto postingan"
                        className="w-full h-full object-cover"
                        onError={(e) => { e.target.src = '' }}
                      />
                      {/* Delete button */}
                      <button
                        type="button"
                        onClick={() => handleDeleteExisting(img.id)}
                        disabled={deletingImageId === img.id || loading}
                        className="absolute top-1 right-1 bg-black bg-opacity-60 text-white rounded-full p-0.5 hover:bg-red-600 transition-all shadow opacity-0 group-hover:opacity-100"
                      >
                        {deletingImageId === img.id
                          ? <Loader size={11} className="animate-spin" />
                          : <X size={11} />
                        }
                      </button>
                      {/* Label existing */}
                      <span className="absolute bottom-1 left-1 bg-blue-500 bg-opacity-80 text-white px-1 py-0.5 rounded text-[8px] font-bold leading-none">
                        Ada
                      </span>
                    </div>
                  ))}

                  {/* Gambar Baru (belum diupload) */}
                  {newPreviews.map((preview, idx) => (
                    <div
                      key={`new-${idx}`}
                      className="relative w-20 h-20 rounded-xl overflow-hidden border-2 border-dashed border-green-400 group bg-gray-100 flex-shrink-0 shadow-sm"
                    >
                      <img
                        src={preview}
                        alt={`Baru ${idx + 1}`}
                        className="w-full h-full object-cover"
                      />
                      <button
                        type="button"
                        onClick={() => handleRemoveNew(idx)}
                        disabled={loading}
                        className="absolute top-1 right-1 bg-black bg-opacity-60 text-white rounded-full p-0.5 hover:bg-red-600 transition-all shadow opacity-0 group-hover:opacity-100"
                      >
                        <X size={11} />
                      </button>
                      {/* Label baru */}
                      <span className="absolute bottom-1 left-1 bg-green-500 bg-opacity-90 text-white px-1 py-0.5 rounded text-[8px] font-bold leading-none">
                        Baru
                      </span>
                    </div>
                  ))}

                  {/* Tombol tambah gambar (jika masih bisa tambah) */}
                  {totalImageCount < 10 && (
                    <label className="w-20 h-20 rounded-xl border-2 border-dashed border-gray-300 hover:border-blue-400 flex flex-col items-center justify-center cursor-pointer text-gray-400 hover:text-blue-500 transition-colors flex-shrink-0 bg-gray-50 hover:bg-blue-50 group">
                      <Plus size={20} className="mb-0.5 group-hover:scale-110 transition-transform" />
                      <span className="text-[9px] font-medium text-center leading-tight">Tambah</span>
                      <input
                        type="file"
                        accept="image/*"
                        multiple
                        onChange={handleAddImages}
                        className="hidden"
                        disabled={loading}
                      />
                    </label>
                  )}
                </div>

                {newFiles.length > 0 && (
                  <p className="text-xs text-green-600 mt-2 font-medium">
                    ✓ {newFiles.length} gambar baru akan ditambahkan saat disimpan
                  </p>
                )}
              </div>
            )}

            {/* Footer Actions */}
            <div className="flex items-center justify-between px-5 py-4 border-t border-gray-100 bg-gray-50">
              {/* Tombol tambah foto (jika belum ada gambar sama sekali) */}
              {totalImageCount === 0 && (
                <label className="flex items-center gap-2 text-gray-500 cursor-pointer hover:text-blue-600 transition-colors group">
                  <ImageIcon size={18} className="group-hover:scale-110 transition-transform" />
                  <span className="text-sm font-medium">Tambah Foto</span>
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={handleAddImages}
                    className="hidden"
                    disabled={loading}
                  />
                </label>
              )}
              {totalImageCount > 0 && <span />}

              <div className="flex gap-2 ml-auto">
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleClose}
                  disabled={loading}
                  className="px-4"
                >
                  Batal
                </Button>
                <Button
                  type="submit"
                  disabled={loading || !content.trim()}
                  className="px-6"
                >
                  {loading ? (
                    <>
                      <Loader className="animate-spin inline mr-2" size={15} />
                      Menyimpan...
                    </>
                  ) : 'Simpan'}
                </Button>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}

export default EditPost
