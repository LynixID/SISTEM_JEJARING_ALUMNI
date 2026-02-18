import { io } from 'socket.io-client'

const SOCKET_URL = import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:5000'

let socket = null

export const initSocket = () => {
  if (socket) return socket

  const token = localStorage.getItem('token')
  
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


