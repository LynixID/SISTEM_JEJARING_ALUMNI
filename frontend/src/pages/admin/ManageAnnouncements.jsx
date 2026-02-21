import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Plus, Edit, Trash2, Eye, EyeOff, Search, X } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import api from '../../services/api'
import AdminSidebar from '../../components/layout/AdminSidebar'
import Header from '../../components/layout/Header'
import Sidebar from '../../components/layout/Sidebar'
import Button from '../../components/common/Button'
import Card from '../../components/common/Card'
import Input from '../../components/common/Input'
import ImageLightbox from '../../components/common/ImageLightbox'
import { getImageUrl } from '../../utils/imageUtils'

const ManageAnnouncements = () => {
  const { user } = useAuth()
  const navigate = useNavigate()
  const isAdmin = user?.role === 'ADMIN'
  const [announcements, setAnnouncements] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [publishedFilter, setPublishedFilter] = useState('')
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0
  })
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [lightboxImage, setLightboxImage] = useState({ isOpen: false, url: '', alt: '' })
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    image: '',
    published: false
  })

  useEffect(() => {
    fetchAnnouncements()
  }, [pagination.page, search, publishedFilter])

  const fetchAnnouncements = async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams({
        page: pagination.page,
        limit: pagination.limit,
        ...(search && { search }),
        ...(publishedFilter !== '' && { published: publishedFilter })
      })

      const response = await api.get(`/announcements?${params}`)
      setAnnouncements(response.data.announcements)
      setPagination(response.data.pagination)
    } catch (error) {
      console.error('Error fetching announcements:', error)
      alert(error.response?.data?.error || 'Gagal mengambil data berita')
    } finally {
      setLoading(false)
    }
  }

  const handleCreate = () => {
    navigate('/admin/announcements/create')
  }

  const handleEdit = (announcement) => {
    navigate(`/admin/announcements/edit/${announcement.id}`)
  }

  const handleEditOld = async (announcement) => {
    setEditingId(announcement.id)
    
    // Jika konten belum ada di objek pengumuman (dari daftar), ambil detail lengkap
    if (!announcement.content) {
      try {
        const response = await api.get(`/announcements/${announcement.id}`)
        const fullAnnouncement = response.data
        setFormData({
          title: fullAnnouncement.title || announcement.title,
          content: fullAnnouncement.content || '',
          image: fullAnnouncement.image || '',
          published: fullAnnouncement.published !== undefined ? fullAnnouncement.published : announcement.published
        })
      } catch (error) {
        console.error('Error fetching announcement details:', error)
        // Gunakan data yang sudah ada sebagai cadangan
        setFormData({
          title: announcement.title,
          content: '',
          image: announcement.image || '',
          published: announcement.published
        })
      }
    } else {
      setFormData({
        title: announcement.title,
        content: announcement.content || '',
        image: announcement.image || '',
        published: announcement.published
      })
    }
    setShowForm(true)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    try {
      if (editingId) {
        await api.put(`/announcements/${editingId}`, formData)
        alert('Berita berhasil diupdate')
      } else {
        await api.post('/announcements', formData)
        alert('Berita berhasil dibuat')
      }
      setShowForm(false)
      fetchAnnouncements()
    } catch (error) {
      alert(error.response?.data?.error || 'Gagal menyimpan berita')
    }
  }

  const handleDelete = async (id) => {
    if (!confirm('Apakah Anda yakin ingin menghapus berita ini?')) return

    try {
      await api.delete(`/announcements/${id}`)
      alert('Berita berhasil dihapus')
      fetchAnnouncements()
    } catch (error) {
      alert(error.response?.data?.error || 'Gagal menghapus berita')
    }
  }

  const handleTogglePublish = async (id, currentStatus) => {
    try {
      await api.put(`/announcements/${id}/publish`, { published: !currentStatus })
      fetchAnnouncements()
    } catch (error) {
      alert(error.response?.data?.error || 'Gagal mengupdate status publish')
    }
  }


  const renderContent = () => (
    <div className="p-6">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Kelola Pengumuman</h1>
        <Button onClick={handleCreate} className="flex items-center gap-2">
          <Plus size={20} />
          Tambah Pengumuman
        </Button>
      </div>

      {/* Filters */}
      <Card className="p-4 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <Input
              type="text"
              placeholder="Cari berita..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full"
            />
          </div>
          <div>
          </div>
          <div>
            <select
              value={publishedFilter}
              onChange={(e) => setPublishedFilter(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">Semua Status</option>
              <option value="true">Published</option>
              <option value="false">Draft</option>
            </select>
          </div>
          <div className="flex gap-2">
            {(search || publishedFilter) && (
              <Button
                variant="outline"
                onClick={() => {
                  setSearch('')
                  setPublishedFilter('')
                }}
                className="flex items-center gap-2"
              >
                <X size={16} />
                Reset
              </Button>
            )}
          </div>
        </div>
      </Card>

      {/* Announcements List */}
      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Gambar</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Judul</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Pembuat</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Views</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tanggal</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Aksi</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {loading && announcements.length === 0 ? (
                <tr>
                  <td colSpan="8" className="px-6 py-4 text-center text-gray-500">
                    Memuat data...
                  </td>
                </tr>
              ) : announcements.length === 0 ? (
                <tr>
                  <td colSpan="8" className="px-6 py-4 text-center text-gray-500">
                    Tidak ada berita
                  </td>
                </tr>
              ) : (
                announcements.map((announcement) => (
                  <tr key={announcement.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      {announcement.image ? (
                        <div 
                          className="w-16 h-16 rounded-lg overflow-hidden border border-gray-200 cursor-pointer hover:ring-2 hover:ring-blue-500 transition-all"
                          onClick={() => setLightboxImage({ 
                            isOpen: true, 
                            url: getImageUrl(announcement.image, 'announcements'), 
                            alt: announcement.title 
                          })}
                        >
                          <img
                            src={getImageUrl(announcement.image, 'announcements')}
                            alt={announcement.title}
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              e.target.style.display = 'none'
                              e.target.parentElement.innerHTML = '<div class="w-full h-full bg-gray-100 flex items-center justify-center text-gray-400 text-xs">No Image</div>'
                            }}
                          />
                        </div>
                      ) : (
                        <div className="w-16 h-16 rounded-lg bg-gray-100 flex items-center justify-center text-gray-400 text-xs">
                          No Image
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm font-medium text-gray-900">{announcement.title}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-700">
                        {announcement.authorName || 'Tidak diketahui'}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        announcement.published 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-gray-100 text-gray-800'
                      }`}>
                        {announcement.published ? 'Published' : 'Draft'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">{announcement.views || 0}</td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      {new Date(announcement.createdAt).toLocaleDateString('id-ID')}
                    </td>
                    <td className="px-6 py-4 text-right text-sm font-medium space-x-2">
                      <button
                        onClick={() => handleTogglePublish(announcement.id, announcement.published)}
                        className="text-blue-600 hover:text-blue-900"
                        title={announcement.published ? 'Unpublish' : 'Publish'}
                      >
                        {announcement.published ? <EyeOff size={18} /> : <Eye size={18} />}
                      </button>
                      <button
                        onClick={() => handleEdit(announcement)}
                        className="text-indigo-600 hover:text-indigo-900"
                      >
                        <Edit size={18} />
                      </button>
                      <button
                        onClick={() => handleDelete(announcement.id)}
                        className="text-red-600 hover:text-red-900"
                      >
                        <Trash2 size={18} />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {pagination.totalPages > 1 && (
          <div className="bg-gray-50 px-6 py-3 flex items-center justify-between border-t border-gray-200">
            <div className="text-sm text-gray-700">
              Menampilkan {(pagination.page - 1) * pagination.limit + 1} sampai{' '}
              {Math.min(pagination.page * pagination.limit, pagination.total)} dari {pagination.total} berita
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPagination({ ...pagination, page: pagination.page - 1 })}
                disabled={pagination.page === 1}
              >
                Sebelumnya
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPagination({ ...pagination, page: pagination.page + 1 })}
                disabled={pagination.page >= pagination.totalPages}
              >
                Selanjutnya
              </Button>
            </div>
          </div>
        )}
      </Card>
    </div>
  )

  if (loading && announcements.length === 0) {
    if (isAdmin) {
      return (
        <div className="flex min-h-screen bg-gray-50">
          <AdminSidebar />
          <div className="flex-1 flex items-center justify-center">
            <div className="text-gray-500">Memuat data...</div>
          </div>
        </div>
      )
    } else {
      return (
        <div className="min-h-screen bg-gray-50">
          <Header />
          <div className="flex">
            <Sidebar />
            <div className="flex-1 flex items-center justify-center min-h-[calc(100vh-4rem)]">
              <div className="text-gray-500">Memuat data...</div>
            </div>
          </div>
        </div>
      )
    }
  }

  return (
    <>
      {isAdmin ? (
        <div className="flex min-h-screen bg-gray-50">
          <AdminSidebar />
          <div className="flex-1 ml-0 md:ml-0">
            {renderContent()}
          </div>
        </div>
      ) : (
        <div className="min-h-screen bg-gray-50">
          <Header />
          <div className="flex">
            <Sidebar />
            <main className="flex-1">
              {renderContent()}
            </main>
          </div>
        </div>
      )}

      {/* Image Lightbox */}
      <ImageLightbox
        isOpen={lightboxImage.isOpen}
        onClose={() => setLightboxImage({ isOpen: false, url: '', alt: '' })}
        imageUrl={lightboxImage.url}
        alt={lightboxImage.alt}
      />

      {/* Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-3xl max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold text-gray-900">
                  {editingId ? 'Edit Berita' : 'Tambah Berita Baru'}
                </h2>
                <button
                  onClick={() => setShowForm(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X size={24} />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Judul *
                  </label>
                  <Input
                    type="text"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    required
                    minLength={5}
                    maxLength={200}
                    placeholder="Masukkan judul berita"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    URL Gambar (opsional)
                  </label>
                  <Input
                    type="url"
                    value={formData.image}
                    onChange={(e) => setFormData({ ...formData, image: e.target.value })}
                    placeholder="https://example.com/image.jpg"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Konten *
                  </label>
                  <textarea
                    value={formData.content}
                    onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                    required
                    minLength={10}
                    rows={10}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Masukkan konten berita..."
                  />
                </div>

                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="published"
                    checked={formData.published}
                    onChange={(e) => setFormData({ ...formData, published: e.target.checked })}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <label htmlFor="published" className="ml-2 block text-sm text-gray-700">
                    Publish langsung setelah dibuat
                  </label>
                </div>

                <div className="flex justify-end gap-3 pt-4 border-t">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setShowForm(false)}
                  >
                    Batal
                  </Button>
                  <Button type="submit">
                    {editingId ? 'Update' : 'Simpan'}
                  </Button>
                </div>
              </form>
            </div>
          </Card>
        </div>
      )}
    </>
  )
}

export default ManageAnnouncements
