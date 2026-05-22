import express from 'express'
import { verifyToken } from '../../middleware/auth.js'
import {
  getAllDisplayItems,
  getDisplayItemsByKategori,
  createDisplayItem,
  updateDisplayItem,
  deleteDisplayItem,
  reorderDisplayItems,
  getActiveEmail
} from './displayHomePageController.js'

const router = express.Router()

// Middleware untuk cek admin
const requireAdmin = (req, res, next) => {
  if (req.user?.role !== 'ADMIN') {
    return res.status(403).json({
      success: false,
      message: 'Akses ditolak. Hanya admin yang dapat mengakses.'
    })
  }
  next()
}

// Public routes
router.get('/kategori/:kategori', getDisplayItemsByKategori)
router.get('/email/active', getActiveEmail)

// Admin routes
router.get('/', verifyToken, requireAdmin, getAllDisplayItems)
router.post('/', verifyToken, requireAdmin, createDisplayItem)
router.put('/:id', verifyToken, requireAdmin, updateDisplayItem)
router.delete('/:id', verifyToken, requireAdmin, deleteDisplayItem)
router.post('/reorder', verifyToken, requireAdmin, reorderDisplayItems)

export default router
