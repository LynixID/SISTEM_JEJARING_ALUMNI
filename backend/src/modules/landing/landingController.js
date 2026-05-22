import prisma from '../../config/database.js'
import { getImagePath } from '../../utils/fileUtils.js'

// Helper function to populate display home page items
const populateDisplayItems = async (items) => {
  return Promise.all(items.map(async (item) => {
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
}

// Ambil semua data untuk landing page dari display_home_pages
export const getLandingData = async (req, res) => {
  try {
    // Ambil alumni dari display_home_pages
    const alumniItems = await prisma.displayHomePage.findMany({
      where: { kategori: 'ALUMNI', isActive: true },
      orderBy: { urutan: 'asc' }
    })
    const populatedAlumni = await populateDisplayItems(alumniItems)

    // Format alumni data
    const alumni = populatedAlumni.map(item => {
      const user = item.targetData
      return {
        id: item.id,
        nama: user?.nama || 'Nama Alumni',
        profesi: user?.profile?.profesi || '-',
        perusahaan: user?.profile?.perusahaan || '-',
        jabatan: user?.profile?.jabatan || '-',
        prodi: user?.prodi || '-',
        angkatan: user?.angkatan || '-',
        fotoProfil: user?.profile?.fotoProfil
          ? getImagePath(user.profile.fotoProfil, 'profiles')
          : '/landing/assets/images/portfolio-01.jpg'
      }
    })

    // Ambil program/event dari display_home_pages
    const programItems = await prisma.displayHomePage.findMany({
      where: { kategori: 'PROGRAM', isActive: true },
      orderBy: { urutan: 'asc' }
    })
    const populatedPrograms = await populateDisplayItems(programItems)

    // Format program data
    const programs = populatedPrograms.map(item => {
      const data = item.targetData
      if (!data) return null
      if (data.type === 'announcement') {
        return {
          id: data.id,
          title: data.title || 'Judul Program',
          image: data.image ? getImagePath(data.image, 'announcements') : '/landing/assets/images/service-icon-01.png',
          content: data.content || '',
          excerpt: data.content ? data.content.substring(0, 150) + '...' : '',
          type: 'announcement',
          link: `/berita/${data.id}`
        }
      } else if (data.type === 'event') {
        return {
          id: data.id,
          title: data.title || 'Judul Event',
          image: data.image ? getImagePath(data.image, 'events') : '/landing/assets/images/service-icon-01.png',
          description: data.description || '',
          excerpt: data.description ? data.description.substring(0, 150) + '...' : '',
          tanggal: data.tanggal,
          lokasi: data.lokasi,
          type: 'event',
          link: `/events/${data.id}`
        }
      }
      return null
    }).filter(Boolean)

    // Ambil email aktif dari display_home_pages
    const emailItem = await prisma.displayHomePage.findFirst({
      where: { kategori: 'EMAIL', isActive: true }
    })

    // Ambil nomor HP aktif dari display_home_pages
    const telephoneItem = await prisma.displayHomePage.findFirst({
      where: { kategori: 'TELEPHONE', isActive: true }
    })

    // Ambil statistics dari display_home_pages
    const alumniCountItem = await prisma.displayHomePage.findFirst({
      where: { kategori: 'ALUMNI_COUNT', isActive: true }
    })
    const eventCountItem = await prisma.displayHomePage.findFirst({
      where: { kategori: 'EVENT_COUNT', isActive: true }
    })
    const cityCountItem = await prisma.displayHomePage.findFirst({
      where: { kategori: 'CITY_COUNT', isActive: true }
    })

    // Ambil custom images dari display_home_pages
    const heroImageItem = await prisma.displayHomePage.findFirst({
      where: { kategori: 'HERO_IMAGE', isActive: true }
    })
    const aboutImageItem = await prisma.displayHomePage.findFirst({
      where: { kategori: 'ABOUT_IMAGE', isActive: true }
    })
    const navbarLogoItem = await prisma.displayHomePage.findFirst({
      where: { kategori: 'NAVBAR_LOGO', isActive: true }
    })

    // Ambil video youtube dari display_home_pages
    const youtubeItems = await prisma.displayHomePage.findMany({
      where: { kategori: 'YOUTUBE', isActive: true },
      orderBy: { urutan: 'asc' }
    })
    const populatedYoutube = await populateDisplayItems(youtubeItems)

    const videos = populatedYoutube.map(item => ({
      id: item.id,
      url: item.targetData?.url || ''
    })).filter(v => v.url)

    res.json({
      success: true,
      data: {
        alumni,
        programs,
        contactEmail: emailItem?.value || 'info@ikauiijateng.org',
        contactPhone: telephoneItem?.value || '',
        videos,
        alumniCount: alumniCountItem?.value || '500',
        eventCount: eventCountItem?.value || '50',
        cityCount: cityCountItem?.value || '15',
        heroImage: heroImageItem?.value ? getImagePath(heroImageItem.value, 'landing') : null,
        aboutImage: aboutImageItem?.value ? getImagePath(aboutImageItem.value, 'landing') : null,
        navbarLogo: navbarLogoItem?.value ? getImagePath(navbarLogoItem.value, 'landing') : null
      }
    })
  } catch (error) {
    console.error('Error fetching landing data:', error)
    res.status(500).json({
      success: false,
      message: 'Gagal mengambil data landing page',
      error: error.message
    })
  }
}
