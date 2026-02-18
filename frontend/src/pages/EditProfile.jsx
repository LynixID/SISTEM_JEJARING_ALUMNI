import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, Save, User, Image as ImageIcon, X, Plus, Trash2, Edit2, FileText, Briefcase, GraduationCap, Award } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import Header from '../components/layout/Header'
import Sidebar from '../components/layout/Sidebar'
import Button from '../components/common/Button'
import Input from '../components/common/Input'
import AlertModal from '../components/common/AlertModal'
import ConfirmModal from '../components/common/ConfirmModal'
import { getUserProfile, updateUserProfile, updateUserBasicInfo } from '../services/api'
import { getImageUrl } from '../utils/imageUtils'

const EditProfile = () => {
  const { id } = useParams()
  const { user: currentUser, isAuthenticated, refreshUser } = useAuth()
  const navigate = useNavigate()
  const userId = id || currentUser?.id

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [activeTab, setActiveTab] = useState('basic')

  // Basic Info
  const [basicInfo, setBasicInfo] = useState({
    nama: '',
    whatsapp: '',
    domisili: ''
  })

  // Profile Info
  const [profileInfo, setProfileInfo] = useState({
    profesi: '',
    perusahaan: '',
    jabatan: '',
    skill: '',
    sosialMedia: {
      linkedin: '',
      instagram: '',
      twitter: '',
      github: '',
      website: ''
    },
    portfolio: [],
    experience: [],
    education: [],
    certifications: []
  })

  // File uploads
  const [fotoProfilFile, setFotoProfilFile] = useState(null)
  const [coverPhotoFile, setCoverPhotoFile] = useState(null)
  const [fotoProfilPreview, setFotoProfilPreview] = useState(null)
  const [coverPhotoPreview, setCoverPhotoPreview] = useState(null)

  // State untuk form modal
  const [showPortfolioModal, setShowPortfolioModal] = useState(false)
  const [showExperienceModal, setShowExperienceModal] = useState(false)
  const [showEducationModal, setShowEducationModal] = useState(false)
  const [showCertificationModal, setShowCertificationModal] = useState(false)
  const [editingIndex, setEditingIndex] = useState(null)

  // Form data untuk modal
  const [portfolioForm, setPortfolioForm] = useState({
    title: '',
    description: '',
    image: '',
    technologies: [],
    category: '',
    link: '',
    github: '',
    year: new Date().getFullYear()
  })

  const [experienceForm, setExperienceForm] = useState({
    company: '',
    position: '',
    location: '',
    startDate: '',
    endDate: '',
    employmentType: 'Full-time',
    description: '',
    skills: []
  })

  const [educationForm, setEducationForm] = useState({
    school: '',
    degree: '',
    fieldOfStudy: '',
    startYear: '',
    endYear: '',
    grade: '',
    activities: '',
    description: ''
  })

  const [certificationForm, setCertificationForm] = useState({
    name: '',
    issuingOrganization: '',
    issueDate: '',
    expirationDate: '',
    credentialId: '',
    credentialUrl: ''
  })

  // Modal states
  const [alertModal, setAlertModal] = useState({ isOpen: false, title: '', message: '', variant: 'info' })
  const [confirmModal, setConfirmModal] = useState({ 
    isOpen: false, 
    title: '', 
    message: '', 
    variant: 'warning',
    onConfirm: () => {}
  })

  // Fetch user profile dan populate form
  const fetchProfile = async () => {
    if (!userId) {
      setLoading(false)
      return
    }
    try {
      setLoading(true)
      const response = await getUserProfile(userId)
      const user = response.data.user
      setBasicInfo({
        nama: user.nama || '',
        whatsapp: user.whatsapp || '',
        domisili: user.domisili || ''
      })
      if (user.profile) {
        const profile = user.profile
        // Parse JSON fields jika masih string
        const parseJsonField = (field, defaultValue) => {
          if (typeof field === 'string') {
            try {
              return JSON.parse(field)
            } catch {
              return defaultValue
            }
          }
          return field || defaultValue
        }
        setProfileInfo({
          profesi: profile.profesi || '',
          perusahaan: profile.perusahaan || '',
          jabatan: profile.jabatan || '',
          skill: profile.skill || '',
          sosialMedia: parseJsonField(profile.sosialMedia, {
            linkedin: '', instagram: '', twitter: '', github: '', website: ''
          }),
          portfolio: Array.isArray(parseJsonField(profile.portfolio, [])) ? parseJsonField(profile.portfolio, []) : [],
          experience: Array.isArray(parseJsonField(profile.experience, [])) ? parseJsonField(profile.experience, []) : [],
          education: Array.isArray(parseJsonField(profile.education, [])) ? parseJsonField(profile.education, []) : [],
          certifications: Array.isArray(parseJsonField(profile.certifications, [])) ? parseJsonField(profile.certifications, []) : []
        })
        if (profile.fotoProfil) {
          setFotoProfilPreview(getImageUrl(profile.fotoProfil, 'profiles'))
        }
        if (profile.coverPhoto) {
          setCoverPhotoPreview(getImageUrl(profile.coverPhoto, 'profiles'))
        }
      }
    } catch (error) {
      console.error('Error fetching profile:', error)
      setAlertModal({
        isOpen: true,
        title: 'Error',
        message: 'Gagal mengambil data profil: ' + (error.response?.data?.error || error.message),
        variant: 'error'
      })
    } finally {
      setLoading(false)
    }
  }

  // Fetch profile saat component mount atau id berubah
  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login', { replace: true })
      setLoading(false)
      return
    }
    if (!userId) {
      setLoading(false)
      return
    }
    if (userId !== currentUser?.id && currentUser?.role !== 'ADMIN') {
      navigate('/dashboard', { replace: true })
      setLoading(false)
      return
    }
    fetchProfile()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, isAuthenticated, userId, currentUser])

  const handleBasicInfoChange = (e) => {
    const { name, value } = e.target
    setBasicInfo(prev => ({ ...prev, [name]: value }))
  }

  const handleProfileInfoChange = (e) => {
    const { name, value } = e.target
    setProfileInfo(prev => ({ ...prev, [name]: value }))
  }

  const handleSosialMediaChange = (e) => {
    const { name, value } = e.target
    setProfileInfo(prev => ({
      ...prev,
      sosialMedia: {
        ...prev.sosialMedia,
        [name]: value
      }
    }))
  }

  const handleFileSelect = (type, e) => {
    const file = e.target.files[0]
    if (!file) return

    // Validasi tipe file
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif']
    if (!allowedTypes.includes(file.type)) {
      setAlertModal({
        isOpen: true,
        title: 'Format File Tidak Didukung',
        message: 'Hanya file gambar (JPG, PNG, WebP, GIF) yang diperbolehkan.',
        variant: 'warning'
      })
      e.target.value = ''
      return
    }

    // Validasi ukuran file (maks 5MB)
    const maxSize = 5 * 1024 * 1024
    if (file.size > maxSize) {
      setAlertModal({
        isOpen: true,
        title: 'Ukuran File Terlalu Besar',
        message: 'Ukuran file terlalu besar. Maksimal 5MB.',
        variant: 'warning'
      })
      e.target.value = ''
      return
    }

    if (type === 'fotoProfil') {
      setFotoProfilFile(file)
      const reader = new FileReader()
      reader.onloadend = () => {
        setFotoProfilPreview(reader.result)
      }
      reader.readAsDataURL(file)
    } else if (type === 'coverPhoto') {
      setCoverPhotoFile(file)
      const reader = new FileReader()
      reader.onloadend = () => {
        setCoverPhotoPreview(reader.result)
      }
      reader.readAsDataURL(file)
    }
  }

  const handleRemoveImage = (type) => {
    if (type === 'fotoProfil') {
      setFotoProfilFile(null)
      setFotoProfilPreview(null)
    } else if (type === 'coverPhoto') {
      setCoverPhotoFile(null)
      setCoverPhotoPreview(null)
    }
  }

  const handleSaveBasicInfo = async () => {
    try {
      setSaving(true)
      await updateUserBasicInfo(userId, basicInfo)
      // Refresh user data untuk update di header
      if (refreshUser) {
        await refreshUser()
      }
      setAlertModal({
        isOpen: true,
        title: 'Berhasil',
        message: 'Data berhasil diperbarui',
        variant: 'success',
        onButtonClick: () => navigate(`/profil/${userId}`)
      })
    } catch (error) {
      console.error('Error updating basic info:', error)
      setAlertModal({
        isOpen: true,
        title: 'Error',
        message: error.response?.data?.error || 'Gagal memperbarui data',
        variant: 'error'
      })
    } finally {
      setSaving(false)
    }
  }

  const handleSaveProfile = async () => {
    try {
      setSaving(true)
      await updateUserProfile(
        userId,
        profileInfo,
        fotoProfilFile,
        coverPhotoFile
      )
      // Refresh user data untuk update foto profil di header
      if (refreshUser) {
        await refreshUser()
      }
      setAlertModal({
        isOpen: true,
        title: 'Berhasil',
        message: 'Profil berhasil diperbarui',
        variant: 'success',
        onButtonClick: () => navigate(`/profil/${userId}`)
      })
    } catch (error) {
      console.error('Error updating profile:', error)
      setAlertModal({
        isOpen: true,
        title: 'Error',
        message: error.response?.data?.error || 'Gagal memperbarui profil',
        variant: 'error'
      })
    } finally {
      setSaving(false)
    }
  }

  // Portfolio handlers
  const handleAddPortfolio = () => {
    setPortfolioForm({
      title: '',
      description: '',
      image: '',
      technologies: [],
      category: '',
      link: '',
      github: '',
      year: new Date().getFullYear()
    })
    setEditingIndex(null)
    setShowPortfolioModal(true)
  }

  const handleEditPortfolio = (index) => {
    setPortfolioForm(profileInfo.portfolio[index])
    setEditingIndex(index)
    setShowPortfolioModal(true)
  }

  const handleDeletePortfolio = (index) => {
    setConfirmModal({
      isOpen: true,
      title: 'Hapus Portfolio',
      message: 'Apakah Anda yakin ingin menghapus portfolio ini?',
      variant: 'danger',
      onConfirm: () => {
        const newPortfolio = profileInfo.portfolio.filter((_, i) => i !== index)
        setProfileInfo(prev => ({ ...prev, portfolio: newPortfolio }))
      }
    })
  }

  const handleSavePortfolio = () => {
    if (!portfolioForm.title.trim()) {
      setAlertModal({
        isOpen: true,
        title: 'Validasi',
        message: 'Judul portfolio harus diisi',
        variant: 'warning'
      })
      return
    }

    const newPortfolio = [...profileInfo.portfolio]
    if (editingIndex !== null) {
      newPortfolio[editingIndex] = { ...portfolioForm }
    } else {
      newPortfolio.push({ ...portfolioForm, id: Date.now().toString() })
    }
    setProfileInfo(prev => ({ ...prev, portfolio: newPortfolio }))
    setShowPortfolioModal(false)
    setEditingIndex(null)
  }

  // Experience handlers
  const handleAddExperience = () => {
    setExperienceForm({
      company: '',
      position: '',
      location: '',
      startDate: '',
      endDate: '',
      employmentType: 'Full-time',
      description: '',
      skills: []
    })
    setEditingIndex(null)
    setShowExperienceModal(true)
  }

  const handleEditExperience = (index) => {
    setExperienceForm(profileInfo.experience[index])
    setEditingIndex(index)
    setShowExperienceModal(true)
  }

  const handleDeleteExperience = (index) => {
    setConfirmModal({
      isOpen: true,
      title: 'Hapus Pengalaman',
      message: 'Apakah Anda yakin ingin menghapus pengalaman ini?',
      variant: 'danger',
      onConfirm: () => {
        const newExperience = profileInfo.experience.filter((_, i) => i !== index)
        setProfileInfo(prev => ({ ...prev, experience: newExperience }))
      }
    })
  }

  const handleSaveExperience = () => {
    if (!experienceForm.company.trim() || !experienceForm.position.trim()) {
      setAlertModal({
        isOpen: true,
        title: 'Validasi',
        message: 'Perusahaan dan posisi harus diisi',
        variant: 'warning'
      })
      return
    }

    const newExperience = [...profileInfo.experience]
    if (editingIndex !== null) {
      newExperience[editingIndex] = { ...experienceForm }
    } else {
      newExperience.push({ ...experienceForm, id: Date.now().toString() })
    }
    setProfileInfo(prev => ({ ...prev, experience: newExperience }))
    setShowExperienceModal(false)
    setEditingIndex(null)
  }

  // Education handlers
  const handleAddEducation = () => {
    setEducationForm({
      school: '',
      degree: '',
      fieldOfStudy: '',
      startYear: '',
      endYear: '',
      grade: '',
      activities: '',
      description: ''
    })
    setEditingIndex(null)
    setShowEducationModal(true)
  }

  const handleEditEducation = (index) => {
    setEducationForm(profileInfo.education[index])
    setEditingIndex(index)
    setShowEducationModal(true)
  }

  const handleDeleteEducation = (index) => {
    setConfirmModal({
      isOpen: true,
      title: 'Hapus Pendidikan',
      message: 'Apakah Anda yakin ingin menghapus pendidikan ini?',
      variant: 'danger',
      onConfirm: () => {
        const newEducation = profileInfo.education.filter((_, i) => i !== index)
        setProfileInfo(prev => ({ ...prev, education: newEducation }))
      }
    })
  }

  const handleSaveEducation = () => {
    if (!educationForm.school.trim() || !educationForm.degree.trim()) {
      setAlertModal({
        isOpen: true,
        title: 'Validasi',
        message: 'Nama sekolah dan gelar harus diisi',
        variant: 'warning'
      })
      return
    }

    const newEducation = [...profileInfo.education]
    if (editingIndex !== null) {
      newEducation[editingIndex] = { ...educationForm }
    } else {
      newEducation.push({ ...educationForm, id: Date.now().toString() })
    }
    setProfileInfo(prev => ({ ...prev, education: newEducation }))
    setShowEducationModal(false)
    setEditingIndex(null)
  }

  // Certification handlers
  const handleAddCertification = () => {
    setCertificationForm({
      name: '',
      issuingOrganization: '',
      issueDate: '',
      expirationDate: '',
      credentialId: '',
      credentialUrl: ''
    })
    setEditingIndex(null)
    setShowCertificationModal(true)
  }

  const handleEditCertification = (index) => {
    setCertificationForm(profileInfo.certifications[index])
    setEditingIndex(index)
    setShowCertificationModal(true)
  }

  const handleDeleteCertification = (index) => {
    setConfirmModal({
      isOpen: true,
      title: 'Hapus Sertifikasi',
      message: 'Apakah Anda yakin ingin menghapus sertifikasi ini?',
      variant: 'danger',
      onConfirm: () => {
        const newCertifications = profileInfo.certifications.filter((_, i) => i !== index)
        setProfileInfo(prev => ({ ...prev, certifications: newCertifications }))
      }
    })
  }

  const handleSaveCertification = () => {
    if (!certificationForm.name.trim() || !certificationForm.issuingOrganization.trim()) {
      setAlertModal({
        isOpen: true,
        title: 'Validasi',
        message: 'Nama sertifikasi dan organisasi penerbit harus diisi',
        variant: 'warning'
      })
      return
    }

    const newCertifications = [...profileInfo.certifications]
    if (editingIndex !== null) {
      newCertifications[editingIndex] = { ...certificationForm }
    } else {
      newCertifications.push({ ...certificationForm, id: Date.now().toString() })
    }
    setProfileInfo(prev => ({ ...prev, certifications: newCertifications }))
    setShowCertificationModal(false)
    setEditingIndex(null)
  }

  // Handle technologies/skills as comma-separated string
  const handleTechnologiesChange = (e) => {
    const value = e.target.value
    const technologies = value.split(',').map(t => t.trim()).filter(t => t)
    setPortfolioForm(prev => ({ ...prev, technologies }))
  }

  const handleSkillsChange = (e) => {
    const value = e.target.value
    const skills = value.split(',').map(s => s.trim()).filter(s => s)
    setExperienceForm(prev => ({ ...prev, skills }))
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="flex">
          <Sidebar />
          <main className="flex-1 p-6">
            <div className="flex items-center justify-center h-64">
              <div className="text-gray-500">Memuat data...</div>
            </div>
          </main>
        </div>
      </div>
    )
  }

  const tabs = [
    { id: 'basic', label: 'Info Dasar', icon: User },
    { id: 'profile', label: 'Profil', icon: User },
    { id: 'social', label: 'Media Sosial', icon: User },
    { id: 'portfolio', label: 'Portfolio', icon: FileText },
    { id: 'experience', label: 'Pengalaman', icon: Briefcase },
    { id: 'education', label: 'Pendidikan', icon: GraduationCap },
    { id: 'certifications', label: 'Sertifikasi', icon: Award }
  ]

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <div className="flex">
        <Sidebar />
        <main className="flex-1">
          <div className="max-w-4xl mx-auto p-6">
            {/* Header */}
            <div className="mb-6">
              <Button
                variant="outline"
                onClick={() => navigate(`/profil/${userId}`)}
                className="flex items-center gap-2 mb-4"
              >
                <ArrowLeft size={18} />
                Kembali ke Profil
              </Button>
              <div className="flex items-center gap-3">
                <div className="p-3 bg-blue-100 rounded-lg">
                  <User className="text-blue-600" size={24} />
                </div>
                <div>
                  <h1 className="text-3xl font-bold text-gray-900">Edit Profil</h1>
                  <p className="text-gray-600 mt-1">Perbarui informasi profil Anda</p>
                </div>
              </div>
            </div>

            {/* Tabs */}
            <div className="bg-white rounded-lg shadow-sm mb-6">
              <div className="flex border-b border-gray-200 overflow-x-auto">
                {tabs.map((tab) => {
                  const Icon = tab.icon
                  return (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      className={`flex items-center gap-2 px-6 py-3 border-b-2 transition-colors whitespace-nowrap ${
                        activeTab === tab.id
                          ? 'border-blue-600 text-blue-600 font-medium'
                          : 'border-transparent text-gray-600 hover:text-gray-900'
                      }`}
                    >
                      {Icon && <Icon size={18} />}
                      <span>{tab.label}</span>
                    </button>
                  )
                })}
              </div>

              <div className="p-6">
                {/* Tab: Basic Info */}
                {activeTab === 'basic' && (
                  <div className="space-y-6">
                    <div>
                      <h2 className="text-xl font-semibold text-gray-900 mb-4">Informasi Dasar</h2>
                      <div className="space-y-4">
                        <Input
                          label="Nama"
                          value={basicInfo.nama}
                          onChange={(e) => handleBasicInfoChange(e)}
                          name="nama"
                          required
                        />
                        <Input
                          label="WhatsApp"
                          value={basicInfo.whatsapp}
                          onChange={(e) => handleBasicInfoChange(e)}
                          name="whatsapp"
                          placeholder="081234567890"
                        />
                        <Input
                          label="Domisili"
                          value={basicInfo.domisili}
                          onChange={(e) => handleBasicInfoChange(e)}
                          name="domisili"
                          placeholder="Kota, Provinsi"
                        />
                      </div>
                    </div>
                    <div className="flex justify-end">
                      <Button
                        onClick={handleSaveBasicInfo}
                        disabled={saving}
                        className="flex items-center gap-2"
                      >
                        <Save size={18} />
                        {saving ? 'Menyimpan...' : 'Simpan'}
                      </Button>
                    </div>
                  </div>
                )}

                {/* Tab: Profile */}
                {activeTab === 'profile' && (
                  <div className="space-y-6">
                    <div>
                      <h2 className="text-xl font-semibold text-gray-900 mb-4">Informasi Profil</h2>
                      
                      {/* Foto Profil */}
                      <div className="mb-6">
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Foto Profil
                        </label>
                        <div className="flex items-center gap-4">
                          {fotoProfilPreview && (
                            <div className="relative">
                              <img
                                src={fotoProfilPreview}
                                alt="Foto Profil"
                                className="w-24 h-24 rounded-full object-cover border-2 border-gray-200"
                              />
                              <button
                                type="button"
                                onClick={() => handleRemoveImage('fotoProfil')}
                                className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
                              >
                                <X size={14} />
                              </button>
                            </div>
                          )}
                          <label className="cursor-pointer">
                            <div className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2">
                              <ImageIcon size={18} />
                              {fotoProfilPreview ? 'Ganti Foto' : 'Upload Foto'}
                            </div>
                            <input
                              type="file"
                              accept="image/*"
                              onChange={(e) => handleFileSelect('fotoProfil', e)}
                              className="hidden"
                            />
                          </label>
                        </div>
                      </div>

                      {/* Cover Photo */}
                      <div className="mb-6">
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Cover Photo
                        </label>
                        <div className="flex items-center gap-4">
                          {coverPhotoPreview && (
                            <div className="relative">
                              <img
                                src={coverPhotoPreview}
                                alt="Cover Photo"
                                className="w-48 h-24 object-cover rounded-lg border-2 border-gray-200"
                              />
                              <button
                                type="button"
                                onClick={() => handleRemoveImage('coverPhoto')}
                                className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
                              >
                                <X size={14} />
                              </button>
                            </div>
                          )}
                          <label className="cursor-pointer">
                            <div className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2">
                              <ImageIcon size={18} />
                              {coverPhotoPreview ? 'Ganti Cover' : 'Upload Cover'}
                            </div>
                            <input
                              type="file"
                              accept="image/*"
                              onChange={(e) => handleFileSelect('coverPhoto', e)}
                              className="hidden"
                            />
                          </label>
                        </div>
                      </div>

                      <div className="space-y-4">
                        <Input
                          label="Profesi"
                          value={profileInfo.profesi}
                          onChange={(e) => handleProfileInfoChange(e)}
                          name="profesi"
                          placeholder="Software Engineer"
                        />
                        <Input
                          label="Perusahaan"
                          value={profileInfo.perusahaan}
                          onChange={(e) => handleProfileInfoChange(e)}
                          name="perusahaan"
                          placeholder="Nama Perusahaan"
                        />
                        <Input
                          label="Jabatan"
                          value={profileInfo.jabatan}
                          onChange={(e) => handleProfileInfoChange(e)}
                          name="jabatan"
                          placeholder="Senior Developer"
                        />
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Skill/Keahlian
                          </label>
                          <textarea
                            value={profileInfo.skill}
                            onChange={(e) => handleProfileInfoChange(e)}
                            name="skill"
                            rows={3}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            placeholder="JavaScript, React, Node.js, dll"
                          />
                        </div>
                      </div>
                    </div>
                    <div className="flex justify-end">
                      <Button
                        onClick={handleSaveProfile}
                        disabled={saving}
                        className="flex items-center gap-2"
                      >
                        <Save size={18} />
                        {saving ? 'Menyimpan...' : 'Simpan Profil'}
                      </Button>
                    </div>
                  </div>
                )}

                {/* Tab: Social Media */}
                {activeTab === 'social' && (
                  <div className="space-y-6">
                    <div>
                      <h2 className="text-xl font-semibold text-gray-900 mb-4">Media Sosial</h2>
                      <div className="space-y-4">
                        <Input
                          label="LinkedIn"
                          value={profileInfo.sosialMedia.linkedin}
                          onChange={(e) => handleSosialMediaChange(e)}
                          name="linkedin"
                          placeholder="username atau URL"
                        />
                        <Input
                          label="Instagram"
                          value={profileInfo.sosialMedia.instagram}
                          onChange={(e) => handleSosialMediaChange(e)}
                          name="instagram"
                          placeholder="@username"
                        />
                        <Input
                          label="Twitter"
                          value={profileInfo.sosialMedia.twitter}
                          onChange={(e) => handleSosialMediaChange(e)}
                          name="twitter"
                          placeholder="@username"
                        />
                        <Input
                          label="GitHub"
                          value={profileInfo.sosialMedia.github}
                          onChange={(e) => handleSosialMediaChange(e)}
                          name="github"
                          placeholder="username"
                        />
                        <Input
                          label="Website"
                          value={profileInfo.sosialMedia.website}
                          onChange={(e) => handleSosialMediaChange(e)}
                          name="website"
                          placeholder="https://..."
                        />
                      </div>
                    </div>
                    <div className="flex justify-end">
                      <Button
                        onClick={handleSaveProfile}
                        disabled={saving}
                        className="flex items-center gap-2"
                      >
                        <Save size={18} />
                        {saving ? 'Menyimpan...' : 'Simpan'}
                      </Button>
                    </div>
                  </div>
                )}

                {/* Tab: Portfolio */}
                {activeTab === 'portfolio' && (
                  <div className="space-y-6">
                    <div className="flex items-center justify-between mb-4">
                      <h2 className="text-xl font-semibold text-gray-900">Portfolio</h2>
                      <Button
                        onClick={handleAddPortfolio}
                        className="flex items-center gap-2"
                      >
                        <Plus size={18} />
                        Tambah Portfolio
                      </Button>
                    </div>
                    {profileInfo.portfolio.length > 0 ? (
                      <div className="space-y-4">
                        {profileInfo.portfolio.map((item, index) => (
                          <div key={item.id || index} className="border border-gray-200 rounded-lg p-4">
                            <div className="flex items-start justify-between">
                              <div className="flex-1">
                                <h3 className="font-semibold text-gray-900">{item.title}</h3>
                                {item.description && (
                                  <p className="text-gray-600 text-sm mt-1">{item.description}</p>
                                )}
                                {item.technologies && item.technologies.length > 0 && (
                                  <div className="flex flex-wrap gap-2 mt-2">
                                    {item.technologies.map((tech, i) => (
                                      <span key={i} className="px-2 py-1 bg-blue-50 text-blue-700 text-xs rounded">
                                        {tech}
                                      </span>
                                    ))}
                                  </div>
                                )}
                                {item.year && (
                                  <p className="text-xs text-gray-500 mt-2">Tahun: {item.year}</p>
                                )}
                              </div>
                              <div className="flex items-center gap-2 ml-4">
                                <button
                                  onClick={() => handleEditPortfolio(index)}
                                  className="p-2 text-blue-600 hover:bg-blue-50 rounded"
                                >
                                  <Edit2 size={16} />
                                </button>
                                <button
                                  onClick={() => handleDeletePortfolio(index)}
                                  className="p-2 text-red-600 hover:bg-red-50 rounded"
                                >
                                  <Trash2 size={16} />
                                </button>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-gray-500 text-center py-8">Belum ada portfolio. Klik "Tambah Portfolio" untuk menambahkan.</p>
                    )}
                    <div className="flex justify-end">
                      <Button
                        onClick={handleSaveProfile}
                        disabled={saving}
                        className="flex items-center gap-2"
                      >
                        <Save size={18} />
                        {saving ? 'Menyimpan...' : 'Simpan Perubahan'}
                      </Button>
                    </div>
                  </div>
                )}

                {/* Tab: Experience */}
                {activeTab === 'experience' && (
                  <div className="space-y-6">
                    <div className="flex items-center justify-between mb-4">
                      <h2 className="text-xl font-semibold text-gray-900">Pengalaman Kerja</h2>
                      <Button
                        onClick={handleAddExperience}
                        className="flex items-center gap-2"
                      >
                        <Plus size={18} />
                        Tambah Pengalaman
                      </Button>
                    </div>
                    {profileInfo.experience.length > 0 ? (
                      <div className="space-y-4">
                        {profileInfo.experience.map((exp, index) => (
                          <div key={exp.id || index} className="border-l-4 border-blue-600 pl-4 py-2">
                            <div className="flex items-start justify-between">
                              <div className="flex-1">
                                <h3 className="font-semibold text-gray-900">{exp.position}</h3>
                                <p className="text-gray-700">{exp.company}</p>
                                {exp.location && (
                                  <p className="text-sm text-gray-500">{exp.location}</p>
                                )}
                                <p className="text-sm text-gray-500">
                                  {exp.startDate} - {exp.endDate || 'Present'} • {exp.employmentType}
                                </p>
                                {exp.description && (
                                  <p className="text-gray-600 text-sm mt-2">{exp.description}</p>
                                )}
                                {exp.skills && exp.skills.length > 0 && (
                                  <div className="flex flex-wrap gap-2 mt-2">
                                    {exp.skills.map((skill, i) => (
                                      <span key={i} className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded">
                                        {skill}
                                      </span>
                                    ))}
                                  </div>
                                )}
                              </div>
                              <div className="flex items-center gap-2 ml-4">
                                <button
                                  onClick={() => handleEditExperience(index)}
                                  className="p-2 text-blue-600 hover:bg-blue-50 rounded"
                                >
                                  <Edit2 size={16} />
                                </button>
                                <button
                                  onClick={() => handleDeleteExperience(index)}
                                  className="p-2 text-red-600 hover:bg-red-50 rounded"
                                >
                                  <Trash2 size={16} />
                                </button>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-gray-500 text-center py-8">Belum ada pengalaman kerja. Klik "Tambah Pengalaman" untuk menambahkan.</p>
                    )}
                    <div className="flex justify-end">
                      <Button
                        onClick={handleSaveProfile}
                        disabled={saving}
                        className="flex items-center gap-2"
                      >
                        <Save size={18} />
                        {saving ? 'Menyimpan...' : 'Simpan Perubahan'}
                      </Button>
                    </div>
                  </div>
                )}

                {/* Tab: Education */}
                {activeTab === 'education' && (
                  <div className="space-y-6">
                    <div className="flex items-center justify-between mb-4">
                      <h2 className="text-xl font-semibold text-gray-900">Pendidikan</h2>
                      <Button
                        onClick={handleAddEducation}
                        className="flex items-center gap-2"
                      >
                        <Plus size={18} />
                        Tambah Pendidikan
                      </Button>
                    </div>
                    {profileInfo.education.length > 0 ? (
                      <div className="space-y-4">
                        {profileInfo.education.map((edu, index) => (
                          <div key={edu.id || index} className="border-l-4 border-green-600 pl-4 py-2">
                            <div className="flex items-start justify-between">
                              <div className="flex-1">
                                <h3 className="font-semibold text-gray-900">{edu.school}</h3>
                                <p className="text-gray-700">{edu.degree} {edu.fieldOfStudy && `- ${edu.fieldOfStudy}`}</p>
                                <p className="text-sm text-gray-500">
                                  {edu.startYear} - {edu.endYear || 'Present'}
                                </p>
                                {edu.grade && (
                                  <p className="text-sm text-gray-600 mt-1">IPK/GPA: {edu.grade}</p>
                                )}
                                {edu.activities && (
                                  <p className="text-sm text-gray-600 mt-1">Kegiatan: {edu.activities}</p>
                                )}
                                {edu.description && (
                                  <p className="text-gray-600 text-sm mt-2">{edu.description}</p>
                                )}
                              </div>
                              <div className="flex items-center gap-2 ml-4">
                                <button
                                  onClick={() => handleEditEducation(index)}
                                  className="p-2 text-blue-600 hover:bg-blue-50 rounded"
                                >
                                  <Edit2 size={16} />
                                </button>
                                <button
                                  onClick={() => handleDeleteEducation(index)}
                                  className="p-2 text-red-600 hover:bg-red-50 rounded"
                                >
                                  <Trash2 size={16} />
                                </button>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-gray-500 text-center py-8">Belum ada riwayat pendidikan. Klik "Tambah Pendidikan" untuk menambahkan.</p>
                    )}
                    <div className="flex justify-end">
                      <Button
                        onClick={handleSaveProfile}
                        disabled={saving}
                        className="flex items-center gap-2"
                      >
                        <Save size={18} />
                        {saving ? 'Menyimpan...' : 'Simpan Perubahan'}
                      </Button>
                    </div>
                  </div>
                )}

                {/* Tab: Certifications */}
                {activeTab === 'certifications' && (
                  <div className="space-y-6">
                    <div className="flex items-center justify-between mb-4">
                      <h2 className="text-xl font-semibold text-gray-900">Sertifikasi</h2>
                      <Button
                        onClick={handleAddCertification}
                        className="flex items-center gap-2"
                      >
                        <Plus size={18} />
                        Tambah Sertifikasi
                      </Button>
                    </div>
                    {profileInfo.certifications.length > 0 ? (
                      <div className="space-y-4">
                        {profileInfo.certifications.map((cert, index) => (
                          <div key={cert.id || index} className="border border-gray-200 rounded-lg p-4">
                            <div className="flex items-start justify-between">
                              <div className="flex-1">
                                <h3 className="font-semibold text-gray-900">{cert.name}</h3>
                                <p className="text-gray-700">{cert.issuingOrganization}</p>
                                <p className="text-sm text-gray-500">
                                  Diterbitkan: {cert.issueDate}
                                  {cert.expirationDate && ` - Berlaku hingga: ${cert.expirationDate}`}
                                </p>
                                {cert.credentialId && (
                                  <p className="text-sm text-gray-600 mt-1">ID: {cert.credentialId}</p>
                                )}
                                {cert.credentialUrl && (
                                  <a
                                    href={cert.credentialUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-blue-600 hover:underline text-sm mt-2 inline-block"
                                  >
                                    Lihat Sertifikat →
                                  </a>
                                )}
                              </div>
                              <div className="flex items-center gap-2 ml-4">
                                <button
                                  onClick={() => handleEditCertification(index)}
                                  className="p-2 text-blue-600 hover:bg-blue-50 rounded"
                                >
                                  <Edit2 size={16} />
                                </button>
                                <button
                                  onClick={() => handleDeleteCertification(index)}
                                  className="p-2 text-red-600 hover:bg-red-50 rounded"
                                >
                                  <Trash2 size={16} />
                                </button>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-gray-500 text-center py-8">Belum ada sertifikasi. Klik "Tambah Sertifikasi" untuk menambahkan.</p>
                    )}
                    <div className="flex justify-end">
                      <Button
                        onClick={handleSaveProfile}
                        disabled={saving}
                        className="flex items-center gap-2"
                      >
                        <Save size={18} />
                        {saving ? 'Menyimpan...' : 'Simpan Perubahan'}
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </main>
      </div>

      {/* Modal: Portfolio */}
      {showPortfolioModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <h3 className="text-xl font-semibold text-gray-900 mb-4">
              {editingIndex !== null ? 'Edit Portfolio' : 'Tambah Portfolio'}
            </h3>
            <div className="space-y-4">
              <Input
                label="Judul Project"
                value={portfolioForm.title}
                onChange={(e) => setPortfolioForm(prev => ({ ...prev, title: e.target.value }))}
                required
              />
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Deskripsi</label>
                <textarea
                  value={portfolioForm.description}
                  onChange={(e) => setPortfolioForm(prev => ({ ...prev, description: e.target.value }))}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <Input
                label="URL Gambar"
                value={portfolioForm.image}
                onChange={(e) => setPortfolioForm(prev => ({ ...prev, image: e.target.value }))}
                placeholder="https://..."
              />
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Technologies (pisahkan dengan koma)</label>
                <Input
                  value={portfolioForm.technologies.join(', ')}
                  onChange={handleTechnologiesChange}
                  placeholder="React, Node.js, MongoDB"
                />
              </div>
              <Input
                label="Kategori"
                value={portfolioForm.category}
                onChange={(e) => setPortfolioForm(prev => ({ ...prev, category: e.target.value }))}
                placeholder="Web Development"
              />
              <Input
                label="Link Project"
                value={portfolioForm.link}
                onChange={(e) => setPortfolioForm(prev => ({ ...prev, link: e.target.value }))}
                placeholder="https://..."
              />
              <Input
                label="GitHub"
                value={portfolioForm.github}
                onChange={(e) => setPortfolioForm(prev => ({ ...prev, github: e.target.value }))}
                placeholder="https://github.com/..."
              />
              <Input
                label="Tahun"
                type="number"
                value={portfolioForm.year}
                onChange={(e) => setPortfolioForm(prev => ({ ...prev, year: parseInt(e.target.value) || new Date().getFullYear() }))}
              />
            </div>
            <div className="flex justify-end gap-3 mt-6">
              <Button
                variant="outline"
                onClick={() => {
                  setShowPortfolioModal(false)
                  setEditingIndex(null)
                }}
              >
                Batal
              </Button>
              <Button onClick={handleSavePortfolio}>
                Simpan
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Experience */}
      {showExperienceModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <h3 className="text-xl font-semibold text-gray-900 mb-4">
              {editingIndex !== null ? 'Edit Pengalaman' : 'Tambah Pengalaman'}
            </h3>
            <div className="space-y-4">
              <Input
                label="Perusahaan"
                value={experienceForm.company}
                onChange={(e) => setExperienceForm(prev => ({ ...prev, company: e.target.value }))}
                required
              />
              <Input
                label="Posisi/Jabatan"
                value={experienceForm.position}
                onChange={(e) => setExperienceForm(prev => ({ ...prev, position: e.target.value }))}
                required
              />
              <Input
                label="Lokasi"
                value={experienceForm.location}
                onChange={(e) => setExperienceForm(prev => ({ ...prev, location: e.target.value }))}
                placeholder="Kota, Negara"
              />
              <div className="grid grid-cols-2 gap-4">
                <Input
                  label="Tanggal Mulai"
                  type="month"
                  value={experienceForm.startDate}
                  onChange={(e) => setExperienceForm(prev => ({ ...prev, startDate: e.target.value }))}
                />
                <Input
                  label="Tanggal Selesai"
                  type="month"
                  value={experienceForm.endDate}
                  onChange={(e) => setExperienceForm(prev => ({ ...prev, endDate: e.target.value }))}
                  placeholder="Kosongkan jika masih bekerja"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Tipe Pekerjaan</label>
                <select
                  value={experienceForm.employmentType}
                  onChange={(e) => setExperienceForm(prev => ({ ...prev, employmentType: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="Full-time">Full-time</option>
                  <option value="Part-time">Part-time</option>
                  <option value="Contract">Contract</option>
                  <option value="Internship">Internship</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Deskripsi</label>
                <textarea
                  value={experienceForm.description}
                  onChange={(e) => setExperienceForm(prev => ({ ...prev, description: e.target.value }))}
                  rows={4}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Skills (pisahkan dengan koma)</label>
                <Input
                  value={experienceForm.skills.join(', ')}
                  onChange={handleSkillsChange}
                  placeholder="JavaScript, React, Node.js"
                />
              </div>
            </div>
            <div className="flex justify-end gap-3 mt-6">
              <Button
                variant="outline"
                onClick={() => {
                  setShowExperienceModal(false)
                  setEditingIndex(null)
                }}
              >
                Batal
              </Button>
              <Button onClick={handleSaveExperience}>
                Simpan
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Education */}
      {showEducationModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <h3 className="text-xl font-semibold text-gray-900 mb-4">
              {editingIndex !== null ? 'Edit Pendidikan' : 'Tambah Pendidikan'}
            </h3>
            <div className="space-y-4">
              <Input
                label="Nama Sekolah/Universitas"
                value={educationForm.school}
                onChange={(e) => setEducationForm(prev => ({ ...prev, school: e.target.value }))}
                required
              />
              <Input
                label="Gelar"
                value={educationForm.degree}
                onChange={(e) => setEducationForm(prev => ({ ...prev, degree: e.target.value }))}
                placeholder="S1, S2, dll"
                required
              />
              <Input
                label="Bidang Studi"
                value={educationForm.fieldOfStudy}
                onChange={(e) => setEducationForm(prev => ({ ...prev, fieldOfStudy: e.target.value }))}
                placeholder="Teknik Informatika"
              />
              <div className="grid grid-cols-2 gap-4">
                <Input
                  label="Tahun Mulai"
                  type="number"
                  value={educationForm.startYear}
                  onChange={(e) => setEducationForm(prev => ({ ...prev, startYear: parseInt(e.target.value) || '' }))}
                />
                <Input
                  label="Tahun Selesai"
                  type="number"
                  value={educationForm.endYear}
                  onChange={(e) => setEducationForm(prev => ({ ...prev, endYear: parseInt(e.target.value) || '' }))}
                  placeholder="Kosongkan jika masih kuliah"
                />
              </div>
              <Input
                label="IPK/GPA"
                value={educationForm.grade}
                onChange={(e) => setEducationForm(prev => ({ ...prev, grade: e.target.value }))}
                placeholder="3.85"
              />
              <Input
                label="Kegiatan"
                value={educationForm.activities}
                onChange={(e) => setEducationForm(prev => ({ ...prev, activities: e.target.value }))}
                placeholder="Organisasi, dll"
              />
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Deskripsi</label>
                <textarea
                  value={educationForm.description}
                  onChange={(e) => setEducationForm(prev => ({ ...prev, description: e.target.value }))}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>
            <div className="flex justify-end gap-3 mt-6">
              <Button
                variant="outline"
                onClick={() => {
                  setShowEducationModal(false)
                  setEditingIndex(null)
                }}
              >
                Batal
              </Button>
              <Button onClick={handleSaveEducation}>
                Simpan
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Certification */}
      {showCertificationModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <h3 className="text-xl font-semibold text-gray-900 mb-4">
              {editingIndex !== null ? 'Edit Sertifikasi' : 'Tambah Sertifikasi'}
            </h3>
            <div className="space-y-4">
              <Input
                label="Nama Sertifikasi"
                value={certificationForm.name}
                onChange={(e) => setCertificationForm(prev => ({ ...prev, name: e.target.value }))}
                required
              />
              <Input
                label="Organisasi Penerbit"
                value={certificationForm.issuingOrganization}
                onChange={(e) => setCertificationForm(prev => ({ ...prev, issuingOrganization: e.target.value }))}
                required
              />
              <div className="grid grid-cols-2 gap-4">
                <Input
                  label="Tanggal Diterbitkan"
                  type="month"
                  value={certificationForm.issueDate}
                  onChange={(e) => setCertificationForm(prev => ({ ...prev, issueDate: e.target.value }))}
                />
                <Input
                  label="Tanggal Berakhir"
                  type="month"
                  value={certificationForm.expirationDate}
                  onChange={(e) => setCertificationForm(prev => ({ ...prev, expirationDate: e.target.value }))}
                  placeholder="Kosongkan jika tidak ada"
                />
              </div>
              <Input
                label="Credential ID"
                value={certificationForm.credentialId}
                onChange={(e) => setCertificationForm(prev => ({ ...prev, credentialId: e.target.value }))}
                placeholder="ID-12345"
              />
              <Input
                label="Credential URL"
                value={certificationForm.credentialUrl}
                onChange={(e) => setCertificationForm(prev => ({ ...prev, credentialUrl: e.target.value }))}
                placeholder="https://..."
              />
            </div>
            <div className="flex justify-end gap-3 mt-6">
              <Button
                variant="outline"
                onClick={() => {
                  setShowCertificationModal(false)
                  setEditingIndex(null)
                }}
              >
                Batal
              </Button>
              <Button onClick={handleSaveCertification}>
                Simpan
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Alert Modal */}
      <AlertModal
        isOpen={alertModal.isOpen}
        onClose={() => setAlertModal({ ...alertModal, isOpen: false })}
        title={alertModal.title}
        message={alertModal.message}
        variant={alertModal.variant}
        onButtonClick={alertModal.onButtonClick}
      />

      {/* Confirm Modal */}
      <ConfirmModal
        isOpen={confirmModal.isOpen}
        onClose={() => setConfirmModal({ ...confirmModal, isOpen: false })}
        onConfirm={confirmModal.onConfirm}
        title={confirmModal.title}
        message={confirmModal.message}
        variant={confirmModal.variant}
      />
    </div>
  )
}

export default EditProfile

