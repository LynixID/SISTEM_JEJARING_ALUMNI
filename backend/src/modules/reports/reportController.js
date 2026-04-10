import prisma from '../../config/database.js'

// ─── USER: Buat laporan konten ─────────────────────────────────────────────
export const createReport = async (req, res) => {
  try {
    const reporterId = req.user.userId
    const { targetType, targetId, reason, description } = req.body

    // Validasi targetType
    const validTargetTypes = ['POST', 'COMMENT', 'USER']
    if (!validTargetTypes.includes(targetType)) {
      return res.status(400).json({ error: 'targetType tidak valid' })
    }

    // Validasi reason
    const validReasons = ['SPAM', 'HARASSMENT', 'HATE_SPEECH', 'INAPPROPRIATE_CONTENT', 'FALSE_INFORMATION', 'OTHER']
    if (!validReasons.includes(reason)) {
      return res.status(400).json({ error: 'reason tidak valid' })
    }

    // Cek konten yang dilaporkan benar-benar ada
    let targetExists = false
    if (targetType === 'POST') {
      const post = await prisma.post.findUnique({ where: { id: targetId } })
      targetExists = !!post
    } else if (targetType === 'COMMENT') {
      const comment = await prisma.comment.findUnique({ where: { id: targetId } })
      targetExists = !!comment
    } else if (targetType === 'USER') {
      const user = await prisma.user.findUnique({ where: { id: targetId } })
      targetExists = !!user
    }

    if (!targetExists) {
      return res.status(404).json({ error: 'Konten yang dilaporkan tidak ditemukan' })
    }

    // Cegah user melaporkan kontennya sendiri
    if (targetType === 'USER' && targetId === reporterId) {
      return res.status(400).json({ error: 'Tidak dapat melaporkan akun sendiri' })
    }

    // Cek apakah sudah pernah melaporkan konten yang sama
    const existingReport = await prisma.report.findFirst({
      where: { reporterId, targetType, targetId }
    })
    if (existingReport) {
      return res.status(409).json({ error: 'Anda sudah pernah melaporkan konten ini' })
    }

    const report = await prisma.report.create({
      data: { reporterId, targetType, targetId, reason, description }
    })

    // Kirim AdminNotification
    await prisma.adminNotification.create({
      data: {
        type: 'NEW_REPORT',
        message: `Laporan baru: ${targetType} dilaporkan karena ${reason}`,
        userId: reporterId
      }
    })

    res.status(201).json({
      message: 'Laporan berhasil dikirim. Tim kami akan segera meninjau.',
      reportId: report.id
    })
  } catch (error) {
    console.error('Create report error:', error)
    res.status(500).json({ error: 'Terjadi kesalahan saat mengirim laporan' })
  }
}

// ─── ADMIN: Daftar semua laporan ───────────────────────────────────────────
export const getAllReports = async (req, res) => {
  try {
    const { page = 1, limit = 15, status, targetType } = req.query
    const skip = (parseInt(page) - 1) * parseInt(limit)
    const take = parseInt(limit)

    const where = {}
    if (status) where.status = status
    if (targetType) where.targetType = targetType

    const [reports, total] = await Promise.all([
      prisma.report.findMany({
        where,
        skip,
        take,
        orderBy: { createdAt: 'desc' },
        include: {
          reporter: {
            select: { id: true, nama: true, email: true, profile: { select: { fotoProfil: true } } }
          }
        }
      }),
      prisma.report.count({ where })
    ])

    // Enrichment: ambil snapshot konten yang dilaporkan
    const enriched = await Promise.all(
      reports.map(async (r) => {
        let targetSnapshot = null
        try {
          if (r.targetType === 'POST') {
            const post = await prisma.post.findUnique({
              where: { id: r.targetId },
              select: { id: true, content: true, media: true, author: { select: { id: true, nama: true } } }
            })
            targetSnapshot = post
          } else if (r.targetType === 'COMMENT') {
            const comment = await prisma.comment.findUnique({
              where: { id: r.targetId },
              select: { id: true, content: true, postId: true, author: { select: { id: true, nama: true } } }
            })
            targetSnapshot = comment
          } else if (r.targetType === 'USER') {
            const user = await prisma.user.findUnique({
              where: { id: r.targetId },
              select: { id: true, nama: true, email: true, profile: { select: { fotoProfil: true, profesi: true } } }
            })
            targetSnapshot = user
          }
        } catch (_) {
          targetSnapshot = null // konten sudah dihapus
        }
        return { ...r, targetSnapshot }
      })
    )

    res.json({
      reports: enriched,
      pagination: {
        page: parseInt(page),
        limit: take,
        total,
        totalPages: Math.ceil(total / take)
      }
    })
  } catch (error) {
    console.error('Get all reports error:', error)
    res.status(500).json({ error: 'Terjadi kesalahan' })
  }
}

