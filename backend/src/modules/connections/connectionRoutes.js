import express from 'express'
import {
  sendConnectionRequest,
  getConnectionRequests,
  acceptConnection,
  rejectConnection,
  getConnectionStatus,
  getConnections
} from './connectionController.js'
import { verifyToken } from '../../middleware/auth.js'

const router = express.Router()

// All routes require authentication
router.use(verifyToken)

// Get connection status with specific user
router.get('/status/:userId', getConnectionStatus)

// Get all accepted connections
router.get('/', getConnections)

// Get connection requests (incoming)
router.get('/requests', getConnectionRequests)

// Send connection request
router.post('/', sendConnectionRequest)

// Accept connection request
router.put('/:id/accept', acceptConnection)

// Reject connection request
router.put('/:id/reject', rejectConnection)

export default router



