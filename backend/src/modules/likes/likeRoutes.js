import express from 'express'
import { toggleLike, getLikes } from './likeController.js'
import { verifyToken, optionalAuth } from '../../middleware/auth.js'

const router = express.Router()

// Routes
router.post('/posts/:postId/like', verifyToken, toggleLike)
router.get('/posts/:postId/likes', optionalAuth, getLikes)

export default router


