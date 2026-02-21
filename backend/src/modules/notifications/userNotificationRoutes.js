import express from 'express'
import { 
  getUserNotifications, 
  markNotificationAsRead, 
  markAllNotificationsAsRead, 
  deleteNotification,
  getUnreadCount
} from './userNotificationController.js'
import { verifyToken } from '../../middleware/auth.js'

const router = express.Router()

// All routes require authentication
router.use(verifyToken)

// Routes
router.get('/', getUserNotifications)
router.get('/unread-count', getUnreadCount)
router.patch('/:id/read', markNotificationAsRead)
router.patch('/read-all', markAllNotificationsAsRead)
router.delete('/:id', deleteNotification)

export default router







