import { useState, useRef, useEffect } from 'react'
import Modal from './Modal'
import { Trash2 } from 'lucide-react'

const SwipeConfirmModal = ({ 
  isOpen, 
  onClose, 
  onConfirm, 
  title = 'Hapus Data', 
  message = 'Apakah Anda yakin?', 
  cancelText = 'Batal',
  isLoading = false
}) => {
  const [sliderPosition, setSliderPosition] = useState(0)
  const [isDragging, setIsDragging] = useState(false)
  const [isTriggered, setIsTriggered] = useState(false)
  const trackRef = useRef(null)
  const startX = useRef(0)

  const handleConfirm = async () => {
    setIsTriggered(true)
    await onConfirm()
    onClose()
  }

  const handleStart = (e) => {
    if (isLoading || isTriggered) return
    setIsDragging(true)
    const clientX = e.type.startsWith('touch') ? e.touches[0].clientX : e.clientX
    startX.current = clientX - sliderPosition
  }

  const handleMove = (e) => {
    if (!isDragging || isLoading || isTriggered) return
    const clientX = e.type.startsWith('touch') ? e.touches[0].clientX : e.clientX
    if (!trackRef.current) return
    
    const trackWidth = trackRef.current.clientWidth
    const handleWidth = 44
    const maxDistance = trackWidth - handleWidth - 8

    let newPosition = clientX - startX.current
    if (newPosition < 0) newPosition = 0
    if (newPosition > maxDistance) newPosition = maxDistance
    
    setSliderPosition(newPosition)
    
    // Konfirmasi saat mencapai ~98% jalur
    if (newPosition >= maxDistance * 0.98) {
      setIsDragging(false)
      setSliderPosition(maxDistance)
      handleConfirm()
    }
  }

  const handleEnd = () => {
    if (!isDragging) return
    setIsDragging(false)
    
    if (!trackRef.current) {
      setSliderPosition(0)
      return
    }
    
    const trackWidth = trackRef.current.clientWidth
    const handleWidth = 44
    const maxDistance = trackWidth - handleWidth - 8
    
    if (sliderPosition < maxDistance * 0.98) {
      setSliderPosition(0)
    }
  }

  // Global event listeners saat drag aktif
  useEffect(() => {
    if (isDragging) {
      window.addEventListener('mousemove', handleMove)
      window.addEventListener('mouseup', handleEnd)
      window.addEventListener('touchmove', handleMove, { passive: true })
      window.addEventListener('touchend', handleEnd)
    } else {
      window.removeEventListener('mousemove', handleMove)
      window.removeEventListener('mouseup', handleEnd)
      window.removeEventListener('touchmove', handleMove)
      window.removeEventListener('touchend', handleEnd)
    }
    return () => {
      window.removeEventListener('mousemove', handleMove)
      window.removeEventListener('mouseup', handleEnd)
      window.removeEventListener('touchmove', handleMove)
      window.removeEventListener('touchend', handleEnd)
    }
  }, [isDragging, sliderPosition])

  // Reset saat modal tertutup
  useEffect(() => {
    if (!isOpen) {
      setSliderPosition(0)
      setIsDragging(false)
      setIsTriggered(false)
    }
  }, [isOpen])

  // Progress persen untuk visual fill
  const progressPercent = trackRef.current
    ? Math.min(100, (sliderPosition / (trackRef.current.clientWidth - 44 - 8)) * 100)
    : 0

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="sm" showCloseButton={!isLoading}>
      {/* Icon + Konten */}
      <div className="flex items-start gap-4">
        <div className="flex-shrink-0 w-10 h-10 flex items-center justify-center bg-red-50 rounded-xl">
          <Trash2 className="text-red-600" size={19} />
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="text-base font-semibold text-gray-900 mb-1">{title}</h3>
          <div className="text-sm text-gray-500 leading-relaxed">{message}</div>
        </div>
      </div>

      {/* Divider */}
      <div className="border-t border-gray-100 mt-5" />

      {/* Swipe track */}
      <div className="mt-4">
        <div
          ref={trackRef}
          className="relative w-full h-11 bg-gray-100 rounded-xl overflow-hidden flex items-center select-none"
          style={{ userSelect: 'none' }}
        >
          {/* Fill merah yang mengikuti geseran */}
          <div
            className="absolute left-0 top-0 bottom-0 bg-red-500/10 pointer-events-none transition-none"
            style={{ width: `${Math.min(sliderPosition + 50, trackRef.current?.clientWidth || 0)}px` }}
          />

          {/* Teks instruksi — fade out saat geser */}
          <span
            className="absolute inset-0 flex items-center justify-center text-xs font-medium text-gray-400 pointer-events-none transition-opacity duration-150"
            style={{ opacity: isLoading || isTriggered ? 0 : Math.max(0, 1 - progressPercent / 40) }}
          >
            {isTriggered ? '' : 'Geser untuk menghapus →'}
          </span>

          {/* Handle (tombol geser) */}
          <div
            onMouseDown={handleStart}
            onTouchStart={handleStart}
            style={{ transform: `translateX(${sliderPosition}px)` }}
            className={`
              absolute left-1 w-9 h-9 rounded-lg flex items-center justify-center
              transition-colors duration-100 select-none
              ${isLoading || isTriggered
                ? 'bg-red-500 pointer-events-none'
                : isDragging
                  ? 'bg-red-700 cursor-grabbing'
                  : 'bg-red-600 cursor-grab hover:bg-red-700'}
              text-white shadow-sm
            `}
          >
            {isLoading || isTriggered ? (
              <svg className="animate-spin h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
            ) : (
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
              </svg>
            )}
          </div>
        </div>
      </div>

      {/* Tombol batal */}
      <div className="flex justify-end mt-3">
        <button
          onClick={onClose}
          disabled={isLoading || isTriggered}
          className="px-4 py-2 text-sm font-medium text-gray-600 bg-white border border-gray-200 hover:bg-gray-50 hover:border-gray-300 rounded-lg transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
        >
          {cancelText}
        </button>
      </div>
    </Modal>
  )
}

export default SwipeConfirmModal
