import { body } from 'express-validator'

export const createPostValidation = [
  body('content')
    .trim()
    .notEmpty()
    .withMessage('Konten harus diisi')
    .isLength({ min: 1, max: 5000 })
    .withMessage('Konten harus antara 1-5000 karakter'),
]

export const updatePostValidation = [
  body('content')
    .optional()
    .trim()
    .notEmpty()
    .withMessage('Konten tidak boleh kosong')
    .isLength({ min: 1, max: 5000 })
    .withMessage('Konten harus antara 1-5000 karakter'),
]


