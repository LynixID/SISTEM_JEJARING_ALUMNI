import Modal from './Modal'
import { CheckCircle, XCircle, Info, AlertTriangle } from 'lucide-react'

const AlertModal = ({ 
  isOpen, 
  onClose, 
  title, 
  message, 
  buttonText = 'OK',
  variant = 'info', // 'success', 'error', 'info', 'warning'
  onButtonClick
}) => {
  const variants = {
    success: {
      icon: CheckCircle,
      iconColor: 'text-emerald-600',
      iconBg: 'bg-emerald-50',
      btnClass: 'bg-emerald-600 hover:bg-emerald-700 text-white'
    },
    error: {
      icon: XCircle,
      iconColor: 'text-red-600',
      iconBg: 'bg-red-50',
      btnClass: 'bg-red-600 hover:bg-red-700 text-white'
    },
    info: {
      icon: Info,
      iconColor: 'text-blue-600',
      iconBg: 'bg-blue-50',
      btnClass: 'bg-blue-600 hover:bg-blue-700 text-white'
    },
    warning: {
      icon: AlertTriangle,
      iconColor: 'text-amber-600',
      iconBg: 'bg-amber-50',
      btnClass: 'bg-amber-500 hover:bg-amber-600 text-white'
    }
  }

  const config = variants[variant] || variants.info
  const Icon = config.icon

  const handleButtonClick = () => {
    if (onButtonClick) onButtonClick()
    onClose()
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="sm">
      {/* Icon + Teks */}
      <div className="flex items-start gap-4">
        <div className={`flex-shrink-0 w-10 h-10 flex items-center justify-center ${config.iconBg} rounded-xl`}>
          <Icon className={config.iconColor} size={20} />
        </div>
        <div className="flex-1 min-w-0">
          {title && (
            <h3 className="text-base font-semibold text-gray-900 mb-1">{title}</h3>
          )}
          <p className="text-sm text-gray-500 leading-relaxed">{message}</p>
        </div>
      </div>

      {/* Footer */}
      <div className="flex justify-end mt-5 pt-4 border-t border-gray-100">
        <button
          onClick={handleButtonClick}
          className={`px-5 py-2 text-sm font-medium rounded-lg transition-colors ${config.btnClass}`}
        >
          {buttonText}
        </button>
      </div>
    </Modal>
  )
}

export default AlertModal
