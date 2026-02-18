import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import prisma from '../../config/database.js'
import { body, validationResult } from 'express-validator'
import { generateOTP, createOTPExpiry, verifyOTP } from '../../services/otpService.js'
import { sendOTPEmail, sendAdminNotificationEmail } from '../../services/emailService.js'
import { getImagePath } from '../../utils/fileUtils.js'

// Request OTP untuk registrasi
export const requestOTP = async (req, res) => {
  try {
    const { email } = req.body

    if (!email) {
      return res.status(400).json({ error: 'Email harus diisi' })
    }

    // Validasi format email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      return res.status(400).json({ error: 'Format email tidak valid' })
    }

    // Cek apakah email sudah terdaftar
    const existingUser = await prisma.user.findUnique({
      where: { email }
    })

    if (existingUser && existingUser.emailVerified) {
      return res.status(400).json({ error: 'Email sudah terdaftar' })
    }

    // Generate OTP 6 digit dan expiry time
    const otp = String(generateOTP()).trim()
    const otpExpiry = createOTPExpiry()

    // Simpan OTP ke database (sementara, akan dihapus setelah verifikasi)
    try {
      await prisma.user.upsert({
      where: { email },
      update: {
        otp,
        otpExpiry
      },
      create: {
        email,
        password: 'temp', // Password sementara, akan diupdate saat verifikasi OTP
        nama: 'temp',
        otp,
        otpExpiry,
        role: 'ALUMNI',
        verified: false,
        emailVerified: false
      }
    })
    } catch (dbError) {
      console.error('Database error saving OTP:', dbError)
      if (dbError.code === 'P2002') {
        return res.status(400).json({ 
          error: 'Email atau NIM sudah terdaftar'
        })
      }
      throw dbError
    }

    // Kirim OTP via email
    try {
      await sendOTPEmail(email, otp)
    } catch (emailError) {
      console.error('Error sending OTP email:', emailError)
      return res.status(500).json({ error: 'Gagal mengirim email OTP' })
    }

    res.json({
      message: 'OTP telah dikirim ke email Anda',
      email,
      expiresIn: parseInt(process.env.OTP_EXPIRY_MINUTES || '10')
    })
  } catch (error) {
    console.error('Request OTP error:', error)
    
    // Tangani error Prisma yang spesifik
    if (error.code === 'P2002') {
      return res.status(400).json({ 
        error: 'Email atau NIM sudah terdaftar'
      })
    }
    
    // Respons error umum
    res.status(500).json({ 
      error: 'Terjadi kesalahan saat memproses request OTP',
      ...(process.env.NODE_ENV === 'development' && { details: error.message })
    })
  }
}

