import { Server } from 'socket.io'
import jwt from 'jsonwebtoken'
import prisma from './database.js'

let io = null
const DISCUSSION_ROOM_PREFIX = 'discussion:'

export const initSocket = (server) => {
  io = new Server(server, {
    cors: {
      origin: process.env.FRONTEND_URL || 'http://localhost:5173',
      methods: ['GET', 'POST'],
      credentials: true,
    },
  })

  // Auth middleware for sockets (uses token from frontend socket.auth.token)
  io.use((socket, next) => {
    try {
      const token = socket.handshake?.auth?.token
      if (!token) return next()

      const decoded = jwt.verify(token, process.env.JWT_SECRET)
      socket.user = decoded
      return next()
    } catch (err) {
      // If token invalid, still allow connection but treat as unauthenticated
      socket.user = undefined
      return next()
    }
  })

  io.on('connection', (socket) => {
    console.log('✅ User connected:', socket.id)

    // Join user room untuk notifikasi (dikirim dari frontend dengan userId)
    socket.on('join-user-room', (userId) => {
      // If socket has authenticated user, only allow joining its own room
      if (socket.user?.userId && socket.user.userId !== userId) {
        console.warn('Blocked join-user-room mismatch', { socketId: socket.id, userId })
        return
      }
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

    // Join room untuk forum diskusi (wajib member)
    socket.on('join-discussion-room', async (threadId) => {
      try {
        const currentUserId = socket.user?.userId
        if (!currentUserId) return

        const membership = await prisma.discussionMember.findUnique({
          where: { threadId_userId: { threadId, userId: currentUserId } },
          select: { id: true },
        })
        if (!membership) return

        const roomId = `${DISCUSSION_ROOM_PREFIX}${threadId}`
        socket.join(roomId)
        console.log(`User ${socket.id} joined discussion room: ${roomId}`)
      } catch (err) {
        console.error('join-discussion-room error:', err)
      }
    })

    socket.on('leave-discussion-room', (threadId) => {
      const roomId = `${DISCUSSION_ROOM_PREFIX}${threadId}`
      socket.leave(roomId)
      console.log(`User ${socket.id} left discussion room: ${roomId}`)
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


