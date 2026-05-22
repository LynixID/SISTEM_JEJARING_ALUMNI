import prisma from '../../config/database.js'

// Get all display home page items
export const getAllDisplayItems = async (req, res) => {
  try {
    const { kategori, isActive } = req.query

    const where = {}
    if (kategori) where.kategori = kategori
    if (isActive !== undefined) where.isActive = isActive === 'true'

    const items = await prisma.displayHomePage.findMany({
      where,
      orderBy: [
        { kategori: 'asc' },
        { urutan: 'asc' }
      ]
    })

    // Populate data untuk setiap item
    const populatedItems = await Promise.all(items.map(async (item) => {
      let targetData = null

      if (item.kategori === 'ALUMNI' && item.idTarget) {
        // Ambil data user
        targetData = await prisma.user.findUnique({
          where: { id: item.idTarget },
          select: {
            id: true,
            nama: true,
            email: true,
            prodi: true,
            angkatan: true,
            profile: {
              select: {
                fotoProfil: true,
                profesi: true,
                perusahaan: true,
                jabatan: true
              }
            }
          }
        })
      } else if (item.kategori === 'PROGRAM' && item.idTarget) {
        // Cek apakah announcement atau event
        const announcement = await prisma.announcement.findUnique({
          where: { id: item.idTarget },
          select: {
            id: true,
            title: true,
            image: true,
            content: true,
            createdAt: true
          }
        })

        if (announcement) {
          targetData = { ...announcement, type: 'announcement' }
        } else {
          const event = await prisma.event.findUnique({
            where: { id: item.idTarget },
            select: {
              id: true,
              title: true,
              image: true,
          description: true,
              tanggal: true,
              lokasi: true
            }
          })
          if (event) {
            targetData = { ...event, type: 'event' }
          }
        }
      } else if (item.kategori === 'YOUTUBE' && item.value) {
        // Untuk YOUTUBE, value menyimpan URL YouTube
        targetData = { url: item.value }
      }

      return {
        ...item,
        targetData
      }
    }))

    res.json({
      success: true,
      data: populatedItems
    })
  } catch (error) {
    console.error('Error fetching display items:', error)
    res.status(500).json({
      success: false,
      message: 'Gagal mengambil data display home page',
      error: error.message
    })
  }
}

// Get display items by kategori (untuk landing page)
export const getDisplayItemsByKategori = async (req, res) => {
  try {
    const { kategori } = req.params

    const items = await prisma.displayHomePage.findMany({
      where: {
        kategori,
        isActive: true
      },
      orderBy: { urutan: 'asc' }
    })

    // Populate data
    const populatedItems = await Promise.all(items.map(async (item) => {
      let targetData = null

      if (item.kategori === 'ALUMNI' && item.idTarget) {
        targetData = await prisma.user.findUnique({
          where: { id: item.idTarget },
          select: {
            id: true,
            nama: true,
            prodi: true,
            angkatan: true,
            profile: {
              select: {
                fotoProfil: true,
                profesi: true,
                perusahaan: true,
                jabatan: true
              }
            }
          }
        })
      } else if (item.kategori === 'PROGRAM' && item.idTarget) {
        const announcement = await prisma.announcement.findUnique({
          where: { id: item.idTarget },
          select: {
            id: true,
            title: true,
            image: true,
            content: true,
            createdAt: true
          }
        })

        if (announcement) {
          targetData = { ...announcement, type: 'announcement' }
        } else {
          const event = await prisma.event.findUnique({
            where: { id: item.idTarget },
            select: {
              id: true,
              title: true,
              image: true,
              description: true,
              tanggal: true,
              lokasi: true
            }
          })
          if (event) {
            targetData = { ...event, type: 'event' }
          }
        }
      } else if (item.kategori === 'YOUTUBE' && item.value) {
        targetData = { url: item.value }
      }

      return {
        ...item,
        targetData
      }
    }))

    res.json({
      success: true,
      data: populatedItems
    })
  } catch (error) {
    console.error('Error fetching display items by kategori:', error)
    res.status(500).json({
      success: false,
      message: 'Gagal mengambil data',
      error: error.message
    })
  }
}

