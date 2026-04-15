import { Shield } from 'lucide-react'

/**
 * UserBadge - Komponen badge untuk menampilkan role user (Pengurus/Alumni)
 * @param {string} role - 'PENGURUS' | 'ALUMNI' | 'ADMIN'
 * @param {string} size - 'sm' | 'md' (default: sm)
 */
const UserBadge = ({ role, size = 'sm' }) => {
  // Hanya tampilkan badge untuk PENGURUS dan ADMIN
  if (role !== 'PENGURUS' && role !== 'ADMIN') return null

  const isPengurus = role === 'PENGURUS'
  
  // Ukuran badge
  const sizeClasses = size === 'md' 
    ? 'text-[10px] px-2 py-0.5 gap-1' 
    : 'text-[9px] px-1.5 py-0.5 gap-0.5'

  // Warna badge
  const colorClasses = isPengurus
    ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
    : 'bg-violet-50 text-violet-700 border-violet-200'

  return (
    <span
      className={`inline-flex items-center ${sizeClasses} font-semibold rounded-full border ${colorClasses} ml-1.5`}
      title={isPengurus ? 'Pengurus DPW IKA UII JATENG' : 'Administrator'}
    >
      <Shield size={size === 'md' ? 12 : 9} />
      {isPengurus ? 'Pengurus' : 'Admin'}
    </span>
  )
}

export default UserBadge