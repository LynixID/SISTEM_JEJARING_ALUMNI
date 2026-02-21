import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, Save, FileText, Image as ImageIcon } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import api from '../../services/api'
import AdminSidebar from '../../components/layout/AdminSidebar'
import Header from '../../components/layout/Header'
import Sidebar from '../../components/layout/Sidebar'
import Button from '../../components/common/Button'
import Card from '../../components/common/Card'
import Input from '../../components/common/Input'
import RichTextEditor from '../../components/common/RichTextEditor'
import AlertModal from '../../components/common/AlertModal'
import { getImageUrl } from '../../utils/imageUtils'

const CreateAnnouncement = () => {
  const { user } = useAuth()
  const { id } = useParams()
  const navigate = useNavigate()
  const isAdmin = user?.role === 'ADMIN'
  const isEdit = !!id

  const [formData, setFormData] = useState({
    title: '',
    content: '',
    image: '',
    published: false
  })
  const [loading, setLoading] = useState(isEdit) // Mulai loading jika mode edit
  const [saving, setSaving] = useState(false)
  const [selectedFile, setSelectedFile] = useState(null)
  const [imagePreview, setImagePreview] = useState(null)
  const [uploading, setUploading] = useState(false)
  const [successModal, setSuccessModal] = useState({ isOpen: false, message: '' })
  const [errorModal, setErrorModal] = useState({ isOpen: false, message: '' })

  useEffect(() => {
    if (isEdit && id) {
      fetchAnnouncement()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id])

  const fetchAnnouncement = async () => {
    try {
      setLoading(true)
      const response = await api.get(`/announcements/${id}`)
      // Response mungkin berupa { announcement: {...} } atau langsung announcement
      const announcement = response.data.announcement || response.data
      
      if (!announcement) {
        throw new Error('Pengumuman tidak ditemukan')
      }

      setFormData({
        title: announcement.title || '',
        content: announcement.content || '',
        image: announcement.image || '',
        published: announcement.published !== undefined ? announcement.published : false
      })
      // Set preview untuk image yang sudah ada (extract filename jika full path)
      if (announcement.image) {
        // Jika image adalah full path, extract filename untuk disimpan di formData
        const imageFilename = announcement.image.includes('/') 
          ? announcement.image.split('/').pop() 
          : announcement.image
        setFormData(prev => ({ ...prev, image: imageFilename }))
        // Set preview dengan full URL
        setImagePreview(getImageUrl(announcement.image, 'announcements'))
      }
      
      console.log('Loaded announcement data for edit:', {
        title: announcement.title,
        content: announcement.content?.substring(0, 50) + '...',
        published: announcement.published
      })
    } catch (error) {
      console.error('Error fetching announcement:', error)
      setErrorModal({ 
        isOpen: true, 
        message: error.response?.data?.error || 'Gagal mengambil data pengumuman' 
      })
      setTimeout(() => {
        navigate(isAdmin ? '/admin/announcements' : '/pengurus/berita')
      }, 2000)
    } finally {
      setLoading(false)
    }
  }

  const handleFileSelect = (e) => {
    const file = e.target.files[0]
    
    if (!file) {
      return
    }

    // Validasi tipe file
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif']
    if (!allowedTypes.includes(file.type)) {
      setErrorModal({ 
        isOpen: true, 
        message: 'File type tidak didukung. Hanya file gambar (JPG, PNG, WebP, GIF) yang diperbolehkan.' 
      })
      e.target.value = ''
      return
    }

    // Validasi ukuran file (maks 5MB)
    const maxSize = 5 * 1024 * 1024 // 5MB
    if (file.size > maxSize) {
      setErrorModal({ 
        isOpen: true, 
        message: 'Ukuran file terlalu besar. Maksimal 5MB.' 
      })
      e.target.value = ''
      return
    }

    setSelectedFile(file)

    // Preview gambar
    const reader = new FileReader()
    reader.onloadend = () => {
      setImagePreview(reader.result)
    }
    reader.readAsDataURL(file)
  }

  const handleUploadImage = async () => {
    if (!selectedFile) {
      return null
    }

    try {
      setUploading(true)
      
      const uploadFormData = new FormData()
      uploadFormData.append('image', selectedFile)
      uploadFormData.append('category', 'announcements')

      const response = await api.post('/upload/image', uploadFormData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      })

      // Return filename untuk disimpan
      return response.data.filename
    } catch (error) {
      console.error('Error uploading image:', error)
      throw new Error(error.response?.data?.error || 'Gagal mengupload gambar')
    } finally {
      setUploading(false)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    // Validasi form
    if (!formData.title.trim()) {
      setErrorModal({ 
        isOpen: true, 
        message: 'Judul harus diisi' 
      })
      return
    }

    if (!formData.content.trim() || formData.content.replace(/<[^>]*>/g, '').trim().length < 10) {
      setErrorModal({ 
        isOpen: true, 
        message: 'Konten minimal 10 karakter' 
      })
      return
    }

    try {
      setSaving(true)
      
      // Upload gambar terlebih dahulu jika ada file baru yang dipilih
      let imageFilename = formData.image
      if (selectedFile) {
        try {
          imageFilename = await handleUploadImage()
          // Update formData dengan filename yang baru diupload
          setFormData(prev => ({
            ...prev,
            image: imageFilename
          }))
        } catch (uploadError) {
          setErrorModal({ 
            isOpen: true, 
            message: uploadError.message || 'Gagal mengupload gambar' 
          })
          setSaving(false)
          return
        }
      }
      
      // Siapkan data untuk dikirim (gunakan imageFilename yang sudah diupload atau yang sudah ada)
      const submitData = {
        ...formData,
        image: imageFilename || ''
      }
      
      if (isEdit) {
        await api.put(`/announcements/${id}`, submitData)
        setSuccessModal({ 
          isOpen: true, 
          message: 'Pengumuman berhasil diperbarui' 
        })
      } else {
        await api.post('/announcements', submitData)
        setSuccessModal({ 
          isOpen: true, 
          message: 'Pengumuman berhasil dibuat' 
        })
      }
    } catch (error) {
      console.error('Error saving announcement:', error)
      const errorMessage = error.response?.data?.error || error.response?.data?.errors?.[0]?.msg || 'Gagal menyimpan pengumuman'
      setErrorModal({ 
        isOpen: true, 
        message: errorMessage 
      })
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <>
        {isAdmin ? (
          <div className="flex min-h-screen bg-gray-50">
            <AdminSidebar />
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center">
                <div className="text-gray-500 mb-2">Memuat data pengumuman...</div>
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
              </div>
            </div>
          </div>
        ) : (
          <div className="min-h-screen bg-gray-50">
            <Header />
            <div className="flex">
              <Sidebar />
              <div className="flex-1 flex items-center justify-center min-h-[calc(100vh-4rem)]">
                <div className="text-center">
                  <div className="text-gray-500 mb-2">Memuat data pengumuman...</div>
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                </div>
              </div>
            </div>
          </div>
        )}
      </>
    )
  }

  return (
    <>
      {isAdmin ? (
        <div className="flex min-h-screen bg-gray-50">
          <AdminSidebar />
          <div className="flex-1 ml-0 md:ml-0 overflow-y-auto">
            <div className="p-6">
              {/* Header */}
              <div className="mb-6">
                <Button
                  variant="outline"
                  onClick={() => navigate('/admin/announcements')}
                  className="flex items-center gap-2 mb-4"
                >
                  <ArrowLeft size={18} />
                  Kembali ke Daftar Pengumuman
                </Button>
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-blue-100 rounded-lg">
                    <FileText className="text-blue-600" size={24} />
                  </div>
                  <div>
                    <h1 className="text-3xl font-bold text-gray-900">
                      {isEdit ? 'Edit Pengumuman' : 'Tambah Pengumuman Baru'}
                    </h1>
                    <p className="text-gray-600 mt-1">
                      {isEdit ? 'Perbarui informasi pengumuman' : 'Buat pengumuman baru untuk ditampilkan kepada alumni'}
                    </p>
                  </div>
                </div>
              </div>

              {/* Form */}
              <form onSubmit={handleSubmit}>
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  {/* Main Content - Left Side (2 columns) */}
                  <div className="lg:col-span-2 space-y-6">
                    {/* Judul */}
                    <Card className="p-6">
                      <label className="block text-sm font-medium text-gray-700 mb-3">
                        Judul Pengumuman *
                      </label>
                      <Input
                        type="text"
                        value={formData.title}
                        onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                        placeholder="Masukkan judul pengumuman yang menarik"
                        required
                        minLength={5}
                        maxLength={200}
                        className="w-full text-lg"
                      />
                      <div className="flex justify-between items-center mt-2">
                        <p className="text-xs text-gray-500">
                          Minimal 5 karakter, maksimal 200 karakter
                        </p>
                        <p className={`text-xs font-medium ${
                          formData.title.length > 200 ? 'text-red-600' : 'text-gray-500'
                        }`}>
                          {formData.title.length}/200
                        </p>
                      </div>
                    </Card>

                    {/* Konten - Rich Text Editor */}
                    <Card className="p-6">
                      <label className="block text-sm font-medium text-gray-700 mb-3">
                        Konten Pengumuman *
                      </label>
                      <RichTextEditor
                        value={formData.content}
                        onChange={(content) => setFormData({ ...formData, content })}
                        placeholder=""
                      />
                      <p className="mt-3 text-xs text-gray-500">
                        Konten minimal 10 karakter (tanpa HTML tags). Gunakan toolbar untuk memformat teks.
                      </p>
                      
                      {/* Preview */}
                      {formData.content && (
                        <div className="mt-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
                          <p className="text-xs font-medium text-gray-700 mb-2">Preview:</p>
                          <div 
                            className="text-sm text-gray-700 prose prose-sm max-w-none"
                            dangerouslySetInnerHTML={{ __html: formData.content }}
                          />
                        </div>
                      )}
                    </Card>
                  </div>

                  {/* Sidebar - Right Side (1 column) */}
                  <div className="lg:col-span-1 space-y-6">
                    {/* Kategori */}
                    <Card className="p-6">
                      <h3 className="text-sm font-semibold text-gray-900 mb-4">Informasi Pengumuman</h3>
                      
                      <div className="space-y-4">

                        {/* Upload Gambar */}
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            <ImageIcon size={16} className="inline mr-1" />
                            Gambar (opsional)
                          </label>
                          <input
                            type="file"
                            accept="image/jpeg,image/jpg,image/png,image/webp,image/gif"
                            onChange={handleFileSelect}
                            className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 cursor-pointer border border-gray-300 rounded-lg p-2"
                          />
                          <p className="mt-2 text-xs text-gray-500">
                            Format: JPG, PNG, WebP, GIF. Maksimal 5MB
                          </p>
                          
                          {/* Preview gambar yang dipilih */}
                          {imagePreview && (
                            <div className="mt-3 rounded-lg overflow-hidden border border-gray-200">
                              <img
                                src={imagePreview}
                                alt="Preview"
                                className="w-full h-48 object-cover"
                                onError={(e) => {
                                  e.target.style.display = 'none'
                                  const errorDiv = e.target.nextSibling
                                  if (errorDiv) errorDiv.style.display = 'block'
                                }}
                              />
                              <div className="hidden p-4 bg-gray-100 text-center text-sm text-gray-500">
                                Gambar tidak dapat dimuat
                              </div>
                              <button
                                type="button"
                                onClick={() => {
                                  setImagePreview(null)
                                  setSelectedFile(null)
                                  setFormData(prev => ({ ...prev, image: '' }))
                                  // Reset file input
                                  const fileInput = document.querySelector('input[type="file"]')
                                  if (fileInput) fileInput.value = ''
                                }}
                                className="w-full mt-2 px-3 py-2 text-sm text-red-600 hover:bg-red-50 rounded-lg border border-red-200"
                              >
                                Hapus Gambar
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    </Card>

                    {/* Status Publish */}
                    <Card className="p-6">
                      <h3 className="text-sm font-semibold text-gray-900 mb-4">Pengaturan Publikasi</h3>
                      
                      <div className="flex items-start gap-3 p-4 bg-gray-50 rounded-lg border border-gray-200">
                        <input
                          type="checkbox"
                          id="published"
                          checked={formData.published}
                          onChange={(e) => setFormData({ ...formData, published: e.target.checked })}
                          className="h-5 w-5 text-blue-600 focus:ring-blue-500 border-gray-300 rounded mt-0.5"
                        />
                        <div className="flex-1">
                          <label htmlFor="published" className="block text-sm font-medium text-gray-700 cursor-pointer">
                            Publish Langsung
                          </label>
                          <p className="text-xs text-gray-500 mt-1">
                            Jika dicentang, pengumuman akan langsung tampil di halaman Berita untuk semua user setelah disimpan.
                          </p>
                        </div>
                      </div>
                    </Card>

                    {/* Action Buttons */}
                    <Card className="p-6 bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-200">
                      <div className="space-y-3">
                        <Button
                          type="submit"
                          disabled={saving || loading || uploading}
                          className="w-full flex items-center justify-center gap-2 py-3"
                        >
                          {(saving || uploading) ? (
                            <>
                              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                              {uploading ? 'Mengupload gambar...' : 'Menyimpan...'}
                            </>
                          ) : (
                            <>
                              <Save size={18} />
                              {isEdit ? 'Update Pengumuman' : 'Simpan Pengumuman'}
                            </>
                          )}
                        </Button>
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => navigate(isAdmin ? '/admin/announcements' : '/pengurus/berita')}
                          disabled={saving}
                          className="w-full"
                        >
                          Batal
                        </Button>
                      </div>
                    </Card>
                  </div>
                </div>
              </form>
            </div>
          </div>
        </div>
      ) : (
        <div className="min-h-screen bg-gray-50">
          <Header />
          <div className="flex">
            <Sidebar />
            <main className="flex-1 overflow-y-auto">
              <div className="p-6">
                {/* Header */}
                <div className="mb-6">
                  <Button
                    variant="outline"
                    onClick={() => navigate('/pengurus/berita')}
                    className="flex items-center gap-2 mb-4"
                  >
                    <ArrowLeft size={18} />
                    Kembali ke Daftar Pengumuman
                  </Button>
                  <div className="flex items-center gap-3">
                    <div className="p-3 bg-blue-100 rounded-lg">
                      <FileText className="text-blue-600" size={24} />
                    </div>
                    <div>
                      <h1 className="text-3xl font-bold text-gray-900">
                        {isEdit ? 'Edit Pengumuman' : 'Tambah Pengumuman Baru'}
                      </h1>
                      <p className="text-gray-600 mt-1">
                        {isEdit ? 'Perbarui informasi pengumuman' : 'Buat pengumuman baru untuk ditampilkan kepada alumni'}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Form - Same as admin */}
                <form onSubmit={handleSubmit}>
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Main Content */}
                    <div className="lg:col-span-2 space-y-6">
                      <Card className="p-6">
                        <label className="block text-sm font-medium text-gray-700 mb-3">
                          Judul Pengumuman *
                        </label>
                        <Input
                          type="text"
                          value={formData.title}
                          onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                          placeholder="Masukkan judul pengumuman yang menarik"
                          required
                          minLength={5}
                          maxLength={200}
                          className="w-full text-lg"
                        />
                        <div className="flex justify-between items-center mt-2">
                          <p className="text-xs text-gray-500">
                            Minimal 5 karakter, maksimal 200 karakter
                          </p>
                          <p className={`text-xs font-medium ${
                            formData.title.length > 200 ? 'text-red-600' : 'text-gray-500'
                          }`}>
                            {formData.title.length}/200
                          </p>
                        </div>
                      </Card>

                      <Card className="p-6">
                        <label className="block text-sm font-medium text-gray-700 mb-3">
                          Konten Pengumuman *
                        </label>
                        <RichTextEditor
                          value={formData.content}
                          onChange={(content) => setFormData({ ...formData, content })}
                          placeholder="Tulis konten pengumuman di sini..."
                        />
                        {formData.content && (
                          <div className="mt-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
                            <p className="text-xs font-medium text-gray-700 mb-2">Preview:</p>
                            <div 
                              className="text-sm text-gray-700 prose prose-sm max-w-none"
                              dangerouslySetInnerHTML={{ __html: formData.content }}
                            />
                          </div>
                        )}
                      </Card>
                    </div>

                    {/* Sidebar */}
                    <div className="lg:col-span-1 space-y-6">
                      <Card className="p-6">
                        <h3 className="text-sm font-semibold text-gray-900 mb-4">Informasi</h3>
                        <div className="space-y-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              <ImageIcon size={16} className="inline mr-1" />
                              Gambar (opsional)
                            </label>
                            <input
                              type="file"
                              accept="image/jpeg,image/jpg,image/png,image/webp,image/gif"
                              onChange={handleFileSelect}
                              className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 cursor-pointer border border-gray-300 rounded-lg p-2"
                            />
                            <p className="mt-2 text-xs text-gray-500">
                              Format: JPG, PNG, WebP, GIF. Maksimal 5MB
                            </p>
                            
                            {imagePreview && (
                              <div className="mt-3 rounded-lg overflow-hidden border border-gray-200">
                                <img
                                  src={imagePreview}
                                  alt="Preview"
                                  className="w-full h-48 object-cover"
                                  onError={(e) => {
                                    e.target.style.display = 'none'
                                    const errorDiv = e.target.nextSibling
                                    if (errorDiv) errorDiv.style.display = 'block'
                                  }}
                                />
                                <div className="hidden p-4 bg-gray-100 text-center text-sm text-gray-500">
                                  Gambar tidak dapat dimuat
                                </div>
                                <button
                                  type="button"
                                  onClick={() => {
                                    setImagePreview(null)
                                    setSelectedFile(null)
                                    setFormData(prev => ({ ...prev, image: '' }))
                                    // Reset file input
                                    const fileInput = document.querySelector('input[type="file"]')
                                    if (fileInput) fileInput.value = ''
                                  }}
                                  className="w-full mt-2 px-3 py-2 text-sm text-red-600 hover:bg-red-50 rounded-lg border border-red-200"
                                >
                                  Hapus Gambar
                                </button>
                              </div>
                            )}
                          </div>
                        </div>
                      </Card>

                      <Card className="p-6">
                        <h3 className="text-sm font-semibold text-gray-900 mb-4">Pengaturan</h3>
                        <div className="flex items-start gap-3 p-4 bg-gray-50 rounded-lg">
                          <input
                            type="checkbox"
                            id="published"
                            checked={formData.published}
                            onChange={(e) => setFormData({ ...formData, published: e.target.checked })}
                            className="h-5 w-5 text-blue-600 focus:ring-blue-500 border-gray-300 rounded mt-0.5"
                          />
                          <label htmlFor="published" className="text-sm font-medium text-gray-700 cursor-pointer">
                            Publish Langsung
                          </label>
                        </div>
                      </Card>

                      <Card className="p-6 bg-gradient-to-br from-blue-50 to-indigo-50">
                        <div className="space-y-3">
                          <Button
                            type="submit"
                            disabled={saving || uploading}
                            className="w-full flex items-center justify-center gap-2 py-3"
                          >
                            {(saving || uploading) ? (
                              <>
                                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                                {uploading ? 'Mengupload gambar...' : 'Menyimpan...'}
                              </>
                            ) : (
                              <>
                                <Save size={18} />
                                {isEdit ? 'Update' : 'Simpan'}
                              </>
                            )}
                          </Button>
                          <Button
                            type="button"
                            variant="outline"
                            onClick={() => navigate('/pengurus/berita')}
                            className="w-full"
                          >
                            Batal
                          </Button>
                        </div>
                      </Card>
                    </div>
                  </div>
                </form>
              </div>
            </main>
          </div>
        </div>
      )}

      {/* Success Modal */}
      <AlertModal
        isOpen={successModal.isOpen}
        onClose={() => {
          setSuccessModal({ isOpen: false, message: '' })
          navigate(isAdmin ? '/admin/announcements' : '/pengurus/berita')
        }}
        title="Berhasil"
        message={successModal.message}
        variant="success"
        buttonText="OK"
      />

      {/* Error Modal */}
      <AlertModal
        isOpen={errorModal.isOpen}
        onClose={() => setErrorModal({ isOpen: false, message: '' })}
        title="Error"
        message={errorModal.message}
        variant="error"
        buttonText="OK"
      />
    </>
  )
}

export default CreateAnnouncement
