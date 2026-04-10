import express from 'express'
import { 
  getAllUsers, 
  getUserById, 
  verifyUser, 
  rejectUser, 
  updateUserRole, 
  getStatistics,
  getAdvancedStatistics,
  getAllComments,
  deleteCommentByAdmin,
  bulkDeleteCommentsByAdmin,
  suspendUser,
  unsuspendUser,
  getStorageStats,
  listFiles,
  deleteFile,
  auditOrphanedFiles,
  moveToTrash,
  listTrash,
  restoreFromTrash,
  emptyTrash,
  deleteTrashFile
} from './adminController.js'
import { verifyToken, requireRole } from '../../middleware/auth.js'

const router = express.Router()

// All routes require authentication and admin role
router.use(verifyToken)
router.use(requireRole('ADMIN'))

// Routes
router.get('/users', getAllUsers)
router.get('/users/:id', getUserById)
router.get('/statistics', getStatistics)
router.get('/statistics/advanced', getAdvancedStatistics)
router.patch('/users/:id/verify', verifyUser)
router.patch('/users/:id/reject', rejectUser)
router.patch('/users/:id/role', updateUserRole)

// Comment Management
router.get('/comments', getAllComments)
router.delete('/comments/:id', deleteCommentByAdmin)
router.delete('/comments', bulkDeleteCommentsByAdmin)
// User Suspension
router.patch('/users/:id/suspend', suspendUser)
router.patch('/users/:id/unsuspend', unsuspendUser)

// File Management
router.get('/files/stats', getStorageStats)
router.get('/files', listFiles)
router.delete('/files', deleteFile)
router.get('/files/audit', auditOrphanedFiles)
router.post('/files/trash', moveToTrash)
router.get('/files/trash', listTrash)
router.post('/files/restore', restoreFromTrash)
router.delete('/files/trash', emptyTrash)
router.delete('/files/trash/single', deleteTrashFile)


export default router

