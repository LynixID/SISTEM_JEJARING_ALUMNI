import { body, query } from 'express-validator'

export const updateProfileValidation = [
  body('profesi')
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage('Profesi maksimal 100 karakter'),
  
  body('perusahaan')
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage('Perusahaan maksimal 100 karakter'),
  
  body('jabatan')
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage('Jabatan maksimal 100 karakter'),
  
  body('skill')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Skill maksimal 500 karakter'),
  
  body('sosialMedia')
    .optional()
    .custom((value) => {
      if (typeof value === 'string') {
        try {
          const parsed = JSON.parse(value)
          if (typeof parsed !== 'object' || Array.isArray(parsed)) {
            throw new Error('sosialMedia harus berupa object')
          }
        } catch (e) {
          throw new Error('Format sosialMedia tidak valid')
        }
      } else if (typeof value !== 'object' || Array.isArray(value)) {
        throw new Error('sosialMedia harus berupa object')
      }
      return true
    }),
  
  body('portfolio')
    .optional()
    .custom((value) => {
      if (typeof value === 'string') {
        try {
          const parsed = JSON.parse(value)
          if (!Array.isArray(parsed)) {
            throw new Error('portfolio harus berupa array')
          }
        } catch (e) {
          throw new Error('Format portfolio tidak valid')
        }
      } else if (!Array.isArray(value)) {
        throw new Error('portfolio harus berupa array')
      }
      return true
    }),
  
  body('experience')
    .optional()
    .custom((value) => {
      if (typeof value === 'string') {
        try {
          const parsed = JSON.parse(value)
          if (!Array.isArray(parsed)) {
            throw new Error('experience harus berupa array')
          }
        } catch (e) {
          throw new Error('Format experience tidak valid')
        }
      } else if (!Array.isArray(value)) {
        throw new Error('experience harus berupa array')
      }
      return true
    }),
  
  body('education')
    .optional()
    .custom((value) => {
      if (typeof value === 'string') {
        try {
          const parsed = JSON.parse(value)
          if (!Array.isArray(parsed)) {
            throw new Error('education harus berupa array')
          }
        } catch (e) {
          throw new Error('Format education tidak valid')
        }
      } else if (!Array.isArray(value)) {
        throw new Error('education harus berupa array')
      }
      return true
    }),
  
  body('certifications')
    .optional()
    .custom((value) => {
      if (typeof value === 'string') {
        try {
          const parsed = JSON.parse(value)
          if (!Array.isArray(parsed)) {
            throw new Error('certifications harus berupa array')
          }
        } catch (e) {
          throw new Error('Format certifications tidak valid')
        }
      } else if (!Array.isArray(value)) {
        throw new Error('certifications harus berupa array')
      }
      return true
    }),
  
  body('languages')
    .optional()
    .custom((value) => {
      if (typeof value === 'string') {
        try {
          const parsed = JSON.parse(value)
          if (!Array.isArray(parsed)) {
            throw new Error('languages harus berupa array')
          }
        } catch (e) {
          throw new Error('Format languages tidak valid')
        }
      } else if (!Array.isArray(value)) {
        throw new Error('languages harus berupa array')
      }
      return true
    })
]

export const updateBasicInfoValidation = [
  body('nama')
    .optional()
    .trim()
    .notEmpty()
    .withMessage('Nama tidak boleh kosong')
    .isLength({ min: 2, max: 100 })
    .withMessage('Nama harus antara 2-100 karakter'),
  
  body('whatsapp')
    .optional()
    .trim()
    .matches(/^[0-9+\-\s()]+$/)
    .withMessage('Format nomor WhatsApp tidak valid')
    .isLength({ max: 20 })
    .withMessage('Nomor WhatsApp maksimal 20 karakter'),
  
  body('domisili')
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage('Domisili maksimal 100 karakter')
]

export const getUsersValidation = [
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Page harus berupa angka positif'),
  
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limit harus antara 1-100'),
  
  query('search')
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage('Search maksimal 100 karakter'),
  
  query('angkatan')
    .optional()
    .isInt({ min: 1990, max: 2100 })
    .withMessage('Angkatan tidak valid'),
  
  query('role')
    .optional()
    .isIn(['ALUMNI', 'PENGURUS', 'all'])
    .withMessage('Role tidak valid')
]

