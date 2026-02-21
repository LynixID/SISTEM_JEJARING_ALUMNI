import prisma from '../../config/database.js'
import { getIO } from '../../config/socket.js'
import { createNotification } from '../../services/notificationService.js'

// Send connection request
export const sendConnectionRequest = async (req, res) => {
  try {
    const { connectedUserId, message } = req.body
    const userId = req.user.userId

    // Validasi
    if (!connectedUserId) {
      return res.status(400).json({ error: 'User ID diperlukan' })
    }

    if (userId === connectedUserId) {
      return res.status(400).json({ error: 'Tidak dapat mengirim request koneksi ke diri sendiri' })
    }

    // Cek apakah user target ada
    const targetUser = await prisma.user.findUnique({
      where: { id: connectedUserId },
      select: { id: true, nama: true, verified: true }
    })

    if (!targetUser) {
      return res.status(404).json({ error: 'User tidak ditemukan' })
    }

    if (!targetUser.verified) {
      return res.status(400).json({ error: 'User belum terverifikasi' })
    }

    // Cek apakah sudah ada connection
    const existingConnection = await prisma.connection.findFirst({
      where: {
        OR: [
          { userId, connectedUserId },
          { userId: connectedUserId, connectedUserId: userId }
        ]
      }
    })

    if (existingConnection) {
      if (existingConnection.status === 'PENDING') {
        return res.status(400).json({ error: 'Request koneksi sudah dikirim sebelumnya' })
      }
      if (existingConnection.status === 'ACCEPTED') {
        return res.status(400).json({ error: 'Anda sudah terhubung dengan user ini' })
      }
    }

    // Buat connection request
    console.log('=== Creating Connection Request ===')
    console.log('Requester (userId):', userId)
    console.log('Target (connectedUserId):', connectedUserId)
    console.log('Message:', message)
    
    const connection = await prisma.connection.create({
      data: {
        userId, // Requester (yang mengirim request)
        connectedUserId, // Target (yang menerima request)
        status: 'PENDING',
        message: message || null
      },
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
    
    console.log('Connection created:', {
      id: connection.id,
      userId: connection.userId,
      connectedUserId: connection.connectedUserId,
      status: connection.status
    })
    console.log('=== End Creating Connection Request ===')

    // Buat notifikasi untuk user target
    try {
      await createNotification({
        userId: connectedUserId,
        triggeredBy: userId,
        type: 'CONNECTION_REQUEST',
        message: `${connection.user.nama} ingin terhubung dengan Anda`,
        relatedId: connection.id,
        relatedType: 'connection'
      })
    } catch (notifError) {
      console.error('Error creating connection notification:', notifError)
    }

    res.status(201).json({
      message: 'Request koneksi berhasil dikirim',
      connection: {
        id: connection.id,
        status: connection.status,
        message: connection.message,
        createdAt: connection.createdAt,
        user: {
          id: connection.user.id,
          nama: connection.user.nama,
          fotoProfil: connection.user.profile?.fotoProfil || null
        }
      }
    })
  } catch (error) {
    console.error('Send connection request error:', error)
    res.status(500).json({ error: 'Terjadi kesalahan saat mengirim request koneksi' })
  }
}

// Get connection requests (incoming)
export const getConnectionRequests = async (req, res) => {
  try {
    const userId = req.user.userId
    const { status = 'PENDING' } = req.query

    console.log('=== Get Connection Requests ===')
    console.log('User ID:', userId)
    console.log('Status filter:', status)
    console.log('req.user:', req.user)

    // Debug: Cek semua connections di database
    try {
      const allConnections = await prisma.connection.findMany({
        select: {
          id: true,
          userId: true,
          connectedUserId: true,
          status: true
        }
      })
      console.log('All connections in database:', allConnections)
    } catch (debugError) {
      console.error('Error fetching all connections for debug:', debugError)
    }

    // Query untuk mencari request yang ditujukan ke user ini (connectedUserId = userId)
    let connections = []
    try {
      connections = await prisma.connection.findMany({
        where: {
          connectedUserId: userId, // Request yang ditujukan ke user ini
          status: status.toUpperCase()
        },
        include: {
          user: { // user adalah requester (yang mengirim request)
            select: {
              id: true,
              nama: true,
              email: true,
              angkatan: true, // angkatan ada di User, bukan Profile
              domisili: true, // domisili ada di User, bukan Profile
              profile: {
                select: {
                  fotoProfil: true // hanya fotoProfil yang ada di Profile
                }
              }
            }
          }
        },
        orderBy: {
          createdAt: 'desc'
        }
      })
    } catch (queryError) {
      console.error('Error executing Prisma query:', queryError)
      throw queryError
    }

    console.log('Found connections:', connections.length)
    try {
      console.log('Query result:', connections.map(c => ({
        id: c.id,
        userId: c.userId,
        connectedUserId: c.connectedUserId,
        status: c.status,
        userNama: c.user?.nama || 'NO USER'
      })))
      if (connections.length > 0) {
        // Safe JSON stringify - hanya ambil data yang diperlukan
        const sample = {
          id: connections[0].id,
          userId: connections[0].userId,
          connectedUserId: connections[0].connectedUserId,
          status: connections[0].status,
          message: connections[0].message,
          user: connections[0].user ? {
            id: connections[0].user.id,
            nama: connections[0].user.nama,
            email: connections[0].user.email
          } : null
        }
        console.log('Sample connection:', JSON.stringify(sample, null, 2))
      }
    } catch (logError) {
      console.error('Error logging connection data:', logError)
    }

    const formattedRequests = connections
      .filter(conn => conn.user !== null) // Filter out connections with null user
      .map(conn => {
        const requestData = {
          id: conn.id,
          status: conn.status,
          message: conn.message,
          createdAt: conn.createdAt,
          user: {
            id: conn.user.id,
            nama: conn.user.nama,
            email: conn.user.email,
            fotoProfil: conn.user.profile?.fotoProfil || null,
            angkatan: conn.user.angkatan || null, // angkatan ada di User, bukan Profile
            domisili: conn.user.domisili || null // domisili ada di User, bukan Profile
          }
        }
        return requestData
      })

    console.log('Formatted requests count:', formattedRequests.length)
    console.log('=== End Get Connection Requests ===')

    res.json({
      requests: formattedRequests
    })
  } catch (error) {
    console.error('=== Get Connection Requests Error ===')
    console.error('Error message:', error.message)
    console.error('Error name:', error.name)
    console.error('Error stack:', error.stack)
    if (error.code) {
      console.error('Error code:', error.code)
    }
    if (error.meta) {
      console.error('Error meta:', error.meta)
    }
    console.error('Full error:', error)
    console.error('=== End Error ===')
    res.status(500).json({ 
      error: 'Terjadi kesalahan saat mengambil request koneksi',
      ...(process.env.NODE_ENV === 'development' && { details: error.message })
    })
  }
}

// Accept connection request
export const acceptConnection = async (req, res) => {
  try {
    const { id } = req.params
    const userId = req.user.userId

    const connection = await prisma.connection.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            id: true,
            nama: true
          }
        }
      }
    })

    if (!connection) {
      return res.status(404).json({ error: 'Request koneksi tidak ditemukan' })
    }

    if (connection.connectedUserId !== userId) {
      return res.status(403).json({ error: 'Anda tidak memiliki akses untuk request ini' })
    }

    if (connection.status !== 'PENDING') {
      return res.status(400).json({ error: 'Request sudah diproses sebelumnya' })
    }

    // Update status ke ACCEPTED
    const updatedConnection = await prisma.connection.update({
      where: { id },
      data: { status: 'ACCEPTED' },
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

    // Buat notifikasi untuk requester
    try {
      await createNotification({
        userId: connection.user.id,
        triggeredBy: userId,
        type: 'CONNECTION_ACCEPTED',
        message: `${req.user.nama || 'Seseorang'} menerima request koneksi Anda`,
        relatedId: connection.id,
        relatedType: 'connection'
      })
    } catch (notifError) {
      console.error('Error creating acceptance notification:', notifError)
    }

    res.json({
      message: 'Request koneksi diterima',
      connection: {
        id: updatedConnection.id,
        status: updatedConnection.status,
        user: {
          id: updatedConnection.user.id,
          nama: updatedConnection.user.nama,
          fotoProfil: updatedConnection.user.profile?.fotoProfil || null
        }
      }
    })
  } catch (error) {
    console.error('Accept connection error:', error)
    res.status(500).json({ error: 'Terjadi kesalahan saat menerima request koneksi' })
  }
}

