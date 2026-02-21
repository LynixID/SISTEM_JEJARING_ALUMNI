import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Calendar, MapPin, Clock, Users, ArrowLeft, CheckCircle, XCircle } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import api, { markEventAsRead } from '../services/api'
import { getImageUrl } from '../utils/imageUtils'
import Header from '../components/layout/Header'
import Sidebar from '../components/layout/Sidebar'
import Card from '../components/common/Card'
import Button from '../components/common/Button'
import { Loader } from 'lucide-react'

const EventDetail = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const { user, isAuthenticated, isLoading: authLoading } = useAuth()
  
  // State management untuk event data dan registration
  const [event, setEvent] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [isRegistered, setIsRegistered] = useState(false)
  const [registering, setRegistering] = useState(false)
  const [participantsCount, setParticipantsCount] = useState(0)

  // Redirect ke login jika belum authenticated
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      navigate('/login', { replace: true })
    }
  }, [isAuthenticated, authLoading, navigate])

  // Fetch event detail saat component mount
  useEffect(() => {
    if (isAuthenticated && id) {
      fetchEvent()
    }
  }, [id, isAuthenticated])

  // Fetch event dari API
  const fetchEvent = async () => {
    try {
      setLoading(true)
      setError('')
      const response = await api.get(`/events/${id}`)
      const eventData = response.data.event
      setEvent(eventData)
      setIsRegistered(eventData.isRegistered || false)
      setParticipantsCount(eventData.participantsCount || 0)

      // Mark as read jika user authenticated dan event published
      if (isAuthenticated && eventData?.published) {
        try {
          await markEventAsRead(eventData.id)
        } catch (error) {
          console.error('Error marking event as read:', error)
          // Jangan tampilkan error ke user, ini opsional
        }
      }
    } catch (err) {
      console.error('Error fetching event:', err)
      setError(err.response?.data?.error || 'Gagal memuat event')
    } finally {
      setLoading(false)
    }
  }

  // Handler untuk register/unregister event
  const handleRegister = async () => {
    if (!user) return

    try {
      setRegistering(true)
      if (isRegistered) {
        // Unregister dari event
        await api.delete(`/events/${id}/register`)
        setIsRegistered(false)
        setParticipantsCount(prev => Math.max(0, prev - 1))
      } else {
        // Register ke event
        await api.post(`/events/${id}/register`)
        setIsRegistered(true)
        setParticipantsCount(prev => prev + 1)
      }
    } catch (err) {
      console.error('Error registering event:', err)
      alert(err.response?.data?.error || 'Gagal mendaftar event')
    } finally {
      setRegistering(false)
    }
  }

  const getCategoryBadge = (category) => {
    const colors = {
      'Webinar': 'bg-blue-100 text-blue-800',
      'Workshop': 'bg-green-100 text-green-800',
      'Seminar': 'bg-purple-100 text-purple-800',
      'Reuni': 'bg-yellow-100 text-yellow-800',
      'Networking': 'bg-pink-100 text-pink-800',
      'Lainnya': 'bg-gray-100 text-gray-800'
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
      day: 'numeric'
    })
  }

  const formatDateTime = (dateString) => {
    return new Date(dateString).toLocaleString('id-ID', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const isEventUpcoming = event && new Date(event.tanggal) > new Date()
  const isEventPast = event && new Date(event.tanggal) < new Date()

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

  if (error || !event) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="flex">
          <Sidebar />
          <main className="flex-1 p-6">
            <div className="max-w-4xl mx-auto">
              <Card className="p-12 text-center">
                <p className="text-red-600 mb-4">{error || 'Event tidak ditemukan'}</p>
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
              {event.image && (
                <div className="w-full h-96 bg-gray-200 overflow-hidden">
                  <img
                    src={getImageUrl(event.image, 'events')}
                    alt={event.title}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      e.target.style.display = 'none'
                    }}
                  />
                </div>
              )}

              <div className="p-6">
                {/* Header Info */}
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    {event.category && getCategoryBadge(event.category)}
                  </div>
                  <div className={`px-3 py-1 rounded-full text-sm font-medium ${
                    isEventUpcoming 
                      ? 'bg-green-100 text-green-800' 
                      : isEventPast
                      ? 'bg-gray-100 text-gray-800'
                      : 'bg-blue-100 text-blue-800'
                  }`}>
                    {isEventUpcoming ? 'Akan Datang' : isEventPast ? 'Sudah Lewat' : 'Sedang Berlangsung'}
                  </div>
                </div>

                {/* Title */}
                <h1 className="text-3xl font-bold text-gray-900 mb-6">
                  {event.title}
                </h1>

                {/* Event Details */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6 pb-6 border-b border-gray-200">
                  <div className="flex items-start gap-3">
                    <Calendar className="text-blue-600 mt-1 flex-shrink-0" size={20} />
                    <div>
                      <p className="text-sm text-gray-500">Tanggal & Waktu</p>
                      <p className="font-medium text-gray-900">{formatDateTime(event.tanggal)}</p>
                    </div>
                  </div>

                  {event.lokasi && (
                    <div className="flex items-start gap-3">
                      <MapPin className="text-red-600 mt-1 flex-shrink-0" size={20} />
                      <div>
                        <p className="text-sm text-gray-500">Lokasi</p>
                        <p className="font-medium text-gray-900">{event.lokasi}</p>
                      </div>
                    </div>
                  )}

                  <div className="flex items-start gap-3">
                    <Users className="text-purple-600 mt-1 flex-shrink-0" size={20} />
                    <div>
                      <p className="text-sm text-gray-500">Peserta</p>
                      <p className="font-medium text-gray-900">{participantsCount} orang terdaftar</p>
                    </div>
                  </div>

                  {event.kuota && (
                    <div className="flex items-start gap-3">
                      <Users className="text-gray-600 mt-1 flex-shrink-0" size={20} />
                      <div>
                        <p className="text-sm text-gray-500">Kuota</p>
                        <p className="font-medium text-gray-900">{event.kuota} peserta</p>
                      </div>
                    </div>
                  )}
                </div>

                {/* Description */}
                {event.description && (
                  <div className="mb-6">
                    <h2 className="text-xl font-bold text-gray-900 mb-3">Deskripsi Event</h2>
                    <div 
                      className="prose max-w-none text-gray-700"
                      dangerouslySetInnerHTML={{ __html: event.description }}
                    />
                  </div>
                )}

                {/* Register Button */}
                {isEventUpcoming && user && (
                  <div className="mt-6 pt-6 border-t border-gray-200">
                    <Button
                      onClick={handleRegister}
                      disabled={registering}
                      className={`w-full md:w-auto ${
                        isRegistered 
                          ? 'bg-red-600 hover:bg-red-700' 
                          : 'bg-blue-600 hover:bg-blue-700'
                      }`}
                    >
                      {registering ? (
                        <>
                          <Loader className="animate-spin inline mr-2" size={16} />
                          Memproses...
                        </>
                      ) : isRegistered ? (
                        <>
                          <XCircle size={18} className="inline mr-2" />
                          Batalkan Pendaftaran
                        </>
                      ) : (
                        <>
                          <CheckCircle size={18} className="inline mr-2" />
                          Daftar Event
                        </>
                      )}
                    </Button>
                    {isRegistered && (
                      <p className="text-sm text-green-600 mt-2 flex items-center gap-1">
                        <CheckCircle size={16} />
                        Anda sudah terdaftar untuk event ini
                      </p>
                    )}
                  </div>
                )}

                {!user && isEventUpcoming && (
                  <div className="mt-6 pt-6 border-t border-gray-200">
                    <p className="text-sm text-gray-600">
                      Silakan login untuk mendaftar event ini
                    </p>
                  </div>
                )}
              </div>
            </Card>
          </div>
        </main>
      </div>
    </div>
  )
}

export default EventDetail

