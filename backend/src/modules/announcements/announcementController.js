import prisma from '../../config/database.js'
import { validationResult } from 'express-validator'
import { getImagePath, extractFilename } from '../../utils/fileUtils.js'

// Fungsi bantu untuk membuat slug dari title
const generateSlug = (title) => {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
}

// Ambil semua pengumuman
export const getAllAnnouncements = async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 10, 
      search = '', 
      published = undefined 
    } = req.query

    const where = {}
    
    // Filter published status
    if (req.user?.role !== 'ADMIN' && req.user?.role !== 'PENGURUS') {
      // Public: hanya tampilkan yang published
      where.published = true
    } else if (published !== undefined && published !== '') {
      // Admin/Pengurus: filter berdasarkan parameter
      where.published = published === 'true' || published === true
    }
    // Jika admin/pengurus dan tidak ada filter published, tampilkan semua

    if (search) {
      where.OR = [
        { title: { contains: search } },
        { content: { contains: search } }
      ]
    }

    const skip = (parseInt(page) - 1) * parseInt(limit)
    const take = parseInt(limit)

    const announcementsRaw = await prisma.announcement.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip,
      take,
      select: {
        id: true,
        title: true,
        slug: true,
        image: true,
        published: true,
        views: true,
        authorId: true,
        createdAt: true,
        updatedAt: true,
        content: req.user?.role === 'ADMIN' || req.user?.role === 'PENGURUS' 
          ? true 
          : false // Hanya admin/pengurus yang bisa melihat konten lengkap di daftar
      }
    })

    // Ambil nama author untuk pengumuman yang punya authorId
    const authorIds = announcementsRaw
      .map(a => a.authorId)
      .filter(id => id !== null && id !== undefined)
    
    let authorsMap = {}
    if (authorIds.length > 0) {
      const authors = await prisma.user.findMany({
        where: {
          id: { in: authorIds }
        },
        select: {
          id: true,
          nama: true
        }
      })
      authorsMap = authors.reduce((acc, user) => {
        acc[user.id] = user.nama
        return acc
      }, {})
    }

    // Ambil read status untuk user yang sedang login
    const userId = req.user?.userId
    let readStatusMap = {}
    if (userId && announcementsRaw.length > 0) {
      const announcementIds = announcementsRaw.map(a => a.id)
      const reads = await prisma.announcementRead.findMany({
        where: {
          userId: userId,
          announcementId: { in: announcementIds }
        },
        select: {
          announcementId: true
        }
      })
      readStatusMap = reads.reduce((acc, read) => {
        acc[read.announcementId] = true
        return acc
      }, {})
    }

    // Tambahkan nama author dan read status ke data pengumuman
    const announcements = announcementsRaw.map(announcement => ({
      ...announcement,
      image: announcement.image ? getImagePath(announcement.image, 'announcements') : null,
      authorName: announcement.authorId ? authorsMap[announcement.authorId] || 'Tidak diketahui' : null,
      isRead: userId ? !!readStatusMap[announcement.id] : false
    }))

    const total = await prisma.announcement.count({ where })

    res.json({
      announcements,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        totalPages: Math.ceil(total / parseInt(limit))
      }
    })
  } catch (error) {
    console.error('Get all announcements error:', error)
    res.status(500).json({ error: 'Terjadi kesalahan saat mengambil data berita' })
  }
}

// Ambil pengumuman berdasarkan ID atau slug
export const getAnnouncementById = async (req, res) => {
  try {
    const { id } = req.params

    const announcement = await prisma.announcement.findFirst({
      where: {
        OR: [
          { id },
          { slug: id }
        ]
      }
    })

    if (!announcement) {
      return res.status(404).json({ error: 'Berita tidak ditemukan' })
    }

    // Jika belum published dan bukan admin/pengurus, jangan tampilkan
    if (!announcement.published && req.user?.role !== 'ADMIN' && req.user?.role !== 'PENGURUS') {
      return res.status(404).json({ error: 'Berita tidak ditemukan' })
    }

    // Tambah counter views untuk pengumuman yang sudah publish
    if (announcement.published) {
      await prisma.announcement.update({
        where: { id: announcement.id },
        data: { views: { increment: 1 } }
      })
      announcement.views += 1
    }

    res.json({ 
      announcement: {
        ...announcement,
        image: announcement.image ? getImagePath(announcement.image, 'announcements') : null
      }
    })
  } catch (error) {
    console.error('Get announcement by ID error:', error)
    res.status(500).json({ error: 'Terjadi kesalahan saat mengambil data berita' })
  }
}

