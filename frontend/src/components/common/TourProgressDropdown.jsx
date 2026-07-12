import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { 
  Compass, 
  Home, 
  User, 
  Edit2, 
  Newspaper, 
  MessageSquare, 
  Users, 
  Search, 
  MessagesSquare, 
  Briefcase,
  Check,
  Loader 
} from 'lucide-react'
import { getTourStatus, completeTourApi } from '../../services/api'
import { useAuth } from '../../context/AuthContext'

const tourItems = [
  { key: 'dashboard', title: 'Beranda', path: '/dashboard', desc: 'Navigasi beranda & feed utama', event: 'startOnboardingTour', icon: Home },
  { key: 'profil', title: 'Profil Saya', path: '/profil', desc: 'Portofolio karir & keahlian', event: 'startProfileTour', icon: User },
  { key: 'edit-profil', title: 'Edit Profil', path: '/profil/edit', desc: 'Melengkapi biodata & data diri', event: 'startEditProfilTour', icon: Edit2 },
  { key: 'berita', title: 'Berita & Event', path: '/berita', desc: 'Siaran berita resmi & event', event: 'startBeritaTour', icon: Newspaper },
  { key: 'pesan', title: 'Pesan Chat', path: '/pesan', desc: 'Komunikasi pribadi antar alumni', event: 'startPesanTour', icon: MessageSquare },
  { key: 'koneksi', title: 'Koneksi Alumni', path: '/koneksi', desc: 'Jejaring relasi & permintaan masuk', event: 'startKoneksiTour', icon: Users },
  { key: 'direktori', title: 'Direktori Alumni', path: '/direktori', desc: 'Pencarian database alumni UII', event: 'startDirektoriTour', icon: Search },
  { key: 'diskusi', title: 'Forum Diskusi', path: '/diskusi', desc: 'Diskusi publik & kelompok alumni', event: 'startDiskusiTour', icon: MessagesSquare },
  { key: 'lowongan', title: 'Bursa Lowongan', path: '/lowongan', desc: 'Portal bursa kerja & karir', event: 'startLowonganTour', icon: Briefcase }
]

