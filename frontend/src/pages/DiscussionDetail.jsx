import { useEffect, useMemo, useRef, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import Header from '../components/layout/Header'
import Sidebar from '../components/layout/Sidebar'
import Card from '../components/common/Card'
import Button from '../components/common/Button'
import { useAuth } from '../context/AuthContext'
import {
  getDiscussionById,
  getDiscussionMessages,
  joinDiscussion,
  leaveDiscussion,
  sendDiscussionMessage,
  updateDiscussionMessage,
  deleteDiscussionMessage,
  lockDiscussion,
  unlockDiscussion
} from '../services/api'
import { getSocket } from '../config/socket'
import { ArrowLeft, Lock, Unlock, Image as ImageIcon, Reply, X, Pencil, Trash2, Check } from 'lucide-react'
import { getImageUrl } from '../utils/imageUtils'

const DiscussionDetail = () => {
  const { id } = useParams()
  const { user, isAuthenticated, isLoading } = useAuth()
  const navigate = useNavigate()

  const [thread, setThread] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const [messages, setMessages] = useState([])
  const [messagesLoading, setMessagesLoading] = useState(true)
  const [composer, setComposer] = useState('')
  const [sending, setSending] = useState(false)
  const [selectedImage, setSelectedImage] = useState(null)
  const [imagePreview, setImagePreview] = useState(null)
  const [replyingTo, setReplyingTo] = useState(null)
  const [editingId, setEditingId] = useState(null)
  const [editingContent, setEditingContent] = useState('')

  const bottomRef = useRef(null)
  const fileInputRef = useRef(null)

  const membershipRole = thread?.membership?.role || null
  const isMember = !!membershipRole
  const canModerate = membershipRole === 'OWNER' || membershipRole === 'MOD'

  useEffect(() => {
    if (!isLoading && !isAuthenticated) navigate('/login', { replace: true })
  }, [isAuthenticated, isLoading, navigate])

  useEffect(() => {
    if (!user) return
    if (user.role === 'ADMIN') navigate('/admin', { replace: true })
  }, [user, navigate])

  const scrollToBottom = () => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  const fetchThread = async () => {
    try {
      setLoading(true)
      setError('')
      const res = await getDiscussionById(id)
      setThread(res.data.thread)
    } catch (e) {
      console.error(e)
      setError(e.response?.data?.error || 'Gagal memuat diskusi')
    } finally {
      setLoading(false)
    }
  }

  const fetchMessages = async () => {
    try {
      setMessagesLoading(true)
      const res = await getDiscussionMessages(id, { page: 1, limit: 100 })
      setMessages(res.data.messages || [])
      setTimeout(scrollToBottom, 50)
    } catch (e) {
      console.error(e)
    } finally {
      setMessagesLoading(false)
    }
  }

  useEffect(() => {
    if (!isAuthenticated) return
    fetchThread()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated, id])

  useEffect(() => {
    if (!thread) return
    fetchMessages()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [thread?.id])

  useEffect(() => {
    const socket = getSocket()

    const handleNewMessage = (payload) => {
      if (payload?.threadId !== id) return
      setMessages((prev) => {
        const exists = prev.some(m => m.id === payload.id)
        if (exists) return prev
        return [...prev, payload]
      })
      setTimeout(scrollToBottom, 30)
    }

    const handleLocked = ({ threadId, status }) => {
      if (threadId !== id) return
      setThread((prev) => prev ? { ...prev, status } : prev)
    }

    socket.on('discussion_message_new', handleNewMessage)
    socket.on('discussion_message_updated', handleNewMessage)
    socket.on('discussion_locked', handleLocked)
    socket.on('discussion_unlocked', handleLocked)
    socket.on('discussion_message_deleted', ({ threadId, messageId }) => {
      if (threadId !== id) return
      setMessages(prev => prev.filter(m => m.id !== messageId))
    })

    return () => {
      socket.off('discussion_message_new', handleNewMessage)
      socket.off('discussion_message_updated', handleNewMessage)
      socket.off('discussion_locked', handleLocked)
      socket.off('discussion_unlocked', handleLocked)
      socket.off('discussion_message_deleted')
    }
  }, [id])

  useEffect(() => {
    const socket = getSocket()
    if (isMember) {
      socket.emit('join-discussion-room', id)
      return () => socket.emit('leave-discussion-room', id)
    }
    return undefined
  }, [id, isMember])

  const join = async () => {
    try {
      await joinDiscussion(id)
      await fetchThread()
    } catch (e) {
      alert(e.response?.data?.error || 'Gagal join diskusi')
    }
  }

  const leave = async () => {
    try {
      await leaveDiscussion(id)
      await fetchThread()
    } catch (e) {
      alert(e.response?.data?.error || 'Gagal keluar diskusi')
    }
  }

  const toggleLock = async () => {
    try {
      if (thread?.status === 'LOCKED') await unlockDiscussion(id)
      else await lockDiscussion(id)
      await fetchThread()
    } catch (e) {
      alert(e.response?.data?.error || 'Gagal mengubah status diskusi')
    }
  }

  const canSend = useMemo(() => {
    if (!isMember) return false
    if (thread?.status === 'LOCKED') return false
    return composer.trim().length > 0 || !!selectedImage
  }, [composer, isMember, thread?.status, selectedImage])

  const send = async (e) => {
    e.preventDefault()
    if (!canSend) return
    setSending(true)
    try {
      const text = composer.trim()
      const media = selectedImage
      const parentId = replyingTo?.id || null

      // Optimistic clear for UX
      setComposer('')
      setSelectedImage(null)
      setImagePreview(null)
      setReplyingTo(null)
      if (fileInputRef.current) fileInputRef.current.value = ''

      const res = await sendDiscussionMessage(id, { content: text, parentId }, media)

      const serverMessage = res?.data?.data?.message
      if (serverMessage?.id) {
        setMessages((prev) => {
          const exists = prev.some(m => m.id === serverMessage.id)
          if (exists) return prev
          return [...prev, serverMessage]
        })
        setTimeout(scrollToBottom, 30)
      }
    } catch (e2) {
      alert(e2.response?.data?.error || 'Gagal mengirim pesan')
    } finally {
      setSending(false)
    }
  }

  const startEdit = (m) => {
    setEditingId(m.id)
    setEditingContent(m.content || '')
  }

  const cancelEdit = () => {
    setEditingId(null)
    setEditingContent('')
  }

  const saveEdit = async (threadId, messageId) => {
    try {
      const text = (editingContent || '').trim()
      if (!text) return
      const res = await updateDiscussionMessage(threadId, messageId, text)
      const updated = res?.data?.data?.message
      if (updated?.id) {
        setMessages(prev => prev.map(m => m.id === updated.id ? updated : m))
      }
      cancelEdit()
    } catch (e) {
      alert(e.response?.data?.error || 'Gagal mengedit pesan')
    }
  }

  const removeMessage = async (threadId, messageId) => {
    try {
      await deleteDiscussionMessage(threadId, messageId)
      setMessages(prev => prev.filter(m => m.id !== messageId))
    } catch (e) {
      alert(e.response?.data?.error || 'Gagal menghapus pesan')
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-gray-500">Loading...</div>
      </div>
    )
  }
  if (!isAuthenticated || !user) return null

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <div className="flex">
        <Sidebar />
        <main className="flex-1">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="mb-4">
              <Link to="/diskusi" className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900">
                <ArrowLeft size={18} />
                Kembali
              </Link>
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl px-4 py-3 mb-4">
                {error}
              </div>
            )}

            {loading || !thread ? (
              <div className="text-gray-500">Memuat...</div>
            ) : (
              <>
                <Card className="p-6 mb-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0">
                      <h1 className="text-2xl font-bold text-gray-900">{thread.title}</h1>
                      {thread.image && (
                        <div className="mt-3">
                          <img
                            src={getImageUrl(thread.image, 'discussions')}
                            alt={thread.title}
                            className="w-full max-h-72 object-cover rounded-xl border border-gray-200"
                          />
                        </div>
                      )}
                      <div className="text-gray-700 mt-2 whitespace-pre-wrap">
                        {thread.content}
                      </div>
                      <div className="text-xs text-gray-500 mt-3 flex flex-wrap gap-2">
                        <span className="px-2 py-1 rounded-full bg-gray-100">
                          {thread.visibility === 'PRIVATE' ? 'Privat' : 'Publik'}
                        </span>
                        <span className="px-2 py-1 rounded-full bg-gray-100">
                          {thread.status === 'LOCKED' ? 'Dikunci' : 'Terbuka'}
                        </span>
                        <span className="px-2 py-1 rounded-full bg-gray-100">
                          {thread.counts?.members || 0} anggota
                        </span>
                        <span className="px-2 py-1 rounded-full bg-gray-100">
                          {thread.counts?.messages || 0} pesan
                        </span>
                        {membershipRole && (
                          <span className="px-2 py-1 rounded-full bg-blue-50 text-blue-700">
                            Bergabung ({membershipRole})
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="shrink-0 flex flex-col gap-2">
                      {!isMember ? (
                        <Button onClick={join}>Gabung</Button>
                      ) : (
                        <Button variant="outline" onClick={leave}>
                          Keluar
                        </Button>
                      )}
                      {canModerate && (
                        <Button variant="outline" onClick={toggleLock} className="flex items-center gap-2">
                          {thread.status === 'LOCKED' ? <Unlock size={16} /> : <Lock size={16} />}
                          {thread.status === 'LOCKED' ? 'Buka Kunci' : 'Kunci'}
                        </Button>
                      )}
                    </div>
                  </div>
                </Card>

                <Card className="p-6">
                  <div className="flex items-center justify-between mb-3">
                    <div className="font-semibold text-gray-900">Diskusi</div>
                    {!isMember && (
                      <div className="text-xs text-gray-500">
                        Untuk ikut chat/reply, kamu harus join dulu.
                      </div>
                    )}
                  </div>

                  <div className="h-[420px] overflow-y-auto border border-gray-200 rounded-lg p-4 bg-white">
                    {messagesLoading ? (
                      <div className="text-gray-500">Memuat pesan...</div>
                    ) : messages.length === 0 ? (
                      <div className="text-gray-500">Belum ada pesan.</div>
                    ) : (
                      <div className="space-y-3">
                        {messages.map((m) => (
                          <div
                            key={m.id}
                            className={`flex gap-3 ${m.sender?.id === user.id ? 'justify-end' : 'justify-start'}`}
                          >
                            <div className={`flex gap-3 ${m.sender?.id === user.id ? 'flex-row-reverse' : ''}`}>
                              {m.sender?.fotoProfil ? (
                                <img
                                  src={getImageUrl(m.sender.fotoProfil, 'profiles')}
                                  alt={m.sender?.nama || 'User'}
                                  className="w-9 h-9 rounded-full object-cover border border-gray-200 shrink-0"
                                  loading="lazy"
                                />
                              ) : (
                                <div className="w-9 h-9 rounded-full bg-gray-200 flex items-center justify-center text-xs font-semibold text-gray-700 shrink-0">
                                  {(m.sender?.nama || '?').slice(0, 2).toUpperCase()}
                                </div>
                              )}

                              <div className={`min-w-0 max-w-[85%] ${m.sender?.id === user.id ? 'text-right' : ''}`}>
                                <div className="text-sm font-semibold text-gray-900">
                                  {m.sender?.nama || 'User'}
                                  <span className="text-xs text-gray-500 font-normal ml-2">
                                    {m.createdAt ? new Date(m.createdAt).toLocaleString() : ''}
                                  </span>
                                </div>
                              {m.parent && (
                                <div className="mt-1 mb-1 px-3 py-2 bg-gray-50 rounded-lg border-l-2 border-blue-500">
                                  <div className="text-xs text-gray-600 font-medium">
                                    Membalas {m.parent.sender?.nama || 'User'}
                                  </div>
                                  <div className="text-sm text-gray-700 truncate">
                                    {m.parent.media ? 'Gambar' : (m.parent.content || '')}
                                  </div>
                                  {m.parent.media && (
                                    <div className="mt-2">
                                      <img
                                        src={getImageUrl(m.parent.media, 'discussion_messages')}
                                        alt="Parent media"
                                        className="max-h-56 rounded-xl border border-gray-200"
                                      />
                                    </div>
                                  )}
                                </div>
                              )}
                              {m.media && (
                                <div className="mt-2">
                                  <img
                                    src={getImageUrl(m.media, 'discussion_messages')}
                                    alt="Media"
                                    className="max-h-64 rounded-xl border border-gray-200"
                                  />
                                </div>
                              )}
                              {editingId === m.id ? (
                                <div className="mt-2 space-y-2">
                                  <textarea
                                    value={editingContent}
                                    onChange={(e) => setEditingContent(e.target.value)}
                                    className="w-full min-h-20 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                                  />
                                  <div className="flex gap-2">
                                    <Button
                                      size="sm"
                                      onClick={() => saveEdit(id, m.id)}
                                      disabled={!editingContent.trim()}
                                      className="flex items-center gap-2"
                                    >
                                      <Check size={16} />
                                      Simpan
                                    </Button>
                                    <Button
                                      size="sm"
                                      variant="secondary"
                                      onClick={cancelEdit}
                                      className="flex items-center gap-2"
                                    >
                                      <X size={16} />
                                      Batal
                                    </Button>
                                  </div>
                                </div>
                              ) : (
                                <div
                                  className={`text-sm whitespace-pre-wrap inline-block px-3 py-2 rounded-2xl border ${
                                    m.sender?.id === user.id
                                      ? 'bg-blue-600 text-white border-blue-600'
                                      : 'bg-gray-50 text-gray-800 border-gray-200'
                                  }`}
                                >
                                  {m.content}
                                </div>
                              )}
                              {isMember && thread.status !== 'LOCKED' && (
                                <div className="mt-1 flex flex-wrap items-center">
                                  <button
                                    type="button"
                                    onClick={() => setReplyingTo(m)}
                                    className="inline-flex items-center gap-1 text-xs text-gray-500 hover:text-gray-800"
                                    title="Balas"
                                  >
                                    <Reply size={14} />
                                    Balas
                                  </button>

                                  <div className="flex items-center gap-3 ml-5">
                                    {(m.sender?.id === user.id) && editingId !== m.id && (
                                      <button
                                        type="button"
                                        onClick={() => startEdit(m)}
                                        className="inline-flex items-center gap-1 text-xs text-gray-500 hover:text-gray-800"
                                        title="Edit"
                                      >
                                        <Pencil size={14} />
                                        Edit
                                      </button>
                                    )}

                                    {((m.sender?.id === user.id) || canModerate) && (
                                      <button
                                        type="button"
                                        onClick={() => {
                                          const ok = window.confirm('Hapus pesan ini?')
                                          if (ok) removeMessage(id, m.id)
                                        }}
                                        className="inline-flex items-center gap-1 text-xs text-red-600 hover:text-red-800"
                                        title="Hapus"
                                      >
                                        <Trash2 size={14} />
                                        Hapus
                                      </button>
                                    )}
                                  </div>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                        ))}
                        <div ref={bottomRef} />
                      </div>
                    )}
                  </div>

                  {replyingTo && (
                    <div className="mt-4 px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg flex items-center justify-between">
                      <div className="min-w-0">
                        <div className="text-xs text-gray-500 font-medium flex items-center gap-2">
                          <Reply size={14} />
                          Membalas {replyingTo.sender?.nama || 'User'}
                        </div>
                        <div className="text-sm text-gray-700 truncate">
                          {replyingTo.media ? 'Gambar' : (replyingTo.content || '')}
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => setReplyingTo(null)}
                        className="text-gray-500 hover:text-gray-700"
                        title="Batal reply"
                      >
                        <X size={18} />
                      </button>
                    </div>
                  )}

                  {imagePreview && (
                    <div className="mt-3 px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg relative">
                      <img
                        src={imagePreview}
                        alt="Preview"
                        className="max-h-56 rounded-xl border border-gray-200"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedImage(null)
                          setImagePreview(null)
                          if (fileInputRef.current) fileInputRef.current.value = ''
                        }}
                        className="absolute top-3 right-3 bg-white/90 border border-gray-200 rounded-full p-1 hover:bg-white"
                        title="Hapus gambar"
                      >
                        <X size={16} />
                      </button>
                    </div>
                  )}

                  <form onSubmit={send} className="mt-4 flex gap-2 items-end">
                    <input
                      type="file"
                      ref={fileInputRef}
                      accept="image/*"
                      onChange={(e) => {
                        const file = e.target.files?.[0] || null
                        if (!file) return
                        setSelectedImage(file)
                        const reader = new FileReader()
                        reader.onloadend = () => setImagePreview(reader.result)
                        reader.readAsDataURL(file)
                      }}
                      className="hidden"
                      disabled={!isMember || thread.status === 'LOCKED'}
                    />
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={!isMember || thread.status === 'LOCKED'}
                      className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
                      title="Kirim gambar"
                    >
                      <ImageIcon size={20} />
                    </button>
                    <input
                      value={composer}
                      onChange={(e) => setComposer(e.target.value)}
                        placeholder={isMember ? 'Tulis pesan...' : 'Gabung dulu untuk mengirim pesan'}
                      disabled={!isMember || thread.status === 'LOCKED'}
                      className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none disabled:bg-gray-100"
                    />
                    <Button type="submit" disabled={!canSend || sending}>
                      {sending ? 'Mengirim...' : 'Kirim'}
                    </Button>
                  </form>
                  {thread.status === 'LOCKED' && (
                    <div className="text-xs text-gray-500 mt-2">
                      Diskusi sedang dikunci. Tidak bisa mengirim pesan.
                    </div>
                  )}
                </Card>
              </>
            )}
          </div>
        </main>
      </div>
    </div>
  )
}

export default DiscussionDetail

