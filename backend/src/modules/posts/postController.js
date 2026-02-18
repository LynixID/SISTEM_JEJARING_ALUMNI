import prisma from '../../config/database.js'
import { validationResult } from 'express-validator'
import { getIO } from '../../config/socket.js'
import { getImagePath, extractFilename } from '../../utils/fileUtils.js'
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

    const where = {}
    if (userId) {
      where.authorId = userId
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

    // Check if current user liked each post
    const currentUserId = req.user?.userId
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

        return {
          ...post,
          media: post.media ? getImagePath(post.media, 'posts') : null,
          likesCount: post._count.likes,
          commentsCount: post._count.comments,
          isLiked,
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

    res.json({
      post: {
        ...post,
        media: post.media ? getImagePath(post.media, 'posts') : null,
        likesCount: post._count.likes,
        commentsCount: post._count.comments,
        isLiked,
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

    const { content } = req.body
    
    if (!content || !content.trim()) {
      return res.status(400).json({ 
        error: 'Konten post harus diisi' 
      })
    }
    const authorId = req.user.userId
    // Simpan hanya filename di database
    const media = req.file ? req.file.filename : null

    const post = await prisma.post.create({
      data: {
        content,
        media,
        authorId
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
    const { content } = req.body
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

