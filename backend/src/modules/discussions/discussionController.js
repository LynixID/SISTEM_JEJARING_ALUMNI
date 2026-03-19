import prisma from '../../config/database.js'
import { validationResult } from 'express-validator'
import { getIO } from '../../config/socket.js'
import { getImagePath, extractFilename } from '../../utils/fileUtils.js'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const DISCUSSION_ROOM_PREFIX = 'discussion:'

const getCurrentUserId = (req) => req.user?.userId

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const discussionsUploadDir = path.join(__dirname, '../../../uploads/images/discussions')
const discussionMessagesUploadDir = path.join(__dirname, '../../../uploads/images/discussion_messages')

const deleteFileIfExists = (dir, filename) => {
  if (!filename) return
  try {
    const filePath = path.join(dir, filename)
    if (fs.existsSync(filePath)) fs.unlinkSync(filePath)
  } catch (err) {
    console.error('Delete file error:', err)
  }
}

const requireValidations = (req, res) => {
  const errors = validationResult(req)
  if (errors.isEmpty()) return null
  res.status(400).json({ error: 'Validasi gagal', errors: errors.array() })
  return errors
}

const getMembership = async ({ threadId, userId }) => {
  if (!userId) return null
  return prisma.discussionMember.findUnique({
    where: { threadId_userId: { threadId, userId } },
    select: { id: true, role: true, joinedAt: true },
  })
}

const canReadThread = async ({ thread, userId }) => {
  if (!thread) return false
  if (thread.visibility === 'PUBLIC') return true
  const membership = await getMembership({ threadId: thread.id, userId })
  return !!membership
}

const canModerateThread = (membership) => {
  if (!membership) return false
  return membership.role === 'OWNER' || membership.role === 'MOD'
}

const formatDiscussionMessage = (message) => ({
  id: message.id,
  threadId: message.threadId,
  content: message.content,
  media: message.media ? getImagePath(message.media, 'discussion_messages') : null,
  parentId: message.parentId,
  parent: message.parent ? {
    id: message.parent.id,
    content: message.parent.content,
    media: message.parent.media ? getImagePath(message.parent.media, 'discussion_messages') : null,
    sender: {
      id: message.parent.sender.id,
      nama: message.parent.sender.nama,
    },
  } : null,
  createdAt: message.createdAt,
  sender: {
    id: message.sender.id,
    nama: message.sender.nama,
    fotoProfil: message.sender.profile?.fotoProfil ? getImagePath(message.sender.profile.fotoProfil, 'profiles') : null,
  },
})

export const listDiscussions = async (req, res) => {
  try {
    if (requireValidations(req, res)) return

    const { page = 1, limit = 10, q } = req.query
    const skip = (parseInt(page) - 1) * parseInt(limit)
    const take = parseInt(limit)
    const currentUserId = getCurrentUserId(req)

    const where = {}
    if (q) {
      where.OR = [
        { title: { contains: q } },
        { content: { contains: q } },
      ]
    }

    const [threads, total] = await Promise.all([
      prisma.discussionThread.findMany({
        where,
        skip,
        take,
        orderBy: { updatedAt: 'desc' },
        include: {
          author: {
            select: {
              id: true,
              nama: true,
              profile: { select: { fotoProfil: true } },
            },
          },
          _count: {
            select: { members: true, messages: true },
          },
        },
      }),
      prisma.discussionThread.count({ where }),
    ])

    const memberships = currentUserId
      ? await prisma.discussionMember.findMany({
          where: {
            userId: currentUserId,
            threadId: { in: threads.map(t => t.id) },
          },
          select: { threadId: true, role: true },
        })
      : []

    const membershipMap = new Map(memberships.map(m => [m.threadId, m]))

    res.json({
      threads: threads.map(t => ({
        id: t.id,
        title: t.title,
        content: t.content,
        image: t.image ? getImagePath(t.image, 'discussions') : null,
        visibility: t.visibility,
        status: t.status,
        createdAt: t.createdAt,
        updatedAt: t.updatedAt,
        author: {
          id: t.author.id,
          nama: t.author.nama,
          fotoProfil: t.author.profile?.fotoProfil ? getImagePath(t.author.profile.fotoProfil, 'profiles') : null,
        },
        counts: {
          members: t._count.members,
          messages: t._count.messages,
        },
        membership: membershipMap.get(t.id)
          ? { role: membershipMap.get(t.id).role }
          : null,
      })),
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        totalPages: Math.ceil(total / parseInt(limit)),
      },
    })
  } catch (error) {
    console.error('List discussions error:', error)
    res.status(500).json({ error: 'Terjadi kesalahan saat mengambil diskusi' })
  }
}

