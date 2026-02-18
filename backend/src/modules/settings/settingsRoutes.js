import express from 'express'
import { body } from 'express-validator'
import { getSettings, getSetting, updateSetting, createSetting } from './settingsController.js'
import { verifyToken, requireRole } from '../../middleware/auth.js'

const router = express.Router()

// All routes require admin authentication
router.use(verifyToken)
router.use(requireRole('ADMIN'))

// Validation for update
const updateSettingValidation = [
  body('value').notEmpty().withMessage('Nilai tidak boleh kosong')
]

// Validation for create
const createSettingValidation = [
  body('key').notEmpty().withMessage('Key tidak boleh kosong'),
  body('category').notEmpty().withMessage('Kategori tidak boleh kosong'),
  body('value').notEmpty().withMessage('Nilai tidak boleh kosong'),
  body('type').isIn(['STRING', 'JSON', 'NUMBER', 'BOOLEAN']).withMessage('Tipe tidak valid'),
  body('label').notEmpty().withMessage('Label tidak boleh kosong')
]

router.get('/', getSettings)
router.get('/:key', getSetting)
router.put('/:key', updateSettingValidation, updateSetting)
router.post('/', createSettingValidation, createSetting)

export default router

