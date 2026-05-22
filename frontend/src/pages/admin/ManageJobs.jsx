import { useState, useEffect } from 'react'
import { useAuth } from '../../context/AuthContext'
import api from '../../services/api'
import AdminSidebar from '../../components/layout/AdminSidebar'
import Button from '../../components/common/Button'
import Card from '../../components/common/Card'
import AlertModal from '../../components/common/AlertModal'
import ConfirmModal from '../../components/common/ConfirmModal'
import Modal from '../../components/common/Modal'
import UserBadge from '../../components/common/UserBadge'
import { Trash2, CheckCircle, XCircle, Eye, Search, Briefcase, MapPin, DollarSign, Calendar, ExternalLink, Image as ImageIcon } from 'lucide-react'
import { getImageUrl } from '../../utils/imageUtils'

const ManageJobs = () => {
  const [jobs, setJobs] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [activeTab, setActiveTab] = useState('all') // 'all', 'pending', 'approved', 'rejected'
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0
  })
  
  const [selectedJob, setSelectedJob] = useState(null)
  const [isDetailOpen, setIsDetailOpen] = useState(false)
  const [alertModal, setAlertModal] = useState({ isOpen: false, title: '', message: '', variant: 'info' })
  const [confirmModal, setConfirmModal] = useState({ 
    isOpen: false, 
    title: '', 
    message: '', 
    variant: 'warning',
    onConfirm: () => {}
  })

  useEffect(() => {
    fetchJobs()
  }, [pagination.page, search, activeTab])

  const fetchJobs = async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams({
        page: pagination.page,
        limit: pagination.limit,
        search,
        status: activeTab
      })

      const response = await api.get(`/admin/jobs?${params}`)
      setJobs(response.data.jobs)
      setPagination(response.data.pagination)
    } catch (error) {
      console.error('Error fetching jobs:', error)
      setAlertModal({
        isOpen: true,
        title: 'Error',
        message: 'Gagal mengambil data lowongan pekerjaan',
        variant: 'error'
      })
    } finally {
      setLoading(false)
    }
  }

  const handleApprove = async (jobId) => {
    setConfirmModal({
      isOpen: true,
      title: 'Setujui Lowongan Kerja',
      message: 'Apakah Anda yakin ingin menyetujui lowongan kerja ini agar dapat dilihat oleh seluruh alumni?',
      variant: 'success',
      onConfirm: async () => {
        try {
          await api.patch(`/admin/jobs/${jobId}/approve`)
          fetchJobs()
          setIsDetailOpen(false)
          setAlertModal({
            isOpen: true,
            title: 'Berhasil',
            message: 'Lowongan pekerjaan berhasil disetujui',
            variant: 'success'
          })
        } catch (error) {
          setAlertModal({
            isOpen: true,
            title: 'Error',
            message: error.response?.data?.error || 'Gagal menyetujui lowongan',
            variant: 'error'
          })
        }
      }
    })
  }

  const handleReject = async (jobId) => {
    setConfirmModal({
      isOpen: true,
      title: 'Tolak Lowongan Kerja',
      message: 'Apakah Anda yakin ingin menolak lowongan kerja ini?',
      variant: 'danger',
      onConfirm: async () => {
        try {
          await api.patch(`/admin/jobs/${jobId}/reject`)
          fetchJobs()
          setIsDetailOpen(false)
          setAlertModal({
            isOpen: true,
            title: 'Berhasil',
            message: 'Lowongan pekerjaan berhasil ditolak',
            variant: 'success'
          })
        } catch (error) {
          setAlertModal({
            isOpen: true,
            title: 'Error',
            message: error.response?.data?.error || 'Gagal menolak lowongan',
            variant: 'error'
          })
        }
      }
    })
  }

  const handleDelete = async (jobId) => {
    setConfirmModal({
      isOpen: true,
      title: 'Hapus Lowongan Kerja',
      message: 'Apakah Anda yakin ingin menghapus lowongan kerja ini? Seluruh data lowongan dan file terkait akan dihapus secara permanen.',
      variant: 'danger',
      onConfirm: async () => {
        try {
          await api.delete(`/admin/jobs/${jobId}`)
          fetchJobs()
          setIsDetailOpen(false)
          setAlertModal({
            isOpen: true,
            title: 'Berhasil',
            message: 'Lowongan pekerjaan berhasil dihapus',
            variant: 'success'
          })
        } catch (error) {
          setAlertModal({
            isOpen: true,
            title: 'Error',
            message: error.response?.data?.error || 'Gagal menghapus lowongan',
            variant: 'error'
          })
        }
      }
    })
  }

  const handleShowDetail = (job) => {
    setSelectedJob(job)
    setIsDetailOpen(true)
  }

  const formatDate = (dateString) => {
    const options = { year: 'numeric', month: 'short', day: 'numeric' }
    return new Date(dateString).toLocaleDateString('id-ID', options)
  }

  const getStatusBadge = (status) => {
    switch (status) {
      case 'PENDING':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200">
            Menunggu Verifikasi
          </span>
        )
      case 'APPROVED':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
            Disetujui
          </span>
        )
      case 'REJECTED':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-red-50 text-red-700 border border-red-200">
            Ditolak
          </span>
        )
      default:
        return null
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 flex">
      <AdminSidebar />
      
      <div className="flex-1 flex flex-col min-w-0">
        <main className="flex-1 overflow-y-auto">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
            <div className="mb-6">
              <h1 className="text-3xl font-bold text-gray-900">Manajemen Lowongan Pekerjaan</h1>
              <p className="text-gray-600 mt-1">Verifikasi (ACC), tolak, dan moderasi lowongan pekerjaan yang diajukan oleh alumni</p>
            </div>

            {/* Status Tabs */}
            <div className="flex border-b border-gray-200 mb-6 gap-2">
              {[
                { id: 'all', label: 'Semua Loker' },
                { id: 'pending', label: 'Menunggu Verifikasi (Pending)' },
                { id: 'approved', label: 'Disetujui (Approved)' },
                { id: 'rejected', label: 'Ditolak (Rejected)' }
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => {
                    setActiveTab(tab.id)
                    setPagination({ ...pagination, page: 1 })
                  }}
                  className={`py-2.5 px-4 font-medium text-sm transition-all border-b-2 ${
                    activeTab === tab.id
                      ? 'border-blue-600 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Search Filter Card */}
            <Card className="p-4 mb-6">
              <div className="flex flex-col md:flex-row gap-4">
                <div className="relative flex-1">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Search className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    type="text"
                    placeholder="Cari lowongan berdasarkan judul, perusahaan, lokasi, atau pengirim..."
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    value={search}
                    onChange={(e) => {
                      setSearch(e.target.value)
                      setPagination({ ...pagination, page: 1 })
                    }}
                  />
                </div>
                <Button onClick={fetchJobs} variant="outline" className="w-full md:w-auto px-6">
                  Refresh
                </Button>
              </div>
            </Card>

            {/* Jobs Table Card */}
            <Card className="overflow-hidden">
              {loading ? (
                <div className="p-8 text-center text-gray-500">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
                  <p>Memuat data lowongan pekerjaan...</p>
                </div>
              ) : jobs.length === 0 ? (
                <div className="p-12 text-center">
                  <div className="bg-gray-50 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 text-gray-400">
                    <Briefcase size={32} />
                  </div>
                  <p className="text-gray-500">Tidak ada lowongan pekerjaan ditemukan</p>
                </div>
              ) : (
                <>
                  <div className="overflow-x-auto">
                    <table className="w-full text-left">
                      <thead className="bg-gray-50 border-b border-gray-200">
                        <tr>
                          <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider w-[80px]">Logo</th>
                          <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Pekerjaan & Perusahaan</th>
                          <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Pengirim</th>
                          <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
                          <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Diajukan</th>
                          <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider text-center">Aksi</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {jobs.map((job) => (
                          <tr key={job.id} className="hover:bg-blue-50/30 transition-colors">
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="w-10 h-10 rounded-lg overflow-hidden border border-gray-100 bg-gray-50 flex items-center justify-center">
                                {job.image ? (
                                  <img 
                                    src={getImageUrl(job.image)} 
                                    alt={job.company}
                                    className="w-full h-full object-cover"
                                  />
                                ) : (
                                  <Briefcase size={16} className="text-gray-400" />
                                )}
                              </div>
                            </td>
                            <td className="px-6 py-4">
                              <div className="max-w-xs md:max-w-md">
                                <h3 className="text-sm font-bold text-gray-900 leading-tight">{job.title}</h3>
                                <p className="text-xs font-semibold text-blue-600 mt-0.5">{job.company}</p>
                                <div className="flex gap-2 items-center text-[11px] text-gray-500 mt-1">
                                  <span className="flex items-center gap-0.5">
                                    <MapPin size={10} />
                                    {job.location}
                                  </span>
                                  <span>•</span>
                                  <span className="px-1.5 py-0.2 rounded bg-gray-100 font-medium text-gray-600 text-[10px]">
                                    {job.type}
                                  </span>
                                </div>
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              {job.author ? (
                                <div>
                                  <div className="text-xs font-semibold text-gray-900 flex items-center">
                                    {job.author.nama}
                                    <UserBadge role={job.author.role} size="sm" />
                                  </div>
                                  <div className="text-[10px] text-gray-500">{job.author.email}</div>
                                </div>
                              ) : (
                                <span className="text-xs text-gray-400">Anonim / Sistem</span>
                              )}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              {getStatusBadge(job.status)}
                            </td>
                            <td className="px-6 py-4 text-xs text-gray-500 whitespace-nowrap">
                              {formatDate(job.createdAt)}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="flex justify-center gap-1.5">
                                <button 
                                  onClick={() => handleShowDetail(job)}
                                  className="text-gray-400 hover:text-blue-600 transition-colors p-1.5"
                                  title="Lihat Detail"
                                >
                                  <Eye size={18} />
                                </button>
                                
                                {job.status === 'PENDING' && (
                                  <>
                                    <button 
                                      onClick={() => handleApprove(job.id)}
                                      className="text-gray-400 hover:text-emerald-600 transition-colors p-1.5"
                                      title="Setujui (ACC)"
                                    >
                                      <CheckCircle size={18} />
                                    </button>
                                    <button 
                                      onClick={() => handleReject(job.id)}
                                      className="text-gray-400 hover:text-red-500 transition-colors p-1.5"
                                      title="Tolak"
                                    >
                                      <XCircle size={18} />
                                    </button>
                                  </>
                                )}

                                {job.status === 'APPROVED' && (
                                  <button 
                                    onClick={() => handleReject(job.id)}
                                    className="text-gray-400 hover:text-amber-500 transition-colors p-1.5"
                                    title="Batalkan Persetujuan (Tolak)"
                                  >
                                    <XCircle size={18} />
                                  </button>
                                )}

                                {job.status === 'REJECTED' && (
                                  <button 
                                    onClick={() => handleApprove(job.id)}
                                    className="text-gray-400 hover:text-emerald-500 transition-colors p-1.5"
                                    title="Setujui Ulang"
                                  >
                                    <CheckCircle size={18} />
                                  </button>
                                )}

                                <button 
                                  onClick={() => handleDelete(job.id)}
                                  className="text-gray-400 hover:text-red-600 transition-colors p-1.5"
                                  title="Hapus Lowongan"
                                >
                                  <Trash2 size={18} />
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {/* Pagination */}
                  {pagination.totalPages > 1 && (
                    <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-between">
                      <p className="text-sm text-gray-500">
                        Menampilkan <span className="font-medium">{(pagination.page - 1) * pagination.limit + 1}</span> hingga{' '}
                        <span className="font-medium">{Math.min(pagination.page * pagination.limit, pagination.total)}</span> dari{' '}
                        <span className="font-medium">{pagination.total}</span> lowongan
                      </p>
                      <div className="flex gap-1.5">
                        <Button 
                          variant="outline" 
                          size="sm" 
                          disabled={pagination.page === 1}
                          onClick={() => setPagination({ ...pagination, page: pagination.page - 1 })}
                        >
                          Sebelumnya
                        </Button>
                        {[...Array(pagination.totalPages)].map((_, index) => (
                          <button
                            key={index + 1}
                            onClick={() => setPagination({ ...pagination, page: index + 1 })}
                            className={`px-3 py-1 rounded-lg text-sm font-medium transition-colors ${
                              pagination.page === index + 1 
                                ? 'bg-blue-600 text-white font-semibold' 
                                : 'bg-white text-gray-500 hover:bg-gray-100 border border-gray-200'
                            }`}
                          >
                            {index + 1}
                          </button>
                        ))}
                        <Button 
                          variant="outline" 
                          size="sm" 
                          disabled={pagination.page === pagination.totalPages}
                          onClick={() => setPagination({ ...pagination, page: pagination.page + 1 })}
                        >
                          Selanjutnya
                        </Button>
                      </div>
                    </div>
                  )}
                </>
              )}
            </Card>
          </div>
        </main>
      </div>



      {/* Detail Modal */}
      {selectedJob && (
        <Modal
          isOpen={isDetailOpen}
          onClose={() => setIsDetailOpen(false)}
          title="Detail Lowongan Pekerjaan"
          size="lg"
        >
          <div className="space-y-6">
            {/* Header / Company Info */}
            <div className="flex gap-4 border-b border-gray-100 pb-4 items-start">
              <div className="w-16 h-16 rounded-2xl overflow-hidden border border-gray-100 bg-gray-50 flex items-center justify-center flex-shrink-0">
                {selectedJob.image ? (
                  <img 
                    src={getImageUrl(selectedJob.image)} 
                    alt={selectedJob.company}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <Briefcase size={28} className="text-gray-400" />
                )}
              </div>
              <div className="flex-grow">
                <h2 className="text-lg font-bold text-gray-900 leading-snug">{selectedJob.title}</h2>
                <h3 className="text-sm font-semibold text-blue-600 mt-0.5">{selectedJob.company}</h3>
                <div className="flex flex-wrap gap-x-4 gap-y-1.5 items-center text-xs text-gray-500 mt-2">
                  <span className="flex items-center gap-1">
                    <MapPin size={12} className="text-gray-400" />
                    {selectedJob.location}
                  </span>
                  <span className="flex items-center gap-1">
                    <Briefcase size={12} className="text-gray-400" />
                    {selectedJob.type}
                  </span>
                  {selectedJob.salary && (
                    <span className="flex items-center gap-1 font-medium text-emerald-600">
                      <DollarSign size={12} />
                      {selectedJob.salary}
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Status & Creator info */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-gray-50 rounded-2xl p-4">
              <div>
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Status Lowongan</p>
                {getStatusBadge(selectedJob.status)}
              </div>
              
              {selectedJob.author && (
                <div>
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Diajukan Oleh</p>
                  <div className="flex items-center gap-2">
                    <div className="text-xs">
                      <p className="font-bold text-gray-900 flex items-center">
                        {selectedJob.author.nama}
                        <UserBadge role={selectedJob.author.role} size="sm" />
                      </p>
                      <p className="text-[10px] text-gray-500">{selectedJob.author.email}</p>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Job Description */}
            <div className="space-y-2">
              <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider">Deskripsi Pekerjaan</h4>
              <div className="text-sm text-gray-800 leading-relaxed whitespace-pre-wrap max-h-[250px] overflow-y-auto pr-2 custom-scrollbar">
                {selectedJob.description}
              </div>
            </div>

            {/* External Application Link */}
            {selectedJob.link && (
              <div className="bg-blue-50/50 rounded-xl p-3 border border-blue-100 flex items-center justify-between text-sm">
                <span className="text-gray-600 font-medium">Link Pendaftaran/Info Lanjut:</span>
                <a 
                  href={selectedJob.link} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-blue-600 hover:text-blue-800 font-bold"
                >
                  Buka Link
                  <ExternalLink size={14} />
                </a>
              </div>
            )}

            {/* Actions Footer */}
            <div className="flex flex-wrap justify-between items-center gap-4 border-t border-gray-100 pt-4">
              <div className="flex gap-2">
                {selectedJob.status === 'PENDING' && (
                  <>
                    <Button 
                      variant="success" 
                      size="sm" 
                      onClick={() => handleApprove(selectedJob.id)}
                      className="flex items-center gap-1.5"
                    >
                      <CheckCircle size={14} />
                      Setujui (ACC)
                    </Button>
                    <Button 
                      variant="danger" 
                      size="sm" 
                      onClick={() => handleReject(selectedJob.id)}
                      className="flex items-center gap-1.5"
                    >
                      <XCircle size={14} />
                      Tolak Lowongan
                    </Button>
                  </>
                )}

                {selectedJob.status === 'APPROVED' && (
                  <Button 
                    variant="danger" 
                    size="sm" 
                    onClick={() => handleReject(selectedJob.id)}
                    className="flex items-center gap-1.5"
                  >
                    <XCircle size={14} />
                    Batalkan & Tolak
                  </Button>
                )}

                {selectedJob.status === 'REJECTED' && (
                  <Button 
                    variant="success" 
                    size="sm" 
                    onClick={() => handleApprove(selectedJob.id)}
                    className="flex items-center gap-1.5"
                  >
                    <CheckCircle size={14} />
                    Setujui Loker
                  </Button>
                )}
              </div>

              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => handleDelete(selectedJob.id)}
                className="flex items-center gap-1.5 border-red-200 text-red-600 hover:bg-red-50"
              >
                <Trash2 size={14} />
                Hapus Permanen
              </Button>
            </div>
          </div>
        </Modal>
      )}

      {/* Alerts & Confirmations */}
      <AlertModal
        isOpen={alertModal.isOpen}
        onClose={() => setAlertModal({ ...alertModal, isOpen: false })}
        title={alertModal.title}
        message={alertModal.message}
        variant={alertModal.variant}
      />

      <ConfirmModal
        isOpen={confirmModal.isOpen}
        onClose={() => setConfirmModal({ ...confirmModal, isOpen: false })}
        onConfirm={confirmModal.onConfirm}
        title={confirmModal.title}
        message={confirmModal.message}
        variant={confirmModal.variant}
      />
    </div>
  )
}

export default ManageJobs
