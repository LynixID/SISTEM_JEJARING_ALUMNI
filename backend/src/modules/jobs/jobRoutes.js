import express from 'express'
import multer from 'multer'
import path from 'path'
import { fileURLToPath } from 'url'
import fs from 'fs'
import { randomUUID } from 'crypto'
import { verifyToken, requireRole } from '../../middleware/auth.js'
import { compressImage } from '../../middleware/imageCompress.js'
import {
  listJobsValidation,
  createJobValidation,
  approveRejectValidation,
} from './jobValidation.js'
import {
  listApprovedJobs,
  listPendingJobs,
  createJob,
  approveJob,
  rejectJob,
  deleteMyJob,
} from './jobController.js'

const router = express.Router()

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const jobsUploadDir = path.join(__dirname, '../../../uploads/images/jobs')
if (!fs.existsSync(jobsUploadDir)) fs.mkdirSync(jobsUploadDir, { recursive: true })

const fileFilter = (req, file, cb) => {
  const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif']
  if (allowedTypes.includes(file.mimetype)) return cb(null, true)
  return cb(new Error('File type tidak didukung. Hanya file gambar (JPG, PNG, WebP, GIF) yang diperbolehkan.'), false)
}

const upload = multer({
  storage: multer.diskStorage({
    destination: (req, file, cb) => cb(null, jobsUploadDir),
    filename: (req, file, cb) => {
      const ext = path.extname(file.originalname)
      cb(null, `${randomUUID()}${ext}`)
    },
  }),
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter,
})

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

// Semua endpoint lowongan: hanya alumni & pengurus
router.use(verifyToken)
router.use(requireRole('ALUMNI', 'PENGURUS'))

// Tab Lowongan (yang sudah disetujui)
router.get('/', listJobsValidation, listApprovedJobs)

// Tab Menunggu Persetujuan:
// - Alumni: pending milik sendiri
// - Pengurus: semua pending
router.get('/pending', listPendingJobs)

// Alumni membuat lowongan (default PENDING, pengurus auto-approved)
router.post('/', upload.single('image'), handleMulterError, createJobValidation, compressImage, createJob)

// Approve/Reject (pengurus)
router.put('/:id/approve', requireRole('PENGURUS'), approveRejectValidation, approveJob)
router.put('/:id/reject', requireRole('PENGURUS'), approveRejectValidation, rejectJob)

// Delete lowongan sendiri (hanya jika belum approved)
router.delete('/:id', deleteMyJob)

export default router

