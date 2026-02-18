import prisma from '../config/database.js'
import { getIO } from '../config/socket.js'

/**
 * Create notification untuk user
 * @param {Object} data - Notification data
 * @param {String} data.userId - User ID yang menerima notifikasi
 * @param {String} data.triggeredBy - User ID yang trigger notifikasi (optional)
 * @param {String} data.type - Type: LIKE, COMMENT, REPLY, ANNOUNCEMENT, EVENT
 * @param {String} data.message - Message notifikasi
 * @param {String} data.relatedId - ID dari post/event/announcement
 * @param {String} data.relatedType - Type: post/event/announcement
 */
export const createNotification = async ({ userId, triggeredBy = null, type, message, relatedId = null, relatedType = null }) => {
  try {
    const notification = await prisma.notification.create({
      data: {
        userId,
        triggeredBy,
        type,
        message,
        relatedId,
        relatedType
      }
    })

    // Emit Socket.io event untuk real-time notification
    try {
      const io = getIO()
      io.to(`user:${userId}`).emit('new_notification', notification)
    } catch (socketError) {
      console.error('Socket.io error:', socketError)
    }

    return notification
  } catch (error) {
    console.error('Error creating notification:', error)
    throw error
  }
}

/**
 * Create notifications untuk multiple users (untuk announcement/event baru)
 * @param {Array<String>} userIds - Array of user IDs
 * @param {Object} data - Notification data
 */
export const createBulkNotifications = async (userIds, { triggeredBy = null, type, message, relatedId = null, relatedType = null }) => {
  try {
    if (!userIds || userIds.length === 0) return []

    const notifications = await prisma.notification.createMany({
      data: userIds.map(userId => ({
        userId,
        triggeredBy,
        type,
        message,
        relatedId,
        relatedType
      }))
    })

    // Emit Socket.io event untuk semua user
    try {
      const io = getIO()
      userIds.forEach(userId => {
        io.to(`user:${userId}`).emit('new_notification', {
          userId,
          type,
          message,
          relatedId,
          relatedType,
          read: false,
          createdAt: new Date()
        })
      })
    } catch (socketError) {
      console.error('Socket.io error:', socketError)
    }

    return notifications
  } catch (error) {
    console.error('Error creating bulk notifications:', error)
    throw error
  }
}

