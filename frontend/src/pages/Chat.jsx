import { useEffect, useState, useRef } from 'react'
import { useParams, useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { getSocket } from '../config/socket'
import Header from '../components/layout/Header'
import Sidebar from '../components/layout/Sidebar'
import { getConversations, getMessages, sendMessage, markMessagesAsRead, getConnections } from '../services/api'
import { getImageUrl } from '../utils/imageUtils'
import { MessageCircle, Send, Image as ImageIcon, X, Reply, Loader, Plus, Search } from 'lucide-react'
import Button from '../components/common/Button'

const Chat = () => {
  const { userId } = useParams()
  const { user: currentUser, isAuthenticated } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [conversations, setConversations] = useState([])
  const [selectedConversation, setSelectedConversation] = useState(null)
  const [messages, setMessages] = useState([])
  const [loading, setLoading] = useState(true)
  const [loadingMessages, setLoadingMessages] = useState(false)
  const [sending, setSending] = useState(false)
  const [messageContent, setMessageContent] = useState('')
  const [selectedImage, setSelectedImage] = useState(null)
  const [imagePreview, setImagePreview] = useState(null)
  const [replyingTo, setReplyingTo] = useState(null)
  const [showNewMessageModal, setShowNewMessageModal] = useState(false)
  const [connectedUsers, setConnectedUsers] = useState([])
  const [loadingConnections, setLoadingConnections] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const messagesEndRef = useRef(null)
  const fileInputRef = useRef(null)
  const fetchingRef = useRef(false)
  const userInfoFromNavigationRef = useRef(null)
  const socket = getSocket()
  
  // Simpan userInfo dari navigation state ke ref agar tetap tersedia
  useEffect(() => {
    if (location.state?.userInfo) {
      userInfoFromNavigationRef.current = location.state.userInfo
    }
  }, [location.state])

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login', { replace: true })
      return
    }

    fetchConversations()

    // Join user room untuk real-time messages
    if (currentUser?.id) {
      socket.emit('join-user-room', currentUser.id)
    }

    // Socket listeners
    socket.on('newMessage', handleNewMessage)
    socket.on('messageSent', handleMessageSent)
    socket.on('messageDeleted', handleMessageDeleted)

    return () => {
      socket.off('newMessage')
      socket.off('messageSent')
      socket.off('messageDeleted')
    }
  }, [isAuthenticated, navigate])

  // Handle userId change - langsung fetch messages
  useEffect(() => {
    if (userId && userId !== currentUser?.id) {
      // Validasi: pastikan userId bukan currentUser
      // Reset state saat userId berubah
      if (selectedConversation?.partner?.id !== userId) {
        setMessages([])
        setReplyingTo(null)
        
        // Cek apakah ada userInfo dari navigation state (dari Profile page)
        const userInfoFromState = location.state?.userInfo || userInfoFromNavigationRef.current
        
        // Cek apakah sudah ada conversation dengan userId ini
        const conversation = conversations.find(c => c.partner.id === userId)
        
        if (userInfoFromState) {
          // Jika ada userInfo dari navigation, set langsung
          setSelectedConversation({
            partner: userInfoFromState
          })
        } else if (conversation) {
          // Jika ada conversation, gunakan info dari conversation
          setSelectedConversation(conversation)
        }
        
        // Fetch messages untuk mendapatkan partner info dan messages
        // Pass userInfo dari state atau conversation jika ada
        if (!fetchingRef.current) {
          const userInfo = userInfoFromState || conversation?.partner || null
          fetchMessages(userId, true, userInfo)
        }
        
        // Clear navigation state setelah digunakan (tapi keep di ref)
        if (location.state?.userInfo) {
          navigate(location.pathname, { replace: true, state: {} })
        }
      }
    } else {
      // Reset semua state ketika tidak ada userId atau userId sama dengan currentUser
      setSelectedConversation(null)
      setMessages([])
      setReplyingTo(null)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId, currentUser?.id, location.state])

  useEffect(() => {
    // Scroll ke bottom hanya jika ada message baru (bukan saat initial load atau reset)
    if (messages.length > 0) {
      // Delay sedikit untuk memastikan DOM sudah update
      setTimeout(() => {
        scrollToBottom()
      }, 50)
    }
  }, [messages.length]) // Hanya trigger saat jumlah messages berubah, bukan setiap render

  useEffect(() => {
    if (selectedConversation?.partner?.id && messages.length > 0) {
      markAsRead(selectedConversation.partner.id)
    }
  }, [selectedConversation?.partner?.id])

  // Pastikan ketika tidak ada userId, selectedConversation selalu null
  useEffect(() => {
    if (!userId) {
      setSelectedConversation(null)
      setMessages([])
      setReplyingTo(null)
    }
  }, [userId])

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  const fetchConversations = async () => {
    try {
      setLoading(true)
      const response = await getConversations()
      // Backend mengembalikan { success: true, data: { conversations: [...] } }
      const responseData = response.data?.data || response.data
      const fetchedConversations = responseData?.conversations || []
      setConversations(fetchedConversations)
      
      // Jika ada userId di URL dan userId bukan currentUser, set conversation dan fetch messages
      if (userId && userId !== currentUser?.id) {
        // Cek apakah ada userInfo dari navigation state (dari Profile page)
        const userInfoFromState = location.state?.userInfo || userInfoFromNavigationRef.current
        
        const conversation = fetchedConversations.find(c => c.partner.id === userId)
        
        if (userInfoFromState) {
          // Jika ada userInfo dari navigation, set langsung
          setSelectedConversation({
            partner: userInfoFromState
          })
        } else if (conversation && conversation.partner.id !== currentUser?.id) {
          setSelectedConversation(conversation)
        }
        
        // Fetch messages untuk userId ini (akan di-handle oleh fetchMessages untuk prevent duplicate)
        // Pass userInfo dari state atau conversation jika ada
        if (!fetchingRef.current) {
          const userInfo = userInfoFromState || conversation?.partner || null
          fetchMessages(userId, true, userInfo)
        }
      } else if (!userId) {
        // Pastikan selectedConversation null ketika tidak ada userId
        setSelectedConversation(null)
        setMessages([])
      }
    } catch (error) {
      console.error('Error fetching conversations:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchMessages = async (partnerId, force = false, userInfo = null) => {
    // Validasi: pastikan partnerId bukan currentUser
    if (!partnerId || partnerId === currentUser?.id) {
      console.warn('Invalid partnerId:', partnerId)
      setSelectedConversation(null)
      setMessages([])
      return
    }

    // Prevent duplicate calls
    if (fetchingRef.current && !force) {
      return
    }

    // Prevent jika sudah ada messages untuk userId ini dan tidak force
    if (!force && selectedConversation?.partner?.id === partnerId && messages.length > 0) {
      return
    }

    try {
      fetchingRef.current = true
      setLoadingMessages(true)
      const response = await getMessages(partnerId)
      // Backend mengembalikan { success: true, data: { messages: [...], partner: {...} } }
      const responseData = response.data?.data || response.data
      const fetchedMessages = responseData?.messages || response.data?.messages || []
      setMessages(fetchedMessages)
      
      // Update selected conversation dengan partner info dari backend
      // Prioritaskan: userInfo (dari handleSelectUser/Profile) > backend > conversations list > default
      // Backend SELALU return partner info, jadi ini adalah sumber yang paling reliable
      const partnerFromBackend = responseData?.partner || response.data?.partner
      
      // Backend SELALU return partner info dengan nama yang benar
      // Debug: log untuk memastikan partner dari backend ada
      if (partnerFromBackend) {
        console.log('Partner from backend:', partnerFromBackend.nama)
      } else {
        console.warn('Backend partner info missing! Response:', response.data)
      }
      
      // Cek juga dari conversations list untuk fallback
      const conversation = conversations.find(c => c.partner.id === partnerId)
      
      // Backend SELALU return partner info dengan nama yang benar, jadi itu adalah sumber yang paling reliable
      // Prioritas: userInfo (dari navigation) > backend (selalu ada dan benar) > conversations list
      // Jangan gunakan selectedConversation yang lama jika namanya "User"
      const finalPartner = {
        id: partnerId,
        // Backend selalu return nama yang benar, jadi prioritaskan itu setelah userInfo
        nama: userInfo?.nama || 
              partnerFromBackend?.nama || 
              conversation?.partner?.nama ||
              'User', // Fallback terakhir
        email: userInfo?.email || 
               partnerFromBackend?.email || 
               conversation?.partner?.email ||
               null,
        fotoProfil: userInfo?.fotoProfil || 
                    partnerFromBackend?.fotoProfil || 
                    conversation?.partner?.fotoProfil ||
                    null
      }
      
      setSelectedConversation({
        partner: finalPartner,
        lastMessage: fetchedMessages[fetchedMessages.length - 1] || null
      })
    } catch (error) {
      console.error('Error fetching messages:', error)
      // Jika error, gunakan userInfo atau selectedConversation yang ada
      if (partnerId === currentUser?.id) {
        setSelectedConversation(null)
        setMessages([])
      } else {
        // Cek juga dari conversations list jika ada
        const conversation = conversations.find(c => c.partner.id === partnerId)
        const finalPartner = {
          id: partnerId,
          nama: userInfo?.nama || 
                conversation?.partner?.nama || 
                (selectedConversation?.partner?.nama && selectedConversation?.partner?.nama !== 'User' ? selectedConversation.partner.nama : null) ||
                'User',
          email: userInfo?.email || conversation?.partner?.email || selectedConversation?.partner?.email || null,
          fotoProfil: userInfo?.fotoProfil || conversation?.partner?.fotoProfil || selectedConversation?.partner?.fotoProfil || null
        }
        setSelectedConversation({
          partner: finalPartner
        })
      }
      setMessages([]) // Set empty messages jika error
    } finally {
      setLoadingMessages(false)
      fetchingRef.current = false
    }
  }

  const handleNewMessage = (message) => {
    // Update messages jika conversation yang sama
    // Cek dulu apakah message sudah ada untuk prevent duplicate
    if (selectedConversation?.partner?.id === message.senderId || 
        selectedConversation?.partner?.id === message.receiverId) {
      setMessages(prev => {
        // Cek apakah message sudah ada (by id atau by temp id)
        const exists = prev.find(m => {
          if (m.id === message.id) return true
          // Jika ada temp message dengan content yang sama, replace
          if (m.id?.startsWith('temp-') && m.content === message.content) {
            const timeDiff = Math.abs(new Date(m.createdAt) - new Date(message.createdAt))
            if (timeDiff < 5000) return true // Same message within 5 seconds
          }
          return false
        })
        if (exists) {
          // Jika ada temp message, replace dengan real message
          if (exists.id?.startsWith('temp-')) {
            return prev.map(m => m.id === exists.id ? message : m)
          }
          return prev // Jangan duplicate
        }
        return [...prev, message]
      })
    }
    
    // Update conversations
    setConversations(prev => {
      const updated = prev.map(conv => {
        if (conv.partner.id === message.senderId || conv.partner.id === message.receiverId) {
          return {
            ...conv,
            lastMessage: message,
            unreadCount: message.receiverId === currentUser?.id ? (conv.unreadCount || 0) + 1 : 0,
            updatedAt: message.createdAt
          }
        }
        return conv
      })
      
      // Jika conversation belum ada, tambahkan
      const exists = updated.some(conv => 
        conv.partner.id === message.senderId || conv.partner.id === message.receiverId
      )
      if (!exists && message.senderId !== currentUser?.id) {
        updated.unshift({
          partner: {
            id: message.senderId,
            nama: message.sender.nama,
            fotoProfil: message.sender.fotoProfil
          },
          lastMessage: message,
          unreadCount: 1,
          updatedAt: message.createdAt
        })
      }
      
      return updated.sort((a, b) => 
        new Date(b.lastMessage?.createdAt || b.updatedAt || 0) - 
        new Date(a.lastMessage?.createdAt || a.updatedAt || 0)
      )
    })
  }

  const handleMessageSent = (message) => {
    // handleMessageSent hanya untuk pesan yang dikirim sendiri (senderId === currentUser.id)
    // Jika message ini dari user lain, abaikan (akan di-handle oleh handleNewMessage)
    if (message.senderId !== currentUser?.id) {
      return
    }
    
    // Update messages jika conversation yang sama
    // Cek dulu apakah message sudah ada untuk prevent duplicate
    if (selectedConversation?.partner?.id === message.receiverId || 
        selectedConversation?.partner?.id === message.senderId) {
      setMessages(prev => {
        // Cek apakah message sudah ada (by id atau temp message dengan content sama)
        const exists = prev.find(m => {
          if (m.id === message.id) return true
          // Jika ada temp message dengan content yang sama, replace
          if (m.id?.startsWith('temp-') && m.content === message.content && m.senderId === message.senderId) {
            const timeDiff = Math.abs(new Date(m.createdAt) - new Date(message.createdAt))
            if (timeDiff < 10000) return true // Same message within 10 seconds
          }
          return false
        })
        if (exists) {
          // Jika ada temp message, replace dengan real message
          if (exists.id?.startsWith('temp-')) {
            return prev.map(m => m.id === exists.id ? message : m)
          }
          return prev // Jangan duplicate
        }
        return [...prev, message]
      })
    }
    
    // Update conversations list
    setConversations(prev => {
      const updated = prev.map(conv => {
        if (conv.partner.id === message.receiverId || conv.partner.id === message.senderId) {
          return {
            ...conv,
            lastMessage: message,
            updatedAt: message.createdAt
          }
        }
        return conv
      })
      
      // Jika conversation belum ada, tambahkan
      const exists = updated.some(conv => 
        conv.partner.id === message.receiverId || conv.partner.id === message.senderId
      )
      if (!exists) {
        // Ambil partner info dari message
        const partnerId = message.receiverId === currentUser?.id ? message.senderId : message.receiverId
        const partner = message.receiverId === currentUser?.id ? message.sender : { 
          id: message.receiverId,
          nama: selectedConversation?.partner?.nama || 'User',
          fotoProfil: selectedConversation?.partner?.fotoProfil || null
        }
        
        updated.unshift({
          partner: {
            id: partner.id,
            nama: partner.nama,
            fotoProfil: partner.fotoProfil
          },
          lastMessage: message,
          unreadCount: 0,
          updatedAt: message.createdAt
        })
      }
      
      // Sort by updatedAt
      return updated.sort((a, b) => 
        new Date(b.lastMessage?.createdAt || b.updatedAt || 0) - 
        new Date(a.lastMessage?.createdAt || a.updatedAt || 0)
      )
    })
  }

  const handleMessageDeleted = ({ messageId }) => {
    setMessages(prev => prev.filter(m => m.id !== messageId))
  }

  const markAsRead = async (partnerId) => {
    try {
      await markMessagesAsRead(partnerId)
      setConversations(prev => prev.map(conv => 
        conv.partner.id === partnerId ? { ...conv, unreadCount: 0 } : conv
      ))
    } catch (error) {
      console.error('Error marking as read:', error)
    }
  }

  // Compress image
  const compressImage = (file, maxWidth = 1920, quality = 0.85) => {
    return new Promise((resolve) => {
      const reader = new FileReader()
      reader.onload = (e) => {
        const img = document.createElement('img')
        img.onload = () => {
          const canvas = document.createElement('canvas')
          let width = img.width
          let height = img.height

          if (width > maxWidth) {
            height = (height * maxWidth) / width
            width = maxWidth
          }

          canvas.width = width
          canvas.height = height

          const ctx = canvas.getContext('2d')
          ctx.drawImage(img, 0, 0, width, height)

          canvas.toBlob(
            (blob) => {
              if (blob) {
                const compressedFile = new File([blob], file.name, {
                  type: 'image/jpeg',
                  lastModified: Date.now()
                })
                resolve(compressedFile)
              } else {
                resolve(file)
              }
            },
            'image/jpeg',
            quality
          )
        }
        img.src = e.target.result
      }
      reader.readAsDataURL(file)
    })
  }

  const handleImageChange = async (e) => {
    const file = e.target.files[0]
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        alert('Ukuran gambar maksimal 5MB')
        return
      }

      // Preview
      const reader = new FileReader()
      reader.onloadend = () => {
        setImagePreview(reader.result)
      }
      reader.readAsDataURL(file)

      // Compress jika lebih dari 1MB
      let processedFile = file
      if (file.size > 1024 * 1024) {
        try {
          processedFile = await compressImage(file)
        } catch (err) {
          console.error('Error compressing image:', err)
        }
      }

      setSelectedImage(processedFile)
    }
  }

  const removeImage = () => {
    setSelectedImage(null)
    setImagePreview(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const handleSendMessage = async () => {
    if (!selectedConversation?.partner?.id) return
    if (!messageContent.trim() && !selectedImage) return

    // Optimistic update: tambahkan pesan langsung ke UI sebelum response
    const tempMessageId = `temp-${Date.now()}-${Math.random()}`
    const optimisticMessage = {
      id: tempMessageId,
      content: messageContent,
      media: selectedImage ? URL.createObjectURL(selectedImage) : null,
      senderId: currentUser?.id,
      receiverId: selectedConversation.partner.id,
      parentId: replyingTo?.id || null,
      read: false,
      createdAt: new Date().toISOString(),
      sender: {
        id: currentUser?.id,
        nama: currentUser?.nama,
        fotoProfil: currentUser?.profile?.fotoProfil || null
      },
      parent: replyingTo || null
    }

    // Tambahkan optimistic message langsung
    setMessages(prev => {
      const exists = prev.find(m => m.id === tempMessageId || (m.id?.startsWith('temp-') && m.content === messageContent && m.senderId === currentUser?.id))
      if (exists) return prev
      return [...prev, optimisticMessage]
    })

    // Update conversations list dengan optimistic message
    setConversations(prev => {
      const updated = prev.map(conv => {
        if (conv.partner.id === selectedConversation.partner.id) {
          return {
            ...conv,
            lastMessage: optimisticMessage,
            updatedAt: optimisticMessage.createdAt
          }
        }
        return conv
      })
      
      // Jika conversation belum ada, tambahkan
      const exists = updated.some(conv => conv.partner.id === selectedConversation.partner.id)
      if (!exists) {
        updated.unshift({
          partner: selectedConversation.partner,
          lastMessage: optimisticMessage,
          unreadCount: 0,
          updatedAt: optimisticMessage.createdAt
        })
      }
      
      // Sort by updatedAt
      return updated.sort((a, b) => 
        new Date(b.lastMessage?.createdAt || b.updatedAt || 0) - 
        new Date(a.lastMessage?.createdAt || a.updatedAt || 0)
      )
    })

    // Clear form immediately untuk UX yang lebih baik
    const contentToSend = messageContent
    const imageToSend = selectedImage
    const replyToSend = replyingTo
    
    setMessageContent('')
    setSelectedImage(null)
    setImagePreview(null)
    setReplyingTo(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }

    try {
      setSending(true)
      const response = await sendMessage({
        receiverId: selectedConversation.partner.id,
        content: contentToSend,
        parentId: replyToSend?.id || null
      }, imageToSend)

      // Replace optimistic message dengan real message dari server
      // Tapi jangan update jika socket sudah handle (untuk prevent duplicate)
      const realMessage = response.data?.message
      if (realMessage) {
        setMessages(prev => {
          // Cek apakah real message sudah ada (mungkin dari socket messageSent event)
          const realExists = prev.find(m => m.id === realMessage.id)
          if (realExists) {
            // Jika sudah ada dari socket, hanya hapus temp message (jangan tambahkan lagi)
            return prev.filter(m => {
              // Hapus temp message yang sesuai
              if (m.id === tempMessageId) return false
              // Hapus temp message lain dengan content yang sama
              if (m.id?.startsWith('temp-') && m.content === realMessage.content && m.senderId === realMessage.senderId) {
                return false
              }
              return true
            })
          }
          
          // Jika belum ada, hapus temp message dan tambahkan real message
          const filtered = prev.filter(m => {
            // Hapus temp message yang sesuai
            if (m.id === tempMessageId) return false
            // Hapus temp message lain dengan content yang sama
            if (m.id?.startsWith('temp-') && m.content === realMessage.content && m.senderId === realMessage.senderId) {
              return false
            }
            return true
          })
          
          // Pastikan tidak ada duplicate real message
          const alreadyHasReal = filtered.find(m => m.id === realMessage.id)
          if (alreadyHasReal) return filtered
          
          return [...filtered, realMessage]
        })
        
        // Update conversations list dengan real message (hanya jika belum update)
        setConversations(prev => {
          const updated = prev.map(conv => {
            if (conv.partner.id === selectedConversation.partner.id) {
              // Update hanya jika lastMessage bukan real message
              if (conv.lastMessage?.id !== realMessage.id) {
                return {
                  ...conv,
                  lastMessage: realMessage,
                  updatedAt: realMessage.createdAt
                }
              }
            }
            return conv
          })
          
          return updated.sort((a, b) => 
            new Date(b.lastMessage?.createdAt || b.updatedAt || 0) - 
            new Date(a.lastMessage?.createdAt || a.updatedAt || 0)
          )
        })
        
        // Scroll ke bottom setelah message ditambahkan
        setTimeout(() => {
          scrollToBottom()
        }, 100)
      }
    } catch (error) {
      console.error('Error sending message:', error)
      
      // Remove optimistic message jika error
      setMessages(prev => prev.filter(m => m.id !== tempMessageId))
      
      // Restore form jika error
      setMessageContent(contentToSend)
      if (imageToSend) {
        setSelectedImage(imageToSend)
        const reader = new FileReader()
        reader.onloadend = () => {
          setImagePreview(reader.result)
        }
        reader.readAsDataURL(imageToSend)
      }
      if (replyToSend) {
        setReplyingTo(replyToSend)
      }
      
      alert(error.response?.data?.error || 'Gagal mengirim pesan')
    } finally {
      setSending(false)
    }
  }

  const handleSelectConversation = (conversation) => {
    setSelectedConversation(conversation)
    navigate(`/chat/${conversation.partner.id}`)
    fetchMessages(conversation.partner.id, true)
    setReplyingTo(null)
  }

  const handleStartNewMessage = async () => {
    try {
      setLoadingConnections(true)
      setShowNewMessageModal(true)
      const response = await getConnections()
      
      // Backend mengembalikan { connections: [{ user: {...} }] }
      // Atau bisa juga { data: { connections: [{ user: {...} }] } }
      const responseData = response.data?.data || response.data
      const connectionsData = responseData?.connections || []
      
      // Extract user dari setiap connection object
      const users = connectionsData
        .map(conn => {
          // Connection object memiliki structure: { id, status, user: {...} }
          // Atau bisa langsung user object
          if (conn?.user) {
            return {
              id: conn.user.id,
              nama: conn.user.nama,
              email: conn.user.email,
              fotoProfil: conn.user.fotoProfil,
              angkatan: conn.user.angkatan,
              domisili: conn.user.domisili
            }
          }
          // Jika langsung user object
          if (conn?.id && conn?.nama) {
            return conn
          }
          return null
        })
        .filter(user => user && user.id && user.nama) // Filter yang valid
      
      setConnectedUsers(users)
    } catch (error) {
      console.error('Error fetching connections:', error)
      setConnectedUsers([])
      alert('Gagal memuat daftar koneksi')
    } finally {
      setLoadingConnections(false)
    }
  }

  const handleSelectUser = async (user) => {
    setShowNewMessageModal(false)
    setSearchQuery('')
    
    // Set selected conversation langsung dengan user yang dipilih
    // Simpan di variable untuk digunakan di fetchMessages
    const userInfo = {
      id: user.id,
      nama: user.nama,
      email: user.email,
      fotoProfil: user.fotoProfil
    }
    
    setSelectedConversation({
      partner: userInfo
    })
    
    // Navigate ke chat dengan user tersebut
    navigate(`/chat/${user.id}`)
    
    // Fetch messages untuk user tersebut (akan return empty array jika belum ada)
    // Pass userInfo untuk memastikan nama tidak hilang
    await fetchMessages(user.id, true, userInfo)
  }

  const filteredConnectedUsers = (Array.isArray(connectedUsers) ? connectedUsers : []).filter(user => {
    if (!user || !user.nama) return false
    const nama = String(user.nama).toLowerCase()
    const query = String(searchQuery || '').toLowerCase()
    return nama.includes(query)
  })

  const formatTime = (dateString) => {
    const date = new Date(dateString)
    const now = new Date()
    const diff = now - date
    const minutes = Math.floor(diff / 60000)
    const hours = Math.floor(diff / 3600000)
    const days = Math.floor(diff / 86400000)

    if (minutes < 1) return 'Baru saja'
    if (minutes < 60) return `${minutes} menit lalu`
    if (hours < 24) return `${hours} jam lalu`
    if (days < 7) return `${days} hari lalu`
    return date.toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="flex">
          <Sidebar />
          <main className="flex-1 p-6">
            <div className="flex items-center justify-center h-64">
              <div className="text-gray-500">Memuat percakapan...</div>
            </div>
          </main>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <div className="flex">
        <Sidebar />
        <main className="flex-1 flex h-[calc(100vh-64px)]">
          {/* Conversations List */}
          <div className="w-80 bg-white border-r border-gray-200 flex flex-col">
            <div className="p-4 border-b border-gray-200">
              <div className="flex items-center justify-between mb-2">
                <h2 className="text-xl font-bold text-gray-900">Pesan</h2>
                <Button
                  onClick={handleStartNewMessage}
                  className="px-3 py-1.5 rounded-lg text-sm"
                  variant="primary"
                  size="sm"
                >
                  <Plus size={16} className="mr-1" />
                  Mulai Pesan
                </Button>
              </div>
            </div>
            <div className="flex-1 overflow-y-auto">
              {conversations.length === 0 ? (
                <div className="p-4 text-center text-gray-500">
                  <MessageCircle className="mx-auto mb-2 text-gray-300" size={48} />
                  <p>Belum ada percakapan</p>
                </div>
              ) : (
                conversations.map((conv) => (
                  <button
                    key={conv.partner.id}
                    onClick={() => handleSelectConversation(conv)}
                    className={`w-full p-4 text-left hover:bg-gray-50 transition-colors border-b border-gray-100 ${
                      selectedConversation?.partner?.id === conv.partner.id ? 'bg-blue-50' : ''
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <div className="relative flex-shrink-0">
                        {conv.partner.fotoProfil ? (
                          <img
                            src={getImageUrl(conv.partner.fotoProfil, 'profiles')}
                            alt={conv.partner.nama}
                            className="w-12 h-12 rounded-full object-cover"
                          />
                        ) : (
                          <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center text-white font-bold">
                            {conv.partner.nama?.charAt(0) || 'U'}
                          </div>
                        )}
                        {conv.unreadCount > 0 && (
                          <div className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 rounded-full flex items-center justify-center text-white text-xs font-bold">
                            {conv.unreadCount > 9 ? '9+' : conv.unreadCount}
                          </div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-1">
                          <h3 className="font-semibold text-gray-900 truncate">
                            {conv.partner.nama}
                          </h3>
                          {conv.lastMessage && (
                            <span className="text-xs text-gray-500 flex-shrink-0 ml-2">
                              {formatTime(conv.lastMessage.createdAt)}
                            </span>
                          )}
                        </div>
                        {conv.lastMessage && (
                          <p className="text-sm text-gray-600 truncate">
                            {conv.lastMessage.media ? (
                              <span className="flex items-center gap-1">
                                <ImageIcon size={14} />
                                Gambar
                              </span>
                            ) : (
                              conv.lastMessage.content
                            )}
                          </p>
                        )}
                      </div>
                    </div>
                  </button>
                ))
              )}
            </div>
          </div>

          {/* Chat Window */}
          <div className="flex-1 flex flex-col bg-white">
            {selectedConversation?.partner ? (
              <>
                {/* Chat Header */}
                <div className="p-4 border-b border-gray-200 flex items-center gap-3">
                  {selectedConversation.partner.fotoProfil ? (
                    <img
                      src={getImageUrl(selectedConversation.partner.fotoProfil, 'profiles')}
                      alt={selectedConversation.partner.nama}
                      className="w-10 h-10 rounded-full object-cover"
                    />
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center text-white font-bold">
                      {selectedConversation.partner.nama?.charAt(0) || 'U'}
                    </div>
                  )}
                  <div>
                    <h3 className="font-semibold text-gray-900">
                      {selectedConversation.partner.nama}
                    </h3>
                  </div>
                </div>

                {/* Messages */}
                <div className="flex-1 overflow-y-auto p-4 space-y-4">
                  {loadingMessages ? (
                    <div className="flex items-center justify-center h-full">
                      <Loader className="animate-spin text-gray-400" size={24} />
                    </div>
                  ) : messages.length === 0 ? (
                    <div className="flex items-center justify-center h-full text-gray-500">
                      <div className="text-center">
                        <MessageCircle className="mx-auto mb-2 text-gray-300" size={48} />
                        <p>Belum ada pesan</p>
                      </div>
                    </div>
                  ) : (
                    messages.map((message, index) => (
                      <MessageBubble
                        key={message.id || `msg-${index}`}
                        message={message}
                        isOwn={message.senderId === currentUser?.id}
                        onReply={() => setReplyingTo(message)}
                      />
                    ))
                  )}
                  <div ref={messagesEndRef} />
                </div>

                {/* Reply Preview */}
                {replyingTo && (
                  <div className="px-4 py-2 bg-gray-50 border-t border-gray-200 flex items-center justify-between">
                    <div className="flex items-center gap-2 flex-1 min-w-0">
                      <Reply size={16} className="text-gray-500 flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-xs text-gray-500 font-medium">
                          Membalas {replyingTo.sender.nama}
                        </p>
                        <p className="text-sm text-gray-700 truncate">
                          {replyingTo.content || (replyingTo.media ? 'Gambar' : '')}
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={() => setReplyingTo(null)}
                      className="text-gray-500 hover:text-gray-700"
                    >
                      <X size={18} />
                    </button>
                  </div>
                )}

                {/* Image Preview */}
                {imagePreview && (
                  <div className="px-4 py-2 bg-gray-50 border-t border-gray-200 relative">
                    <img
                      src={imagePreview}
                      alt="Preview"
                      className="max-h-32 rounded-lg object-cover"
                    />
                    <button
                      onClick={removeImage}
                      className="absolute top-4 right-4 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
                    >
                      <X size={16} />
                    </button>
                  </div>
                )}

                {/* Message Input */}
                <div className="p-4 border-t border-gray-200">
                  <div className="flex items-end gap-2">
                    <input
                      type="file"
                      ref={fileInputRef}
                      accept="image/*"
                      onChange={handleImageChange}
                      className="hidden"
                    />
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                    >
                      <ImageIcon size={20} />
                    </button>
                    <textarea
                      value={messageContent}
                      onChange={(e) => setMessageContent(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                          e.preventDefault()
                          handleSendMessage()
                        }
                      }}
                      placeholder="Ketik pesan..."
                      className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                      rows={1}
                    />
                    <Button
                      onClick={handleSendMessage}
                      disabled={(!messageContent.trim() && !selectedImage) || sending}
                      className="px-4 py-2"
                    >
                      {sending ? (
                        <Loader className="animate-spin" size={18} />
                      ) : (
                        <Send size={18} />
                      )}
                    </Button>
                  </div>
                </div>
              </>
            ) : (
              <div className="flex-1 flex items-center justify-center text-gray-500">
                <div className="text-center">
                  <MessageCircle className="mx-auto mb-2 text-gray-300" size={48} />
                  <p>Pilih percakapan untuk memulai chat</p>
                </div>
              </div>
            )}
          </div>
        </main>
      </div>

      {/* New Message Modal */}
      {showNewMessageModal && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[9999]"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setShowNewMessageModal(false)
              setSearchQuery('')
            }
          }}
        >
          <div className="bg-white rounded-2xl w-full max-w-md mx-4 max-h-[80vh] flex flex-col shadow-xl">
            <div className="p-4 border-b border-gray-200 flex items-center justify-between">
              <h3 className="text-lg font-bold text-gray-900">Mulai Pesan Baru</h3>
              <button
                onClick={() => {
                  setShowNewMessageModal(false)
                  setSearchQuery('')
                }}
                className="text-gray-500 hover:text-gray-700 transition-colors"
              >
                <X size={20} />
              </button>
            </div>
            
            <div className="p-4 border-b border-gray-200">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
                <input
                  type="text"
                  placeholder="Cari pengguna..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-4 min-h-0">
              {loadingConnections ? (
                <div className="flex items-center justify-center py-8">
                  <Loader className="animate-spin text-gray-400" size={24} />
                </div>
              ) : filteredConnectedUsers.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <MessageCircle className="mx-auto mb-2 text-gray-300" size={48} />
                  <p className="mt-2">{searchQuery ? 'Tidak ada pengguna ditemukan' : 'Belum ada koneksi'}</p>
                  <p className="text-sm text-gray-400 mt-1">
                    {!searchQuery && 'Koneksikan dengan pengguna lain terlebih dahulu'}
                  </p>
                </div>
              ) : (
                <div className="space-y-2">
                  {filteredConnectedUsers.map((user) => (
                    <button
                      key={user.id}
                      onClick={() => handleSelectUser(user)}
                      className="w-full p-3 rounded-lg hover:bg-gray-50 transition-colors flex items-center gap-3 text-left border border-transparent hover:border-gray-200"
                    >
                      {user.fotoProfil ? (
                        <img
                          src={getImageUrl(user.fotoProfil, 'profiles')}
                          alt={user.nama}
                          className="w-10 h-10 rounded-full object-cover flex-shrink-0"
                        />
                      ) : (
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center text-white font-bold flex-shrink-0">
                          {user.nama?.charAt(0) || 'U'}
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <h4 className="font-semibold text-gray-900 truncate">{user.nama}</h4>
                        {user.email && (
                          <p className="text-sm text-gray-500 truncate">{user.email}</p>
                        )}
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// Message Bubble Component
const MessageBubble = ({ message, isOwn, onReply }) => {

  return (
    <div className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}>
      <div className={`max-w-xs lg:max-w-md ${isOwn ? 'order-2' : 'order-1'}`}>
        {!isOwn && (
          <div className="text-xs text-gray-500 mb-1 px-2">
            {message.sender.nama}
          </div>
        )}
        
        {/* Reply Preview */}
        {message.parent && (
          <div className={`mb-1 px-3 py-2 bg-gray-100 rounded-lg border-l-2 border-blue-500 ${
            isOwn ? 'bg-gray-200' : 'bg-gray-100'
          }`}>
            <p className="text-xs text-gray-600 font-medium mb-1">
              {message.parent.sender.nama}
            </p>
            <p className="text-sm text-gray-700 truncate">
              {message.parent.content || (message.parent.media ? 'Gambar' : '')}
            </p>
          </div>
        )}

        <div
          className={`rounded-2xl px-4 py-2 ${
            isOwn
              ? 'bg-blue-600 text-white'
              : 'bg-gray-200 text-gray-900'
          }`}
        >
          {message.media && (
            <img
              src={getImageUrl(message.media, 'messages')}
              alt="Message"
              className="rounded-lg mb-2 max-w-full"
            />
          )}
          {message.content && (
            <p className="whitespace-pre-wrap break-words">{message.content}</p>
          )}
        </div>
        
        <div className={`flex items-center gap-2 mt-1 ${isOwn ? 'justify-end' : 'justify-start'}`}>
          <span className="text-xs text-gray-500">
            {new Date(message.createdAt).toLocaleTimeString('id-ID', {
              hour: '2-digit',
              minute: '2-digit'
            })}
          </span>
          <button
            onClick={onReply}
            className="text-gray-400 hover:text-gray-600 transition-colors"
            title="Balas"
          >
            <Reply size={14} />
          </button>
        </div>
      </div>
    </div>
  )
}

export default Chat