// Verifikasi OTP dan selesaikan registrasi
export const verifyOTPAndRegister = async (req, res) => {
  try {
    // Validasi input
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
      const errorMessages = errors.array().map(err => err.msg).join(', ')
      return res.status(400).json({ 
        error: errorMessages,
        errors: errors.array() 
      })
    }

    const { email, otp, password, nama, nim, prodi, angkatan, domisili, whatsapp } = req.body

    // Cari user temporary yang dibuat saat request OTP
    const tempUser = await prisma.user.findUnique({
      where: { email }
    })

    if (!tempUser || !tempUser.otp) {
      return res.status(400).json({ error: 'OTP tidak ditemukan. Silakan request OTP terlebih dahulu.' })
    }

    // Bersihkan OTP dari spasi
    const cleanInputOTP = String(otp).trim().replace(/\s/g, '')
    const cleanStoredOTP = String(tempUser.otp).trim()

    // Verifikasi OTP: cek match dan expiry
    const otpVerification = verifyOTP(cleanStoredOTP, cleanInputOTP, tempUser.otpExpiry)
    if (!otpVerification.valid) {
      return res.status(400).json({ error: otpVerification.message })
    }

    // Cek NIM duplikat jika ada
    if (nim) {
      const existingNIM = await prisma.user.findUnique({
        where: { nim }
      })

      if (existingNIM && existingNIM.email !== email) {
        return res.status(400).json({ error: 'NIM sudah terdaftar' })
      }
    }

    // Hash password sebelum simpan ke database
    const hashedPassword = await bcrypt.hash(password, 10)

    // Update user dengan data lengkap dan hapus OTP
    const user = await prisma.user.update({
      where: { email },
      data: {
        password: hashedPassword,
        nama,
        nim: nim || null,
        prodi: prodi || null,
        angkatan: angkatan ? parseInt(angkatan) : null,
        domisili: domisili || null,
        whatsapp: whatsapp || null,
        emailVerified: true,
        verified: false, // Masih perlu verifikasi admin
        otp: null,
        otpExpiry: null
      },
      select: {
        id: true,
        email: true,
        nama: true,
        nim: true,
        role: true,
        verified: true,
        emailVerified: true,
        createdAt: true
      }
    })

    // Kirim notifikasi ke admin (non-blocking)
    try {
      // Ambil email notifikasi dari settings
      let adminEmails = []
      try {
        const emailSetting = await prisma.setting.findUnique({
          where: { key: 'admin_notification_emails' }
        })
        
        if (emailSetting && emailSetting.type === 'JSON') {
          adminEmails = JSON.parse(emailSetting.value)
        }
      } catch (settingError) {
        console.error('Error reading admin notification emails setting:', settingError)
      }

      // Fallback: jika setting tidak ada, gunakan semua user admin
      if (!adminEmails || adminEmails.length === 0) {
        const admins = await prisma.user.findMany({
          where: { role: 'ADMIN' },
          select: { email: true }
        })
        adminEmails = admins.map(a => a.email)
      }

      // Saring email yang valid
      adminEmails = adminEmails.filter(email => email && email.trim() !== '')

      // Kirim email ke semua admin yang terdaftar
      for (const adminEmail of adminEmails) {
        try {
          await sendAdminNotificationEmail(adminEmail, {
            nama: user.nama,
            email: user.email,
            nim: user.nim,
            prodi: prodi || null,
            angkatan: angkatan || null,
            domisili: domisili || null,
            createdAt: user.createdAt
          })
        } catch (emailError) {
          console.error(`Error sending email to admin ${adminEmail}:`, emailError)
        }
      }

      // Buat notifikasi di database
      await prisma.adminNotification.create({
        data: {
          type: 'NEW_USER_REGISTRATION',
          message: `User baru mendaftar: ${user.nama} (${user.email})`,
          userId: user.id
        }
      })
    } catch (notificationError) {
      console.error('Error creating notification:', notificationError)
      // Jangan gagalkan registrasi jika notifikasi gagal
    }

    // Generate JWT token untuk auto login
    const token = jwt.sign(
      {
        userId: user.id,
        email: user.email,
        role: user.role
      },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
    )

    res.status(201).json({
      message: 'Registrasi berhasil! Email Anda telah terverifikasi. Menunggu verifikasi dari admin.',
      user,
      token
    })
  } catch (error) {
    console.error('Verify OTP and register error:', error)
    
    // Tangani error Prisma yang spesifik
    if (error.code === 'P2002') {
      return res.status(400).json({ 
        error: 'Email atau NIM sudah terdaftar'
      })
    }
    
    if (error.code === 'P2025') {
      return res.status(404).json({ 
        error: 'User tidak ditemukan. Silakan request OTP terlebih dahulu.'
      })
    }
    
    res.status(500).json({ 
      error: 'Terjadi kesalahan saat registrasi',
      ...(process.env.NODE_ENV === 'development' && { details: error.message })
    })
  }
}

