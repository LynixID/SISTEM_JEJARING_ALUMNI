import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Plus, Edit, Trash2, Eye, EyeOff, X, Calendar, MapPin, Users } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import api from '../../services/api'
import AdminSidebar from '../../components/layout/AdminSidebar'
import Header from '../../components/layout/Header'
import Sidebar from '../../components/layout/Sidebar'
import Button from '../../components/common/Button'
import Card from '../../components/common/Card'
import Input from '../../components/common/Input'
import AlertModal from '../../components/common/AlertModal'
import ImageLightbox from '../../components/common/ImageLightbox'
import { getImageUrl } from '../../utils/imageUtils'

const ManageEvents = () => {
  const { user } = useAuth()
  const navigate = useNavigate()
  const isAdmin = user?.role === 'ADMIN'
  const [events, setEvents] = useState([])
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
  const [showParticipants, setShowParticipants] = useState(null)
  const [participants, setParticipants] = useState([])
  const [editingId, setEditingId] = useState(null)
  const [lightboxImage, setLightboxImage] = useState({ isOpen: false, url: '', alt: '' })
  const [successModal, setSuccessModal] = useState({ isOpen: false, message: '' })
  const [errorModal, setErrorModal] = useState({ isOpen: false, message: '' })
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    tanggal: '',
    lokasi: '',
    image: '',
    linkDaftar: '',
    published: false
  })

  useEffect(() => {
    fetchEvents()
  }, [pagination.page, search, publishedFilter])

  const fetchEvents = async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams({
        page: pagination.page,
        limit: pagination.limit,
        ...(search && { search }),
        ...(publishedFilter !== '' && { published: publishedFilter })
      })

      const response = await api.get(`/events?${params}`)
      setEvents(response.data.events)
      setPagination(response.data.pagination)
    } catch (error) {
      console.error('Error fetching events:', error)
      setErrorModal({ 
        isOpen: true, 
        message: error.response?.data?.error || 'Gagal mengambil data event' 
      })
    } finally {
      setLoading(false)
    }
  }

  const fetchParticipants = async (eventId) => {
    try {
      const response = await api.get(`/events/${eventId}/participants`)
      setParticipants(response.data.participants)
      setShowParticipants(eventId)
    } catch (error) {
      console.error('Error fetching participants:', error)
      setErrorModal({ 
        isOpen: true, 
        message: error.response?.data?.error || 'Gagal mengambil data peserta' 
      })
    }
  }

  const handleCreate = () => {
    navigate(isAdmin ? '/admin/events/create' : '/pengurus/events/create')
  }

  const handleEdit = (event) => {
    navigate(isAdmin ? `/admin/events/edit/${event.id}` : `/pengurus/events/edit/${event.id}`)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    try {
      const dataToSend = {
        ...formData,
        tanggal: new Date(formData.tanggal).toISOString()
      }

      if (editingId) {
        await api.put(`/events/${editingId}`, dataToSend)
        setSuccessModal({ 
          isOpen: true, 
          message: 'Event berhasil diupdate' 
        })
      } else {
        await api.post('/events', dataToSend)
        setSuccessModal({ 
          isOpen: true, 
          message: 'Event berhasil dibuat' 
        })
      }
      setShowForm(false)
      fetchEvents()
    } catch (error) {
      setErrorModal({ 
        isOpen: true, 
        message: error.response?.data?.error || 'Gagal menyimpan event' 
      })
    }
  }

  const handleDelete = async (id) => {
    if (!confirm('Apakah Anda yakin ingin menghapus event ini?')) return

    try {
      await api.delete(`/events/${id}`)
      setSuccessModal({ 
        isOpen: true, 
        message: 'Event berhasil dihapus' 
      })
      fetchEvents()
    } catch (error) {
      setErrorModal({ 
        isOpen: true, 
        message: error.response?.data?.error || 'Gagal menghapus event' 
      })
    }
  }

  const handleTogglePublish = async (id, currentStatus) => {
    try {
      await api.put(`/events/${id}/publish`, { published: !currentStatus })
      fetchEvents()
    } catch (error) {
      setErrorModal({ 
        isOpen: true, 
        message: error.response?.data?.error || 'Gagal mengupdate status publish' 
      })
    }
  }

  const formatDate = (dateString) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('id-ID', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const formatDateShort = (dateString) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('id-ID', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  const isUpcoming = (dateString) => {
    return new Date(dateString) > new Date()
  }

  const renderContent = () => (
    <div className="p-6">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Kelola Event</h1>
        <Button onClick={handleCreate} className="flex items-center gap-2">
          <Plus size={20} />
          Tambah Event
        </Button>
      </div>

      {/* Filters */}
      <Card className="p-4 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <Input
              type="text"
              placeholder="Cari event..."
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

      {/* Events List */}
      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Image</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Judul</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tanggal</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Lokasi</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Pembuat</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Aksi</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {loading && events.length === 0 ? (
                <tr>
                  <td colSpan="8" className="px-6 py-4 text-center text-gray-500">
                    Memuat data...
                  </td>
                </tr>
              ) : events.length === 0 ? (
                <tr>
                  <td colSpan="8" className="px-6 py-4 text-center text-gray-500">
                    Tidak ada event
                  </td>
                </tr>
              ) : (
                events.map((event) => (
                  <tr key={event.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      {event.image ? (
                        <div 
                          className="w-16 h-16 rounded-lg overflow-hidden border border-gray-200 cursor-pointer hover:ring-2 hover:ring-blue-500 transition-all"
                          onClick={() => setLightboxImage({ 
                            isOpen: true, 
                            url: getImageUrl(event.image, 'events'), 
                            alt: event.title 
                          })}
                        >
                          <img
                            src={getImageUrl(event.image, 'events')}
                            alt={event.title}
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
                      <div className="text-sm font-medium text-gray-900">{event.title}</div>
                      <div className="text-xs text-gray-500 mt-1 line-clamp-2">{event.description?.substring(0, 60)}...</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-900">{formatDateShort(event.tanggal)}</div>
                      <div className={`text-xs ${isUpcoming(event.tanggal) ? 'text-green-600' : 'text-gray-500'}`}>
                        {isUpcoming(event.tanggal) ? 'Akan datang' : 'Sudah lewat'}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      {event.lokasi || '-'}
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-700">
                        {event.authorName || 'Tidak diketahui'}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        event.published 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-gray-100 text-gray-800'
                      }`}>
                        {event.published ? 'Published' : 'Draft'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right text-sm font-medium space-x-2">
                      <button
                        onClick={() => fetchParticipants(event.id)}
                        className="text-blue-600 hover:text-blue-900"
                        title="Lihat peserta"
                      >
                        <Users size={18} />
                      </button>
                      <button
                        onClick={() => handleTogglePublish(event.id, event.published)}
                        className="text-indigo-600 hover:text-indigo-900"
                        title={event.published ? 'Unpublish' : 'Publish'}
                      >
                        {event.published ? <EyeOff size={18} /> : <Eye size={18} />}
                      </button>
                      <button
                        onClick={() => handleEdit(event)}
                        className="text-indigo-600 hover:text-indigo-900"
                      >
                        <Edit size={18} />
                      </button>
                      {isAdmin && (
                        <button
                          onClick={() => handleDelete(event.id)}
                          className="text-red-600 hover:text-red-900"
                        >
                          <Trash2 size={18} />
                        </button>
                      )}
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
              {Math.min(pagination.page * pagination.limit, pagination.total)} dari {pagination.total} event
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

  if (loading && events.length === 0) {
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

      {/* Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-3xl max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold text-gray-900">
                  {editingId ? 'Edit Event' : 'Tambah Event Baru'}
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
                    Judul Event *
                  </label>
                  <Input
                    type="text"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    required
                    minLength={5}
                    maxLength={200}
                    placeholder="Masukkan judul event"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Deskripsi *
                  </label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    required
                    minLength={10}
                    rows={5}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Masukkan deskripsi event..."
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Tanggal & Waktu *
                    </label>
                    <Input
                      type="datetime-local"
                      value={formData.tanggal}
                      onChange={(e) => setFormData({ ...formData, tanggal: e.target.value })}
                      required
                    />
                  </div>

                  <div>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Lokasi
                  </label>
                  <Input
                    type="text"
                    value={formData.lokasi}
                    onChange={(e) => setFormData({ ...formData, lokasi: e.target.value })}
                    placeholder="Masukkan lokasi event"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    URL Image (opsional)
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
                    Link Pendaftaran (opsional)
                  </label>
                  <Input
                    type="url"
                    value={formData.linkDaftar}
                    onChange={(e) => setFormData({ ...formData, linkDaftar: e.target.value })}
                    placeholder="https://example.com/daftar"
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

      {/* Participants Modal */}
      {showParticipants && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-2xl max-h-[80vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold text-gray-900">Daftar Peserta</h2>
                <button
                  onClick={() => {
                    setShowParticipants(null)
                    setParticipants([])
                  }}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X size={24} />
                </button>
              </div>

              {participants.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  Belum ada peserta yang terdaftar
                </div>
              ) : (
                <div className="space-y-2">
                  {participants.map((participant) => (
                    <div key={participant.id} className="flex items-center gap-3 p-3 border border-gray-200 rounded-lg">
                      <div className="flex-1">
                        <div className="font-medium text-gray-900">{participant.user.nama}</div>
                        <div className="text-sm text-gray-500">
                          {participant.user.email}
                          {participant.user.nim && ` • NIM: ${participant.user.nim}`}
                        </div>
                      </div>
                      <div className="text-xs text-gray-400">
                        {new Date(participant.createdAt).toLocaleDateString('id-ID')}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </Card>
        </div>
      )}

      {/* Success Modal */}
      <AlertModal
        isOpen={successModal.isOpen}
        onClose={() => setSuccessModal({ isOpen: false, message: '' })}
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

      {/* Image Lightbox */}
      <ImageLightbox
        isOpen={lightboxImage.isOpen}
        onClose={() => setLightboxImage({ isOpen: false, url: '', alt: '' })}
        imageUrl={lightboxImage.url}
        alt={lightboxImage.alt}
      />
    </>
  )
}

export default ManageEvents

