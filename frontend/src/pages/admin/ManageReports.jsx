import { useState, useEffect, useCallback } from 'react'
import { Link } from 'react-router-dom'
import axios from 'axios'
import { Search, Filter, Eye, Trash2, CheckCircle, XCircle, AlertTriangle, Clock, ShieldAlert, ChevronRight, X, Info } from 'lucide-react'
import { API_URL } from '../../services/api'
import { getImageUrl } from '../../utils/imageUtils'
import AdminSidebar from '../../components/layout/AdminSidebar'
import Card from '../../components/common/Card'
import Button from '../../components/common/Button'
import Input from '../../components/common/Input'

const REASON_LABELS = {
  SPAM: 'Spam',
  HARASSMENT: 'Pelecehan',
  HATE_SPEECH: 'Ujaran Kebencian',
  INAPPROPRIATE_CONTENT: 'Konten Tidak Pantas',
  FALSE_INFORMATION: 'Informasi Palsu',
  OTHER: 'Lainnya'
}

const TARGET_LABELS = {
  POST: 'Postingan',
  COMMENT: 'Komentar',
  USER: 'Pengguna'
}

const STATUS_CONFIG = {
  PENDING: { label: 'Menunggu', color: 'amber' },
  REVIEWED: { label: 'Ditinjau', color: 'blue' },
  RESOLVED: { label: 'Diselesaikan', color: 'green' },
  DISMISSED: { label: 'Ditolak', color: 'gray' }
}

