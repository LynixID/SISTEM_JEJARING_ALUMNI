import express from 'express'
import { verifyToken } from '../../middleware/auth.js'
import {
  getUnreadCount,
  markAnnouncementAsRead,
  markEventAsRead,
  getReadStatus
} from './readController.js'

const router = express.Router()

// Get unread count
router.get('/unread-count', verifyToken, getUnreadCount)

// Get read status untuk multiple items
router.post('/read-status', verifyToken, getReadStatus)

// Mark announcement as read
router.post('/announcements/:id/read', verifyToken, markAnnouncementAsRead)

// Mark event as read
router.post('/events/:id/read', verifyToken, markEventAsRead)

export default router

