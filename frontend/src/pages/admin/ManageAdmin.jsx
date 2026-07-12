import { useState, useEffect } from 'react'
import {
  ShieldCheck, Eye, EyeOff,
  Pencil, Trash2, ShieldAlert
} from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import api from '../../services/api'
import AdminSidebar from '../../components/layout/AdminSidebar'
import Button from '../../components/common/Button'
import Card from '../../components/common/Card'
import Input from '../../components/common/Input'
import Modal from '../../components/common/Modal'
import ConfirmModal from '../../components/common/ConfirmModal'
import AlertModal from '../../components/common/AlertModal'

/* ── Field password dengan toggle show/hide ── */
const PasswordField = ({ id, label, hint, value, onChange, showPass, onToggleShow, placeholder = 'Min. 6 karakter' }) => (
  <div>
    <label className="block text-sm font-medium text-gray-700 mb-1">
      {label}
      {hint && <span className="ml-1 text-xs text-gray-400 font-normal">{hint}</span>}
    </label>
    <div className="relative">
      <input
        id={id}
        type={showPass ? 'text' : 'password'}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        className="w-full px-4 py-2 pr-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-sm"
      />
      <button
        type="button"
        onClick={onToggleShow}
        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
      >
        {showPass ? <EyeOff size={15} /> : <Eye size={15} />}
      </button>
    </div>
  </div>
)

