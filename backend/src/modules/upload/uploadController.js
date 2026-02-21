import multer from 'multer'
import path from 'path'
import { fileURLToPath } from 'url'
import fs from 'fs'
import { randomUUID } from 'crypto'
import sharp from 'sharp'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// Pastikan direktori uploads sudah ada
const uploadsDir = path.join(__dirname, '../../../uploads/images')
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true })
}

// Konfigurasi penyimpanan Multer menggunakan memory storage
// Karena req.body.category belum tersedia saat destination callback dipanggil
const storage = multer.memoryStorage()

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
    const categoryDir = path.join(uploadsDir, category)
    
    // Buat folder kategori jika belum ada
    if (!fs.existsSync(categoryDir)) {
      fs.mkdirSync(categoryDir, { recursive: true })
    }

    // Generate filename dengan UUID
    const uuid = randomUUID()
    const originalExt = path.extname(req.file.originalname)
    const tempFilename = `${uuid}${originalExt}`
    const tempFilePath = path.join(categoryDir, tempFilename)

    // Simpan file sementara dari buffer ke disk
    fs.writeFileSync(tempFilePath, req.file.buffer)

    // Compress dan convert ke WebP
    const finalFilename = `${uuid}.webp`
    const finalFilePath = path.join(categoryDir, finalFilename)
    let finalMimetype = 'image/webp'
    let compressionSuccess = false

    try {
      await sharp(tempFilePath)
        .resize(1920, 1920, {
          fit: 'inside',
          withoutEnlargement: true
        })
        .webp({ quality: 85 })
        .toFile(finalFilePath)

      // Hapus file temporary
      fs.unlinkSync(tempFilePath)
      compressionSuccess = true
    } catch (error) {
      console.error('Image compression error:', error)
      // Jika compress gagal, gunakan file original
      // Hapus file webp yang gagal dibuat (jika ada)
      if (fs.existsSync(finalFilePath)) {
        fs.unlinkSync(finalFilePath)
      }
      // Rename file temporary menjadi final filename dengan ekstensi asli
      const fallbackFilename = tempFilename
      const fallbackFilePath = path.join(categoryDir, fallbackFilename)
      if (fs.existsSync(tempFilePath)) {
        // File sudah ada di tempFilePath, jadi tidak perlu rename
        finalMimetype = req.file.mimetype
      }
    }

    // Tentukan filename dan path final
    const actualFinalFilename = compressionSuccess ? finalFilename : tempFilename
    const actualFinalFilePath = compressionSuccess ? finalFilePath : tempFilePath

    // Get final file size
    const finalFileSize = fs.statSync(actualFinalFilePath).size

    // Return full URL untuk preview, tapi juga return filename untuk disimpan di database
    const fileUrl = `/uploads/images/${category}/${actualFinalFilename}`

    res.status(200).json({
      message: 'File berhasil diupload',
      url: fileUrl, // Full URL untuk preview
      filename: actualFinalFilename, // Filename untuk disimpan di database (.webp jika kompresi berhasil, ekstensi asli jika gagal)
      originalName: req.file.originalname,
      size: finalFileSize,
      mimetype: finalMimetype
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