export const getDiscussionById = async (req, res) => {
  try {
    const { id } = req.params
    const currentUserId = getCurrentUserId(req)

    const thread = await prisma.discussionThread.findUnique({
      where: { id },
      include: {
        author: {
          select: {
            id: true,
            nama: true,
            profile: { select: { fotoProfil: true } },
          },
        },
        _count: { select: { members: true, messages: true } },
      },
    })

    if (!thread) return res.status(404).json({ error: 'Diskusi tidak ditemukan' })

    if (!(await canReadThread({ thread, userId: currentUserId }))) {
      return res.status(403).json({ error: 'Anda harus bergabung untuk mengakses diskusi ini' })
    }

    const membership = await getMembership({ threadId: id, userId: currentUserId })

    res.json({
      thread: {
        id: thread.id,
        title: thread.title,
        content: thread.content,
        image: thread.image ? getImagePath(thread.image, 'discussions') : null,
        visibility: thread.visibility,
        status: thread.status,
        createdAt: thread.createdAt,
        updatedAt: thread.updatedAt,
        author: {
          id: thread.author.id,
          nama: thread.author.nama,
          fotoProfil: thread.author.profile?.fotoProfil ? getImagePath(thread.author.profile.fotoProfil, 'profiles') : null,
        },
        counts: {
          members: thread._count.members,
          messages: thread._count.messages,
        },
        membership: membership ? { role: membership.role, joinedAt: membership.joinedAt } : null,
      },
    })
  } catch (error) {
    console.error('Get discussion error:', error)
    res.status(500).json({ error: 'Terjadi kesalahan saat mengambil diskusi' })
  }
}

export const createDiscussion = async (req, res) => {
  try {
    if (requireValidations(req, res)) return

    const { title, content, visibility } = req.body
    const authorId = getCurrentUserId(req)
    const image = req.file ? req.file.filename : null

    const created = await prisma.$transaction(async (tx) => {
      const thread = await tx.discussionThread.create({
        data: {
          title,
          content,
          image,
          visibility: visibility === 'PRIVATE' ? 'PRIVATE' : 'PUBLIC',
          authorId,
        },
      })

      await tx.discussionMember.create({
        data: {
          threadId: thread.id,
          userId: authorId,
          role: 'OWNER',
        },
      })

      return thread
    })

    res.status(201).json({
      message: 'Diskusi berhasil dibuat',
      thread: {
        ...created,
        image: created.image ? getImagePath(created.image, 'discussions') : null,
      },
    })
  } catch (error) {
    console.error('Create discussion error:', error)
    res.status(500).json({ error: 'Terjadi kesalahan saat membuat diskusi' })
  }
}

