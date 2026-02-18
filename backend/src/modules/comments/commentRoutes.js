import express from 'express'
import {
  getComments,
  createComment,
  updateComment,
  deleteComment
} from './commentController.js'
import { verifyToken } from '../../middleware/auth.js'
import {
  createCommentValidation,
  updateCommentValidation
} from './commentValidation.js'

const router = express.Router()

// Routes
// Get dan create comments untuk post tertentu (akan di-mount di /api/posts)
router.get('/:postId/comments', getComments)
router.post('/:postId/comments', verifyToken, createCommentValidation, createComment)

// Update dan delete comment by ID (akan di-mount di /api/comments)
router.put('/:id', verifyToken, updateCommentValidation, updateComment)
router.delete('/:id', verifyToken, deleteComment)

export default router

