import { body } from 'express-validator'

export const createEventValidation = [
  body('title')
    .trim()
    .notEmpty()
    .withMessage('Judul harus diisi')
    .isLength({ min: 5, max: 200 })
    .withMessage('Judul harus antara 5-200 karakter'),
  
  body('description')
    .trim()
    .notEmpty()
    .withMessage('Deskripsi harus diisi')
    .isLength({ min: 10 })
    .withMessage('Deskripsi minimal 10 karakter'),
  
  body('tanggal')
    .notEmpty()
    .withMessage('Tanggal event harus diisi')
    .isISO8601()
    .withMessage('Format tanggal tidak valid')
    .custom((value) => {
      const eventDate = new Date(value)
      const now = new Date()
      // Izinkan tanggal lampau untuk fleksibilitas (mis. memperbarui event lama)
      return true
    }),
  
  body('lokasi')
    .optional({ nullable: true, checkFalsy: true })
    .trim()
    .isLength({ min: 3, max: 200 })
    .withMessage('Lokasi harus antara 3-200 karakter'),
  
  body('image')
    .optional({ nullable: true, checkFalsy: true })
    .custom((value) => {
      // Jika value kosong/null/undefined, skip validasi
      if (!value || (typeof value === 'string' && value.trim() === '')) {
        return true
      }
      // Jika ada value, validasi panjangnya
      const trimmed = String(value).trim()
      if (trimmed.length < 1 || trimmed.length > 255) {
        throw new Error('Image filename harus antara 1-255 karakter')
      }
      return true
    }),
  
  body('linkDaftar')
    .optional({ nullable: true, checkFalsy: true })
    .trim()
    .isURL()
    .withMessage('URL pendaftaran tidak valid'),
  
  body('published')
    .optional()
    .isBoolean()
    .withMessage('Published harus boolean')
]

export const updateEventValidation = [
  body('title')
    .optional()
    .trim()
    .notEmpty()
    .withMessage('Judul tidak boleh kosong')
    .isLength({ min: 5, max: 200 })
    .withMessage('Judul harus antara 5-200 karakter'),
  
  body('description')
    .optional()
    .trim()
    .notEmpty()
    .withMessage('Deskripsi tidak boleh kosong')
    .isLength({ min: 10 })
    .withMessage('Deskripsi minimal 10 karakter'),
  
  body('tanggal')
    .optional()
    .isISO8601()
    .withMessage('Format tanggal tidak valid'),
  
  body('lokasi')
    .optional({ nullable: true, checkFalsy: true })
    .trim()
    .isLength({ min: 3, max: 200 })
    .withMessage('Lokasi harus antara 3-200 karakter'),
  
  body('image')
    .optional({ nullable: true, checkFalsy: true })
    .custom((value) => {
      // Jika value kosong/null/undefined, skip validasi
      if (!value || (typeof value === 'string' && value.trim() === '')) {
        return true
      }
      // Jika ada value, validasi panjangnya
      const trimmed = String(value).trim()
      if (trimmed.length < 1 || trimmed.length > 255) {
        throw new Error('Image filename harus antara 1-255 karakter')
      }
      return true
    }),
  
  body('linkDaftar')
    .optional({ nullable: true, checkFalsy: true })
    .trim()
    .isURL()
    .withMessage('URL pendaftaran tidak valid'),
  
  body('published')
    .optional()
    .isBoolean()
    .withMessage('Published harus boolean')
]