export const updateDiscussion = async (req, res) => {
  try {
    if (requireValidations(req, res)) return

    const { id } = req.params
    const currentUserId = getCurrentUserId(req)
    const { title, content, visibility, removeImage } = req.body

    const membership = await getMembership({ threadId: id, userId: currentUserId })
    if (!canModerateThread(membership)) {
      return res.status(403).json({ error: 'Tidak memiliki izin untuk mengubah diskusi' })
    }

    const existing = await prisma.discussionThread.findUnique({
      where: { id },
      select: { id: true, image: true },
    })
    if (!existing) return res.status(404).json({ error: 'Diskusi tidak ditemukan' })

    let image = existing.image
    if (req.file) {
      if (existing.image) deleteFileIfExists(discussionsUploadDir, extractFilename(existing.image))
      image = req.file.filename
    } else if (removeImage === 'true') {
      if (existing.image) deleteFileIfExists(discussionsUploadDir, extractFilename(existing.image))
      image = null
    }

    const updated = await prisma.discussionThread.update({
      where: { id },
      data: {
        ...(title !== undefined ? { title } : {}),
        ...(content !== undefined ? { content } : {}),
        ...(visibility !== undefined ? { visibility } : {}),
        ...(image !== undefined ? { image } : {}),
      },
    })

    res.json({
      message: 'Diskusi berhasil diupdate',
      thread: {
        ...updated,
        image: updated.image ? getImagePath(updated.image, 'discussions') : null,
      },
    })
  } catch (error) {
    console.error('Update discussion error:', error)
    res.status(500).json({ error: 'Terjadi kesalahan saat mengupdate diskusi' })
  }
}

export const lockDiscussion = async (req, res) => {
  try {
    const { id } = req.params
    const currentUserId = getCurrentUserId(req)

    const membership = await getMembership({ threadId: id, userId: currentUserId })
    if (!canModerateThread(membership)) {
      return res.status(403).json({ error: 'Tidak memiliki izin untuk mengunci diskusi' })
    }

    const updated = await prisma.discussionThread.update({
      where: { id },
      data: { status: 'LOCKED' },
    })

    try {
      const io = getIO()
      io.to(`${DISCUSSION_ROOM_PREFIX}${id}`).emit('discussion_locked', { threadId: id, status: updated.status })
    } catch { /* ignore */ }

    res.json({ message: 'Diskusi berhasil dikunci', thread: updated })
  } catch (error) {
    console.error('Lock discussion error:', error)
    res.status(500).json({ error: 'Terjadi kesalahan saat mengunci diskusi' })
  }
}

export const unlockDiscussion = async (req, res) => {
  try {
    const { id } = req.params
    const currentUserId = getCurrentUserId(req)

    const membership = await getMembership({ threadId: id, userId: currentUserId })
    if (!canModerateThread(membership)) {
      return res.status(403).json({ error: 'Tidak memiliki izin untuk membuka kunci diskusi' })
    }

    const updated = await prisma.discussionThread.update({
      where: { id },
      data: { status: 'OPEN' },
    })

    try {
      const io = getIO()
      io.to(`${DISCUSSION_ROOM_PREFIX}${id}`).emit('discussion_unlocked', { threadId: id, status: updated.status })
    } catch { /* ignore */ }

    res.json({ message: 'Diskusi berhasil dibuka', thread: updated })
  } catch (error) {
    console.error('Unlock discussion error:', error)
    res.status(500).json({ error: 'Terjadi kesalahan saat membuka kunci diskusi' })
  }
}

export const joinDiscussion = async (req, res) => {
  try {
    const { id } = req.params
    const currentUserId = getCurrentUserId(req)

    const thread = await prisma.discussionThread.findUnique({
      where: { id },
      select: { id: true },
    })
    if (!thread) return res.status(404).json({ error: 'Diskusi tidak ditemukan' })

    const existing = await prisma.discussionMember.findUnique({
      where: { threadId_userId: { threadId: id, userId: currentUserId } },
      select: { id: true },
    })
    if (existing) {
      return res.json({ message: 'Anda sudah bergabung', membership: { threadId: id } })
    }

    const membership = await prisma.discussionMember.create({
      data: {
        threadId: id,
        userId: currentUserId,
        role: 'MEMBER',
      },
    })

    res.status(201).json({ message: 'Berhasil bergabung ke diskusi', membership })
  } catch (error) {
    console.error('Join discussion error:', error)
    res.status(500).json({ error: 'Terjadi kesalahan saat bergabung ke diskusi' })
  }
}

