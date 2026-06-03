import { useState, useEffect } from 'react'
import { FolderOpen, HardDrive, File, Trash2, Search, Filter, ArrowLeft, Image as ImageIcon, ExternalLink, RefreshCw, X, AlertTriangle, ShieldCheck, ChevronRight, LayoutGrid, Users, FileText, AlertCircle } from 'lucide-react'
import api from '../../services/api'
import AdminSidebar from '../../components/layout/AdminSidebar'
import Card from '../../components/common/Card'
import Button from '../../components/common/Button'
import ConfirmModal from '../../components/common/ConfirmModal'
import AlertModal from '../../components/common/AlertModal'

const ManageFiles = () => {
  const [stats, setStats] = useState(null)
  const [files, setFiles] = useState([])
  const [category, setCategory] = useState('profiles')
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [confirmModal, setConfirmModal] = useState({ isOpen: false, filename: '', category: '' })
  const [alertModal, setAlertModal] = useState({ isOpen: false, title: '', message: '', variant: 'info' })
  const [auditData, setAuditData] = useState(null)
  const [isAuditing, setIsAuditing] = useState(false)
  const [showAuditModal, setShowAuditModal] = useState(false)
  const [viewMode, setViewMode] = useState('explorer') // 'explorer' | 'trash'
  const [trashFiles, setTrashFiles] = useState([])
  const [isEmptying, setIsEmptying] = useState(false)
  const [isRestoring, setIsRestoring] = useState(false)
  const [showEmptyConfirm, setShowEmptyConfirm] = useState(false)
  const [deletionProgress, setDeletionProgress] = useState({ current: 0, total: 0 })
  const [trashPage, setTrashPage] = useState(1)
  const [itemsPerPage] = useState(20)

  useEffect(() => {
    fetchStats()
  }, [])

  useEffect(() => {
    if (viewMode === 'explorer') {
      fetchFiles()
    } else {
      fetchTrash()
    }
  }, [category, viewMode])

  const fetchStats = async () => {
    try {
      const response = await api.get('/admin/files/stats')
      setStats(response.data.stats)
    } catch (error) {
      console.error('Error fetching stats:', error)
    }
  }

  const fetchFiles = async () => {
    try {
      setLoading(true)
      const response = await api.get(`/admin/files?category=${category}&t=${Date.now()}`)
      setFiles(response.data.files)
    } finally {
      setLoading(false)
    }
  }

  const fetchTrash = async () => {
    try {
      setLoading(true)
      const response = await api.get(`/admin/files/trash?t=${Date.now()}`)
      setTrashFiles(response.data.files)
      setTrashPage(1) // Reset page on fetch
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async () => {
    try {
      const endpoint = viewMode === 'trash' ? '/admin/files/trash/single' : '/admin/files'
      
      await api.delete(endpoint, {
        data: { 
          category: confirmModal.category, 
          filename: confirmModal.filename 
        }
      })
      
      setConfirmModal({ isOpen: false, filename: '', category: '' })
      if (viewMode === 'explorer') {
        fetchFiles()
      } else {
        fetchTrash()
      }
      fetchStats()
      
      setAlertModal({
        isOpen: true,
        title: 'Berhasil',
        message: 'File berhasil dihapus permanen',
        variant: 'success'
      })
    } catch (error) {
      setAlertModal({
        isOpen: true,
        title: 'Error',
        message: 'Gagal menghapus file',
        variant: 'error'
      })
    }
  }

  const formatSize = (bytes) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  const handleAudit = async () => {
    try {
      setIsAuditing(true)
      const response = await api.get('/admin/files/audit')
      setAuditData(response.data)
      setShowAuditModal(true)
    } catch (error) {
      console.error('Audit error:', error)
      setAlertModal({
        isOpen: true,
        title: 'Error',
        message: 'Gagal melakukan pemindaian file sampah',
        variant: 'error'
      })
    } finally {
      setIsAuditing(false)
    }
  }

  const handleMoveToTrash = async () => {
    try {
      if (!auditData?.orphanedFiles?.length) return

      const filesToTrash = auditData.orphanedFiles.map(f => ({
        category: f.category,
        name: f.name
      }))

      await api.post('/admin/files/trash', { files: filesToTrash })
      
      setShowAuditModal(false)
      fetchStats()
      if (viewMode === 'explorer') fetchFiles()
      else fetchTrash()

      setAlertModal({
        isOpen: true,
        title: 'Berhasil',
        message: `${filesToTrash.length} file dipindahkan ke tempat sampah`,
        variant: 'success'
      })
    } catch (error) {
      console.error('Move to trash error:', error)
      setAlertModal({
        isOpen: true,
        title: 'Error',
        message: 'Gagal memindahkan file ke sampah',
        variant: 'error'
      })
    }
  }

  const handleRestore = async (file) => {
    try {
      setIsRestoring(true)
      await api.post('/admin/files/restore', { 
        files: [{ category: file.category, name: file.name }] 
      })
      fetchTrash()
      fetchStats()
      setAlertModal({
        isOpen: true,
        title: 'Berhasil',
        message: 'File berhasil dikembalikan',
        variant: 'success'
      })
    } catch (error) {
      setAlertModal({
        isOpen: true,
        title: 'Error',
        message: 'Gagal mengembalikan file',
        variant: 'error'
      })
    } finally {
      setIsRestoring(false)
    }
  }

  const handleEmptyTrash = async () => {
    try {
      setShowEmptyConfirm(false)
      setIsEmptying(true)
      
      const total = trashFiles.length
      setDeletionProgress({ current: 0, total })
      
      let successCount = 0
      for (let i = 0; i < total; i++) {
        const file = trashFiles[i]
        setDeletionProgress({ current: i + 1, total })
        
        try {
          await api.delete('/admin/files/trash/single', {
            data: { category: file.category, filename: file.name }
          })
          successCount++
        } catch (err) {
          console.error(`Gagal menghapus ${file.name}:`, err)
        }
      }
      
      setTrashFiles([]) 
      fetchStats()
      
      setAlertModal({
        isOpen: true,
        title: 'Pembersihan Selesai',
        message: `${successCount} dari ${total} file berhasil dihapus permanen.`,
        variant: 'success'
      })
    } catch (error) {
      console.error('Empty trash error:', error)
      setAlertModal({
        isOpen: true,
        title: 'Error',
        message: 'Terjadi kesalahan saat mengosongkan sampah',
        variant: 'error'
      })
    } finally {
      setIsEmptying(false)
      setDeletionProgress({ current: 0, total: 0 })
    }
  }

  const filteredFiles = files.filter(f => 
    f.name.toLowerCase().includes(search.toLowerCase())
  )

  const getPaginatedTrash = () => {
    const filtered = trashFiles.filter(f => f.name.toLowerCase().includes(search.toLowerCase()))
    const startIndex = (trashPage - 1) * itemsPerPage
    return filtered.slice(startIndex, startIndex + itemsPerPage)
  }

  const filteredTrashCount = trashFiles.filter(f => f.name.toLowerCase().includes(search.toLowerCase())).length
  const totalTrashPages = Math.ceil(filteredTrashCount / itemsPerPage)

  return (
    <div className="min-h-screen bg-gray-50 flex">
      <AdminSidebar />
      
      <div className="flex-1 flex flex-col h-screen overflow-hidden">
        <main className="flex-1 overflow-y-auto p-6">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
            {/* Header Section */}
            <div className="flex flex-col md:flex-row md:items-center justify-between mb-6 gap-4">
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Manajemen File</h1>
                <p className="text-gray-600 mt-1">Audit dan bersihkan penyimpanan server</p>
              </div>
              <div className="flex items-center gap-3">
                <Button 
                   variant={viewMode === 'trash' ? 'primary' : 'outline'}
                   onClick={() => setViewMode(viewMode === 'explorer' ? 'trash' : 'explorer')}
                   className={viewMode === 'explorer' ? 'bg-white' : ''}
                >
                    <Trash2 size={18} className="mr-2" />
                    {viewMode === 'explorer' ? `Tempat Sampah (${stats?.trashSize ? formatSize(stats.trashSize) : '0'})` : 'Kembali ke Penjelajah'}
                </Button>
                <Button onClick={handleAudit} loading={isAuditing}>
                    Pindai Sampah
                </Button>
              </div>
            </div>

            {/* Statistics Grid */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
              <Card className="p-4">
                <div className="text-sm text-gray-600">Total Penyimpanan</div>
                <div className="text-2xl font-bold text-gray-900">{formatSize(stats?.totalSize || 0)}</div>
              </Card>
              <Card className="p-4">
                <div className="text-sm text-gray-600">Ukuran Sampah</div>
                <div className="text-2xl font-bold text-amber-600">{formatSize(stats?.trashSize || 0)}</div>
              </Card>
              {(stats?.breakdown || []).slice(0, 2).map((cat) => (
                <Card key={cat.name} className="p-4">
                  <div className="text-sm text-gray-600 capitalize">{cat.name}</div>
                  <div className="text-2xl font-bold text-blue-600">{formatSize(cat.size)}</div>
                </Card>
              ))}
            </div>

            {/* Main Content Card */}
            <Card className="overflow-hidden">
              <div className="p-4 border-b border-gray-100 bg-white flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex flex-wrap gap-2">
                   {viewMode === 'explorer' ? (
                      ['profiles', 'posts', 'events', 'announcements', 'jobs', 'discussions'].map(cat => (
                        <button
                          key={cat}
                          onClick={() => setCategory(cat)}
                          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                            category === cat 
                              ? 'bg-blue-600 text-white' 
                              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                          }`}
                        >
                          {cat}
                        </button>
                      ))
                   ) : (
                     <div className="flex items-center gap-2 px-3 py-1 bg-amber-50 text-amber-700 rounded-lg border border-amber-200 text-sm font-bold">
                        <AlertCircle size={16} />
                        MODE SAMPAH
                     </div>
                   )}
                </div>

                <div className="flex items-center gap-3">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                    <input 
                      type="text"
                      placeholder="Cari file..."
                      className="pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none w-64"
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                    />
                  </div>
                  
                  {viewMode === 'trash' && trashFiles.length > 0 && (
                    <Button 
                      variant="danger"
                      onClick={() => setShowEmptyConfirm(true)}
                      loading={isEmptying}
                    >
                      {isEmptying ? `Menghapus... (${deletionProgress.current}/${deletionProgress.total})` : 'Kosongkan Sampah'}
                    </Button>
                  )}
                </div>
              </div>

              <div className="overflow-x-auto min-h-[400px]">
                {loading ? (
                  <div className="p-12 text-center text-gray-500 font-medium">Memuat data...</div>
                ) : (viewMode === 'explorer' ? filteredFiles : getPaginatedTrash()).length === 0 ? (
                  <div className="p-12 text-center text-gray-500">
                    <FolderOpen size={48} className="mx-auto mb-4 text-gray-300" />
                    <p>File tidak ditemukan</p>
                  </div>
                ) : (
                  <table className="w-full text-left">
                    <thead className="bg-gray-50 text-xs font-medium text-gray-500 uppercase">
                      <tr>
                        <th className="px-6 py-3 w-12">No.</th>
                        <th className="px-6 py-3">Pratinjau</th>
                        <th className="px-6 py-3">Nama File</th>
                        <th className="px-6 py-3">Ukuran</th>
                        <th className="px-6 py-3">Diubah</th>
                        <th className="px-6 py-3 text-right">Aksi</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {(viewMode === 'explorer' ? filteredFiles : getPaginatedTrash()).map((file, index) => {
                        const rowNumber = viewMode === 'explorer'
                          ? index + 1
                          : (trashPage - 1) * itemsPerPage + index + 1;
                        return (
                          <tr key={file.name} className="hover:bg-gray-50 transition-colors">
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-medium">
                              {rowNumber}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="w-10 h-10 rounded border border-gray-200 overflow-hidden bg-gray-100">
                                <img 
                                  src={`${api.defaults.baseURL.replace('/api', '')}${file.path}?t=${Date.now()}`} 
                                  alt=""
                                  className="w-full h-full object-cover"
                                  onError={(e) => {
                                    e.target.src = "https://placehold.co/100/f3f4f6/9ca3af?text=File"
                                  }}
                                />
                              </div>
                            </td>
                            <td className="px-6 py-4">
                              <div className="text-sm font-medium text-gray-900 truncate max-w-xs" title={file.name}>
                                  {file.name}
                              </div>
                              <div className="text-xs text-gray-400 font-medium uppercase tracking-tight">{file.category}</div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                              {formatSize(file.size)}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-xs text-gray-500">
                              {new Date(file.mtime || file.createdAt).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' })}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                              <div className="flex justify-end gap-2">
                                {viewMode === 'trash' ? (
                                  <>
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      onClick={() => handleRestore(file)}
                                      disabled={isRestoring}
                                      className="bg-white"
                                    >
                                      Pulihkan
                                    </Button>
                                    <Button
                                      variant="danger"
                                      size="sm"
                                      onClick={() => setConfirmModal({ 
                                        isOpen: true, 
                                        filename: file.name, 
                                        category: file.category 
                                      })}
                                    >
                                      Hapus
                                    </Button>
                                  </>
                                ) : (
                                  <Button
                                    variant="danger"
                                    size="sm"
                                    onClick={() => setConfirmModal({ 
                                      isOpen: true, 
                                      filename: file.name, 
                                      category: file.category 
                                    })}
                                  >
                                    Ke Sampah
                                  </Button>
                                )}
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                )}

                {/* Pagination */}
                {viewMode === 'trash' && totalTrashPages > 1 && (
                  <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-between bg-gray-50">
                    <div className="text-sm text-gray-700">
                      Halaman <span className="font-bold">{trashPage}</span> dari {totalTrashPages}
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        className="bg-white px-4 border-gray-200"
                        disabled={trashPage === 1}
                        onClick={() => setTrashPage(p => p - 1)}
                      >
                        Sebelumnya
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="bg-white px-4 border-gray-200"
                        disabled={trashPage === totalTrashPages}
                        onClick={() => setTrashPage(p => p + 1)}
                      >
                        Selanjutnya
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            </Card>
          </div>
        </main>
      </div>

      <ConfirmModal
        isOpen={confirmModal.isOpen}
        onClose={() => setConfirmModal({ isOpen: false, filename: '', category: '' })}
        onConfirm={handleDelete}
        title={viewMode === 'explorer' ? "Pindahkan ke Sampah?" : "Hapus Permanen?"}
        message={viewMode === 'explorer' 
          ? `File "${confirmModal.filename}" akan dipindahkan ke tempat sampah. Anda dapat memulihkannya nanti.`
          : `PERINGATAN: File "${confirmModal.filename}" akan dihapus selamanya. Tindakan ini tidak dapat dibatalkan.`
        }
        variant="danger"
      />

      <ConfirmModal
        isOpen={showEmptyConfirm}
        onClose={() => setShowEmptyConfirm(false)}
        onConfirm={handleEmptyTrash}
        title="Kosongkan Tempat Sampah?"
        message="Semua file di tempat sampah akan dihapus permanen. Tindakan ini tidak dapat dibatalkan."
        variant="danger"
      />

      {/* Audit Modal */}
      {showAuditModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <Card className="w-full max-w-4xl max-h-[80vh] flex flex-col shadow-2xl overflow-hidden">
            <div className="p-6 border-b border-gray-200 flex justify-between items-center bg-white">
              <h2 className="text-xl font-bold text-gray-900">Hasil Pemindaian</h2>
              <button onClick={() => setShowAuditModal(false)} className="text-gray-400 hover:text-gray-600">
                <X size={24} />
              </button>
            </div>

            <div className="p-0 overflow-y-auto bg-gray-50 flex-1">
              {!auditData?.orphanedFiles?.length ? (
                <div className="p-12 text-center text-gray-500 font-medium">Tidak ditemukan file sampah. Sistem bersih.</div>
              ) : (
                <>
                  <div className="bg-amber-50 p-4 border-b border-amber-100 flex justify-between items-center sticky top-0 md:relative">
                    <p className="text-sm font-medium text-amber-800">
                      Terdeteksi {auditData.orphanedFiles.length} file sampah ({formatSize(auditData.orphanedFiles.reduce((acc, f) => acc + f.size, 0))})
                    </p>
                    <Button variant="warning" size="sm" onClick={handleMoveToTrash}>
                      Pindahkan Semua ke Sampah
                    </Button>
                  </div>
                  <table className="w-full text-left bg-white">
                    <thead className="bg-gray-50 border-b border-gray-100">
                      <tr>
                        <th className="px-6 py-3 text-xs font-medium text-gray-500 uppercase w-12">No.</th>
                        <th className="px-6 py-3 text-xs font-medium text-gray-500 uppercase">Kategori</th>
                        <th className="px-6 py-3 text-xs font-medium text-gray-500 uppercase">Nama File</th>
                        <th className="px-6 py-3 text-xs font-medium text-gray-500 uppercase">Ukuran</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {auditData.orphanedFiles.map((f, i) => (
                        <tr key={i} className="text-sm">
                          <td className="px-6 py-3 text-gray-500 font-medium">{i + 1}</td>
                          <td className="px-6 py-3 uppercase text-[10px] font-bold text-gray-400">{f.category}</td>
                          <td className="px-6 py-3 truncate max-w-xs">{f.name}</td>
                          <td className="px-6 py-3 text-gray-500">{formatSize(f.size)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </>
              )}
            </div>

            <div className="p-4 border-t border-gray-200 bg-white flex justify-end">
              <Button onClick={() => setShowAuditModal(false)} variant="outline">Tutup</Button>
            </div>
          </Card>
        </div>
      )}

      <AlertModal
        isOpen={alertModal.isOpen}
        onClose={() => setAlertModal({ ...alertModal, isOpen: false })}
        title={alertModal.title}
        message={alertModal.message}
        variant={alertModal.variant}
      />
    </div>
  )
}

export default ManageFiles
