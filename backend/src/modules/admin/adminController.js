import prisma from '../../config/database.js'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import { getIO } from '../../config/socket.js'
import ExcelJS from 'exceljs'
import { getImagePath, extractFilename } from '../../utils/fileUtils.js'
import { sendUserApprovalEmail } from '../../services/emailService.js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// Helper for building user where clause
const buildUserFilter = (query) => {
  const { search = '', verified, role, prodi, domisili, angkatan } = query
  const where = {
    role: {
      in: ['ALUMNI', 'PENGURUS']
    }
  }

  if (search) {
    where.OR = [
      { nama: { contains: search } },
      { email: { contains: search } },
      { nim: { contains: search } }
    ]
  }

  if (verified !== undefined && verified !== 'all') {
    where.verified = verified === 'true'
  }

  if (role && role !== 'all') {
    where.role = role.toUpperCase()
  }

  if (prodi && prodi !== 'all') {
    where.prodi = prodi
  }

  if (domisili && domisili !== 'all') {
    where.domisili = domisili
  }

  if (angkatan && angkatan !== 'all') {
    where.angkatan = parseInt(angkatan)
  }

  return where
}

// Get all users (alumni & pengurus only, exclude admin)
export const getAllUsers = async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query

    const skip = (parseInt(page) - 1) * parseInt(limit)
    const take = parseInt(limit)

    const where = buildUserFilter(req.query)

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
          isSuspended: true,
          suspendReason: true,
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

    // Format image paths
    const formattedUsers = users.map(user => ({
      ...user,
      profile: user.profile ? {
        ...user.profile,
        fotoProfil: user.profile.fotoProfil ? getImagePath(user.profile.fotoProfil, 'profiles') : null
      } : null
    }))

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
        isSuspended: true,
        suspendReason: true,
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

    // Format image path
    const formattedUser = {
      ...user,
      profile: user.profile ? {
        ...user.profile,
        fotoProfil: user.profile.fotoProfil ? getImagePath(user.profile.fotoProfil, 'profiles') : null
      } : null
    }

    res.json({ user: formattedUser })
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
        nim: true,
        prodi: true,
        angkatan: true,
        verified: true,
        createdAt: true
      }
    })

    // Kirim email notifikasi ke user (non-blocking)
    try {
      await sendUserApprovalEmail(updatedUser.email, updatedUser)
    } catch (emailError) {
      console.error(`Error sending approval email to user ${updatedUser.email}:`, emailError)
    }

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

// Get Advanced Statistics for Charts
export const getAdvancedStatistics = async (req, res) => {
  try {
    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

    const [
      userGrowth,
      prodiStats,
      angkatanStats,
      totalPosts,
      totalComments,
      totalReports,
      totalEvents
    ] = await Promise.all([
      // 1. User Growth (last 30 days)
      prisma.user.findMany({
        where: {
          createdAt: { gte: thirtyDaysAgo },
          role: { in: ['ALUMNI', 'PENGURUS'] }
        },
        select: { createdAt: true }
      }),
      // 2. Prodi Distribution
      prisma.user.groupBy({
        by: ['prodi'],
        where: { role: { in: ['ALUMNI', 'PENGURUS'] }, prodi: { not: null } },
        _count: { _all: true }
      }),
      // 3. Angkatan Distribution
      prisma.user.groupBy({
        by: ['angkatan'],
        where: { role: { in: ['ALUMNI', 'PENGURUS'] }, angkatan: { not: null } },
        _count: { _all: true },
        orderBy: { angkatan: 'asc' }
      }),
      // 4. Totals for context
      prisma.post.count(),
      prisma.comment.count(),
      prisma.report.count(),
      prisma.event.count()
    ])

    // Process User Growth into { date: 'YYYY-MM-DD', count: number }
    const growthMap = {}
    // Initialize last 30 days with 0
    for (let i = 29; i >= 0; i--) {
      const d = new Date()
      d.setDate(d.getDate() - i)
      const dateStr = d.toISOString().split('T')[0]
      growthMap[dateStr] = 0
    }

    userGrowth.forEach(u => {
      const dateStr = u.createdAt.toISOString().split('T')[0]
      if (growthMap[dateStr] !== undefined) {
        growthMap[dateStr]++
      }
    })

    const growthData = Object.keys(growthMap).map(date => ({
      date,
      count: growthMap[date]
    }))

    // Process Prodi stats
    const prodiData = prodiStats.map(ps => ({
      name: ps.prodi || 'Tidak Diketahui',
      count: ps._count._all
    })).sort((a, b) => b.count - a.count).slice(0, 10) // Top 10 prodi

    // Process Angkatan stats
    const angkatanData = angkatanStats.map(as => ({
      name: as.angkatan.toString(),
      count: as._count._all
    }))

    res.json({
      success: true,
      data: {
        userGrowth: growthData,
        prodiDistribution: prodiData,
        angkatanDistribution: angkatanData,
        engagement: {
          posts: totalPosts,
          comments: totalComments,
          reports: totalReports,
          events: totalEvents
        }
      }
    })
  } catch (error) {
    console.error('Get advanced statistics error:', error)
    res.status(500).json({ error: 'Gagal memuat statistik lanjutan' })
  }
}


