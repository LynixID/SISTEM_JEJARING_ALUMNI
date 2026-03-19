import { body, param, query } from 'express-validator'

export const createDiscussionValidation = [
  body('title')
    .trim()
    .notEmpty()
    .withMessage('Judul diskusi harus diisi')
    .isLength({ min: 3, max: 150 })
    .withMessage('Judul diskusi harus 3-150 karakter'),
  body('content')
    .trim()
    .notEmpty()
    .withMessage('Konten diskusi harus diisi')
    .isLength({ min: 10, max: 10000 })
    .withMessage('Konten diskusi harus 10-10000 karakter'),
  body('visibility')
    .optional()
    .isIn(['PUBLIC', 'PRIVATE'])
    .withMessage('Visibility tidak valid'),
]

export const updateDiscussionValidation = [
  param('id').notEmpty().withMessage('ID diskusi diperlukan'),
  body('title')
    .optional()
    .trim()
    .isLength({ min: 3, max: 150 })
    .withMessage('Judul diskusi harus 3-150 karakter'),
  body('content')
    .optional()
    .trim()
    .isLength({ min: 10, max: 10000 })
    .withMessage('Konten diskusi harus 10-10000 karakter'),
  body('visibility')
    .optional()
    .isIn(['PUBLIC', 'PRIVATE'])
    .withMessage('Visibility tidak valid'),
  body('removeImage')
    .optional()
    .isIn(['true', 'false'])
    .withMessage('removeImage tidak valid'),
]

export const listDiscussionsValidation = [
  query('page').optional().isInt({ min: 1 }).withMessage('page harus angka >= 1'),
  query('limit').optional().isInt({ min: 1, max: 50 }).withMessage('limit harus 1-50'),
  query('q').optional().isString().isLength({ max: 100 }).withMessage('q maksimal 100 karakter'),
]

export const listMessagesValidation = [
  param('id').notEmpty().withMessage('ID diskusi diperlukan'),
  query('page').optional().isInt({ min: 1 }).withMessage('page harus angka >= 1'),
  query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('limit harus 1-100'),
]

export const sendMessageValidation = [
  param('id').notEmpty().withMessage('ID diskusi diperlukan'),
  body('content')
    .optional({ nullable: true })
    .trim()
    .isLength({ min: 1, max: 5000 })
    .withMessage('Konten pesan maksimal 5000 karakter'),
  body().custom((_, { req }) => {
    const hasText = typeof req.body?.content === 'string' && req.body.content.trim().length > 0
    const hasMedia = !!req.file
    if (!hasText && !hasMedia) {
      throw new Error('Pesan atau media diperlukan')
    }
    return true
  }),
]

export const updateMessageValidation = [
  param('id').notEmpty().withMessage('ID diskusi diperlukan'),
  param('messageId').notEmpty().withMessage('ID pesan diperlukan'),
  body('content')
    .trim()
    .notEmpty()
    .withMessage('Konten pesan harus diisi')
    .isLength({ min: 1, max: 5000 })
    .withMessage('Konten pesan maksimal 5000 karakter'),
]

export const deleteMessageValidation = [
  param('id').notEmpty().withMessage('ID diskusi diperlukan'),
  param('messageId').notEmpty().withMessage('ID pesan diperlukan'),
]