// Kirim ulang OTP
export const resendOTP = async (req, res) => {
  try {
    const { email } = req.body

    if (!email) {
      return res.status(400).json({ error: 'Email harus diisi' })
    }

    // Cek apakah email sudah terdaftar dan terverifikasi
    const existingUser = await prisma.user.findUnique({
      where: { email }
    })

    if (existingUser && existingUser.emailVerified) {
      return res.status(400).json({ error: 'Email sudah terverifikasi. Silakan login.' })
    }

    // Generate OTP baru
    const otp = generateOTP()
    const otpExpiry = createOTPExpiry()

    // Update atau create user dengan OTP baru
    await prisma.user.upsert({
      where: { email },
      update: {
        otp,
        otpExpiry
      },
      create: {
        email,
        password: 'temp',
        nama: 'temp',
        otp,
        otpExpiry,
        role: 'ALUMNI',
        verified: false,
        emailVerified: false
      }
    })

    // Kirim email OTP
    try {
      await sendOTPEmail(email, otp)
    } catch (emailError) {
      console.error('Error sending OTP email:', emailError)
      return res.status(500).json({ error: 'Gagal mengirim email OTP' })
    }

    res.json({
      message: 'OTP telah dikirim ulang ke email Anda',
      email,
      expiresIn: parseInt(process.env.OTP_EXPIRY_MINUTES || '10')
    })
  } catch (error) {
    console.error('Resend OTP error:', error)
    
    if (error.code === 'P2002') {
      return res.status(400).json({ 
        error: 'Email atau NIM sudah terdaftar'
      })
    }
    
    res.status(500).json({ 
      error: 'Terjadi kesalahan saat mengirim ulang OTP',
      ...(process.env.NODE_ENV === 'development' && { details: error.message })
    })
  }
}

// Login user
export const login = async (req, res) => {
  try {
    const { email, password } = req.body

    if (!email || !password) {
      return res.status(400).json({ error: 'Email dan password harus diisi' })
    }

    // Cari user berdasarkan email
    const user = await prisma.user.findUnique({
      where: { email }
    })

    if (!user) {
      return res.status(401).json({ error: 'Email atau password salah' })
    }

    // Cek email sudah terverifikasi (kecuali ADMIN)
    if (!user.emailVerified && user.role !== 'ADMIN') {
      return res.status(401).json({ error: 'Email belum terverifikasi. Silakan verifikasi email terlebih dahulu.' })
    }

    // Verifikasi password dengan bcrypt
    const isPasswordValid = await bcrypt.compare(password, user.password)

    if (!isPasswordValid) {
      return res.status(401).json({ error: 'Email atau password salah' })
    }

    // Generate JWT token (berlaku 7 hari)
    const token = jwt.sign(
      {
        userId: user.id,
        email: user.email,
        role: user.role
      },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
    )

    // Generate refresh token (berlaku 30 hari)
    const refreshToken = jwt.sign(
      { userId: user.id },
      process.env.JWT_REFRESH_SECRET,
      { expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '30d' }
    )

    // Get user profile
    const profile = await prisma.profile.findUnique({
      where: { userId: user.id },
      select: {
        fotoProfil: true,
        profesi: true,
        skill: true
      }
    })

    // Return token dan user data (tanpa password)
    const userData = {
      id: user.id,
      email: user.email,
      nama: user.nama,
      nim: user.nim,
      role: user.role,
      verified: user.verified,
      profile: profile ? {
        fotoProfil: profile.fotoProfil,
        profesi: profile.profesi,
        skill: profile.skill
      } : null
    }

    // Format image path jika ada
    if (userData.profile?.fotoProfil) {
      userData.profile.fotoProfil = getImagePath(userData.profile.fotoProfil, 'profiles')
    }

    res.json({
      message: 'Login berhasil',
      token,
      refreshToken,
      user: userData
    })
  } catch (error) {
    console.error('Login error:', error)
    res.status(500).json({ error: 'Terjadi kesalahan saat login' })
  }
}

// Ambil data user saat ini
export const getMe = async (req, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.userId },
      select: {
        id: true,
        email: true,
        nama: true,
        nim: true,
        prodi: true,
        angkatan: true,
        domisili: true,
        whatsapp: true,
        role: true,
        verified: true,
        emailVerified: true,
        createdAt: true,
        profile: {
          select: {
            fotoProfil: true,
            profesi: true,
            skill: true
          }
        }
      }
    })

    if (!user) {
      return res.status(404).json({ error: 'User tidak ditemukan' })
    }

    // Format image path jika ada
    if (user.profile?.fotoProfil) {
      user.profile.fotoProfil = getImagePath(user.profile.fotoProfil, 'profiles')
    }

    res.json({ user })
  } catch (error) {
    console.error('Get me error:', error)
    res.status(500).json({ error: 'Terjadi kesalahan' })
  }
}

