import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { getUsers, getAnnouncements, getEvents } from '../../services/api'
import { getImageUrl } from '../../utils/imageUtils'
import UserBadge from '../common/UserBadge'
import { Users, Newspaper, CalendarDays, ChevronRight } from 'lucide-react'

// ─── Helper: format tanggal singkat ───────────────────────────────────────────
const formatDate = (dateStr) => {
  if (!dateStr) return ''
  const date = new Date(dateStr)
  return date.toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })
}

// ─── Avatar dengan fallback inisial ───────────────────────────────────────────
const UserAvatar = ({ user, size = 'md' }) => {
  const [imgError, setImgError] = useState(false)
  const sizeClass = size === 'md' ? 'w-10 h-10 text-sm' : 'w-9 h-9 text-xs'
  const fotoUrl = user?.profile?.fotoProfil
    ? getImageUrl(user.profile.fotoProfil, 'profiles')
    : null

  const initials = (user?.nama || 'U')
    .split(' ')
    .slice(0, 2)
    .map((n) => n.charAt(0).toUpperCase())
    .join('')

  // Warna avatar berdasarkan inisial (konsisten per user)
  const colors = [
    'bg-blue-500', 'bg-indigo-500', 'bg-violet-500', 'bg-emerald-500',
    'bg-amber-500', 'bg-rose-500', 'bg-cyan-500', 'bg-teal-500',
  ]
  const colorIdx = (user?.nama?.charCodeAt(0) || 0) % colors.length
  const avatarColor = colors[colorIdx]

  if (fotoUrl && !imgError) {
    return (
      <img
        src={fotoUrl}
        alt={user?.nama}
        className={`${sizeClass} rounded-full object-cover ring-2 ring-white flex-shrink-0`}
        onError={() => setImgError(true)}
      />
    )
  }

  return (
    <div
      className={`${sizeClass} ${avatarColor} rounded-full flex items-center justify-center text-white font-semibold flex-shrink-0 ring-2 ring-white`}
    >
      {initials}
    </div>
  )
}

// ─── Section: Pengguna Baru ────────────────────────────────────────────────────
const NewUsersSection = () => {
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const navigate = useNavigate()
  const { user: currentUser } = useAuth()

  useEffect(() => {
    const fetch = async () => {
      try {
        // Backend default: orderBy createdAt desc, verified: true, role: ALUMNI
        // Kita ambil limit 4, role ALUMNI (default)
        const res = await getUsers({ limit: 4, page: 1 })
        const allUsers = res.data?.users || []
        
        // Filter out user yang sedang login
        const filteredUsers = allUsers.filter(u => u.id !== currentUser?.id)
        setUsers(filteredUsers)
      } catch {
        setUsers([])
      } finally {
        setLoading(false)
      }
    }
    fetch()
  }, [currentUser?.id])

  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 pt-4 pb-3 border-b border-gray-50">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 bg-blue-50 rounded-lg flex items-center justify-center">
            <Users size={14} className="text-blue-600" />
          </div>
          <h3 className="text-sm font-semibold text-gray-800">Anggota Baru</h3>
        </div>
        <button
          onClick={() => navigate('/direktori')}
          className="text-xs text-blue-600 hover:text-blue-700 font-medium flex items-center gap-0.5 transition-colors"
        >
          Lihat semua
          <ChevronRight size={12} />
        </button>
      </div>

      {/* List */}
      <div className="divide-y divide-gray-50">
        {loading ? (
          // Skeleton loader
          Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="flex items-center gap-3 px-4 py-3 animate-pulse">
              <div className="w-10 h-10 bg-gray-100 rounded-full flex-shrink-0" />
              <div className="flex-1 space-y-1.5">
                <div className="h-3 bg-gray-100 rounded w-3/4" />
                <div className="h-2.5 bg-gray-100 rounded w-1/2" />
              </div>
            </div>
          ))
        ) : users.length === 0 ? (
          <p className="text-xs text-gray-400 text-center py-6">Belum ada anggota</p>
        ) : (
          users.map((u) => {
            const profesi = u?.profile?.profesi || u?.profile?.perusahaan || null
            const role = u?.role === 'PENGURUS' ? 'Pengurus' : 'Alumni'
            const infoText = profesi || role

            return (
              <button
                key={u.id}
                onClick={() => navigate(`/profil/${u.id}`)}
                className="w-full flex items-center gap-3 px-4 py-3 hover:bg-blue-50/50 transition-colors text-left group"
              >
                <UserAvatar user={u} size="md" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-gray-800 truncate group-hover:text-blue-700 transition-colors leading-tight">
                    {u.nama}
                    <UserBadge role={u.role} size="sm" />
                  </p>
                  <p className="text-xs text-gray-400 truncate mt-0.5 leading-tight">
                    {infoText}
                  </p>
                </div>
                <ChevronRight size={14} className="text-gray-300 group-hover:text-blue-400 flex-shrink-0 transition-colors" />
              </button>
            )
          })
        )}
      </div>
    </div>
  )
}

