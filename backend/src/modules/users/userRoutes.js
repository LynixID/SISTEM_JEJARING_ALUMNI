import express from 'express'
import multer from 'multer'
import path from 'path'
import { fileURLToPath } from 'url'
import fs from 'fs'
import { randomUUID } from 'crypto'
import {
  getUserProfile,
  updateUserProfile,
  updateUserBasicInfo,
  getUsers,
  getUserById
} from './userController.js'
import { verifyToken, optionalAuth } from '../../middleware/auth.js'
import { compressImage } from '../../middleware/imageCompress.js'
import {
  updateProfileValidation,
  updateBasicInfoValidation,
  getUsersValidation
} from './userValidation.js'

const router = express.Router()

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// Setup multer untuk profiles
const profilesUploadDir = path.join(__dirname, '../../../uploads/images/profiles')
if (!fs.existsSync(profilesUploadDir)) {
  fs.mkdirSync(profilesUploadDir, { recursive: true })
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, profilesUploadDir)
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
    if (err.code === 'LIMIT_UNEXPECTED_FILE') {
      return res.status(400).json({ error: 'Field name tidak valid' })
    }
    return res.status(400).json({ error: err.message })
  }
  if (err) {
    return res.status(400).json({ error: err.message })
  }
  next()
}

// Routes

// Get users list (untuk direktori alumni) - public atau authenticated
router.get('/', optionalAuth, getUsersValidation, getUsers)

// Get user by ID (untuk detail alumni) - public atau authenticated
router.get('/:id', optionalAuth, getUserById)

// Get user profile - authenticated
router.get('/:id/profile', verifyToken, getUserProfile)

// Update user basic info (nama, whatsapp, domisili) - authenticated
router.put('/:id', verifyToken, updateBasicInfoValidation, updateUserBasicInfo)

// Update user profile (dengan upload foto profil dan cover photo) - authenticated
// Support multiple files: fotoProfil dan coverPhoto
router.put(
  '/:id/profile',
  verifyToken,
  upload.fields([
    { name: 'fotoProfil', maxCount: 1 },
    { name: 'coverPhoto', maxCount: 1 }
  ]),
  handleMulterError,
  updateProfileValidation,
  compressImage,
  updateUserProfile
)

export default router

