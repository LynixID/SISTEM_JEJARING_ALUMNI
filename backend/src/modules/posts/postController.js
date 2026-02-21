import prisma from '../../config/database.js'
import { validationResult } from 'express-validator'
import { getIO } from '../../config/socket.js'
import { getImagePath, extractFilename } from '../../utils/fileUtils.js'
import { createNotification } from '../../services/notificationService.js'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const postsUploadDir = path.join(__dirname, '../../../uploads/images/posts')

// Helper function untuk delete image file dari filesystem
const deleteImageFile = (filename) => {
  if (!filename) return
  
  try {
    const filePath = path.join(postsUploadDir, filename)
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath)
      console.log(`Deleted image: ${filename}`)
    }
  } catch (error) {
    console.error(`Error deleting image ${filename}:`, error)
    // Jangan throw error untuk prevent crash, hanya log
  }
}

// Get all posts (feed)
export const getAllPosts = async (req, res) => {
  try {
    const { page = 1, limit = 10, userId } = req.query
    const skip = (parseInt(page) - 1) * parseInt(limit)
    const take = parseInt(limit)
    const currentUserId = req.user?.userId

    const where = {}
    if (userId) {
      where.authorId = userId
      
      // Filter visibility berdasarkan status koneksi
      if (currentUserId) {
        if (currentUserId === userId) {
          // Jika melihat post sendiri, tampilkan semua
          // Tidak perlu filter visibility
        } else {
          // Jika melihat post user lain, cek apakah user sudah terkoneksi
          const connection = await prisma.connection.findFirst({
            where: {
              OR: [
                { userId: currentUserId, connectedUserId: userId, status: 'ACCEPTED' },
                { userId: userId, connectedUserId: currentUserId, status: 'ACCEPTED' }
              ]
            }
          })
          
          const isConnected = !!connection
          
          // Jika tidak terkoneksi, hanya tampilkan post PUBLIC
          if (!isConnected) {
            where.visibility = 'PUBLIC'
          }
          // Jika terkoneksi, tampilkan semua (PUBLIC dan CONNECTIONS)
        }
      } else {
        // Jika tidak login, hanya tampilkan post PUBLIC
        where.visibility = 'PUBLIC'
      }
    } else {
      // Feed umum: filter berdasarkan visibility
      if (currentUserId) {
        // Untuk feed umum, kita perlu filter berdasarkan koneksi
        // Ambil semua post PUBLIC atau CONNECTIONS dimana user terkoneksi dengan author
        const userConnections = await prisma.connection.findMany({
          where: {
            OR: [
              { userId: currentUserId, status: 'ACCEPTED' },
              { connectedUserId: currentUserId, status: 'ACCEPTED' }
            ]
          },
          select: {
            userId: true,
            connectedUserId: true
          }
        })
        
        const connectedUserIds = new Set()
        userConnections.forEach(conn => {
          if (conn.userId === currentUserId) {
            connectedUserIds.add(conn.connectedUserId)
          } else {
            connectedUserIds.add(conn.userId)
          }
        })
        
        // Filter: PUBLIC atau (CONNECTIONS dan author terkoneksi) atau post milik sendiri
        where.OR = [
          { visibility: 'PUBLIC' },
          { 
            visibility: 'CONNECTIONS',
            authorId: { in: Array.from(connectedUserIds) }
          },
          { authorId: currentUserId }
        ]
      } else {
        // Jika tidak login, hanya tampilkan PUBLIC
        where.visibility = 'PUBLIC'
      }
    }

    const [posts, total] = await Promise.all([
      prisma.post.findMany({
        where,
        skip,
        take,
        orderBy: { createdAt: 'desc' },
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
          _count: {
            select: {
              likes: true,
              comments: true
            }
          }
        }
      }),
      prisma.post.count({ where })
    ])

    // Check if current user liked each post and get mentions
    const postsWithLikes = await Promise.all(
      posts.map(async (post) => {
        let isLiked = false
        if (currentUserId) {
          const like = await prisma.like.findUnique({
            where: {
              postId_userId: {
                postId: post.id,
                userId: currentUserId
              }
            }
          })
          isLiked = !!like
        }

        // Get mentions for this post
        const mentions = await prisma.postMention.findMany({
          where: { postId: post.id },
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

        return {
          ...post,
          media: post.media ? getImagePath(post.media, 'posts') : null,
          likesCount: post._count.likes,
          commentsCount: post._count.comments,
          isLiked,
          visibility: post.visibility,
          mentions: mentions.map(m => ({
            id: m.user.id,
            nama: m.user.nama,
            fotoProfil: m.user.profile?.fotoProfil ? getImagePath(m.user.profile.fotoProfil, 'profiles') : null
          })),
          author: {
            id: post.author.id,
            nama: post.author.nama,
            fotoProfil: post.author.profile?.fotoProfil ? getImagePath(post.author.profile.fotoProfil, 'profiles') : null
          }
        }
      })
    )

    res.json({
      posts: postsWithLikes,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        totalPages: Math.ceil(total / parseInt(limit))
      }
    })
  } catch (error) {
    console.error('Get all posts error:', error)
    res.status(500).json({ error: 'Terjadi kesalahan saat mengambil data posts' })
  }
}

