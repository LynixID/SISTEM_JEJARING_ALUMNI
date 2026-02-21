import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Calendar, Eye, ArrowLeft, User as UserIcon } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import api, { markAnnouncementAsRead } from '../services/api'
import { getImageUrl } from '../utils/imageUtils'
import Header from '../components/layout/Header'
import Sidebar from '../components/layout/Sidebar'
import Card from '../components/common/Card'
import Button from '../components/common/Button'
import { Loader } from 'lucide-react'

const AnnouncementDetail = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const { user, isAuthenticated, isLoading: authLoading } = useAuth()
  
  // State management untuk announcement data
  const [announcement, setAnnouncement] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  // Redirect ke login jika belum authenticated
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      navigate('/login', { replace: true })
    }
  }, [isAuthenticated, authLoading, navigate])

  // Fetch announcement detail saat component mount
  useEffect(() => {
    if (isAuthenticated && id) {
      fetchAnnouncement()
    }
  }, [id, isAuthenticated])

  // Fetch announcement dari API
  const fetchAnnouncement = async () => {
    try {
      setLoading(true)
      setError('')
      const response = await api.get(`/announcements/${id}`)
      const announcementData = response.data.announcement || response.data
      setAnnouncement(announcementData)

      // Mark as read jika user authenticated dan announcement published
      if (isAuthenticated && announcementData?.published) {
        try {
          await markAnnouncementAsRead(announcementData.id)
        } catch (error) {
          console.error('Error marking announcement as read:', error)
          // Jangan tampilkan error ke user, ini opsional
        }
      }
    } catch (err) {
      console.error('Error fetching announcement:', err)
      setError(err.response?.data?.error || 'Gagal memuat pengumuman')
    } finally {
      setLoading(false)
    }
  }

  const getCategoryBadge = (category) => {
    const colors = {
      'Berita Umum': 'bg-blue-100 text-blue-800',
      'Agenda': 'bg-green-100 text-green-800',
      'Program DPW': 'bg-purple-100 text-purple-800',
      'Peluang Kerjasama': 'bg-yellow-100 text-yellow-800'
    }
    return (
      <span className={`px-3 py-1 rounded-full text-sm font-medium ${colors[category] || 'bg-gray-100 text-gray-800'}`}>
        {category}
      </span>
    )
  }

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('id-ID', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="flex">
          <Sidebar />
          <div className="flex-1 flex items-center justify-center min-h-[calc(100vh-4rem)]">
            <Loader className="animate-spin text-blue-600" size={32} />
          </div>
        </div>
      </div>
    )
  }

  if (error || !announcement) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="flex">
          <Sidebar />
          <main className="flex-1 p-6">
            <div className="max-w-4xl mx-auto">
              <Card className="p-12 text-center">
                <p className="text-red-600 mb-4">{error || 'Pengumuman tidak ditemukan'}</p>
                <Button onClick={() => navigate('/berita')}>
                  Kembali ke Berita
                </Button>
              </Card>
            </div>
          </main>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <div className="flex">
        <Sidebar />
        <main className="flex-1 p-6">
          <div className="max-w-4xl mx-auto">
            {/* Back Button */}
            <Button
              variant="outline"
              onClick={() => navigate('/berita')}
              className="mb-6 flex items-center gap-2"
            >
              <ArrowLeft size={18} />
              Kembali ke Berita
            </Button>

            <Card className="overflow-hidden">
              {/* Image */}
              {announcement.image && (
                <div className="w-full h-96 bg-gray-200 overflow-hidden">
                  <img
                    src={getImageUrl(announcement.image, 'announcements')}
                    alt={announcement.title}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      e.target.style.display = 'none'
                    }}
                  />
                </div>
              )}

              <div className="p-6">
                {/* Header Info */}
                <div className="flex items-start justify-end mb-4">
                  <div className="flex items-center gap-1 text-sm text-gray-500">
                    <Eye size={16} />
                    {announcement.views || 0} dilihat
                  </div>
                </div>

                {/* Title */}
                <h1 className="text-3xl font-bold text-gray-900 mb-4">
                  {announcement.title}
                </h1>

                {/* Meta Info */}
                <div className="flex items-center gap-4 text-sm text-gray-600 mb-6 pb-6 border-b border-gray-200">
                  <div className="flex items-center gap-2">
                    <Calendar size={16} />
                    <span>Dipublikasikan: {formatDate(announcement.createdAt)}</span>
                  </div>
                  {announcement.updatedAt && announcement.updatedAt !== announcement.createdAt && (
                    <div className="flex items-center gap-2">
                      <span>Diperbarui: {formatDate(announcement.updatedAt)}</span>
                    </div>
                  )}
                </div>

                {/* Content */}
                <div 
                  className="prose max-w-none text-gray-700"
                  dangerouslySetInnerHTML={{ __html: announcement.content }}
                />
              </div>
            </Card>
          </div>
        </main>
      </div>
    </div>
  )
}

export default AnnouncementDetail