const ManageAdmin = () => {
  const { user: currentUser } = useAuth()

  const [admins, setAdmins] = useState([])
  const [loading, setLoading] = useState(true)

  const [alertModal, setAlertModal] = useState({ isOpen: false, title: '', message: '', variant: 'info' })
  const [confirmModal, setConfirmModal] = useState({
    isOpen: false, title: '', message: '', variant: 'danger',
    isLoading: false, onConfirm: () => {}
  })

  /* ── Add Modal state ── */
  const [isAddOpen, setIsAddOpen] = useState(false)
  const [addForm, setAddForm] = useState({ nama: '', email: '', password: '', confirmPassword: '' })
  const [addError, setAddError] = useState('')
  const [addLoading, setAddLoading] = useState(false)
  const [showAddPass, setShowAddPass] = useState(false)
  const [showAddConfirm, setShowAddConfirm] = useState(false)

  /* ── Edit Modal state ── */
  const [isEditOpen, setIsEditOpen] = useState(false)
  const [editTarget, setEditTarget] = useState(null)
  const [editForm, setEditForm] = useState({ nama: '', email: '', password: '', confirmPassword: '' })
  const [editError, setEditError] = useState('')
  const [editLoading, setEditLoading] = useState(false)
  const [showEditPass, setShowEditPass] = useState(false)
  const [showEditConfirm, setShowEditConfirm] = useState(false)

  /* ── Fetch ── */
  useEffect(() => { fetchAdmins() }, [])

  const fetchAdmins = async () => {
    setLoading(true)
    try {
      const res = await api.get('/admin/admins')
      setAdmins(res.data.admins || [])
    } catch {
      setAlertModal({ isOpen: true, title: 'Error', message: 'Gagal memuat data admin', variant: 'error' })
    } finally {
      setLoading(false)
    }
  }

  /* ── Add Admin ── */
  const openAdd = () => {
    setAddForm({ nama: '', email: '', password: '', confirmPassword: '' })
    setAddError('')
    setShowAddPass(false)
    setShowAddConfirm(false)
    setIsAddOpen(true)
  }

  const handleAddSubmit = async (e) => {
    e.preventDefault()
    setAddError('')
    setAddLoading(true)

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

    if (!addForm.nama.trim() || addForm.nama.trim().length < 3) {
      setAddError('Nama harus diisi minimal 3 karakter'); setAddLoading(false); return
    }
    if (!emailRegex.test(addForm.email)) {
      setAddError('Format email tidak valid'); setAddLoading(false); return
    }
    if (!addForm.password || addForm.password.length < 6) {
      setAddError('Password minimal 6 karakter'); setAddLoading(false); return
    }
    if (addForm.password !== addForm.confirmPassword) {
      setAddError('Konfirmasi password tidak cocok'); setAddLoading(false); return
    }

    try {
      await api.post('/admin/admins', {
        nama: addForm.nama.trim(),
        email: addForm.email.trim(),
        password: addForm.password
      })
      setIsAddOpen(false)
      fetchAdmins()
      setAlertModal({ isOpen: true, title: 'Berhasil', message: 'Akun admin berhasil ditambahkan', variant: 'success' })
    } catch (err) {
      setAddError(err.response?.data?.error || 'Gagal menambahkan admin')
    } finally {
      setAddLoading(false)
    }
  }

  /* ── Edit Admin ── */
  const openEdit = (admin) => {
    setEditTarget(admin)
    setEditForm({ nama: admin.nama, email: admin.email, password: '', confirmPassword: '' })
    setEditError('')
    setShowEditPass(false)
    setShowEditConfirm(false)
    setIsEditOpen(true)
  }

  const handleEditSubmit = async (e) => {
    e.preventDefault()
    setEditError('')
    setEditLoading(true)

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

    if (!editForm.nama.trim() || editForm.nama.trim().length < 3) {
      setEditError('Nama harus diisi minimal 3 karakter'); setEditLoading(false); return
    }
    if (!emailRegex.test(editForm.email)) {
      setEditError('Format email tidak valid'); setEditLoading(false); return
    }
    if (editForm.password) {
      if (editForm.password.length < 6) {
        setEditError('Password minimal 6 karakter'); setEditLoading(false); return
      }
      if (editForm.password !== editForm.confirmPassword) {
        setEditError('Konfirmasi password tidak cocok'); setEditLoading(false); return
      }
    }

    try {
      const payload = { nama: editForm.nama.trim(), email: editForm.email.trim() }
      if (editForm.password.trim()) payload.password = editForm.password
      await api.patch(`/admin/admins/${editTarget.id}`, payload)
      setIsEditOpen(false)
      fetchAdmins()
      setAlertModal({ isOpen: true, title: 'Berhasil', message: 'Akun admin berhasil diperbarui', variant: 'success' })
    } catch (err) {
      setEditError(err.response?.data?.error || 'Gagal memperbarui admin')
    } finally {
      setEditLoading(false)
    }
  }

  /* ── Delete Admin ── */
  const handleDelete = (admin) => {
    setConfirmModal({
      isOpen: true,
      title: 'Hapus Akun Admin',
      message: `Apakah Anda yakin ingin menghapus akun admin "${admin.nama}"? Tindakan ini tidak dapat dibatalkan.`,
      variant: 'danger',
      isLoading: false,
      onConfirm: async () => {
        try {
          setConfirmModal(prev => ({ ...prev, isLoading: true }))
          await api.delete(`/admin/admins/${admin.id}`)
          fetchAdmins()
          setAlertModal({ isOpen: true, title: 'Berhasil', message: 'Akun admin berhasil dihapus', variant: 'success' })
        } catch (err) {
          setAlertModal({
            isOpen: true, title: 'Error',
            message: err.response?.data?.error || 'Gagal menghapus admin', variant: 'error'
          })
        } finally {
          setConfirmModal(prev => ({ ...prev, isLoading: false }))
        }
      }
    })
  }

  /* ── Render ── */
  return (
    <div className="min-h-screen bg-gray-50 flex">
      <AdminSidebar />

      <div className="flex-1 flex flex-col">
        <main className="flex-1 overflow-y-auto">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">

            {/* Header */}
            <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 mb-6">
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Manajemen Admin</h1>
                <p className="text-gray-600 mt-1">Kelola akun administrator sistem</p>
              </div>
              <Button variant="primary" onClick={openAdd} className="flex items-center space-x-2">
                <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                Tambah Admin
              </Button>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              <Card className="p-4">
                <div className="text-sm text-gray-600">Total Administrator</div>
                <div className="text-2xl font-bold text-blue-600">{admins.length}</div>
              </Card>
              <Card className="p-4">
                <div className="text-sm text-gray-600">Akun Anda</div>
                <div className="text-sm font-semibold text-gray-900 mt-1 truncate">
                  {currentUser?.email || '-'}
                </div>
              </Card>
            </div>

            {/* Table */}
            <Card className="overflow-hidden">
              {loading ? (
                <div className="p-8 text-center text-gray-500">Memuat data...</div>
              ) : admins.length === 0 ? (
                <div className="p-12 text-center">
                  <ShieldAlert size={40} className="mx-auto text-gray-300 mb-3" />
                  <p className="text-gray-500">Belum ada data administrator</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase w-12">No.</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Nama</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Email</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Tgl. Dibuat</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Aksi</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {admins.map((admin, index) => {
                        const isSelf = admin.id === currentUser?.id
                        return (
                          <tr key={admin.id} className="hover:bg-gray-50">
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-medium">
                              {index + 1}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="flex items-center gap-3">
                                <div className="w-9 h-9 rounded-full bg-blue-600 flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
                                  {admin.nama?.charAt(0)?.toUpperCase() || 'A'}
                                </div>
                                <div>
                                  <div className="text-sm font-semibold text-gray-900 flex items-center gap-1.5">
                                    {admin.nama}
                                    {isSelf && (
                                      <span className="text-[10px] bg-blue-100 text-blue-600 px-1.5 py-0.5 rounded-full font-bold border border-blue-200">
                                        ANDA
                                      </span>
                                    )}
                                  </div>
                                </div>
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm text-gray-900">{admin.email}</div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                <ShieldCheck size={11} />
                                Administrator
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm text-gray-500">
                                {new Date(admin.createdAt).toLocaleDateString('id-ID', {
                                  day: 'numeric', month: 'short', year: 'numeric'
                                })}
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                              <div className="flex gap-2">
                                <Button variant="outline" size="sm" onClick={() => openEdit(admin)}>
                                  <Pencil size={13} className="mr-1" />
                                  Edit
                                </Button>
                                {!isSelf && (
                                  <Button variant="danger" size="sm" onClick={() => handleDelete(admin)}>
                                    <Trash2 size={13} className="mr-1" />
                                    Hapus
                                  </Button>
                                )}
                              </div>
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </Card>

          </div>
        </main>
      </div>

      {/* ── Modal: Tambah Admin ─────────────────────────────────────────────── */}
      <Modal
        isOpen={isAddOpen}
        onClose={() => setIsAddOpen(false)}
        closeOnOverlayClick={false}
        title="Tambah Admin Baru"
        size="md"
      >
        <form onSubmit={handleAddSubmit} className="space-y-4">
          {addError && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
              {addError}
            </div>
          )}

          <Input
            label="Nama Lengkap"
            id="add-nama"
            value={addForm.nama}
            onChange={(e) => setAddForm({ ...addForm, nama: e.target.value })}
            placeholder="Contoh: Budi Santoso"
            required
          />

          <Input
            label="Email"
            id="add-email"
            type="email"
            value={addForm.email}
            onChange={(e) => setAddForm({ ...addForm, email: e.target.value })}
            placeholder="admin@email.com"
            required
          />

          <PasswordField
            id="add-password"
            label="Password"
            value={addForm.password}
            onChange={(e) => setAddForm({ ...addForm, password: e.target.value })}
            showPass={showAddPass}
            onToggleShow={() => setShowAddPass(p => !p)}
          />

          <PasswordField
            id="add-confirm-password"
            label="Konfirmasi Password"
            placeholder="Masukkan ulang password"
            value={addForm.confirmPassword}
            onChange={(e) => setAddForm({ ...addForm, confirmPassword: e.target.value })}
            showPass={showAddConfirm}
            onToggleShow={() => setShowAddConfirm(p => !p)}
          />

          {/* Indikator kecocokan password */}
          {addForm.password && addForm.confirmPassword && (
            <p className={`text-xs font-medium ${addForm.password === addForm.confirmPassword ? 'text-green-600' : 'text-red-500'}`}>
              {addForm.password === addForm.confirmPassword ? '✓ Password cocok' : '✗ Password tidak cocok'}
            </p>
          )}

          <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
            <Button variant="outline" type="button" onClick={() => setIsAddOpen(false)}>Batal</Button>
            <Button variant="primary" type="submit" disabled={addLoading}>
              {addLoading ? 'Memproses...' : 'Simpan Admin'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* ── Modal: Edit Admin ───────────────────────────────────────────────── */}
      <Modal
        isOpen={isEditOpen}
        onClose={() => setIsEditOpen(false)}
        closeOnOverlayClick={false}
        title={`Edit Admin — ${editTarget?.nama || ''}`}
        size="md"
      >
        <form onSubmit={handleEditSubmit} className="space-y-4">
          {editError && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
              {editError}
            </div>
          )}

          <Input
            label="Nama Lengkap"
            id="edit-nama"
            value={editForm.nama}
            onChange={(e) => setEditForm({ ...editForm, nama: e.target.value })}
            required
          />

          <Input
            label="Email"
            id="edit-email"
            type="email"
            value={editForm.email}
            onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
            required
          />

          <PasswordField
            id="edit-password"
            label="Password Baru"
            hint="(kosongkan jika tidak ingin mengubah)"
            value={editForm.password}
            onChange={(e) => setEditForm({ ...editForm, password: e.target.value, confirmPassword: '' })}
            showPass={showEditPass}
            onToggleShow={() => setShowEditPass(p => !p)}
          />

          {/* Konfirmasi password hanya muncul saat password diisi */}
          {editForm.password.length > 0 && (
            <>
              <PasswordField
                id="edit-confirm-password"
                label="Konfirmasi Password Baru"
                placeholder="Masukkan ulang password baru"
                value={editForm.confirmPassword}
                onChange={(e) => setEditForm({ ...editForm, confirmPassword: e.target.value })}
                showPass={showEditConfirm}
                onToggleShow={() => setShowEditConfirm(p => !p)}
              />

              {/* Indikator kecocokan */}
              {editForm.confirmPassword && (
                <p className={`text-xs font-medium ${editForm.password === editForm.confirmPassword ? 'text-green-600' : 'text-red-500'}`}>
                  {editForm.password === editForm.confirmPassword ? '✓ Password cocok' : '✗ Password tidak cocok'}
                </p>
              )}
            </>
          )}

          <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
            <Button variant="outline" type="button" onClick={() => setIsEditOpen(false)}>Batal</Button>
            <Button variant="primary" type="submit" disabled={editLoading}>
              {editLoading ? 'Memproses...' : 'Simpan Perubahan'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* ── Confirm Delete ──────────────────────────────────────────────────── */}
      <ConfirmModal
        isOpen={confirmModal.isOpen}
        title={confirmModal.title}
        message={confirmModal.message}
        onConfirm={confirmModal.onConfirm}
        onClose={() => setConfirmModal({ ...confirmModal, isOpen: false })}
        variant={confirmModal.variant}
        isLoading={confirmModal.isLoading}
      />

      {/* ── Alert ──────────────────────────────────────────────────────────── */}
      <AlertModal
        isOpen={alertModal.isOpen}
        title={alertModal.title}
        message={alertModal.message}
        onClose={() => setAlertModal({ ...alertModal, isOpen: false })}
        variant={alertModal.variant}
      />
    </div>
  )
}

export default ManageAdmin
