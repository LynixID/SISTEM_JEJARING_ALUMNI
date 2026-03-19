import { useEffect, useMemo, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import Header from '../components/layout/Header'
import Sidebar from '../components/layout/Sidebar'
import Card from '../components/common/Card'
import Button from '../components/common/Button'
import Input from '../components/common/Input'
import Modal from '../components/common/Modal'
import { useAuth } from '../context/AuthContext'
import { approveJob, createJob, deleteMyJob, getJobs, getPendingJobs, rejectJob } from '../services/api'
import { getImageUrl } from '../utils/imageUtils'
import { BriefcaseBusiness, Check, Clock, Plus, Search, Trash2, X, ExternalLink } from 'lucide-react'

const Jobs = () => {
  const { user, isAuthenticated, isLoading } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()

  const [tab, setTab] = useState('LIST') // LIST | PENDING

  const [q, setQ] = useState('')
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const queryParams = useMemo(() => ({ page, limit: 10, ...(q ? { q } : {}) }), [page, q])

  const [jobs, setJobs] = useState([])
  const [pendingJobs, setPendingJobs] = useState([])
  const [loading, setLoading] = useState(true)
  const [pendingLoading, setPendingLoading] = useState(true)
  const [error, setError] = useState('')
  const [pendingError, setPendingError] = useState('')

  const isPengurus = user?.role === 'PENGURUS'
  const isPengurusManage = isPengurus && location.pathname.startsWith('/pengurus/lowongan')
  const isDraftMode = isPengurus && location.pathname.startsWith('/pengurus/lowongan/draft')

  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [creating, setCreating] = useState(false)
  const [form, setForm] = useState({
    title: '',
    company: '',
    location: '',
    employmentType: '',
    salaryRange: '',
    contact: '',
    applyLink: '',
    description: ''
  })
  const [image, setImage] = useState(null)
  const [imagePreview, setImagePreview] = useState(null)

  const [isDetailOpen, setIsDetailOpen] = useState(false)
  const [selectedJob, setSelectedJob] = useState(null)

  useEffect(() => {
    if (!isLoading && !isAuthenticated) navigate('/login', { replace: true })
  }, [isAuthenticated, isLoading, navigate])

  useEffect(() => {
    if (!user) return
    if (user.role === 'ADMIN') navigate('/admin', { replace: true })
  }, [user, navigate])

  // Guard: pengurus lowongan routes are for pengurus only
  useEffect(() => {
    if (!user) return
    if (location.pathname.startsWith('/pengurus/lowongan') && user.role !== 'PENGURUS') {
      navigate('/lowongan', { replace: true })
    }
  }, [user, location.pathname, navigate])

  // Mark jobs as seen (clears sidebar badge for approved jobs)
  useEffect(() => {
    if (!isAuthenticated || !user) return
    if (location.pathname.startsWith('/lowongan')) {
      localStorage.setItem('jobsLastSeenAt', new Date().toISOString())
    }
  }, [isAuthenticated, user, location.pathname])

  // In pengurus manage mode, default to pending tab (Draft Lowongan)
  useEffect(() => {
    if (!isAuthenticated || !user) return
    if (isPengurusManage) setTab('PENDING')
  }, [isAuthenticated, user, isPengurusManage])

  const fetchJobs = async () => {
    try {
      setLoading(true)
      setError('')
      const res = await getJobs(queryParams)
      setJobs(res.data.jobs || [])
      setTotalPages(res.data.pagination?.totalPages || 1)
    } catch (e) {
      console.error(e)
      setError(e.response?.data?.error || 'Gagal memuat lowongan')
    } finally {
      setLoading(false)
    }
  }

  const fetchPending = async () => {
    try {
      setPendingLoading(true)
      setPendingError('')
      const res = await getPendingJobs()
      setPendingJobs(res.data.jobs || [])
    } catch (e) {
      console.error(e)
      setPendingError(e.response?.data?.error || 'Gagal memuat lowongan menunggu persetujuan')
    } finally {
      setPendingLoading(false)
    }
  }

  useEffect(() => {
    if (!isAuthenticated) return
    fetchJobs()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated, queryParams])

  useEffect(() => {
    if (!isAuthenticated) return
    fetchPending()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated])

  const resetCreate = () => {
    setForm({
      title: '',
      company: '',
      location: '',
      employmentType: '',
      salaryRange: '',
      contact: '',
      applyLink: '',
      description: ''
    })
    setImage(null)
    setImagePreview(null)
  }

  const submitCreate = async (e) => {
    e.preventDefault()
    setCreating(true)
    try {
      await createJob(form, image)
      setIsCreateOpen(false)
      resetCreate()
      setTab('PENDING')
      await Promise.all([fetchJobs(), fetchPending()])
    } catch (err) {
      alert(err.response?.data?.error || 'Gagal membuat lowongan')
    } finally {
      setCreating(false)
    }
  }

  const onApprove = async (id) => {
    try {
      await approveJob(id)
      await Promise.all([fetchJobs(), fetchPending()])
    } catch (e) {
      alert(e.response?.data?.error || 'Gagal menyetujui lowongan')
    }
  }

  const onReject = async (id) => {
    try {
      await rejectJob(id)
      await fetchPending()
    } catch (e) {
      alert(e.response?.data?.error || 'Gagal menolak lowongan')
    }
  }

  const onDeleteMyJob = async (id) => {
    const ok = window.confirm(
      isPengurus
        ? 'Hapus lowongan ini? (Pengurus bisa menghapus lowongan yang sudah dipublikasikan)'
        : 'Hapus lowongan ini? (Hanya bisa untuk yang belum disetujui)'
    )
    if (!ok) return
    try {
      await deleteMyJob(id)
      await Promise.all([fetchJobs(), fetchPending()])
    } catch (e) {
      alert(e.response?.data?.error || 'Gagal menghapus lowongan')
    }
  }

  const openDetail = (job) => {
    setSelectedJob(job)
    setIsDetailOpen(true)
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
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 sm:p-8 mb-6">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                  <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 flex items-center gap-3">
                    <BriefcaseBusiness className="text-blue-600" />
                    Lowongan Pekerjaan
                  </h1>
                  <p className="text-gray-600 mt-2">
                    {isPengurus
                      ? 'Kelola persetujuan lowongan dari alumni.'
                      : 'Buat lowongan, lalu tunggu persetujuan pengurus sebelum tampil di publik.'}
                  </p>
                </div>

                <Button onClick={() => setIsCreateOpen(true)} className="flex items-center gap-2">
                  <Plus size={18} />
                  Buat Lowongan
                </Button>
              </div>

              <div className="mt-5 flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between">
                <div className="flex gap-2">
                  {(!isDraftMode && !isPengurusManage) && (
                    <button
                      type="button"
                      onClick={() => setTab('LIST')}
                      className={`px-4 py-2 rounded-lg text-sm font-medium border ${
                        tab === 'LIST' ? 'bg-blue-50 text-blue-700 border-blue-200' : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-50'
                      }`}
                    >
                      Lowongan
                    </button>
                  )}
                  {isPengurusManage && (
                    <button
                      type="button"
                      onClick={() => setTab('LIST')}
                      className={`px-4 py-2 rounded-lg text-sm font-medium border ${
                        tab === 'LIST' ? 'bg-blue-50 text-blue-700 border-blue-200' : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-50'
                      }`}
                    >
                      Daftar Lowongan
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => setTab('PENDING')}
                    className={`px-4 py-2 rounded-lg text-sm font-medium border ${
                      tab === 'PENDING' ? 'bg-blue-50 text-blue-700 border-blue-200' : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-50'
                    }`}
                  >
                    {isPengurusManage ? 'Draft Lowongan' : (isPengurus ? 'Draft Lowongan' : 'Menunggu Persetujuan')}
                  </button>
                </div>

                {tab === 'LIST' && (
                  <div className="flex-1 sm:max-w-md relative">
                    <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input
                      value={q}
                      onChange={(e) => {
                        setQ(e.target.value)
                        setPage(1)
                      }}
                      placeholder="Cari lowongan..."
                      className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                    />
                  </div>
                )}
              </div>
            </div>

            {tab === 'LIST' ? (
              <>
                {error && (
                  <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl px-4 py-3 mb-4">
                    {error}
                  </div>
                )}

                {loading ? (
                  <div className="text-gray-500">Memuat...</div>
                ) : jobs.length === 0 ? (
                  <Card className="p-6">
                    <div className="text-gray-700 font-medium">Belum ada lowongan yang disetujui.</div>
                    <div className="text-gray-500 text-sm mt-1">Coba buat lowongan baru.</div>
                  </Card>
                ) : (
                  <div className="space-y-4">
                    {jobs.map((job) => (
                      <Card key={job.id} className="p-5">
                        {job.image && (
                          <div className="mb-3">
                            <img
                              src={getImageUrl(job.image, 'jobs')}
                              alt={job.title}
                              className="w-full max-h-56 object-cover rounded-xl border border-gray-200"
                              loading="lazy"
                            />
                          </div>
                        )}
                        <div className="flex items-start justify-between gap-4">
                          <div className="min-w-0">
                            <div className="text-lg font-semibold text-gray-900">{job.title}</div>
                            <div className="text-sm text-gray-700 mt-1">
                              <span className="font-medium">{job.company}</span>
                              {job.location ? <span className="text-gray-500"> • {job.location}</span> : null}
                            </div>
                            <div className="flex flex-wrap gap-2 mt-2">
                              {job.employmentType ? (
                                <span className="inline-flex items-center px-2 py-1 rounded-full bg-gray-50 text-gray-700 border border-gray-200 text-xs">
                                  {job.employmentType}
                                </span>
                              ) : null}
                              {job.salaryRange ? (
                                <span className="inline-flex items-center px-2 py-1 rounded-full bg-green-50 text-green-700 border border-green-200 text-xs">
                                  {job.salaryRange}
                                </span>
                              ) : null}
                              {job.contact ? (
                                <span className="inline-flex items-center px-2 py-1 rounded-full bg-blue-50 text-blue-700 border border-blue-200 text-xs">
                                  {job.contact}
                                </span>
                              ) : null}
                            </div>
                            <div className="text-sm text-gray-600 mt-2 line-clamp-3 whitespace-pre-wrap">
                              {job.description}
                            </div>
                            <div className="text-xs text-gray-500 mt-2">
                              Diposting oleh {job.author?.nama || 'Alumni'}
                            </div>
                          </div>
                            <div className="shrink-0 flex flex-col gap-2">
                            <Button variant="outline" onClick={() => openDetail(job)}>
                              Detail
                            </Button>
                              {isPengurusManage && (
                                <Button
                                  onClick={() => onDeleteMyJob(job.id)}
                                  variant="danger"
                                  className="flex items-center gap-2"
                                >
                                  <Trash2 size={16} />
                                  Hapus
                                </Button>
                              )}
                            {job.applyLink && (
                              <a href={job.applyLink} target="_blank" rel="noreferrer">
                                <Button variant="outline" className="flex items-center gap-2">
                                  <ExternalLink size={16} />
                                  Apply
                                </Button>
                              </a>
                            )}
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
                        Prev
                      </Button>
                      <div className="text-sm text-gray-600">
                        Halaman {page} / {totalPages}
                      </div>
                      <Button
                        variant="outline"
                        disabled={page >= totalPages}
                        onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                      >
                        Next
                      </Button>
                    </div>
                  </div>
                )}
              </>
            ) : (
              <>
                {pendingError && (
                  <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl px-4 py-3 mb-4">
                    {pendingError}
                  </div>
                )}

                {pendingLoading ? (
                  <div className="text-gray-500">Memuat...</div>
                ) : pendingJobs.length === 0 ? (
                  <Card className="p-6">
                    <div className="text-gray-700 font-medium">
                      {isPengurus ? 'Tidak ada lowongan yang menunggu persetujuan.' : 'Kamu tidak punya lowongan yang menunggu persetujuan.'}
                    </div>
                    <div className="text-gray-500 text-sm mt-1">
                      {isPengurus ? 'Semua sudah diproses.' : 'Buat lowongan baru untuk diajukan.'}
                    </div>
                  </Card>
                ) : (
                  <div className="space-y-4">
                    {pendingJobs.map((job) => (
                      <Card key={job.id} className="p-5">
                        <div className="flex items-center gap-2 text-xs text-gray-600 mb-2">
                          <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-yellow-50 text-yellow-700 border border-yellow-200">
                            <Clock size={14} />
                            PENDING
                          </span>
                          <span className="text-gray-500">
                            {isPengurus ? `Pengaju: ${job.author?.nama || 'Alumni'}` : 'Menunggu persetujuan pengurus'}
                          </span>
                        </div>

                        {job.image && (
                          <div className="mb-3">
                            <img
                              src={getImageUrl(job.image, 'jobs')}
                              alt={job.title}
                              className="w-full max-h-56 object-cover rounded-xl border border-gray-200"
                              loading="lazy"
                            />
                          </div>
                        )}

                        <div className="flex items-start justify-between gap-4">
                          <div className="min-w-0">
                            <div className="text-lg font-semibold text-gray-900">{job.title}</div>
                            <div className="text-sm text-gray-700 mt-1">
                              <span className="font-medium">{job.company}</span>
                              {job.location ? <span className="text-gray-500"> • {job.location}</span> : null}
                            </div>
                            <div className="flex flex-wrap gap-2 mt-2">
                              {job.employmentType ? (
                                <span className="inline-flex items-center px-2 py-1 rounded-full bg-gray-50 text-gray-700 border border-gray-200 text-xs">
                                  {job.employmentType}
                                </span>
                              ) : null}
                              {job.salaryRange ? (
                                <span className="inline-flex items-center px-2 py-1 rounded-full bg-green-50 text-green-700 border border-green-200 text-xs">
                                  {job.salaryRange}
                                </span>
                              ) : null}
                              {job.contact ? (
                                <span className="inline-flex items-center px-2 py-1 rounded-full bg-blue-50 text-blue-700 border border-blue-200 text-xs">
                                  {job.contact}
                                </span>
                              ) : null}
                            </div>
                            <div className="text-sm text-gray-600 mt-2 line-clamp-3 whitespace-pre-wrap">
                              {job.description}
                            </div>
                          </div>

                          <div className="shrink-0 flex flex-col gap-2">
                            <Button variant="outline" onClick={() => openDetail(job)}>
                              Detail
                            </Button>
                            {isPengurus ? (
                              <>
                                <Button onClick={() => onApprove(job.id)} className="flex items-center gap-2">
                                  <Check size={16} />
                                  Approve
                                </Button>
                                <Button onClick={() => onReject(job.id)} variant="danger" className="flex items-center gap-2">
                                  <X size={16} />
                                  Reject
                                </Button>
                              </>
                            ) : (
                              <Button onClick={() => onDeleteMyJob(job.id)} variant="danger" className="flex items-center gap-2">
                                <Trash2 size={16} />
                                Hapus
                              </Button>
                            )}
                          </div>
                        </div>
                      </Card>
                    ))}
                  </div>
                )}
              </>
            )}
          </div>
        </main>
      </div>

      <Modal
        isOpen={isDetailOpen}
        onClose={() => { setIsDetailOpen(false); setSelectedJob(null) }}
        title="Detail Lowongan"
        size="xl"
      >
        {!selectedJob ? null : (
          <div className="space-y-4">
            {selectedJob.image && (
              <img
                src={getImageUrl(selectedJob.image, 'jobs')}
                alt={selectedJob.title}
                className="w-full max-h-64 object-cover rounded-xl border border-gray-200"
                loading="lazy"
              />
            )}

            <div>
              <div className="text-xl font-semibold text-gray-900">{selectedJob.title}</div>
              <div className="text-sm text-gray-700 mt-1">
                <span className="font-medium">{selectedJob.company}</span>
                {selectedJob.location ? <span className="text-gray-500"> • {selectedJob.location}</span> : null}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="bg-gray-50 border border-gray-200 rounded-xl p-3">
                <div className="text-xs text-gray-500">Tipe Pekerjaan</div>
                <div className="text-sm text-gray-900 mt-1">{selectedJob.employmentType || '-'}</div>
              </div>
              <div className="bg-gray-50 border border-gray-200 rounded-xl p-3">
                <div className="text-xs text-gray-500">Range Gaji</div>
                <div className="text-sm text-gray-900 mt-1">{selectedJob.salaryRange || '-'}</div>
              </div>
              <div className="bg-gray-50 border border-gray-200 rounded-xl p-3">
                <div className="text-xs text-gray-500">Kontak</div>
                <div className="text-sm text-gray-900 mt-1 whitespace-pre-wrap break-words">{selectedJob.contact || '-'}</div>
              </div>
              <div className="bg-gray-50 border border-gray-200 rounded-xl p-3">
                <div className="text-xs text-gray-500">Link Apply</div>
                <div className="text-sm text-gray-900 mt-1">
                  {selectedJob.applyLink ? (
                    <a className="text-blue-600 hover:underline break-words" href={selectedJob.applyLink} target="_blank" rel="noreferrer">
                      {selectedJob.applyLink}
                    </a>
                  ) : (
                    '-'
                  )}
                </div>
              </div>
            </div>

            <div>
              <div className="text-sm font-medium text-gray-900">Deskripsi</div>
              <div className="text-sm text-gray-700 mt-1 whitespace-pre-wrap">
                {selectedJob.description || '-'}
              </div>
              <div className="text-xs text-gray-500 mt-3">
                Diposting oleh {selectedJob.author?.nama || 'Alumni'}
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              {selectedJob.applyLink && (
                <a href={selectedJob.applyLink} target="_blank" rel="noreferrer">
                  <Button className="flex items-center gap-2">
                    <ExternalLink size={16} />
                    Apply
                  </Button>
                </a>
              )}
              <Button variant="secondary" onClick={() => { setIsDetailOpen(false); setSelectedJob(null) }}>
                Tutup
              </Button>
            </div>
          </div>
        )}
      </Modal>

      <Modal isOpen={isCreateOpen} onClose={() => { setIsCreateOpen(false); resetCreate() }} title="Buat Lowongan" size="xl">
        <form onSubmit={submitCreate} className="space-y-4">
          <Input
            label="Judul"
            value={form.title}
            onChange={(e) => setForm(prev => ({ ...prev, title: e.target.value }))}
            required
          />
          <Input
            label="Perusahaan"
            value={form.company}
            onChange={(e) => setForm(prev => ({ ...prev, company: e.target.value }))}
            required
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Input
              label="Lokasi (opsional)"
              value={form.location}
              onChange={(e) => setForm(prev => ({ ...prev, location: e.target.value }))}
            />
            <Input
              label="Tipe Pekerjaan (opsional)"
              value={form.employmentType}
              onChange={(e) => setForm(prev => ({ ...prev, employmentType: e.target.value }))}
              placeholder="Full-time / Internship / Remote"
            />
            <Input
              label="Range Gaji (opsional)"
              value={form.salaryRange}
              onChange={(e) => setForm(prev => ({ ...prev, salaryRange: e.target.value }))}
              placeholder="Rp 8jt - 12jt"
            />
            <Input
              label="Kontak (opsional)"
              value={form.contact}
              onChange={(e) => setForm(prev => ({ ...prev, contact: e.target.value }))}
              placeholder="Email/WA HR"
            />
          </div>

          <Input
            label="Link Apply (opsional)"
            value={form.applyLink}
            onChange={(e) => setForm(prev => ({ ...prev, applyLink: e.target.value }))}
            placeholder="https://..."
          />

          <div className="w-full">
            <label className="block text-sm font-medium text-gray-700 mb-1">Deskripsi</label>
            <textarea
              value={form.description}
              onChange={(e) => setForm(prev => ({ ...prev, description: e.target.value }))}
              className="w-full min-h-40 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
              required
            />
          </div>

          <div className="w-full">
            <label className="block text-sm font-medium text-gray-700 mb-1">Gambar (opsional)</label>
            <input
              type="file"
              accept="image/*"
              onChange={(e) => {
                const f = e.target.files?.[0] || null
                setImage(f)
                if (f) {
                  const reader = new FileReader()
                  reader.onloadend = () => setImagePreview(reader.result)
                  reader.readAsDataURL(f)
                } else {
                  setImagePreview(null)
                }
              }}
            />
            {imagePreview && (
              <img src={imagePreview} alt="Preview" className="mt-2 w-full max-h-56 object-cover rounded-xl border border-gray-200" />
            )}
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="secondary" onClick={() => { setIsCreateOpen(false); resetCreate() }} disabled={creating}>
              Batal
            </Button>
            <Button type="submit" disabled={creating}>
              {creating ? 'Membuat...' : 'Buat'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  )
}

export default Jobs

