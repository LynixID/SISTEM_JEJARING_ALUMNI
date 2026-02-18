import prisma from '../../config/database.js'
import { validationResult } from 'express-validator'
import { getImagePath, extractFilename } from '../../utils/fileUtils.js'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const profilesUploadDir = path.join(__dirname, '../../../uploads/images/profiles')

// Helper function untuk delete image file
const deleteImageFile = (filename) => {
  if (!filename) return
  
  try {
    const filePath = path.join(profilesUploadDir, filename)
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath)
      console.log(`Deleted image: ${filename}`)
    }
  } catch (error) {
    console.error(`Error deleting image ${filename}:`, error)
  }
}

// Get user profile by userId
export const getUserProfile = async (req, res) => {
  try {
    const { id } = req.params
    const userId = id || req.user?.userId

    const user = await prisma.user.findUnique({
      where: { id: userId },
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
        createdAt: true,
        profile: {
          select: {
            id: true,
            fotoProfil: true,
            coverPhoto: true,
            profesi: true,
            perusahaan: true,
            jabatan: true,
            skill: true,
            sosialMedia: true,
            portfolio: true,
            experience: true,
            education: true,
            certifications: true,
            languages: true,
            createdAt: true,
            updatedAt: true
          }
        }
      }
    })

    if (!user) {
      return res.status(404).json({ error: 'User tidak ditemukan' })
    }

    // Format image paths
    if (user.profile) {
      if (user.profile.fotoProfil) {
        user.profile.fotoProfil = getImagePath(user.profile.fotoProfil, 'profiles')
      }
      if (user.profile.coverPhoto) {
        user.profile.coverPhoto = getImagePath(user.profile.coverPhoto, 'profiles')
      }
    }

    res.json({ user })
  } catch (error) {
    console.error('Get user profile error:', error)
    res.status(500).json({ error: 'Terjadi kesalahan' })
  }
}

