import express from 'express'
import { getAllUsers, getUserById, verifyUser, rejectUser, updateUserRole, getStatistics } from './adminController.js'
import { verifyToken, requireRole } from '../../middleware/auth.js'

const router = express.Router()

// All routes require authentication and admin role
router.use(verifyToken)
router.use(requireRole('ADMIN'))

// Routes
router.get('/users', getAllUsers)
router.get('/users/:id', getUserById)
router.get('/statistics', getStatistics)
router.patch('/users/:id/verify', verifyUser)
router.patch('/users/:id/reject', rejectUser)
router.patch('/users/:id/role', updateUserRole)

export default router