// Get post by ID
export const getPostById = async (req, res) => {
  try {
    const { id } = req.params

    const post = await prisma.post.findUnique({
      where: { id },
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
        _count: {
          select: {
            likes: true,
            comments: true
          }
        }
      }
    })

    if (!post) {
      return res.status(404).json({ error: 'Post tidak ditemukan' })
    }

    // Check if current user liked
    const currentUserId = req.user?.userId
    let isLiked = false
    if (currentUserId) {
      const like = await prisma.like.findUnique({
        where: {
          postId_userId: {
            postId: post.id,
            userId: currentUserId
          }
        }
      })
      isLiked = !!like
    }

    // Get mentions for this post
    const mentions = await prisma.postMention.findMany({
      where: { postId: post.id },
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

    res.json({
      post: {
        ...post,
        media: post.media ? getImagePath(post.media, 'posts') : null,
        likesCount: post._count.likes,
        commentsCount: post._count.comments,
        isLiked,
        visibility: post.visibility,
        mentions: mentions.map(m => ({
          id: m.user.id,
          nama: m.user.nama,
          fotoProfil: m.user.profile?.fotoProfil ? getImagePath(m.user.profile.fotoProfil, 'profiles') : null
        })),
        author: {
          id: post.author.id,
          nama: post.author.nama,
          fotoProfil: post.author.profile?.fotoProfil ? getImagePath(post.author.profile.fotoProfil, 'profiles') : null
        }
      }
    })
  } catch (error) {
    console.error('Get post by ID error:', error)
    res.status(500).json({ error: 'Terjadi kesalahan saat mengambil data post' })
  }
}

// Helper function untuk parse mentions dari content atau dari request body
const parseMentions = async (content, mentionsFromBody) => {
  const mentionedUserIds = new Set()

  // Jika mentions dikirim sebagai array dari frontend (user IDs)
  if (mentionsFromBody) {
    try {
      const mentions = typeof mentionsFromBody === 'string' 
        ? JSON.parse(mentionsFromBody) 
        : mentionsFromBody
      
      if (Array.isArray(mentions)) {
        mentions.forEach(id => {
          if (id && typeof id === 'string') {
            mentionedUserIds.add(id)
          }
        })
      }
    } catch (err) {
      console.error('Error parsing mentions from body:', err)
    }
  }

  // Parse @mentions dari content text (format: @nama atau @email)
  if (content) {
    const mentionRegex = /@(\w+)/g
    const matches = content.matchAll(mentionRegex)
    
    for (const match of matches) {
      const mentionText = match[1].trim()
      if (mentionText) {
        // Cari user berdasarkan nama atau email
        const user = await prisma.user.findFirst({
          where: {
            OR: [
              { nama: { contains: mentionText } },
              { email: { contains: mentionText } },
              { nim: { contains: mentionText } }
            ],
            verified: true // Hanya user yang sudah verified
          },
          select: { id: true }
        })
        
        if (user) {
          mentionedUserIds.add(user.id)
        }
      }
    }
  }

  return Array.from(mentionedUserIds)
}

// Create post
export const createPost = async (req, res) => {
  try {
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
      console.error('Validation errors:', errors.array())
      return res.status(400).json({ 
        error: 'Validasi gagal',
        errors: errors.array() 
      })
    }

    const { content, mentions: mentionsFromBody, visibility } = req.body
    
    if (!content || !content.trim()) {
      return res.status(400).json({ 
        error: 'Konten post harus diisi' 
      })
    }
    const authorId = req.user.userId
    // Simpan hanya filename di database
    const media = req.file ? req.file.filename : null
    
    // Validasi visibility
    const postVisibility = visibility === 'CONNECTIONS' ? 'CONNECTIONS' : 'PUBLIC'

    const post = await prisma.post.create({
      data: {
        content,
        media,
        authorId,
        visibility: postVisibility
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
        _count: {
          select: {
            likes: true,
            comments: true
          }
        }
      }
    })

    // Parse dan proses mentions
    try {
      const mentionedUserIds = await parseMentions(content, mentionsFromBody)
      
      // Hapus author dari mentions (tidak perlu mention diri sendiri)
      let filteredMentions = mentionedUserIds.filter(userId => userId !== authorId)

      // Validasi: hanya mention user yang sudah terkoneksi
      if (filteredMentions.length > 0) {
        const connections = await prisma.connection.findMany({
          where: {
            OR: [
              { userId: authorId, connectedUserId: { in: filteredMentions }, status: 'ACCEPTED' },
              { userId: { in: filteredMentions }, connectedUserId: authorId, status: 'ACCEPTED' }
            ]
          },
          select: {
            userId: true,
            connectedUserId: true
          }
        })

        // Filter hanya user yang benar-benar terkoneksi
        const connectedUserIds = new Set()
        connections.forEach(conn => {
          if (conn.userId === authorId) {
            connectedUserIds.add(conn.connectedUserId)
          } else {
            connectedUserIds.add(conn.userId)
          }
        })

        filteredMentions = filteredMentions.filter(userId => connectedUserIds.has(userId))
      }

      if (filteredMentions.length > 0) {
        // Get author info untuk notifikasi
        const author = await prisma.user.findUnique({
          where: { id: authorId },
          select: { nama: true }
        })

        // Create PostMention records dan notifications
        const mentionPromises = filteredMentions.map(async (userId) => {
          try {
            // Create PostMention
            await prisma.postMention.create({
              data: {
                postId: post.id,
                userId
              }
            })

            // Create notification untuk user yang disebutkan
            await createNotification({
              userId,
              triggeredBy: authorId,
              type: 'MENTION',
              message: `${author?.nama || 'Seseorang'} menyebutkan Anda dalam postingan`,
              relatedId: post.id,
              relatedType: 'post'
            })
          } catch (mentionError) {
            // Ignore duplicate mention errors (unique constraint)
            if (mentionError.code !== 'P2002') {
              console.error('Error creating mention:', mentionError)
            }
          }
        })

        await Promise.all(mentionPromises)
      }
    } catch (mentionError) {
      console.error('Error processing mentions:', mentionError)
      // Jangan gagalkan post creation jika mention error
    }

    // Emit Socket.io event untuk real-time update
    try {
      const io = getIO()
      io.emit('new_post', {
        ...post,
        media: post.media ? getImagePath(post.media, 'posts') : null,
        likesCount: 0,
        commentsCount: 0,
        isLiked: false,
        author: {
          id: post.author.id,
          nama: post.author.nama,
          fotoProfil: post.author.profile?.fotoProfil ? getImagePath(post.author.profile.fotoProfil, 'profiles') : null
        }
      })
    } catch (socketError) {
      console.error('Socket.io error:', socketError)
    }

    res.status(201).json({
      message: 'Post berhasil dibuat',
      post: {
        ...post,
        media: post.media ? getImagePath(post.media, 'posts') : null,
        likesCount: 0,
        commentsCount: 0,
        isLiked: false,
        author: {
          id: post.author.id,
          nama: post.author.nama,
          fotoProfil: post.author.profile?.fotoProfil ? getImagePath(post.author.profile.fotoProfil, 'profiles') : null
        }
      }
    })
  } catch (error) {
    console.error('Create post error:', error)
    console.error('Error details:', {
      message: error.message,
      code: error.code,
      meta: error.meta
    })
    res.status(500).json({ 
      error: 'Terjadi kesalahan saat membuat post',
      ...(process.env.NODE_ENV === 'development' && { details: error.message })
    })
  }
}

