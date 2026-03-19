import express from 'express'
import multer from 'multer'
import path from 'path'
import { fileURLToPath } from 'url'
import fs from 'fs'
import { randomUUID } from 'crypto'
import { verifyToken, requireRole } from '../../middleware/auth.js'
import { compressImage } from '../../middleware/imageCompress.js'
import {
  createDiscussionValidation,
  listDiscussionsValidation,
  listMessagesValidation,
  sendMessageValidation,
  updateMessageValidation,
  deleteMessageValidation,
  updateDiscussionValidation,
} from './discussionValidation.js'
import {
  listDiscussions,
  getDiscussionById,
  createDiscussion,
  updateDiscussion,
  lockDiscussion,
  unlockDiscussion,
  joinDiscussion,
  leaveDiscussion,
  listMessages,
  sendMessage,
  updateMessage,
  deleteMessage,
} from './discussionController.js'

const router = express.Router()

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const discussionsUploadDir = path.join(__dirname, '../../../uploads/images/discussions')
const discussionMessagesUploadDir = path.join(__dirname, '../../../uploads/images/discussion_messages')

if (!fs.existsSync(discussionsUploadDir)) fs.mkdirSync(discussionsUploadDir, { recursive: true })
if (!fs.existsSync(discussionMessagesUploadDir)) fs.mkdirSync(discussionMessagesUploadDir, { recursive: true })

const fileFilter = (req, file, cb) => {
  const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif']
  if (allowedTypes.includes(file.mimetype)) return cb(null, true)
  return cb(new Error('File type tidak didukung. Hanya file gambar (JPG, PNG, WebP, GIF) yang diperbolehkan.'), false)
}

const handleMulterError = (err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({ error: 'Ukuran file terlalu besar. Maksimal 5MB' })
    }
    return res.status(400).json({ error: err.message })
  }
  if (err) return res.status(400).json({ error: err.message })
  next()
}

const threadUpload = multer({
  storage: multer.diskStorage({
    destination: (req, file, cb) => cb(null, discussionsUploadDir),
    filename: (req, file, cb) => {
      const ext = path.extname(file.originalname)
      cb(null, `${randomUUID()}${ext}`)
    },
  }),
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter,
})

const messageUpload = multer({
  storage: multer.diskStorage({
    destination: (req, file, cb) => cb(null, discussionMessagesUploadDir),
    filename: (req, file, cb) => {
      const ext = path.extname(file.originalname)
      cb(null, `${randomUUID()}${ext}`)
    },
  }),
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter,
})

// Forum diskusi: hanya untuk alumni & pengurus (bukan admin)
router.use(verifyToken)
router.use(requireRole('ALUMNI', 'PENGURUS'))

router.get('/', listDiscussionsValidation, listDiscussions)
router.post('/', threadUpload.single('image'), handleMulterError, createDiscussionValidation, compressImage, createDiscussion)

router.get('/:id', getDiscussionById)
router.put('/:id', threadUpload.single('image'), handleMulterError, updateDiscussionValidation, compressImage, updateDiscussion)

router.post('/:id/join', joinDiscussion)
router.post('/:id/leave', leaveDiscussion)

router.put('/:id/lock', lockDiscussion)
router.put('/:id/unlock', unlockDiscussion)

router.get('/:id/messages', listMessagesValidation, listMessages)
router.post('/:id/messages', messageUpload.single('media'), handleMulterError, sendMessageValidation, compressImage, sendMessage)
router.put('/:id/messages/:messageId', updateMessageValidation, updateMessage)
router.delete('/:id/messages/:messageId', deleteMessageValidation, deleteMessage)

export default router

