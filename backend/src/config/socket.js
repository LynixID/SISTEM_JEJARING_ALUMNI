import { Server } from 'socket.io'

let io = null

export const initSocket = (server) => {
  io = new Server(server, {
    cors: {
      origin: process.env.FRONTEND_URL || 'http://localhost:5173',
      methods: ['GET', 'POST'],
      credentials: true,
    },
  })

  io.on('connection', (socket) => {
    console.log('✅ User connected:', socket.id)

    // Join user room untuk notifikasi (dikirim dari frontend dengan userId)
    socket.on('join-user-room', (userId) => {
      const roomId = `user:${userId}`
      socket.join(roomId)
      console.log(`User ${socket.id} joined notification room: ${roomId}`)
    })

    socket.on('disconnect', () => {
      console.log('❌ User disconnected:', socket.id)
    })

    // Join room untuk chat pribadi
    socket.on('join-room', (roomId) => {
      socket.join(roomId)
      console.log(`User ${socket.id} joined room: ${roomId}`)
    })

    // Leave room
    socket.on('leave-room', (roomId) => {
      socket.leave(roomId)
      console.log(`User ${socket.id} left room: ${roomId}`)
    })
  })

  return io
}

export const getIO = () => {
  if (!io) {
    throw new Error('Socket.io not initialized')
  }
  return io
}


