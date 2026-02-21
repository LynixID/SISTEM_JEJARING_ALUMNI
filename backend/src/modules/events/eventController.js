import prisma from '../../config/database.js'
import { validationResult } from 'express-validator'
import { getImagePath, extractFilename } from '../../utils/fileUtils.js'

// Ambil semua event (publik & admin)
export const getAllEvents = async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 10, 
      search = '', 
      published = undefined 
    } = req.query

    const where = {}
    
    // Jika bukan admin, hanya tampilkan yang published
    if (req.user?.role !== 'ADMIN' && req.user?.role !== 'PENGURUS') {
      where.published = true
    } else if (published !== undefined) {
      where.published = published === 'true'
    }

    if (search) {
      where.OR = [
        { title: { contains: search } },
        { description: { contains: search } },
        { lokasi: { contains: search } }
      ]
    }

    const skip = (parseInt(page) - 1) * parseInt(limit)
    const take = parseInt(limit)

    const eventsRaw = await prisma.event.findMany({
      where,
      orderBy: { tanggal: 'asc' },
      skip,
      take,
      select: {
        id: true,
        title: true,
        description: true,
        image: true,
        tanggal: true,
        lokasi: true,
        linkDaftar: true,
        published: true,
        authorId: true,
        createdAt: true,
        updatedAt: true,
        _count: {
          select: { participants: true }
        }
      }
    })

    // Ambil nama author untuk event yang punya authorId
    const authorIds = eventsRaw
      .map(e => e.authorId)
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
    if (userId && eventsRaw.length > 0) {
      const eventIds = eventsRaw.map(e => e.id)
      const reads = await prisma.eventRead.findMany({
        where: {
          userId: userId,
          eventId: { in: eventIds }
        },
        select: {
          eventId: true
        }
      })
      readStatusMap = reads.reduce((acc, read) => {
        acc[read.eventId] = true
        return acc
      }, {})
    }

    // Tambahkan nama author, jumlah peserta, dan read status ke data event
    const eventsWithCount = eventsRaw.map(event => ({
      ...event,
      image: event.image ? getImagePath(event.image, 'events') : null,
      authorName: event.authorId ? authorsMap[event.authorId] || 'Tidak diketahui' : null,
      participantsCount: event._count.participants,
      isRead: userId ? !!readStatusMap[event.id] : false
    }))

    const total = await prisma.event.count({ where })

    res.json({
      events: eventsWithCount,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        totalPages: Math.ceil(total / parseInt(limit))
      }
    })
  } catch (error) {
    console.error('Get all events error:', error)
    res.status(500).json({ error: 'Terjadi kesalahan saat mengambil data event' })
  }
}

// Ambil event berdasarkan ID
export const getEventById = async (req, res) => {
  try {
    const { id } = req.params
    const userId = req.user?.userId

    const event = await prisma.event.findUnique({
      where: { id },
      include: {
        participants: {
          include: {
            user: {
              select: {
                id: true,
                nama: true,
                profile: {
                  select: {
                    fotoProfil: true
                  }
                }
              }
            }
          },
          take: 10,
          orderBy: { createdAt: 'desc' }
        },
        _count: {
          select: { participants: true }
        }
      }
    })

    if (!event) {
      return res.status(404).json({ error: 'Event tidak ditemukan' })
    }

    // Jika belum published dan bukan admin/pengurus, jangan tampilkan
    if (!event.published && req.user?.role !== 'ADMIN' && req.user?.role !== 'PENGURUS') {
      return res.status(404).json({ error: 'Event tidak ditemukan' })
    }

    // Cek apakah user saat ini sudah terdaftar
    let isRegistered = false
    if (userId) {
      const participant = await prisma.eventParticipant.findUnique({
        where: {
          eventId_userId: {
            eventId: id,
            userId
          }
        }
      })
      isRegistered = !!participant
    }

    res.json({ 
      event: {
        ...event,
        image: event.image ? getImagePath(event.image, 'events') : null,
        participants: event.participants?.map(p => ({
          ...p,
          user: {
            ...p.user,
            fotoProfil: p.user.profile?.fotoProfil ? getImagePath(p.user.profile.fotoProfil, 'profiles') : null
          }
        })) || [],
        participantsCount: event._count.participants,
        isRegistered
      }
    })
  } catch (error) {
    console.error('Get event by ID error:', error)
    res.status(500).json({ error: 'Terjadi kesalahan saat mengambil data event' })
  }
}

