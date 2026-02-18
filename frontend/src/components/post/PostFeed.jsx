import { useState, useEffect, useRef, useCallback } from 'react'
import { getPosts } from '../../services/api'
import PostCard from './PostCard'
import { Loader } from 'lucide-react'

const PostFeed = ({ userId, onPostDeleted, refreshKey = 0 }) => {
  // State management untuk posts dan pagination
  const [posts, setPosts] = useState([])
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [hasMore, setHasMore] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  
  // Refs untuk infinite scroll dan prevent duplicate requests
  const sentinelRef = useRef(null)
  const isLoadingRef = useRef(false)

  // Load initial posts saat component mount atau userId/refreshKey berubah
  useEffect(() => {
    loadPosts(1, true)
  }, [userId, refreshKey])

  // Load posts dengan pagination dan duplicate prevention
  const loadPosts = useCallback(async (pageNum = 1, reset = false) => {
    // Reset state untuk initial load
    if (reset) {
      setLoading(true)
      setPosts([])
      setPage(1)
      setHasMore(true)
      setLoadingMore(false)
      isLoadingRef.current = false
    } else {
      // Prevent multiple simultaneous requests saat infinite scroll
      if (isLoadingRef.current) return
      isLoadingRef.current = true
      setLoadingMore(true)
    }

    try {
      // Prepare API params
      const params = { page: pageNum, limit: 10 }
      if (userId) params.userId = userId

      // Fetch posts dari API
      const response = await getPosts(params)
      const newPosts = response.data.posts

      // Update posts state dengan duplicate prevention
      if (reset) {
        setPosts(newPosts)
      } else {
        setPosts(prev => {
          const existingIds = new Set(prev.map(p => p.id))
          const uniqueNewPosts = newPosts.filter(p => !existingIds.has(p.id))
          return [...prev, ...uniqueNewPosts]
        })
      }

      // Update pagination state
      setHasMore(response.data.pagination.page < response.data.pagination.totalPages)
      setPage(pageNum)
    } catch (err) {
      console.error('Error loading posts:', err)
    } finally {
      // Reset loading states
      setLoading(false)
      setLoadingMore(false)
      isLoadingRef.current = false
    }
  }, [userId])

  // Infinite scroll menggunakan Intersection Observer API
  useEffect(() => {
    if (!hasMore || loading) return

    // Setup Intersection Observer untuk detect scroll position
    const observer = new IntersectionObserver(
      (entries) => {
        // Load next page saat sentinel element terlihat
        if (entries[0].isIntersecting && !isLoadingRef.current && hasMore && !loadingMore && !loading) {
          setPage(prevPage => {
            loadPosts(prevPage + 1, false)
            return prevPage
          })
        }
      },
      { rootMargin: '200px' } // Trigger 200px sebelum mencapai bottom
    )

    // Observe sentinel element
    const currentSentinel = sentinelRef.current
    if (currentSentinel) observer.observe(currentSentinel)

    // Cleanup observer saat unmount
    return () => {
      if (currentSentinel) observer.unobserve(currentSentinel)
    }
  }, [hasMore, loading, loadingMore, loadPosts])

  // Handler untuk menghapus post dari list setelah delete
  const handlePostDeleted = (postId) => {
    setPosts(prev => prev.filter(p => p.id !== postId))
    if (onPostDeleted) onPostDeleted(postId)
  }

  // Handler untuk reload posts setelah update
  const handlePostUpdated = () => {
    loadPosts(1, true)
  }

  // Loading state untuk initial load
  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader className="animate-spin text-blue-600" size={32} />
      </div>
    )
  }

  // Empty state jika tidak ada posts
  if (posts.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">Belum ada postingan</p>
      </div>
    )
  }

  return (
    <div>
      {/* Render list posts */}
      {posts.map(post => (
        <PostCard
          key={post.id}
          post={post}
          onPostDeleted={handlePostDeleted}
          onPostUpdated={handlePostUpdated}
        />
      ))}

      {/* Sentinel element untuk infinite scroll detection */}
      <div ref={sentinelRef} className="h-20 flex items-center justify-center">
        {loadingMore && (
          <div className="flex items-center gap-2 text-gray-500">
            <Loader className="animate-spin" size={20} />
            <span>Memuat postingan...</span>
          </div>
        )}
        {!hasMore && posts.length > 0 && (
          <p className="text-gray-500 text-sm">Semua postingan sudah dimuat</p>
        )}
      </div>
    </div>
  )
}

export default PostFeed

