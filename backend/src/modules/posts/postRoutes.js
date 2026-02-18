import express from 'express'
import multer from 'multer'
import path from 'path'
import { fileURLToPath } from 'url'
import fs from 'fs'
import { randomUUID } from 'crypto'
import {
  getAllPosts,
  getPostById,
  createPost,
  updatePost,
  deletePost
} from './postController.js'
import { verifyToken, optionalAuth } from '../../middleware/auth.js'
import { compressImage } from '../../middleware/imageCompress.js'
import {
  createPostValidation,
  updatePostValidation
} from './postValidation.js'

const router = express.Router()

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// Setup multer untuk posts
const postsUploadDir = path.join(__dirname, '../../../uploads/images/posts')
if (!fs.existsSync(postsUploadDir)) {
  fs.mkdirSync(postsUploadDir, { recursive: true })
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, postsUploadDir)
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

// Routes
router.get('/', optionalAuth, getAllPosts)
router.get('/:id', optionalAuth, getPostById)
// Urutan penting: multer harus SEBELUM validasi agar req.body tersedia
router.post('/', verifyToken, upload.single('image'), handleMulterError, createPostValidation, compressImage, createPost)
// Upload optional untuk update (bisa update tanpa image)
router.put('/:id', verifyToken, upload.single('image'), handleMulterError, updatePostValidation, compressImage, updatePost)
router.delete('/:id', verifyToken, deletePost)

export default router