// Buat event (hanya ADMIN/PENGURUS)
export const createEvent = async (req, res) => {
  try {
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        error: 'Validasi gagal',
        errors: errors.array() 
      })
    }

    const { title, description, image, tanggal, lokasi, linkDaftar, published } = req.body
    const authorId = req.user.userId

    console.log('Create event - Received data:', { title, image })
    console.log('Image value:', image, 'Type:', typeof image)

    // Validasi tanggal tidak boleh di masa lalu (untuk event baru)
    const eventDate = new Date(tanggal)
    if (eventDate < new Date() && !published) {
      return res.status(400).json({ error: 'Tanggal event tidak boleh di masa lalu' })
    }

    // Extract filename dari image jika full path, atau simpan langsung jika sudah filename
    // Jika image kosong atau null, set ke null
    const imageFilename = (image && image.trim()) ? extractFilename(image.trim()) : null
    console.log('Extracted image filename:', imageFilename)

    const isPublished = published || false

    const event = await prisma.event.create({
      data: {
        title,
        description,
        image: imageFilename,
        tanggal: new Date(tanggal),
        lokasi: lokasi || null,
        linkDaftar: linkDaftar || null,
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
            triggeredBy: authorId, // Author yang publish event
            type: 'EVENT',
            message: `Event baru: ${event.title}`,
            relatedId: event.id,
            relatedType: 'event'
          })
        }
      } catch (notifError) {
        console.error('Error creating event notifications:', notifError)
        // Jangan gagalkan create jika notifikasi gagal
      }
    }

    res.status(201).json({
      message: 'Event berhasil dibuat',
      event: {
        ...event,
        image: event.image ? getImagePath(event.image, 'events') : null
      }
    })
  } catch (error) {
    console.error('Create event error:', error)
    res.status(500).json({ error: 'Terjadi kesalahan saat membuat event' })
  }
}

// Perbarui event (hanya ADMIN/PENGURUS)
export const updateEvent = async (req, res) => {
  try {
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        error: 'Validasi gagal',
        errors: errors.array() 
      })
    }

    const { id } = req.params
    const { title, description, image, tanggal, lokasi, linkDaftar, published } = req.body

    // Cek apakah event ada
    const existing = await prisma.event.findUnique({
      where: { id }
    })

    if (!existing) {
      return res.status(404).json({ error: 'Event tidak ditemukan' })
    }

    // Validasi tanggal
    if (tanggal) {
      const eventDate = new Date(tanggal)
      if (eventDate < new Date() && published && !existing.published) {
        return res.status(400).json({ error: 'Tanggal event tidak boleh di masa lalu' })
      }
    }

    // Extract filename dari image jika full path, atau simpan langsung jika sudah filename
    const updateData = {
      ...(title && { title }),
      ...(description !== undefined && { description }),
      ...(tanggal && { tanggal: new Date(tanggal) }),
      ...(lokasi !== undefined && { lokasi }),
      ...(linkDaftar !== undefined && { linkDaftar }),
      ...(published !== undefined && { published })
    }

    if (image !== undefined) {
      // Jika image kosong atau null, set ke null
      updateData.image = (image && image.trim()) ? extractFilename(image.trim()) : null
    }

    const wasPublished = existing.published
    const willBePublished = published !== undefined ? (published === true || published === 'true') : wasPublished

    const event = await prisma.event.update({
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
            triggeredBy: authorId, // Author yang publish event
            type: 'EVENT',
            message: `Event baru: ${event.title}`,
            relatedId: event.id,
            relatedType: 'event'
          })
        }
      } catch (notifError) {
        console.error('Error creating event notifications:', notifError)
        // Jangan gagalkan update jika notifikasi gagal
      }
    }

    res.json({
      message: 'Event berhasil diupdate',
      event: {
        ...event,
        image: event.image ? getImagePath(event.image, 'events') : null
      }
    })
  } catch (error) {
    console.error('Update event error:', error)
    res.status(500).json({ error: 'Terjadi kesalahan saat mengupdate event' })
  }
}

// Hapus event (hanya ADMIN)
export const deleteEvent = async (req, res) => {
  try {
    const { id } = req.params
    const userRole = req.user.role

    // Hanya ADMIN yang boleh menghapus event
    if (userRole !== 'ADMIN') {
      return res.status(403).json({ error: 'Hanya admin yang dapat menghapus event' })
    }

    const existing = await prisma.event.findUnique({
      where: { id }
    })

    if (!existing) {
      return res.status(404).json({ error: 'Event tidak ditemukan' })
    }

    await prisma.event.delete({
      where: { id }
    })

    res.json({ message: 'Event berhasil dihapus' })
  } catch (error) {
    console.error('Delete event error:', error)
    res.status(500).json({ error: 'Terjadi kesalahan saat menghapus event' })
  }
}

