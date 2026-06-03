import { useEffect, useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import Header from '../components/layout/Header'
import Sidebar from '../components/layout/Sidebar'
import CreatePost from '../components/post/CreatePost'
import OnboardingTour from '../components/common/OnboardingTour'
import PostFeed from '../components/post/PostFeed'
import RightPanel from '../components/dashboard/RightPanel'
import Button from '../components/common/Button'
import { initSocket, getSocket } from '../config/socket'
import { Plus, Image as ImageIcon, Calendar, FileText, BarChart2, Smile, BriefcaseBusiness, ArrowUp } from 'lucide-react'
import { getImageUrl } from '../utils/imageUtils'
import useTourStatus from '../hooks/useTourStatus'

const Dashboard = () => {
  const { user, isAuthenticated, isLoading } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const searchParams = new URLSearchParams(location.search)
  const searchQuery = searchParams.get('search') || ''
  const [refreshKey, setRefreshKey] = useState(0)
  const [showCreatePost, setShowCreatePost] = useState(false)
  const [hasNewPosts, setHasNewPosts] = useState(false)
  const [showTour, setShowTour] = useState(false)
  const { shouldShowTour, markTourComplete } = useTourStatus('dashboard')

  useEffect(() => {
    if (!isLoading) {
      if (!isAuthenticated) {
        navigate('/login', { replace: true })
      } else if (user?.role === 'ADMIN') {
        navigate('/admin', { replace: true })
      }
    }
  }, [isAuthenticated, isLoading, user, navigate])

  useEffect(() => {
    if (!isAuthenticated || !user) return
    const socket = initSocket()
    socket.on('new_post', (data) => { 
      if (data && data.authorId === user.id) {
        setRefreshKey(prev => prev + 1)
      } else {
        setHasNewPosts(true)
      }
    })
    socket.on('post_liked', () => {})
    socket.on('new_comment', () => {})
    return () => {
      socket.off('new_post')
      socket.off('post_liked')
      socket.off('new_comment')
    }
  }, [isAuthenticated, user])

  useEffect(() => {
    const handleStartTour = () => {
      setShowTour(true)
    }
    window.addEventListener('startOnboardingTour', handleStartTour)

    // Check if redirect-triggered from other page
    if (localStorage.getItem('trigger_tour_on_mount') === 'true') {
      localStorage.removeItem('trigger_tour_on_mount')
      setShowTour(true)
    }

    return () => {
      window.removeEventListener('startOnboardingTour', handleStartTour)
    }
  }, [])

  // Auto-trigger tur untuk user yang belum pernah melihat (via DB)
  useEffect(() => {
    if (!shouldShowTour) return
    const timer = setTimeout(() => {
      setShowTour(true)
    }, 1500)
    return () => clearTimeout(timer)
  }, [shouldShowTour])

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-gray-500">Loading...</div>
      </div>
    )
  }

  if (!isAuthenticated || !user) return null

  if (user.role === 'ADMIN') return null

  const isPengurus = user.role === 'PENGURUS'
  const handlePostCreated = () => { setRefreshKey(prev => prev + 1) }

  const handleRefreshFeed = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' })
    setRefreshKey(prev => prev + 1)
    setHasNewPosts(false)
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />

      {hasNewPosts && (
        <div className="fixed top-20 left-1/2 transform -translate-x-1/2 z-50 animate-bounce duration-1000">
          <button
            onClick={handleRefreshFeed}
            className="flex items-center gap-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white px-5 py-2.5 rounded-full shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-0.5 text-sm font-semibold tracking-wide border border-blue-400"
          >
            <ArrowUp size={16} className="animate-pulse" />
            Ada Postingan Baru! Klik untuk melihat
          </button>
        </div>
      )}

      {/* Wrapper utama: Sidebar + konten */}
      <div className="flex">
        <Sidebar />

        {/* Area konten kanan sidebar — full width sisa */}
        <div className="flex-1 min-w-0">
          {/* Inner: feed + right panel */}
          <div className="flex flex-col xl:flex-row gap-6 px-4 sm:px-6 py-8 max-w-screen-2xl mx-auto">

            {/* ── Kolom tengah: feed utama ── */}
            <main className="flex-1 min-w-0">
              {/* Welcome & Create Post Card */}
              <div id="tour-create-post" className="bg-white rounded-2xl shadow-sm border border-gray-100 p-3 sm:p-6 mb-4 sm:mb-6 relative overflow-hidden">
                {/* Decorative Background */}
                <div className="absolute right-0 top-0 bottom-0 w-1/2 sm:w-1/3 pointer-events-none rounded-r-2xl overflow-hidden hidden sm:block">
                  <div className="absolute -right-10 -top-24 w-64 h-64 bg-blue-100 rounded-full mix-blend-multiply filter blur-2xl opacity-70"></div>
                  <div className="absolute right-10 -bottom-20 w-48 h-48 bg-indigo-100 rounded-full mix-blend-multiply filter blur-xl opacity-60"></div>
                  {/* Subtle Wave SVG */}
                  <svg className="absolute right-0 top-0 h-full w-full object-cover opacity-30" viewBox="0 0 200 100" preserveAspectRatio="none" xmlns="http://www.w3.org/2000/svg">
                    <path fill="#4f46e5" d="M0,100 C50,50 150,50 200,0 L200,100 Z" opacity="0.2"/>
                    <path fill="#3b82f6" d="M50,100 C100,60 180,60 200,20 L200,100 Z" opacity="0.2"/>
                  </svg>
                </div>

                <div className="relative z-10 mb-6 hidden sm:block">
                  <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 flex items-center gap-2">
                    Selamat Datang, {user.nama}! <span className="text-2xl">👋</span>
                  </h1>
                  <p className="text-gray-500 mt-1 text-sm sm:text-base">
                    {isPengurus
                      ? 'Dashboard Pengurus DPW IKA UII JATENG'
                      : 'Dashboard Alumni DPW IKA UII JATENG'}
                  </p>
                </div>

                <div className="relative z-10 flex gap-3 items-center mb-4">
                  {user?.profile?.fotoProfil ? (
                    <img
                      src={getImageUrl(user.profile.fotoProfil, 'profiles')}
                      alt={user?.nama || 'User'}
                      className="w-10 h-10 sm:w-12 sm:h-12 rounded-full object-cover border border-gray-200 flex-shrink-0"
                    />
                  ) : (
                    <div className="w-10 h-10 sm:w-12 sm:h-12 bg-blue-600 rounded-full flex items-center justify-center text-white font-semibold flex-shrink-0">
                      {user?.nama?.charAt(0) || 'U'}
                    </div>
                  )}
                  <button 
                    onClick={() => setShowCreatePost(true)}
                    className="flex-1 bg-white hover:bg-gray-50 border border-gray-300 text-gray-500 text-left px-4 sm:px-5 py-2.5 sm:py-3 rounded-full transition-colors text-xs sm:text-base font-medium shadow-sm truncate"
                  >
                    Apa yang ingin Anda bagikan hari ini?
                  </button>
                </div>
                <div className="relative z-10 flex items-center justify-between gap-2 px-1">
                  <div className="flex items-center gap-1 sm:gap-2 overflow-x-auto flex-nowrap scrollbar-none flex-1 -mx-2 px-2 sm:mx-0 sm:px-0">
                    <button onClick={() => setShowCreatePost(true)} className="flex items-center gap-2 px-3 py-2 hover:bg-gray-50 rounded-lg text-gray-600 transition-colors text-sm font-semibold shrink-0">
                      <ImageIcon className="text-blue-500" size={20} />
                      Foto
                    </button>
                    
                    {isPengurus && (
                      <>
                        <button onClick={() => navigate('/pengurus/events/create')} className="flex items-center gap-2 px-3 py-2 hover:bg-gray-50 rounded-lg text-gray-600 transition-colors text-sm font-semibold shrink-0">
                          <Calendar className="text-orange-500" size={20} />
                          Event
                        </button>
                        <button onClick={() => navigate('/pengurus/berita/create')} className="flex items-center gap-2 px-3 py-2 hover:bg-gray-50 rounded-lg text-gray-600 transition-colors text-sm font-semibold shrink-0">
                          <FileText className="text-red-500" size={20} />
                          Pengumuman
                        </button>
                      </>
                    )}

                    <button onClick={() => navigate('/lowongan')} className="flex items-center gap-2 px-3 py-2 hover:bg-gray-50 rounded-lg text-gray-600 transition-colors text-sm font-semibold shrink-0">
                      <BriefcaseBusiness className="text-green-600" size={20} />
                      Lowongan
                    </button>
                  </div>
                  <button onClick={() => setShowCreatePost(true)} className="p-2 hover:bg-gray-50 rounded-full text-gray-500 hover:text-gray-700 transition-colors hidden sm:block shrink-0">
                    <Smile size={24} />
                  </button>
                </div>
              </div>

              {/* Feed postingan */}
              <PostFeed key={`${refreshKey}-${searchQuery}`} searchQuery={searchQuery} />
            </main>

            {/* ── Kolom kanan: panel info (hidden di bawah xl) ── */}
            <RightPanel />
          </div>
        </div>
      </div>

      <CreatePost
        isOpen={showCreatePost}
        onClose={() => setShowCreatePost(false)}
        onPostCreated={handlePostCreated}
      />

      <OnboardingTour
        isOpen={showTour}
        onClose={() => {
          setShowTour(false)
          markTourComplete()
        }}
      />

    </div>
  )
}

export default Dashboard
