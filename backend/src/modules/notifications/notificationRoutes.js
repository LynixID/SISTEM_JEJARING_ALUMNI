import express from 'express'
import { getNotifications, markAsRead, markAllAsRead, deleteNotification } from './notificationController.js'
import { verifyToken, requireRole } from '../../middleware/auth.js'

const router = express.Router()

// All routes require authentication and admin role
router.use(verifyToken)
router.use(requireRole('ADMIN'))

// Routes
router.get('/', getNotifications)
router.patch('/:id/read', markAsRead)
router.patch('/read-all', markAllAsRead)
router.delete('/:id', deleteNotification)

export default router


