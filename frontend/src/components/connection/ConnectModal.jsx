import { useState, useEffect } from 'react'
import { X, Send, MessageSquare } from 'lucide-react'
import Button from '../common/Button'
import { sendConnectionRequest } from '../../services/api'

const MESSAGE_TEMPLATES = [
  {
    id: 1,
    text: 'Salam, saya ingin terhubung untuk memperluas jaringan alumni UII Jateng.'
  },
  {
    id: 2,
    text: 'Halo, saya tertarik untuk berkenalan dan berbagi pengalaman sebagai alumni.'
  },
  {
    id: 3,
    text: 'Salam kenal, mari kita jalin koneksi profesional sebagai sesama alumni UII Jateng.'
  },
  {
    id: 4,
    text: 'Halo! Mau kenalan dan saling support sebagai alumni UII Jateng?'
  },
  {
    id: 5,
    text: 'Hi! Yuk connect, siapa tahu bisa kolaborasi atau sharing pengalaman.'
  }
]

const ConnectModal = ({ isOpen, onClose, targetUser, onSuccess }) => {
  const [selectedTemplate, setSelectedTemplate] = useState(1) // Default template 1
  const [customMessage, setCustomMessage] = useState(MESSAGE_TEMPLATES[0].text) // Default template 1 text
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  // Reset to default template 1 when modal opens
  useEffect(() => {
    if (isOpen) {
      setSelectedTemplate(1)
      setCustomMessage(MESSAGE_TEMPLATES[0].text)
      setError('')
    }
  }, [isOpen])

  const handleTemplateSelect = (e) => {
    const templateId = e.target.value
    if (templateId === '') {
      setSelectedTemplate(null)
      return
    }
    const template = MESSAGE_TEMPLATES.find(t => t.id === parseInt(templateId))
    if (template) {
      setSelectedTemplate(template.id)
      setCustomMessage(template.text)
      setError('')
    }
  }

  const handleCustomMessageChange = (e) => {
    setCustomMessage(e.target.value)
    // Reset template selection when typing custom
    if (selectedTemplate) {
      setSelectedTemplate(null)
    }
    setError('')
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    if (!customMessage.trim()) {
      setError('Pesan tidak boleh kosong')
      return
    }

    // Validasi minimal 5 kata
    const wordCount = customMessage.trim().split(/\s+/).filter(word => word.length > 0).length
    if (wordCount < 5) {
      setError('Pesan minimal 5 kata')
      return
    }

    setLoading(true)
    setError('')

    try {
      const response = await sendConnectionRequest({
        connectedUserId: targetUser.id,
        message: customMessage.trim()
      })

      // Success
      if (onSuccess) {
        onSuccess(response.data)
      }
      onClose()
      // Reset form akan dilakukan oleh useEffect saat modal dibuka lagi
    } catch (err) {
      setError(err.response?.data?.error || err.message || 'Terjadi kesalahan saat mengirim request')
    } finally {
      setLoading(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Kirim Request Koneksi</h2>
            <p className="text-sm text-gray-600 mt-1">
              Kirim pesan kepada <span className="font-semibold">{targetUser?.nama || 'User'}</span>
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
          >
            <X size={24} className="text-gray-500" />
          </button>
        </div>

        {/* Content */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6">
          {/* Template Messages Dropdown */}
          <div className="mb-6">
            <label className="block text-sm font-semibold text-gray-900 mb-2">
              <div className="flex items-center gap-2">
                <MessageSquare size={18} className="text-gray-600" />
                Pilih Template Pesan (Opsional)
              </div>
            </label>
            <select
              value={selectedTemplate || ''}
              onChange={handleTemplateSelect}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
            >
              <option value="">-- Tulis pesan custom --</option>
              {MESSAGE_TEMPLATES.map((template) => (
                <option key={template.id} value={template.id}>
                  {template.text}
                </option>
              ))}
            </select>
            <p className="text-xs text-gray-500 mt-2">
              Pilih template untuk mengisi pesan otomatis, atau tulis pesan custom di bawah
            </p>
          </div>

          {/* Custom Message */}
          <div className="mb-4">
            <label className="block text-sm font-semibold text-gray-900 mb-2">
              Pesan Koneksi
            </label>
            <textarea
              value={customMessage}
              onChange={handleCustomMessageChange}
              placeholder="Tulis pesan personal Anda di sini..."
              rows={5}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
            />
            <p className="text-xs text-gray-500 mt-2">
              {customMessage.trim().split(/\s+/).filter(word => word.length > 0).length} kata (minimal 5 kata)
            </p>
          </div>

          {/* Error Message */}
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}
        </form>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 p-6 border-t border-gray-200 bg-gray-50">
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            disabled={loading}
          >
            Batal
          </Button>
          <Button
            type="submit"
            onClick={handleSubmit}
            disabled={loading || !customMessage.trim() || customMessage.trim().split(/\s+/).filter(word => word.length > 0).length < 5}
            className="flex items-center gap-2"
          >
            <Send size={18} />
            {loading ? 'Mengirim...' : 'Kirim Request'}
          </Button>
        </div>
      </div>
    </div>
  )
}

export default ConnectModal

