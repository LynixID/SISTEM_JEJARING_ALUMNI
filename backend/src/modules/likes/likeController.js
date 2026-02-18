import prisma from '../../config/database.js'
import { getIO } from '../../config/socket.js'

// Toggle like/unlike post
export const toggleLike = async (req, res) => {
  try {
    const { postId } = req.params
    const userId = req.user.userId

    // Cek apakah post ada
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
      return res.status(404).json({ error: 'Post tidak ditemukan' })
    }

    // Cek apakah sudah like
    const existingLike = await prisma.like.findUnique({
      where: {
        postId_userId: {
          postId,
          userId
        }
      }
    })

    let action = 'unlike'
    if (existingLike) {
      // Unlike: hapus like
      await prisma.like.delete({
        where: {
          postId_userId: {
            postId,
            userId
          }
        }
      })
    } else {
      // Like: buat like
      await prisma.like.create({
        data: {
          postId,
          userId
        }
      })
      action = 'like'
    }

    // Get updated likes count
    const likesCount = await prisma.like.count({
      where: { postId }
    })

    // Emit Socket.io event
    try {
      const io = getIO()
      io.emit('post_liked', {
        postId,
        userId,
        action,
        likesCount
      })
    } catch (socketError) {
      console.error('Socket.io error:', socketError)
    }

    // Create notification untuk post author (jika like post orang lain)
    // Hanya kirim notifikasi jika belum pernah dikirim sebelumnya (cegah spam like-unlike-like)
    if (action === 'like' && post.authorId !== userId) {
      try {
        // Cek apakah sudah ada notifikasi LIKE untuk post ini dari user yang sama sebelumnya
        const existingNotification = await prisma.notification.findFirst({
          where: {
            userId: post.authorId, // Penerima notifikasi (post author)
            triggeredBy: userId,   // User yang trigger notifikasi
            type: 'LIKE',
            relatedId: postId,
            relatedType: 'post'
          }
        })

        // Jika belum pernah ada notifikasi dari user ini untuk post ini, kirim notifikasi
        if (!existingNotification) {
          const user = await prisma.user.findUnique({
            where: { id: userId },
            select: { nama: true }
          })

          const { createNotification } = await import('../../services/notificationService.js')
          await createNotification({
            userId: post.authorId,
            triggeredBy: userId,
            type: 'LIKE',
            message: `${user?.nama || 'Seseorang'} menyukai postingan Anda`,
            relatedId: postId,
            relatedType: 'post'
          })
        } else {
          // Sudah pernah dikirim notifikasi untuk like ini, skip
          console.log(`Notification already sent for like: postId=${postId}, userId=${userId}`)
        }
      } catch (notifError) {
        console.error('Error creating notification:', notifError)
      }
    }

    res.json({
      message: action === 'like' ? 'Post berhasil di-like' : 'Post berhasil di-unlike',
      action,
      likesCount
    })
  } catch (error) {
    console.error('Toggle like error:', error)
    res.status(500).json({ error: 'Terjadi kesalahan saat memproses like' })
  }
}

// Get users who liked post
export const getLikes = async (req, res) => {
  try {
    const { postId } = req.params
    const { page = 1, limit = 20 } = req.query
    const skip = (parseInt(page) - 1) * parseInt(limit)
    const take = parseInt(limit)

    const post = await prisma.post.findUnique({
      where: { id: postId }
    })

    if (!post) {
      return res.status(404).json({ error: 'Post tidak ditemukan' })
    }

    const [likes, total] = await Promise.all([
      prisma.like.findMany({
        where: { postId },
        skip,
        take,
        orderBy: { createdAt: 'desc' },
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
      }),
      prisma.like.count({ where: { postId } })
    ])

    const formattedLikes = likes.map(like => ({
      id: like.id,
      createdAt: like.createdAt,
      user: {
        id: like.user.id,
        nama: like.user.nama,
        fotoProfil: like.user.profile?.fotoProfil || null
      }
    }))

    res.json({
      likes: formattedLikes,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        totalPages: Math.ceil(total / parseInt(limit))
      }
    })
  } catch (error) {
    console.error('Get likes error:', error)
    res.status(500).json({ error: 'Terjadi kesalahan saat mengambil data likes' })
  }
}


