import express from 'express'
import { sendContactEmail } from './contactController.js'

const router = express.Router()

// Public route - kirim email kontak
router.post('/send', sendContactEmail)

export default router