// Reject connection request
export const rejectConnection = async (req, res) => {
  try {
    const { id } = req.params
    const userId = req.user.userId

    const connection = await prisma.connection.findUnique({
      where: { id }
    })

    if (!connection) {
      return res.status(404).json({ error: 'Request koneksi tidak ditemukan' })
    }

    if (connection.connectedUserId !== userId) {
      return res.status(403).json({ error: 'Anda tidak memiliki akses untuk request ini' })
    }

    if (connection.status !== 'PENDING') {
      return res.status(400).json({ error: 'Request sudah diproses sebelumnya' })
    }

    // Update status ke REJECTED
    await prisma.connection.update({
      where: { id },
      data: { status: 'REJECTED' }
    })

    res.json({
      message: 'Request koneksi ditolak'
    })
  } catch (error) {
    console.error('Reject connection error:', error)
    res.status(500).json({ error: 'Terjadi kesalahan saat menolak request koneksi' })
  }
}

// Get connection status with a specific user
export const getConnectionStatus = async (req, res) => {
  try {
    const { userId: targetUserId } = req.params
    const userId = req.user.userId

    const connection = await prisma.connection.findFirst({
      where: {
        OR: [
          { userId, connectedUserId: targetUserId },
          { userId: targetUserId, connectedUserId: userId }
        ]
      },
      include: {
        user: {
          select: {
            id: true,
            nama: true
          }
        }
      }
    })

    if (!connection) {
      return res.json({
        status: null,
        connection: null
      })
    }

    res.json({
      status: connection.status,
      connection: {
        id: connection.id,
        status: connection.status,
        message: connection.message,
        isRequester: connection.userId === userId,
        createdAt: connection.createdAt
      }
    })
  } catch (error) {
    console.error('Get connection status error:', error)
    res.status(500).json({ error: 'Terjadi kesalahan saat mengambil status koneksi' })
  }
}

