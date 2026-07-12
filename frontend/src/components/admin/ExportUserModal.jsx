import React, { useState, useEffect } from 'react'
import Modal from '../common/Modal'
import Button from '../common/Button'
import api from '../../services/api'
import { FileSpreadsheet, Loader2 } from 'lucide-react'

const ExportUserModal = ({ isOpen, onClose }) => {
  const [filters, setFilters] = useState({
    prodi: 'all',
    domisili: 'all',
    angkatan: 'all',
    role: 'all',
    verified: 'all'
  })
  const [options, setOptions] = useState({
    prodis: [],
    domisilis: [],
    angkatans: []
  })
  const [loading, setLoading] = useState(false)
  const [loadingOptions, setLoadingOptions] = useState(true)

  useEffect(() => {
    if (isOpen) {
      fetchFilterOptions()
    }
  }, [isOpen])

  const fetchFilterOptions = async () => {
    try {
      setLoadingOptions(true)
      const response = await api.get('/admin/users/filter-options')
      setOptions(response.data)
    } catch (error) {
      console.error('Error fetching filter options:', error)
    } finally {
      setLoadingOptions(false)
    }
  }

  const handleExport = async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams()
      Object.entries(filters).forEach(([key, value]) => {
        if (value && value !== 'all') params.append(key, value)
      })

      const response = await api.get(`/admin/users/export?${params.toString()}`, {
        responseType: 'blob'
      })

      const url = window.URL.createObjectURL(new Blob([response.data]))
      const link = document.createElement('a')
      link.href = url
      link.setAttribute('download', `Rekap_User_${new Date().toISOString().split('T')[0]}.xlsx`)
      document.body.appendChild(link)
      link.click()
      link.remove()
      window.URL.revokeObjectURL(url)
      onClose()
    } catch (error) {
      console.error('Export error:', error)
      alert('Gagal mengekspor data user')
    } finally {
      setLoading(false)
    }
  }

  const SelectGroup = ({ label, value, options, onChange, placeholder }) => (
    <div className="space-y-1">
      <label className="text-sm font-medium text-gray-700">{label}</label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
        disabled={loadingOptions}
      >
        <option value="all">{placeholder || `Semua ${label}`}</option>
        {options.map((opt, i) => (
          <option key={i} value={opt}>
            {opt}
          </option>
        ))}
      </select>
    </div>
  )

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Ekspor Data User ke Excel">
      <div className="space-y-4">
        <p className="text-sm text-gray-600">
          Pilih filter di bawah ini untuk menyaring data yang akan diekspor. Data diambil langsung dari database.
        </p>

        {loadingOptions ? (
          <div className="py-12 flex flex-col items-center justify-center space-y-3">
             <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
             <p className="text-sm text-gray-500">Memuat opsi filter...</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <SelectGroup
                label="Program Studi"
                value={filters.prodi}
                options={options.prodis}
                onChange={(val) => setFilters({ ...filters, prodi: val })}
                placeholder="Semua Program Studi"
              />
            </div>

            <SelectGroup
              label="Domisili / Wilayah"
              value={filters.domisili}
              options={options.domisilis}
              onChange={(val) => setFilters({ ...filters, domisili: val })}
              placeholder="Semua Wilayah"
            />

            <SelectGroup
              label="Angkatan"
              value={filters.angkatan}
              options={options.angkatans}
              onChange={(val) => setFilters({ ...filters, angkatan: val })}
              placeholder="Semua Angkatan"
            />

            <SelectGroup
              label="Role"
              value={filters.role}
              options={['ALUMNI', 'PENGURUS']}
              onChange={(val) => setFilters({ ...filters, role: val })}
              placeholder="Semua Role"
            />

            <div className="space-y-1">
              <label className="text-sm font-medium text-gray-700">Status Verifikasi</label>
              <select
                value={filters.verified}
                onChange={(e) => setFilters({ ...filters, verified: e.target.value })}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
              >
                <option value="all">Semua Status</option>
                <option value="true">Terverifikasi</option>
                <option value="false">Belum Verifikasi</option>
                <option value="suspended">Ditangguhkan</option>
              </select>
            </div>
          </div>
        )}

        <div className="flex space-x-3 pt-6 border-t mt-6">
          <Button variant="secondary" onClick={onClose} className="flex-1">
            Batal
          </Button>
          <Button 
            variant="primary" 
            onClick={handleExport} 
            loading={loading}
            disabled={loadingOptions}
            className="flex-1 flex items-center justify-center"
          >
            <FileSpreadsheet className="w-4 h-4 mr-2" />
            Mulai Ekspor
          </Button>
        </div>
      </div>
    </Modal>
  )
}

export default ExportUserModal
