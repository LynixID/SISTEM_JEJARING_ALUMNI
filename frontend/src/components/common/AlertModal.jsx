import Modal from './Modal'
import Button from './Button'
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
      iconColor: 'text-green-600',
      iconBg: 'bg-green-100'
    },
    error: {
      icon: XCircle,
      iconColor: 'text-red-600',
      iconBg: 'bg-red-100'
    },
    info: {
      icon: Info,
      iconColor: 'text-blue-600',
      iconBg: 'bg-blue-100'
    },
    warning: {
      icon: AlertTriangle,
      iconColor: 'text-yellow-600',
      iconBg: 'bg-yellow-100'
    }
  }

  const config = variants[variant]
  const Icon = config.icon

  const handleButtonClick = () => {
    if (onButtonClick) {
      onButtonClick()
    }
    onClose()
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="md">
      <div className="space-y-4">
        <div className="flex items-start gap-4">
          <div className={`flex-shrink-0 p-3 ${config.iconBg} rounded-xl`}>
            <Icon className={config.iconColor} size={24} />
          </div>
          <div className="flex-1">
            {title && (
              <h3 className="text-lg font-semibold text-gray-900 mb-2">{title}</h3>
            )}
            <p className="text-gray-600">{message}</p>
          </div>
        </div>
        
        <div className="flex justify-end pt-4 border-t border-gray-200">
          <Button
            variant="primary"
            onClick={handleButtonClick}
          >
            {buttonText}
          </Button>
        </div>
      </div>
    </Modal>
  )
}

export default AlertModal

