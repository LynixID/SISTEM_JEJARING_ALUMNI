import express from 'express'
import { body } from 'express-validator'
import { requestOTP, verifyOTPAndRegister, resendOTP, login, getMe } from './authController.js'
import { verifyToken } from '../../middleware/auth.js'
import { otpRateLimiter, verifyOTPRateLimiter, loginRateLimiter } from '../../middleware/rateLimiter.js'

const router = express.Router()

// Validation rules
const requestOTPValidation = [
  body('email').isEmail().withMessage('Email tidak valid')
]

// Validasi untuk verify OTP dan registrasi
const verifyOTPValidation = [
  // Required fields
  body('email')
    .isEmail()
    .withMessage('Email tidak valid'),
  body('otp')
    .isLength({ min: 6, max: 6 })
    .withMessage('OTP harus 6 digit')
    .matches(/^\d+$/)
    .withMessage('OTP harus berupa angka'),
  body('password')
    .isLength({ min: 6, max: 100 })
    .withMessage('Password minimal 6 karakter dan maksimal 100 karakter'),
  body('nama')
    .trim()
    .notEmpty()
    .withMessage('Nama harus diisi')
    .isLength({ min: 2, max: 100 })
    .withMessage('Nama harus antara 2-100 karakter'),
  
  // Optional fields
  body('nim')
    .optional({ nullable: true, checkFalsy: true })
    .trim()
    .isString()
    .isLength({ min: 8, max: 20 })
    .withMessage('NIM harus antara 8-20 karakter')
    .matches(/^[0-9]+$/)
    .withMessage('NIM harus berupa angka'),
  body('prodi')
    .optional({ nullable: true, checkFalsy: true })
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('Program studi harus antara 2-100 karakter'),
  body('angkatan')
    .optional({ nullable: true, checkFalsy: true })
    .custom((value) => {
      if (!value) return true
      const num = parseInt(value)
      if (isNaN(num)) return false
      return num >= 1945 && num <= new Date().getFullYear() + 1
    })
    .withMessage(`Angkatan harus antara 1945-${new Date().getFullYear() + 1}`),
  body('domisili')
    .optional({ nullable: true, checkFalsy: true })
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('Domisili harus antara 2-100 karakter'),
  body('whatsapp')
    .optional({ nullable: true, checkFalsy: true })
    .trim()
    .matches(/^(08|628)[0-9]{9,12}$/)
    .withMessage('Nomor WhatsApp tidak valid. Format: 08xxxxxxxxxx atau 628xxxxxxxxxx'),
  body('profesi')
    .optional({ nullable: true, checkFalsy: true })
    .trim()
    .isLength({ max: 100 })
    .withMessage('Profesi maksimal 100 karakter'),
]

const resendOTPValidation = [
  body('email').isEmail().withMessage('Email tidak valid')
]

const loginValidation = [
  body('email').isEmail().withMessage('Email tidak valid'),
  body('password').notEmpty().withMessage('Password harus diisi'),
]

// Routes dengan rate limiting dan validasi
router.post('/register/request-otp', otpRateLimiter, requestOTPValidation, requestOTP)
router.post('/register/verify-otp', verifyOTPRateLimiter, verifyOTPValidation, verifyOTPAndRegister)
router.post('/register/resend-otp', otpRateLimiter, resendOTPValidation, resendOTP)
router.post('/login', loginRateLimiter, loginValidation, login)
router.get('/me', verifyToken, getMe)

export default router

