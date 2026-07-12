import { io } from 'socket.io-client'

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:5000'

let socket = null

export const initSocket = () => {
  const token = localStorage.getItem('token')
  
  if (socket) {
    if (socket.auth?.token === token) {
      return socket
    }
    socket.disconnect()
    socket = null
  }
  
  socket = io(SOCKET_URL, {
    auth: {
      token: token
    },
    transports: ['websocket', 'polling']
  })

  socket.on('connect', () => {
    console.log('✅ Socket connected:', socket.id)
    
    // Join user room untuk notifikasi (jika user sudah login)
    const userStr = localStorage.getItem('user')
    if (userStr) {
      try {
        const user = JSON.parse(userStr)
        if (user?.id) {
          socket.emit('join-user-room', user.id)
        }
      } catch (e) {
        console.error('Error parsing user:', e)
      }
    }
  })

  socket.on('disconnect', () => {
    console.log('❌ Socket disconnected')
  })

  socket.on('ACCOUNT_DELETED', () => {
    console.log('⚠️ Account deleted by administrator. Triggering logout...')
    window.dispatchEvent(new Event('auth-logout-required-deleted'))
  })

  socket.on('ACCOUNT_SUSPENDED', (data) => {
    console.log('⚠️ Account suspended by administrator. Triggering logout...')
    window.dispatchEvent(new CustomEvent('auth-logout-required-suspended', { detail: data }))
  })

  socket.on('connect_error', (error) => {
    console.error('Socket connection error:', error)
  })

  return socket
}

export const getSocket = () => {
  if (!socket) {
    return initSocket()
  }
  return socket
}

export const disconnectSocket = () => {
  if (socket) {
    socket.disconnect()
    socket = null
  }
}


