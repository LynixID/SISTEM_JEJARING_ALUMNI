import prisma from '../../config/database.js'
import { getIO } from '../../config/socket.js'
import { getImagePath, extractFilename } from '../../utils/fileUtils.js'
import { createNotification } from '../../services/notificationService.js'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const messagesUploadDir = path.join(__dirname, '../../../uploads/images/messages')

// Helper function untuk delete image file
const deleteImageFile = (filename) => {
  if (!filename) return
  
  try {
    const filePath = path.join(messagesUploadDir, filename)
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath)
      console.log(`Deleted message image: ${filename}`)
    }
  } catch (error) {
    console.error(`Error deleting message image ${filename}:`, error)
  }
}

// Get conversations list (list semua user yang pernah chat)
export const getConversations = async (req, res) => {
  try {
    const currentUserId = req.user.userId

    // Ambil semua pesan yang melibatkan current user
    const messages = await prisma.message.findMany({
      where: {
        OR: [
          { senderId: currentUserId },
          { receiverId: currentUserId }
        ]
      },
      include: {
        sender: {
          select: {
            id: true,
            nama: true,
            profile: {
              select: {
                fotoProfil: true
              }
            }
          }
        },
        receiver: {
          select: {
            id: true,
            nama: true,
            profile: {
              select: {
                fotoProfil: true
              }
            }
          }
        },
        parent: {
          select: {
            id: true,
            content: true,
            sender: {
              select: {
                id: true,
                nama: true
              }
            }
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    })

    // Group by conversation partner dan ambil pesan terakhir
    const conversationsMap = new Map()
    
    messages.forEach(message => {
      const partnerId = message.senderId === currentUserId 
        ? message.receiverId 
        : message.senderId
      
      const partner = message.senderId === currentUserId 
        ? message.receiver 
        : message.sender

      if (!conversationsMap.has(partnerId)) {
        // Hitung unread count
        const unreadCount = messages.filter(m => 
          ((m.senderId === partnerId && m.receiverId === currentUserId) || 
           (m.senderId === currentUserId && m.receiverId === partnerId)) &&
          !m.read &&
          m.receiverId === currentUserId
        ).length

        conversationsMap.set(partnerId, {
          partner: {
            id: partner.id,
            nama: partner.nama,
            fotoProfil: partner.profile?.fotoProfil 
              ? getImagePath(partner.profile.fotoProfil, 'profiles') 
              : null
          },
          lastMessage: {
            id: message.id,
            content: message.content,
            media: message.media ? getImagePath(message.media, 'messages') : null,
            createdAt: message.createdAt,
            senderId: message.senderId
          },
          unreadCount,
          updatedAt: message.createdAt
        })
      }
    })

    const conversations = Array.from(conversationsMap.values())
      .sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt))

    res.json({
      success: true,
      data: { conversations }
    })
  } catch (error) {
    console.error('Error fetching conversations:', error)
    res.status(500).json({ error: 'Gagal mengambil daftar percakapan' })
  }
}

// Get messages dengan user tertentu
export const getMessages = async (req, res) => {
  try {
    const currentUserId = req.user.userId
    const { userId } = req.params
    const { page = 1, limit = 50 } = req.query
    const skip = (parseInt(page) - 1) * parseInt(limit)
    const take = parseInt(limit)

    // Validasi: pastikan user yang diakses adalah partner chat yang valid
    if (userId === currentUserId) {
      return res.status(400).json({ error: 'Tidak bisa chat dengan diri sendiri' })
    }

    // Cek apakah user ada
    const partner = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        nama: true,
        profile: {
          select: {
            fotoProfil: true
          }
        }
      }
    })

    if (!partner) {
      return res.status(404).json({ error: 'User tidak ditemukan' })
    }

    // Ambil pesan
    const [messages, total] = await Promise.all([
      prisma.message.findMany({
        where: {
          OR: [
            { senderId: currentUserId, receiverId: userId },
            { senderId: userId, receiverId: currentUserId }
          ]
        },
        include: {
          sender: {
            select: {
              id: true,
              nama: true,
              profile: {
                select: {
                  fotoProfil: true
                }
              }
            }
          },
          receiver: {
            select: {
              id: true,
              nama: true,
              profile: {
                select: {
                  fotoProfil: true
                }
              }
            }
          },
          parent: {
            select: {
              id: true,
              content: true,
              media: true,
              sender: {
                select: {
                  id: true,
                  nama: true
                }
              }
            }
          }
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take
      }),
      prisma.message.count({
        where: {
          OR: [
            { senderId: currentUserId, receiverId: userId },
            { senderId: userId, receiverId: currentUserId }
          ]
        }
      })
    ])

    // Format messages
    const formattedMessages = messages.map(message => ({
      id: message.id,
      content: message.content,
      media: message.media ? getImagePath(message.media, 'messages') : null,
      senderId: message.senderId,
      receiverId: message.receiverId,
      parentId: message.parentId,
      parent: message.parent ? {
        id: message.parent.id,
        content: message.parent.content,
        media: message.parent.media ? getImagePath(message.parent.media, 'messages') : null,
        sender: {
          id: message.parent.sender.id,
          nama: message.parent.sender.nama
        }
      } : null,
      read: message.read,
      createdAt: message.createdAt,
      sender: {
        id: message.sender.id,
        nama: message.sender.nama,
        fotoProfil: message.sender.profile?.fotoProfil 
          ? getImagePath(message.sender.profile.fotoProfil, 'profiles') 
          : null
      }
    })).reverse() // Reverse untuk tampilkan dari oldest ke newest

    // Mark messages as read
    await prisma.message.updateMany({
      where: {
        senderId: userId,
        receiverId: currentUserId,
        read: false
      },
      data: {
        read: true
      }
    })

    res.json({
      success: true,
      data: {
        messages: formattedMessages,
        partner: {
          id: partner.id,
          nama: partner.nama,
          fotoProfil: partner.profile?.fotoProfil 
            ? getImagePath(partner.profile.fotoProfil, 'profiles') 
            : null
        },
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          totalPages: Math.ceil(total / parseInt(limit))
        }
      }
    })
  } catch (error) {
    console.error('Error fetching messages:', error)
    res.status(500).json({ error: 'Gagal mengambil pesan' })
  }
}

