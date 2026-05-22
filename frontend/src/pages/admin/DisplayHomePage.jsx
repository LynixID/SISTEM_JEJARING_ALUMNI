import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import AdminSidebar from '../../components/layout/AdminSidebar'
import api, {
  getAllDisplayItems,
  createDisplayItem,
  updateDisplayItem,
  deleteDisplayItem,
  reorderDisplayItems,
  getUsers,
  getAnnouncements,
  getEvents
} from '../../services/api'
import { Settings, Search, Trash2, Edit3, Move, Check, CheckCircle2, AlertCircle, X, Info, Mail, Phone, Youtube, Image, Users, Calendar, MapPin } from 'lucide-react'

const resolveImageUrl = (url, category = 'profiles') => {
  if (!url) return '';
  if (url.startsWith('http://') || url.startsWith('https://')) {
    return url;
  }
  if (url.startsWith('/uploads/')) {
    return url;
  }
  return `/uploads/images/${category}/${url}`;
};

const DisplayHomePage = () => {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)
  const [displayItems, setDisplayItems] = useState([])
  const [showModal, setShowModal] = useState(false)
  const [modalMode, setModalMode] = useState('create') // 'create' or 'edit'
  const [selectedItem, setSelectedItem] = useState(null)
  const [activeTab, setActiveTab] = useState('ALUMNI') // ALUMNI, PROGRAM, SETTING
  const [hasOrderChanged, setHasOrderChanged] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')

  // Notification & Confirmation states
  const [notification, setNotification] = useState(null) // { message: '', type: 'success' | 'error' | 'warning' }
  const [confirmModal, setConfirmModal] = useState(null) // { message: '', onConfirm: () => void }

  const showToast = (message, type = 'success') => {
    setNotification({ message, type })
  }

  // Data untuk dropdown
  const [users, setUsers] = useState([])
  const [announcements, setAnnouncements] = useState([])
  const [events, setEvents] = useState([])

  // Settings states
  const [settingEmail, setSettingEmail] = useState('')
  const [settingYoutube, setSettingYoutube] = useState('')
  const [settingPhone, setSettingPhone] = useState('')
  const [settingAlumniCount, setSettingAlumniCount] = useState('')
  const [settingEventCount, setSettingEventCount] = useState('')
  const [settingCityCount, setSettingCityCount] = useState('')
  const [settingHeroImage, setSettingHeroImage] = useState('')
  const [settingAboutImage, setSettingAboutImage] = useState('')
  const [emailItemId, setEmailItemId] = useState(null)
  const [youtubeItemId, setYoutubeItemId] = useState(null)
  const [phoneItemId, setPhoneItemId] = useState(null)
  const [alumniCountItemId, setAlumniCountItemId] = useState(null)
  const [eventCountItemId, setEventCountItemId] = useState(null)
  const [cityCountItemId, setCityCountItemId] = useState(null)
  const [heroImageItemId, setHeroImageItemId] = useState(null)
  const [aboutImageItemId, setAboutImageItemId] = useState(null)
  const [navbarLogoItemId, setNavbarLogoItemId] = useState(null)
  const [uploadingHero, setUploadingHero] = useState(false)
  const [uploadingAbout, setUploadingAbout] = useState(false)
  const [uploadingLogo, setUploadingLogo] = useState(false)
  const [settingNavbarLogo, setSettingNavbarLogo] = useState('')

  // Form state (tanpa urutan input)
  const [formData, setFormData] = useState({
    kategori: 'ALUMNI',
    idTarget: '',
    value: '',
    isActive: true
  })

  useEffect(() => {
    fetchDisplayItems()
    fetchDropdownData()
  }, [])

  useEffect(() => {
    if (notification) {
      const timer = setTimeout(() => {
        setNotification(null)
      }, 4000)
      return () => clearTimeout(timer)
    }
  }, [notification])

  const fetchDisplayItems = async () => {
    try {
      setLoading(true)
      const response = await getAllDisplayItems()
      const items = response.data.data
      setDisplayItems(items)

      // Find first EMAIL item
      const emailItem = items.find(item => item.kategori === 'EMAIL')
      if (emailItem) {
        setSettingEmail(emailItem.value || '')
        setEmailItemId(emailItem.id)
      } else {
        setSettingEmail('')
        setEmailItemId(null)
      }

      // Find first YOUTUBE item
      const youtubeItem = items.find(item => item.kategori === 'YOUTUBE')
      if (youtubeItem) {
        setSettingYoutube(youtubeItem.value || '')
        setYoutubeItemId(youtubeItem.id)
      } else {
        setSettingYoutube('')
        setYoutubeItemId(null)
      }

      // Find first TELEPHONE item
      const phoneItem = items.find(item => item.kategori === 'TELEPHONE')
      if (phoneItem) {
        setSettingPhone(phoneItem.value || '')
        setPhoneItemId(phoneItem.id)
      } else {
        setSettingPhone('')
        setPhoneItemId(null)
      }

      // Find first ALUMNI_COUNT item
      const alumniCountItem = items.find(item => item.kategori === 'ALUMNI_COUNT')
      if (alumniCountItem) {
        setSettingAlumniCount(alumniCountItem.value || '')
        setAlumniCountItemId(alumniCountItem.id)
      } else {
        setSettingAlumniCount('')
        setAlumniCountItemId(null)
      }

      // Find first EVENT_COUNT item
      const eventCountItem = items.find(item => item.kategori === 'EVENT_COUNT')
      if (eventCountItem) {
        setSettingEventCount(eventCountItem.value || '')
        setEventCountItemId(eventCountItem.id)
      } else {
        setSettingEventCount('')
        setEventCountItemId(null)
      }

      // Find first CITY_COUNT item
      const cityCountItem = items.find(item => item.kategori === 'CITY_COUNT')
      if (cityCountItem) {
        setSettingCityCount(cityCountItem.value || '')
        setCityCountItemId(cityCountItem.id)
      } else {
        setSettingCityCount('')
        setCityCountItemId(null)
      }

      // Find first HERO_IMAGE item
      const heroImageItem = items.find(item => item.kategori === 'HERO_IMAGE')
      if (heroImageItem) {
        setSettingHeroImage(heroImageItem.value || '')
        setHeroImageItemId(heroImageItem.id)
      } else {
        setSettingHeroImage('')
        setHeroImageItemId(null)
      }

      // Find first ABOUT_IMAGE item
      const aboutImageItem = items.find(item => item.kategori === 'ABOUT_IMAGE')
      if (aboutImageItem) {
        setSettingAboutImage(aboutImageItem.value || '')
        setAboutImageItemId(aboutImageItem.id)
      } else {
        setSettingAboutImage('')
        setAboutImageItemId(null)
      }

      // Find first NAVBAR_LOGO item
      const navbarLogoItem = items.find(item => item.kategori === 'NAVBAR_LOGO')
      if (navbarLogoItem) {
        setSettingNavbarLogo(navbarLogoItem.value || '')
        setNavbarLogoItemId(navbarLogoItem.id)
      } else {
        setSettingNavbarLogo('')
        setNavbarLogoItemId(null)
      }
    } catch (error) {
      console.error('Error fetching display items:', error)
      showToast('Gagal memuat data display', 'error')
    } finally {
      setLoading(false)
    }
  }

  const fetchDropdownData = async () => {
    try {
      const [alumniRes, pengurusRes, announcementsRes, eventsRes] = await Promise.all([
        getUsers({ limit: 100, role: 'ALUMNI' }),
        getUsers({ limit: 100, role: 'PENGURUS' }),
        getAnnouncements({ limit: 100 }),
        getEvents({ limit: 100 })
      ])
      const combinedUsers = [
        ...(alumniRes.data?.users || []),
        ...(pengurusRes.data?.users || [])
      ]
      const uniqueUsers = []
      const seenIds = new Set()
      for (const u of combinedUsers) {
        if (!seenIds.has(u.id)) {
          seenIds.add(u.id)
          uniqueUsers.push(u)
        }
      }
      setUsers(uniqueUsers)
      setAnnouncements(announcementsRes.data?.announcements || [])
      setEvents(eventsRes.data?.events || [])
    } catch (error) {
      console.error('Error fetching dropdown data:', error)
    }
  }

  const handleOpenModal = (mode, item = null) => {
    setModalMode(mode)
    setSelectedItem(item)
    setSearchTerm('')
    if (mode === 'edit' && item) {
      setFormData({
        kategori: item.kategori,
        idTarget: item.idTarget || '',
        value: item.value || '',
        isActive: item.isActive
      })
    } else {
      setFormData({
        kategori: activeTab,
        idTarget: '',
        value: '',
        isActive: true
      })
    }
    setShowModal(true)
  }

  const handleCloseModal = () => {
    setShowModal(false)
    setSelectedItem(null)
    setSearchTerm('')
    setFormData({
      kategori: 'ALUMNI',
      idTarget: '',
      value: '',
      isActive: true
    })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    if ((activeTab === 'ALUMNI' || activeTab === 'PROGRAM') && !formData.idTarget) {
      showToast('Silakan pilih target alumni atau program terlebih dahulu!', 'warning')
      return
    }

    try {
      if (modalMode === 'create') {
        // Automatically append to the end of sequence
        const currentTabItemsCount = displayItems.filter(i => i.kategori === activeTab).length
        const finalFormData = {
          ...formData,
          urutan: currentTabItemsCount
        }
        await createDisplayItem(finalFormData)
        showToast('Item berhasil ditambahkan', 'success')
      } else {
        await updateDisplayItem(selectedItem.id, formData)
        showToast('Item berhasil diupdate', 'success')
      }
      handleCloseModal()
      fetchDisplayItems()
    } catch (error) {
      console.error('Error saving item:', error)
      showToast(error.response?.data?.message || 'Gagal menyimpan data', 'error')
    }
  }

  const handleDelete = (id) => {
    setConfirmModal({
      message: 'Apakah Anda yakin ingin menghapus item ini dari display home page?',
      onConfirm: async () => {
        try {
          await deleteDisplayItem(id)
          showToast('Item berhasil dihapus', 'success')
          fetchDisplayItems()
        } catch (error) {
          console.error('Error deleting item:', error)
          showToast('Gagal menghapus item', 'error')
        }
      }
    })
  }

  const handleToggleActive = async (item) => {
    try {
      await updateDisplayItem(item.id, { isActive: !item.isActive })
      showToast('Status berhasil diperbarui', 'success')
      fetchDisplayItems()
    } catch (error) {
      console.error('Error toggling active:', error)
      showToast('Gagal mengubah status', 'error')
    }
  }

  const handleSaveSettings = async (e) => {
    e.preventDefault()
    try {
      setLoading(true)
      
      // Save Email
      if (emailItemId) {
        await updateDisplayItem(emailItemId, { value: settingEmail, isActive: true })
      } else if (settingEmail) {
        await createDisplayItem({ kategori: 'EMAIL', value: settingEmail, isActive: true, urutan: 0 })
      }

      // Save Youtube
      if (youtubeItemId) {
        await updateDisplayItem(youtubeItemId, { value: settingYoutube, isActive: true })
      } else if (settingYoutube) {
        await createDisplayItem({ kategori: 'YOUTUBE', value: settingYoutube, isActive: true, urutan: 0 })
      }

      // Save Telephone
      if (phoneItemId) {
        await updateDisplayItem(phoneItemId, { value: settingPhone, isActive: true })
      } else if (settingPhone) {
        await createDisplayItem({ kategori: 'TELEPHONE', value: settingPhone, isActive: true, urutan: 0 })
      }

      // Save Alumni Count
      if (alumniCountItemId) {
        await updateDisplayItem(alumniCountItemId, { value: settingAlumniCount, isActive: true })
      } else if (settingAlumniCount) {
        await createDisplayItem({ kategori: 'ALUMNI_COUNT', value: settingAlumniCount, isActive: true, urutan: 0 })
      }

      // Save Event Count
      if (eventCountItemId) {
        await updateDisplayItem(eventCountItemId, { value: settingEventCount, isActive: true })
      } else if (settingEventCount) {
        await createDisplayItem({ kategori: 'EVENT_COUNT', value: settingEventCount, isActive: true, urutan: 0 })
      }

      // Save City Count
      if (cityCountItemId) {
        await updateDisplayItem(cityCountItemId, { value: settingCityCount, isActive: true })
      } else if (settingCityCount) {
        await createDisplayItem({ kategori: 'CITY_COUNT', value: settingCityCount, isActive: true, urutan: 0 })
      }

      // Save Hero Image
      if (heroImageItemId) {
        await updateDisplayItem(heroImageItemId, { value: settingHeroImage, isActive: true })
      } else if (settingHeroImage) {
        await createDisplayItem({ kategori: 'HERO_IMAGE', value: settingHeroImage, isActive: true, urutan: 0 })
      }

      // Save About Image
      if (aboutImageItemId) {
        await updateDisplayItem(aboutImageItemId, { value: settingAboutImage, isActive: true })
      } else if (settingAboutImage) {
        await createDisplayItem({ kategori: 'ABOUT_IMAGE', value: settingAboutImage, isActive: true, urutan: 0 })
      }

      // Save Navbar Logo
      if (navbarLogoItemId) {
        await updateDisplayItem(navbarLogoItemId, { value: settingNavbarLogo, isActive: true })
      } else if (settingNavbarLogo) {
        await createDisplayItem({ kategori: 'NAVBAR_LOGO', value: settingNavbarLogo, isActive: true, urutan: 0 })
      }

      showToast('Pengaturan berhasil disimpan', 'success')
      fetchDisplayItems()
    } catch (error) {
      console.error('Error saving settings:', error)
      showToast('Gagal menyimpan pengaturan', 'error')
    } finally {
      setLoading(false)
    }
  }

  const handleUploadImage = async (e, type) => {
    const file = e.target.files[0]
    if (!file) return

    const formData = new FormData()
    formData.append('image', file)
    formData.append('category', 'landing')
    formData.append('type', type)

    if (type === 'hero') {
      setUploadingHero(true)
    } else if (type === 'logo') {
      setUploadingLogo(true)
    } else {
      setUploadingAbout(true)
    }

    try {
      const response = await api.post('/upload/image', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      })
      if (response.data?.filename) {
        const filename = response.data.filename
        if (type === 'hero') {
          setSettingHeroImage(filename)
          showToast('Gambar hero berhasil diunggah dan dikompres!', 'success')
        } else if (type === 'logo') {
          setSettingNavbarLogo(filename)
          showToast('Logo navbar berhasil diunggah dan dikompres!', 'success')
        } else {
          setSettingAboutImage(filename)
          showToast('Gambar tentang kami berhasil diunggah dan dikompres!', 'success')
        }
      } else {
        showToast('Gagal mengunggah gambar', 'error')
      }
    } catch (error) {
      console.error('Error uploading image:', error)
      showToast(error.response?.data?.error || 'Gagal mengunggah gambar', 'error')
    } finally {
      if (type === 'hero') {
        setUploadingHero(false)
      } else if (type === 'logo') {
        setUploadingLogo(false)
      } else {
        setUploadingAbout(false)
      }
    }
  }

  // HTML5 Drag and Drop handlers
  const handleDragStart = (e, index) => {
    e.dataTransfer.setData('text/plain', index)
  }

  const handleDragOver = (e) => {
    e.preventDefault()
  }

  const handleDrop = (e, targetIndex) => {
    e.preventDefault()
    const sourceIndex = parseInt(e.dataTransfer.getData('text/plain'))
    if (sourceIndex === targetIndex) return

    const tabItems = [...filteredItems]
    const [draggedItem] = tabItems.splice(sourceIndex, 1)
    tabItems.splice(targetIndex, 0, draggedItem)

    // Re-assign index-based urutan
    const updatedTabItems = tabItems.map((item, idx) => ({
      ...item,
      urutan: idx
    }))

    const otherItems = displayItems.filter(item => item.kategori !== activeTab)
    const merged = [...otherItems, ...updatedTabItems].sort((a, b) => {
      if (a.kategori !== b.kategori) return a.kategori.localeCompare(b.kategori)
      return a.urutan - b.urutan
    })

    setDisplayItems(merged)
    setHasOrderChanged(true)
  }

  const handleSaveOrder = async () => {
    try {
      setLoading(true)
      const payload = filteredItems.map(item => ({
        id: item.id,
        urutan: item.urutan
      }))

      await reorderDisplayItems(payload)
      showToast('Urutan display berhasil disimpan!', 'success')
      setHasOrderChanged(false)
      fetchDisplayItems()
    } catch (error) {
      console.error('Error saving item order:', error)
      showToast('Gagal menyimpan urutan display', 'error')
    } finally {
      setLoading(false)
    }
  }

  const filteredItems = displayItems.filter(item => item.kategori === activeTab)

  const addedAlumniIds = displayItems.filter(i => i.kategori === 'ALUMNI').map(i => i.idTarget)
  const addedProgramIds = displayItems.filter(i => i.kategori === 'PROGRAM').map(i => i.idTarget)

  const filteredUsersForModal = users.filter(u => {
    const isAdded = addedAlumniIds.includes(u.id)
    const isCurrent = modalMode === 'edit' && selectedItem?.idTarget === u.id
    return !isAdded || isCurrent
  }).filter(u => 
    u.nama?.toLowerCase().includes(searchTerm.toLowerCase()) || 
    u.prodi?.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const filteredAnnouncementsForModal = announcements.filter(a => {
    const isAdded = addedProgramIds.includes(a.id)
    const isCurrent = modalMode === 'edit' && selectedItem?.idTarget === a.id
    return !isAdded || isCurrent
  }).filter(a => 
    a.title?.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const filteredEventsForModal = events.filter(e => {
    const isAdded = addedProgramIds.includes(e.id)
    const isCurrent = modalMode === 'edit' && selectedItem?.idTarget === e.id
    return !isAdded || isCurrent
  }).filter(e => 
    e.title?.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const getTargetName = (item) => {
    if (!item.targetData) return 'Data tidak ditemukan'

    if (item.kategori === 'ALUMNI') {
      return item.targetData.nama || 'Unknown'
    } else if (item.kategori === 'PROGRAM') {
      return item.targetData.title || 'Unknown'
    } else if (item.kategori === 'EMAIL') {
      return item.value
    } else if (item.kategori === 'YOUTUBE') {
      return item.value
    }
    return '-'
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex">
        <AdminSidebar />
        <div className="flex-1 flex items-center justify-center min-h-screen">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading...</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 flex">
      <AdminSidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <main className="flex-1 overflow-y-auto p-6">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-800">Display Home Page</h1>
          <p className="text-gray-600 mt-1">Kelola konten yang ditampilkan di halaman landing page</p>
        </div>

        {/* Tabs */}
        <div className="mb-6 border-b border-gray-200">
          <nav className="flex space-x-8">
            <button
              onClick={() => {
                setActiveTab('ALUMNI')
                setHasOrderChanged(false)
              }}
              className={`py-4 px-1 border-b-2 font-medium text-sm transition-all duration-200 ${
                activeTab === 'ALUMNI'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Alumni
            </button>
            <button
              onClick={() => {
                setActiveTab('PROGRAM')
                setHasOrderChanged(false)
              }}
              className={`py-4 px-1 border-b-2 font-medium text-sm transition-all duration-200 ${
                activeTab === 'PROGRAM'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Event & Program
            </button>
            <button
              onClick={() => {
                setActiveTab('SETTING')
                setHasOrderChanged(false)
              }}
              className={`py-4 px-1 border-b-2 font-medium text-sm transition-all duration-200 ${
                activeTab === 'SETTING'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Setting
            </button>
          </nav>
        </div>

        {/* Add Button */}
        {activeTab !== 'SETTING' && (
          <div className="mb-6">
            <button
              onClick={() => handleOpenModal('create')}
              className="bg-blue-600 text-white px-4 py-2.5 rounded-lg shadow-sm hover:shadow-md hover:bg-blue-700 transition font-medium flex items-center gap-1.5"
            >
              <span>+ Tambah {activeTab === 'ALUMNI' ? 'Alumni' : 'Program'}</span>
            </button>
          </div>
        )}

        {/* Setting Form */}
        {activeTab === 'SETTING' && (
          <div className="w-full max-w-7xl animate-fadeIn space-y-6">
            {/* Header section card */}
            <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                  <Settings size={24} />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-gray-900">Pengaturan Display Landing Page</h2>
                  <p className="text-xs text-gray-500">Kelola kontak, media banner visual, dan statistik utama landing page.</p>
                </div>
              </div>
            </div>

            <form onSubmit={handleSaveSettings} className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
                
                {/* Left/Main Area: Kontak & Statistik */}
                <div className="lg:col-span-2 space-y-6">
                  
                  {/* Section 1: Kontak Utama & Media Sosial */}
                  <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
                    <div className="border-b border-gray-150 pb-4 mb-5">
                      <h3 className="text-base font-bold text-gray-900 flex items-center gap-2">
                        <span className="w-1.5 h-5 bg-blue-600 rounded-sm"></span>
                        Kontak Utama & Media Sosial
                      </h3>
                      <p className="text-xs text-gray-500 mt-1">Kelola informasi kontak resmi dan link media sosial utama</p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      <div>
                        <label className="flex items-center gap-2 text-sm font-bold text-gray-800 mb-2.5">
                          <Mail size={16} className="text-blue-600" />
                          <span>Email Kontak</span>
                        </label>
                        <div className="relative rounded-md shadow-sm">
                          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400 font-bold text-sm">
                            @
                          </div>
                          <input
                            type="email"
                            value={settingEmail}
                            onChange={(e) => setSettingEmail(e.target.value)}
                            className="w-full pl-9 pr-3 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-800 text-sm font-medium"
                            placeholder="kontak@ikauiijateng.org"
                            required
                          />
                        </div>
                        <p className="mt-1.5 text-xs text-gray-400 leading-relaxed">
                          Tampil di footer website dan tujuan formulir hubungi kami.
                        </p>
                      </div>

                      <div>
                        <label className="flex items-center gap-2 text-sm font-bold text-gray-800 mb-2.5">
                          <Phone size={16} className="text-green-600" />
                          <span>Nomor HP (WhatsApp)</span>
                        </label>
                        <input
                          type="text"
                          value={settingPhone}
                          onChange={(e) => setSettingPhone(e.target.value)}
                          className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-800 text-sm font-medium"
                          placeholder="08123456789"
                          required
                        />
                        <p className="mt-1.5 text-xs text-gray-400 leading-relaxed">
                          Tautan obrolan langsung WhatsApp pada tombol landing page.
                        </p>
                      </div>

                      <div>
                        <label className="flex items-center gap-2 text-sm font-bold text-gray-800 mb-2.5">
                          <Youtube size={16} className="text-red-600" />
                          <span>Link Video YouTube</span>
                        </label>
                        <input
                          type="url"
                          value={settingYoutube}
                          onChange={(e) => setSettingYoutube(e.target.value)}
                          className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-800 text-sm font-medium"
                          placeholder="https://www.youtube.com/watch?v=xxxxxx"
                          required
                        />
                        <p className="mt-1.5 text-xs text-gray-400 leading-relaxed">
                          Contoh: https://www.youtube.com/watch?v=a6XZ5cfIzr0
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Section 3: Statistik Landing Page */}
                  <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
                    <div className="border-b border-gray-150 pb-4 mb-5">
                      <h3 className="text-base font-bold text-gray-900 flex items-center gap-2">
                        <span className="w-1.5 h-5 bg-blue-600 rounded-sm"></span>
                        Statistik Landing Page
                      </h3>
                      <p className="text-xs text-gray-500 mt-1">Perbarui angka-angka pencapaian utama yang tampil di landing page</p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      <div>
                        <label className="flex items-center gap-2 text-sm font-bold text-gray-800 mb-2.5">
                          <Users size={16} className="text-indigo-600" />
                          <span>Jumlah Alumni Aktif</span>
                        </label>
                        <input
                          type="text"
                          value={settingAlumniCount}
                          onChange={(e) => setSettingAlumniCount(e.target.value)}
                          className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-800 text-sm font-medium"
                          placeholder="500"
                          required
                        />
                        <p className="mt-1.5 text-xs text-gray-400 leading-relaxed">
                          Angka statistik jumlah alumni aktif yang terdata.
                        </p>
                      </div>

                      <div>
                        <label className="flex items-center gap-2 text-sm font-bold text-gray-800 mb-2.5">
                          <Calendar size={16} className="text-orange-600" />
                          <span>Kegiatan / Tahun</span>
                        </label>
                        <input
                          type="text"
                          value={settingEventCount}
                          onChange={(e) => setSettingEventCount(e.target.value)}
                          className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-800 text-sm font-medium"
                          placeholder="50"
                          required
                        />
                        <p className="mt-1.5 text-xs text-gray-400 leading-relaxed">
                          Angka rata-rata program/kegiatan tahunan.
                        </p>
                      </div>

                      <div>
                        <label className="flex items-center gap-2 text-sm font-bold text-gray-800 mb-2.5">
                          <MapPin size={16} className="text-teal-600" />
                          <span>Kota Tercover</span>
                        </label>
                        <input
                          type="text"
                          value={settingCityCount}
                          onChange={(e) => setSettingCityCount(e.target.value)}
                          className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-800 text-sm font-medium"
                          placeholder="15"
                          required
                        />
                        <p className="mt-1.5 text-xs text-gray-400 leading-relaxed">
                          Jumlah sebaran kabupaten/kota wilayah kepengurusan.
                        </p>
                      </div>
                    </div>
                  </div>

                </div>

                {/* Right Column: Visual & Media Banner */}
                <div className="space-y-6">
                  
                  <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm space-y-6">
                    <div className="border-b border-gray-150 pb-4">
                      <h3 className="text-base font-bold text-gray-900 flex items-center gap-2">
                        <span className="w-1.5 h-5 bg-blue-600 rounded-sm"></span>
                        Visual & Media Banner
                      </h3>
                      <p className="text-xs text-gray-500 mt-1">Upload dan atur gambar hero banner utama dan tentang kami</p>
                    </div>

                    <div>
                      <label className="flex items-center gap-2 text-sm font-bold text-gray-800 mb-2.5">
                        <Image size={16} className="text-purple-600" />
                        <span>Gambar Hero (Banner Utama)</span>
                      </label>
                      <div className="relative group border-2 border-dashed border-gray-300 rounded-xl p-4 text-center hover:border-blue-500 hover:bg-blue-50/10 transition duration-200 cursor-pointer flex flex-col items-center justify-center min-h-[180px] bg-white">
                        <input
                          type="file"
                          accept="image/*"
                          onChange={(e) => handleUploadImage(e, 'hero')}
                          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                          disabled={uploadingHero}
                        />
                        {uploadingHero ? (
                          <div className="flex flex-col items-center gap-2">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                            <span className="text-xs text-gray-500 font-medium">Mengunggah dan mengompres...</span>
                          </div>
                        ) : settingHeroImage ? (
                          <div className="w-full space-y-3 z-20">
                            <div className="h-28 w-full rounded-lg overflow-hidden border border-gray-200 relative bg-gray-50">
                              <img
                                src={resolveImageUrl(settingHeroImage, 'landing')}
                                alt="Hero Preview"
                                className="w-full h-full object-cover"
                              />
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  e.preventDefault();
                                  setSettingHeroImage('');
                                }}
                                className="absolute top-1.5 right-1.5 bg-red-600 hover:bg-red-700 text-white p-1 rounded-full shadow-md transition z-30"
                                title="Hapus gambar"
                              >
                                <X size={12} />
                              </button>
                            </div>
                            <span className="text-xs text-gray-500 font-medium block truncate max-w-xs mx-auto">{settingHeroImage}</span>
                          </div>
                        ) : (
                          <div className="flex flex-col items-center gap-2">
                            <div className="w-10 h-10 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center">
                              <Settings size={20} className="animate-pulse" />
                            </div>
                            <span className="text-xs font-bold text-gray-700">Upload Hero Image</span>
                            <span className="text-[10px] text-gray-500 font-medium">PNG, JPG, WebP (Maks. 5MB)</span>
                          </div>
                        )}
                      </div>
                      <p className="mt-1.5 text-xs text-gray-400 leading-relaxed">
                        Gambar latar belakang banner utama di landing page.
                      </p>
                    </div>

                    <div className="pt-4 border-t border-gray-100">
                      <label className="flex items-center gap-2 text-sm font-bold text-gray-800 mb-2.5">
                        <Image size={16} className="text-pink-600" />
                        <span>Gambar Tentang Kami</span>
                      </label>
                      <div className="relative group border-2 border-dashed border-gray-300 rounded-xl p-4 text-center hover:border-blue-500 hover:bg-blue-50/10 transition duration-200 cursor-pointer flex flex-col items-center justify-center min-h-[180px] bg-white">
                        <input
                          type="file"
                          accept="image/*"
                          onChange={(e) => handleUploadImage(e, 'about')}
                          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                          disabled={uploadingAbout}
                        />
                        {uploadingAbout ? (
                          <div className="flex flex-col items-center gap-2">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                            <span className="text-xs text-gray-500 font-medium">Mengunggah dan mengompres...</span>
                          </div>
                        ) : settingAboutImage ? (
                          <div className="w-full space-y-3 z-20">
                            <div className="h-28 w-full rounded-lg overflow-hidden border border-gray-200 relative bg-gray-50">
                              <img
                                src={resolveImageUrl(settingAboutImage, 'landing')}
                                alt="About Preview"
                                className="w-full h-full object-cover"
                              />
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  e.preventDefault();
                                  setSettingAboutImage('');
                                }}
                                className="absolute top-1.5 right-1.5 bg-red-600 hover:bg-red-700 text-white p-1 rounded-full shadow-md transition z-30"
                                title="Hapus gambar"
                              >
                                <X size={12} />
                              </button>
                            </div>
                            <span className="text-xs text-gray-500 font-medium block truncate max-w-xs mx-auto">{settingAboutImage}</span>
                          </div>
                        ) : (
                          <div className="flex flex-col items-center gap-2">
                            <div className="w-10 h-10 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center">
                              <Settings size={20} className="animate-pulse" />
                            </div>
                            <span className="text-xs font-bold text-gray-700">Upload Tentang Kami Image</span>
                            <span className="text-[10px] text-gray-500 font-medium">PNG, JPG, WebP (Maks. 5MB)</span>
                          </div>
                        )}
                      </div>
                      <p className="mt-1.5 text-xs text-gray-400 leading-relaxed">
                        Gambar ilustrasi bagian Tentang Kami di landing page.
                      </p>
                    </div>

                    <div className="pt-4 border-t border-gray-100">
                      <label className="flex items-center gap-2 text-sm font-bold text-gray-800 mb-2.5">
                        <Image size={16} className="text-blue-600" />
                        <span>Logo Navbar Landing Page</span>
                      </label>
                      <div className="relative group border-2 border-dashed border-gray-300 rounded-xl p-4 text-center hover:border-blue-500 hover:bg-blue-50/10 transition duration-200 cursor-pointer flex flex-col items-center justify-center min-h-[140px] bg-white">
                        <input
                          type="file"
                          accept="image/*"
                          onChange={(e) => handleUploadImage(e, 'logo')}
                          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                          disabled={uploadingLogo}
                        />
                        {uploadingLogo ? (
                          <div className="flex flex-col items-center gap-2">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                            <span className="text-xs text-gray-500 font-medium">Mengunggah dan mengompres...</span>
                          </div>
                        ) : settingNavbarLogo ? (
                          <div className="w-full space-y-3 z-20">
                            <div className="h-16 w-full rounded-lg overflow-hidden border border-gray-200 relative bg-gray-50 flex items-center justify-center p-2">
                              <img
                                src={resolveImageUrl(settingNavbarLogo, 'landing')}
                                alt="Navbar Logo Preview"
                                className="h-full w-auto object-contain"
                                style={{ maxHeight: '40px' }}
                              />
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  e.preventDefault();
                                  setSettingNavbarLogo('');
                                }}
                                className="absolute top-1.5 right-1.5 bg-red-600 hover:bg-red-700 text-white p-1 rounded-full shadow-md transition z-30"
                                title="Hapus logo"
                              >
                                <X size={12} />
                              </button>
                            </div>
                            <span className="text-xs text-gray-500 font-medium block truncate max-w-xs mx-auto">{settingNavbarLogo}</span>
                          </div>
                        ) : (
                          <div className="flex flex-col items-center gap-2">
                            <div className="w-10 h-10 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center">
                              <Settings size={20} className="animate-pulse" />
                            </div>
                            <span className="text-xs font-bold text-gray-700">Upload Logo Navbar</span>
                            <span className="text-[10px] text-gray-500 font-medium">PNG, JPG, WebP (Maks. 5MB)</span>
                          </div>
                        )}
                      </div>
                      <p className="mt-1.5 text-xs text-gray-400 leading-relaxed">
                        Logo resmi di pojok kiri atas navbar dan footer landing page. Ukuran tampilan akan otomatis disesuaikan (tinggi 40px).
                      </p>
                    </div>
                  </div>
                </div>

              </div>

              {/* Action Bar Footer */}
              <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm flex flex-col sm:flex-row justify-between items-center gap-4">
                <div className="text-xs text-gray-500 flex items-center gap-2">
                  <Info size={16} className="text-blue-600 flex-shrink-0" />
                  <span>Pastikan semua data input sudah benar sebelum menyimpan pengaturan.</span>
                </div>
                <button
                  type="submit"
                  className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700 text-white font-bold px-8 py-3 rounded-lg shadow-sm hover:shadow-md transition-all duration-200 text-sm flex items-center justify-center gap-2"
                >
                  <Check size={16} />
                  <span>Simpan Pengaturan</span>
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Visual Card Preview Area */}
        {activeTab !== 'SETTING' && (
          <div className="space-y-6">
            <div className="flex justify-between items-center bg-blue-50 border border-blue-100 rounded-xl p-4">
              <div className="text-sm text-blue-800">
                💡 <span className="font-semibold">Tips:</span> Anda bisa menyeret (drag & drop) kartu di bawah ini untuk mengatur urutan penampilannya di halaman depan secara visual. Jangan lupa klik <span className="font-bold">Simpan Urutan</span> setelah selesai.
              </div>
              {hasOrderChanged && (
                <button
                  onClick={handleSaveOrder}
                  className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white font-semibold px-4 py-2 rounded-lg shadow-sm transition duration-200 flex-shrink-0 text-sm"
                >
                  <CheckCircle2 size={16} />
                  <span>Simpan Urutan</span>
                </button>
              )}
            </div>

            {filteredItems.length === 0 ? (
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center text-gray-500">
                Belum ada data untuk ditampilkan. Silakan tambah baru.
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredItems.map((item, index) => {
                  const targetName = getTargetName(item)
                  const imageUrl = item.kategori === 'ALUMNI'
                    ? item.targetData?.profile?.fotoProfil
                    : item.targetData?.image
                  
                  let category = 'profiles';
                  if (item.kategori === 'PROGRAM') {
                    category = item.targetData?.type === 'announcement' ? 'announcements' : 'events';
                  }
                  const resolvedImage = imageUrl ? resolveImageUrl(imageUrl, category) : null
                  
                  return (
                    <div
                      key={item.id}
                      draggable
                      onDragStart={(e) => handleDragStart(e, index)}
                      onDragOver={(e) => handleDragOver(e)}
                      onDrop={(e) => handleDrop(e, index)}
                      className="bg-white rounded-xl shadow-sm hover:shadow-md border border-gray-200 overflow-hidden transition-all duration-200 relative group cursor-grab active:cursor-grabbing flex flex-col"
                    >
                      {/* Drag handle overlay */}
                      <div className="absolute top-3 left-3 bg-gray-900/60 text-white p-1.5 rounded backdrop-blur-sm opacity-60 group-hover:opacity-100 transition-opacity">
                        <Move size={14} />
                      </div>

                      {/* Sequence Badge */}
                      <div className="absolute top-3 right-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-3 py-1 rounded-full text-xs font-extrabold shadow-md z-10 border border-blue-400/30 flex items-center gap-1">
                        <span className="opacity-75 text-[10px]">URUTAN</span>
                        <span>#{index + 1}</span>
                      </div>

                      {/* Image Preview Banner */}
                      <div className="h-44 bg-gray-150 flex items-center justify-center overflow-hidden border-b border-gray-100 relative">
                        {resolvedImage ? (
                          <img
                            src={resolvedImage}
                            alt={targetName}
                            className="w-full h-full object-cover group-hover:scale-102 transition-transform duration-300"
                          />
                        ) : (
                          <div className="w-full h-full bg-gradient-to-br from-blue-50 to-indigo-50 flex items-center justify-center">
                            {item.kategori === 'ALUMNI' ? (
                              <div className="w-16 h-16 rounded-full bg-blue-600 text-white font-bold flex items-center justify-center text-2xl shadow-sm">
                                {targetName?.charAt(0) || 'A'}
                              </div>
                            ) : (
                              <div className="text-gray-400 text-xs font-semibold">No Image Banner</div>
                            )}
                          </div>
                        )}
                      </div>

                      {/* Card Content Body */}
                      <div className="p-5 flex-1 flex flex-col justify-between">
                        <div>
                          <h3 className="font-bold text-gray-800 text-base mb-1 leading-snug line-clamp-1">{targetName}</h3>
                          
                          {item.kategori === 'ALUMNI' && (
                            <p className="text-xs text-gray-500 line-clamp-2 min-h-[32px]">
                              {item.targetData?.profile?.jabatan || 'Alumni'} di {item.targetData?.profile?.perusahaan || 'UII'}
                              <br />
                              <span className="text-[10px] text-gray-400">{item.targetData?.prodi || '-'} ({item.targetData?.angkatan || '-'})</span>
                            </p>
                          )}

                          {item.kategori === 'PROGRAM' && (
                            <div className="flex flex-col gap-1.5 min-h-[32px]">
                              <span className={`self-start px-2 py-0.5 rounded-full text-[9px] font-bold tracking-wide uppercase ${
                                item.targetData?.type === 'announcement'
                                  ? 'bg-blue-100 text-blue-800'
                                  : 'bg-emerald-100 text-emerald-800'
                              }`}>
                                {item.targetData?.type === 'announcement' ? 'Announcement' : 'Event'}
                              </span>
                              {item.targetData?.tanggal && (
                                <span className="text-[10px] text-gray-500 font-medium">
                                  📅 {new Date(item.targetData.tanggal).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
                                </span>
                              )}
                            </div>
                          )}
                        </div>

                        {/* Card Actions Footer */}
                        <div className="mt-4 pt-4 border-t border-gray-100 flex items-center justify-between">
                          <button
                            onClick={() => handleToggleActive(item)}
                            className={`px-3 py-1 rounded-full text-xs font-semibold shadow-sm transition-colors ${
                              item.isActive
                                ? 'bg-green-100 text-green-800 hover:bg-green-200'
                                : 'bg-gray-100 text-gray-800 hover:bg-gray-200'
                            }`}
                          >
                            {item.isActive ? '● Aktif' : '○ Nonaktif'}
                          </button>

                          <div className="flex items-center gap-3">
                            <button
                              onClick={() => handleOpenModal('edit', item)}
                              className="text-gray-400 hover:text-blue-600 transition-colors p-1"
                              title="Edit item"
                            >
                              <Edit3 size={16} />
                            </button>
                            <button
                              onClick={() => handleDelete(item.id)}
                              className="text-gray-400 hover:text-red-600 transition-colors p-1"
                              title="Hapus item"
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        )}

        {/* Modal Selection Picker */}
        {showModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-xl p-6 w-full max-w-md shadow-2xl border border-gray-100">
              <h2 className="text-lg font-bold mb-4 text-gray-800">
                {modalMode === 'create' ? 'Tambah' : 'Edit'} {activeTab === 'ALUMNI' ? 'Alumni' : 'Program'}
              </h2>
              <form onSubmit={handleSubmit} className="space-y-4">
                
                {/* Searchable Candidate Picker for Alumni */}
                {activeTab === 'ALUMNI' && (
                  <div className="mb-4">
                    <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-2">
                      Pilih Alumni
                    </label>
                    
                    <div className="relative mb-3">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                        <Search size={14} />
                      </div>
                      <input
                        type="text"
                        placeholder="Cari nama alumni..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-850 text-xs"
                      />
                    </div>

                    <div className="border border-gray-200 rounded-lg max-h-60 overflow-y-auto divide-y divide-gray-150 custom-scrollbar">
                      {filteredUsersForModal.length === 0 ? (
                        <div className="p-4 text-center text-gray-500 text-xs">Alumni tidak ditemukan atau sudah ditambahkan</div>
                      ) : (
                        filteredUsersForModal.map(u => {
                          const isSelected = formData.idTarget === u.id
                          const avatarUrl = u.profile?.fotoProfil ? resolveImageUrl(u.profile?.fotoProfil, 'profiles') : null
                          
                          return (
                            <button
                              key={u.id}
                              type="button"
                              onClick={() => setFormData({ ...formData, idTarget: u.id })}
                              className={`w-full flex items-center gap-3 p-3 text-left transition-colors hover:bg-gray-50 ${
                                isSelected ? 'bg-blue-50/70 text-blue-900 font-medium' : ''
                              }`}
                            >
                              <div className="w-10 h-10 rounded-full bg-blue-600 text-white font-semibold flex items-center justify-center flex-shrink-0 overflow-hidden shadow-sm">
                                {avatarUrl ? (
                                  <img src={avatarUrl} alt={u.nama} className="w-full h-full object-cover" />
                                ) : (
                                  u.nama?.charAt(0)
                                )}
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-1.5">
                                  <p className="text-xs font-bold truncate text-gray-800">{u.nama}</p>
                                  <span className={`px-1.5 py-0.5 rounded text-[8px] font-bold ${
                                    u.role === 'PENGURUS' ? 'bg-purple-100 text-purple-800' : 'bg-blue-100 text-blue-800'
                                  }`}>
                                    {u.role}
                                  </span>
                                </div>
                                <p className="text-[10px] text-gray-500 truncate">{u.prodi || 'Program Studi'} ({u.angkatan || 'Tahun'})</p>
                              </div>
                              {isSelected && (
                                <div className="text-blue-600 pr-2">
                                  <Check size={16} />
                                </div>
                              )}
                            </button>
                          )
                        })
                      )}
                    </div>
                  </div>
                )}

                {/* Searchable Candidate Picker for Program */}
                {activeTab === 'PROGRAM' && (
                  <div className="mb-4">
                    <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-2">
                      Pilih Announcement atau Event
                    </label>

                    <div className="relative mb-3">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                        <Search size={14} />
                      </div>
                      <input
                        type="text"
                        placeholder="Cari judul..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-850 text-xs"
                      />
                    </div>

                    <div className="border border-gray-200 rounded-lg max-h-60 overflow-y-auto divide-y divide-gray-150 custom-scrollbar">
                      {(() => {
                        const filteredAnn = filteredAnnouncementsForModal
                        const filteredEvt = filteredEventsForModal
                        
                        if (filteredAnn.length === 0 && filteredEvt.length === 0) {
                          return <div className="p-4 text-center text-gray-500 text-xs">Program tidak ditemukan atau semua sudah ditambahkan</div>
                        }

                        return (
                          <>
                            {filteredAnn.length > 0 && (
                              <div>
                                <div className="bg-gray-100 px-3 py-1 text-[9px] font-bold text-gray-500 tracking-wider uppercase">Announcements</div>
                                {filteredAnn.map(item => {
                                  const isSelected = formData.idTarget === item.id
                                  const bannerUrl = item.image ? resolveImageUrl(item.image, 'announcements') : null
                                  
                                  return (
                                    <button
                                      key={`ann-${item.id}`}
                                      type="button"
                                      onClick={() => setFormData({ ...formData, idTarget: item.id })}
                                      className={`w-full flex items-center gap-3 p-3 text-left transition-colors hover:bg-gray-50 ${
                                        isSelected ? 'bg-blue-50/70 text-blue-900 font-medium' : ''
                                      }`}
                                    >
                                      <div className="w-12 h-8 bg-gray-200 rounded overflow-hidden flex-shrink-0 flex items-center justify-center">
                                        {bannerUrl ? (
                                          <img src={bannerUrl} alt={item.title} className="w-full h-full object-cover" />
                                        ) : (
                                          <span className="text-[9px] font-bold text-gray-400">ANN</span>
                                        )}
                                      </div>
                                      <div className="flex-1 min-w-0">
                                        <p className="text-xs font-bold truncate text-gray-800">{item.title}</p>
                                        <p className="text-[9px] text-blue-600 font-semibold">Announcement</p>
                                      </div>
                                      {isSelected && (
                                        <div className="text-blue-600 pr-2">
                                          <Check size={16} />
                                        </div>
                                      )}
                                    </button>
                                  )
                                })}
                              </div>
                            )}

                            {filteredEvt.length > 0 && (
                              <div>
                                <div className="bg-gray-100 px-3 py-1 text-[9px] font-bold text-gray-500 tracking-wider uppercase">Events</div>
                                {filteredEvt.map(item => {
                                  const isSelected = formData.idTarget === item.id
                                  const bannerUrl = item.image ? resolveImageUrl(item.image, 'events') : null
                                  
                                  return (
                                    <button
                                      key={`evt-${item.id}`}
                                      type="button"
                                      onClick={() => setFormData({ ...formData, idTarget: item.id })}
                                      className={`w-full flex items-center gap-3 p-3 text-left transition-colors hover:bg-gray-50 ${
                                        isSelected ? 'bg-blue-50/70 text-blue-900 font-medium' : ''
                                      }`}
                                    >
                                      <div className="w-12 h-8 bg-gray-200 rounded overflow-hidden flex-shrink-0 flex items-center justify-center">
                                        {bannerUrl ? (
                                          <img src={bannerUrl} alt={item.title} className="w-full h-full object-cover" />
                                        ) : (
                                          <span className="text-[9px] font-bold text-gray-400">EVT</span>
                                        )}
                                      </div>
                                      <div className="flex-1 min-w-0">
                                        <p className="text-xs font-bold truncate text-gray-800">{item.title}</p>
                                        <p className="text-[9px] text-emerald-600 font-semibold">Event</p>
                                      </div>
                                      {isSelected && (
                                        <div className="text-blue-600 pr-2">
                                          <Check size={16} />
                                        </div>
                                      )}
                                    </button>
                                  )
                                })}
                              </div>
                            )}
                          </>
                        )
                      })()}
                    </div>
                  </div>
                )}

                <div className="mb-4">
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={formData.isActive}
                      onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 h-4 w-4"
                    />
                    <span className="ml-2 text-sm text-gray-700 font-medium">Status Aktif</span>
                  </label>
                </div>

                <div className="flex justify-end space-x-2 pt-4 border-t border-gray-100">
                  <button
                    type="button"
                    onClick={handleCloseModal}
                    className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 font-medium text-xs transition-colors"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-semibold text-xs shadow-sm hover:shadow transition-colors"
                  >
                    Simpan
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Custom Confirmation Modal */}
        {confirmModal && (
          <div className="fixed inset-0 bg-black/45 backdrop-blur-sm flex items-center justify-center z-50 animate-fadeIn">
            <div className="bg-white rounded-2xl p-6 w-full max-w-sm shadow-2xl border border-gray-100 transform scale-100 transition-transform duration-200">
              <div className="flex flex-col items-center text-center">
                <div className="w-12 h-12 rounded-full bg-red-50 text-red-600 flex items-center justify-center mb-4">
                  <AlertCircle size={24} />
                </div>
                <h3 className="text-base font-bold text-gray-850 mb-2">Konfirmasi Tindakan</h3>
                <p className="text-xs text-gray-500 font-medium leading-relaxed px-2 mb-6">
                  {confirmModal.message}
                </p>
                <div className="flex items-center gap-3 w-full">
                  <button
                    type="button"
                    onClick={() => setConfirmModal(null)}
                    className="flex-1 py-2.5 px-4 border border-gray-250 hover:bg-gray-50 rounded-xl text-xs font-bold text-gray-600 transition duration-200"
                  >
                    Batal
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      confirmModal.onConfirm();
                      setConfirmModal(null);
                    }}
                    className="flex-1 py-2.5 px-4 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-bold shadow-md hover:shadow-lg transition duration-200"
                  >
                    Hapus
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Custom Toast Notification */}
        {notification && (
          <div className="fixed top-5 right-5 z-50 animate-slideIn flex items-center gap-3 bg-white/95 backdrop-blur-md px-5 py-4 rounded-xl border border-gray-150 shadow-[0_10px_30px_rgba(0,0,0,0.08)] max-w-sm">
            <div className={`p-2 rounded-lg flex-shrink-0 ${
              notification.type === 'success' ? 'bg-green-50 text-green-600' :
              notification.type === 'error' ? 'bg-red-50 text-red-600' : 'bg-yellow-50 text-yellow-600'
            }`}>
              {notification.type === 'success' ? <CheckCircle2 size={18} /> : 
               notification.type === 'error' ? <AlertCircle size={18} /> : <Info size={18} />}
            </div>
            <div className="flex-1 min-w-0 pr-2">
              <p className="text-xs font-bold text-gray-800">
                {notification.type === 'success' ? 'Berhasil' :
                 notification.type === 'error' ? 'Gagal' : 'Perhatian'}
              </p>
              <p className="text-[11px] text-gray-500 mt-0.5 leading-relaxed font-medium">{notification.message}</p>
            </div>
            <button 
              onClick={() => setNotification(null)}
              className="text-gray-400 hover:text-gray-600 transition-colors p-1 hover:bg-gray-50 rounded-lg flex-shrink-0"
            >
              <X size={14} />
            </button>
          </div>
        )}
        </main>
      </div>
    </div>
  )
}

export default DisplayHomePage
