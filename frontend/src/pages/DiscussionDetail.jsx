import { useEffect, useMemo, useRef, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import Header from '../components/layout/Header'
import Sidebar from '../components/layout/Sidebar'
import Card from '../components/common/Card'
import Button from '../components/common/Button'
import Modal from '../components/common/Modal'
import ConfirmModal from '../components/common/ConfirmModal'
import Input from '../components/common/Input'
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
  unlockDiscussion,
  updateDiscussion,
  deleteDiscussion,
} from '../services/api'
import { getSocket } from '../config/socket'
import { ArrowLeft, Lock, Unlock, Image as ImageIcon, Reply, X, Pencil, Trash2, Check, MoreVertical } from 'lucide-react'
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
  const [showChatMobile, setShowChatMobile] = useState(false)
  const [alertOpen, setAlertOpen] = useState(false)
  const [alertTitle, setAlertTitle] = useState('')
  const [alertMessage, setAlertMessage] = useState('')
  const [showLockConfirm, setShowLockConfirm] = useState(false)
  const [activeImagePreview, setActiveImagePreview] = useState(null)
  const [animateImage, setAnimateImage] = useState(false)

  const [showActionsDropdown, setShowActionsDropdown] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [deletingDiscussion, setDeletingDiscussion] = useState(false)
  const [messageToDelete, setMessageToDelete] = useState(null)
  const [showDeleteMessageConfirm, setShowDeleteMessageConfirm] = useState(false)
  const [deletingMessage, setDeletingMessage] = useState(false)

  const [isEditOpen, setIsEditOpen] = useState(false)
  const [editTitle, setEditTitle] = useState('')
  const [editContent, setEditContent] = useState('')
  const [editVisibility, setEditVisibility] = useState('PUBLIC')
  const [editImage, setEditImage] = useState(null)
  const [editImagePreview, setEditImagePreview] = useState(null)
  const [removeCurrentImage, setRemoveCurrentImage] = useState(false)
  const [updating, setUpdating] = useState(false)
  const editFileInputRef = useRef(null)

  const showAlert = (title, message) => {
    setAlertTitle(title)
    setAlertMessage(message)
    setAlertOpen(true)
  }

  const handleOpenPreview = (url) => {
    setActiveImagePreview(url)
    setTimeout(() => {
      setAnimateImage(true)
    }, 50)
  }

  const handleClosePreview = () => {
    setAnimateImage(false)
    setTimeout(() => {
      setActiveImagePreview(null)
    }, 300)
  }

  const bottomRef = useRef(null)
  const fileInputRef = useRef(null)

  const membershipRole = thread?.membership?.role || null
  const isMember = !!membershipRole
  const canModerate = membershipRole === 'OWNER' || membershipRole === 'MOD'
  const isOwner = membershipRole === 'OWNER'

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
      showAlert('Gagal Bergabung', e.response?.data?.error || 'Gagal bergabung ke diskusi ini.')
    }
  }

  const leave = async () => {
    try {
      await leaveDiscussion(id)
      await fetchThread()
    } catch (e) {
      showAlert('Gagal Keluar', e.response?.data?.error || 'Gagal keluar dari diskusi ini.')
    }
  }

  const toggleLock = async () => {
    try {
      if (thread?.status === 'LOCKED') await unlockDiscussion(id)
      else await lockDiscussion(id)
      await fetchThread()
    } catch (e) {
      showAlert('Gagal Mengubah Status', e.response?.data?.error || 'Gagal mengubah status lock diskusi.')
    }
  }

  useEffect(() => {
    if (isEditOpen && thread) {
      setEditTitle(thread.title || '')
      setEditContent(thread.content || '')
      setEditVisibility(thread.visibility || 'PUBLIC')
      setEditImage(null)
      setEditImagePreview(null)
      setRemoveCurrentImage(false)
    }
  }, [isEditOpen, thread])

  const submitEditDiscussion = async (e) => {
    e.preventDefault()
    setUpdating(true)
    try {
      const imageFile = removeCurrentImage ? null : (editImage || undefined)
      await updateDiscussion(id, {
        title: editTitle,
        content: editContent,
        visibility: editVisibility
      }, imageFile)
      setIsEditOpen(false)
      await fetchThread()
    } catch (err) {
      showAlert('Gagal Mengubah Diskusi', err.response?.data?.error || 'Gagal mengubah diskusi ini.')
    } finally {
      setUpdating(false)
    }
  }

  const handleDeleteDiscussion = async () => {
    try {
      setDeletingDiscussion(true)
      await deleteDiscussion(id)
      navigate('/diskusi', { replace: true })
    } catch (e) {
      showAlert('Gagal Menghapus Diskusi', e.response?.data?.error || 'Gagal menghapus diskusi ini.')
    } finally {
      setDeletingDiscussion(false)
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
      showAlert('Gagal Mengirim Pesan', e2.response?.data?.error || 'Gagal mengirim pesan Anda.')
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
      showAlert('Gagal Mengedit Pesan', e.response?.data?.error || 'Gagal mengedit pesan Anda.')
    }
  }

  const handleDeleteMessageConfirm = async () => {
    if (!messageToDelete) return
    try {
      setDeletingMessage(true)
      await deleteDiscussionMessage(id, messageToDelete.id)
      setMessages(prev => prev.filter(m => m.id !== messageToDelete.id))
      setShowDeleteMessageConfirm(false)
      setMessageToDelete(null)
    } catch (e) {
      showAlert('Gagal Menghapus Pesan', e.response?.data?.error || 'Gagal menghapus pesan Anda.')
    } finally {
      setDeletingMessage(false)
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
    <div className="h-screen flex flex-col bg-gray-50 overflow-hidden">
      <Header />
      <div className="flex flex-1 overflow-hidden">
        <Sidebar />
        <main className="flex-1 min-w-0 flex flex-col overflow-hidden">
          <div className={`max-w-screen-2xl mx-auto w-full flex-1 flex flex-col overflow-hidden ${showChatMobile ? 'p-0 md:p-6 lg:p-8' : 'p-4 md:p-6 lg:p-8'}`}>
            <div className={`mb-3 ${showChatMobile ? 'hidden md:block' : 'block'}`}>
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
              <div className="flex-1 flex flex-col md:flex-row gap-6 min-h-0 overflow-hidden">
                {/* Sisi kiri: Detail */}
                <Card className={`p-4 sm:p-6 md:w-[360px] lg:w-[420px] flex-shrink-0 flex flex-col min-h-0 overflow-y-auto ${showChatMobile ? 'hidden md:flex' : 'flex'}`}>
                  <div className="flex flex-col gap-4">
                    <div className="min-w-0">
                      <div className="flex justify-between items-start gap-4 mb-2">
                        <h1 className="text-xl sm:text-2xl font-bold text-gray-900 break-words flex-1">{thread.title}</h1>
                        {isOwner && (
                          <div className="relative">
                            <button
                              type="button"
                              onClick={() => setShowActionsDropdown(!showActionsDropdown)}
                              className="p-1.5 hover:bg-gray-100 rounded-full text-gray-500 hover:text-gray-700 transition-colors"
                              title="Aksi Diskusi"
                            >
                              <MoreVertical size={20} />
                            </button>
                            {showActionsDropdown && (
                              <div className="absolute right-0 mt-1 w-36 bg-white border border-gray-200 rounded-xl shadow-lg z-[100] py-1">
                                <button
                                  type="button"
                                  onClick={() => {
                                    setShowActionsDropdown(false)
                                    setIsEditOpen(true)
                                  }}
                                  className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"
                                >
                                  <Pencil size={15} />
                                  Edit Diskusi
                                </button>
                                <button
                                  type="button"
                                  onClick={() => {
                                    setShowActionsDropdown(false)
                                    setShowDeleteConfirm(true)
                                  }}
                                  className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 flex items-center gap-2"
                                >
                                  <Trash2 size={15} />
                                  Hapus
                                </button>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                      {thread.image && (
                        <div className="mt-3">
                          <img
                            src={getImageUrl(thread.image, 'discussions')}
                            alt={thread.title}
                            className="w-full max-h-56 object-cover rounded-xl border border-gray-200 cursor-zoom-in hover:brightness-95 transition-all"
                            onClick={() => handleOpenPreview(getImageUrl(thread.image, 'discussions'))}
                          />
                        </div>
                      )}
                      <div className="text-gray-700 mt-2 whitespace-pre-wrap break-words text-sm">
                        {thread.content}
                      </div>
                      <div className="text-xs text-gray-500 mt-4 flex flex-wrap gap-2">
                        <span className="px-2 py-1 rounded-full bg-gray-100 font-medium">
                          {thread.visibility === 'PRIVATE' ? '🔒 Privat' : '🌐 Publik'}
                        </span>
                        <span className="px-2 py-1 rounded-full bg-gray-100 font-medium">
                          {thread.status === 'LOCKED' ? '🚫 Dikunci' : '✅ Terbuka'}
                        </span>
                        <span className="px-2 py-1 rounded-full bg-gray-100 font-medium">
                          👥 {thread.counts?.members || 0} anggota
                        </span>
                        <span className="px-2 py-1 rounded-full bg-gray-100 font-medium">
                          💬 {thread.counts?.messages || 0} pesan
                        </span>
                        {membershipRole && (
                          <span className="px-2 py-1 rounded-full bg-blue-50 text-blue-700 font-semibold border border-blue-100">
                            Bergabung ({membershipRole})
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="shrink-0 flex flex-col gap-2 w-full mt-2">
                      <div className="flex gap-2 w-full">
                        {!isMember ? (
                          <Button onClick={join} className="flex-1 text-center justify-center">Gabung</Button>
                        ) : (
                          <Button variant="outline" onClick={leave} className="flex-1 text-center justify-center">
                            Keluar
                          </Button>
                        )}
                        {canModerate && (
                          <Button 
                            variant={thread.status === 'LOCKED' ? 'primary' : 'outline'} 
                            onClick={() => setShowLockConfirm(true)} 
                            className="flex flex-1 items-center justify-center gap-2"
                          >
                            {thread.status === 'LOCKED' ? <Unlock size={16} /> : <Lock size={16} />}
                            {thread.status === 'LOCKED' ? 'Buka' : 'Kunci'}
                          </Button>
                        )}
                      </div>
                      <Button
                        onClick={() => setShowChatMobile(true)}
                        className="md:hidden w-full text-center justify-center bg-blue-600 hover:bg-blue-700 text-white mt-1"
                      >
                        Masuk Ruang Chat
                      </Button>
                    </div>
                  </div>
                </Card>

                {/* Sisi kanan: Room Chat */}
                <Card className={`p-4 sm:p-6 flex flex-col flex-1 min-h-0 overflow-hidden relative ${showChatMobile ? 'flex' : 'hidden md:flex'}`}>
                  <div className="flex items-center justify-between mb-3 border-b border-gray-100 pb-3 flex-shrink-0">
                    <div className="flex items-center gap-2">
                      {showChatMobile && (
                        <button
                          onClick={() => setShowChatMobile(false)}
                          className="md:hidden p-1 mr-1 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                        >
                          <ArrowLeft size={20} />
                        </button>
                      )}
                      <div className="font-semibold text-gray-900">Diskusi</div>
                    </div>
                    {!isMember && (
                      <div className="text-xs text-gray-500 bg-amber-50 text-amber-700 px-3 py-1 rounded-lg border border-amber-200 animate-pulse">
                        Untuk ikut chat/reply, kamu harus join dulu.
                      </div>
                    )}
                  </div>

                  <div className="flex-grow flex-shrink flex-1 min-h-0 relative mb-4 flex flex-col">
                    {showDeleteMessageConfirm && (
                      <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                        <div className="bg-white rounded-2xl border border-gray-200 shadow-lg p-5 w-full max-w-sm transform scale-100 transition-all text-left">
                          <div className="flex items-start gap-4">
                            <div className="flex-shrink-0 p-3 bg-red-100 rounded-xl text-red-600">
                              <Trash2 size={24} />
                            </div>
                            <div className="flex-1">
                              <h3 className="text-lg font-semibold text-gray-900 mb-2">Hapus Pesan</h3>
                              <p className="text-gray-600 text-sm">Apakah Anda yakin ingin menghapus pesan ini? Pesan yang dihapus tidak dapat dikembalikan.</p>
                            </div>
                          </div>
                          <div className="flex justify-end gap-3 pt-4 border-t border-gray-200 mt-4">
                            <Button
                              variant="outline"
                              onClick={() => {
                                setShowDeleteMessageConfirm(false)
                                setMessageToDelete(null)
                              }}
                              disabled={deletingMessage}
                            >
                              Batal
                            </Button>
                            <Button
                              variant="danger"
                              onClick={handleDeleteMessageConfirm}
                              disabled={deletingMessage}
                            >
                              {deletingMessage ? 'Memproses...' : 'Ya, Hapus'}
                            </Button>
                          </div>
                        </div>
                      </div>
                    )}
                    <div className="flex-1 overflow-y-auto border border-gray-200 rounded-lg p-4 bg-white min-h-0">
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
                                {m.sender?.id !== user.id && (
                                  <Link
                                    to={`/profil/${m.sender?.id}`}
                                    className="text-xs text-gray-500 mb-1 px-1 hover:underline cursor-pointer block text-left"
                                  >
                                    {m.sender?.nama || 'User'}
                                  </Link>
                                )}
                                
                                {m.parent && (
                                  <div className={`mb-1 px-3 py-2 rounded-lg border-l-2 border-blue-500 text-left ${
                                    m.sender?.id === user.id ? 'bg-blue-700/50 text-white' : 'bg-gray-100 text-gray-800'
                                  }`}>
                                    <p className="text-xs font-semibold opacity-85">
                                      {m.parent.sender?.nama || 'User'}
                                    </p>
                                    <p className="text-sm truncate">
                                      {m.parent.media ? 'Gambar' : (m.parent.content || '')}
                                    </p>
                                    {m.parent.media && (
                                      <div className="mt-1">
                                        <img
                                          src={getImageUrl(m.parent.media, 'discussion_messages')}
                                          alt="Parent media"
                                          className="max-h-32 rounded-lg border border-gray-200 cursor-zoom-in hover:brightness-95 transition-all"
                                          onClick={() => handleOpenPreview(getImageUrl(m.parent.media, 'discussion_messages'))}
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
                                      className="max-h-64 rounded-xl border border-gray-200 cursor-zoom-in hover:brightness-95 transition-all"
                                      onClick={() => handleOpenPreview(getImageUrl(m.media, 'discussion_messages'))}
                                    />
                                  </div>
                                )}

                                {editingId === m.id ? (
                                  <div className="mt-2 space-y-2">
                                    <textarea
                                      value={editingContent}
                                      onChange={(e) => setEditingContent(e.target.value)}
                                      className="w-full min-h-20 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-left"
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
                                    className={`text-sm whitespace-pre-wrap inline-block px-4 py-2 rounded-2xl text-left ${
                                      m.sender?.id === user.id
                                        ? 'bg-blue-600 text-white'
                                        : 'bg-gray-200 text-gray-900'
                                    }`}
                                  >
                                    {m.content}
                                  </div>
                                )}

                                {isMember && thread.status !== 'LOCKED' && (
                                  <div className={`mt-1 flex items-center gap-3 ${m.sender?.id === user.id ? 'justify-end' : 'justify-start'}`}>
                                    <span className="text-[10px] text-gray-400">
                                      {m.createdAt ? new Date(m.createdAt).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) : ''}
                                    </span>
                                    <button
                                      type="button"
                                      onClick={() => setReplyingTo(m)}
                                      className="text-gray-400 hover:text-gray-600 transition-colors cursor-pointer"
                                      title="Balas"
                                    >
                                      <Reply size={13} />
                                    </button>

                                    {(m.sender?.id === user.id) && editingId !== m.id && (
                                      <button
                                        type="button"
                                        onClick={() => startEdit(m)}
                                        className="text-gray-400 hover:text-gray-600 transition-colors cursor-pointer"
                                        title="Edit"
                                      >
                                        <Pencil size={13} />
                                      </button>
                                    )}

                                    {((m.sender?.id === user.id) || canModerate) && (
                                      <button
                                        type="button"
                                        onClick={() => {
                                          setMessageToDelete(m)
                                          setShowDeleteMessageConfirm(true)
                                        }}
                                        className="text-gray-400 hover:text-red-600 transition-colors cursor-pointer"
                                        title="Hapus"
                                      >
                                        <Trash2 size={13} />
                                      </button>
                                    )}
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
                  </div>

                  {replyingTo && (
                    <div className="mt-auto px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg flex items-center justify-between mb-2">
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
                    <div className="mt-auto px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg relative mb-2">
                      <img
                        src={imagePreview}
                        alt="Preview"
                        className="max-h-32 rounded-xl border border-gray-200"
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

                  <form onSubmit={send} className="flex gap-2 items-end flex-shrink-0">
                    <input
                      type="file"
                      ref={fileInputRef}
                      accept="image/*"
                      onChange={(e) => {
                        const file = e.target.files?.[0] || null
                        if (!file) return
                        
                        // Validasi format file
                        if (!file.type.startsWith('image/')) {
                          showAlert('Format File Tidak Didukung', 'Hanya file gambar (PNG, JPG, JPEG, dll) yang diperbolehkan.')
                          if (fileInputRef.current) fileInputRef.current.value = ''
                          return
                        }
                        
                        // Validasi ukuran file (max 5MB)
                        if (file.size > 5 * 1024 * 1024) {
                          showAlert('Ukuran Gambar Terlalu Besar', 'Ukuran maksimal gambar yang didukung adalah 5MB.')
                          if (fileInputRef.current) fileInputRef.current.value = ''
                          return
                        }

                        setSelectedImage(file)
                        const reader = new FileReader()
                        reader.onloadend = () => setImagePreview(reader.result)
                        reader.readAsDataURL(file)
                      }}
                      className="hidden"
                      disabled={!isMember || thread.status === 'LOCKED'}
                    />
                    {thread.status !== 'LOCKED' && (
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        disabled={!isMember}
                        className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
                        title="Kirim gambar"
                      >
                        <ImageIcon size={20} />
                      </button>
                    )}
                    {thread.status === 'LOCKED' ? (
                      <div className="flex-1 px-4 py-2 bg-red-50 text-red-600 font-semibold border border-red-200 rounded-lg text-center text-sm">
                        🔒 Diskusi sedang dikunci. Tidak bisa mengirim pesan.
                      </div>
                    ) : (
                      <input
                        value={composer}
                        onChange={(e) => setComposer(e.target.value)}
                        placeholder={isMember ? 'Tulis pesan...' : 'Gabung dulu untuk mengirim pesan'}
                        disabled={!isMember}
                        className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none disabled:bg-gray-100"
                      />
                    )}
                    {thread.status !== 'LOCKED' && (
                      <Button type="submit" disabled={!canSend || sending}>
                        {sending ? 'Mengirim...' : 'Kirim'}
                      </Button>
                    )}
                  </form>
                </Card>
              </div>
            )}
          </div>
        </main>
      </div>

      <Modal isOpen={alertOpen} onClose={() => setAlertOpen(false)} title={alertTitle}>
        <div className="space-y-4">
          <p className="text-gray-700 text-sm leading-relaxed">{alertMessage}</p>
          <div className="flex justify-end pt-2">
            <Button onClick={() => setAlertOpen(false)} className="px-5 py-2">Tutup</Button>
          </div>
        </div>
      </Modal>

      <ConfirmModal
        isOpen={showLockConfirm}
        onClose={() => setShowLockConfirm(false)}
        onConfirm={toggleLock}
        title={thread?.status === 'LOCKED' ? 'Buka Kunci Diskusi' : 'Kunci Diskusi'}
        message={
          thread?.status === 'LOCKED'
            ? 'Apakah Anda yakin ingin membuka kunci diskusi ini? Anggota akan dapat mengirim pesan baru kembali.'
            : 'Apakah Anda yakin ingin mengunci diskusi ini? Anggota tidak akan dapat mengirim pesan baru setelah diskusi dikunci.'
        }
        confirmText={thread?.status === 'LOCKED' ? 'Ya, Buka' : 'Ya, Kunci'}
        cancelText="Batal"
        variant={thread?.status === 'LOCKED' ? 'info' : 'warning'}
      />

      <ConfirmModal
        isOpen={showDeleteConfirm}
        onClose={() => setShowDeleteConfirm(false)}
        onConfirm={handleDeleteDiscussion}
        title="Hapus Diskusi"
        message="Apakah Anda yakin ingin menghapus diskusi ini? Semua riwayat chat, media pesan, dan gambar cover diskusi akan dihapus secara permanen dari server dan tidak dapat dikembalikan."
        confirmText="Ya, Hapus Diskusi"
        cancelText="Batal"
        variant="danger"
        isLoading={deletingDiscussion}
      />

      <Modal isOpen={isEditOpen} onClose={() => setIsEditOpen(false)} title="Edit Diskusi" size="lg">
        <form onSubmit={submitEditDiscussion} className="space-y-4">
          <Input
            label="Judul"
            value={editTitle}
            onChange={(e) => setEditTitle(e.target.value)}
            placeholder="Contoh: Tips persiapan karier setelah lulus"
            required
          />

          <div className="w-full">
            <label className="block text-sm font-medium text-gray-700 mb-1">Konten</label>
            <textarea
              value={editContent}
              onChange={(e) => setEditContent(e.target.value)}
              placeholder="Jelaskan topik diskusi..."
              className="w-full min-h-32 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
              required
            />
          </div>

          <div className="w-full">
            <label className="block text-sm font-medium text-gray-700 mb-1">Gambar Diskusi (opsional)</label>
            <input
              type="file"
              accept="image/*"
              ref={editFileInputRef}
              onChange={(e) => {
                const file = e.target.files?.[0] || null
                
                if (file) {
                  // Validasi format file
                  if (!file.type.startsWith('image/')) {
                    showAlert('Format File Tidak Didukung', 'Hanya file gambar (PNG, JPG, JPEG, dll) yang diperbolehkan.')
                    if (editFileInputRef.current) editFileInputRef.current.value = ''
                    return
                  }
                  
                  // Validasi ukuran file (max 5MB)
                  if (file.size > 5 * 1024 * 1024) {
                    showAlert('Ukuran Gambar Terlalu Besar', 'Ukuran maksimal gambar yang didukung adalah 5MB.')
                    if (editFileInputRef.current) editFileInputRef.current.value = ''
                    return
                  }

                  setEditImage(file)
                  setRemoveCurrentImage(false)
                  const reader = new FileReader()
                  reader.onloadend = () => setEditImagePreview(reader.result)
                  reader.readAsDataURL(file)
                }
              }}
              className="w-full"
            />
            
            {/* Tampilkan preview gambar baru atau gambar yang sudah ada */}
            {(editImagePreview || (thread?.image && !removeCurrentImage)) && (
              <div className="mt-2 relative inline-block">
                <img
                  src={editImagePreview || thread.image}
                  alt="Preview"
                  className="w-full max-h-56 object-cover rounded-xl border border-gray-200"
                />
                <button
                  type="button"
                  onClick={() => {
                    setEditImage(null)
                    setEditImagePreview(null)
                    setRemoveCurrentImage(true)
                    if (editFileInputRef.current) editFileInputRef.current.value = ''
                  }}
                  className="absolute top-2 right-2 bg-red-600 text-white rounded-full p-1.5 hover:bg-red-700 shadow-md transition-colors"
                  title="Hapus Gambar"
                >
                  <X size={16} />
                </button>
              </div>
            )}
          </div>

          <div className="w-full">
            <label className="block text-sm font-medium text-gray-700 mb-1">Visibilitas</label>
            <select
              value={editVisibility}
              onChange={(e) => setEditVisibility(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
            >
              <option value="PUBLIC">Public</option>
              <option value="PRIVATE">Privat</option>
            </select>
            <p className="text-xs text-gray-500 mt-1">
              Publik bisa dibaca semua alumni/pengurus; Privat hanya untuk anggota.
            </p>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="secondary" onClick={() => setIsEditOpen(false)} disabled={updating}>
              Batal
            </Button>
            <Button type="submit" disabled={updating}>
              {updating ? 'Menyimpan...' : 'Simpan'}
            </Button>
          </div>
        </form>
      </Modal>



      {/* Image Preview Modal */}
      {activeImagePreview && (
        <div 
          className={`fixed inset-0 bg-slate-900/40 backdrop-blur-md z-[9999] flex items-center justify-center p-4 transition-all duration-300 ease-out ${
            animateImage ? 'opacity-100' : 'opacity-0'
          }`}
          onClick={handleClosePreview}
        >
          <button 
            className={`absolute top-6 right-6 text-slate-800 hover:text-slate-900 bg-white/80 hover:bg-white p-2.5 rounded-xl transition-all shadow-md duration-300 ease-out ${
              animateImage ? 'translate-y-0 opacity-100' : '-translate-y-2 opacity-0'
            }`}
            onClick={handleClosePreview}
          >
            <X size={20} />
          </button>
          <img 
            src={activeImagePreview} 
            alt="Preview" 
            className={`max-w-full max-h-[85vh] object-contain rounded-2xl shadow-2xl transition-all duration-300 ease-out transform ${
              animateImage ? 'scale-100 opacity-100' : 'scale-95 opacity-0'
            }`}
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}
    </div>
  )
}

export default DiscussionDetail
