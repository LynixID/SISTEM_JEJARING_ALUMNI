import { body, param, query } from 'express-validator'

export const listJobsValidation = [
  query('page').optional().isInt({ min: 1 }).withMessage('page harus angka >= 1'),
  query('limit').optional().isInt({ min: 1, max: 50 }).withMessage('limit harus 1-50'),
  query('q').optional().isString().isLength({ max: 100 }).withMessage('q maksimal 100 karakter'),
]

export const createJobValidation = [
  body('title')
    .trim()
    .notEmpty()
    .withMessage('Judul lowongan harus diisi')
    .isLength({ min: 3, max: 150 })
    .withMessage('Judul lowongan harus 3-150 karakter'),
  body('company')
    .trim()
    .notEmpty()
    .withMessage('Nama perusahaan harus diisi')
    .isLength({ min: 2, max: 120 })
    .withMessage('Nama perusahaan harus 2-120 karakter'),
  body('description')
    .trim()
    .notEmpty()
    .withMessage('Deskripsi lowongan harus diisi')
    .isLength({ min: 20, max: 20000 })
    .withMessage('Deskripsi lowongan harus 20-20000 karakter'),
  body('location')
    .optional({ nullable: true })
    .trim()
    .isLength({ max: 120 })
    .withMessage('Lokasi maksimal 120 karakter'),
  body('employmentType')
    .optional({ nullable: true })
    .trim()
    .isLength({ max: 80 })
    .withMessage('Employment type maksimal 80 karakter'),
  body('salaryRange')
    .optional({ nullable: true })
    .trim()
    .isLength({ max: 80 })
    .withMessage('Salary range maksimal 80 karakter'),
  body('contact')
    .optional({ nullable: true })
    .trim()
    .isLength({ max: 120 })
    .withMessage('Contact maksimal 120 karakter'),
  body('applyLink')
    .optional({ nullable: true })
    .trim()
    .isLength({ max: 255 })
    .withMessage('Apply link maksimal 255 karakter'),
]

export const approveRejectValidation = [
  param('id').notEmpty().withMessage('ID lowongan diperlukan'),
]