// Update user profile
export const updateUserProfile = async (req, res) => {
  try {
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() })
    }

    const { id } = req.params
    const userId = id || req.user?.userId
    const currentUserId = req.user?.userId

    // Cek authorization: hanya bisa edit profil sendiri (kecuali admin)
    if (userId !== currentUserId && req.user?.role !== 'ADMIN') {
      return res.status(403).json({ error: 'Tidak memiliki akses untuk mengedit profil ini' })
    }

    const {
      profesi,
      perusahaan,
      jabatan,
      skill,
      sosialMedia,
      portfolio,
      experience,
      education,
      certifications,
      languages
    } = req.body

    // Parse JSON fields jika ada
    let parsedSosialMedia = null
    let parsedPortfolio = null
    let parsedExperience = null
    let parsedEducation = null
    let parsedCertifications = null
    let parsedLanguages = null

    if (sosialMedia) {
      try {
        parsedSosialMedia = typeof sosialMedia === 'string' ? JSON.parse(sosialMedia) : sosialMedia
      } catch (e) {
        return res.status(400).json({ error: 'Format sosialMedia tidak valid' })
      }
    }

    if (portfolio) {
      try {
        parsedPortfolio = typeof portfolio === 'string' ? JSON.parse(portfolio) : portfolio
      } catch (e) {
        return res.status(400).json({ error: 'Format portfolio tidak valid' })
      }
    }

    if (experience) {
      try {
        parsedExperience = typeof experience === 'string' ? JSON.parse(experience) : experience
      } catch (e) {
        return res.status(400).json({ error: 'Format experience tidak valid' })
      }
    }

    if (education) {
      try {
        parsedEducation = typeof education === 'string' ? JSON.parse(education) : education
      } catch (e) {
        return res.status(400).json({ error: 'Format education tidak valid' })
      }
    }

    if (certifications) {
      try {
        parsedCertifications = typeof certifications === 'string' ? JSON.parse(certifications) : certifications
      } catch (e) {
        return res.status(400).json({ error: 'Format certifications tidak valid' })
      }
    }

    if (languages) {
      try {
        parsedLanguages = typeof languages === 'string' ? JSON.parse(languages) : languages
      } catch (e) {
        return res.status(400).json({ error: 'Format languages tidak valid' })
      }
    }

    // Cek apakah profile sudah ada
    const existingProfile = await prisma.profile.findUnique({
      where: { userId }
    })

    // Handle file uploads
    let fotoProfilFilename = null
    let coverPhotoFilename = null

    // Handle multiple files (req.files from upload.fields())
    if (req.files) {
      if (req.files.fotoProfil && req.files.fotoProfil[0]) {
        fotoProfilFilename = extractFilename(req.files.fotoProfil[0].filename || req.files.fotoProfil[0].path)
        
        // Delete old foto profil jika ada
        if (existingProfile?.fotoProfil) {
          deleteImageFile(existingProfile.fotoProfil)
        }
      }
      if (req.files.coverPhoto && req.files.coverPhoto[0]) {
        coverPhotoFilename = extractFilename(req.files.coverPhoto[0].filename || req.files.coverPhoto[0].path)
        
        // Delete old cover photo jika ada
        if (existingProfile?.coverPhoto) {
          deleteImageFile(existingProfile.coverPhoto)
        }
      }
    }

    // Handle single file upload (backward compatibility)
    if (req.file && !fotoProfilFilename) {
      fotoProfilFilename = extractFilename(req.file.filename || req.file.path)
      if (existingProfile?.fotoProfil) {
        deleteImageFile(existingProfile.fotoProfil)
      }
    }

    // Prepare update data
    const updateData = {}
    if (profesi !== undefined) updateData.profesi = profesi || null
    if (perusahaan !== undefined) updateData.perusahaan = perusahaan || null
    if (jabatan !== undefined) updateData.jabatan = jabatan || null
    if (skill !== undefined) updateData.skill = skill || null
    if (parsedSosialMedia !== null) updateData.sosialMedia = parsedSosialMedia
    if (parsedPortfolio !== null) updateData.portfolio = parsedPortfolio
    if (parsedExperience !== null) updateData.experience = parsedExperience
    if (parsedEducation !== null) updateData.education = parsedEducation
    if (parsedCertifications !== null) updateData.certifications = parsedCertifications
    if (parsedLanguages !== null) updateData.languages = parsedLanguages
    if (fotoProfilFilename) updateData.fotoProfil = fotoProfilFilename
    if (coverPhotoFilename) updateData.coverPhoto = coverPhotoFilename

    // Update or create profile
    let profile
    if (existingProfile) {
      profile = await prisma.profile.update({
        where: { userId },
        data: updateData,
        include: {
          user: {
            select: {
              id: true,
              nama: true,
              email: true
            }
          }
        }
      })
    } else {
      profile = await prisma.profile.create({
        data: {
          userId,
          ...updateData
        },
        include: {
          user: {
            select: {
              id: true,
              nama: true,
              email: true
            }
          }
        }
      })
    }

    // Format image paths
    if (profile.fotoProfil) {
      const originalPath = profile.fotoProfil
      profile.fotoProfil = getImagePath(profile.fotoProfil, 'profiles')
      console.log('Update Profile - Foto Profil:', { original: originalPath, formatted: profile.fotoProfil })
    }
    if (profile.coverPhoto) {
      const originalPath = profile.coverPhoto
      profile.coverPhoto = getImagePath(profile.coverPhoto, 'profiles')
      console.log('Update Profile - Cover Photo:', { original: originalPath, formatted: profile.coverPhoto })
    }

    res.json({
      message: 'Profil berhasil diperbarui',
      profile
    })
  } catch (error) {
    console.error('Update user profile error:', error)
    res.status(500).json({ error: 'Terjadi kesalahan saat memperbarui profil' })
  }
}