// Ubah status publish/unpublish
export const togglePublish = async (req, res) => {
  try {
    const { id } = req.params
    const { published } = req.body

    const existing = await prisma.event.findUnique({
      where: { id }
    })

    if (!existing) {
      return res.status(404).json({ error: 'Event tidak ditemukan' })
    }

    const event = await prisma.event.update({
      where: { id },
      data: { published: published === true || published === 'true' }
    })

    res.json({
      message: `Event berhasil ${event.published ? 'dipublish' : 'di-unpublish'}`,
      event: {
        ...event,
        image: event.image ? getImagePath(event.image, 'events') : null
      }
    })
  } catch (error) {
    console.error('Toggle publish error:', error)
    res.status(500).json({ error: 'Terjadi kesalahan saat mengupdate status publish' })
  }
}

// Daftar ke event
export const registerEvent = async (req, res) => {
  try {
    const { id } = req.params
    const userId = req.user.userId

    const event = await prisma.event.findUnique({
      where: { id }
    })

    if (!event) {
      return res.status(404).json({ error: 'Event tidak ditemukan' })
    }

    if (!event.published) {
      return res.status(400).json({ error: 'Event belum dipublish' })
    }

    // Cek apakah sudah terdaftar
    const existing = await prisma.eventParticipant.findUnique({
      where: {
        eventId_userId: {
          eventId: id,
          userId
        }
      }
    })

    if (existing) {
      return res.status(400).json({ error: 'Anda sudah terdaftar di event ini' })
    }

    const participant = await prisma.eventParticipant.create({
      data: {
        eventId: id,
        userId
      },
      include: {
        user: {
          select: {
            id: true,
            nama: true,
            profile: {
              select: {
                fotoProfil: true
              }
            }
          }
        }
      }
    })

    res.status(201).json({
      message: 'Berhasil mendaftar ke event',
      participant: {
        ...participant,
        user: {
          ...participant.user,
          fotoProfil: participant.user.profile?.fotoProfil ? getImagePath(participant.user.profile.fotoProfil, 'profiles') : null
        }
      }
    })
  } catch (error) {
    console.error('Register event error:', error)
    
    if (error.code === 'P2002') {
      return res.status(400).json({ error: 'Anda sudah terdaftar di event ini' })
    }
    
    res.status(500).json({ error: 'Terjadi kesalahan saat mendaftar event' })
  }
}

// Batalkan pendaftaran event
export const unregisterEvent = async (req, res) => {
  try {
    const { id } = req.params
    const userId = req.user.userId

    const existing = await prisma.eventParticipant.findUnique({
      where: {
        eventId_userId: {
          eventId: id,
          userId
        }
      }
    })

    if (!existing) {
      return res.status(404).json({ error: 'Anda belum terdaftar di event ini' })
    }

    await prisma.eventParticipant.delete({
      where: {
        eventId_userId: {
          eventId: id,
          userId
        }
      }
    })

    res.json({ message: 'Berhasil membatalkan pendaftaran event' })
  } catch (error) {
    console.error('Unregister event error:', error)
    res.status(500).json({ error: 'Terjadi kesalahan saat membatalkan pendaftaran' })
  }
}

// Ambil peserta event (hanya ADMIN/PENGURUS)
export const getEventParticipants = async (req, res) => {
  try {
    const { id } = req.params
    const { page = 1, limit = 50 } = req.query

    const event = await prisma.event.findUnique({
      where: { id }
    })

    if (!event) {
      return res.status(404).json({ error: 'Event tidak ditemukan' })
    }

    const skip = (parseInt(page) - 1) * parseInt(limit)
    const take = parseInt(limit)

    const [participants, total] = await Promise.all([
      prisma.eventParticipant.findMany({
        where: { eventId: id },
        skip,
        take,
        orderBy: { createdAt: 'desc' },
        include: {
          user: {
            select: {
              id: true,
              nama: true,
              email: true,
              nim: true,
              whatsapp: true,
              profile: {
                select: {
                  fotoProfil: true,
                  profesi: true
                }
              }
            }
          }
        }
      }),
      prisma.eventParticipant.count({ where: { eventId: id } })
    ])

    res.json({
      participants: participants.map(p => ({
        ...p,
        user: {
          ...p.user,
          fotoProfil: p.user.profile?.fotoProfil ? getImagePath(p.user.profile.fotoProfil, 'profiles') : null
        }
      })),
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        totalPages: Math.ceil(total / parseInt(limit))
      }
    })
  } catch (error) {
    console.error('Get event participants error:', error)
    res.status(500).json({ error: 'Terjadi kesalahan saat mengambil data peserta' })
  }
}