// ─── COMMENT MANAGEMENT ─────────────────────────────────────────────────────

// Get all comments with pagination and filters
export const getAllComments = async (req, res) => {
  try {
    const { page = 1, limit = 10, search = '', postId, authorId } = req.query

    const skip = (parseInt(page) - 1) * parseInt(limit)
    const take = parseInt(limit)

    // Build where clause
    const where = {}

    if (search) {
      where.content = { contains: search }
    }

    if (postId) {
      where.postId = postId
    }

    if (authorId) {
      where.authorId = authorId
    }

    // Get comments with pagination
    const [comments, total] = await Promise.all([
      prisma.comment.findMany({
        where,
        skip,
        take,
        include: {
          author: {
            select: {
              id: true,
              nama: true,
              email: true,
              profile: {
                select: { fotoProfil: true }
              }
            }
          },
          post: {
            select: {
              id: true,
              content: true
            }
          },
          _count: {
            select: { replies: true }
          }
        },
        orderBy: {
          createdAt: 'desc'
        }
      }),
      prisma.comment.count({ where })
    ])

    // Format results to include correct image paths
    const formattedComments = comments.map(comment => ({
      ...comment,
      author: {
        ...comment.author,
        profile: comment.author.profile ? {
          ...comment.author.profile,
          fotoProfil: comment.author.profile.fotoProfil ? getImagePath(comment.author.profile.fotoProfil, 'profiles') : null
        } : null
      }
    }))

    res.json({
      comments: formattedComments,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        totalPages: Math.ceil(total / parseInt(limit))
      }
    })
  } catch (error) {
    console.error('Get all comments error:', error)
    res.status(500).json({ error: 'Terjadi kesalahan saat mengambil data komentar' })
  }
}

// Delete comment by admin
export const deleteCommentByAdmin = async (req, res) => {
  try {
    const { id } = req.params

    const comment = await prisma.comment.findUnique({
      where: { id }
    })

    if (!comment) {
      return res.status(404).json({ error: 'Komentar tidak ditemukan' })
    }

    await prisma.comment.delete({
      where: { id }
    })

    res.json({
      message: 'Komentar berhasil dihapus oleh admin'
    })
  } catch (error) {
    console.error('Delete comment by admin error:', error)
    res.status(500).json({ error: 'Terjadi kesalahan' })
  }
}

// Bulk delete comments
export const bulkDeleteCommentsByAdmin = async (req, res) => {
  try {
    const { ids } = req.body

    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({ error: 'ID komentar tidak valid' })
    }

    await prisma.comment.deleteMany({
      where: {
        id: { in: ids }
      }
    })

    res.json({
      message: `${ids.length} komentar berhasil dihapus`
    })
  } catch (error) {
    console.error('Bulk delete comments error:', error)
    res.status(500).json({ error: 'Terjadi kesalahan' })
  }
}

// ─── USER SUSPENSION ────────────────────────────────────────────────────────

// Suspend user
export const suspendUser = async (req, res) => {
  try {
    const { id } = req.params
    const { reason } = req.body

    const user = await prisma.user.findUnique({
      where: { id }
    })

    if (!user) {
      return res.status(404).json({ error: 'User tidak ditemukan' })
    }

    if (user.role === 'ADMIN') {
      return res.status(403).json({ error: 'Tidak dapat menangguhkan Admin' })
    }

    const updatedUser = await prisma.user.update({
      where: { id },
      data: {
        isSuspended: true,
        suspendReason: reason || 'Pelanggaran kebijakan komunitas'
      }
    })

    // Hapus notifikasi suspen lama jika ada (menghindari duplikat)
    await prisma.notification.deleteMany({
      where: { userId: id, type: 'SYSTEM_SUSPEND' }
    })

    // Buat notifikasi permanen (tidak bisa dihapus user) untuk memberi tahu user
    await prisma.notification.create({
      data: {
        userId: id,
        type: 'SYSTEM_SUSPEND',
        message: `⚠️ Akun Anda telah ditangguhkan (Suspended). Harap hubungi admin untuk informasi lebih lanjut.`,
        relatedType: 'suspend',
        read: false
      }
    })

    // Beri sinyal real-time agar user langsung terblokir meski sedang online
    try {
      const io = getIO()
      io.to(`user:${id}`).emit('ACCOUNT_SUSPENDED')
    } catch (err) {
      console.error('Socket emit suspend error:', err)
    }

    res.json({
      message: 'User berhasil ditangguhkan',
      user: updatedUser
    })
  } catch (error) {
    console.error('Suspend user error:', error)
    res.status(500).json({ error: 'Terjadi kesalahan saat menangguhkan user' })
  }
}

