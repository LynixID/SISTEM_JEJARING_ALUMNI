import prisma from '../../config/database.js'
import { validationResult } from 'express-validator'

// Get unread count untuk announcement dan event
export const getUnreadCount = async (req, res) => {
  try {
    const userId = req.user.userId

    // Hitung announcement yang belum dibaca
    // Hanya yang published dan dibuat setelah user terdaftar
    const userCreatedAt = await prisma.user.findUnique({
      where: { id: userId },
      select: { createdAt: true }
    })

    const unreadAnnouncements = await prisma.announcement.count({
      where: {
        published: true,
        createdAt: {
          gte: userCreatedAt?.createdAt || new Date(0) // Hanya yang dibuat setelah user terdaftar
        },
        reads: {
          none: {
            userId: userId
          }
        }
      }
    })

    // Hitung event yang belum dibaca
    const unreadEvents = await prisma.event.count({
      where: {
        published: true,
        createdAt: {
          gte: userCreatedAt?.createdAt || new Date(0) // Hanya yang dibuat setelah user terdaftar
        },
        reads: {
          none: {
            userId: userId
          }
        }
      }
    })

    const totalUnread = unreadAnnouncements + unreadEvents

    res.json({
      unreadCount: totalUnread,
      unreadAnnouncements,
      unreadEvents
    })
  } catch (error) {
    console.error('Get unread count error:', error)
    res.status(500).json({ error: 'Terjadi kesalahan saat mengambil jumlah unread' })
  }
}

// Mark announcement as read
export const markAnnouncementAsRead = async (req, res) => {
  try {
    const { id } = req.params
    const userId = req.user.userId

    // Cek apakah announcement ada dan published
    const announcement = await prisma.announcement.findUnique({
      where: { id }
    })

    if (!announcement) {
      return res.status(404).json({ error: 'Pengumuman tidak ditemukan' })
    }

    if (!announcement.published) {
      return res.status(400).json({ error: 'Pengumuman belum dipublish' })
    }

    // Cek apakah sudah pernah dibaca
    const existingRead = await prisma.announcementRead.findUnique({
      where: {
        announcementId_userId: {
          announcementId: id,
          userId: userId
        }
      }
    })

    if (!existingRead) {
      // Mark as read
      await prisma.announcementRead.create({
        data: {
          announcementId: id,
          userId: userId
        }
      })
    }

    res.json({ message: 'Pengumuman ditandai sebagai sudah dibaca' })
  } catch (error) {
    console.error('Mark announcement as read error:', error)
    res.status(500).json({ error: 'Terjadi kesalahan saat menandai pengumuman' })
  }
}

// Mark event as read
export const markEventAsRead = async (req, res) => {
  try {
    const { id } = req.params
    const userId = req.user.userId

    // Cek apakah event ada dan published
    const event = await prisma.event.findUnique({
      where: { id }
    })

    if (!event) {
      return res.status(404).json({ error: 'Event tidak ditemukan' })
    }

    if (!event.published) {
      return res.status(400).json({ error: 'Event belum dipublish' })
    }

    // Cek apakah sudah pernah dibaca
    const existingRead = await prisma.eventRead.findUnique({
      where: {
        eventId_userId: {
          eventId: id,
          userId: userId
        }
      }
    })

    if (!existingRead) {
      // Mark as read
      await prisma.eventRead.create({
        data: {
          eventId: id,
          userId: userId
        }
      })
    }

    res.json({ message: 'Event ditandai sebagai sudah dibaca' })
  } catch (error) {
    console.error('Mark event as read error:', error)
    res.status(500).json({ error: 'Terjadi kesalahan saat menandai event' })
  }
}

// Get read status untuk multiple items (untuk frontend)
export const getReadStatus = async (req, res) => {
  try {
    const userId = req.user.userId
    const { announcementIds, eventIds } = req.body

    const readStatus = {
      announcements: {},
      events: {}
    }

    if (announcementIds && announcementIds.length > 0) {
      const reads = await prisma.announcementRead.findMany({
        where: {
          userId: userId,
          announcementId: { in: announcementIds }
        },
        select: {
          announcementId: true
        }
      })

      announcementIds.forEach(id => {
        readStatus.announcements[id] = reads.some(r => r.announcementId === id)
      })
    }

    if (eventIds && eventIds.length > 0) {
      const reads = await prisma.eventRead.findMany({
        where: {
          userId: userId,
          eventId: { in: eventIds }
        },
        select: {
          eventId: true
        }
      })

      eventIds.forEach(id => {
        readStatus.events[id] = reads.some(r => r.eventId === id)
      })
    }

    res.json(readStatus)
  } catch (error) {
    console.error('Get read status error:', error)
    res.status(500).json({ error: 'Terjadi kesalahan saat mengambil status read' })
  }
}

