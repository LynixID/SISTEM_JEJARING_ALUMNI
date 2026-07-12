import jwt from 'jsonwebtoken'
import prisma from '../config/database.js'

// Middleware: verifikasi JWT token dari header Authorization
export const verifyToken = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'No token provided' })
    }

    const token = authHeader.split(' ')[1]
    
    // Verifikasi token dan decode payload (userId, email, role)
    const decoded = jwt.verify(token, process.env.JWT_SECRET)
    
    // Cek apakah user sedang ditangguhkan (suspended)
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: { isSuspended: true }
    })

    if (user && user.isSuspended) {
      return res.status(403).json({ 
        error: 'Akun Anda ditangguhkan (Suspended). Harap hubungi admin untuk informasi lebih lanjut.',
        isSuspended: true 
      })
    }

    // Simpan user info ke req.user untuk digunakan di controller
    req.user = decoded
    next()
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ error: 'Token expired' })
    }
    return res.status(401).json({ error: 'Invalid token' })
  }
}

// Optional auth: set req.user if token exists, but don't error if not
export const optionalAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization
    
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.split(' ')[1]
      const decoded = jwt.verify(token, process.env.JWT_SECRET)
      
      const user = await prisma.user.findUnique({
        where: { id: decoded.userId },
        select: { isSuspended: true }
      })

      if (user && !user.isSuspended) {
        req.user = decoded
      } else {
        req.user = undefined
      }
    }
  } catch (error) {
    // Ignore errors - user is just not authenticated
    req.user = undefined
  }
  
  next()
}

export const requireRole = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Unauthorized' })
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ error: 'Forbidden: Insufficient permissions' })
    }

    next()
  }
}