// Create display item
export const createDisplayItem = async (req, res) => {
  try {
    const { kategori, idTarget, value, urutan, isActive } = req.body

    // Validasi
    if (!kategori) {
      return res.status(400).json({
        success: false,
        message: 'Kategori harus diisi'
      })
    }

    if (kategori === 'EMAIL' && !value) {
      return res.status(400).json({
        success: false,
        message: 'Value harus diisi untuk kategori EMAIL'
      })
    }

    if ((kategori === 'ALUMNI' || kategori === 'PROGRAM') && !idTarget) {
      return res.status(400).json({
        success: false,
        message: 'ID Target harus diisi untuk kategori ALUMNI atau PROGRAM'
      })
    }

    // Cek duplikasi untuk kategori EMAIL (hanya boleh 1 email aktif)
    if (kategori === 'EMAIL' && isActive !== false) {
      await prisma.displayHomePage.updateMany({
        where: { kategori: 'EMAIL' },
        data: { isActive: false }
      })
    }

    const item = await prisma.displayHomePage.create({
      data: {
        kategori,
        idTarget: idTarget || null,
        value: value || null,
        urutan: urutan || 0,
        isActive: isActive !== undefined ? isActive : true
      }
    })

    res.status(201).json({
      success: true,
      message: 'Display item berhasil ditambahkan',
      data: item
    })
  } catch (error) {
    console.error('Error creating display item:', error)
    res.status(500).json({
      success: false,
      message: 'Gagal menambahkan display item',
      error: error.message
    })
  }
}

// Update display item
export const updateDisplayItem = async (req, res) => {
  try {
    const { id } = req.params
    const { kategori, idTarget, value, urutan, isActive } = req.body

    // Cek apakah item exists
    const existingItem = await prisma.displayHomePage.findUnique({
      where: { id }
    })

    if (!existingItem) {
      return res.status(404).json({
        success: false,
        message: 'Display item tidak ditemukan'
      })
    }

    // Jika mengaktifkan email, nonaktifkan email lain
    if (kategori === 'EMAIL' && isActive === true) {
      await prisma.displayHomePage.updateMany({
        where: {
          kategori: 'EMAIL',
          id: { not: id }
        },
        data: { isActive: false }
      })
    }

    const item = await prisma.displayHomePage.update({
      where: { id },
      data: {
        kategori: kategori || existingItem.kategori,
        idTarget: idTarget !== undefined ? idTarget : existingItem.idTarget,
        value: value !== undefined ? value : existingItem.value,
        urutan: urutan !== undefined ? urutan : existingItem.urutan,
        isActive: isActive !== undefined ? isActive : existingItem.isActive
      }
    })

    res.json({
      success: true,
      message: 'Display item berhasil diupdate',
      data: item
    })
  } catch (error) {
    console.error('Error updating display item:', error)
    res.status(500).json({
      success: false,
      message: 'Gagal mengupdate display item',
      error: error.message
    })
  }
}

// Delete display item
export const deleteDisplayItem = async (req, res) => {
  try {
    const { id } = req.params

    await prisma.displayHomePage.delete({
      where: { id }
    })

    res.json({
      success: true,
      message: 'Display item berhasil dihapus'
    })
  } catch (error) {
    console.error('Error deleting display item:', error)
    res.status(500).json({
      success: false,
      message: 'Gagal menghapus display item',
      error: error.message
    })
  }
}

// Reorder display items
export const reorderDisplayItems = async (req, res) => {
  try {
    const { items } = req.body // Array of { id, urutan }

    if (!Array.isArray(items)) {
      return res.status(400).json({
        success: false,
        message: 'Items harus berupa array'
      })
    }

    // Update urutan untuk setiap item
    await Promise.all(
      items.map(item =>
        prisma.displayHomePage.update({
          where: { id: item.id },
          data: { urutan: item.urutan }
        })
      )
    )

    res.json({
      success: true,
      message: 'Urutan berhasil diupdate'
    })
  } catch (error) {
    console.error('Error reordering display items:', error)
    res.status(500).json({
      success: false,
      message: 'Gagal mengupdate urutan',
      error: error.message
    })
  }
}

// Get active email for contact form
export const getActiveEmail = async (req, res) => {
  try {
    const emailItem = await prisma.displayHomePage.findFirst({
      where: {
        kategori: 'EMAIL',
        isActive: true
      }
    })

    res.json({
      success: true,
      data: emailItem ? emailItem.value : null
    })
  } catch (error) {
    console.error('Error fetching active email:', error)
    res.status(500).json({
      success: false,
      message: 'Gagal mengambil email',
      error: error.message
    })
  }
}