// Get all connections (accepted)
export const getConnections = async (req, res) => {
  try {
    const userId = req.user.userId

    const connections = await prisma.connection.findMany({
      where: {
        OR: [
          { userId, status: 'ACCEPTED' },
          { connectedUserId: userId, status: 'ACCEPTED' }
        ]
      },
      include: {
        user: {
          select: {
            id: true,
            nama: true,
            email: true,
            angkatan: true, // angkatan ada di User, bukan Profile
            domisili: true, // domisili ada di User, bukan Profile
            profile: {
              select: {
                fotoProfil: true // hanya fotoProfil yang ada di Profile
              }
            }
          }
        },
        connectedTo: {
          select: {
            id: true,
            nama: true,
            email: true,
            angkatan: true, // angkatan ada di User, bukan Profile
            domisili: true, // domisili ada di User, bukan Profile
            profile: {
              select: {
                fotoProfil: true // hanya fotoProfil yang ada di Profile
              }
            }
          }
        }
      },
      orderBy: {
        updatedAt: 'desc'
      }
    })

    // Format connections untuk return user yang terhubung (bukan requester)
    const formattedConnections = connections
      .filter(conn => {
        // Filter out connections where user or connectedTo is null
        const connectedUser = conn.userId === userId ? conn.connectedTo : conn.user
        return connectedUser !== null
      })
      .map(conn => {
        const connectedUser = conn.userId === userId ? conn.connectedTo : conn.user
        return {
          id: conn.id,
          status: conn.status,
          createdAt: conn.createdAt,
          user: {
            id: connectedUser.id,
            nama: connectedUser.nama,
            email: connectedUser.email,
            fotoProfil: connectedUser.profile?.fotoProfil || null,
            angkatan: connectedUser.angkatan || null, // angkatan ada di User, bukan Profile
            domisili: connectedUser.domisili || null // domisili ada di User, bukan Profile
          }
        }
      })

    res.json({
      connections: formattedConnections
    })
  } catch (error) {
    console.error('Get connections error:', error)
    res.status(500).json({ error: 'Terjadi kesalahan saat mengambil koneksi' })
  }
}

