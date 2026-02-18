import prisma from '../../config/database.js'
import { getIO } from '../../config/socket.js'

// Get all notifications for current user
export const getUserNotifications = async (req, res) => {
  try {
    const userId = req.user.userId
    const { page = 1, limit = 20, unreadOnly = false } = req.query

    const skip = (parseInt(page) - 1) * parseInt(limit)
    const take = parseInt(limit)

    const where = { userId }
    if (unreadOnly === 'true') {
      where.read = false
    }

    const [notifications, total, unreadCount] = await Promise.all([
      prisma.notification.findMany({
        where,
        skip,
        take,
        orderBy: {
          createdAt: 'desc'
        }
      }),
      prisma.notification.count({ where }),
      prisma.notification.count({ where: { userId, read: false } })
    ])

    res.json({
      notifications,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        totalPages: Math.ceil(total / parseInt(limit))
      },
      unreadCount
    })
  } catch (error) {
    console.error('Get user notifications error:', error)
    res.status(500).json({ error: 'Terjadi kesalahan saat mengambil notifikasi' })
  }
}

// Mark notification as read
export const markNotificationAsRead = async (req, res) => {
  try {
    const { id } = req.params
    const userId = req.user.userId

    // Cek apakah notifikasi milik user
    const notification = await prisma.notification.findUnique({
      where: { id }
    })

    if (!notification) {
      return res.status(404).json({ error: 'Notifikasi tidak ditemukan' })
    }

    if (notification.userId !== userId) {
      return res.status(403).json({ error: 'Anda tidak memiliki akses ke notifikasi ini' })
    }

    const updated = await prisma.notification.update({
      where: { id },
      data: { read: true }
    })

    res.json({
      message: 'Notifikasi ditandai sebagai sudah dibaca',
      notification: updated
    })
  } catch (error) {
    console.error('Mark notification as read error:', error)
    res.status(500).json({ error: 'Terjadi kesalahan' })
  }
}

// Mark all notifications as read
export const markAllNotificationsAsRead = async (req, res) => {
  try {
    const userId = req.user.userId

    await prisma.notification.updateMany({
      where: { userId, read: false },
      data: { read: true }
    })

    res.json({
      message: 'Semua notifikasi ditandai sebagai sudah dibaca'
    })
  } catch (error) {
    console.error('Mark all notifications as read error:', error)
    res.status(500).json({ error: 'Terjadi kesalahan' })
  }
}

// Delete notification
export const deleteNotification = async (req, res) => {
  try {
    const { id } = req.params
    const userId = req.user.userId

    // Cek apakah notifikasi milik user
    const notification = await prisma.notification.findUnique({
      where: { id }
    })

    if (!notification) {
      return res.status(404).json({ error: 'Notifikasi tidak ditemukan' })
    }

    if (notification.userId !== userId) {
      return res.status(403).json({ error: 'Anda tidak memiliki akses ke notifikasi ini' })
    }

    await prisma.notification.delete({
      where: { id }
    })

    res.json({
      message: 'Notifikasi berhasil dihapus'
    })
  } catch (error) {
    console.error('Delete notification error:', error)
    res.status(500).json({ error: 'Terjadi kesalahan' })
  }
}

// Get unread count
export const getUnreadCount = async (req, res) => {
  try {
    const userId = req.user.userId

    const unreadCount = await prisma.notification.count({
      where: { userId, read: false }
    })

    res.json({ unreadCount })
  } catch (error) {
    console.error('Get unread count error:', error)
    res.status(500).json({ error: 'Terjadi kesalahan' })
  }
}



