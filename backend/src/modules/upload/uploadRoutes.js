import express from 'express'
import { upload, uploadImage, deleteImage } from './uploadController.js'
import { verifyToken } from '../../middleware/auth.js'

const router = express.Router()

// Upload gambar - perlu autentikasi
// Kompresi ditangani di controller setelah file disimpan ke folder yang benar
router.post('/image', verifyToken, upload.single('image'), uploadImage)

// Hapus gambar - perlu autentikasi
router.delete('/image', verifyToken, deleteImage)

export default router