// Buat pengumuman (hanya ADMIN/PENGURUS)
export const createAnnouncement = async (req, res) => {
  try {
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        error: 'Validasi gagal',
        errors: errors.array() 
      })
    }

    const { title, content, image, published } = req.body
    const authorId = req.user.userId

    // Buat slug
    let slug = generateSlug(title)
    
    // Cek apakah slug sudah ada, jika ya tambahkan nomor
    let existing = await prisma.announcement.findUnique({ where: { slug } })
    let counter = 1
    while (existing) {
      slug = `${generateSlug(title)}-${counter}`
      existing = await prisma.announcement.findUnique({ where: { slug } })
      counter++
    }

    // Extract filename dari image jika full path, atau simpan langsung jika sudah filename
    const imageFilename = image ? extractFilename(image) : null

    const isPublished = published || false

    const announcement = await prisma.announcement.create({
      data: {
        title,
        slug,
        content,
        image: imageFilename,
        published: isPublished,
        authorId
      }
    })

    // Create notification untuk semua user jika langsung di-publish
    if (isPublished) {
      try {
        const { createBulkNotifications } = await import('../../services/notificationService.js')
        
        // Ambil semua user yang verified (kecuali admin)
        const users = await prisma.user.findMany({
          where: {
            verified: true,
            role: { not: 'ADMIN' }
          },
          select: { id: true }
        })

        const userIds = users.map(u => u.id)
        
        if (userIds.length > 0) {
          await createBulkNotifications(userIds, {
            triggeredBy: authorId, // Author yang publish announcement
            type: 'ANNOUNCEMENT',
            message: `Berita baru: ${announcement.title}`,
            relatedId: announcement.id,
            relatedType: 'announcement'
          })
        }
      } catch (notifError) {
        console.error('Error creating announcement notifications:', notifError)
        // Jangan gagalkan create jika notifikasi gagal
      }
    }

    res.status(201).json({
      message: 'Berita berhasil dibuat',
      announcement: {
        ...announcement,
        image: announcement.image ? getImagePath(announcement.image, 'announcements') : null
      }
    })
  } catch (error) {
    console.error('Create announcement error:', error)
    
    if (error.code === 'P2002') {
      return res.status(400).json({ error: 'Slug sudah digunakan' })
    }
    
    res.status(500).json({ error: 'Terjadi kesalahan saat membuat berita' })
  }
}

// Perbarui pengumuman (hanya ADMIN/PENGURUS, atau author sendiri jika PENGURUS)
export const updateAnnouncement = async (req, res) => {
  try {
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        error: 'Validasi gagal',
        errors: errors.array() 
      })
    }

    const { id } = req.params
    const { title, content, image, published } = req.body
    const userId = req.user.userId
    const userRole = req.user.role

    // Cek apakah pengumuman ada
    const existing = await prisma.announcement.findUnique({
      where: { id }
    })

    if (!existing) {
      return res.status(404).json({ error: 'Berita tidak ditemukan' })
    }

    // Cek izin: ADMIN bisa edit semua, PENGURUS hanya miliknya sendiri
    if (userRole === 'PENGURUS' && existing.authorId !== userId) {
      return res.status(403).json({ error: 'Anda tidak memiliki izin untuk mengedit berita ini' })
    }

    // Buat slug baru jika judul berubah
    let slug = existing.slug
    if (title && title !== existing.title) {
      slug = generateSlug(title)
      
      // Cek apakah slug baru sudah ada
      const slugExists = await prisma.announcement.findFirst({
        where: { 
          slug,
          NOT: { id }
        }
      })
      
      if (slugExists) {
        let counter = 1
        let newSlug = `${slug}-${counter}`
        while (await prisma.announcement.findFirst({ 
          where: { slug: newSlug, NOT: { id } } 
        })) {
          counter++
          newSlug = `${slug}-${counter}`
        }
        slug = newSlug
      }
    }

    const updateData = {
      ...(title && { title }),
      ...(title && { slug }),
      ...(content !== undefined && { content }),
      ...(published !== undefined && { published })
    }

    // Extract filename dari image jika full path
    if (image !== undefined) {
      updateData.image = image ? extractFilename(image) : null
    }

    const wasPublished = existing.published
    const willBePublished = published !== undefined ? (published === true || published === 'true') : wasPublished

    const announcement = await prisma.announcement.update({
      where: { id },
      data: updateData
    })

    // Create notification untuk semua user jika baru di-publish
    if (!wasPublished && willBePublished && published !== undefined) {
      try {
        const { createBulkNotifications } = await import('../../services/notificationService.js')
        
        // Ambil semua user yang verified (kecuali admin)
        const users = await prisma.user.findMany({
          where: {
            verified: true,
            role: { not: 'ADMIN' }
          },
          select: { id: true }
        })

        const userIds = users.map(u => u.id)
        
        if (userIds.length > 0) {
          await createBulkNotifications(userIds, {
            triggeredBy: authorId, // Author yang publish announcement
            type: 'ANNOUNCEMENT',
            message: `Berita baru: ${announcement.title}`,
            relatedId: announcement.id,
            relatedType: 'announcement'
          })
        }
      } catch (notifError) {
        console.error('Error creating announcement notifications:', notifError)
        // Jangan gagalkan update jika notifikasi gagal
      }
    }

    res.json({
      message: 'Berita berhasil diupdate',
      announcement: {
        ...announcement,
        image: announcement.image ? getImagePath(announcement.image, 'announcements') : null
      }
    })
  } catch (error) {
    console.error('Update announcement error:', error)
    
    if (error.code === 'P2002') {
      return res.status(400).json({ error: 'Slug sudah digunakan' })
    }
    
    res.status(500).json({ error: 'Terjadi kesalahan saat mengupdate berita' })
  }
}

