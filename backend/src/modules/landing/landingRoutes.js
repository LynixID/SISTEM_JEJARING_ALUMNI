import express from 'express'
import { getLandingData } from './landingController.js'

const router = express.Router()

// Public route - tidak perlu auth
router.get('/data', getLandingData)

export default router