// Update post
export const updatePost = async (req, res) => {
  try {
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        error: 'Validasi gagal',
        errors: errors.array() 
      })
    }

    const { id } = req.params
    const { content, mentions: mentionsFromBody } = req.body
    const userId = req.user.userId

    // Cek apakah post ada dan user adalah author
    const existingPost = await prisma.post.findUnique({
      where: { id }
    })

    if (!existingPost) {
      return res.status(404).json({ error: 'Post tidak ditemukan' })
    }

    if (existingPost.authorId !== userId) {
      return res.status(403).json({ error: 'Anda tidak memiliki akses untuk mengupdate post ini' })
    }

    // Handle image update jika ada
    // Simpan hanya filename di database
    let media = existingPost.media
    const oldImageFilename = existingPost.media
    
    // Jika ada file baru atau request untuk remove image
    if (req.file) {
      // Hapus gambar lama jika ada
      if (oldImageFilename) {
        deleteImageFile(oldImageFilename)
      }
      media = req.file.filename
    } else if (req.body.removeImage === 'true' || req.body.media === null) {
      // Jika request untuk remove image
      if (oldImageFilename) {
        deleteImageFile(oldImageFilename)
      }
      media = null
    }

    const updatedPost = await prisma.post.update({
      where: { id },
      data: {
        content: content || existingPost.content,
        media
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
        _count: {
          select: {
            likes: true,
            comments: true
          }
        }
      }
    })

    // Handle mentions update jika content berubah
    if (content && content !== existingPost.content) {
      try {
        // Hapus mentions lama
        await prisma.postMention.deleteMany({
          where: { postId: id }
        })

        // Parse dan proses mentions baru
        const mentionedUserIds = await parseMentions(content, mentionsFromBody)
        
        // Hapus author dari mentions (tidak perlu mention diri sendiri)
        const filteredMentions = mentionedUserIds.filter(mentionedUserId => mentionedUserId !== userId)

        if (filteredMentions.length > 0) {
          // Get author info untuk notifikasi
          const author = await prisma.user.findUnique({
            where: { id: userId },
            select: { nama: true }
          })

          // Create PostMention records dan notifications
          const mentionPromises = filteredMentions.map(async (mentionedUserId) => {
            try {
              // Create PostMention
              await prisma.postMention.create({
                data: {
                  postId: id,
                  userId: mentionedUserId
                }
              })

              // Create notification untuk user yang disebutkan
              await createNotification({
                userId: mentionedUserId,
                triggeredBy: userId,
                type: 'MENTION',
                message: `${author?.nama || 'Seseorang'} menyebutkan Anda dalam postingan`,
                relatedId: id,
                relatedType: 'post'
              })
            } catch (mentionError) {
              // Ignore duplicate mention errors (unique constraint)
              if (mentionError.code !== 'P2002') {
                console.error('Error creating mention:', mentionError)
              }
            }
          })

          await Promise.all(mentionPromises)
        }
      } catch (mentionError) {
        console.error('Error processing mentions on update:', mentionError)
        // Jangan gagalkan post update jika mention error
      }
    }

    res.json({
      message: 'Post berhasil diupdate',
      post: {
        ...updatedPost,
        media: updatedPost.media ? getImagePath(updatedPost.media, 'posts') : null,
        likesCount: updatedPost._count.likes,
        commentsCount: updatedPost._count.comments,
        author: {
          id: updatedPost.author.id,
          nama: updatedPost.author.nama,
          fotoProfil: updatedPost.author.profile?.fotoProfil ? getImagePath(updatedPost.author.profile.fotoProfil, 'profiles') : null
        }
      }
    })
  } catch (error) {
    console.error('Update post error:', error)
    res.status(500).json({ error: 'Terjadi kesalahan saat mengupdate post' })
  }
}

// Delete post
export const deletePost = async (req, res) => {
  try {
    const { id } = req.params
    const userId = req.user.userId

    // Cek apakah post ada dan user adalah author
    const existingPost = await prisma.post.findUnique({
      where: { id }
    })

    if (!existingPost) {
      return res.status(404).json({ error: 'Post tidak ditemukan' })
    }

    if (existingPost.authorId !== userId) {
      return res.status(403).json({ error: 'Anda tidak memiliki akses untuk menghapus post ini' })
    }

    // Hapus gambar jika ada sebelum delete post
    if (existingPost.media) {
      deleteImageFile(existingPost.media)
    }

    await prisma.post.delete({
      where: { id }
    })

    res.json({ message: 'Post berhasil dihapus' })
  } catch (error) {
    console.error('Delete post error:', error)
    res.status(500).json({ error: 'Terjadi kesalahan saat menghapus post' })
  }
}


