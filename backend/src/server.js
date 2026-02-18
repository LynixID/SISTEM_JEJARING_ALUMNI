import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import dotenv from 'dotenv'
import { createServer } from 'http'
import { initSocket } from './config/socket.js'
import path from 'path'
import { fileURLToPath } from 'url'

// Import route modules
import authRoutes from './modules/auth/authRoutes.js'
import adminRoutes from './modules/admin/adminRoutes.js'
import notificationRoutes from './modules/notifications/notificationRoutes.js'
import userNotificationRoutes from './modules/notifications/userNotificationRoutes.js'
import settingsRoutes from './modules/settings/settingsRoutes.js'
import announcementRoutes from './modules/announcements/announcementRoutes.js'
import eventRoutes from './modules/events/eventRoutes.js'
import uploadRoutes from './modules/upload/uploadRoutes.js'
import postRoutes from './modules/posts/postRoutes.js'
import commentRoutes from './modules/comments/commentRoutes.js'
import likeRoutes from './modules/likes/likeRoutes.js'
import userRoutes from './modules/users/userRoutes.js'
import connectionRoutes from './modules/connections/connectionRoutes.js'

// Load environment variables
dotenv.config()

// Initialize Express app and HTTP server
const app = express()
const server = createServer(app)

// Setup Socket.io untuk real-time communication
initSocket(server)

// Middleware: security headers, CORS, body parser
// Konfigurasi Helmet untuk mengizinkan akses ke static files
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" },
  crossOriginEmbedderPolicy: false,
}))

app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true,
}))
app.use(express.json())
app.use(express.urlencoded({ extended: true }))

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    message: 'Server is running',
    timestamp: new Date().toISOString()
  })
})

// Serve static files (gambar upload)
// Pastikan static files bisa diakses dengan CORS headers
const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// Middleware untuk menambahkan CORS headers ke static files
app.use('/uploads', (req, res, next) => {
  res.header('Access-Control-Allow-Origin', process.env.FRONTEND_URL || 'http://localhost:5173')
  res.header('Access-Control-Allow-Methods', 'GET, OPTIONS')
  res.header('Access-Control-Allow-Headers', 'Content-Type')
  res.header('Cross-Origin-Resource-Policy', 'cross-origin')
  next()
}, express.static(path.join(__dirname, '../uploads')))

// Register route modules
app.use('/api/auth', authRoutes)
app.use('/api/admin', adminRoutes)
app.use('/api/admin/notifications', notificationRoutes)
app.use('/api/notifications', userNotificationRoutes)
app.use('/api/settings', settingsRoutes)
app.use('/api/announcements', announcementRoutes)
app.use('/api/events', eventRoutes)
app.use('/api/upload', uploadRoutes)
app.use('/api/posts', postRoutes)
// Comment routes: get/create di /api/posts/:postId/comments, update/delete di /api/comments/:id
app.use('/api/posts', commentRoutes) // Untuk get dan create comments
app.use('/api/comments', commentRoutes) // Untuk update dan delete comments
app.use('/api', likeRoutes)
app.use('/api/users', userRoutes)
app.use('/api/connections', connectionRoutes)

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' })
})

// Error handler middleware
app.use((err, req, res, next) => {
  console.error('Error:', err.stack)
  res.status(err.status || 500).json({ 
    error: err.message || 'Something went wrong!',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  })
})

const PORT = process.env.PORT || 5000

server.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`)
  console.log(`📡 Socket.io initialized`)
  console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`)
  console.log(`🔗 Frontend URL: ${process.env.FRONTEND_URL || 'http://localhost:5173'}`)
})

