import express from 'express'
import { getTourStatus, completeTour } from './tourController.js'
import { verifyToken } from '../../middleware/auth.js'

const router = express.Router()

// GET /api/tour/status?keys=dashboard,berita,chat
// Cek status tur untuk satu atau banyak tourKey
router.get('/status', verifyToken, getTourStatus)

// POST /api/tour/complete
// Tandai tur sebagai selesai (idempotent)
router.post('/complete', verifyToken, completeTour)

export default router
