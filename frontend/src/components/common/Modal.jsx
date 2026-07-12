import { useEffect, useRef } from 'react'
import { X } from 'lucide-react'

const Modal = ({ isOpen, onClose, title, children, size = 'md', showCloseButton = true, closeOnOverlayClick = true }) => {
  const panelRef = useRef(null)

  useEffect(() => {
    if (isOpen) {
      const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth
      document.body.style.paddingRight = `${scrollbarWidth}px`
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.paddingRight = '0px'
      document.body.style.overflow = 'unset'
    }
    return () => {
      document.body.style.paddingRight = '0px'
      document.body.style.overflow = 'unset'
    }
  }, [isOpen])

  if (!isOpen) return null

  const sizes = {
    sm: 'max-w-sm',
    md: 'max-w-lg',
    lg: 'max-w-2xl',
    xl: 'max-w-4xl'
  }

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      {/* Backdrop — referensi Chat: slate-900/50 + blur halus */}
      <div
        className="fixed inset-0 bg-slate-900/50 backdrop-blur-[2px] transition-opacity duration-200"
        onClick={() => closeOnOverlayClick && onClose && onClose()}
      />

      {/* Centering wrapper */}
      <div className="flex min-h-full items-center justify-center p-4">
        <div
          ref={panelRef}
          className={`
            relative w-full ${sizes[size]}
            bg-white rounded-2xl
            border border-gray-200/80
            shadow-xl
            transition-all duration-200
            animate-modal-in
          `}
        >
          {/* Header — hanya tampil jika ada title */}
          {title && (
            <div className="flex items-center justify-between px-6 pt-5 pb-4">
              <h3 className="text-base font-semibold text-gray-900">{title}</h3>
              {showCloseButton && (
                <button
                  onClick={onClose}
                  className="ml-4 flex-shrink-0 w-7 h-7 flex items-center justify-center rounded-full text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors"
                >
                  <X size={15} />
                </button>
              )}
            </div>
          )}

          {/* Jika tidak ada title tapi showCloseButton aktif, tampilkan X di pojok */}
          {!title && showCloseButton && (
            <button
              onClick={onClose}
              className="absolute top-4 right-4 z-10 w-7 h-7 flex items-center justify-center rounded-full text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors"
            >
              <X size={15} />
            </button>
          )}

          {/* Content */}
          <div className={`px-6 ${title ? 'pb-6' : 'py-6'}`}>
            {children}
          </div>
        </div>
      </div>

      {/* Keyframe inline via style tag — muncul halus dari bawah-sedikit + scale */}
      <style>{`
        @keyframes modal-in {
          from { opacity: 0; transform: translateY(8px) scale(0.97); }
          to   { opacity: 1; transform: translateY(0)   scale(1);    }
        }
        .animate-modal-in {
          animation: modal-in 0.18s ease-out both;
        }
      `}</style>
    </div>
  )
}

export default Modal
