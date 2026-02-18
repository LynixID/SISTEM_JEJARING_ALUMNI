import prisma from '../../config/database.js'

// Get all notifications for admin
export const getNotifications = async (req, res) => {
  try {
    const { page = 1, limit = 20, unreadOnly = false } = req.query

    const skip = (parseInt(page) - 1) * parseInt(limit)
    const take = parseInt(limit)

    const where = {}
    if (unreadOnly === 'true') {
      where.read = false
    }

    const [notifications, total, unreadCount] = await Promise.all([
      prisma.adminNotification.findMany({
        where,
        skip,
        take,
        orderBy: {
          createdAt: 'desc'
        },
        include: {
          // Include user data if userId exists
        }
      }),
      prisma.adminNotification.count({ where }),
      prisma.adminNotification.count({ where: { read: false } })
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
    console.error('Get notifications error:', error)
    res.status(500).json({ error: 'Terjadi kesalahan saat mengambil notifikasi' })
  }
}

// Mark notification as read
export const markAsRead = async (req, res) => {
  try {
    const { id } = req.params

    const notification = await prisma.adminNotification.update({
      where: { id },
      data: { read: true }
    })

    res.json({
      message: 'Notifikasi ditandai sebagai sudah dibaca',
      notification
    })
  } catch (error) {
    console.error('Mark as read error:', error)
    res.status(500).json({ error: 'Terjadi kesalahan' })
  }
}

// Mark all notifications as read
export const markAllAsRead = async (req, res) => {
  try {
    await prisma.adminNotification.updateMany({
      where: { read: false },
      data: { read: true }
    })

    res.json({
      message: 'Semua notifikasi ditandai sebagai sudah dibaca'
    })
  } catch (error) {
    console.error('Mark all as read error:', error)
    res.status(500).json({ error: 'Terjadi kesalahan' })
  }
}

// Delete notification
export const deleteNotification = async (req, res) => {
  try {
    const { id } = req.params

    await prisma.adminNotification.delete({
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


