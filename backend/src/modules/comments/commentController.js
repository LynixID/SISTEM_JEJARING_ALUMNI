import prisma from '../../config/database.js'
import { validationResult } from 'express-validator'
import { getIO } from '../../config/socket.js'
import { getImagePath } from '../../utils/fileUtils.js'

// Get comments untuk post dengan pagination (hanya parent comments dengan replies)
export const getComments = async (req, res) => {
  try {
    const { postId } = req.params
    const { page = 1, limit = 20 } = req.query
    const skip = (parseInt(page) - 1) * parseInt(limit)
    const take = parseInt(limit)

    // Validasi post exists
    const post = await prisma.post.findUnique({
      where: { id: postId }
    })

    if (!post) {
      return res.status(404).json({ error: 'Post tidak ditemukan' })
    }

    // Hanya ambil parent comments (parentId = null)
    const [parentComments, total] = await Promise.all([
      prisma.comment.findMany({
        where: { 
          postId,
          parentId: null // Hanya parent comments
        },
        skip,
        take,
        orderBy: { createdAt: 'asc' },
        include: {
          author: {
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
          replies: {
            orderBy: { createdAt: 'asc' },
            include: {
              author: {
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
          }
        }
      }),
      prisma.comment.count({ 
        where: { 
          postId,
          parentId: null 
        } 
      })
    ])

    const formattedComments = parentComments.map(comment => ({
      ...comment,
      author: {
        id: comment.author.id,
        nama: comment.author.nama,
        fotoProfil: comment.author.profile?.fotoProfil 
          ? getImagePath(comment.author.profile.fotoProfil, 'profiles')
          : null
      },
      replies: comment.replies.map(reply => ({
        ...reply,
        author: {
          id: reply.author.id,
          nama: reply.author.nama,
          fotoProfil: reply.author.profile?.fotoProfil
            ? getImagePath(reply.author.profile.fotoProfil, 'profiles')
            : null
        }
      }))
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
    console.error('Get comments error:', error)
    res.status(500).json({ error: 'Terjadi kesalahan saat mengambil data komentar' })
  }
}

// Create comment dengan support untuk nested comments (max 2 levels)
export const createComment = async (req, res) => {
  try {
    // Validasi input dari express-validator
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
      console.error('Validation errors:', errors.array())
      return res.status(400).json({ 
        error: 'Validasi gagal',
        errors: errors.array() 
      })
    }

    const { postId } = req.params
    const { content, parentId } = req.body
    const authorId = req.user.userId

    // Validasi postId format
    if (!postId || typeof postId !== 'string') {
      console.error('Invalid postId:', postId)
      return res.status(400).json({ error: 'Post ID tidak valid' })
    }

    // Validasi content tidak kosong
    if (!content || typeof content !== 'string' || !content.trim()) {
      console.error('Invalid content:', content)
      return res.status(400).json({ error: 'Konten komentar harus diisi' })
    }

    // Validasi post exists
    const post = await prisma.post.findUnique({
      where: { id: postId },
      include: {
        author: {
          select: {
            id: true
          }
        }
      }
    })

    if (!post) {
      console.error('Post not found:', postId)
      return res.status(404).json({ error: 'Post tidak ditemukan' })
    }

    // Jika parentId ada, validasi bahwa parent comment ada dan bukan reply (hanya 2 tingkat)
    // Validasi parent comment jika ini adalah reply (enforce max 2 levels)
    if (parentId) {
      const parentComment = await prisma.comment.findUnique({
        where: { id: parentId },
        include: {
          parent: true // Check apakah parent comment punya parent (level 2 check)
        }
      })

      if (!parentComment) {
        return res.status(404).json({ error: 'Komentar parent tidak ditemukan' })
      }

      // Enforce max 2 levels: tidak bisa reply ke reply
      if (parentComment.parentId) {
        return res.status(400).json({ error: 'Tidak dapat membalas komentar yang sudah merupakan balasan' })
      }

      // Validasi parent comment dari post yang sama
      if (parentComment.postId !== postId) {
        return res.status(400).json({ error: 'Komentar parent tidak valid untuk post ini' })
      }
    }

    const comment = await prisma.comment.create({
      data: {
        content,
        postId,
        authorId,
        parentId: parentId || null
      },
      include: {
        author: {
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
        parent: parentId ? {
          select: {
            id: true,
            author: {
              select: {
                id: true,
                nama: true
              }
            }
          }
        } : false
      }
    })

    // Emit Socket.io event
    try {
      const io = getIO()
      io.emit('new_comment', {
        ...comment,
        postId,
        parentId: comment.parentId,
        author: {
          id: comment.author.id,
          nama: comment.author.nama,
          fotoProfil: comment.author.profile?.fotoProfil
            ? getImagePath(comment.author.profile.fotoProfil, 'profiles')
            : null
        }
      })
    } catch (socketError) {
      console.error('Socket.io error:', socketError)
    }

    // Create notification
    try {
      const commentAuthor = await prisma.user.findUnique({
        where: { id: authorId },
        select: { nama: true }
      })

      const { createNotification } = await import('../../services/notificationService.js')

      // Notifikasi untuk post author (jika bukan comment sendiri dan bukan reply)
      if (post.authorId !== authorId && !parentId) {
        await createNotification({
          userId: post.authorId,
          triggeredBy: authorId,
          type: 'COMMENT',
          message: `${commentAuthor?.nama || 'Seseorang'} mengomentari postingan Anda`,
          relatedId: postId,
          relatedType: 'post'
        })
      }

      // Notifikasi untuk parent comment author (jika reply)
      if (parentId && comment.parent?.author.id !== authorId) {
        await createNotification({
          userId: comment.parent.author.id,
          triggeredBy: authorId,
          type: 'REPLY',
          message: `${commentAuthor?.nama || 'Seseorang'} membalas komentar Anda`,
          relatedId: postId,
          relatedType: 'post'
        })
      }
    } catch (notifError) {
      console.error('Error creating notification:', notifError)
    }

    res.status(201).json({
      message: 'Komentar berhasil dibuat',
      comment: {
        ...comment,
        parentId: comment.parentId,
        author: {
          id: comment.author.id,
          nama: comment.author.nama,
          fotoProfil: comment.author.profile?.fotoProfil || null
        }
      }
    })
  } catch (error) {
    console.error('Create comment error:', error)
    res.status(500).json({ error: 'Terjadi kesalahan saat membuat komentar' })
  }
}

// Update comment dengan authorization check
export const updateComment = async (req, res) => {
  try {
    // Validasi input dari express-validator
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        error: 'Validasi gagal',
        errors: errors.array() 
      })
    }

    const { id } = req.params
    const { content } = req.body
    const userId = req.user.userId

    // Validasi comment exists
    const existingComment = await prisma.comment.findUnique({
      where: { id }
    })

    if (!existingComment) {
      return res.status(404).json({ error: 'Komentar tidak ditemukan' })
    }

    // Authorization check: hanya author yang bisa update
    if (existingComment.authorId !== userId) {
      return res.status(403).json({ error: 'Anda tidak memiliki akses untuk mengupdate komentar ini' })
    }

    const updatedComment = await prisma.comment.update({
      where: { id },
      data: { content },
      include: {
        author: {
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
        parent: existingComment.parentId ? {
          select: {
            id: true
          }
        } : false
      }
    })

    // Emit Socket.io event untuk real-time update
    try {
      const io = getIO()
      io.emit('comment_updated', {
        commentId: id,
        postId: existingComment.postId,
        parentId: existingComment.parentId,
        comment: {
          ...updatedComment,
          author: {
            id: updatedComment.author.id,
            nama: updatedComment.author.nama,
            fotoProfil: updatedComment.author.profile?.fotoProfil
              ? getImagePath(updatedComment.author.profile.fotoProfil, 'profiles')
              : null
          }
        }
      })
    } catch (socketError) {
      console.error('Socket.io error:', socketError)
    }

    res.json({
      message: 'Komentar berhasil diupdate',
      comment: {
        ...updatedComment,
        author: {
          id: updatedComment.author.id,
          nama: updatedComment.author.nama,
          fotoProfil: updatedComment.author.profile?.fotoProfil || null
        }
      }
    })
  } catch (error) {
    console.error('Update comment error:', error)
    res.status(500).json({ error: 'Terjadi kesalahan saat mengupdate komentar' })
  }
}

// Delete comment
export const deleteComment = async (req, res) => {
  try {
    const { id } = req.params
    const userId = req.user.userId

    if (!id) {
      return res.status(400).json({ error: 'Comment ID tidak valid' })
    }

    const existingComment = await prisma.comment.findUnique({
      where: { id },
      include: {
        replies: {
          select: { id: true }
        }
      }
    })

    if (!existingComment) {
      return res.status(404).json({ error: 'Komentar tidak ditemukan' })
    }

    if (existingComment.authorId !== userId) {
      return res.status(403).json({ error: 'Anda tidak memiliki akses untuk menghapus komentar ini' })
    }

    // Simpan info tentang replies yang akan terhapus (cascade)
    const repliesCount = existingComment.replies?.length || 0
    const isParentComment = !existingComment.parentId

    // Delete comment (cascade akan menghapus replies secara otomatis karena onDelete: Cascade)
    await prisma.comment.delete({
      where: { id }
    })

    // Emit Socket.io event untuk real-time update
    try {
      const io = getIO()
      io.emit('comment_deleted', {
        commentId: id,
        postId: existingComment.postId,
        parentId: existingComment.parentId,
        repliesCount: repliesCount, // Jumlah replies yang ikut terhapus
        isParentComment: isParentComment
      })
    } catch (socketError) {
      console.error('Socket.io error:', socketError)
    }

    res.json({ message: 'Komentar berhasil dihapus' })
  } catch (error) {
    console.error('Delete comment error:', error)
    console.error('Error details:', {
      message: error.message,
      code: error.code,
      meta: error.meta
    })
    res.status(500).json({ 
      error: 'Terjadi kesalahan saat menghapus komentar',
      ...(process.env.NODE_ENV === 'development' && { details: error.message })
    })
  }
}