// Unsuspend user
export const unsuspendUser = async (req, res) => {
  try {
    const { id } = req.params

    const user = await prisma.user.findUnique({
      where: { id }
    })

    if (!user) {
      return res.status(404).json({ error: 'User tidak ditemukan' })
    }

    const updatedUser = await prisma.user.update({
      where: { id },
      data: {
        isSuspended: false,
        suspendReason: null
      }
    })

    // Hapus notifikasi suspen agar tidak menggantung di akun user
    await prisma.notification.deleteMany({
      where: { userId: id, type: 'SYSTEM_SUSPEND' }
    })

    res.json({
      message: 'Penangguhan user berhasil dicabut',
      user: updatedUser
    })
  } catch (error) {
    console.error('Unsuspend user error:', error)
    res.status(500).json({ error: 'Terjadi kesalahan saat mencabut penangguhan' })
  }
}

// Delete user
export const deleteUser = async (req, res) => {
  try {
    const { id } = req.params

    // Safety check: Don't let admin delete themselves
    if (req.user.userId === id) {
      return res.status(400).json({ error: 'Anda tidak dapat menghapus akun Anda sendiri' })
    }

    const user = await prisma.user.findUnique({
      where: { id }
    })

    if (!user) {
      return res.status(404).json({ error: 'User tidak ditemukan' })
    }

    // Safety check: Don't let admin delete other admins easily
    if (user.role === 'ADMIN') {
      return res.status(403).json({ error: 'Tidak dapat menghapus sesama akun Administrator' })
    }

    await prisma.user.delete({
      where: { id }
    })

    res.json({ message: 'User berhasil dihapus secara permanen' })
  } catch (error) {
    console.error('Delete user error:', error)
    res.status(500).json({ error: 'Terjadi kesalahan saat menghapus user' })
  }
}

