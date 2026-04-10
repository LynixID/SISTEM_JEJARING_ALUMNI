import prisma from '../../config/database.js'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

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

    res.json({
      comments,
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
        suspendedAt: new Date(),
        suspendReason: reason || 'Pelanggaran ketentuan layanan'
      }
    })

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
        suspendedAt: null,
        suspendReason: null
      }
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


// ─── FILE MANAGEMENT ─────────────────────────────────────────────────────────

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
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
      const posts = await prisma.post.findMany({ select: { media: true } })
      return posts.map(p => p.media).filter(Boolean)
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
