import sharp from 'sharp'
import fs from 'fs'
import path from 'path'

// Helper function untuk compress single file
const compressSingleFile = async (file) => {
  if (!file) return

  try {
    const filePath = file.path
    const ext = path.extname(file.filename).toLowerCase()
    const filenameWithoutExt = path.basename(file.filename, ext)
    
    // Convert ke WebP untuk better compression
    const outputPath = path.join(path.dirname(filePath), `${filenameWithoutExt}.webp`)
    
    // Compress dan convert ke WebP
    await sharp(filePath)
      .resize(1920, 1920, {
        fit: 'inside',
        withoutEnlargement: true
      })
      .webp({ quality: 85 })
      .toFile(outputPath)

    // Hapus file original
    fs.unlinkSync(filePath)

    // Update file dengan info file baru
    file.filename = `${filenameWithoutExt}.webp`
    file.path = outputPath
    file.mimetype = 'image/webp'
    file.size = fs.statSync(outputPath).size
  } catch (error) {
    console.error('Image compression error:', error)
    // Jika compress gagal, file tetap original
  }
}

// Middleware untuk compress dan optimize image
export const compressImage = async (req, res, next) => {
  try {
    // Handle single file (req.file)
    if (req.file) {
      await compressSingleFile(req.file)
    }

    // Handle multiple files (req.files)
    if (req.files) {
      // Handle array of files (e.g., req.files.images)
      for (const key in req.files) {
        const files = req.files[key]
        if (Array.isArray(files)) {
          for (const file of files) {
            await compressSingleFile(file)
          }
        } else {
          await compressSingleFile(files)
        }
      }
    }

    next()
  } catch (error) {
    console.error('Image compression error:', error)
    // Jika compress gagal, lanjutkan dengan file original
    next()
  }
}


