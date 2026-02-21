import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import Header from '../components/layout/Header'
import Sidebar from '../components/layout/Sidebar'
import { getUserProfile, getConnectionStatus, acceptConnection, rejectConnection, getPosts } from '../services/api'
import { getImageUrl } from '../utils/imageUtils'
import { Edit, User, Briefcase, Award, GraduationCap, FileText, Globe, MapPin, Mail, Phone, Calendar, UserPlus, MessageCircle, Check, Clock, X, Newspaper } from 'lucide-react'
import Button from '../components/common/Button'
import ConnectModal from '../components/connection/ConnectModal'
import PostCard from '../components/post/PostCard'

const Profile = () => {
  const { id } = useParams()
  const { user: currentUser, isAuthenticated } = useAuth()
  const navigate = useNavigate()
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('about')
  const [isOwnProfile, setIsOwnProfile] = useState(false)
  const [showConnectModal, setShowConnectModal] = useState(false)
  const [connectionStatus, setConnectionStatus] = useState(null)
  const [connectionInfo, setConnectionInfo] = useState(null)
  const [loadingConnection, setLoadingConnection] = useState(false)
  const [processingConnection, setProcessingConnection] = useState(false)
  const [userPosts, setUserPosts] = useState([])
  const [loadingPosts, setLoadingPosts] = useState(false)
  const [postsPagination, setPostsPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0
  })

  // Fetch user profile saat component mount atau id berubah
  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login', { replace: true })
      return
    }
    const userId = id || currentUser?.id
    setIsOwnProfile(userId === currentUser?.id)
    fetchUserProfile(userId)
    
    // Fetch connection status jika bukan own profile
    if (userId !== currentUser?.id) {
      fetchConnectionStatus(userId)
    }
  }, [id, currentUser, isAuthenticated, navigate])

  // Fetch connection status
  const fetchConnectionStatus = async (userId) => {
    try {
      setLoadingConnection(true)
      const response = await getConnectionStatus(userId)
      setConnectionStatus(response.data.status)
      setConnectionInfo(response.data.connection)
    } catch (error) {
      console.error('Error fetching connection status:', error)
      setConnectionStatus(null)
      setConnectionInfo(null)
    } finally {
      setLoadingConnection(false)
    }
  }

  // Handle connection success
  const handleConnectionSuccess = () => {
    // Refresh connection status
    if (user?.id) {
      fetchConnectionStatus(user.id)
    }
  }

  // Handle accept connection
  const handleAcceptConnection = async () => {
    if (!connectionInfo?.id) return
    
    try {
      setProcessingConnection(true)
      await acceptConnection(connectionInfo.id)
      // Refresh connection status
      if (user?.id) {
        await fetchConnectionStatus(user.id)
      }
    } catch (error) {
      alert(error.response?.data?.error || 'Gagal menerima request koneksi')
    } finally {
      setProcessingConnection(false)
    }
  }

  // Handle reject connection
  const handleRejectConnection = async () => {
    if (!connectionInfo?.id) return
    
    if (!window.confirm('Apakah Anda yakin ingin menolak request koneksi ini?')) {
      return
    }

    try {
      setProcessingConnection(true)
      await rejectConnection(connectionInfo.id)
      // Refresh connection status
      if (user?.id) {
        await fetchConnectionStatus(user.id)
      }
    } catch (error) {
      alert(error.response?.data?.error || 'Gagal menolak request koneksi')
    } finally {
      setProcessingConnection(false)
    }
  }

  // Fetch user profile dari API
  const fetchUserProfile = async (userId) => {
    try {
      setLoading(true)
      const response = await getUserProfile(userId)
      setUser(response.data.user)
    } catch (error) {
      console.error('Error fetching profile:', error)
      if (error.response?.status === 404) {
        setUser({ ...currentUser, profile: null })
      }
    } finally {
      setLoading(false)
    }
  }

  // Fetch user posts
  const fetchUserPosts = async (userId, page = 1) => {
    try {
      setLoadingPosts(true)
      const limit = postsPagination.limit || 10
      const response = await getPosts({ userId, page, limit })
      if (page === 1) {
        setUserPosts(response.data.posts || [])
      } else {
        setUserPosts(prev => [...prev, ...(response.data.posts || [])])
      }
      setPostsPagination(prev => ({
        ...prev,
        page: response.data.pagination.page,
        total: response.data.pagination.total,
        totalPages: response.data.pagination.totalPages
      }))
    } catch (error) {
      console.error('Error fetching user posts:', error)
    } finally {
      setLoadingPosts(false)
    }
  }

  // Fetch posts saat tab postingan aktif atau user berubah
  useEffect(() => {
    if (activeTab === 'posts' && user?.id) {
      fetchUserPosts(user.id, 1)
    }
  }, [activeTab, user?.id])

  const handleEditProfile = () => {
    navigate(`/profil/${user?.id || currentUser?.id}/edit`)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="flex">
          <Sidebar />
          <main className="flex-1 p-6">
            <div className="flex items-center justify-center h-64">
              <div className="text-gray-500">Memuat profil...</div>
            </div>
          </main>
        </div>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="flex">
          <Sidebar />
          <main className="flex-1 p-6">
            <div className="text-center py-12">
              <p className="text-gray-500">Profil tidak ditemukan</p>
            </div>
          </main>
        </div>
      </div>
    )
  }

  // Extract profile data
  const profile = user.profile || {}
  const fotoProfil = profile.fotoProfil || null
  const coverPhoto = profile.coverPhoto || null

  // Filter tabs - hanya tampilkan yang ada datanya (kecuali About dan Posts yang selalu tampil)
  const allTabs = [
    { id: 'about', label: 'Tentang', icon: User, alwaysShow: true },
    { id: 'posts', label: 'Postingan', icon: Newspaper, alwaysShow: true },
    { 
      id: 'portfolio', 
      label: 'Portfolio', 
      icon: FileText, 
      hasData: profile.portfolio && Array.isArray(profile.portfolio) && profile.portfolio.length > 0 
    },
    { 
      id: 'experience', 
      label: 'Pengalaman', 
      icon: Briefcase, 
      hasData: profile.experience && Array.isArray(profile.experience) && profile.experience.length > 0 
    },
    { 
      id: 'education', 
      label: 'Pendidikan', 
      icon: GraduationCap, 
      hasData: profile.education && Array.isArray(profile.education) && profile.education.length > 0 
    },
    { 
      id: 'certifications', 
      label: 'Sertifikasi', 
      icon: Award, 
      hasData: profile.certifications && Array.isArray(profile.certifications) && profile.certifications.length > 0 
    }
  ]

  const tabs = allTabs.filter(tab => tab.alwaysShow || tab.hasData)

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <div className="flex">
        <Sidebar />
        <main className="flex-1">
          {/* Cover Photo & Profile Header */}
          <div className="bg-white">
            {/* Cover Photo */}
            <div className="relative h-80 bg-gradient-to-br from-blue-600 via-blue-500 to-indigo-600">
              {coverPhoto ? (
                <img
                  src={getImageUrl(coverPhoto, 'profiles')}
                  alt="Cover"
                  className="w-full h-full object-cover"
                  onError={(e) => { e.target.style.display = 'none' }}
                />
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-blue-600 via-blue-500 to-indigo-600"></div>
              )}
              {isOwnProfile && (
                <button
                  onClick={handleEditProfile}
                  className="absolute top-6 right-6 px-5 py-2.5 bg-white/90 backdrop-blur-sm text-gray-700 rounded-xl hover:bg-white transition-all flex items-center gap-2 shadow-sm font-medium"
                >
                  <Edit size={18} />
                  Edit Profil
                </button>
              )}
            </div>
            
            {/* Profile Info Section */}
            <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="relative -mt-24 pb-8">
                <div className="flex flex-col sm:flex-row items-start gap-6">
                  {/* Profile Picture */}
                  <div className="relative flex-shrink-0">
                    <div className="w-40 h-40 sm:w-44 sm:h-44">
                      {fotoProfil ? (
                        <img
                          src={getImageUrl(fotoProfil, 'profiles')}
                          alt={user.nama}
                          className="w-full h-full rounded-2xl border-4 border-white object-cover shadow-sm"
                          onError={(e) => { e.target.style.display = 'none' }}
                        />
                      ) : (
                        <div className="w-full h-full rounded-2xl border-4 border-white bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center text-white text-4xl sm:text-5xl font-bold shadow-sm">
                          {user.nama?.charAt(0) || 'U'}
                        </div>
                      )}
                    </div>
                  </div>
                  
                  {/* User Info */}
                  <div className="flex-1 w-full">
                    <div className="bg-white rounded-2xl shadow-sm p-6 sm:p-8 border border-gray-100">
                      <div className="space-y-3">
                        <div>
                          <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-2">{user.nama}</h1>
                          {profile.profesi && (
                            <p className="text-lg sm:text-xl text-gray-700 font-medium">{profile.profesi}</p>
                          )}
                          {profile.perusahaan && profile.jabatan && (
                            <p className="text-base text-gray-600 mt-1">
                              {profile.jabatan} di <span className="font-semibold">{profile.perusahaan}</span>
                            </p>
                          )}
                        </div>
                        
                        <div className="flex flex-wrap items-center gap-4 pt-2 border-t border-gray-100">
                          {user.domisili && (
                            <div className="flex items-center gap-2 text-gray-600">
                              <MapPin size={16} className="text-gray-400" />
                              <span className="text-sm font-medium">{user.domisili}</span>
                            </div>
                          )}
                          {user.angkatan && (
                            <div className="flex items-center gap-2 text-gray-600">
                              <Calendar size={16} className="text-gray-400" />
                              <span className="text-sm font-medium">Angkatan {user.angkatan}</span>
                            </div>
                          )}
                          {user.prodi && (
                            <div className="flex items-center gap-2 text-gray-600">
                              <GraduationCap size={16} className="text-gray-400" />
                              <span className="text-sm font-medium">{user.prodi}</span>
                            </div>
                          )}
                        </div>

                        {/* Action buttons untuk non-own profile */}
                        {!isOwnProfile && (
                          <div className="flex items-center gap-3 pt-3 border-t border-gray-100">
                            {connectionStatus === null && (
                              <Button
                                variant="primary"
                                className="flex items-center gap-2 rounded-xl"
                                onClick={() => setShowConnectModal(true)}
                                disabled={loadingConnection}
                              >
                                <UserPlus size={18} />
                                Koneksikan
                              </Button>
                            )}
                            {connectionStatus === 'PENDING' && connectionInfo?.isRequester && (
                              <div className="flex items-center gap-2 px-4 py-2 bg-yellow-50 text-yellow-700 rounded-xl border border-yellow-200">
                                <Clock size={18} />
                                <span className="text-sm font-medium">Request Dikirim</span>
                              </div>
                            )}
                            {connectionStatus === 'PENDING' && !connectionInfo?.isRequester && (
                              <div className="flex items-center gap-2">
                                <Button
                                  variant="primary"
                                  size="sm"
                                  onClick={handleAcceptConnection}
                                  disabled={processingConnection}
                                  className="flex items-center gap-2 rounded-xl"
                                >
                                  <Check size={18} />
                                  {processingConnection ? 'Memproses...' : 'Terima'}
                                </Button>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={handleRejectConnection}
                                  disabled={processingConnection}
                                  className="flex items-center gap-2 rounded-xl text-red-600 border-red-200 hover:bg-red-50 hover:border-red-300"
                                >
                                  <X size={18} />
                                  Tolak
                                </Button>
                              </div>
                            )}
                            {connectionStatus === 'ACCEPTED' && (
                              <div className="flex items-center gap-2 px-4 py-2 bg-green-50 text-green-700 rounded-xl border border-green-200">
                                <Check size={18} />
                                <span className="text-sm font-medium">Terkoneksi</span>
                              </div>
                            )}
                            {connectionStatus === 'REJECTED' && (
                              <Button
                                variant="outline"
                                className="flex items-center gap-2 rounded-xl"
                                onClick={() => setShowConnectModal(true)}
                                disabled={loadingConnection}
                              >
                                <UserPlus size={18} />
                                Koneksikan Lagi
                              </Button>
                            )}
                            <Button
                              variant="outline"
                              className="flex items-center gap-2 rounded-xl"
                              onClick={() => navigate(`/chat/${user.id}`, {
                                state: {
                                  userInfo: {
                                    id: user.id,
                                    nama: user.nama,
                                    email: user.email,
                                    fotoProfil: user.profile?.fotoProfil || null
                                  }
                                }
                              })}
                            >
                              <MessageCircle size={18} />
                              Kirim Pesan
                            </Button>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Tabs */}
          <div className="bg-white border-b border-gray-200 sticky top-0 z-20 shadow-sm">
            <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="flex space-x-1 overflow-x-auto scrollbar-hide">
                {tabs.map((tab) => {
                  const Icon = tab.icon
                  return (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      className={`flex items-center gap-2 px-5 py-4 border-b-3 transition-all whitespace-nowrap font-medium ${
                        activeTab === tab.id
                          ? 'border-blue-600 text-blue-600 bg-blue-50/50'
                          : 'border-transparent text-gray-600 hover:text-blue-600 hover:bg-gray-50'
                      }`}
                    >
                      <Icon size={18} />
                      <span>{tab.label}</span>
                    </button>
                  )
                })}
              </div>
            </div>
          </div>

          {/* Tab Content */}
          <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            {activeTab === 'about' && (
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 sm:p-8 space-y-8">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900 mb-6">Informasi Pribadi</h2>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="flex items-start gap-4 p-4 rounded-xl bg-gray-50 hover:bg-gray-100 transition-colors">
                      <div className="p-2 bg-blue-100 rounded-lg">
                        <Mail className="text-blue-600" size={20} />
                      </div>
                      <div className="flex-1">
                        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Email</p>
                        <p className="text-gray-900 font-medium">{user.email}</p>
                      </div>
                    </div>
                    
                    {user.nim && (
                      <div className="flex items-start gap-4 p-4 rounded-xl bg-gray-50 hover:bg-gray-100 transition-colors">
                        <div className="p-2 bg-indigo-100 rounded-lg">
                          <User className="text-indigo-600" size={20} />
                        </div>
                        <div className="flex-1">
                          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">NIM</p>
                          <p className="text-gray-900 font-medium">{user.nim}</p>
                        </div>
                      </div>
                    )}
                    
                    {user.whatsapp && (
                      <div className="flex items-start gap-4 p-4 rounded-xl bg-gray-50 hover:bg-gray-100 transition-colors">
                        <div className="p-2 bg-green-100 rounded-lg">
                          <Phone className="text-green-600" size={20} />
                        </div>
                        <div className="flex-1">
                          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">WhatsApp</p>
                          <p className="text-gray-900 font-medium">{user.whatsapp}</p>
                        </div>
                      </div>
                    )}
                    
                    {user.prodi && (
                      <div className="flex items-start gap-4 p-4 rounded-xl bg-gray-50 hover:bg-gray-100 transition-colors">
                        <div className="p-2 bg-purple-100 rounded-lg">
                          <GraduationCap className="text-purple-600" size={20} />
                        </div>
                        <div className="flex-1">
                          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Program Studi</p>
                          <p className="text-gray-900 font-medium">{user.prodi}</p>
                        </div>
                      </div>
                    )}
                    
                    {user.angkatan && (
                      <div className="flex items-start gap-4 p-4 rounded-xl bg-gray-50 hover:bg-gray-100 transition-colors">
                        <div className="p-2 bg-orange-100 rounded-lg">
                          <Calendar className="text-orange-600" size={20} />
                        </div>
                        <div className="flex-1">
                          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Angkatan</p>
                          <p className="text-gray-900 font-medium">{user.angkatan}</p>
                        </div>
                      </div>
                    )}
                    
                    {user.domisili && (
                      <div className="flex items-start gap-4 p-4 rounded-xl bg-gray-50 hover:bg-gray-100 transition-colors">
                        <div className="p-2 bg-red-100 rounded-lg">
                          <MapPin className="text-red-600" size={20} />
                        </div>
                        <div className="flex-1">
                          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Domisili</p>
                          <p className="text-gray-900 font-medium">{user.domisili}</p>
                        </div>
                      </div>
                    )}
                </div>

                  </div>
                  
                  {profile.skill && (
                    <div className="md:col-span-2 pt-4 border-t border-gray-200">
                      <h3 className="text-lg font-semibold text-gray-900 mb-3">Keahlian</h3>
                      <div className="bg-gray-50 rounded-xl p-5">
                        <p className="text-gray-700 whitespace-pre-wrap leading-relaxed">{profile.skill}</p>
                      </div>
                    </div>
                  )}

                  {profile.sosialMedia && Object.keys(profile.sosialMedia).some(key => profile.sosialMedia[key]) && (
                    <div className="md:col-span-2 pt-4 border-t border-gray-200">
                      <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                        <Globe size={22} className="text-blue-600" />
                        Media Sosial
                      </h3>
                      <div className="flex flex-wrap gap-3">
                      {profile.sosialMedia.linkedin && (
                        <a
                          href={profile.sosialMedia.linkedin.startsWith('http') ? profile.sosialMedia.linkedin : `https://linkedin.com/in/${profile.sosialMedia.linkedin}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="px-3 py-1.5 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors text-sm font-medium"
                        >
                          LinkedIn
                        </a>
                      )}
                      {profile.sosialMedia.github && (
                        <a
                          href={profile.sosialMedia.github.startsWith('http') ? profile.sosialMedia.github : `https://github.com/${profile.sosialMedia.github}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="px-3 py-1.5 bg-gray-50 text-gray-700 rounded-lg hover:bg-gray-100 transition-colors text-sm font-medium"
                        >
                          GitHub
                        </a>
                      )}
                      {profile.sosialMedia.instagram && (
                        <a
                          href={profile.sosialMedia.instagram.startsWith('http') ? profile.sosialMedia.instagram : `https://instagram.com/${profile.sosialMedia.instagram}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="px-3 py-1.5 bg-pink-50 text-pink-600 rounded-lg hover:bg-pink-100 transition-colors text-sm font-medium"
                        >
                          Instagram
                        </a>
                      )}
                      {profile.sosialMedia.twitter && (
                        <a
                          href={profile.sosialMedia.twitter.startsWith('http') ? profile.sosialMedia.twitter : `https://twitter.com/${profile.sosialMedia.twitter}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="px-3 py-1.5 bg-sky-50 text-sky-600 rounded-lg hover:bg-sky-100 transition-colors text-sm font-medium"
                        >
                          Twitter
                        </a>
                      )}
                      {profile.sosialMedia.website && (
                        <a
                          href={profile.sosialMedia.website.startsWith('http') ? profile.sosialMedia.website : `https://${profile.sosialMedia.website}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="px-3 py-1.5 bg-green-50 text-green-600 rounded-lg hover:bg-green-100 transition-colors text-sm font-medium"
                        >
                          Website
                        </a>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'portfolio' && (
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 sm:p-8">
                <h2 className="text-2xl font-bold text-gray-900 mb-6">Portfolio</h2>
                {profile.portfolio && Array.isArray(profile.portfolio) && profile.portfolio.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {profile.portfolio.map((item, index) => (
                      <div key={index} className="border border-gray-200 rounded-xl p-5 hover:shadow-sm transition-all bg-white group">
                        {item.image && (
                          <img
                            src={item.image}
                            alt={item.title}
                            className="w-full h-48 object-cover rounded-lg mb-4 group-hover:scale-105 transition-transform"
                          />
                        )}
                        <h3 className="font-bold text-lg text-gray-900 mb-2">{item.title}</h3>
                        {item.description && (
                          <p className="text-gray-600 text-sm mb-4 line-clamp-3">{item.description}</p>
                        )}
                        {item.technologies && item.technologies.length > 0 && (
                          <div className="flex flex-wrap gap-2 mb-4">
                            {item.technologies.map((tech, i) => (
                              <span key={i} className="px-3 py-1 bg-blue-50 text-blue-700 text-xs font-medium rounded-full">
                                {tech}
                              </span>
                            ))}
                          </div>
                        )}
                        {item.link && (
                          <a
                            href={item.link}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-600 hover:text-blue-700 font-medium text-sm inline-flex items-center gap-1"
                          >
                            Lihat Project →
                          </a>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <FileText className="mx-auto text-gray-300 mb-4" size={48} />
                    <p className="text-gray-500">Belum ada portfolio</p>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'experience' && (
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 sm:p-8">
                <h2 className="text-2xl font-bold text-gray-900 mb-6">Pengalaman Kerja</h2>
                {profile.experience && Array.isArray(profile.experience) && profile.experience.length > 0 ? (
                  <div className="space-y-6">
                    {profile.experience.map((exp, index) => (
                      <div key={index} className="relative pl-8 pb-6 border-l-2 border-blue-500 last:border-l-0 last:pb-0">
                        <div className="absolute -left-2 top-0 w-4 h-4 bg-blue-500 rounded-full border-2 border-white"></div>
                        <div className="bg-gray-50 rounded-xl p-5 hover:bg-gray-100 transition-colors">
                          <h3 className="font-bold text-lg text-gray-900 mb-1">{exp.position}</h3>
                          <p className="text-gray-700 font-medium mb-2">{exp.company}</p>
                          <p className="text-sm text-gray-500 mb-3 flex items-center gap-2">
                            <Calendar size={14} />
                            {exp.startDate} - {exp.endDate || 'Sekarang'}
                          </p>
                          {exp.description && (
                            <p className="text-gray-600 text-sm leading-relaxed">{exp.description}</p>
                          )}
                          {exp.skills && exp.skills.length > 0 && (
                            <div className="flex flex-wrap gap-2 mt-3">
                              {exp.skills.map((skill, i) => (
                                <span key={i} className="px-2 py-1 bg-blue-50 text-blue-700 text-xs rounded">
                                  {skill}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <Briefcase className="mx-auto text-gray-300 mb-4" size={48} />
                    <p className="text-gray-500">Belum ada pengalaman kerja</p>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'education' && (
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 sm:p-8">
                <h2 className="text-2xl font-bold text-gray-900 mb-6">Pendidikan</h2>
                {profile.education && Array.isArray(profile.education) && profile.education.length > 0 ? (
                  <div className="space-y-6">
                    {profile.education.map((edu, index) => (
                      <div key={index} className="relative pl-8 pb-6 border-l-2 border-green-500 last:border-l-0 last:pb-0">
                        <div className="absolute -left-2 top-0 w-4 h-4 bg-green-500 rounded-full border-2 border-white"></div>
                        <div className="bg-gray-50 rounded-xl p-5 hover:bg-gray-100 transition-colors">
                          <h3 className="font-bold text-lg text-gray-900 mb-1">{edu.school}</h3>
                          <p className="text-gray-700 font-medium mb-2">{edu.degree} - {edu.fieldOfStudy}</p>
                          <p className="text-sm text-gray-500 mb-2 flex items-center gap-2">
                            <Calendar size={14} />
                            {edu.startYear} - {edu.endYear || 'Sekarang'}
                          </p>
                          {edu.grade && (
                            <p className="text-sm text-gray-600 font-medium">IPK/GPA: <span className="text-green-600">{edu.grade}</span></p>
                          )}
                          {edu.description && (
                            <p className="text-gray-600 text-sm mt-3 leading-relaxed">{edu.description}</p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <GraduationCap className="mx-auto text-gray-300 mb-4" size={48} />
                    <p className="text-gray-500">Belum ada riwayat pendidikan</p>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'certifications' && (
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 sm:p-8">
                <h2 className="text-2xl font-bold text-gray-900 mb-6">Sertifikasi</h2>
                {profile.certifications && Array.isArray(profile.certifications) && profile.certifications.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {profile.certifications.map((cert, index) => (
                      <div key={index} className="border border-gray-200 rounded-xl p-5 hover:shadow-lg transition-all bg-white">
                        <div className="flex items-start gap-3 mb-3">
                          <div className="p-2 bg-yellow-100 rounded-lg">
                            <Award className="text-yellow-600" size={24} />
                          </div>
                          <div className="flex-1">
                            <h3 className="font-bold text-lg text-gray-900 mb-1">{cert.name}</h3>
                            <p className="text-gray-700 font-medium text-sm">{cert.issuingOrganization}</p>
                          </div>
                        </div>
                        <p className="text-sm text-gray-500 mb-3">
                          Diterbitkan: {cert.issueDate}
                          {cert.expirationDate && (
                            <span className="block mt-1">Berlaku hingga: {cert.expirationDate}</span>
                          )}
                        </p>
                        {cert.credentialUrl && (
                          <a
                            href={cert.credentialUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-600 hover:text-blue-700 font-medium text-sm inline-flex items-center gap-1"
                          >
                            Lihat Sertifikat →
                          </a>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <Award className="mx-auto text-gray-300 mb-4" size={48} />
                    <p className="text-gray-500">Belum ada sertifikasi</p>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'posts' && (
              <div>
                {loadingPosts && userPosts.length === 0 ? (
                  <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-12 text-center">
                    <div className="text-gray-500">Memuat postingan...</div>
                  </div>
                ) : userPosts.length === 0 ? (
                  <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-12 text-center">
                    <Newspaper className="mx-auto text-gray-300 mb-4" size={48} />
                    <p className="text-gray-500">Belum ada postingan</p>
                  </div>
                ) : (
                  <>
                    <div className="space-y-4">
                      {userPosts.map((post) => (
                        <PostCard
                          key={post.id}
                          post={post}
                          onPostDeleted={(postId) => {
                            setUserPosts(prev => prev.filter(p => p.id !== postId))
                          }}
                          onPostUpdated={() => {
                            if (user?.id) {
                              fetchUserPosts(user.id, 1)
                            }
                          }}
                        />
                      ))}
                    </div>
                    
                    {/* Pagination */}
                    {postsPagination.totalPages > 1 && (
                      <div className="mt-6 flex justify-center">
                        <Button
                          variant="outline"
                          onClick={() => {
                            if (user?.id && postsPagination.page < postsPagination.totalPages) {
                              fetchUserPosts(user.id, postsPagination.page + 1)
                            }
                          }}
                          disabled={loadingPosts || postsPagination.page >= postsPagination.totalPages}
                          className="rounded-lg"
                        >
                          {loadingPosts ? 'Memuat...' : 'Muat Lebih Banyak'}
                        </Button>
                      </div>
                    )}
                  </>
                )}
              </div>
            )}

          </div>
        </main>
      </div>

      {/* Connect Modal */}
      {!isOwnProfile && user && (
        <ConnectModal
          isOpen={showConnectModal}
          onClose={() => setShowConnectModal(false)}
          targetUser={user}
          onSuccess={handleConnectionSuccess}
        />
      )}
    </div>
  )
}

export default Profile

