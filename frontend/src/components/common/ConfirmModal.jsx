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
      iconColor: 'text-yellow-600',
      iconBg: 'bg-yellow-100',
      confirmVariant: 'primary'
    },
    danger: {
      icon: XCircle,
      iconColor: 'text-red-600',
      iconBg: 'bg-red-100',
      confirmVariant: 'danger'
    },
    info: {
      icon: Info,
      iconColor: 'text-blue-600',
      iconBg: 'bg-blue-100',
      confirmVariant: 'primary'
    },
    success: {
      icon: CheckCircle,
      iconColor: 'text-green-600',
      iconBg: 'bg-green-100',
      confirmVariant: 'primary'
    }
  }

  const config = variants[variant]
  const Icon = config.icon

  const handleConfirm = () => {
    onConfirm()
    onClose()
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="md" showCloseButton={!isLoading}>
      <div className="space-y-4">
        <div className="flex items-start gap-4">
          <div className={`flex-shrink-0 p-3 ${config.iconBg} rounded-xl`}>
            <Icon className={config.iconColor} size={24} />
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">{title}</h3>
            <p className="text-gray-600">{message}</p>
          </div>
        </div>
        
        <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
          <Button
            variant="outline"
            onClick={onClose}
            disabled={isLoading}
          >
            {cancelText}
          </Button>
          <Button
            variant={config.confirmVariant}
            onClick={handleConfirm}
            disabled={isLoading}
          >
            {isLoading ? 'Memproses...' : confirmText}
          </Button>
        </div>
      </div>
    </Modal>
  )
}

export default ConfirmModal