// Hapus pengumuman (hanya ADMIN, atau author sendiri jika PENGURUS)
export const deleteAnnouncement = async (req, res) => {
  try {
    const { id } = req.params
    const userId = req.user.userId
    const userRole = req.user.role

    const existing = await prisma.announcement.findUnique({
      where: { id }
    })

    if (!existing) {
      return res.status(404).json({ error: 'Berita tidak ditemukan' })
    }

    // Cek izin: ADMIN bisa hapus semua, PENGURUS hanya miliknya sendiri
    if (userRole === 'PENGURUS' && existing.authorId !== userId) {
      return res.status(403).json({ error: 'Anda tidak memiliki izin untuk menghapus berita ini' })
    }

    await prisma.announcement.delete({
      where: { id }
    })

    res.json({ message: 'Berita berhasil dihapus' })
  } catch (error) {
    console.error('Delete announcement error:', error)
    res.status(500).json({ error: 'Terjadi kesalahan saat menghapus berita' })
  }
}

// Ubah status publish/unpublish
export const togglePublish = async (req, res) => {
  try {
    const { id } = req.params
    const { published } = req.body
    const userId = req.user.userId
    const userRole = req.user.role

    const existing = await prisma.announcement.findUnique({
      where: { id }
    })

    if (!existing) {
      return res.status(404).json({ error: 'Berita tidak ditemukan' })
    }

    // Cek izin: ADMIN bisa publish semua, PENGURUS hanya miliknya sendiri
    if (userRole === 'PENGURUS' && existing.authorId !== userId) {
      return res.status(403).json({ error: 'Anda tidak memiliki izin untuk mempublish berita ini' })
    }

    const wasPublished = existing.published
    const willBePublished = published === true || published === 'true'

    const announcement = await prisma.announcement.update({
      where: { id },
      data: { published: willBePublished }
    })

    // Create notification untuk semua user jika baru di-publish
    if (!wasPublished && willBePublished) {
      try {
        const { createBulkNotifications } = await import('../../services/notificationService.js')
        
        // Ambil semua user yang verified (kecuali admin)
        const users = await prisma.user.findMany({
          where: {
            verified: true,
            role: { not: 'ADMIN' }
          },
          select: { id: true }
        })

        const userIds = users.map(u => u.id)
        
        if (userIds.length > 0) {
          await createBulkNotifications(userIds, {
            triggeredBy: authorId, // Author yang publish announcement
            type: 'ANNOUNCEMENT',
            message: `Berita baru: ${announcement.title}`,
            relatedId: announcement.id,
            relatedType: 'announcement'
          })
        }
      } catch (notifError) {
        console.error('Error creating announcement notifications:', notifError)
        // Jangan gagalkan publish jika notifikasi gagal
      }
    }

    res.json({
      message: `Berita berhasil ${announcement.published ? 'dipublish' : 'di-unpublish'}`,
      announcement: {
        ...announcement,
        image: announcement.image ? getImagePath(announcement.image, 'announcements') : null
      }
    })
  } catch (error) {
    console.error('Toggle publish error:', error)
    res.status(500).json({ error: 'Terjadi kesalahan saat mengupdate status publish' })
  }
}

