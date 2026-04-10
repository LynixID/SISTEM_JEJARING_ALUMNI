import express from 'express'
import {
  createReport,
  getAllReports,
  getReportById,
  updateReportStatus,
  deleteReportedContent,
  getReportStatistics
} from './reportController.js'
import { verifyToken, requireRole } from '../../middleware/auth.js'

const router = express.Router()

// ─── User Routes (harus login) ────────────────────────────────────────────
router.post('/', verifyToken, createReport)

// ─── Admin Routes ─────────────────────────────────────────────────────────
router.get('/', verifyToken, requireRole('ADMIN'), getAllReports)
router.get('/statistics', verifyToken, requireRole('ADMIN'), getReportStatistics)
router.get('/:id', verifyToken, requireRole('ADMIN'), getReportById)
router.patch('/:id/status', verifyToken, requireRole('ADMIN'), updateReportStatus)
router.delete('/:id/content', verifyToken, requireRole('ADMIN'), deleteReportedContent)

export default router
