import express from 'express'
import { 
  getAllEvents, 
  getEventById, 
  createEvent, 
  updateEvent, 
  deleteEvent,
  togglePublish,
  registerEvent,
  unregisterEvent,
  getEventParticipants
} from './eventController.js'
import { verifyToken, optionalAuth } from '../../middleware/auth.js'
import { 
  createEventValidation, 
  updateEventValidation 
} from './eventValidation.js'

const router = express.Router()

// Rute publik (auth opsional - akan mengisi req.user jika token ada)
router.get('/', optionalAuth, getAllEvents)
router.get('/:id', optionalAuth, getEventById)

// Rute terlindungi (wajib auth)
router.post('/', 
  verifyToken, 
  createEventValidation, 
  createEvent
)

router.put('/:id', 
  verifyToken, 
  updateEventValidation, 
  updateEvent
)

router.delete('/:id', 
  verifyToken, 
  deleteEvent
)

router.put('/:id/publish', 
  verifyToken, 
  togglePublish
)

router.post('/:id/register', 
  verifyToken, 
  registerEvent
)

router.delete('/:id/register', 
  verifyToken, 
  unregisterEvent
)

router.get('/:id/participants', 
  verifyToken, 
  getEventParticipants
)

export default router

