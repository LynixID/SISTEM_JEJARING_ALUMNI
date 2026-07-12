  import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

/**
 * GET /api/tour/status?keys=dashboard,berita,chat
 * Returns completion status for one or more tourKeys for the authenticated user.
 */
export const getTourStatus = async (req, res) => {
  try {
    const userId = req.user.userId
    const keysParam = req.query.keys || ''

    if (!keysParam) {
      return res.status(400).json({ error: 'Query param "keys" wajib diisi' })
    }

    const tourKeys = keysParam
      .split(',')
      .map((k) => k.trim())
      .filter(Boolean)

    if (tourKeys.length === 0) {
      return res.status(400).json({ error: 'Tidak ada tourKey yang valid' })
    }

    // Ambil semua record yang match sekaligus (satu query)
    const records = await prisma.userTourStatus.findMany({
      where: {
        userId,
        tourKey: { in: tourKeys },
      },
      select: { tourKey: true },
    })

    const completedSet = new Set(records.map((r) => r.tourKey))

    // Buat response object: { dashboard: true, berita: false, ... }
    const completed = {}
    for (const key of tourKeys) {
      completed[key] = completedSet.has(key)
    }

    return res.json({ completed })
  } catch (error) {
    console.error('[getTourStatus] Error:', error)
    return res.status(500).json({ error: 'Internal server error' })
  }
}

/**
 * POST /api/tour/complete
 * Body: { tourKey: "dashboard" }
 * Marks the given tourKey as completed for the authenticated user.
 * Idempotent — safe to call multiple times.
 */
export const completeTour = async (req, res) => {
  try {
    const userId = req.user.userId
    const { tourKey } = req.body

    if (!tourKey || typeof tourKey !== 'string') {
      return res.status(400).json({ error: 'tourKey wajib diisi dan harus berupa string' })
    }

    const trimmedKey = tourKey.trim()
    if (!trimmedKey) {
      return res.status(400).json({ error: 'tourKey tidak boleh kosong' })
    }

    // Upsert — jika sudah ada, update completedAt; jika belum, buat baru
    const record = await prisma.userTourStatus.upsert({
      where: {
        userId_tourKey: { userId, tourKey: trimmedKey },
      },
      update: {
        completedAt: new Date(),
      },
      create: {
        userId,
        tourKey: trimmedKey,
      },
    })

    return res.json({ success: true, record })
  } catch (error) {
    console.error('[completeTour] Error:', error)
    return res.status(500).json({ error: 'Internal server error' })
  }
}
