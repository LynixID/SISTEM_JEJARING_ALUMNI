import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import Header from '../components/layout/Header'
import Sidebar from '../components/layout/Sidebar'
import Card from '../components/common/Card'
import Button from '../components/common/Button'
import Input from '../components/common/Input'
import Modal from '../components/common/Modal'
import UserBadge from '../components/common/UserBadge'
import { useAuth } from '../context/AuthContext'
import OnboardingTour from '../components/common/OnboardingTour'
import useTourStatus from '../hooks/useTourStatus'
import { createDiscussion, getDiscussions } from '../services/api'
import { getImageUrl } from '../utils/imageUtils'
import { MessageSquareText, Plus, Search } from 'lucide-react'

const Discussions = () => {
  const { user, isAuthenticated, isLoading } = useAuth()
  const navigate = useNavigate()

  const [threads, setThreads] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const [q, setQ] = useState('')
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)

  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [createTitle, setCreateTitle] = useState('')
  const [createContent, setCreateContent] = useState('')
  const [createVisibility, setCreateVisibility] = useState('PUBLIC')
  const [createImage, setCreateImage] = useState(null)
  const [createImagePreview, setCreateImagePreview] = useState(null)
  const [creating, setCreating] = useState(false)
  const [showTour, setShowTour] = useState(false)
  const { shouldShowTour, markTourComplete } = useTourStatus('diskusi')

  useEffect(() => {
    const handleStartTour = () => {
      setShowTour(true)
    }
    window.addEventListener('startDiskusiTour', handleStartTour)
    return () => {
      window.removeEventListener('startDiskusiTour', handleStartTour)
    }
  }, [])

  // Auto-trigger tur untuk user yang belum pernah melihat (via DB)
  useEffect(() => {
    if (!shouldShowTour) return
    const timer = setTimeout(() => {
      setShowTour(true)
    }, 200)
    return () => clearTimeout(timer)
  }, [shouldShowTour])

  useEffect(() => {
    if (!isLoading && !isAuthenticated) navigate('/login', { replace: true })
  }, [isAuthenticated, isLoading, navigate])

  useEffect(() => {
    if (!user) return
    if (user.role === 'ADMIN') {
      navigate('/admin', { replace: true })
    }
  }, [user, navigate])

  const queryParams = useMemo(() => ({
    page,
    limit: 10,
    ...(q ? { q } : {})
  }), [page, q])

  const fetchThreads = async () => {
    try {
      setLoading(true)
      setError('')
      const res = await getDiscussions(queryParams)
      setThreads(res.data.threads || [])
      setTotalPages(res.data.pagination?.totalPages || 1)
    } catch (e) {
      console.error(e)
      setError(e.response?.data?.error || 'Gagal memuat forum diskusi')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (!isAuthenticated) return
    fetchThreads()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated, queryParams])

  const submitCreate = async (e) => {
    e.preventDefault()
    setCreating(true)
    try {
      await createDiscussion({
        title: createTitle,
        content: createContent,
        visibility: createVisibility
      }, createImage)
      setIsCreateOpen(false)
      setCreateTitle('')
      setCreateContent('')
      setCreateVisibility('PUBLIC')
      setCreateImage(null)
      setCreateImagePreview(null)
      setPage(1)
      await fetchThreads()
    } catch (err) {
      const msg = err.response?.data?.error || 'Gagal membuat diskusi'
      alert(msg)
    } finally {
      setCreating(false)
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-gray-500">Loading...</div>
      </div>
    )
  }

  if (!isAuthenticated || !user) return null

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />

      <div className="flex">
        <Sidebar />

        <main className="flex-1">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div id="tour-discussions-header" className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 sm:p-8 mb-6">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                  <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 flex items-center gap-3">
                    <MessageSquareText className="text-blue-600" />
                    Forum Diskusi
                  </h1>
                  <p className="text-gray-600 mt-2">
                    Buat bahan diskusi, lalu bergabung untuk ikut ngobrol dan fokus pada pembahasan.
                  </p>
                </div>
                <Button id="tour-discussions-create-btn" onClick={() => setIsCreateOpen(true)} className="flex items-center gap-2">
                  <Plus size={18} />
                  Buat Diskusi
                </Button>
              </div>

              <div className="mt-5 flex gap-3">
                <div id="tour-discussions-search" className="flex-1 relative">
                  <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    value={q}
                    onChange={(e) => {
                      setQ(e.target.value)
                      setPage(1)
                    }}
                    placeholder="Cari diskusi..."
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                  />
                </div>
              </div>
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl px-4 py-3 mb-4">
                {error}
              </div>
            )}

            <div id="tour-discussions-list">
              {loading ? (
              <div className="text-gray-500">Memuat...</div>
            ) : threads.length === 0 ? (
              <Card className="p-6">
                <div className="text-gray-700 font-medium">Belum ada diskusi.</div>
                <div className="text-gray-500 text-sm mt-1">Mulai dengan membuat diskusi pertama.</div>
              </Card>
            ) : (
              <div className="space-y-4">
                {threads.map((t) => (
                  <Card key={t.id} className="p-5">
                    <div className="flex flex-col md:flex-row gap-5">
                      {/* Sisi kiri: Gambar (jika ada) */}
                      {t.image && (
                        <div className="w-full md:w-56 h-48 md:h-32 flex-shrink-0 overflow-hidden rounded-xl border border-gray-200">
                          <img
                            src={getImageUrl(t.image, 'discussions')}
                            alt={t.title}
                            className="w-full h-full object-cover"
                            loading="lazy"
                          />
                        </div>
                      )}
                      
                      {/* Sisi kanan: Keterangan */}
                      <div className="flex-1 flex flex-col justify-between min-w-0">
                        <div className="min-w-0">
                          <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                            <div className="min-w-0 flex-1">
                              <Link to={`/diskusi/${t.id}`} className="text-lg font-bold text-gray-900 hover:text-blue-600 transition-colors block">
                                {t.title}
                              </Link>
                              <p className="text-sm text-gray-600 mt-1 line-clamp-2">
                                {t.content}
                              </p>
                            </div>
                            <div className="shrink-0 w-full md:w-auto mt-2 md:mt-0">
                              <Link to={`/diskusi/${t.id}`} className="w-full md:w-auto block">
                                <Button variant="primary" className="w-full md:w-auto text-center justify-center cursor-pointer">Buka</Button>
                              </Link>
                            </div>
                          </div>
                        </div>
                        
                        <div className="text-xs text-gray-500 mt-3 flex flex-wrap gap-2">
                          <span className="px-2.5 py-1 rounded-full bg-gray-100 font-medium">
                            {t.visibility === 'PRIVATE' ? '🔒 Privat' : '🌐 Publik'}
                          </span>
                          <span className="px-2.5 py-1 rounded-full bg-gray-100 font-medium">
                            {t.status === 'LOCKED' ? '🚫 Dikunci' : '✅ Terbuka'}
                          </span>
                          <span className="px-2.5 py-1 rounded-full bg-gray-100 font-medium">
                            👥 {t.counts?.members || 0} anggota
                          </span>
                          <span className="px-2.5 py-1 rounded-full bg-gray-100 font-medium">
                            💬 {t.counts?.messages || 0} pesan
                          </span>
                          {t.membership?.role && (
                            <span className="px-2.5 py-1 rounded-full bg-blue-50 text-blue-700 font-semibold border border-blue-100">
                              Bergabung ({t.membership.role})
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </Card>
                ))}

                <div className="flex items-center justify-between pt-2">
                  <Button
                    variant="outline"
                    disabled={page <= 1}
                    onClick={() => setPage(p => Math.max(1, p - 1))}
                  >
                    Sebelumnya
                  </Button>
                  <div className="text-sm text-gray-600">
                    Halaman {page} / {totalPages}
                  </div>
                  <Button
                    variant="outline"
                    disabled={page >= totalPages}
                    onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                  >
                    Selanjutnya
                  </Button>
                </div>
              </div>
              )}
            </div>
          </div>
        </main>
      </div>

      <Modal isOpen={isCreateOpen} onClose={() => setIsCreateOpen(false)} title="Buat Diskusi" size="lg">
        <form onSubmit={submitCreate} className="space-y-4">
          <Input
            label="Judul"
            value={createTitle}
            onChange={(e) => setCreateTitle(e.target.value)}
            placeholder="Contoh: Tips persiapan karier setelah lulus"
            required
          />

          <div className="w-full">
            <label className="block text-sm font-medium text-gray-700 mb-1">Konten</label>
            <textarea
              value={createContent}
              onChange={(e) => setCreateContent(e.target.value)}
              placeholder="Jelaskan topik diskusi..."
              className="w-full min-h-32 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
              required
            />
          </div>

          <div className="w-full">
            <label className="block text-sm font-medium text-gray-700 mb-1">Gambar Diskusi (opsional)</label>
            <input
              type="file"
              accept="image/*"
              onChange={(e) => {
                const file = e.target.files?.[0] || null
                setCreateImage(file)
                if (file) {
                  const reader = new FileReader()
                  reader.onloadend = () => setCreateImagePreview(reader.result)
                  reader.readAsDataURL(file)
                } else {
                  setCreateImagePreview(null)
                }
              }}
              className="w-full"
            />
            {createImagePreview && (
              <img
                src={createImagePreview}
                alt="Preview"
                className="mt-2 w-full max-h-56 object-cover rounded-xl border border-gray-200"
              />
            )}
            {createImage && (
              <div className="mt-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setCreateImage(null)
                    setCreateImagePreview(null)
                  }}
                >
                  Hapus gambar
                </Button>
              </div>
            )}
          </div>

          <div className="w-full">
            <label className="block text-sm font-medium text-gray-700 mb-1">Visibilitas</label>
            <select
              value={createVisibility}
              onChange={(e) => setCreateVisibility(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
            >
              <option value="PUBLIC">Public</option>
              <option value="PRIVATE">Privat</option>
            </select>
            <p className="text-xs text-gray-500 mt-1">
              Publik bisa dibaca semua alumni/pengurus; Privat hanya untuk anggota.
            </p>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="secondary" onClick={() => setIsCreateOpen(false)} disabled={creating}>
              Batal
            </Button>
            <Button type="submit" disabled={creating}>
              {creating ? 'Membuat...' : 'Buat'}
            </Button>
          </div>
        </form>
      </Modal>

      <OnboardingTour
        isOpen={showTour}
        onClose={() => {
          setShowTour(false)
          markTourComplete()
        }}
        type="diskusi"
      />

    </div>
  )
}

export default Discussions