export default function ManageReports() {
  const [reports, setReports] = useState([])
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)
  const [filterStatus, setFilterStatus] = useState('')
  const [filterType, setFilterType] = useState('')
  const [page, setPage] = useState(1)
  const [pagination, setPagination] = useState({})
  const [selectedReport, setSelectedReport] = useState(null)
  const [modalOpen, setModalOpen] = useState(false)
  const [actionLoading, setActionLoading] = useState(false)
  const [adminNote, setAdminNote] = useState('')
  const [toast, setToast] = useState(null)

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type })
    setTimeout(() => setToast(null), 3500)
  }

  const fetchStats = useCallback(async () => {
    try {
      const token = localStorage.getItem('token')
      const { data } = await axios.get(`${API_URL}/reports/statistics`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      setStats(data.statistics)
    } catch (_) {}
  }, [])

  const fetchReports = useCallback(async () => {
    setLoading(true)
    try {
      const token = localStorage.getItem('token')
      const params = new URLSearchParams({ page, limit: 15 })
      if (filterStatus) params.append('status', filterStatus)
      if (filterType) params.append('targetType', filterType)

      const { data } = await axios.get(`${API_URL}/reports?${params}`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      setReports(data.reports || [])
      setPagination(data.pagination || {})
    } catch (err) {
      showToast('Gagal memuat data laporan', 'error')
    } finally {
      setLoading(false)
    }
  }, [page, filterStatus, filterType])

  useEffect(() => {
    fetchStats()
    fetchReports()
  }, [fetchStats, fetchReports])

  const openDetail = (report) => {
    setSelectedReport(report)
    setAdminNote(report.adminNote || '')
    setModalOpen(true)
  }

  const closeModal = () => {
    setModalOpen(false)
    setSelectedReport(null)
    setAdminNote('')
  }

  const updateStatus = async (reportId, status) => {
    setActionLoading(true)
    try {
      const token = localStorage.getItem('token')
      await axios.patch(`${API_URL}/reports/${reportId}/status`, { status, adminNote }, {
        headers: { Authorization: `Bearer ${token}` }
      })
      showToast(`Status laporan diubah ke "${STATUS_CONFIG[status]?.label}"`)
      closeModal()
      fetchReports()
      fetchStats()
    } catch {
      showToast('Gagal mengubah status', 'error')
    } finally {
      setActionLoading(false)
    }
  }

  const deleteContent = async (reportId) => {
    if (!window.confirm('Apakah Anda yakin ingin menghapus konten yang dilaporkan? Tindakan ini tidak dapat dibatalkan.')) return
    setActionLoading(true)
    try {
      const token = localStorage.getItem('token')
      await axios.delete(`${API_URL}/reports/${reportId}/content`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      showToast('Konten berhasil dihapus dan semua laporan terkait diselesaikan')
      closeModal()
      fetchReports()
      fetchStats()
    } catch {
      showToast('Gagal menghapus konten', 'error')
    } finally {
      setActionLoading(false)
    }
  }

  const handleFilterChange = (setter) => (e) => {
    setter(e.target.value)
    setPage(1)
  }

  const renderContent = () => (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Manajemen Laporan</h1>
          <p className="text-gray-500 text-sm mt-1">Moderasi konten berdasarkan laporan pengguna</p>
        </div>
      </div>

      {/* Stats Breakdown - Simplified theme */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card className="p-4 border-l-4 border-amber-500 flex flex-col justify-center">
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Menunggu</p>
            <div className="flex items-center justify-between">
               <span className="text-2xl font-black text-gray-900">{stats.byStatus.pending}</span>
               <Clock className="text-amber-500" size={20} />
            </div>
          </Card>
          <Card className="p-4 border-l-4 border-blue-500 flex flex-col justify-center">
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Ditinjau</p>
            <div className="flex items-center justify-between">
               <span className="text-2xl font-black text-gray-900">{stats.byStatus.reviewed}</span>
               <Eye className="text-blue-500" size={20} />
            </div>
          </Card>
          <Card className="p-4 border-l-4 border-green-500 flex flex-col justify-center">
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Selesai</p>
            <div className="flex items-center justify-between">
               <span className="text-2xl font-black text-gray-900">{stats.byStatus.resolved}</span>
               <CheckCircle className="text-green-500" size={20} />
            </div>
          </Card>
          <Card className="p-4 border-l-4 border-gray-400 flex flex-col justify-center">
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Ditolak</p>
            <div className="flex items-center justify-between">
               <span className="text-2xl font-black text-gray-900">{stats.byStatus.dismissed}</span>
               <XCircle className="text-gray-400" size={20} />
            </div>
          </Card>
        </div>
      )}

      {/* Filters (Announcement Theme style) */}
      <Card className="p-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <select 
              className="w-full px-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none" 
              value={filterStatus} 
              onChange={handleFilterChange(setFilterStatus)}
            >
              <option value="">Semua Status</option>
              <option value="PENDING">Menunggu</option>
              <option value="REVIEWED">Ditinjau</option>
              <option value="RESOLVED">Diselesaikan</option>
              <option value="DISMISSED">Ditolak</option>
            </select>
          </div>
          <div>
            <select 
              className="w-full px-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none" 
              value={filterType} 
              onChange={handleFilterChange(setFilterType)}
            >
              <option value="">Semua Tipe Konten</option>
              <option value="POST">Postingan</option>
              <option value="COMMENT">Komentar</option>
              <option value="USER">Pengguna</option>
            </select>
          </div>
          <div className="flex gap-2">
             {(filterStatus || filterType) && (
               <Button 
                variant="outline" 
                onClick={() => { setFilterStatus(''); setFilterType(''); setPage(1); }}
                className="w-full py-2"
               >
                 Reset Filter
               </Button>
             )}
          </div>
        </div>
      </Card>

      {/* Reports Table (Announcement Theme style) */}
      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr className="text-xs font-bold text-gray-500 uppercase tracking-widest">
                <th className="px-6 py-4 text-left">Pelapor</th>
                <th className="px-6 py-4 text-left">Tipe Konten</th>
                <th className="px-6 py-4 text-left">Alasan</th>
                <th className="px-6 py-4 text-left">Status</th>
                <th className="px-6 py-4 text-left">Tanggal</th>
                <th className="px-6 py-4 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? (
                <tr>
                  <td colSpan="6" className="px-6 py-10 text-center text-gray-400 font-medium">
                    Memuat data laporan...
                  </td>
                </tr>
              ) : reports.length === 0 ? (
                <tr>
                  <td colSpan="6" className="px-6 py-10 text-center text-gray-400 font-medium italic">
                    Tidak ada laporan ditemukan
                  </td>
                </tr>
              ) : (
                reports.map((r) => (
                  <tr key={r.id} className={`hover:bg-gray-50 transition-colors ${r.status === 'PENDING' ? 'bg-amber-50/30' : ''}`}>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-gray-100 overflow-hidden flex-shrink-0 border border-gray-200">
                           <img
                             src={getImageUrl(r.reporter?.profile?.fotoProfil, 'profiles')}
                             alt=""
                             className="w-full h-full object-cover"
                             onError={(e) => { e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(r.reporter?.nama || 'U')}&background=random` }}
                           />
                        </div>
                        <div className="flex flex-col">
                           <span className="text-sm font-bold text-gray-800">{r.reporter?.nama || 'User'}</span>
                           <span className="text-[10px] text-gray-400 truncate w-32 font-medium">{r.reporter?.email}</span>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                       <span className={`text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded ${
                         r.targetType === 'POST' ? 'bg-purple-100 text-purple-700' : 
                         r.targetType === 'COMMENT' ? 'bg-indigo-100 text-indigo-700' : 'bg-pink-100 text-pink-700'
                       }`}>
                          {TARGET_LABELS[r.targetType]}
                       </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600 font-medium">
                       {REASON_LABELS[r.reason]}
                    </td>
                    <td className="px-6 py-4">
                       <div className="flex items-center gap-1.5">
                          <div className={`w-1.5 h-1.5 rounded-full ${
                             r.status === 'PENDING' ? 'bg-amber-500' :
                             r.status === 'REVIEWED' ? 'bg-blue-500' :
                             r.status === 'RESOLVED' ? 'bg-green-500' : 'bg-gray-400'
                          }`} />
                          <span className="text-xs font-bold text-gray-700">{STATUS_CONFIG[r.status]?.label}</span>
                       </div>
                    </td>
                    <td className="px-6 py-4 text-xs text-gray-500 font-medium">
                       {new Date(r.createdAt).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' })}
                    </td>
                    <td className="px-6 py-4 text-right">
                       <button 
                        onClick={() => openDetail(r)}
                        className="text-blue-600 hover:text-blue-800 p-2 hover:bg-blue-50 rounded-lg transition-all"
                       >
                         <ChevronRight size={20} />
                       </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination (Announcement Style) */}
        {pagination.totalPages > 1 && (
          <div className="bg-gray-50 px-6 py-4 flex items-center justify-between border-t border-gray-100">
            <span className="text-xs font-bold text-gray-500 uppercase tracking-widest">
              Halaman {page} dari {pagination.totalPages}
            </span>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage(p => p - 1)}
                disabled={page <= 1}
                className="bg-white"
              >
                Prev
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage(p => p + 1)}
                disabled={page >= pagination.totalPages}
                className="bg-white"
              >
                Next
              </Button>
            </div>
          </div>
        )}
      </Card>
    </div>
  )

  return (
    <div className="min-h-screen bg-gray-50 flex">
      <AdminSidebar />
      
      <div className="flex-1 flex flex-col h-screen overflow-hidden">
        <main className="flex-1 overflow-y-auto custom-scrollbar">
          {renderContent()}
        </main>
      </div>

      {toast && (
        <div className={`fixed top-6 right-6 z-[9999] px-6 py-3 rounded-2xl shadow-2xl animate-in slide-in-from-right-10 duration-300 font-bold text-sm ${
          toast.type === 'success' ? 'bg-green-600 text-white' : 'bg-red-600 text-white'
        }`}>
          {toast.msg}
        </div>
      )}

      {/* Detail Modal (Announcement Form Style) */}
      {modalOpen && selectedReport && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm shadow-2xl animate-in fade-in duration-200">
          <Card className="w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden shadow-2xl border-none">
             {/* Modal Header */}
             <div className="p-6 border-b border-gray-100 flex items-center justify-between bg-white relative z-10">
                <div className="flex items-center gap-3">
                   <div className="p-2 bg-blue-50 text-blue-600 rounded-xl">
                      <ShieldAlert size={24} />
                   </div>
                   <h2 className="text-xl font-black text-gray-900 tracking-tight">Detail Laporan</h2>
                </div>
                <button onClick={closeModal} className="p-2 hover:bg-gray-100 rounded-xl transition-colors">
                  <X size={20} className="text-gray-400" />
                </button>
             </div>

             {/* Modal Body */}
             <div className="flex-1 overflow-y-auto p-6 space-y-6">
                {/* Reporter & Basic Info */}
                <div className="grid grid-cols-2 gap-4">
                   <div className="space-y-1">
                      <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Tipe & Alasan</p>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-gray-700">{TARGET_LABELS[selectedReport.targetType]}</span>
                        <div className="w-1 h-1 bg-gray-300 rounded-full" />
                        <span className="text-xs font-bold text-gray-700">{REASON_LABELS[selectedReport.reason]}</span>
                      </div>
                   </div>
                   <div className="space-y-1">
                      <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Waktu Kejadian</p>
                      <p className="text-xs font-bold text-gray-700">{new Date(selectedReport.createdAt).toLocaleString('id-ID')}</p>
                   </div>
                   <div className="col-span-2 space-y-1">
                      <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Pelapor</p>
                      <p className="text-xs font-bold text-gray-700">{selectedReport.reporter?.nama} ({selectedReport.reporter?.email})</p>
                   </div>
                </div>

                {/* Content Snapshot */}
                <div className="space-y-2">
                   <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Konten yang dilaporkan</p>
                   {selectedReport.targetSnapshot ? (
                     <div className="p-4 bg-gray-50 rounded-2xl border border-gray-100">
                        {selectedReport.targetType === 'USER' ? (
                          <div className="flex justify-between items-center">
                            <div className="flex items-center gap-3">
                               <div className="w-10 h-10 rounded-xl bg-gray-200 overflow-hidden">
                                  <img src={getImageUrl(selectedReport.targetSnapshot?.profile?.fotoProfil, 'profiles')} alt="" />
                               </div>
                               <div>
                                  <p className="text-sm font-bold text-gray-900">{selectedReport.targetSnapshot.nama}</p>
                                  <p className="text-xs text-gray-500">{selectedReport.targetSnapshot.email}</p>
                               </div>
                            </div>
                            <Link to={`/profil/${selectedReport.targetId}`} target="_blank" className="text-xs font-black text-blue-600 hover:underline uppercase tracking-widest">Lihat Profil ↗</Link>
                          </div>
                        ) : (
                          <div className="space-y-2">
                             <p className="text-[10px] font-bold text-blue-500 uppercase tracking-widest px-1.5 py-0.5 bg-blue-50 w-fit rounded">
                                Oleh: {selectedReport.targetSnapshot.author?.nama || 'User'}
                             </p>
                             <p className="text-sm text-gray-700 leading-relaxed italic">"{selectedReport.targetSnapshot.content}"</p>
                             {selectedReport.targetSnapshot.media && (
                               <div className="mt-3 rounded-xl overflow-hidden border border-gray-200 max-w-xs">
                                  <img 
                                    src={getImageUrl(selectedReport.targetSnapshot.media, selectedReport.targetType === 'POST' ? 'posts' : 'events')} 
                                    alt="Media" 
                                    className="w-full h-full object-cover"
                                  />
                               </div>
                             )}
                          </div>
                        )}
                     </div>
                   ) : (
                     <div className="p-4 bg-red-50 text-red-700 rounded-2xl border border-red-100 flex items-center gap-2">
                        <AlertTriangle size={16} />
                        <span className="text-xs font-bold">Konten ini sudah dihapus atau tidak tersedia lagi.</span>
                     </div>
                   )}
                </div>

                {/* Admin Note Input */}
                <div className="space-y-2 pt-4 border-t border-gray-50">
                  <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Catatan Admin</p>
                  <textarea
                    value={adminNote}
                    onChange={(e) => setAdminNote(e.target.value)}
                    placeholder="Contoh: User telah diberikan peringatan pertama..."
                    className="w-full px-4 py-3 rounded-2xl bg-gray-50 border border-gray-200 text-sm focus:ring-4 focus:ring-blue-500/10 outline-none min-h-[100px] transition-all"
                  />
                </div>
             </div>

             {/* Modal Actions */}
             <div className="p-6 bg-gray-50/50 border-t border-gray-100 flex flex-wrap gap-3">
                {selectedReport.status === 'PENDING' && (
                  <Button 
                    variant="primary" 
                    size="sm" 
                    onClick={() => updateStatus(selectedReport.id, 'REVIEWED')}
                    disabled={actionLoading}
                  >
                    Tandai Tinjau
                  </Button>
                )}
                {['PENDING', 'REVIEWED'].includes(selectedReport.status) && selectedReport.targetSnapshot && (
                  <Button 
                    variant="danger" 
                    size="sm" 
                    onClick={() => deleteContent(selectedReport.id)}
                    disabled={actionLoading}
                  >
                    Hapus Konten
                  </Button>
                )}
                {['PENDING', 'REVIEWED'].includes(selectedReport.status) && (
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => updateStatus(selectedReport.id, 'RESOLVED')}
                    disabled={actionLoading}
                    className="bg-white"
                  >
                    Selesaikan
                  </Button>
                )}
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={closeModal}
                  className="bg-white ml-auto"
                >
                  Tutup
                </Button>
             </div>
          </Card>
        </div>
      )}
    </div>
  )
}