// Export users to Excel
export const exportUsers = async (req, res) => {
  try {
    const where = buildUserFilter(req.query)

    const users = await prisma.user.findMany({
      where,
      select: {
        nama: true,
        email: true,
        nim: true,
        prodi: true,
        angkatan: true,
        domisili: true,
        whatsapp: true,
        role: true,
        verified: true,
        isSuspended: true,
        createdAt: true
      },
      orderBy: {
        nama: 'asc'
      }
    })

    const workbook = new ExcelJS.Workbook()
    const worksheet = workbook.addWorksheet('Data User')

    // Define columns
    worksheet.columns = [
      { header: 'No', key: 'no', width: 5 },
      { header: 'Nama Lengkap', key: 'nama', width: 30 },
      { header: 'Email', key: 'email', width: 30 },
      { header: 'NIM', key: 'nim', width: 15 },
      { header: 'Program Studi', key: 'prodi', width: 25 },
      { header: 'Angkatan', key: 'angkatan', width: 10 },
      { header: 'Domisili', key: 'domisili', width: 20 },
      { header: 'WhatsApp', key: 'whatsapp', width: 15 },
      { header: 'Role', key: 'role', width: 15 },
      { header: 'Status Verifikasi', key: 'verified', width: 20 },
      { header: 'Status Suspend', key: 'suspended', width: 15 },
      { header: 'Tanggal Daftar', key: 'createdAt', width: 20 }
    ]

    // Styling headers
    worksheet.getRow(1).font = { bold: true }
    worksheet.getRow(1).alignment = { vertical: 'middle', horizontal: 'center' }

    // Add data
    users.forEach((user, index) => {
      worksheet.addRow({
        no: index + 1,
        nama: user.nama,
        email: user.email,
        nim: user.nim || '-',
        prodi: user.prodi || '-',
        angkatan: user.angkatan || '-',
        domisili: user.domisili || '-',
        whatsapp: user.whatsapp || '-',
        role: user.role,
        verified: user.verified ? 'Terverifikasi' : 'Belum Verifikasi',
        suspended: user.isSuspended ? 'Suspended' : 'Aktif',
        createdAt: new Date(user.createdAt).toLocaleDateString('id-ID')
      })
    })

    // Formatting
    worksheet.eachRow((row, rowNumber) => {
      row.alignment = { vertical: 'middle' }
      if (rowNumber > 1) {
        row.getCell('no').alignment = { horizontal: 'center' }
        row.getCell('angkatan').alignment = { horizontal: 'center' }
      }
    })

    // Set response headers
    const filename = `Data_User_${new Date().toISOString().split('T')[0]}.xlsx`
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`)

    await workbook.xlsx.write(res)
    res.end()

  } catch (error) {
    console.error('Export users error:', error)
    res.status(500).json({ error: 'Terjadi kesalahan saat mengekspor data' })
  }
}



// ─── FILE MANAGEMENT ─────────────────────────────────────────────────────────

const UPLOADS_DIR = path.join(__dirname, '../../../uploads/images')
const TRASH_DIR = path.join(__dirname, '../../../uploads_trash')

// Helper function to get directory size
const getDirSize = (dirPath) => {
  if (!fs.existsSync(dirPath)) return 0
  let size = 0
  const files = fs.readdirSync(dirPath)

  for (let i = 0; i < files.length; i++) {
    const filePath = path.join(dirPath, files[i])
    const stats = fs.statSync(filePath)

    if (stats.isFile()) {
      size += stats.size
    } else if (stats.isDirectory()) {
      size += getDirSize(filePath)
    }
  }

  return size
}

// Get storage statistics
export const getStorageStats = async (req, res) => {
  try {
    const categories = ['profiles', 'posts', 'events', 'announcements', 'jobs', 'discussions', 'messages', 'discussion_messages']
    const stats = {
      totalSize: 0,
      fileCount: 0,
      breakdown: []
    }

    categories.forEach(cat => {
      const catPath = path.join(UPLOADS_DIR, cat)
      let count = 0
      let size = 0
      
      if (fs.existsSync(catPath)) {
        const files = fs.readdirSync(catPath)
        size = getDirSize(catPath)
        count = files.length
      }
      
      stats.totalSize += size
      stats.fileCount += count
      stats.breakdown.push({
        name: cat,
        count: count,
        size: size
      })
    })

    // Add trash size
    const trashSize = fs.existsSync(TRASH_DIR) ? getDirSize(TRASH_DIR) : 0
    stats.trashSize = trashSize

    res.json({ stats })
  } catch (error) {
    console.error('Get storage stats error:', error)
    res.status(500).json({ error: 'Gagal memuat statistik penyimpanan' })
  }
}

// List files in a category
export const listFiles = async (req, res) => {
  try {
    const { category = 'profiles' } = req.query
    const catPath = path.join(UPLOADS_DIR, category)

    if (!fs.existsSync(catPath)) {
      return res.json({ files: [] })
    }

    const files = fs.readdirSync(catPath)
      .map(filename => {
        const filePath = path.join(catPath, filename)
        const stats = fs.statSync(filePath)
        return {
          name: filename,
          size: stats.size,
          createdAt: stats.birthtime,
          path: `/uploads/images/${category}/${filename}`
        }
      })
      .sort((a, b) => b.createdAt - a.createdAt)

    res.json({ files })
  } catch (error) {
    console.error('List files error:', error)
    res.status(500).json({ error: 'Gagal memuat daftar file' })
  }
}

// Delete file
export const deleteFile = async (req, res) => {
  try {
    const { category, filename } = req.body
    const filePath = path.join(UPLOADS_DIR, category, filename)

    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ error: 'File tidak ditemukan' })
    }

    fs.unlinkSync(filePath)

    res.json({ message: 'File berhasil dihapus' })
  } catch (error) {
    console.error('Delete file error:', error)
    res.status(500).json({ error: 'Gagal menghapus file' })
  }
}

// ─── FILE AUDIT & CLEANUP (TRASH SYSTEM) ───────────────────────────────────

// Helper: Get all filenames for a category from DB
const getFilenamesFromDB = async (category) => {
  switch (category) {
    case 'profiles':
      const profiles = await prisma.profile.findMany({ select: { fotoProfil: true, coverPhoto: true } })
      return [...profiles.map(p => p.fotoProfil), ...profiles.map(p => p.coverPhoto)].filter(Boolean)
    case 'posts':
      const postImages = await prisma.postImage.findMany({ select: { imageUrl: true } })
      return postImages.map(img => img.imageUrl).filter(Boolean)
    case 'messages':
      const messages = await prisma.message.findMany({ select: { media: true } })
      return messages.map(m => m.media).filter(Boolean)
    case 'announcements':
      const ann = await prisma.announcement.findMany({ select: { image: true } })
      return ann.map(a => a.image).filter(Boolean)
    case 'events':
      const ev = await prisma.event.findMany({ select: { image: true } })
      return ev.map(e => e.image).filter(Boolean)
    case 'jobs':
      const jobList = await prisma.jobs.findMany({ select: { image: true } })
      return jobList.map(j => j.image).filter(Boolean)
    case 'discussions':
      const disc = await prisma.discussionThread.findMany({ select: { image: true } })
      return disc.map(d => d.image).filter(Boolean)
    case 'discussion_messages':
      const discMsg = await prisma.discussionMessage.findMany({ select: { media: true } })
      return discMsg.map(d => d.media).filter(Boolean)
    default:
      return []
  }
}

// Audit orphaned files (Disk but not in DB)
export const auditOrphanedFiles = async (req, res) => {
  try {
    const categories = ['profiles', 'posts', 'events', 'announcements', 'jobs', 'discussions', 'messages', 'discussion_messages']
    const orphanedFiles = []
    let totalOrphanSize = 0

    for (const cat of categories) {
      const catPath = path.join(UPLOADS_DIR, cat)
      if (!fs.existsSync(catPath)) continue

      const filesOnDisk = fs.readdirSync(catPath)
      const filenamesInDB = await getFilenamesFromDB(cat)
      
      // Filter out files that ARE in DB
      const orphans = filesOnDisk.filter(file => !filenamesInDB.includes(file))

      orphans.forEach(file => {
        const filePath = path.join(catPath, file)
        if (fs.statSync(filePath).isFile()) {
          const stats = fs.statSync(filePath)
          totalOrphanSize += stats.size
          orphanedFiles.push({
            name: file,
            category: cat,
            size: stats.size,
            path: `/uploads/images/${cat}/${file}`,
            createdAt: stats.birthtime
          })
        }
      })
    }

    res.json({
      orphanedFiles,
      summary: {
        count: orphanedFiles.length,
        totalSize: totalOrphanSize
      }
    })
  } catch (error) {
    console.error('Audit files error:', error)
    res.status(500).json({ error: 'Gagal melakukan audit file' })
  }
}

// Move files to trash
export const moveToTrash = async (req, res) => {
  try {
    const { files } = req.body // Array of { category, name }

    if (!Array.isArray(files)) {
      return res.status(400).json({ error: 'Data file tidak valid' })
    }

    let movedCount = 0
    files.forEach(file => {
      const sourcePath = path.join(UPLOADS_DIR, file.category, file.name)
      const targetDir = path.join(TRASH_DIR, file.category)
      const targetPath = path.join(targetDir, file.name)

      if (fs.existsSync(sourcePath)) {
        if (!fs.existsSync(targetDir)) {
          fs.mkdirSync(targetDir, { recursive: true })
        }
        fs.renameSync(sourcePath, targetPath)
        movedCount++
      }
    })

    res.json({ message: `${movedCount} file dipindahkan ke tempat sampah` })
  } catch (error) {
    console.error('Move to trash error:', error)
    res.status(500).json({ error: 'Gagal memindahkan file ke sampah' })
  }
}

// List files in trash
export const listTrash = async (req, res) => {
  try {
    if (!fs.existsSync(TRASH_DIR)) {
      return res.json({ files: [] })
    }

    const categories = fs.readdirSync(TRASH_DIR)
    const trashFiles = []

    categories.forEach(cat => {
      const catPath = path.join(TRASH_DIR, cat)
      if (fs.statSync(catPath).isDirectory()) {
        const files = fs.readdirSync(catPath)
        files.forEach(file => {
          const filePath = path.join(catPath, file)
          const stats = fs.statSync(filePath)
          trashFiles.push({
            name: file,
            category: cat,
            size: stats.size,
            createdAt: stats.birthtime,
            path: `/uploads_trash/${cat}/${file}` // Need to serve this static path too
          })
        })
      }
    })

    res.json({ files: trashFiles.sort((a, b) => b.createdAt - a.createdAt) })
  } catch (error) {
    console.error('List trash error:', error)
    res.status(500).json({ error: 'Gagal memuat isi tempat sampah' })
  }
}

// Restore from trash
export const restoreFromTrash = async (req, res) => {
  try {
    const { files } = req.body // Array of { category, name }

    let restoredCount = 0
    files.forEach(file => {
      const sourcePath = path.join(TRASH_DIR, file.category, file.name)
      const targetDir = path.join(UPLOADS_DIR, file.category)
      const targetPath = path.join(targetDir, file.name)

      if (fs.existsSync(sourcePath)) {
        if (!fs.existsSync(targetDir)) {
          fs.mkdirSync(targetDir, { recursive: true })
        }
        // Pastikan tidak overwrite
        if (!fs.existsSync(targetPath)) {
          fs.renameSync(sourcePath, targetPath)
          restoredCount++
        }
      }
    })

    res.json({ message: `${restoredCount} file berhasil dikembalikan` })
  } catch (error) {
    console.error('Restore trash error:', error)
    res.status(500).json({ error: 'Gagal mengembalikan file' })
  }
}

// Empty trash (Permanent Delete)
export const emptyTrash = async (req, res) => {
  try {
    console.log('--- EMTPYING TRASH ---')
    if (fs.existsSync(TRASH_DIR)) {
      const entries = fs.readdirSync(TRASH_DIR)
      console.log('Found in trash root:', entries)
      
      for (const entry of entries) {
        const entryPath = path.join(TRASH_DIR, entry)
        console.log(`Deleting: ${entryPath}`)
        if (fs.statSync(entryPath).isDirectory()) {
          fs.rmSync(entryPath, { recursive: true, force: true, maxRetries: 5, retryDelay: 100 })
        } else {
          fs.unlinkSync(entryPath)
        }
      }
      
      const finalEntries = fs.readdirSync(TRASH_DIR)
      console.log('Final state of trash:', finalEntries)
    }
    res.json({ message: 'Tempat sampah berhasil dikosongkan' })
  } catch (error) {
    console.error('Empty trash error:', error)
    res.status(500).json({ error: 'Gagal mengosongkan tempat sampah' })
  }
}

// Delete single file from trash
export const deleteTrashFile = async (req, res) => {
  try {
    const { category, filename } = req.body
    const filePath = path.join(TRASH_DIR, category, filename)

    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ error: 'File tidak ditemukan di sampah' })
    }

    fs.unlinkSync(filePath)

    res.json({ message: 'File sampah berhasil dihapus permanen' })
  } catch (error) {
    console.error('Delete trash file error:', error)
    res.status(500).json({ error: 'Gagal menghapus file sampah' })
  }
}

// Get unique filter options for users (prodi, domisili, angkatan)
export const getUserFilterOptions = async (req, res) => {
  try {
    const [prodis, domisilis, angkatans] = await Promise.all([
      prisma.user.findMany({
        where: { 
          prodi: { not: null, not: '' }, 
          role: { in: ['ALUMNI', 'PENGURUS'] } 
        },
        distinct: ['prodi'],
        select: { prodi: true },
        orderBy: { prodi: 'asc' }
      }),
      prisma.user.findMany({
        where: { 
          domisili: { not: null, not: '' }, 
          role: { in: ['ALUMNI', 'PENGURUS'] } 
        },
        distinct: ['domisili'],
        select: { domisili: true },
        orderBy: { domisili: 'asc' }
      }),
      prisma.user.findMany({
        where: { 
          angkatan: { not: null }, 
          role: { in: ['ALUMNI', 'PENGURUS'] } 
        },
        distinct: ['angkatan'],
        select: { angkatan: true },
        orderBy: { angkatan: 'desc' }
      })
    ])

    res.json({
      prodis: prodis.map(p => p.prodi),
      domisilis: domisilis.map(d => d.domisili),
      angkatans: angkatans.map(a => a.angkatan)
    })
  } catch (error) {
    console.error('Get filter options error:', error)
    res.status(500).json({ error: 'Gagal memuat opsi filter' })
  }
}

// ─── ADMIN POST MANAGEMENT ─────────────────────────────────────────────────

// Get all posts by admin
export const getAllPostsByAdmin = async (req, res) => {
  try {
    const { page = 1, limit = 10, search = '' } = req.query
    const skip = (parseInt(page) - 1) * parseInt(limit)
    const take = parseInt(limit)

    const where = search 
      ? {
          OR: [
            { content: { contains: search } },
            { author: { nama: { contains: search } } },
            { author: { email: { contains: search } } }
          ]
        }
      : {}

    const [posts, total] = await Promise.all([
      prisma.post.findMany({
        where,
        skip,
        take,
        orderBy: { createdAt: 'desc' },
        include: {
          images: true,
          author: {
            select: {
              id: true,
              nama: true,
              email: true,
              nim: true,
              role: true,
              profile: {
                select: {
                  fotoProfil: true
                }
              }
            }
          },
          _count: {
            select: {
              likes: true,
              comments: true
            }
          }
        }
      }),
      prisma.post.count({ where })
    ])

    const formattedPosts = posts.map(post => ({
      ...post,
      images: post.images ? post.images.map(img => ({
        id: img.id,
        imageUrl: getImagePath(img.imageUrl, 'posts')
      })) : [],
      likesCount: post._count.likes,
      commentsCount: post._count.comments,
      author: {
        ...post.author,
        fotoProfil: post.author.profile?.fotoProfil ? getImagePath(post.author.profile.fotoProfil, 'profiles') : null
      }
    }))

    res.json({
      posts: formattedPosts,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        totalPages: Math.ceil(total / parseInt(limit))
      }
    })
  } catch (error) {
    console.error('Get all posts by admin error:', error)
    res.status(500).json({ error: 'Terjadi kesalahan saat mengambil data postingan' })
  }
}

// Delete post by admin
export const deletePostByAdmin = async (req, res) => {
  try {
    const { id } = req.params

    const post = await prisma.post.findUnique({
      where: { id },
      include: { images: true }
    })

    if (!post) {
      return res.status(404).json({ error: 'Postingan tidak ditemukan' })
    }

    // Delete image files from filesystem if they exist
    if (post.images && post.images.length > 0) {
      try {
        const postsUploadDir = path.join(__dirname, '../../../uploads/images/posts')
        post.images.forEach(img => {
          const filePath = path.join(postsUploadDir, img.imageUrl)
          if (fs.existsSync(filePath)) {
            fs.unlinkSync(filePath)
            console.log(`Deleted image: ${img.imageUrl}`)
          }
        })
      } catch (fileError) {
        console.error('Error deleting post image files:', fileError)
      }
    }

    await prisma.post.delete({
      where: { id }
    })

    res.json({ message: 'Postingan berhasil dihapus oleh admin' })
  } catch (error) {
    console.error('Delete post by admin error:', error)
    res.status(500).json({ error: 'Terjadi kesalahan saat menghapus postingan' })
  }
}

// ─── ADMIN DISCUSSION THREAD MANAGEMENT ────────────────────────────────────

// Get all threads by admin
export const getAllThreadsByAdmin = async (req, res) => {
  try {
    const { page = 1, limit = 10, search = '' } = req.query
    const skip = (parseInt(page) - 1) * parseInt(limit)
    const take = parseInt(limit)

    const where = search 
      ? {
          OR: [
            { title: { contains: search } },
            { content: { contains: search } },
            { author: { nama: { contains: search } } }
          ]
        }
      : {}

    const [threads, total] = await Promise.all([
      prisma.discussionThread.findMany({
        where,
        skip,
        take,
        orderBy: { createdAt: 'desc' },
        include: {
          author: {
            select: {
              id: true,
              nama: true,
              email: true,
              role: true,
              profile: {
                select: {
                  fotoProfil: true
                }
              }
            }
          },
          _count: {
            select: {
              members: true,
              messages: true
            }
          }
        }
      }),
      prisma.discussionThread.count({ where })
    ])

    const formattedThreads = threads.map(thread => ({
      ...thread,
      image: thread.image ? getImagePath(thread.image, 'discussions') : null,
      membersCount: thread._count.members,
      messagesCount: thread._count.messages,
      author: {
        ...thread.author,
        fotoProfil: thread.author.profile?.fotoProfil ? getImagePath(thread.author.profile.fotoProfil, 'profiles') : null
      }
    }))

    res.json({
      threads: formattedThreads,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        totalPages: Math.ceil(total / parseInt(limit))
      }
    })
  } catch (error) {
    console.error('Get all threads by admin error:', error)
    res.status(500).json({ error: 'Terjadi kesalahan saat mengambil data forum thread' })
  }
}

// Delete discussion thread by admin
export const deleteThreadByAdmin = async (req, res) => {
  try {
    const { id } = req.params

    const thread = await prisma.discussionThread.findUnique({
      where: { id }
    })

    if (!thread) {
      return res.status(404).json({ error: 'Forum thread tidak ditemukan' })
    }

    // Delete image file from filesystem if exists
    if (thread.image) {
      try {
        const discussionsUploadDir = path.join(__dirname, '../../../uploads/images/discussions')
        const filePath = path.join(discussionsUploadDir, thread.image)
        if (fs.existsSync(filePath)) {
          fs.unlinkSync(filePath)
          console.log(`Deleted discussion image: ${thread.image}`)
        }
      } catch (fileError) {
        console.error('Error deleting thread image file:', fileError)
      }
    }

    await prisma.discussionThread.delete({
      where: { id }
    })

    res.json({ message: 'Forum thread berhasil dihapus oleh admin' })
  } catch (error) {
    console.error('Delete thread by admin error:', error)
    res.status(500).json({ error: 'Terjadi kesalahan saat menghapus forum thread' })
  }
}

// ─── ADMIN JOB LISTING MANAGEMENT ──────────────────────────────────────────

// Get all jobs by admin
export const getAllJobsByAdmin = async (req, res) => {
  try {
    const { page = 1, limit = 10, search = '', status = 'all' } = req.query
    const skip = (parseInt(page) - 1) * parseInt(limit)
    const take = parseInt(limit)

    const where = {}

    if (search) {
      where.OR = [
        { title: { contains: search } },
        { company: { contains: search } },
        { location: { contains: search } },
        { users: { nama: { contains: search } } }
      ]
    }

    if (status !== 'all') {
      where.status = status.toUpperCase()
    }

    const [jobsList, total] = await Promise.all([
      prisma.jobs.findMany({
        where,
        skip,
        take,
        orderBy: { createdAt: 'desc' },
        include: {
          users: {
            select: {
              id: true,
              nama: true,
              email: true,
              role: true
            }
          }
        }
      }),
      prisma.jobs.count({ where })
    ])

    const formattedJobs = jobsList.map(job => ({
      ...job,
      image: job.image ? getImagePath(job.image, 'jobs') : null,
      author: job.users
    }))

    res.json({
      jobs: formattedJobs,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        totalPages: Math.ceil(total / parseInt(limit))
      }
    })
  } catch (error) {
    console.error('Get all jobs by admin error:', error)
    res.status(500).json({ error: 'Terjadi kesalahan saat mengambil data lowongan pekerjaan' })
  }
}

// Approve job
export const approveJobByAdmin = async (req, res) => {
  try {
    const { id } = req.params

    const job = await prisma.jobs.findUnique({
      where: { id }
    })

    if (!job) {
      return res.status(404).json({ error: 'Lowongan tidak ditemukan' })
    }

    const updatedJob = await prisma.jobs.update({
      where: { id },
      data: { status: 'APPROVED', updatedAt: new Date() }
    })

    res.json({
      message: 'Lowongan pekerjaan berhasil disetujui',
      job: updatedJob
    })
  } catch (error) {
    console.error('Approve job error:', error)
    res.status(500).json({ error: 'Terjadi kesalahan saat menyetujui lowongan' })
  }
}

// Reject job
export const rejectJobByAdmin = async (req, res) => {
  try {
    const { id } = req.params

    const job = await prisma.jobs.findUnique({
      where: { id }
    })

    if (!job) {
      return res.status(404).json({ error: 'Lowongan tidak ditemukan' })
    }

    const updatedJob = await prisma.jobs.update({
      where: { id },
      data: { status: 'REJECTED', updatedAt: new Date() }
    })

    res.json({
      message: 'Lowongan pekerjaan berhasil ditolak',
      job: updatedJob
    })
  } catch (error) {
    console.error('Reject job error:', error)
    res.status(500).json({ error: 'Terjadi kesalahan saat menolak lowongan' })
  }
}

// Delete job by admin
export const deleteJobByAdmin = async (req, res) => {
  try {
    const { id } = req.params

    const job = await prisma.jobs.findUnique({
      where: { id }
    })

    if (!job) {
      return res.status(404).json({ error: 'Lowongan tidak ditemukan' })
    }

    // Delete image if exists
    if (job.image) {
      try {
        const jobsUploadDir = path.join(__dirname, '../../../uploads/images/jobs')
        const filePath = path.join(jobsUploadDir, job.image)
        if (fs.existsSync(filePath)) {
          fs.unlinkSync(filePath)
          console.log(`Deleted job image: ${job.image}`)
        }
      } catch (fileError) {
        console.error('Error deleting job image file:', fileError)
      }
    }

    await prisma.jobs.delete({
      where: { id }
    })

    res.json({ message: 'Lowongan pekerjaan berhasil dihapus oleh admin' })
  } catch (error) {
    console.error('Delete job error:', error)
    res.status(500).json({ error: 'Terjadi kesalahan saat menghapus lowongan' })
  }
}