// Send message
export const sendMessage = async (req, res) => {
  try {
    const currentUserId = req.user.userId
    const { receiverId, content, parentId } = req.body
    const mediaFile = req.file

    // Validasi
    if (!receiverId) {
      return res.status(400).json({ error: 'Receiver ID diperlukan' })
    }

    if (!content && !mediaFile) {
      return res.status(400).json({ error: 'Pesan atau media diperlukan' })
    }

    if (receiverId === currentUserId) {
      return res.status(400).json({ error: 'Tidak bisa mengirim pesan ke diri sendiri' })
    }

    // Cek apakah receiver ada
    const receiver = await prisma.user.findUnique({
      where: { id: receiverId },
      select: { id: true, nama: true }
    })

    if (!receiver) {
      return res.status(404).json({ error: 'User tidak ditemukan' })
    }

    // Validasi parentId jika ada
    let parentMessage = null
    if (parentId) {
      parentMessage = await prisma.message.findFirst({
        where: {
          id: parentId,
          OR: [
            { senderId: currentUserId, receiverId: receiverId },
            { senderId: receiverId, receiverId: currentUserId }
          ]
        }
      })

      if (!parentMessage) {
        return res.status(400).json({ error: 'Pesan yang di-reply tidak ditemukan' })
      }
    }

    // Handle media upload
    let mediaPath = null
    if (mediaFile) {
      mediaPath = mediaFile.filename
    }

    // Create message
    const message = await prisma.message.create({
      data: {
        content: content || '',
        senderId: currentUserId,
        receiverId: receiverId,
        parentId: parentId || null,
        media: mediaPath
      },
      include: {
        sender: {
          select: {
            id: true,
            nama: true,
            profile: {
              select: {
                fotoProfil: true
              }
            }
          }
        },
        receiver: {
          select: {
            id: true,
            nama: true
          }
        },
        parent: parentId ? {
          select: {
            id: true,
            content: true,
            media: true,
            sender: {
              select: {
                id: true,
                nama: true
              }
            }
          }
        } : undefined
      }
    })

    // Format response
    const formattedMessage = {
      id: message.id,
      content: message.content,
      media: message.media ? getImagePath(message.media, 'messages') : null,
      senderId: message.senderId,
      receiverId: message.receiverId,
      parentId: message.parentId,
      parent: message.parent ? {
        id: message.parent.id,
        content: message.parent.content,
        media: message.parent.media ? getImagePath(message.parent.media, 'messages') : null,
        sender: {
          id: message.parent.sender.id,
          nama: message.parent.sender.nama
        }
      } : null,
      read: message.read,
      createdAt: message.createdAt,
      sender: {
        id: message.sender.id,
        nama: message.sender.nama,
        fotoProfil: message.sender.profile?.fotoProfil 
          ? getImagePath(message.sender.profile.fotoProfil, 'profiles') 
          : null
      }
    }

    // Emit socket event untuk real-time
    const io = getIO()
    io.to(`user:${receiverId}`).emit('newMessage', formattedMessage)
    io.to(`user:${currentUserId}`).emit('messageSent', formattedMessage)

    // Create notification
    await createNotification({
      userId: receiverId,
      triggeredBy: currentUserId,
      type: 'MESSAGE',
      message: `${message.sender.nama} mengirimkan pesan`,
      relatedId: message.id,
      relatedType: 'message',
      read: false
    })

    res.status(201).json({
      success: true,
      data: { message: formattedMessage }
    })
  } catch (error) {
    console.error('Error sending message:', error)
    res.status(500).json({ error: 'Gagal mengirim pesan' })
  }
}

