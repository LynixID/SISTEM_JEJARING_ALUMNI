import { body } from 'express-validator'

export const createAnnouncementValidation = [
  body('title')
    .trim()
    .notEmpty()
    .withMessage('Judul harus diisi')
    .isLength({ min: 5, max: 200 })
    .withMessage('Judul harus antara 5-200 karakter'),
  
  body('content')
    .trim()
    .notEmpty()
    .withMessage('Konten harus diisi')
    .isLength({ min: 10 })
    .withMessage('Konten minimal 10 karakter'),
  
  body('category')
    .trim()
    .notEmpty()
    .withMessage('Kategori harus diisi')
    .isIn(['Berita Umum', 'Agenda', 'Program DPW', 'Peluang Kerjasama', 'Event Alumni'])
    .withMessage('Kategori tidak valid'),
  
  body('image')
    .optional()
    .trim()
    .isURL()
    .withMessage('URL gambar tidak valid'),
  
  body('published')
    .optional()
    .isBoolean()
    .withMessage('Published harus boolean')
]

export const updateAnnouncementValidation = [
  body('title')
    .optional()
    .trim()
    .notEmpty()
    .withMessage('Judul tidak boleh kosong')
    .isLength({ min: 5, max: 200 })
    .withMessage('Judul harus antara 5-200 karakter'),
  
  body('content')
    .optional()
    .trim()
    .notEmpty()
    .withMessage('Konten tidak boleh kosong')
    .isLength({ min: 10 })
    .withMessage('Konten minimal 10 karakter'),
  
  body('category')
    .optional()
    .trim()
    .notEmpty()
    .withMessage('Kategori tidak boleh kosong')
    .isIn(['Berita Umum', 'Agenda', 'Program DPW', 'Peluang Kerjasama', 'Event Alumni'])
    .withMessage('Kategori tidak valid'),
  
  body('image')
    .optional()
    .trim()
    .isURL()
    .withMessage('URL gambar tidak valid'),
  
  body('published')
    .optional()
    .isBoolean()
    .withMessage('Published harus boolean')
]

