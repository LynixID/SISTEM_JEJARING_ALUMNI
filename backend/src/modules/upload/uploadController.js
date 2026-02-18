import multer from 'multer'
import path from 'path'
import { fileURLToPath } from 'url'
import fs from 'fs'
import { randomUUID } from 'crypto'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// Pastikan direktori uploads sudah ada
const uploadsDir = path.join(__dirname, '../../../uploads/images')
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true })
}

// Konfigurasi penyimpanan Multer
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const category = req.body.category || 'general'
    const categoryDir = path.join(uploadsDir, category)
    
    // Buat folder kategori jika belum ada
    if (!fs.existsSync(categoryDir)) {
      fs.mkdirSync(categoryDir, { recursive: true })
    }
    
    cb(null, categoryDir)
  },
  filename: (req, file, cb) => {
    // Buat nama file unik: uuid + ekstensi asli
    const ext = path.extname(file.originalname)
    const filename = `${randomUUID()}${ext}`
    cb(null, filename)
  }
})

// Filter file - hanya izinkan gambar
const fileFilter = (req, file, cb) => {
  const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif']
  
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true)
  } else {
    cb(new Error('File type tidak didukung. Hanya file gambar (JPG, PNG, WebP, GIF) yang diperbolehkan.'), false)
  }
}

// Konfigurasi Multer
export const upload = multer({
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024 // batas 5MB
  },
  fileFilter: fileFilter
})

// Controller upload gambar
export const uploadImage = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'Tidak ada file yang diupload' })
    }

    const category = req.body.category || 'general'
    // Return full URL untuk preview, tapi juga return filename untuk disimpan di database
    const fileUrl = `/uploads/images/${category}/${req.file.filename}`

    res.status(200).json({
      message: 'File berhasil diupload',
      url: fileUrl, // Full URL untuk preview
      filename: req.file.filename, // Filename saja untuk disimpan di database
      originalName: req.file.originalname,
      size: req.file.size,
      mimetype: req.file.mimetype
    })
  } catch (error) {
    console.error('Upload error:', error)
    res.status(500).json({ error: error.message || 'Gagal mengupload file' })
  }
}

// Controller hapus gambar
export const deleteImage = async (req, res) => {
  try {
    const { filename, category } = req.body
    
    if (!filename || !category) {
      return res.status(400).json({ error: 'Filename dan category diperlukan' })
    }

    const filePath = path.join(uploadsDir, category, filename)
    
    // Cek apakah file ada
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ error: 'File tidak ditemukan' })
    }

    // Hapus file
    fs.unlinkSync(filePath)
    
    res.status(200).json({ message: 'File berhasil dihapus' })
  } catch (error) {
    console.error('Delete image error:', error)
    res.status(500).json({ error: error.message || 'Gagal menghapus file' })
  }
}

