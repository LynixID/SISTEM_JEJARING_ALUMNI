import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import Header from '../components/layout/Header'
import Sidebar from '../components/layout/Sidebar'
import CreatePost from '../components/post/CreatePost'
import PostFeed from '../components/post/PostFeed'
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

  // Setup Socket.io untuk real-time updates
  useEffect(() => {
    if (!isAuthenticated) return

    const socket = initSocket()

    // Listen untuk new post
    socket.on('new_post', (post) => {
      setRefreshKey(prev => prev + 1)
    })

    // Listen untuk post liked
    socket.on('post_liked', (data) => {
      // Update akan dihandle di PostCard component
    })

    // Listen untuk new comment
    socket.on('new_comment', (comment) => {
      // Update akan dihandle di CommentSection component
    })

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

  if (!isAuthenticated || !user) {
    return null
  }

  // Redirect admin ke admin panel
  if (user.role === 'ADMIN') {
    navigate('/admin', { replace: true })
    return null
  }

  const isPengurus = user.role === 'PENGURUS'

  const handlePostCreated = () => {
    setRefreshKey(prev => prev + 1)
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      
      <div className="flex">
        <Sidebar />
        
        <main className="flex-1">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            {/* Welcome Section */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 sm:p-8 mb-6">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                  <h1 className="text-3xl sm:text-4xl font-bold text-gray-900">
                    Selamat Datang, {user.nama}!
                  </h1>
                  <p className="text-gray-600 mt-2 text-base sm:text-lg">
                    {isPengurus ? 'Dashboard Pengurus DPW IKA UII JATENG' : 'Dashboard Alumni DPW IKA UII JATENG'}
                  </p>
                </div>
                <Button
                  onClick={() => setShowCreatePost(true)}
                  className="flex items-center gap-2 px-5 py-2.5 rounded-xl shadow-sm hover:shadow transition-all"
                >
                  <Plus size={20} />
                  Buat Postingan
                </Button>
              </div>
            </div>

            {/* Post Feed */}
            <PostFeed key={refreshKey} />

            {/* Create Post Modal */}
            <CreatePost
              isOpen={showCreatePost}
              onClose={() => setShowCreatePost(false)}
              onPostCreated={handlePostCreated}
            />
          </div>
        </main>
      </div>
    </div>
  )
}

export default Dashboard