// ─── ADMIN: Detail laporan ─────────────────────────────────────────────────
export const getReportById = async (req, res) => {
  try {
    const { id } = req.params

    const report = await prisma.report.findUnique({
      where: { id },
      include: {
        reporter: {
          select: { id: true, nama: true, email: true, profile: { select: { fotoProfil: true } } }
        }
      }
    })

    if (!report) {
      return res.status(404).json({ error: 'Laporan tidak ditemukan' })
    }

    // Ambil konten yang dilaporkan
    let targetSnapshot = null
    if (report.targetType === 'POST') {
      targetSnapshot = await prisma.post.findUnique({
        where: { id: report.targetId },
        include: { author: { select: { id: true, nama: true, email: true } } }
      })
    } else if (report.targetType === 'COMMENT') {
      targetSnapshot = await prisma.comment.findUnique({
        where: { id: report.targetId },
        include: {
          author: { select: { id: true, nama: true, email: true } },
          post: { select: { id: true, content: true } }
        }
      })
    } else if (report.targetType === 'USER') {
      targetSnapshot = await prisma.user.findUnique({
        where: { id: report.targetId },
        select: { id: true, nama: true, email: true, nim: true, prodi: true, angkatan: true, isSuspended: true, profile: true }
      })
    }

    res.json({ report: { ...report, targetSnapshot } })
  } catch (error) {
    console.error('Get report by ID error:', error)
    res.status(500).json({ error: 'Terjadi kesalahan' })
  }
}

// ─── ADMIN: Update status laporan ─────────────────────────────────────────
export const updateReportStatus = async (req, res) => {
  try {
    const { id } = req.params
    const { status, adminNote } = req.body

    const validStatuses = ['REVIEWED', 'RESOLVED', 'DISMISSED']
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ error: 'Status tidak valid' })
    }

    const report = await prisma.report.findUnique({ where: { id } })
    if (!report) {
      return res.status(404).json({ error: 'Laporan tidak ditemukan' })
    }

    const updated = await prisma.report.update({
      where: { id },
      data: {
        status,
        adminNote: adminNote || null,
        resolvedAt: ['RESOLVED', 'DISMISSED'].includes(status) ? new Date() : null
      }
    })

    res.json({ message: 'Status laporan berhasil diupdate', report: updated })
  } catch (error) {
    console.error('Update report status error:', error)
    res.status(500).json({ error: 'Terjadi kesalahan' })
  }
}

// ─── ADMIN: Hapus konten yang dilaporkan ──────────────────────────────────
export const deleteReportedContent = async (req, res) => {
  try {
    const { id } = req.params

    const report = await prisma.report.findUnique({ where: { id } })
    if (!report) {
      return res.status(404).json({ error: 'Laporan tidak ditemukan' })
    }

    // Hapus konten sesuai tipe
    if (report.targetType === 'POST') {
      await prisma.post.delete({ where: { id: report.targetId } }).catch(() => {})
    } else if (report.targetType === 'COMMENT') {
      await prisma.comment.delete({ where: { id: report.targetId } }).catch(() => {})
    }
    // Untuk USER: admin sebaiknya suspend, bukan delete — tidak dihandle di sini

    // Resolve semua laporan untuk konten yang sama
    await prisma.report.updateMany({
      where: { targetType: report.targetType, targetId: report.targetId },
      data: { status: 'RESOLVED', resolvedAt: new Date(), adminNote: 'Konten dihapus oleh admin' }
    })

    res.json({ message: 'Konten berhasil dihapus dan semua laporan terkait diselesaikan' })
  } catch (error) {
    console.error('Delete reported content error:', error)
    res.status(500).json({ error: 'Terjadi kesalahan' })
  }
}

// ─── ADMIN: Statistik laporan ──────────────────────────────────────────────
export const getReportStatistics = async (req, res) => {
  try {
    const [totalPending, totalReviewed, totalResolved, totalDismissed, byType] = await Promise.all([
      prisma.report.count({ where: { status: 'PENDING' } }),
      prisma.report.count({ where: { status: 'REVIEWED' } }),
      prisma.report.count({ where: { status: 'RESOLVED' } }),
      prisma.report.count({ where: { status: 'DISMISSED' } }),
      // Breakdown per targetType
      Promise.all([
        prisma.report.count({ where: { targetType: 'POST' } }),
        prisma.report.count({ where: { targetType: 'COMMENT' } }),
        prisma.report.count({ where: { targetType: 'USER' } })
      ])
    ])

    res.json({
      statistics: {
        byStatus: { pending: totalPending, reviewed: totalReviewed, resolved: totalResolved, dismissed: totalDismissed },
        byTargetType: { post: byType[0], comment: byType[1], user: byType[2] },
        totalActive: totalPending + totalReviewed
      }
    })
  } catch (error) {
    console.error('Get report statistics error:', error)
    res.status(500).json({ error: 'Terjadi kesalahan' })
  }
}