// Update user basic info (nama, whatsapp, domisili)
export const updateUserBasicInfo = async (req, res) => {
  try {
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() })
    }

    const { id } = req.params
    const userId = id || req.user?.userId
    const currentUserId = req.user?.userId

    // Cek authorization
    if (userId !== currentUserId && req.user?.role !== 'ADMIN') {
      return res.status(403).json({ error: 'Tidak memiliki akses untuk mengedit data ini' })
    }

    const { nama, whatsapp, domisili } = req.body

    const updateData = {}
    if (nama !== undefined) updateData.nama = nama
    if (whatsapp !== undefined) updateData.whatsapp = whatsapp || null
    if (domisili !== undefined) updateData.domisili = domisili || null

    const user = await prisma.user.update({
      where: { id: userId },
      data: updateData,
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
        updatedAt: true
      }
    })

    res.json({
      message: 'Data berhasil diperbarui',
      user
    })
  } catch (error) {
    console.error('Update user basic info error:', error)
    res.status(500).json({ error: 'Terjadi kesalahan saat memperbarui data' })
  }
}

// Get users list (untuk direktori alumni)
export const getUsers = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 12,
      search = '',
      angkatan,
      domisili,
      prodi,
      profesi,
      role = 'ALUMNI'
    } = req.query

    const skip = (parseInt(page) - 1) * parseInt(limit)
    const take = parseInt(limit)

    // Build where clause
    const where = {
      verified: true, // Hanya user yang sudah verified
      role: role.toUpperCase()
    }

    // Search filter (MySQL tidak support mode insensitive, gunakan contains saja)
    if (search) {
      where.OR = [
        { nama: { contains: search } },
        { nim: { contains: search } },
        { email: { contains: search } }
      ]
    }

    // Filter by angkatan
    if (angkatan) {
      where.angkatan = parseInt(angkatan)
    }

    // Filter by domisili
    if (domisili) {
      where.domisili = { contains: domisili }
    }

    // Filter by prodi
    if (prodi) {
      where.prodi = { contains: prodi }
    }

    // Filter by profesi (dari profile) - perlu filter di level user dengan relation
    if (profesi) {
      where.profile = {
        profesi: { contains: profesi }
      }
    }

    // Get users with pagination
    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        skip,
        take,
        include: {
          profile: {
            select: {
              fotoProfil: true,
              profesi: true,
              perusahaan: true,
              jabatan: true
            }
          }
        },
        orderBy: {
          createdAt: 'desc'
        }
      }),
      prisma.user.count({ where })
    ])

    // Format image paths
    const formattedUsers = users.map(user => {
      if (user.profile?.fotoProfil) {
        user.profile.fotoProfil = getImagePath(user.profile.fotoProfil, 'profiles')
      }
      return user
    })

    res.json({
      users: formattedUsers,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        totalPages: Math.ceil(total / parseInt(limit))
      }
    })
  } catch (error) {
    console.error('Get users error:', error)
    res.status(500).json({ error: 'Terjadi kesalahan' })
  }
}

// Get user by ID (untuk detail alumni)
export const getUserById = async (req, res) => {
  try {
    const { id } = req.params

    const user = await prisma.user.findUnique({
      where: { id },
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
        createdAt: true,
        profile: {
          select: {
            id: true,
            fotoProfil: true,
            coverPhoto: true,
            profesi: true,
            perusahaan: true,
            jabatan: true,
            skill: true,
            sosialMedia: true,
            portfolio: true,
            experience: true,
            education: true,
            certifications: true,
            languages: true,
            createdAt: true,
            updatedAt: true
          }
        }
      }
    })

    if (!user) {
      return res.status(404).json({ error: 'User tidak ditemukan' })
    }

    // Format image paths
    if (user.profile) {
      if (user.profile.fotoProfil) {
        user.profile.fotoProfil = getImagePath(user.profile.fotoProfil, 'profiles')
      }
      if (user.profile.coverPhoto) {
        user.profile.coverPhoto = getImagePath(user.profile.coverPhoto, 'profiles')
      }
    }

    res.json({ user })
  } catch (error) {
    console.error('Get user by ID error:', error)
    res.status(500).json({ error: 'Terjadi kesalahan' })
  }
}

