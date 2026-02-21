import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, Save, Calendar, Image as ImageIcon, MapPin, Link as LinkIcon } from 'lucide-react'
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

const CreateEvent = () => {
  const { user } = useAuth()
  const { id } = useParams()
  const navigate = useNavigate()
  const isAdmin = user?.role === 'ADMIN'
  const isEdit = !!id

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    image: '',
    tanggal: '',
    lokasi: '',
    linkDaftar: '',
    published: false
  })
  const [loading, setLoading] = useState(isEdit) // Mulai loading jika mode edit
  const [saving, setSaving] = useState(false)
  const [selectedFile, setSelectedFile] = useState(null)
  const [imagePreview, setImagePreview] = useState(null)
  const [successModal, setSuccessModal] = useState({ isOpen: false, message: '' })
  const [errorModal, setErrorModal] = useState({ isOpen: false, message: '' })

  useEffect(() => {
    if (isEdit && id) {
      fetchEvent()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id])

  const fetchEvent = async () => {
    try {
      setLoading(true)
      const response = await api.get(`/events/${id}`)
      // Response mungkin berupa { event: {...} } atau langsung event
      const event = response.data.event || response.data
      
      if (!event) {
        throw new Error('Event tidak ditemukan')
      }

      // Format tanggal untuk datetime-local input
      const tanggalDate = event.tanggal ? new Date(event.tanggal) : new Date()
      const tanggalFormatted = tanggalDate.toISOString().slice(0, 16)

      setFormData({
        title: event.title || '',
        description: event.description || '',
        image: event.image || '',
        tanggal: tanggalFormatted,
        lokasi: event.lokasi || '',
        linkDaftar: event.linkDaftar || '',
        published: event.published !== undefined ? event.published : false
      })
      // Set preview untuk image yang sudah ada
      if (event.image) {
        setImagePreview(event.image)
      }
      
      console.log('Loaded event data for edit:', {
        title: event.title,
        description: event.description?.substring(0, 50) + '...',
        tanggal: event.tanggal,
        published: event.published
      })
    } catch (error) {
      console.error('Error fetching event:', error)
      setErrorModal({ 
        isOpen: true, 
        message: error.response?.data?.error || 'Gagal mengambil data event' 
      })
      setTimeout(() => {
        navigate(isAdmin ? '/admin/events' : '/pengurus/events')
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

  // Fungsi untuk upload image (dipanggil langsung saat submit)
  const uploadImageFile = async (file) => {
    const formData = new FormData()
    formData.append('image', file)
    formData.append('category', 'events')

    const response = await api.post('/upload/image', formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    })

    if (!response.data.filename) {
      throw new Error('Filename tidak ditemukan dalam response')
    }

    return response.data.filename
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    // Validasi form terlebih dahulu
    if (!formData.title.trim()) {
      setErrorModal({ 
        isOpen: true, 
        message: 'Judul harus diisi' 
      })
      return
    }

    if (!formData.description.trim() || formData.description.replace(/<[^>]*>/g, '').trim().length < 10) {
      setErrorModal({ 
        isOpen: true, 
        message: 'Deskripsi minimal 10 karakter' 
      })
      return
    }

    if (!formData.tanggal) {
      setErrorModal({ 
        isOpen: true, 
        message: 'Tanggal event harus diisi' 
      })
      return
    }

    let uploadedFilename = null
    
    // Upload gambar terlebih dahulu jika ada file baru yang dipilih
    if (selectedFile) {
      try {
        setSaving(true) // Set loading state untuk menunjukkan proses upload
        uploadedFilename = await uploadImageFile(selectedFile)
        console.log('Image uploaded, filename:', uploadedFilename)
        
        // Update preview dengan URL dari server
        setImagePreview(`/uploads/images/events/${uploadedFilename}`)
        // Update formData dengan filename yang baru
        setFormData(prev => ({
          ...prev,
          image: uploadedFilename
        }))
        setSelectedFile(null) // Clear selected file setelah upload
      } catch (error) {
        console.error('Error uploading image:', error)
        setErrorModal({ 
          isOpen: true, 
          message: error.response?.data?.error || 'Gagal mengupload image' 
        })
        setSaving(false)
        return // Jangan lanjutkan submit jika upload gagal
      }
    }
    
    try {
      // setSaving sudah di-set di atas jika ada selectedFile
      if (!selectedFile) {
        setSaving(true)
      }
      
      // Ubah tanggal ke ISO string dan tangani string kosong untuk field opsional
      // Gunakan uploadedFilename jika baru diupload, atau formData.image jika sudah ada
      const imageValue = uploadedFilename || (formData.image && formData.image.trim() ? formData.image.trim() : null)
      
      const eventData = {
        title: formData.title.trim(),
        description: formData.description.trim(),
        tanggal: new Date(formData.tanggal).toISOString(),
        lokasi: formData.lokasi?.trim() || null,
        image: imageValue,
        linkDaftar: formData.linkDaftar?.trim() || null,
        published: formData.published || false
      }
      
      console.log('Current formData:', formData)
      console.log('Uploaded filename:', uploadedFilename)
      console.log('Image value to send:', imageValue)
      console.log('Sending event data:', eventData)
      
      if (isEdit) {
        await api.put(`/events/${id}`, eventData)
        setSuccessModal({ 
          isOpen: true, 
          message: 'Event berhasil diperbarui' 
        })
      } else {
        await api.post('/events', eventData)
        setSuccessModal({ 
          isOpen: true, 
          message: 'Event berhasil dibuat' 
        })
      }
    } catch (error) {
      console.error('Error saving event:', error)
      console.error('Error response:', error.response?.data)
      
      // Penanganan error yang lebih baik
      let errorMessage = 'Gagal menyimpan event'
      if (error.response?.data?.errors && Array.isArray(error.response.data.errors)) {
        errorMessage = error.response.data.errors.map(err => err.msg || err.message).join(', ')
      } else if (error.response?.data?.error) {
        errorMessage = error.response.data.error
      }
      
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
                <div className="text-gray-500 mb-2">Memuat data event...</div>
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
                  <div className="text-gray-500 mb-2">Memuat data event...</div>
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
                  onClick={() => navigate('/admin/events')}
                  className="flex items-center gap-2 mb-4"
                >
                  <ArrowLeft size={18} />
                  Kembali ke Daftar Event
                </Button>
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-blue-100 rounded-lg">
                    <Calendar className="text-blue-600" size={24} />
                  </div>
                  <div>
                    <h1 className="text-3xl font-bold text-gray-900">
                      {isEdit ? 'Edit Event' : 'Tambah Event Baru'}
                    </h1>
                    <p className="text-gray-600 mt-1">
                      {isEdit ? 'Perbarui informasi event' : 'Buat event baru untuk ditampilkan kepada alumni'}
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
                        Judul Event *
                      </label>
                      <Input
                        type="text"
                        value={formData.title}
                        onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                        placeholder="Masukkan judul event yang menarik"
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

                    {/* Deskripsi - Rich Text Editor */}
                    <Card className="p-6">
                      <label className="block text-sm font-medium text-gray-700 mb-3">
                        Deskripsi Event *
                      </label>
                      <RichTextEditor
                        value={formData.description}
                        onChange={(description) => setFormData({ ...formData, description })}
                        placeholder=""
                      />
                      <p className="mt-3 text-xs text-gray-500">
                        Deskripsi minimal 10 karakter (tanpa HTML tags). Gunakan toolbar untuk memformat teks.
                      </p>
                      
                      {/* Preview */}
                      {formData.description && (
                        <div className="mt-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
                          <p className="text-xs font-medium text-gray-700 mb-2">Preview:</p>
                          <div 
                            className="text-sm text-gray-700 prose prose-sm max-w-none"
                            dangerouslySetInnerHTML={{ __html: formData.description }}
                          />
                        </div>
                      )}
                    </Card>
                  </div>

                  {/* Sidebar - Right Side (1 column) */}
                  <div className="lg:col-span-1 space-y-6">
                    {/* Informasi Event */}
                    <Card className="p-6">
                      <h3 className="text-sm font-semibold text-gray-900 mb-4">Informasi Event</h3>
                      
                      <div className="space-y-4">
                        {/* Tanggal */}
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            <Calendar size={16} className="inline mr-1" />
                            Tanggal & Waktu Event *
                          </label>
                          <Input
                            type="datetime-local"
                            value={formData.tanggal}
                            onChange={(e) => setFormData({ ...formData, tanggal: e.target.value })}
                            required
                            className="w-full"
                          />
                        </div>

                        {/* Lokasi */}
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            <MapPin size={16} className="inline mr-1" />
                            Lokasi (opsional)
                          </label>
                          <Input
                            type="text"
                            value={formData.lokasi}
                            onChange={(e) => setFormData({ ...formData, lokasi: e.target.value })}
                            placeholder="Contoh: Gedung A, Ruang 101"
                            maxLength={255}
                            className="w-full"
                          />
                        </div>

                      </div>
                    </Card>

                    {/* Media & Link */}
                    <Card className="p-6">
                      <h3 className="text-sm font-semibold text-gray-900 mb-4">Media & Link</h3>
                      
                      <div className="space-y-4">
                        {/* Upload Image */}
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            <ImageIcon size={16} className="inline mr-1" />
                            Image (opsional)
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
                          
                          {/* Preview untuk file yang dipilih */}
                          {selectedFile && (
                            <div className="mt-3">
                              <div className="rounded-lg overflow-hidden border border-gray-200">
                                <img
                                  src={imagePreview}
                                  alt="Preview"
                                  className="w-full h-48 object-cover"
                                />
                              </div>
                              <p className="mt-2 text-xs text-gray-500">
                                Gambar akan diupload otomatis saat menyimpan event
                              </p>
                            </div>
                          )}
                          
                          {/* Preview untuk image yang sudah ada atau sudah diupload */}
                          {!selectedFile && imagePreview && (
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
                                Image tidak dapat dimuat
                              </div>
                              <button
                                type="button"
                                onClick={() => {
                                  setImagePreview(null)
                                  setFormData(prev => ({ ...prev, image: '' }))
                                }}
                                className="w-full mt-2 px-3 py-2 text-sm text-red-600 hover:bg-red-50 rounded-lg border border-red-200"
                              >
                                Hapus Image
                              </button>
                            </div>
                          )}
                        </div>

                        {/* Link Daftar */}
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            <LinkIcon size={16} className="inline mr-1" />
                            Link Pendaftaran (opsional)
                          </label>
                          <Input
                            type="url"
                            value={formData.linkDaftar}
                            onChange={(e) => setFormData({ ...formData, linkDaftar: e.target.value })}
                            placeholder="https://example.com/daftar"
                            className="w-full"
                          />
                          <p className="mt-1 text-xs text-gray-500">
                            Link untuk pendaftaran event (Google Form, dll)
                          </p>
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
                            Jika dicentang, event akan langsung tampil di halaman Event untuk semua user setelah disimpan.
                          </p>
                        </div>
                      </div>
                    </Card>

                    {/* Action Buttons */}
                    <Card className="p-6 bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-200">
                      <div className="space-y-3">
                        <Button
                          type="submit"
                          disabled={saving || loading}
                          className="w-full flex items-center justify-center gap-2 py-3"
                        >
                          {saving ? (
                            <>
                              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                              Menyimpan...
                            </>
                          ) : (
                            <>
                              <Save size={18} />
                              {isEdit ? 'Update Event' : 'Simpan Event'}
                            </>
                          )}
                        </Button>
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => navigate(isAdmin ? '/admin/events' : '/pengurus/events')}
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
                    onClick={() => navigate('/pengurus/events')}
                    className="flex items-center gap-2 mb-4"
                  >
                    <ArrowLeft size={18} />
                    Kembali ke Daftar Event
                  </Button>
                  <div className="flex items-center gap-3">
                    <div className="p-3 bg-blue-100 rounded-lg">
                      <Calendar className="text-blue-600" size={24} />
                    </div>
                    <div>
                      <h1 className="text-3xl font-bold text-gray-900">
                        {isEdit ? 'Edit Event' : 'Tambah Event Baru'}
                      </h1>
                      <p className="text-gray-600 mt-1">
                        {isEdit ? 'Perbarui informasi event' : 'Buat event baru untuk ditampilkan kepada alumni'}
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
                          Judul Event *
                        </label>
                        <Input
                          type="text"
                          value={formData.title}
                          onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                          placeholder="Masukkan judul event yang menarik"
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
                          Deskripsi Event *
                        </label>
                        <RichTextEditor
                          value={formData.description}
                          onChange={(description) => setFormData({ ...formData, description })}
                          placeholder=""
                        />
                        {formData.description && (
                          <div className="mt-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
                            <p className="text-xs font-medium text-gray-700 mb-2">Preview:</p>
                            <div 
                              className="text-sm text-gray-700 prose prose-sm max-w-none"
                              dangerouslySetInnerHTML={{ __html: formData.description }}
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
                              <Calendar size={16} className="inline mr-1" />
                              Tanggal & Waktu *
                            </label>
                            <Input
                              type="datetime-local"
                              value={formData.tanggal}
                              onChange={(e) => setFormData({ ...formData, tanggal: e.target.value })}
                              required
                              className="w-full"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              <MapPin size={16} className="inline mr-1" />
                              Lokasi
                            </label>
                            <Input
                              type="text"
                              value={formData.lokasi}
                              onChange={(e) => setFormData({ ...formData, lokasi: e.target.value })}
                              placeholder="Contoh: Gedung A, Ruang 101"
                              className="w-full"
                            />
                          </div>
                        </div>
                      </Card>

                      <Card className="p-6">
                        <h3 className="text-sm font-semibold text-gray-900 mb-4">Media & Link</h3>
                        <div className="space-y-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              <ImageIcon size={16} className="inline mr-1" />
                              Image (opsional)
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
                            
                            {selectedFile && (
                              <div className="mt-3">
                                <div className="rounded-lg overflow-hidden border border-gray-200">
                                  <img
                                    src={imagePreview}
                                    alt="Preview"
                                    className="w-full h-48 object-cover"
                                  />
                                </div>
                                <p className="mt-2 text-xs text-gray-500">
                                  Gambar akan diupload otomatis saat menyimpan event
                                </p>
                              </div>
                            )}
                            
                            {!selectedFile && imagePreview && (
                              <div className="mt-3 rounded-lg overflow-hidden border border-gray-200">
                                <img
                                  src={imagePreview}
                                  alt="Preview"
                                  className="w-full h-48 object-cover"
                                />
                                <button
                                  type="button"
                                  onClick={() => {
                                    setImagePreview(null)
                                    setFormData(prev => ({ ...prev, image: '' }))
                                  }}
                                  className="w-full mt-2 px-3 py-2 text-sm text-red-600 hover:bg-red-50 rounded-lg border border-red-200"
                                >
                                  Hapus Image
                                </button>
                              </div>
                            )}
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              <LinkIcon size={16} className="inline mr-1" />
                              Link Pendaftaran
                            </label>
                            <Input
                              type="url"
                              value={formData.linkDaftar}
                              onChange={(e) => setFormData({ ...formData, linkDaftar: e.target.value })}
                              placeholder="https://example.com/daftar"
                              className="w-full"
                            />
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
                            disabled={saving}
                            className="w-full flex items-center justify-center gap-2 py-3"
                          >
                            <Save size={18} />
                            {isEdit ? 'Update' : 'Simpan'}
                          </Button>
                          <Button
                            type="button"
                            variant="outline"
                            onClick={() => navigate('/pengurus/events')}
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
          navigate(isAdmin ? '/admin/events' : '/pengurus/events')
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

export default CreateEvent

