import express from 'express'
import multer from 'multer'
import path from 'path'
import { fileURLToPath } from 'url'
import fs from 'fs'
import { randomUUID } from 'crypto'
import {
  getConversations,
  getMessages,
  sendMessage,
  deleteMessage,
  markAsRead
} from './messageController.js'
import { verifyToken } from '../../middleware/auth.js'
import { compressImage } from '../../middleware/imageCompress.js'

const router = express.Router()

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// Setup multer untuk messages
const messagesUploadDir = path.join(__dirname, '../../../uploads/images/messages')
if (!fs.existsSync(messagesUploadDir)) {
  fs.mkdirSync(messagesUploadDir, { recursive: true })
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, messagesUploadDir)
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname)
    const filename = `${randomUUID()}${ext}`
    cb(null, filename)
  }
})

const fileFilter = (req, file, cb) => {
  const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif']
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true)
  } else {
    cb(new Error('File type tidak didukung. Hanya file gambar (JPG, PNG, WebP, GIF) yang diperbolehkan.'), false)
  }
}

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB
  },
  fileFilter: fileFilter
})

// Error handler untuk multer
const handleMulterError = (err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({ error: 'Ukuran file terlalu besar. Maksimal 5MB' })
    }
    return res.status(400).json({ error: err.message })
  }
  if (err) {
    return res.status(400).json({ error: err.message })
  }
  next()
}

// Routes - semua memerlukan authentication
router.get('/conversations', verifyToken, getConversations)
router.get('/:userId', verifyToken, getMessages)
router.post('/', verifyToken, upload.single('media'), handleMulterError, compressImage, sendMessage)
router.delete('/:id', verifyToken, deleteMessage)
router.put('/:userId/read', verifyToken, markAsRead)

export default router

