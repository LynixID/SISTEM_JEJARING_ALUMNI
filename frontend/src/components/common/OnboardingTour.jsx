import { useState, useEffect, useRef } from 'react'
import { X, ChevronLeft, ChevronRight, Compass } from 'lucide-react'

const OnboardingTour = ({ isOpen, onClose, type = 'dashboard' }) => {
  const [currentStep, setCurrentStep] = useState(0)
  const [activeRect, setActiveRect] = useState(null)
  const [popupStyle, setPopupStyle] = useState({ opacity: 0 })
  const [isMobile, setIsMobile] = useState(window.innerWidth < 1024)
  const popupRef = useRef(null)

  // Reset to step 0 when reopened
  useEffect(() => {
    if (isOpen) {
      setCurrentStep(0)
    }
  }, [isOpen])

  const dashboardSteps = [
    {
      title: "Selamat Datang di UII Connect! 👋",
      content: "Selamat datang di platform jejaring resmi Anggota IKA UII JATENG. Silakan ikuti panduan singkat ini untuk mempermudah navigasi fitur utama pada dashboard Anda.",
      selector: null,
      position: "center",
      isSidebar: false
    },
    {
      title: "Kolom Pencarian Global 🔍",
      content: "Gunakan kolom pencarian ini untuk menemukan profil alumni, publikasi berita, topik diskusi, atau informasi lowongan pekerjaan secara instan.",
      selector: "#tour-search",
      position: "bottom",
      isSidebar: false
    },
    {
      title: "Bagikan Informasi & Publikasi ✍️",
      content: "Melalui kolom ini, Anda dapat membagikan pemikiran, mempublikasikan info kegiatan alumni, serta mengunggah foto dokumentasi untuk berinteraksi dengan seluruh jaringan.",
      selector: "#tour-create-post",
      position: "bottom",
      isSidebar: false
    },
    {
      title: "Halaman Beranda Utama 🏠",
      content: "Akses cepat untuk kembali ke halaman feed utama untuk membaca postingan terbaru rekan alumni dan memantau pembaruan terkini.",
      selector: "#tour-sidebar-beranda",
      position: "right",
      isSidebar: true
    },
    {
      title: "Siaran Berita & Pengumuman 📰",
      content: "Akses resmi untuk mendapatkan informasi pengumuman penting, rilis berita terbaru, serta agenda event yang diselenggarakan oleh pengurus alumni.",
      selector: "#tour-sidebar-berita",
      position: "right",
      isSidebar: true
    },
    {
      title: "Pesan Chat Pribadi 💬",
      content: "Layanan komunikasi pesan instan (real-time chat) untuk berinteraksi langsung secara personal dengan rekan alumni lainnya.",
      selector: "#tour-sidebar-pesan",
      position: "right",
      isSidebar: true
    },
    {
      title: "Jejaring Koneksi Alumni 🤝",
      content: "Menu untuk mengelola jaringan relasi Anda, mengajukan pertemanan baru, serta merespons permintaan koneksi masuk.",
      selector: "#tour-sidebar-koneksi",
      position: "right",
      isSidebar: true
    },
    {
      title: "Direktori Alumni Terdaftar 👥",
      content: "Telusuri database alumni UII berdasarkan filter program studi, tahun angkatan, maupun instansi tempat bekerja untuk mempermudah pencarian relasi.",
      selector: "#tour-sidebar-direktori",
      position: "right",
      isSidebar: true
    },
    {
      title: "Forum Diskusi Publik 🗣️",
      content: "Ruang diskusi interaktif berkelompok untuk saling bertukar gagasan berdasarkan topik minat atau bidang keahlian tertentu.",
      selector: "#tour-sidebar-forum-diskusi",
      position: "right",
      isSidebar: true
    },
    {
      title: "Bursa Kerja & Lowongan 💼",
      content: "Portal bursa kerja (job board) untuk mengeksplorasi lowongan karir terbaru atau membagikan info lowongan dari instansi Anda kepada alumni lain.",
      selector: "#tour-sidebar-lowongan",
      position: "right",
      isSidebar: true
    },
    {
      title: "Pemberitahuan & Notifikasi 🔔",
      content: "Pusat notifikasi real-time untuk melihat interaksi suka (like), tanggapan komentar pada postingan Anda, maupun undangan koneksi baru.",
      selector: "#tour-notifications",
      position: "bottom",
      isSidebar: false
    },
    {
      title: "Kelola Profil & Pengaturan Akun 👤",
      content: "Akses menu dropdown untuk memperbarui portofolio diri, konfigurasi keamanan akun, keluar dari sistem, atau memulai ulang tur panduan ini.",
      selector: "#tour-profile",
      position: "bottom",
      isSidebar: false
    }
  ]

  const profileSteps = [
    {
      title: "Tur Panduan Profil Anda 👤",
      content: "Selamat datang di ruang profil personal Anda. Halaman ini berfungsi sebagai portofolio digital untuk menampilkan keahlian, karir, dan riwayat pendidikan Anda kepada jejaring alumni.",
      selector: null,
      position: "center",
      isSidebar: false
    },
    {
      title: "Informasi Identitas Profil 📛",
      content: "Menyajikan data identitas utama Anda seperti foto profil, foto sampul, nama lengkap, program studi, angkatan kelulusan, dan status domisili.",
      selector: "#tour-profile-header",
      position: "bottom",
      isSidebar: false
    },
    {
      title: "Perbarui Data Diri (Edit Profil) ✏️",
      content: "Gunakan tombol ini untuk memperbarui informasi biodata, menautkan media sosial, menuliskan keahlian, serta mengunggah riwayat karir dan pendidikan Anda secara berkala.",
      selector: "#tour-profile-edit",
      position: "bottom",
      isSidebar: false
    },
    {
      title: "Tab Kategori Profil 📑",
      content: "Gunakan navigasi tab ini untuk memisahkan informasi portofolio Anda secara terstruktur (Tentang, rekam postingan, portofolio karya, pengalaman kerja, hingga sertifikasi).",
      selector: "#tour-profile-tabs",
      position: "bottom",
      isSidebar: false
    },
    {
      title: "Area Rincian Informasi 📝",
      content: "Area penayangan rincian informasi berdasarkan tab aktif. Lengkapilah bagian ini agar profil profesional Anda tampak kredibel bagi rekan alumni.",
      selector: "#tour-profile-details",
      position: "bottom",
      isSidebar: false
    }
  ]

  const beritaSteps = [
    {
      title: "Tur Panduan Berita & Pengumuman 📰",
      content: "Selamat datang di pusat informasi resmi UII Connect. Di sini Anda dapat memantau berbagai agenda kegiatan, pengumuman penting, dan kabar berita terkini dari jaringan Anggota IKA UII Jateng.",
      selector: null,
      position: "center",
      isSidebar: false
    },
    {
      title: "Navigasi Kategori Pengumuman & Event 📑",
      content: "Gunakan navigasi tab ini untuk memfilter tayangan informasi secara spesifik. Tab 'Pengumuman' berisi maklumat resmi organisasi, sedangkan tab 'Event' memuat agenda kegiatan kemitraan alumni.",
      selector: "#tour-berita-tabs",
      position: "bottom",
      isSidebar: false
    },
    {
      title: "Pencarian Berita Efisien 🔍",
      content: "Gunakan kolom pencarian ini untuk menemukan berita, pengumuman, atau event tertentu secara cepat dengan mengetikkan kata kunci yang relevan.",
      selector: "#tour-berita-search",
      position: "bottom",
      isSidebar: false
    },
    {
      title: "Tanda Informasi Belum Dibaca 🔵",
      content: "Kartu pengumuman atau event yang memiliki tanda lingkaran biru di sudut kanan atas dan bayangan biru tebal menandakan bahwa informasi tersebut baru dan belum pernah Anda baca.",
      selector: "#tour-berita-list",
      position: "top",
      isSidebar: false
    },
    {
      title: "Detail Berita & Agenda Event 📄",
      content: "Klik langsung pada kartu pengumuman atau kartu event untuk membaca isi lengkap informasi, meninjau waktu pelaksanaan event, jumlah pembaca, serta detail penting lainnya.",
      selector: "#tour-berita-list",
      position: "top",
      isSidebar: false
    }
  ]

  const pesanSteps = [
    {
      title: "Tur Panduan Layanan Pesan 💬",
      content: "Selamat datang di fitur pesan instan UII Connect. Halaman ini memfasilitasi komunikasi secara pribadi, aman, dan langsung (real-time) dengan seluruh jaringan Anggota IKA UII Jateng.",
      selector: null,
      position: "center",
      isSidebar: false
    },
    {
      title: "Daftar Percakapan Aktif 👥",
      content: "Di sini Anda dapat melihat seluruh daftar percakapan aktif Anda. Setiap baris menampilkan nama alumni, pesan terakhir, waktu kirim, serta indikator jumlah pesan masuk yang belum dibaca.",
      selector: "#tour-chat-list-threads",
      position: "right",
      isSidebar: false
    },
    {
      title: "Mulai Obrolan Baru ➕",
      content: "Klik tombol 'Mulai Pesan' ini untuk membuka pencarian pengguna. Anda dapat mengetikkan nama alumni yang terdaftar untuk menginisiasi obrolan baru dengan mereka.",
      selector: "#tour-chat-start-btn",
      position: "right",
      isSidebar: false
    },
    {
      title: "Jendela Percakapan Utama ✉️",
      content: "Saat percakapan dipilih, jendela ini menampilkan riwayat pesan secara berurutan. Anda dapat melihat status peran partner bicara Anda di samping namanya melalui lencana profil.",
      selector: "#tour-chat-window-header",
      position: "left",
      isSidebar: false
    },
    {
      title: "Input Teks & Berbagi Gambar 📷",
      content: "Gunakan kolom teks di bagian bawah untuk menulis pesan. Anda juga dapat melampirkan file gambar lewat tombol ikon kamera, membalas pesan spesifik, dan mengirimkannya secara cepat dengan menekan Enter.",
      selector: "#tour-chat-input-area",
      position: "top",
      isSidebar: false
    }
  ]

  const connectionsSteps = [
    {
      title: "Jaringan Relasi & Koneksi Alumni 🤝",
      content: "Selamat datang di pusat manajemen jejaring relasi Anda. Halaman ini membantu Anda mengelola permohonan koneksi masuk dan menelusuri jaringan pertemanan profesional Anggota IKA UII Jateng.",
      selector: null,
      position: "center",
      isSidebar: false
    },
    {
      title: "Tab Navigasi Manajemen Koneksi 📑",
      content: "Gunakan tab ini untuk berpindah antara menu 'Permintaan Koneksi' (melihat permintaan masuk) dan menu 'Koneksi Saya' (melihat daftar relasi yang telah terhubung).",
      selector: "#tour-connections-tabs",
      position: "bottom",
      isSidebar: false
    },
    {
      title: "Mengelola Permintaan Koneksi Masuk 📨",
      content: "Di tab ini, Anda dapat merespons permintaan pertemanan dari alumni lain. Tekan tombol 'Terima' untuk berteman dan mulai terhubung, atau 'Tolak' jika Anda tidak mengenalnya.",
      selector: "#tour-connections-requests-content",
      position: "top",
      isSidebar: false
    },
    {
      title: "Daftar Koneksi Terhubung 👥",
      content: "Menampilkan daftar seluruh alumni yang telah menjadi koneksi Anda. Anda dapat langsung berkirim pesan chat dengan menekan tombol pesan atau melihat profil lengkap mereka.",
      selector: "#tour-connections-list-content",
      position: "top",
      isSidebar: false
    },
    {
      title: "Toolbar Pencarian & Mode Tampilan 🔍",
      content: "Gunakan kolom ini untuk menyaring nama koneksi Anda secara instan. Anda juga dapat mengubah jenis tata letak daftar teman antara mode Grid (kotak) atau List (baris).",
      selector: "#tour-connections-toolbar",
      position: "bottom",
      isSidebar: false
    }
  ]

  const direktoriSteps = [
    {
      title: "Direktori Alumni Resmi UII 👥",
      content: "Selamat datang di database interaktif alumni. Gunakan direktori ini untuk mencari rekan seangkatan, memperluas kemitraan bisnis, atau menelusuri keahlian spesifik Anggota IKA UII Jateng.",
      selector: null,
      position: "center",
      isSidebar: false
    },
    {
      title: "Kolom Pencarian Cepat 🔍",
      content: "Ketik nama lengkap, nomor induk mahasiswa (NIM), atau kata kunci profesi alumni pada kolom pencarian ini untuk menemukan profil yang dituju secara instan.",
      selector: "#tour-directory-search-input",
      position: "bottom",
      isSidebar: false
    },
    {
      title: "Filter Kategori Spesifik 🎛️",
      content: "Gunakan opsi dropdown untuk menyaring hasil pencarian berdasarkan Angkatan kelulusan, kota Domisili, Program Studi di UII, maupun spesifikasi Profesi kerja alumni.",
      selector: "#tour-directory-filters",
      position: "bottom",
      isSidebar: false
    },
    {
      title: "Reset Filter & Mode Tampilan 🔄",
      content: "Gunakan tombol 'Reset' untuk mengosongkan seluruh filter pencarian. Di sebelah kanan, Anda dapat memilih kenyamanan tampilan direktori dalam mode Grid kartu atau List mendatar.",
      selector: "#tour-directory-reset-view",
      position: "bottom",
      isSidebar: false
    },
    {
      title: "Hasil Penelusuran Direktori 🗂️",
      content: "Area ini menampilkan hasil pencarian. Setiap kartu menyajikan ringkasan nama, status lencana, profesi, domisili, prodi, dan angkatan. Klik tombol 'Lihat Profil' untuk meninjau portofolio lengkap mereka.",
      selector: "#tour-directory-grid",
      position: "top",
      isSidebar: false
    }
  ]

  const discussionsSteps = [
    {
      title: "Forum Diskusi Publik & Kelompok 🗣️",
      content: "Selamat datang di forum diskusi publik. Fitur ini dirancang sebagai ruang kolaboratif Anggota IKA UII Jateng untuk bertukar gagasan, berdiskusi seputar dunia kerja, maupun membahas topik minat khusus.",
      selector: null,
      position: "center",
      isSidebar: false
    },
    {
      title: "Inisiasi Topik Diskusi Baru ✍️",
      content: "Klik tombol 'Buat Diskusi' untuk memprakarsai topik obrolan baru. Anda dapat mengunggah gambar sampul diskusi, menulis judul, menjabarkan deskripsi, serta menentukan tingkat visibilitas diskusi.",
      selector: "#tour-discussions-create-btn",
      position: "bottom",
      isSidebar: false
    },
    {
      title: "Pencarian Topik Diskusi 🔍",
      content: "Gunakan kolom ini untuk menyaring judul-judul diskusi yang sudah ada. Ketikkan kata kunci topik yang menarik minat Anda untuk segera bergabung.",
      selector: "#tour-discussions-search",
      position: "bottom",
      isSidebar: false
    },
    {
      title: "Daftar Thread Diskusi Aktif 🗂️",
      content: "Bagian ini menampilkan daftar thread diskusi yang tersedia. Setiap kartu memperlihatkan lencana visibilitas (Publik/Privat), status akses (Terbuka/Dikunci), serta jumlah anggota yang bergabung.",
      selector: "#tour-discussions-list",
      position: "top",
      isSidebar: false
    },
    {
      title: "Aktivitas & Keterlibatan Anggota 💬",
      content: "Anda dapat memantau intensitas diskusi melalui jumlah pesan terkirim. Klik tombol 'Buka' untuk bergabung sebagai anggota, membaca riwayat obrolan forum, serta mengirimkan tanggapan Anda.",
      selector: "#tour-discussions-list",
      position: "top",
      isSidebar: false
    }
  ]

  const jobsSteps = [
    {
      title: "Portal Bursa Kerja & Karir 💼",
      content: "Selamat datang di bursa kerja Anggota IKA UII Jateng. Portal ini menghubungkan Anda dengan beragam lowongan pekerjaan, penawaran karir, serta peluang kemitraan karir antar alumni.",
      selector: null,
      position: "center",
      isSidebar: false
    },
    {
      title: "Buat & Bagikan Loker Baru ✍️",
      content: "Miliki info lowongan kerja di instansi Anda? Klik tombol 'Buat Lowongan' untuk membagikannya. Isi data kualifikasi, deskripsi pekerjaan, kontak pengaju, tautan apply, dan gambar poster.",
      selector: "#tour-jobs-create-btn",
      position: "bottom",
      isSidebar: false
    },
    {
      title: "Status Persetujuan & Draft Loker 📑",
      content: "Beralihlah antar tab ini untuk membedakan loker aktif ('Lowongan') dengan pengajuan loker pribadi Anda yang masih menunggu tahap verifikasi oleh pihak pengurus ('Menunggu Persetujuan').",
      selector: "#tour-jobs-tabs",
      position: "bottom",
      isSidebar: false
    },
    {
      title: "Pencarian Lowongan Kerja 🔍",
      content: "Ketik kata kunci nama posisi, spesifikasi keahlian, atau nama instansi perusahaan pada kolom pencarian ini untuk menemukan lowongan yang sesuai dengan kriteria karir Anda.",
      selector: "#tour-jobs-search-input",
      position: "bottom",
      isSidebar: false
    },
    {
      title: "Daftar Lowongan Tersedia 🗂️",
      content: "Tinjau daftar kartu lowongan kerja di sini. Setiap kartu menampilkan info tipe pekerjaan (Full-time, Part-time, Contract), kisaran gaji, kontak instansi, serta nama pengaju lowongan.",
      selector: "#tour-jobs-card",
      position: "top",
      isSidebar: false
    },
    {
      title: "Detail Lowongan & Pengajuan Lamaran 📄",
      content: "Klik tombol 'Detail' untuk membaca deskripsi pekerjaan secara menyeluruh, atau klik tombol 'Apply' untuk langsung membuka halaman pengajuan lamaran eksternal resmi perusahaan.",
      selector: "#tour-jobs-card",
      position: "top",
      isSidebar: false
    }
  ]

  const editProfileSteps = [
    {
      title: "Tur Panduan Edit Profil ✏️",
      content: "Selamat datang di menu edit profil. Di sini Anda dapat melengkapi informasi dasar, profil profesional, media sosial, serta riwayat portofolio dan karir Anda agar profil Anda tampak kredibel bagi rekan Anggota IKA UII Jateng.",
      selector: null,
      position: "center",
      isSidebar: false
    },
    {
      title: "Navigasi Tab Kategori Pengaturan 📑",
      content: "Gunakan menu sidebar ini untuk berpindah kategori informasi. Anda dapat melengkapi data pribadi, portofolio karya, pengalaman kerja, pendidikan, hingga sertifikasi secara terpisah.",
      selector: "#tour-edit-profile-tabs",
      position: "right",
      isSidebar: false
    },
    {
      title: "Area Formulir Pengisian Data ✍️",
      content: "Lengkapi kolom input data pada formulir ini sesuai tab menu yang aktif. Pastikan data yang dimasukkan valid agar portofolio Anda kredibel.",
      selector: "#tour-edit-profile-form",
      position: "top",
      isSidebar: false
    },
    {
      title: "Unggah Foto Profil & Sampul 📷",
      content: "Gunakan area ini untuk mengunggah foto profil formal Anda dan foto sampul profil. Anda juga dapat mengganti atau menghapus foto yang sudah ada.",
      selector: "#tour-edit-profile-media",
      position: "top",
      isSidebar: false
    },
    {
      title: "Simpan Hasil Perubahan 💾",
      content: "Setelah selesai melengkapi atau mengubah informasi pada tab aktif, tekan tombol 'Simpan' ini untuk memperbarui data ke sistem.",
      selector: "#tour-edit-profile-save",
      position: "top",
      isSidebar: false
    }
  ]

  const steps = type === 'profile' ? profileSteps :
                type === 'berita' ? beritaSteps :
                type === 'pesan' ? pesanSteps :
                type === 'koneksi' ? connectionsSteps :
                type === 'direktori' ? direktoriSteps :
                type === 'diskusi' ? discussionsSteps :
                type === 'lowongan' ? jobsSteps :
                type === 'edit-profile' ? editProfileSteps :
                dashboardSteps

  // Dispatch event on step changes for pages to handle dynamic interactions
  useEffect(() => {
    if (isOpen && steps && steps[currentStep]) {
      window.dispatchEvent(new CustomEvent('tourStepChange', {
        detail: {
          step: currentStep,
          selector: steps[currentStep].selector
        }
      }))
    }
  }, [currentStep, isOpen])

  // Track responsive screen size
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 1024)
    }
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  // Update target bounding client rect
  const updateRect = () => {
    const step = steps[currentStep]
    if (!step || !step.selector) {
      setActiveRect(null)
      return
    }

    const element = document.querySelector(step.selector)
    if (element) {
      const rect = element.getBoundingClientRect()
      // If width or height is 0 (element hidden), set rect to null (fallback to modal center)
      if (rect.width === 0 || rect.height === 0) {
        setActiveRect(null)
      } else {
        setActiveRect({
          left: rect.left,
          top: rect.top,
          width: rect.width,
          height: rect.height
        })
      }
    } else {
      setActiveRect(null)
    }
  }

  // Scroll to element & manage mobile menu open/close
  useEffect(() => {
    if (!isOpen) return

    const step = steps[currentStep]
    
    // Auto handle sidebar drawer on mobile devices (only for dashboard tour)
    if (isMobile && type === 'dashboard') {
      if (step && step.isSidebar) {
        window.dispatchEvent(new Event('openMobileMenu'))
      } else {
        window.dispatchEvent(new Event('closeMobileMenu'))
      }
    }

    // Scroll target element into viewport after a brief delay for layout transitions
    // On profile tour or desktop, scroll instantly (50ms) to ensure instant alignment and prevent popover positioning lag
    const scrollDelay = (isMobile && type === 'dashboard') ? 350 : 50
    const scrollTimer = setTimeout(() => {
      if (step && step.selector) {
        const element = document.querySelector(step.selector)
        if (element) {
          const isHeaderElement = step.selector === '#tour-search' || 
                                  step.selector === '#tour-notifications' || 
                                  step.selector === '#tour-profile'
          if (!isHeaderElement) {
            const isTopAlign = step.selector === '#tour-profile-tabs' || 
                               step.selector === '#tour-profile-details' ||
                               step.selector === '#tour-berita-list' ||
                               step.selector === '#tour-connections-requests-content' ||
                               step.selector === '#tour-connections-list-content' ||
                               step.selector === '#tour-directory-grid' ||
                               step.selector === '#tour-discussions-list' ||
                               step.selector === '#tour-jobs-card' ||
                               step.selector === '#tour-edit-profile-form' ||
                               step.selector === '#tour-edit-profile-media'
            
            if (isTopAlign) {
              const headerHeight = 64 // Height of sticky header
              const rect = element.getBoundingClientRect()
              const scrollTop = window.pageYOffset || document.documentElement.scrollTop
              const targetY = rect.top + scrollTop - headerHeight - 12
              window.scrollTo({
                top: targetY,
                behavior: 'smooth'
              })
            } else {
              element.scrollIntoView({ 
                behavior: 'smooth', 
                block: 'center' 
              })
            }
          }
        }
      }
    }, scrollDelay)

    // Real-time position tracking loop to handle scrolling and sliding animations
    let startTime = Date.now()
    let animationFrameId

    const measureRect = () => {
      const element = step?.selector ? document.querySelector(step.selector) : null
      if (element) {
        const rect = element.getBoundingClientRect()
        if (rect.width === 0 || rect.height === 0) {
          setActiveRect(null)
        } else {
          setActiveRect({
            left: rect.left,
            top: rect.top,
            width: rect.width,
            height: rect.height
          })
        }
      } else {
        setActiveRect(null)
      }
    }

    const track = () => {
      measureRect()
      const elapsed = Date.now() - startTime
      if (elapsed < 1500) { // Keep tracking for 1.5s to cover transitions
        animationFrameId = requestAnimationFrame(track)
      }
    }

    // Start tracking loop
    animationFrameId = requestAnimationFrame(track)

    // Fallbacks for window actions
    const handleEvents = () => {
      measureRect()
    }
    window.addEventListener('resize', handleEvents)
    window.addEventListener('scroll', handleEvents, true)

    return () => {
      clearTimeout(scrollTimer)
      cancelAnimationFrame(animationFrameId)
      window.removeEventListener('resize', handleEvents)
      window.removeEventListener('scroll', handleEvents, true)
    }
  }, [currentStep, isOpen, isMobile])

  // Calculate Popover Position relative to active rect
  const calculatePosition = () => {
    if (!isOpen) return

    const step = steps[currentStep]
    if (!step) return

    const viewportWidth = window.innerWidth
    const viewportHeight = window.innerHeight
    const isNarrowScreen = viewportWidth < 768

    // Center fallback (Welcome card or element not visible/found)
    if (!activeRect) {
      setPopupStyle({
        position: 'fixed',
        left: '50%',
        top: '50%',
        transform: 'translate(-50%, -50%)',
        width: isNarrowScreen ? 'calc(100% - 32px)' : '480px',
        maxWidth: isNarrowScreen ? '360px' : '480px',
        height: 'auto',
        opacity: 1,
        zIndex: 99999
      })
      return
    }

    if (!popupRef.current) return

    const popupRect = popupRef.current.getBoundingClientRect()
    const popupWidth = isNarrowScreen ? Math.min(viewportWidth - 32, 360) : 480
    const popupHeight = popupRect.height || 180

    let position = step.position || 'bottom'

    // On narrow screens (mobile/tablet), map horizontal positions to vertical to avoid overlapping
    if (isNarrowScreen && step.selector === '#tour-edit-profile-media') {
      position = 'bottom'
    } else if (isNarrowScreen && (position === 'left' || position === 'right')) {
      const isTargetInTopHalf = activeRect.top + activeRect.height / 2 < viewportHeight / 2
      position = isTargetInTopHalf ? 'bottom' : 'top'
    }

    let top = 0
    let left = 0

    if (position === 'bottom') {
      top = activeRect.top + activeRect.height + 12
      left = activeRect.left + (activeRect.width / 2) - (popupWidth / 2)
    } else if (position === 'top') {
      top = activeRect.top - popupHeight - 12
      left = activeRect.left + (activeRect.width / 2) - (popupWidth / 2)
    } else if (position === 'right') {
      top = activeRect.top + (activeRect.height / 2) - (popupHeight / 2)
      left = activeRect.left + activeRect.width + 12
    } else if (position === 'left') {
      top = activeRect.top + (activeRect.height / 2) - (popupHeight / 2)
      left = activeRect.left - popupWidth - 12
    }

    // Boundary constraints: keep popover on-screen
    if (left < 16) left = 16
    if (left + popupWidth > viewportWidth - 16) {
      left = viewportWidth - popupWidth - 16
    }
    if (top < 16) top = 16
    if (top + popupHeight > viewportHeight - 16) {
      top = viewportHeight - popupHeight - 16
    }

    setPopupStyle({
      position: 'fixed',
      top: `${top}px`,
      left: `${left}px`,
      width: `${popupWidth}px`,
      height: 'auto',
      opacity: 1,
      transform: 'none',
      transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
      zIndex: 99999
    })
  }

  // Recalculate popup position when rect or step updates
  useEffect(() => {
    calculatePosition()
  }, [activeRect, currentStep, isOpen, isMobile])

  // Handle tour completion / skip
  const handleFinish = () => {
    window.dispatchEvent(new Event('closeMobileMenu'))
    setCurrentStep(0)
    onClose()
  }

  // Handle step navigation
  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(prev => prev + 1)
    } else {
      handleFinish()
    }
  }

  const handlePrev = () => {
    if (currentStep > 0) {
      setCurrentStep(prev => prev - 1)
    }
  }

  if (!isOpen) return null

  const step = steps[currentStep]

  return (
    <div className="fixed inset-0 z-[9999] overflow-hidden">
      {/* Click blocker for elements under the overlay */}
      <div className="fixed inset-0 z-[9997] bg-transparent pointer-events-auto" />

      {/* SVG Spotlight Overlay */}
      <svg className="fixed inset-0 w-full h-full pointer-events-none z-[9998] transition-all duration-300">
        <defs>
          <mask id="tour-mask-cutout">
            <rect x="0" y="0" width="100%" height="100%" fill="white" />
            {activeRect && (
              <rect
                x={activeRect.left - 8}
                y={activeRect.top - 8}
                width={activeRect.width + 16}
                height={activeRect.height + 16}
                rx="12"
                ry="12"
                fill="black"
                className="transition-all duration-300"
              />
            )}
          </mask>
        </defs>
        <rect
          x="0"
          y="0"
          width="100%"
          height="100%"
          fill="rgba(15, 23, 42, 0.72)"
          mask="url(#tour-mask-cutout)"
          className="pointer-events-auto"
          style={{ cursor: 'default' }}
        />
      </svg>

      {/* Pulsing halo around highlighted target */}
      {activeRect && (
        <div
          className="fixed pointer-events-none z-[9999] rounded-xl border-[2.5px] border-blue-500 animate-pulse transition-all duration-200"
          style={{
            left: activeRect.left - 8,
            top: activeRect.top - 8,
            width: activeRect.width + 16,
            height: activeRect.height + 16,
            boxShadow: '0 0 0 8px rgba(59, 130, 246, 0.2)'
          }}
        />
      )}

      {/* Onboarding Dialog Card */}
      <div
        ref={popupRef}
        style={{ ...popupStyle, fontFamily: "'Outfit', sans-serif" }}
        className="z-[99999] bg-white border border-slate-100 shadow-[0_15px_40px_rgba(15,23,42,0.12)] rounded-2xl p-6 w-full max-w-[360px] sm:max-w-[480px] pointer-events-auto flex flex-col gap-4 animate-in fade-in-50 zoom-in-95 duration-200"
      >
        {/* Card Header */}
        <div className="flex justify-between items-start gap-4">
          <div className="flex items-center gap-2.5">
            {currentStep === 0 && (
              <div className="w-9 h-9 rounded-xl bg-blue-50/70 flex items-center justify-center text-blue-600 shrink-0">
                <Compass size={18} className="animate-spin duration-10000" />
              </div>
            )}
            <h3 className="font-semibold text-slate-800 text-lg sm:text-xl leading-snug tracking-tight">
              {step.title}
            </h3>
          </div>
          <button
            onClick={handleFinish}
            className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-50 transition-colors shrink-0"
            title="Lewati Tur"
          >
            <X size={16} />
          </button>
        </div>

        {/* Card Body */}
        <div className="text-slate-600 text-sm sm:text-base leading-relaxed font-normal">
          {step.content}
        </div>

        {/* Card Footer */}
        <div className="flex flex-col gap-4 mt-1 pt-4 border-t border-slate-100">
          {/* Step Dots Indicator Row */}
          <div className="flex justify-center w-full">
            <div className="flex gap-1.5 flex-wrap justify-center">
              {steps.map((_, idx) => (
                <button
                  key={idx}
                  onClick={() => setCurrentStep(idx)}
                  className={`h-2 rounded-full transition-all duration-300 ${
                    idx === currentStep ? 'w-5 bg-blue-600' : 'w-2 bg-slate-200 hover:bg-slate-300'
                  }`}
                  title={`Langkah ${idx + 1}`}
                />
              ))}
            </div>
          </div>

          {/* Navigation Buttons Row */}
          <div className="flex items-center justify-between w-full">
            {/* Left side: Lewati / Skip button (shown on all steps except the last one) */}
            {currentStep < steps.length - 1 ? (
              <button
                onClick={handleFinish}
                className="px-4 py-2 text-slate-500 hover:text-slate-700 hover:bg-slate-50 rounded-xl text-xs sm:text-sm font-semibold transition-colors duration-200"
              >
                Lewati
              </button>
            ) : (
              <div /> // Spacer to keep right buttons aligned
            )}

            {/* Right side: Kembali & Lanjut/Selesai */}
            <div className="flex items-center gap-2">
              {currentStep > 0 && (
                <button
                  onClick={handlePrev}
                  className="flex items-center gap-1.5 px-4 py-2 border border-slate-200 text-slate-600 hover:bg-slate-50 rounded-xl text-xs sm:text-sm font-semibold transition-all duration-200"
                >
                  <ChevronLeft size={14} />
                  Kembali
                </button>
              )}

              <button
                onClick={handleNext}
                className="flex items-center gap-1.5 px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs sm:text-sm font-semibold shadow-sm hover:shadow transition duration-200"
              >
                {currentStep === steps.length - 1 ? (
                  'Selesai'
                ) : (
                  <>
                    Lanjut
                    <ChevronRight size={14} />
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default OnboardingTour