export const leaveDiscussion = async (req, res) => {
  try {
    const { id } = req.params
    const currentUserId = getCurrentUserId(req)

    const membership = await prisma.discussionMember.findUnique({
      where: { threadId_userId: { threadId: id, userId: currentUserId } },
      select: { id: true, role: true },
    })

    if (!membership) {
      return res.json({ message: 'Anda belum bergabung' })
    }

    if (membership.role === 'OWNER') {
      return res.status(400).json({ error: 'Owner tidak bisa keluar dari diskusi. Transfer owner atau hapus diskusi.' })
    }

    await prisma.discussionMember.delete({
      where: { threadId_userId: { threadId: id, userId: currentUserId } },
    })

    try {
      const io = getIO()
      io.to(`${DISCUSSION_ROOM_PREFIX}${id}`).emit('discussion_member_left', { threadId: id, userId: currentUserId })
    } catch { /* ignore */ }

    res.json({ message: 'Berhasil keluar dari diskusi' })
  } catch (error) {
    console.error('Leave discussion error:', error)
    res.status(500).json({ error: 'Terjadi kesalahan saat keluar dari diskusi' })
  }
}

export const listMessages = async (req, res) => {
  try {
    if (requireValidations(req, res)) return

    const { id } = req.params
    const { page = 1, limit = 50 } = req.query
    const skip = (parseInt(page) - 1) * parseInt(limit)
    const take = parseInt(limit)
    const currentUserId = getCurrentUserId(req)

    const thread = await prisma.discussionThread.findUnique({
      where: { id },
      select: { id: true, visibility: true },
    })
    if (!thread) return res.status(404).json({ error: 'Diskusi tidak ditemukan' })

    if (thread.visibility === 'PRIVATE') {
      const membership = await getMembership({ threadId: id, userId: currentUserId })
      if (!membership) return res.status(403).json({ error: 'Anda harus bergabung untuk melihat pesan' })
    }

    const [messages, total] = await Promise.all([
      prisma.discussionMessage.findMany({
        where: { threadId: id },
        orderBy: { createdAt: 'desc' },
        skip,
        take,
        include: {
          sender: {
            select: {
              id: true,
              nama: true,
              profile: { select: { fotoProfil: true } },
            },
          },
          parent: {
            select: {
              id: true,
              content: true,
              media: true,
              sender: { select: { id: true, nama: true } },
            },
          },
        },
      }),
      prisma.discussionMessage.count({ where: { threadId: id } }),
    ])

    res.json({
      messages: messages
        .map(formatDiscussionMessage)
        .reverse(),
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        totalPages: Math.ceil(total / parseInt(limit)),
      },
    })
  } catch (error) {
    console.error('List discussion messages error:', error)
    res.status(500).json({ error: 'Terjadi kesalahan saat mengambil pesan diskusi' })
  }
}

export const sendMessage = async (req, res) => {
  try {
    if (requireValidations(req, res)) return

    const { id } = req.params
    const { content, parentId } = req.body
    const currentUserId = getCurrentUserId(req)

    const thread = await prisma.discussionThread.findUnique({
      where: { id },
      select: { id: true, status: true, visibility: true },
    })
    if (!thread) return res.status(404).json({ error: 'Diskusi tidak ditemukan' })
    if (thread.status === 'LOCKED') return res.status(400).json({ error: 'Diskusi sedang dikunci' })

    const membership = await getMembership({ threadId: id, userId: currentUserId })
    if (!membership) return res.status(403).json({ error: 'Anda harus bergabung untuk mengirim pesan' })

    let parentMessage = null
    if (parentId) {
      parentMessage = await prisma.discussionMessage.findFirst({
        where: { id: parentId, threadId: id },
        select: { id: true },
      })
      if (!parentMessage) return res.status(400).json({ error: 'Pesan yang di-reply tidak ditemukan' })
    }

    const media = req.file ? req.file.filename : null

    const message = await prisma.discussionMessage.create({
      data: {
        threadId: id,
        senderId: currentUserId,
        content: (content || '').trim(),
        media,
        parentId: parentId || null,
      },
      include: {
        sender: {
          select: {
            id: true,
            nama: true,
            profile: { select: { fotoProfil: true } },
          },
        },
        parent: parentId ? {
          select: {
            id: true,
            content: true,
            media: true,
            sender: { select: { id: true, nama: true } },
          },
        } : undefined,
      },
    })

    await prisma.discussionThread.update({
      where: { id },
      data: { updatedAt: new Date() },
    })

    const payload = formatDiscussionMessage(message)

    try {
      const io = getIO()
      io.to(`${DISCUSSION_ROOM_PREFIX}${id}`).emit('discussion_message_new', payload)
    } catch { /* ignore */ }

    res.status(201).json({ message: 'Pesan terkirim', data: { message: payload } })
  } catch (error) {
    console.error('Send discussion message error:', error)
    res.status(500).json({ error: 'Terjadi kesalahan saat mengirim pesan' })
  }
}

