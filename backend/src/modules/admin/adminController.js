import prisma from '../../config/database.js'

// Get all users (alumni & pengurus only, exclude admin)
export const getAllUsers = async (req, res) => {
  try {
    const { page = 1, limit = 10, search = '', verified, role } = req.query

    const skip = (parseInt(page) - 1) * parseInt(limit)
    const take = parseInt(limit)

    // Build where clause
    const where = {
      role: {
        in: ['ALUMNI', 'PENGURUS'] // Exclude ADMIN
      }
    }

    if (search) {
      where.OR = [
        { nama: { contains: search } },
        { email: { contains: search } },
        { nim: { contains: search } }
      ]
    }

    if (verified !== undefined) {
      where.verified = verified === 'true'
    }

    if (role && role !== 'all') {
      where.role = role.toUpperCase()
    }

    // Get users with pagination
    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        skip,
        take,
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
              fotoProfil: true,
              profesi: true
            }
          }
        },
        orderBy: {
          createdAt: 'desc'
        }
      }),
      prisma.user.count({ where })
    ])

    res.json({
      users,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        totalPages: Math.ceil(total / parseInt(limit))
      }
    })
  } catch (error) {
    console.error('Get all users error:', error)
    res.status(500).json({ error: 'Terjadi kesalahan' })
  }
}

// Get user by ID
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
        updatedAt: true,
        profile: {
          select: {
            fotoProfil: true,
            profesi: true,
            skill: true,
            sosialMedia: true,
            portfolio: true
          }
        }
      }
    })

    if (!user) {
      return res.status(404).json({ error: 'User tidak ditemukan' })
    }

    // Exclude admin
    if (user.role === 'ADMIN') {
      return res.status(403).json({ error: 'Forbidden' })
    }

    res.json({ user })
  } catch (error) {
    console.error('Get user by ID error:', error)
    res.status(500).json({ error: 'Terjadi kesalahan' })
  }
}

// Verify user
export const verifyUser = async (req, res) => {
  try {
    const { id } = req.params

    const user = await prisma.user.findUnique({
      where: { id }
    })

    if (!user) {
      return res.status(404).json({ error: 'User tidak ditemukan' })
    }

    if (user.role === 'ADMIN') {
      return res.status(403).json({ error: 'Cannot verify admin' })
    }

    const updatedUser = await prisma.user.update({
      where: { id },
      data: { verified: true },
      select: {
        id: true,
        email: true,
        nama: true,
        verified: true
      }
    })

    res.json({
      message: 'User berhasil diverifikasi',
      user: updatedUser
    })
  } catch (error) {
    console.error('Verify user error:', error)
    res.status(500).json({ error: 'Terjadi kesalahan' })
  }
}

// Reject user
export const rejectUser = async (req, res) => {
  try {
    const { id } = req.params

    const user = await prisma.user.findUnique({
      where: { id }
    })

    if (!user) {
      return res.status(404).json({ error: 'User tidak ditemukan' })
    }

    if (user.role === 'ADMIN') {
      return res.status(403).json({ error: 'Cannot reject admin' })
    }

    // Delete user (atau bisa juga set flag rejected)
    await prisma.user.delete({
      where: { id }
    })

    res.json({
      message: 'User berhasil ditolak dan dihapus'
    })
  } catch (error) {
    console.error('Reject user error:', error)
    res.status(500).json({ error: 'Terjadi kesalahan' })
  }
}

// Update user role
export const updateUserRole = async (req, res) => {
  try {
    const { id } = req.params
    const { role } = req.body

    if (!['ALUMNI', 'PENGURUS'].includes(role)) {
      return res.status(400).json({ error: 'Role tidak valid' })
    }

    const user = await prisma.user.findUnique({
      where: { id }
    })

    if (!user) {
      return res.status(404).json({ error: 'User tidak ditemukan' })
    }

    if (user.role === 'ADMIN') {
      return res.status(403).json({ error: 'Cannot change admin role' })
    }

    const updatedUser = await prisma.user.update({
      where: { id },
      data: { role },
      select: {
        id: true,
        email: true,
        nama: true,
        role: true
      }
    })

    res.json({
      message: 'Role user berhasil diupdate',
      user: updatedUser
    })
  } catch (error) {
    console.error('Update user role error:', error)
    res.status(500).json({ error: 'Terjadi kesalahan' })
  }
}

// Get statistics
export const getStatistics = async (req, res) => {
  try {
    const [totalUsers, verifiedUsers, pendingUsers, alumniCount, pengurusCount] = await Promise.all([
      prisma.user.count({
        where: { role: { in: ['ALUMNI', 'PENGURUS'] } }
      }),
      prisma.user.count({
        where: { 
          role: { in: ['ALUMNI', 'PENGURUS'] },
          verified: true
        }
      }),
      prisma.user.count({
        where: { 
          role: { in: ['ALUMNI', 'PENGURUS'] },
          verified: false
        }
      }),
      prisma.user.count({
        where: { role: 'ALUMNI' }
      }),
      prisma.user.count({
        where: { role: 'PENGURUS' }
      })
    ])

    res.json({
      statistics: {
        totalUsers,
        verifiedUsers,
        pendingUsers,
        alumniCount,
        pengurusCount
      }
    })
  } catch (error) {
    console.error('Get statistics error:', error)
    res.status(500).json({ error: 'Terjadi kesalahan' })
  }
}

