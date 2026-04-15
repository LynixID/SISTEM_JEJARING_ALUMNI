import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import Header from '../components/layout/Header'
import Sidebar from '../components/layout/Sidebar'
import CreatePost from '../components/post/CreatePost'
import PostFeed from '../components/post/PostFeed'
import RightPanel from '../components/dashboard/RightPanel'
import Button from '../components/common/Button'
import { initSocket, getSocket } from '../config/socket'
import { Plus } from 'lucide-react'

const Dashboard = () => {
  const { user, isAuthenticated, isLoading } = useAuth()
  const navigate = useNavigate()
  const [refreshKey, setRefreshKey] = useState(0)
  const [showCreatePost, setShowCreatePost] = useState(false)

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      navigate('/login', { replace: true })
    }
  }, [isAuthenticated, isLoading, navigate])

  useEffect(() => {
    if (!isAuthenticated) return
    const socket = initSocket()
    socket.on('new_post', () => { setRefreshKey(prev => prev + 1) })
    socket.on('post_liked', () => {})
    socket.on('new_comment', () => {})
    return () => {
      socket.off('new_post')
      socket.off('post_liked')
      socket.off('new_comment')
    }
  }, [isAuthenticated])

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-gray-500">Loading...</div>
      </div>
    )
  }

  if (!isAuthenticated || !user) return null

  if (user.role === 'ADMIN') {
    navigate('/admin', { replace: true })
    return null
  }

  const isPengurus = user.role === 'PENGURUS'
  const handlePostCreated = () => { setRefreshKey(prev => prev + 1) }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />

      {/* Wrapper utama: Sidebar + konten */}
      <div className="flex">
        <Sidebar />

        {/* Area konten kanan sidebar — full width sisa */}
        <div className="flex-1 min-w-0">
          {/* Inner: feed + right panel */}
          <div className="flex gap-6 px-4 sm:px-6 py-8 max-w-screen-2xl mx-auto">

            {/* ── Kolom tengah: feed utama ── */}
            <main className="flex-1 min-w-0">
              {/* Welcome card */}
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 sm:p-8 mb-6">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  <div>
                    <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
                      Selamat Datang, {user.nama}!
                    </h1>
                    <p className="text-gray-500 mt-1 text-sm sm:text-base">
                      {isPengurus
                        ? 'Dashboard Pengurus DPW IKA UII JATENG'
                        : 'Dashboard Alumni DPW IKA UII JATENG'}
                    </p>
                  </div>
                  <Button
                    onClick={() => setShowCreatePost(true)}
                    className="flex items-center gap-2 px-5 py-2.5 rounded-xl shadow-sm hover:shadow transition-all whitespace-nowrap"
                  >
                    <Plus size={18} />
                    Buat Postingan
                  </Button>
                </div>
              </div>

              {/* Feed postingan */}
              <PostFeed key={refreshKey} />
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
    </div>
  )
}

export default Dashboard