// Delete message
export const deleteMessage = async (req, res) => {
  try {
    const currentUserId = req.user.userId
    const { id } = req.params

    const message = await prisma.message.findUnique({
      where: { id }
    })

    if (!message) {
      return res.status(404).json({ error: 'Pesan tidak ditemukan' })
    }

    // Hanya sender yang bisa delete
    if (message.senderId !== currentUserId) {
      return res.status(403).json({ error: 'Tidak memiliki izin untuk menghapus pesan ini' })
    }

    // Delete media file jika ada
    if (message.media) {
      deleteImageFile(message.media)
    }

    // Delete message
    await prisma.message.delete({
      where: { id }
    })

    // Emit socket event
    const io = getIO()
    io.to(`user:${message.receiverId}`).emit('messageDeleted', { messageId: id })
    io.to(`user:${currentUserId}`).emit('messageDeleted', { messageId: id })

    res.json({
      success: true,
      message: 'Pesan berhasil dihapus'
    })
  } catch (error) {
    console.error('Error deleting message:', error)
    res.status(500).json({ error: 'Gagal menghapus pesan' })
  }
}

// Mark messages as read
export const markAsRead = async (req, res) => {
  try {
    const currentUserId = req.user.userId
    const { userId } = req.params

    await prisma.message.updateMany({
      where: {
        senderId: userId,
        receiverId: currentUserId,
        read: false
      },
      data: {
        read: true
      }
    })

    // Emit socket event
    const io = getIO()
    io.to(`user:${userId}`).emit('messagesRead', { userId: currentUserId })

    res.json({
      success: true,
      message: 'Pesan ditandai sebagai sudah dibaca'
    })
  } catch (error) {
    console.error('Error marking messages as read:', error)
    res.status(500).json({ error: 'Gagal menandai pesan sebagai sudah dibaca' })
  }
}

