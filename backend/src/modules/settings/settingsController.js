import prisma from '../../config/database.js'
import { validationResult, body } from 'express-validator'

// Get all settings grouped by category
export const getSettings = async (req, res) => {
  try {
    const settings = await prisma.setting.findMany({
      orderBy: [{ category: 'asc' }, { order: 'asc' }]
    })

    // Group by category and parse JSON values
    const grouped = settings.reduce((acc, setting) => {
      if (!acc[setting.category]) {
        acc[setting.category] = []
      }

      let parsedValue = setting.value
      if (setting.type === 'JSON') {
        try {
          parsedValue = JSON.parse(setting.value)
        } catch (e) {
          parsedValue = []
        }
      } else if (setting.type === 'NUMBER') {
        parsedValue = Number(setting.value)
      } else if (setting.type === 'BOOLEAN') {
        parsedValue = setting.value === 'true'
      }

      acc[setting.category].push({
        id: setting.id,
        key: setting.key,
        value: parsedValue,
        type: setting.type,
        label: setting.label,
        description: setting.description,
        order: setting.order,
        updatedAt: setting.updatedAt
      })

      return acc
    }, {})

    res.json({ settings: grouped })
  } catch (error) {
    console.error('Error fetching settings:', error)
    res.status(500).json({ error: 'Gagal mengambil pengaturan' })
  }
}

// Get single setting by key
export const getSetting = async (req, res) => {
  try {
    const { key } = req.params
    const setting = await prisma.setting.findUnique({
      where: { key }
    })

    if (!setting) {
      return res.status(404).json({ error: 'Pengaturan tidak ditemukan' })
    }

    let parsedValue = setting.value
    if (setting.type === 'JSON') {
      try {
        parsedValue = JSON.parse(setting.value)
      } catch (e) {
        parsedValue = []
      }
    } else if (setting.type === 'NUMBER') {
      parsedValue = Number(setting.value)
    } else if (setting.type === 'BOOLEAN') {
      parsedValue = setting.value === 'true'
    }

    res.json({
      ...setting,
      value: parsedValue
    })
  } catch (error) {
    console.error('Error fetching setting:', error)
    res.status(500).json({ error: 'Gagal mengambil pengaturan' })
  }
}

// Update setting by key
export const updateSetting = async (req, res) => {
  try {
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() })
    }

    const { key } = req.params
    const { value } = req.body

    const setting = await prisma.setting.findUnique({
      where: { key }
    })

    if (!setting) {
      return res.status(404).json({ error: 'Pengaturan tidak ditemukan' })
    }

    // Validate and format value based on type
    let validatedValue = value
    if (setting.type === 'JSON') {
      // Ensure it's a valid JSON string
      if (Array.isArray(value)) {
        validatedValue = JSON.stringify(value)
      } else if (typeof value === 'string') {
        try {
          JSON.parse(value) // Validate it's valid JSON
          validatedValue = value
        } catch (e) {
          return res.status(400).json({ error: 'Nilai JSON tidak valid' })
        }
      } else {
        validatedValue = JSON.stringify(value)
      }
    } else if (setting.type === 'NUMBER') {
      const num = Number(value)
      if (isNaN(num)) {
        return res.status(400).json({ error: 'Nilai harus berupa angka' })
      }
      validatedValue = String(num)
    } else if (setting.type === 'BOOLEAN') {
      validatedValue = String(Boolean(value))
    } else {
      // STRING type
      validatedValue = String(value)
    }

    const updated = await prisma.setting.update({
      where: { key },
      data: { value: validatedValue }
    })

    // Parse value for response
    let parsedValue = updated.value
    if (updated.type === 'JSON') {
      try {
        parsedValue = JSON.parse(updated.value)
      } catch (e) {
        parsedValue = []
      }
    } else if (updated.type === 'NUMBER') {
      parsedValue = Number(updated.value)
    } else if (updated.type === 'BOOLEAN') {
      parsedValue = updated.value === 'true'
    }

    res.json({
      ...updated,
      value: parsedValue
    })
  } catch (error) {
    console.error('Error updating setting:', error)
    res.status(500).json({ error: 'Gagal memperbarui pengaturan' })
  }
}

// Create new setting (admin only)
export const createSetting = async (req, res) => {
  try {
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() })
    }

    const { key, category, value, type, label, description, order } = req.body

    // Validate value based on type
    let validatedValue = value
    if (type === 'JSON') {
      validatedValue = JSON.stringify(value)
    } else if (type === 'NUMBER') {
      const num = Number(value)
      if (isNaN(num)) {
        return res.status(400).json({ error: 'Nilai harus berupa angka' })
      }
      validatedValue = String(num)
    } else if (type === 'BOOLEAN') {
      validatedValue = String(Boolean(value))
    } else {
      validatedValue = String(value)
    }

    const setting = await prisma.setting.create({
      data: {
        key,
        category,
        value: validatedValue,
        type: type || 'STRING',
        label,
        description: description || null,
        order: order || 0
      }
    })

    res.status(201).json(setting)
  } catch (error) {
    console.error('Error creating setting:', error)
    if (error.code === 'P2002') {
      return res.status(400).json({ error: 'Key pengaturan sudah ada' })
    }
    res.status(500).json({ error: 'Gagal membuat pengaturan' })
  }
}

