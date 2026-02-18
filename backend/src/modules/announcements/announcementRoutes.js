import express from 'express'
import { 
  getAllAnnouncements, 
  getAnnouncementById, 
  createAnnouncement, 
  updateAnnouncement, 
  deleteAnnouncement,
  togglePublish
} from './announcementController.js'
import { verifyToken, optionalAuth } from '../../middleware/auth.js'
import { 
  createAnnouncementValidation, 
  updateAnnouncementValidation 
} from './announcementValidation.js'

const router = express.Router()

// Public routes (optional auth - will set req.user if token exists)
router.get('/', optionalAuth, getAllAnnouncements)
router.get('/:id', optionalAuth, getAnnouncementById)

// Protected routes (require auth)
router.post('/', 
  verifyToken, 
  createAnnouncementValidation, 
  createAnnouncement
)

router.put('/:id', 
  verifyToken, 
  updateAnnouncementValidation, 
  updateAnnouncement
)

router.delete('/:id', 
  verifyToken, 
  deleteAnnouncement
)

router.put('/:id/publish', 
  verifyToken, 
  togglePublish
)

export default router