// ─── Section: Berita & Event Terbaru ──────────────────────────────────────────
const LatestNewsSection = () => {
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const navigate = useNavigate()

  useEffect(() => {
    const fetchAll = async () => {
      try {
        const [annRes, evtRes] = await Promise.all([
          getAnnouncements({ limit: 3, published: true }),
          getEvents({ limit: 3, published: true }),
        ])

        const announcements = (annRes.data?.announcements || []).map((a) => ({
          ...a,
          _type: 'berita',
        }))
        const events = (evtRes.data?.events || []).map((e) => ({
          ...e,
          _type: 'event',
        }))

        // Gabung, urutkan terbaru, ambil 4
        const merged = [...announcements, ...events]
          .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
          .slice(0, 4)

        setItems(merged)
      } catch {
        setItems([])
      } finally {
        setLoading(false)
      }
    }
    fetchAll()
  }, [])

  const handleClick = (item) => {
    if (item._type === 'berita') navigate(`/berita/${item.id}`)
    else navigate(`/events/${item.id}`)
  }

  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 pt-4 pb-3 border-b border-gray-50">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 bg-indigo-50 rounded-lg flex items-center justify-center">
            <Newspaper size={14} className="text-indigo-600" />
          </div>
          <h3 className="text-sm font-semibold text-gray-800">Info Terbaru</h3>
        </div>
        <button
          onClick={() => navigate('/berita')}
          className="text-xs text-blue-600 hover:text-blue-700 font-medium flex items-center gap-0.5 transition-colors"
        >
          Lihat semua
          <ChevronRight size={12} />
        </button>
      </div>

      {/* List */}
      <div className="divide-y divide-gray-50">
        {loading ? (
          Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="px-4 py-3 animate-pulse space-y-2">
              <div className="flex items-center gap-2">
                <div className="h-4 w-10 bg-gray-100 rounded-full" />
                <div className="h-3 bg-gray-100 rounded w-1/3" />
              </div>
              <div className="h-3 bg-gray-100 rounded w-full" />
              <div className="h-3 bg-gray-100 rounded w-2/3" />
            </div>
          ))
        ) : items.length === 0 ? (
          <p className="text-xs text-gray-400 text-center py-6">Belum ada informasi</p>
        ) : (
          items.map((item) => {
            const isEvent = item._type === 'event'
            const dateStr = formatDate(item.createdAt)

            return (
              <button
                key={`${item._type}-${item.id}`}
                onClick={() => handleClick(item)}
                className="w-full px-4 py-3 hover:bg-indigo-50/40 transition-colors text-left group"
              >
                {/* Badge + Tanggal */}
                <div className="flex items-center gap-2 mb-1">
                  <span
                    className={`inline-flex items-center gap-1 text-[10px] font-semibold px-1.5 py-0.5 rounded-full ${
                      isEvent
                        ? 'bg-amber-50 text-amber-600'
                        : 'bg-blue-50 text-blue-600'
                    }`}
                  >
                    {isEvent ? <CalendarDays size={9} /> : <Newspaper size={9} />}
                    {isEvent ? 'Event' : 'Berita'}
                  </span>
                  <span className="text-[10px] text-gray-400">{dateStr}</span>
                </div>

                {/* Judul */}
                <p className="text-xs font-semibold text-gray-700 group-hover:text-indigo-700 transition-colors line-clamp-2 leading-snug">
                  {item.title || '—'}
                </p>
              </button>
            )
          })
        )}
      </div>
    </div>
  )
}

// ─── Main RightPanel ───────────────────────────────────────────────────────────
const RightPanel = () => {
  return (
    <aside className="hidden xl:flex flex-col gap-4 w-72 flex-shrink-0">
      {/* Sticky wrapper — panel tidak ikut scroll */}
      <div className="sticky top-20 flex flex-col gap-4">
        <NewUsersSection />
        <LatestNewsSection />

        {/* Footer kecil */}
        <p className="text-[10px] text-gray-300 text-center px-2 leading-relaxed">
          DPW IKA UII JATENG &copy; {new Date().getFullYear()}
        </p>
      </div>
    </aside>
  )
}

export default RightPanel