export const updateMessage = async (req, res) => {
  try {
    if (requireValidations(req, res)) return

    const { id, messageId } = req.params
    const currentUserId = getCurrentUserId(req)
    const { content } = req.body

    const thread = await prisma.discussionThread.findUnique({
      where: { id },
      select: { id: true, status: true },
    })
    if (!thread) return res.status(404).json({ error: 'Diskusi tidak ditemukan' })
    if (thread.status === 'LOCKED') return res.status(400).json({ error: 'Diskusi sedang dikunci' })

    const membership = await getMembership({ threadId: id, userId: currentUserId })
    if (!membership) return res.status(403).json({ error: 'Anda harus bergabung untuk mengedit pesan' })

    const existing = await prisma.discussionMessage.findFirst({
      where: { id: messageId, threadId: id },
      select: { id: true, senderId: true },
    })
    if (!existing) return res.status(404).json({ error: 'Pesan tidak ditemukan' })
    if (existing.senderId !== currentUserId) {
      return res.status(403).json({ error: 'Anda tidak memiliki izin untuk mengedit pesan ini' })
    }

    const updated = await prisma.discussionMessage.update({
      where: { id: messageId },
      data: { content: content.trim() },
      include: {
        sender: { select: { id: true, nama: true, profile: { select: { fotoProfil: true } } } },
        parent: {
          select: {
            id: true,
            content: true,
            media: true,
            sender: { select: { id: true, nama: true } },
          },
        },
      },
    })

    const payload = formatDiscussionMessage(updated)

    try {
      const io = getIO()
      io.to(`${DISCUSSION_ROOM_PREFIX}${id}`).emit('discussion_message_updated', payload)
    } catch { /* ignore */ }

    res.json({ message: 'Pesan berhasil diupdate', data: { message: payload } })
  } catch (error) {
    console.error('Update discussion message error:', error)
    res.status(500).json({ error: 'Terjadi kesalahan saat mengupdate pesan' })
  }
}

export const deleteMessage = async (req, res) => {
  try {
    if (requireValidations(req, res)) return

    const { id, messageId } = req.params
    const currentUserId = getCurrentUserId(req)

    const membership = await getMembership({ threadId: id, userId: currentUserId })
    if (!membership) return res.status(403).json({ error: 'Anda harus bergabung untuk menghapus pesan' })

    const message = await prisma.discussionMessage.findFirst({
      where: { id: messageId, threadId: id },
      select: { id: true, senderId: true, media: true },
    })
    if (!message) return res.status(404).json({ error: 'Pesan tidak ditemukan' })

    const canDelete = message.senderId === currentUserId || membership.role === 'OWNER' || membership.role === 'MOD'
    if (!canDelete) {
      return res.status(403).json({ error: 'Anda tidak memiliki izin untuk menghapus pesan ini' })
    }

    if (message.media) {
      deleteFileIfExists(discussionMessagesUploadDir, extractFilename(message.media))
    }

    await prisma.discussionMessage.delete({ where: { id: messageId } })

    try {
      const io = getIO()
      io.to(`${DISCUSSION_ROOM_PREFIX}${id}`).emit('discussion_message_deleted', { threadId: id, messageId })
    } catch { /* ignore */ }

    res.json({ message: 'Pesan berhasil dihapus' })
  } catch (error) {
    console.error('Delete discussion message error:', error)
    res.status(500).json({ error: 'Terjadi kesalahan saat menghapus pesan' })
  }
}

