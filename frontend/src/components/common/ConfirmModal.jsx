import Modal from './Modal'
import Button from './Button'
import { AlertTriangle, CheckCircle, Info, XCircle } from 'lucide-react'

const ConfirmModal = ({ 
  isOpen, 
  onClose, 
  onConfirm, 
  title = 'Konfirmasi', 
  message, 
  confirmText = 'Ya, Lanjutkan',
  cancelText = 'Batal',
  variant = 'warning', // 'warning', 'danger', 'info', 'success'
  isLoading = false
}) => {
  const variants = {
    warning: {
      icon: AlertTriangle,
      iconColor: 'text-amber-600',
      iconBg: 'bg-amber-50',
      confirmVariant: 'warning',
      confirmClass: 'bg-amber-500 hover:bg-amber-600 text-white'
    },
    danger: {
      icon: XCircle,
      iconColor: 'text-red-600',
      iconBg: 'bg-red-50',
      confirmVariant: 'danger',
      confirmClass: 'bg-red-600 hover:bg-red-700 text-white'
    },
    info: {
      icon: Info,
      iconColor: 'text-blue-600',
      iconBg: 'bg-blue-50',
      confirmVariant: 'primary',
      confirmClass: 'bg-blue-600 hover:bg-blue-700 text-white'
    },
    success: {
      icon: CheckCircle,
      iconColor: 'text-emerald-600',
      iconBg: 'bg-emerald-50',
      confirmVariant: 'primary',
      confirmClass: 'bg-emerald-600 hover:bg-emerald-700 text-white'
    }
  }

  const config = variants[variant] || variants.warning
  const Icon = config.icon

  const handleConfirm = async () => {
    await onConfirm()
    onClose()
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="sm" showCloseButton={!isLoading}>
      {/* Icon + Teks */}
      <div className="flex items-start gap-4">
        <div className={`flex-shrink-0 w-10 h-10 flex items-center justify-center ${config.iconBg} rounded-xl`}>
          <Icon className={config.iconColor} size={20} />
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="text-base font-semibold text-gray-900 mb-1">{title}</h3>
          <p className="text-sm text-gray-500 leading-relaxed">{message}</p>
        </div>
      </div>

      {/* Footer */}
      <div className="flex items-center justify-end gap-2 mt-5 pt-4 border-t border-gray-100">
        <button
          onClick={onClose}
          disabled={isLoading}
          className="px-4 py-2 text-sm font-medium text-gray-600 bg-white border border-gray-200 hover:bg-gray-50 hover:border-gray-300 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {cancelText}
        </button>
        <button
          onClick={handleConfirm}
          disabled={isLoading}
          className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${config.confirmClass}`}
        >
          {isLoading ? (
            <span className="flex items-center gap-2">
              <svg className="animate-spin h-3.5 w-3.5" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
              Memproses...
            </span>
          ) : confirmText}
        </button>
      </div>
    </Modal>
  )
}

export default ConfirmModal
