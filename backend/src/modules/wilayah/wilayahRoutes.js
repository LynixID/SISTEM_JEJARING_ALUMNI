import express from 'express'

const router = express.Router()

const WILAYAH_BASE_URL = 'https://wilayah.id/api'

router.get('/provinces', async (req, res) => {
  try {
    const upstream = await fetch(`${WILAYAH_BASE_URL}/provinces.json`)
    if (!upstream.ok) {
      return res.status(502).json({ error: 'Gagal mengambil data provinsi' })
    }
    const json = await upstream.json()
    res.json({ data: json?.data || [] })
  } catch (e) {
    console.error('Wilayah provinces proxy error:', e)
    res.status(500).json({ error: 'Terjadi kesalahan saat mengambil data provinsi' })
  }
})

router.get('/regencies/:provinceCode', async (req, res) => {
  try {
    const { provinceCode } = req.params
    if (!provinceCode) return res.status(400).json({ error: 'provinceCode wajib' })

    const upstream = await fetch(`${WILAYAH_BASE_URL}/regencies/${provinceCode}.json`)
    if (!upstream.ok) {
      return res.status(502).json({ error: 'Gagal mengambil data kabupaten/kota' })
    }
    const json = await upstream.json()
    res.json({ data: json?.data || [] })
  } catch (e) {
    console.error('Wilayah regencies proxy error:', e)
    res.status(500).json({ error: 'Terjadi kesalahan saat mengambil data kabupaten/kota' })
  }
})

export default router

