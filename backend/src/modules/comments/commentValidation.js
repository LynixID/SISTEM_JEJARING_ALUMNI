import { body } from 'express-validator'

export const createCommentValidation = [
  body('content')
    .trim()
    .notEmpty()
    .withMessage('Konten komentar harus diisi')
    .isLength({ min: 1, max: 1000 })
    .withMessage('Konten komentar harus antara 1-1000 karakter'),
  body('parentId')
    .optional({ nullable: true, checkFalsy: true })
    .custom((value) => {
      // Jika parentId ada, harus valid UUID
      if (value !== null && value !== undefined && value !== '') {
        const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
        if (!uuidRegex.test(value)) {
          throw new Error('Parent ID harus valid UUID')
        }
      }
      return true
    }),
]

export const updateCommentValidation = [
  body('content')
    .optional()
    .trim()
    .notEmpty()
    .withMessage('Konten komentar tidak boleh kosong')
    .isLength({ min: 1, max: 1000 })
    .withMessage('Konten komentar harus antara 1-1000 karakter'),
]