const TourProgressDropdown = () => {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [completedStatus, setCompletedStatus] = useState({})
  const [showDropdown, setShowDropdown] = useState(false)
  const [loading, setLoading] = useState(true)
  const [showCongratsModal, setShowCongratsModal] = useState(false)
  const dropdownRef = useRef(null)
  const prevCompletedCountRef = useRef(null)

  const getUserId = () => {
    try {
      const u = JSON.parse(localStorage.getItem('user') || '{}')
      return u?.id || 'guest'
    } catch {
      return 'guest'
    }
  }

  const getCacheKey = (key) => `tour_completed_${getUserId()}_${key}`

  const syncCacheToDatabase = async (dbCompletedStatus) => {
    const updatedStatus = { ...dbCompletedStatus }
    const keysToSyncToDb = []

    tourItems.forEach(item => {
      const cacheKey = getCacheKey(item.key)
      const isCachedComplete = localStorage.getItem(cacheKey) === 'true'
      const isDbComplete = dbCompletedStatus[item.key] === true

      if (isCachedComplete && !isDbComplete) {
        keysToSyncToDb.push(item.key)
      } else if (isDbComplete && !isCachedComplete) {
        localStorage.setItem(cacheKey, 'true')
      }
    })

    if (keysToSyncToDb.length > 0) {
      for (const key of keysToSyncToDb) {
        try {
          await completeTourApi(key)
          updatedStatus[key] = true
        } catch (err) {
          console.warn(`[TourProgress] Gagal sync key ${key} ke server:`, err?.message)
        }
      }
    }

    return updatedStatus
  }

  const fetchStatus = async () => {
    if (!user || user.role === 'ADMIN') return
    try {
      const keys = tourItems.map(item => item.key)
      const response = await getTourStatus(keys)
      let status = response.data?.completed || {}

      status = await syncCacheToDatabase(status)
      setCompletedStatus(status)
    } catch (err) {
      console.warn('[TourProgress] Gagal mengambil status tur dari server, menggunakan cache lokal:', err?.message)
      const fallbackStatus = {}
      tourItems.forEach(item => {
        const cacheKey = getCacheKey(item.key)
        fallbackStatus[item.key] = localStorage.getItem(cacheKey) === 'true'
      })
      setCompletedStatus(fallbackStatus)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchStatus()
  }, [user])

  useEffect(() => {
    const handleTourStatusUpdated = (e) => {
      const { tourKey, completed } = e.detail
      setCompletedStatus(prev => {
        const nextStatus = { ...prev, [tourKey]: completed }
        const cacheKey = getCacheKey(tourKey)
        if (completed) {
          localStorage.setItem(cacheKey, 'true')
        }
        return nextStatus
      })
    }

    window.addEventListener('tourStatusUpdated', handleTourStatusUpdated)
    return () => {
      window.removeEventListener('tourStatusUpdated', handleTourStatusUpdated)
    }
  }, [])

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowDropdown(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  if (!user || user.role === 'ADMIN') return null

  const getPathForTour = (item, userId) => {
    if (item.key === 'profil') return `/profil/${userId}`
    if (item.key === 'edit-profil') return `/profil/${userId}/edit`
    return item.path
  }

  const completedCount = tourItems.filter(item => completedStatus[item.key] === true).length
  const totalCount = tourItems.length
  const uncompletedCount = totalCount - completedCount
  const progressPercentage = Math.round((completedCount / totalCount) * 100)

  useEffect(() => {
    if (loading) return
    if (prevCompletedCountRef.current !== null && 
        prevCompletedCountRef.current < totalCount && 
        completedCount === totalCount) {
      setShowCongratsModal(true)
    }
    prevCompletedCountRef.current = completedCount
  }, [completedCount, loading, totalCount])

  if (!loading && uncompletedCount === 0 && !showCongratsModal) {
    return null
  }

  const handleItemClick = (item) => {
    setShowDropdown(false)
    const targetPath = getPathForTour(item, user?.id)
    const isCurrentPage = window.location.pathname === targetPath

    if (isCurrentPage) {
      window.dispatchEvent(new Event(item.event))
    } else {
      localStorage.setItem('trigger_tour_on_mount', item.key)
      navigate(targetPath)
    }
  }

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setShowDropdown(prev => !prev)}
        className={`relative p-2 rounded-full hover:bg-gray-100 transition-colors flex items-center justify-center group ${
          showDropdown ? 'bg-gray-100' : ''
        }`}
        title="Progres Panduan Fitur"
        type="button"
      >
        <Compass size={20} className="text-gray-700 transition-transform duration-300" />
        {uncompletedCount > 0 && !loading && (
          <span className="absolute -top-1 -right-1 bg-blue-600 text-white text-[10px] font-bold rounded-full w-5 h-5 flex items-center justify-center border-2 border-white shadow-sm leading-none">
            {uncompletedCount}
          </span>
        )}
      </button>

      {showDropdown && (
        <>
          <div
            className="fixed inset-0 bg-black/5 z-40 md:hidden animate-fadeIn"
            onClick={() => setShowDropdown(false)}
          />
          <div className="fixed md:absolute inset-x-4 md:inset-x-auto md:right-0 md:left-auto top-16 md:top-full mt-2 w-full max-w-sm md:w-80 bg-white rounded-xl shadow-xl border border-gray-200 z-50 overflow-hidden flex flex-col animate-in fade-in-50 zoom-in-95 duration-200">
            <div className="p-4 border-b border-gray-100 bg-white">
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-semibold text-gray-800 text-sm">Progres Panduan</h3>
                <span className="text-xs font-semibold text-gray-500">
                  {completedCount}/{totalCount} Selesai
                </span>
              </div>
              
              <div className="flex items-center gap-3">
                <div className="flex-1 bg-gray-100 h-1.5 rounded-full overflow-hidden">
                  <div
                    className="bg-blue-600 h-full rounded-full transition-all duration-700 ease-out"
                    style={{ width: `${progressPercentage}%` }}
                  />
                </div>
                <span className="text-xs font-semibold text-gray-500 w-8 text-right">
                  {progressPercentage}%
                </span>
              </div>
            </div>

            <div className="overflow-y-auto max-h-[320px] divide-y divide-gray-100">
              {loading ? (
                <div className="p-8 flex flex-col items-center justify-center text-gray-400 gap-2">
                  <Loader className="animate-spin text-blue-600" size={20} />
                  <span className="text-xs">Memuat progres...</span>
                </div>
              ) : (
                tourItems.map(item => {
                  const IconComponent = item.icon
                  const isCompleted = completedStatus[item.key] === true

                  return (
                    <button
                      key={item.key}
                      onClick={() => handleItemClick(item)}
                      className="w-full px-4 py-3 hover:bg-gray-50 flex items-center justify-between text-left transition-colors group/item"
                      type="button"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 text-sm transition-colors duration-150 ${
                          isCompleted
                            ? 'bg-emerald-50 text-emerald-600'
                            : 'bg-gray-50 text-gray-400 group-hover/item:bg-blue-50 group-hover/item:text-blue-600'
                        }`}>
                          {isCompleted ? (
                            <Check size={16} className="stroke-[2.5px]" />
                          ) : (
                            <IconComponent size={15} />
                          )}
                        </div>
                        <div className="min-w-0">
                          <h4 className="text-sm font-medium text-gray-800 group-hover/item:text-blue-600 transition-colors">
                            {item.title}
                          </h4>
                          <p className="text-xs text-gray-400 mt-0.5 truncate max-w-[170px] sm:max-w-[210px]">
                            {item.desc}
                          </p>
                        </div>
                      </div>
                      <div className="shrink-0 ml-2">
                        {isCompleted ? (
                          <span className="text-[10px] font-medium text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded">
                            Selesai
                          </span>
                        ) : (
                          <span className="text-xs font-semibold text-blue-600 group-hover/item:text-blue-700">
                            Mulai
                          </span>
                        )}
                      </div>
                    </button>
                  )
                })
              )}
            </div>
          </div>
        </>
      )}

      {showCongratsModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[99999] flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-white rounded-2xl p-6 sm:p-8 max-w-md w-full shadow-[0_20px_50px_rgba(15,23,42,0.15)] border border-slate-100 flex flex-col items-center text-center gap-5 animate-in fade-in-50 zoom-in-95 duration-200">
            <div className="w-16 h-16 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center animate-bounce">
              <Compass size={32} className="stroke-[2px]" />
            </div>
            
            <div className="space-y-2">
              <h3 className="text-xl font-bold text-slate-800">Selamat! Panduan Selesai 🎉</h3>
              <p className="text-sm text-slate-600 leading-relaxed font-normal">
                Luar biasa! Anda telah menjelajahi seluruh fitur utama di UII Connect. Sekarang Anda siap berjejaring secara maksimal dengan sesama rekan alumni.
              </p>
            </div>
            
            <button
              onClick={() => setShowCongratsModal(false)}
              className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-semibold transition shadow-sm hover:shadow"
              type="button"
            >
              Mulai Berjejaring 🚀
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

export default TourProgressDropdown
