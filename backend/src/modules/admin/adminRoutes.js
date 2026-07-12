import express from 'express'
import multer from 'multer'

const uploadMemory = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 } // limit 5MB
})
import { 
  getAllUsers, 
  getUserById, 
  createUserByAdmin,
  updateUserByAdmin,
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
  deleteUser,
  exportUsers,
  getUserFilterOptions,
  getStorageStats,
  listFiles,
  deleteFile,
  auditOrphanedFiles,
  moveToTrash,
  listTrash,
  restoreFromTrash,
  emptyTrash,
  deleteTrashFile,
  getAllPostsByAdmin,
  deletePostByAdmin,
  getAllThreadsByAdmin,
  deleteThreadByAdmin,
  getAllJobsByAdmin,
  approveJobByAdmin,
  rejectJobByAdmin,
  deleteJobByAdmin,
  getAllAdmins,
  createAdminByAdmin,
  deleteAdminById,
  updateAdminById,
  getImportTemplate,
  importUsers
} from './adminController.js'
import { verifyToken, requireRole } from '../../middleware/auth.js'

const router = express.Router()

// All routes require authentication and admin role
router.use(verifyToken)
router.use(requireRole('ADMIN'))

// User Management
router.get('/users/export', exportUsers)
router.get('/users/import-template', getImportTemplate)
router.post('/users/import', uploadMemory.single('file'), importUsers)
router.get('/users/filter-options', getUserFilterOptions)
router.post('/users', createUserByAdmin)
router.get('/users', getAllUsers)
router.get('/users/:id', getUserById)
router.put('/users/:id', updateUserByAdmin)
router.get('/statistics', getStatistics)
router.get('/statistics/advanced', getAdvancedStatistics)
router.patch('/users/:id/verify', verifyUser)
router.patch('/users/:id/reject', rejectUser)
router.patch('/users/:id/role', updateUserRole)

// Post Management
router.get('/posts', getAllPostsByAdmin)
router.delete('/posts/:id', deletePostByAdmin)

// Forum Management
router.get('/threads', getAllThreadsByAdmin)
router.delete('/threads/:id', deleteThreadByAdmin)

// Job Management
router.get('/jobs', getAllJobsByAdmin)
router.patch('/jobs/:id/approve', approveJobByAdmin)
router.patch('/jobs/:id/reject', rejectJobByAdmin)
router.delete('/jobs/:id', deleteJobByAdmin)

// Comment Management
router.get('/comments', getAllComments)
router.delete('/comments/:id', deleteCommentByAdmin)
router.delete('/comments', bulkDeleteCommentsByAdmin)

// User Suspension
router.patch('/users/:id/suspend', suspendUser)
router.patch('/users/:id/unsuspend', unsuspendUser)
router.delete('/users/:id', deleteUser)

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

// Admin Management
router.get('/admins', getAllAdmins)
router.post('/admins', createAdminByAdmin)
router.patch('/admins/:id', updateAdminById)
router.delete('/admins/:id', deleteAdminById)


export default router

