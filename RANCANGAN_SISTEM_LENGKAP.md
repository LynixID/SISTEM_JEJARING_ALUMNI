# 📋 RANCANGAN SISTEM LENGKAP
## Sistem Informasi Jejaring Sosial Alumni DPW IKA UII Jawa Tengah

**Proyek Tugas Akhir**  
**Mahasiswa:** Ilham Gading Pangestu (233307012)  
**Program Studi:** D3 Teknologi Informasi, Politeknik Negeri Madiun  
**Metode Pengembangan:** Agile (Scrum)

---

## 📑 DAFTAR ISI

1. [Overview Sistem](#overview-sistem)
2. [Arsitektur Sistem](#arsitektur-sistem)
3. [Teknologi Pengembangan](#teknologi-pengembangan)
4. [Detail Fitur Lengkap](#detail-fitur-lengkap)
5. [Flow Sistem](#flow-sistem)
6. [Flow User](#flow-user)
7. [Database Schema](#database-schema)
8. [API Endpoints](#api-endpoints)
9. [Role & Permissions](#role--permissions)
10. [Struktur Data](#struktur-data)

---

## 🎯 OVERVIEW SISTEM

### Deskripsi
Sistem Informasi Jejaring Sosial berbasis Web untuk Ikatan Keluarga Alumni (IKA) Universitas Islam Indonesia (UII) Jawa Tengah. Sistem ini memungkinkan alumni untuk terhubung, berinteraksi, berbagi informasi, dan mengikuti kegiatan organisasi.

### Tujuan
1. Memudahkan alumni untuk terhubung dan berjejaring
2. Memfasilitasi komunikasi antar alumni
3. Menyediakan platform untuk berbagi informasi dan pengalaman
4. Memudahkan pengelolaan data alumni oleh admin
5. Menyediakan media untuk publikasi berita dan event

### Target Pengguna
- **Alumni UII Jawa Tengah** - Pengguna utama sistem
- **Pengurus DPW IKA UII Jateng** - Dapat membuat berita/pengumuman
- **Administrator** - Mengelola seluruh sistem

---

## 🏗️ ARSITEKTUR SISTEM

### Arsitektur Aplikasi
**Modular Monolith** - Aplikasi monolitik dengan struktur modular untuk kemudahan pengembangan dan pemeliharaan.

### Komponen Utama
```
┌─────────────────────────────────────────┐
│         FRONTEND (React + Vite)         │
│  - React 19                            │
│  - React Router DOM                    │
│  - Tailwind CSS                        │
│  - Axios (HTTP Client)                 │
│  - Socket.io Client (Real-time)        │
└─────────────────┬───────────────────────┘
                  │
                  │ HTTP/REST API
                  │ WebSocket (Socket.io)
                  │
┌─────────────────▼───────────────────────┐
│      BACKEND (Node.js + Express)        │
│  - Express.js                           │
│  - Prisma ORM                           │
│  - JWT Authentication                  │
│  - Socket.io Server                     │
│  - Multer (File Upload)                │
│  - Sharp (Image Compression)            │
│  - Nodemailer (Email Service)          │
└─────────────────┬───────────────────────┘
                  │
                  │ Prisma ORM
                  │
┌─────────────────▼───────────────────────┐
│      DATABASE (MySQL)                   │
│  - MySQL Database                       │
│  - Prisma Migrations                    │
└─────────────────────────────────────────┘
```

### Struktur Folder Backend
```
backend/
├── src/
│   ├── modules/           # Modul-modul aplikasi
│   │   ├── auth/         # Autentikasi
│   │   ├── users/        # Manajemen user
│   │   ├── posts/        # Postingan feed
│   │   ├── comments/     # Komentar
│   │   ├── likes/        # Like
│   │   ├── messages/     # Chat pribadi
│   │   ├── connections/  # Koneksi alumni
│   │   ├── announcements/ # Berita/pengumuman
│   │   ├── events/       # Event
│   │   ├── notifications/# Notifikasi
│   │   ├── admin/        # Admin management
│   │   └── settings/     # Settings
│   ├── middleware/       # Middleware (auth, validation)
│   ├── services/         # Services (email, otp, file)
│   ├── config/          # Konfigurasi (database, socket)
│   └── server.js        # Entry point
└── prisma/
    ├── schema.prisma    # Database schema
    └── migrations/      # Database migrations
```

### Struktur Folder Frontend
```
frontend/
├── src/
│   ├── pages/           # Halaman aplikasi
│   │   ├── public/     # Halaman publik
│   │   ├── alumni/     # Halaman alumni
│   │   └── admin/      # Halaman admin
│   ├── components/      # Komponen reusable
│   │   ├── common/     # Komponen umum
│   │   ├── layout/     # Layout components
│   │   ├── post/       # Komponen postingan
│   │   ├── alumni/     # Komponen alumni
│   │   ├── chat/       # Komponen chat
│   │   └── event/      # Komponen event
│   ├── context/        # Context API (state management)
│   ├── services/       # Services (API calls)
│   ├── utils/          # Utility functions
│   └── App.jsx         # Main app dengan routing
```

---

## 💻 TEKNOLOGI PENGEMBANGAN

### Backend Stack
| Teknologi | Versi | Keterangan |
|-----------|-------|------------|
| Node.js | Latest | Runtime JavaScript |
| Express.js | ^5.2.1 | Web framework |
| Prisma | ^6.0.0 | ORM untuk database |
| MySQL | Latest | Database relational |
| JWT | ^9.0.3 | Authentication token |
| Socket.io | ^4.8.3 | Real-time communication |
| Multer | ^2.0.2 | File upload handling |
| Sharp | ^0.34.5 | Image processing & compression |
| Nodemailer | ^6.10.1 | Email service |
| bcryptjs | ^3.0.3 | Password hashing |
| express-validator | ^7.3.1 | Input validation |
| Helmet | ^8.1.0 | Security headers |
| express-rate-limit | ^8.2.1 | Rate limiting |

### Frontend Stack
| Teknologi | Versi | Keterangan |
|-----------|-------|------------|
| React | ^19.2.0 | UI library |
| Vite | ^7.2.4 | Build tool & dev server |
| React Router DOM | ^7.11.0 | Client-side routing |
| Tailwind CSS | ^3.4.1 | CSS framework |
| Axios | ^1.13.2 | HTTP client |
| Socket.io Client | ^4.8.3 | Real-time client |
| Lucide React | ^0.562.0 | Icon library |

### Development Tools
- **Nodemon** - Auto-restart server saat development
- **ESLint** - Code linting
- **PostCSS** - CSS processing

### Infrastructure
- **PM2** - Process manager untuk production
- **Nginx** - Reverse proxy (opsional)
- **SSL LetsEncrypt** - HTTPS certificate (opsional)

---

## 📱 DETAIL FITUR LENGKAP

### 1. Halaman Publik (Tanpa Login)

#### 1.1 Landing Page
**Fitur:**
- Hero section dengan informasi sistem
- Ringkasan berita terbaru (3-5 berita)
- Ringkasan event terbaru (3-5 event)
- Call-to-action untuk registrasi/login
- Footer dengan informasi kontak

**Komponen:**
- Hero banner
- News preview cards
- Event preview cards
- Navigation bar

#### 1.2 Login
**Fitur:**
- Form login dengan email & password
- Validasi input
- Error handling
- Remember me (opsional)
- Link ke halaman registrasi
- Link lupa password (opsional)

**Validasi:**
- Email harus valid
- Password tidak boleh kosong
- Cek email terverifikasi (kecuali admin)

#### 1.3 Register
**Fitur:**
- Form registrasi dengan field:
  - Email
  - Password
  - Nama lengkap
  - NIM
  - Fakultas/Prodi
  - Angkatan
  - Domisili
  - Nomor WhatsApp
- Request OTP via email
- Verifikasi OTP
- Resend OTP
- Validasi semua field

**Flow:**
1. User isi form registrasi
2. Request OTP → Email dikirim
3. User input OTP
4. Verify OTP & Register
5. User dibuat dengan status `emailVerified: true`, `verified: false`
6. Email notifikasi ke admin
7. User redirect ke halaman "Menunggu Verifikasi"

#### 1.4 Daftar Berita
**Fitur:**
- List semua berita yang published
- Filter berdasarkan kategori:
  - Berita Umum
  - Agenda
  - Program DPW
  - Peluang Kerjasama
  - Event Alumni
- Search berita
- Pagination
- Card berita dengan:
  - Judul
  - Kategori
  - Tanggal publish
  - Preview konten
  - Gambar thumbnail
  - Jumlah views

#### 1.5 Detail Berita
**Fitur:**
- Tampilan lengkap berita
- Judul, kategori, author, tanggal
- Konten lengkap dengan formatting
- Gambar berita
- Share button
- Related berita
- Breadcrumb navigation

#### 1.6 Daftar Event
**Fitur:**
- List semua event yang published
- Filter berdasarkan kategori
- Search event
- Card event dengan:
  - Judul
  - Tanggal & waktu
  - Lokasi
  - Poster
  - Kategori
  - Link pendaftaran

#### 1.7 Detail Event
**Fitur:**
- Tampilan lengkap event
- Deskripsi lengkap
- Poster event
- Informasi tanggal, waktu, lokasi
- Link pendaftaran (eksternal)
- Share button
- Related events

---

### 2. Halaman Alumni (Setelah Login)

#### 2.1 Dashboard (Feed)
**Fitur:**
- **Create Post:**
  - Text input
  - Upload gambar (dengan preview)
  - Auto compress gambar
  - Publish button
  - Cancel button

- **Post Feed:**
  - List semua postingan (chronological)
  - Infinite scroll / pagination
  - Post card dengan:
    - Author info (nama, foto, timestamp)
    - Konten postingan
    - Gambar (jika ada)
    - Like button dengan counter
    - Comment button dengan counter
    - Share button
    - Action menu (edit/delete untuk own post)

- **Like Feature:**
  - Toggle like/unlike
  - Update counter real-time
  - Notifikasi ke author saat di-like

- **Comment Feature:**
  - Comment section (expandable)
  - Input comment
  - List komentar dengan:
    - Author info
    - Konten
    - Timestamp
    - Reply button (nested comments)
  - Real-time update

- **Share Feature:**
  - Share ke WhatsApp
  - Copy link
  - Share ke media sosial

- **Right Sidebar:**
  - Widget event terbaru
  - Widget berita terbaru
  - Widget alumni terbaru
  - Quick links

#### 2.2 Profil
**Fitur:**
- **Profile Header:**
  - Cover photo (dapat diubah)
  - Foto profil (dapat diubah)
  - Nama, profesi, perusahaan
  - Domisili, angkatan
  - Edit profile button

- **Tab About:**
  - Informasi lengkap:
    - NIM, Email, Phone
    - Fakultas, Prodi, Angkatan
    - Domisili
    - Profesi, Perusahaan, Jabatan
    - Skills/Keahlian
    - Social media links
  - Edit button

- **Tab Portfolio:**
  - List portfolio dengan:
    - Judul
    - Deskripsi
    - Gambar
    - Technologies used
    - Category
    - Link & GitHub
    - Tahun
  - Add portfolio button
  - Edit/Delete portfolio

- **Tab Posts:**
  - List semua postingan user
  - Filter & search
  - Post card dengan actions

- **Tab Experience (LinkedIn Style):**
  - Riwayat pekerjaan:
    - Company, Position
    - Location
    - Start date - End date (atau Present)
    - Employment type
    - Description
    - Skills
    - Company logo
  - Add experience button
  - Edit/Delete experience

- **Tab Education:**
  - Riwayat pendidikan:
    - School/University
    - Degree
    - Field of study
    - Start - End year
    - Grade/GPA
    - Activities
    - Description
  - Add education button

- **Tab Certifications:**
  - List sertifikasi:
    - Name
    - Issuing organization
    - Issue date
    - Expiration date
    - Credential ID & URL
  - Add certification button

- **Tab Languages:**
  - List bahasa:
    - Language name
    - Proficiency level
  - Add language button

#### 2.3 Direktori Alumni
**Fitur:**
- **Search Bar:**
  - Search by: Nama, NIM, Profesi
  - Real-time search dengan debounce

- **Filter Multi-parameter:**
  - Angkatan (dropdown)
  - Domisili (dropdown)
  - Fakultas (dropdown)
  - Profesi (dropdown)
  - Kombinasi filter (AND logic)

- **View Mode:**
  - Grid view
  - List view
  - Toggle button

- **Alumni Card:**
  - Foto profil
  - Nama
  - Profesi
  - Domisili
  - Angkatan
  - Verified badge
  - View profile button

- **Pagination:**
  - Page navigation
  - Items per page selector
  - Total count display

#### 2.4 Detail Alumni
**Fitur:**
- Profil lengkap alumni
- Semua informasi (About, Portfolio, Experience, dll)
- Click-to-chat WhatsApp button
- Social media links
- Connection request button (jika belum terkoneksi)
- Back to direktori button

#### 2.5 Notifikasi
**Fitur:**
- **List Notifikasi:**
  - Semua notifikasi user
  - Filter by type:
    - Like
    - Comment
    - Event
    - Berita
    - Connection request
  - Mark as read/unread
  - Delete notification
  - Mark all as read

- **Notifikasi Types:**
  - **Like:** "X menyukai postingan Anda"
  - **Comment:** "X mengomentari postingan Anda"
  - **Event:** "Event 'X' akan dimulai besok"
  - **Berita:** "Berita baru: 'X'"
  - **Connection:** "X ingin terhubung dengan Anda"

- **Real-time Update:**
  - Notifikasi baru muncul otomatis
  - Badge counter di header
  - Sound notification (opsional)

#### 2.6 Pesan (Chat)
**Fitur:**
- **Tab Private Chat:**
  - List percakapan pribadi
  - Search chat
  - Last message preview
  - Timestamp
  - Unread badge
  - Click untuk buka chat window

- **Tab Room Chat:**
  - Chat publik/group
  - List semua peserta
  - Message history
  - Real-time messaging

- **Chat Window:**
  - Message list dengan:
    - Sender info
    - Message content
    - Timestamp
    - Read status (untuk private)
  - Input message
  - Send button
  - Emoji picker (opsional)
  - File attachment (opsional)
  - Auto-scroll ke message terbaru

- **Real-time Features:**
  - Typing indicator
  - Online/offline status
  - Message delivery status
  - Real-time message update

#### 2.7 Koneksi
**Fitur:**
- **Tab Connection Requests:**
  - List permintaan koneksi masuk
  - Sender info
  - Message (jika ada)
  - Accept/Reject button
  - Timestamp

- **Tab My Connections:**
  - List semua koneksi yang diterima
  - Search connections
  - Connection card dengan:
    - Foto & nama
    - Profesi
    - Action buttons (chat, view profile)

- **Tab Sent Requests:**
  - List permintaan yang dikirim
  - Status (pending/accepted/rejected)
  - Cancel button

- **Connection Status:**
  - Pending
  - Accepted
  - Rejected

---

### 3. Halaman Admin

#### 3.1 Admin Dashboard
**Fitur:**
- **Statistik Cards:**
  - Total Alumni (dengan breakdown verified/pending)
  - Total Pengumuman (published/unpublished)
  - Total Event (published/unpublished)
  - Total Posts
  - Total Likes/Comments/Shares
  - Growth metrics

- **Charts & Analytics:**
  - Statistik Alumni per Angkatan (bar chart)
  - Statistik Alumni per Fakultas (pie chart)
  - Statistik Alumni per Domisili (bar chart)
  - Growth chart (line chart)
  - Engagement metrics

- **Recent Activity:**
  - User registrations terbaru
  - Posts terbaru
  - Events terbaru
  - Berita terbaru

- **Quick Actions:**
  - Link ke manajemen user
  - Link ke manajemen berita
  - Link ke manajemen event
  - Link ke settings

#### 3.2 Manajemen Alumni
**Fitur:**
- **User List Table:**
  - Columns: Nama, Email, NIM, Role, Status, Actions
  - Sortable columns
  - Search by: Nama, NIM, Email
  - Filter by: Status (All/Verified/Pending), Role (All/Alumni/Pengurus)
  - Pagination

- **Actions:**
  - **Verify User:** Set `verified: true`
  - **Reject User:** Delete user dari sistem
  - **Edit User:** Edit data user (modal/form)
  - **View Detail:** Modal dengan detail lengkap user
  - **Change Role:** Ubah role (Alumni ↔ Pengurus)
  - **Delete User:** Hapus user permanen

- **Bulk Actions:**
  - Verify multiple users
  - Delete multiple users
  - Export to Excel (opsional)

#### 3.3 Manajemen Berita
**Fitur:**
- **Berita List:**
  - Table dengan: Judul, Kategori, Author, Status, Views, Actions
  - Search berita
  - Filter by: Kategori, Status (Published/Unpublished)
  - Sort by: Date, Views

- **CRUD Operations:**
  - **Create Berita:**
    - Form dengan field:
      - Judul (required)
      - Slug (auto-generate dari judul)
      - Konten (rich text editor)
      - Kategori (dropdown)
      - Upload gambar
      - Publish checkbox
    - Preview mode
    - Save draft
    - Publish button

  - **Edit Berita:**
    - Form sama seperti create
    - Update existing berita
    - History tracking (opsional)

  - **Delete Berita:**
    - Confirmation dialog
    - Soft delete atau hard delete

  - **Publish/Unpublish:**
    - Toggle publish status
    - Scheduled publish (opsional)

#### 3.4 Manajemen Event
**Fitur:**
- **Event List:**
  - Table dengan: Judul, Tanggal, Lokasi, Kategori, Status, Peserta, Actions
  - Search event
  - Filter by: Kategori, Status, Date range
  - Sort by: Date

- **CRUD Operations:**
  - **Create Event:**
    - Form dengan field:
      - Judul (required)
      - Deskripsi (rich text)
      - Upload poster
      - Tanggal & waktu
      - Lokasi
      - Kategori
      - Link pendaftaran (eksternal)
      - Publish checkbox
    - Preview mode

  - **Edit Event:**
    - Update existing event
    - Edit semua field

  - **Delete Event:**
    - Confirmation dialog
    - Hapus event

  - **Kelola Pendaftar:**
    - List peserta yang terdaftar
    - Export list peserta (Excel)
    - Filter & search peserta

#### 3.5 Manajemen Posts
**Fitur:**
- **Posts List:**
  - Table dengan: Author, Konten preview, Likes, Comments, Date, Actions
  - Search posts
  - Filter by: Author, Date range
  - Sort by: Date, Likes, Comments

- **Actions:**
  - View detail post
  - Edit post (untuk moderation)
  - Delete post
  - Hide post (opsional)

#### 3.6 Settings
**Fitur:**
- **System Settings:**
  - Site name
  - Site description
  - Logo
  - Favicon
  - Contact information

- **Email Settings:**
  - SMTP configuration
  - Email templates
  - Admin notification emails

- **Notification Settings:**
  - Enable/disable notification types
  - Notification preferences

- **Other Settings:**
  - OTP expiry time
  - File upload limits
  - Image compression settings

---

## 🔄 FLOW SISTEM

### Flow Registrasi & Verifikasi

```
1. User mengakses halaman Register
   ↓
2. User mengisi form registrasi (email, password, nama, NIM, dll)
   ↓
3. User klik "Request OTP"
   ↓
4. Backend:
   - Validasi email (format, uniqueness)
   - Generate OTP (6 digit)
   - Simpan OTP ke database dengan expiry (10 menit)
   - Kirim email OTP via Nodemailer
   ↓
5. User menerima email OTP
   ↓
6. User input OTP di halaman verifikasi
   ↓
7. Backend:
   - Validasi OTP (cek match & expiry)
   - Hash password
   - Create user dengan status:
     * emailVerified: true
     * verified: false (menunggu admin)
   - Clear OTP dari database
   ↓
8. Backend kirim email notifikasi ke admin:
   - List email admin dari settings
   - Email berisi: Nama, Email, NIM, Prodi, Angkatan, Domisili
   ↓
9. Backend create AdminNotification:
   - Type: NEW_USER_REGISTRATION
   - Message: "User baru mendaftar: [nama] ([email])"
   - userId: ID user baru
   ↓
10. User redirect ke halaman "Menunggu Verifikasi"
    ↓
11. Admin melihat notifikasi di dashboard
    ↓
12. Admin buka halaman Manajemen Alumni
    ↓
13. Admin review data user:
    - Cek kesesuaian NIM, nama, prodi, angkatan
    - Verifikasi keaslian data
    ↓
14. Admin memilih action:
    A. Verify User:
       - Set verified: true
       - User bisa login
       - Notifikasi ke user (opsional)
    
    B. Reject User:
       - Delete user dari database
       - Notifikasi ke user (opsional)
    
    C. Request Revision:
       - Kirim notifikasi ke user untuk revisi data
       - User bisa edit data & submit ulang
```

### Flow Login

```
1. User mengakses halaman Login
   ↓
2. User input email & password
   ↓
3. Backend validasi:
   - Cek email exists
   - Cek emailVerified (kecuali admin)
   - Cek verified (kecuali admin)
   - Verify password dengan bcrypt
   ↓
4. Jika valid:
   - Generate JWT token (expires: 7 days)
   - Generate refresh token (expires: 30 days)
   - Return token & user data
   ↓
5. Frontend:
   - Simpan token ke localStorage
   - Simpan user data ke localStorage
   - Set auth state
   ↓
6. Redirect berdasarkan role:
   - ADMIN → /admin
   - PENGURUS/ALUMNI → /dashboard
   - Unverified → /waiting-verification
```

### Flow Create Post

```
1. User di Dashboard klik "Create Post"
   ↓
2. User input konten (text)
   ↓
3. User upload gambar (opsional):
   - Pilih file
   - Preview gambar
   - Auto compress di frontend (opsional)
   ↓
4. User klik "Publish"
   ↓
5. Frontend kirim request ke backend:
   POST /api/posts
   {
     content: string,
     image: File (multipart/form-data)
   }
   ↓
6. Backend:
   - Verify token (middleware)
   - Validasi input
   - Upload gambar ke server:
     * Multer handle upload
     * Sharp compress & resize
     * Convert to WebP (opsional)
     * Save ke folder uploads/
   - Create Post di database:
     * authorId: userId dari token
     * content: text content
     * media: path ke gambar
     * createdAt: now
   ↓
7. Backend emit Socket.io event:
   - Event: "new_post"
   - Data: post object
   ↓
8. Frontend:
   - Receive socket event
   - Update feed real-time
   - Show success message
```

### Flow Like Post

```
1. User klik like button di post card
   ↓
2. Frontend:
   - Optimistic update (toggle like UI)
   - Kirim request ke backend
   ↓
3. Backend:
   - Verify token
   - Cek apakah sudah like:
     * Jika sudah: Delete like
     * Jika belum: Create like
   - Update post.likes counter
   ↓
4. Backend emit Socket.io:
   - Event: "post_liked"
   - Data: { postId, userId, action: 'like'/'unlike' }
   ↓
5. Frontend update UI:
   - Update like button state
   - Update counter
   ↓
6. Jika user like post milik orang lain:
   - Backend create notification:
     * Type: "like"
     * Message: "[User] menyukai postingan Anda"
     * relatedId: postId
     * relatedType: "post"
   - Emit notification ke author via Socket.io
```

### Flow Comment Post

```
1. User klik comment button atau expand comment section
   ↓
2. User input komentar
   ↓
3. User klik "Send"
   ↓
4. Backend:
   - Verify token
   - Validasi input
   - Create Comment:
     * postId
     * authorId
     * content
     * parentId (null untuk top-level, ID untuk reply)
   - Update post.comments counter
   ↓
5. Backend emit Socket.io:
   - Event: "new_comment"
   - Data: comment object dengan author info
   ↓
6. Frontend:
   - Receive socket event
   - Update comment section
   - Scroll ke komentar baru
   ↓
7. Backend create notification:
   - Type: "comment"
   - Message: "[User] mengomentari postingan Anda"
   - relatedId: postId
   - relatedType: "post"
   - Emit ke post author via Socket.io
```

### Flow Chat Private

```
1. User buka halaman Chat
   ↓
2. User pilih tab "Private Chat"
   ↓
3. Frontend:
   - Fetch list conversations:
     GET /api/messages/conversations
   - Display list dengan last message
   ↓
4. User klik conversation
   ↓
5. Frontend:
   - Fetch messages:
     GET /api/messages/:userId
   - Join Socket.io room: "chat:{userId1}:{userId2}"
   ↓
6. User input message
   ↓
7. User klik "Send"
   ↓
8. Frontend:
   - Optimistic update (tampilkan message)
   - Emit Socket.io: "send_message"
   - Kirim request: POST /api/messages
   ↓
9. Backend:
   - Verify token
   - Validasi input
   - Create Message:
     * senderId
     * receiverId
     * content
     * read: false
   - Emit Socket.io ke receiver:
     * Event: "new_message"
     * Room: "chat:{userId1}:{userId2}"
     * Data: message object
   ↓
10. Receiver:
    - Receive socket event
    - Update UI (tampilkan message baru)
    - Play notification sound (opsional)
    - Update unread badge
```

### Flow Direktori Alumni

```
1. User buka halaman Direktori
   ↓
2. Frontend:
   - Fetch semua alumni:
     GET /api/users?role=ALUMNI&verified=true
   - Display dengan pagination
   ↓
3. User input search query
   ↓
4. Frontend:
   - Debounce search (500ms)
   - Filter lokal atau kirim request:
     GET /api/users?search=query&role=ALUMNI
   ↓
5. User pilih filter (angkatan, domisili, dll)
   ↓
6. Frontend:
   - Update filter state
   - Kirim request dengan filter:
     GET /api/users?angkatan=2015&domisili=Semarang&role=ALUMNI
   ↓
7. Backend:
   - Query database dengan Prisma
   - Apply filters
   - Return paginated results
   ↓
8. Frontend display filtered results
   ↓
9. User klik alumni card
   ↓
10. Navigate ke /direktori/:id
    ↓
11. Frontend:
    - Fetch detail alumni:
      GET /api/users/:id
    - Display profil lengkap
    - Show connection status
    - Show action buttons (chat, connect)
```

### Flow Connection Request

```
1. User di Detail Alumni klik "Connect"
   ↓
2. Frontend:
   - Kirim request: POST /api/connections
   {
     connectedUserId: targetUserId,
     message: "Halo, saya ingin terhubung"
   }
   ↓
3. Backend:
   - Verify token
   - Cek apakah sudah ada connection:
     * Jika sudah: Return error
     * Jika belum: Create Connection:
       - userId: current user
       - connectedUserId: target user
       - status: PENDING
   ↓
4. Backend create notification:
   - Type: "connection"
   - Message: "[User] ingin terhubung dengan Anda"
   - relatedId: connectionId
   - relatedType: "connection"
   - Emit ke target user via Socket.io
   ↓
5. Target user:
   - Receive notification
   - Buka halaman Koneksi
   - Lihat connection request
   ↓
6. Target user pilih action:
   A. Accept:
      - Update status: ACCEPTED
      - Create notification ke requester
      - Emit Socket.io ke requester
   
   B. Reject:
      - Update status: REJECTED
      - Create notification ke requester (opsional)
```

---

## 👤 FLOW USER

### User Journey: Alumni Baru

```
1. REGISTRASI
   - Buka landing page
   - Klik "Daftar"
   - Isi form registrasi
   - Request OTP
   - Verifikasi OTP
   - Menunggu verifikasi admin

2. MENUNGGU VERIFIKASI
   - Lihat status "Menunggu Verifikasi"
   - Tidak bisa akses fitur utama
   - Bisa lihat berita & event publik

3. SETELAH DIVERIFIKASI
   - Login ke sistem
   - Masuk ke Dashboard
   - Explore fitur:
     * Lihat feed postingan
     * Buat postingan pertama
     * Explore direktori alumni
     * Lihat profil sendiri
     * Edit profil

4. MEMBANGUN KONEKSI
   - Cari alumni di direktori
   - Lihat detail profil
   - Kirim connection request
   - Terima connection request
   - Mulai chat dengan koneksi

5. BERINTERAKSI
   - Like & comment postingan
   - Share postingan
   - Ikuti event
   - Baca berita
   - Update portfolio & experience

6. AKTIF DI PLATFORM
   - Buat postingan rutin
   - Berpartisipasi di chat room
   - Update profil secara berkala
   - Terhubung dengan lebih banyak alumni
```

### User Journey: Pengurus

```
1. LOGIN
   - Login dengan role PENGURUS
   - Masuk ke Dashboard (sama seperti alumni)

2. MEMBUAT BERITA
   - Akses /admin/berita
   - Buat berita baru:
     * Isi judul & konten
     * Upload gambar
     * Pilih kategori
     * Publish
   - Edit/Delete berita yang dibuat

3. MEMBUAT EVENT
   - Akses /admin/event (jika ada akses)
   - Atau buat event melalui berita

4. FITUR ALUMNI
   - Semua fitur alumni tetap bisa digunakan
   - Bisa berinteraksi seperti alumni biasa
```

### User Journey: Administrator

```
1. LOGIN
   - Login dengan role ADMIN
   - Redirect ke /admin (dashboard admin)

2. MONITORING
   - Lihat statistik sistem
   - Lihat recent activity
   - Monitor user registrations

3. MANAJEMEN USER
   - Akses /admin/alumni
   - Review user baru
   - Verify/Reject user
   - Edit user data
   - Change user role

4. MANAJEMEN KONTEN
   - Kelola berita (CRUD)
   - Kelola event (CRUD)
   - Moderate posts
   - Kelola settings

5. ANALYTICS
   - Lihat statistik lengkap
   - Export data (opsional)
   - Generate reports (opsional)
```

---

## 🗄️ DATABASE SCHEMA

### Models (Prisma Schema)

#### User
```prisma
model User {
  id            String    @id @default(uuid())
  email         String    @unique
  password      String
  nim           String?   @unique
  nama          String
  prodi         String?
  angkatan      Int?
  domisili      String?
  whatsapp      String?
  role          Role      @default(ALUMNI)
  verified      Boolean   @default(false)
  emailVerified Boolean   @default(false)
  otp           String?
  otpExpiry     DateTime?
  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt

  profile       Profile?
  posts         Post[]
  comments      Comment[]
  likes         Like[]
  sentMessages  Message[] @relation("SenderMessages")
  receivedMessages Message[] @relation("ReceiverMessages")
  connections   Connection[] @relation("UserConnections")
  connectedTo   Connection[] @relation("ConnectedToUser")
  notifications Notification[]

  @@index([email])
  @@index([nim])
  @@index([angkatan])
  @@index([domisili])
  @@map("users")
}
```

#### Profile
```prisma
model Profile {
  id          String   @id @default(uuid())
  userId      String   @unique
  fotoProfil  String?
  profesi     String?
  skill       String?
  perusahaan  String?
  jabatan     String?
  sosialMedia Json?
  portfolio   Json?
  experience  Json?
  education   Json?
  certifications Json?
  languages   Json?
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  user        User     @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@map("profiles")
}
```

#### Post
```prisma
model Post {
  id        String    @id @default(uuid())
  content   String    @db.Text
  media     String?
  authorId  String
  createdAt DateTime  @default(now())
  updatedAt DateTime  @updatedAt

  author    User      @relation(fields: [authorId], references: [id], onDelete: Cascade)
  comments  Comment[]
  likes     Like[]

  @@index([authorId])
  @@index([createdAt])
  @@map("posts")
}
```

#### Comment
```prisma
model Comment {
  id        String   @id @default(uuid())
  content   String   @db.Text
  postId    String
  authorId  String
  parentId  String?  // Untuk nested comments
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  post      Post     @relation(fields: [postId], references: [id], onDelete: Cascade)
  author    User     @relation(fields: [authorId], references: [id], onDelete: Cascade)
  parent    Comment? @relation("CommentReplies", fields: [parentId], references: [id])
  replies   Comment[] @relation("CommentReplies")

  @@index([postId])
  @@index([parentId])
  @@map("comments")
}
```

#### Like
```prisma
model Like {
  id        String   @id @default(uuid())
  postId    String
  userId    String
  createdAt DateTime @default(now())

  post      Post     @relation(fields: [postId], references: [id], onDelete: Cascade)
  user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@unique([postId, userId])
  @@index([postId])
  @@map("likes")
}
```

#### Message
```prisma
model Message {
  id        String   @id @default(uuid())
  content   String   @db.Text
  senderId  String
  receiverId String
  read      Boolean  @default(false)
  createdAt DateTime @default(now())

  sender    User     @relation("SenderMessages", fields: [senderId], references: [id], onDelete: Cascade)
  receiver  User     @relation("ReceiverMessages", fields: [receiverId], references: [id], onDelete: Cascade)

  @@index([senderId, receiverId])
  @@index([createdAt])
  @@map("messages")
}
```

#### Connection
```prisma
model Connection {
  id          String         @id @default(uuid())
  userId      String
  connectedUserId String
  status      ConnectionStatus @default(PENDING)
  message     String?        @db.Text
  createdAt   DateTime       @default(now())
  updatedAt   DateTime       @updatedAt

  user        User           @relation("UserConnections", fields: [userId], references: [id], onDelete: Cascade)
  connectedTo User           @relation("ConnectedToUser", fields: [connectedUserId], references: [id], onDelete: Cascade)

  @@unique([userId, connectedUserId])
  @@index([userId])
  @@index([status])
  @@map("connections")
}
```

#### Announcement (Berita)
```prisma
model Announcement {
  id        String   @id @default(uuid())
  title     String
  slug      String   @unique
  content   String   @db.Text
  category  String
  image     String?
  published Boolean  @default(false)
  views     Int      @default(0)
  authorId  String?
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  @@index([published])
  @@index([category])
  @@index([slug])
  @@map("announcements")
}
```

#### Event
```prisma
model Event {
  id          String   @id @default(uuid())
  title       String
  description String   @db.Text
  poster      String?
  tanggal     DateTime
  lokasi      String?
  category    String?
  linkDaftar  String?
  published   Boolean  @default(false)
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  participants EventParticipant[]

  @@index([published])
  @@index([tanggal])
  @@map("events")
}
```

#### EventParticipant
```prisma
model EventParticipant {
  id        String   @id @default(uuid())
  eventId   String
  userId    String
  createdAt DateTime @default(now())

  event     Event    @relation(fields: [eventId], references: [id], onDelete: Cascade)
  user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@unique([eventId, userId])
  @@index([eventId])
  @@map("event_participants")
}
```

#### Notification
```prisma
model Notification {
  id          String   @id @default(uuid())
  userId      String
  type        String   // like, comment, event, berita, connection
  message     String
  relatedId   String?  // ID dari post/event/berita/connection
  relatedType String?  // post/event/berita/connection
  read        Boolean  @default(false)
  createdAt   DateTime @default(now())

  user        User     @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@index([userId])
  @@index([read])
  @@index([createdAt])
  @@map("notifications")
}
```

#### AdminNotification
```prisma
model AdminNotification {
  id        String   @id @default(uuid())
  type      String
  message   String
  userId    String?
  read      Boolean  @default(false)
  createdAt DateTime @default(now())

  @@index([read])
  @@index([createdAt])
  @@map("admin_notifications")
}
```

#### Setting
```prisma
model Setting {
  id          String      @id @default(uuid())
  key         String      @unique
  category    String
  value       String      @db.Text
  type        SettingType @default(STRING)
  label       String
  description String?     @db.Text
  isPublic    Boolean     @default(false)
  order       Int         @default(0)
  createdAt   DateTime    @default(now())
  updatedAt   DateTime    @updatedAt

  @@index([category])
  @@index([key])
  @@map("settings")
}
```

#### FileUpload
```prisma
model FileUpload {
  id          String   @id @default(uuid())
  filename    String
  originalName String
  path        String
  mimeType    String
  size        Int
  uploadedBy  String?
  createdAt   DateTime @default(now())

  @@index([uploadedBy])
  @@map("file_uploads")
}
```

### Enums
```prisma
enum Role {
  ADMIN
  PENGURUS
  ALUMNI
}

enum ConnectionStatus {
  PENDING
  ACCEPTED
  REJECTED
}

enum SettingType {
  STRING
  JSON
  NUMBER
  BOOLEAN
}
```

---

## 🔌 API ENDPOINTS

### Authentication
```
POST   /api/auth/register/request-otp
POST   /api/auth/register/verify-otp
POST   /api/auth/register/resend-otp
POST   /api/auth/login
POST   /api/auth/logout
GET    /api/auth/me
POST   /api/auth/refresh-token
```

### Users
```
GET    /api/users                    # List users (with filters)
GET    /api/users/:id                # Get user by ID
PUT    /api/users/:id                # Update user (own profile)
GET    /api/users/:id/profile        # Get user profile
PUT    /api/users/:id/profile        # Update user profile
```

### Posts
```
GET    /api/posts                    # List posts (feed)
GET    /api/posts/:id                # Get post by ID
POST   /api/posts                    # Create post
PUT    /api/posts/:id                # Update post
DELETE /api/posts/:id                # Delete post
```

### Comments
```
GET    /api/posts/:postId/comments   # Get comments for post
POST   /api/posts/:postId/comments   # Create comment
PUT    /api/comments/:id             # Update comment
DELETE /api/comments/:id             # Delete comment
```

### Likes
```
POST   /api/posts/:postId/like       # Toggle like
GET    /api/posts/:postId/likes      # Get likes for post
```

### Messages
```
GET    /api/messages/conversations   # Get conversation list
GET    /api/messages/:userId         # Get messages with user
POST   /api/messages                 # Send message
PUT    /api/messages/:id/read        # Mark as read
```

### Connections
```
GET    /api/connections              # Get connections
GET    /api/connections/requests     # Get connection requests
POST   /api/connections              # Send connection request
PUT    /api/connections/:id/accept   # Accept connection
PUT    /api/connections/:id/reject   # Reject connection
DELETE /api/connections/:id          # Remove connection
```

### Announcements (Berita)
```
GET    /api/announcements            # List announcements
GET    /api/announcements/:id       # Get announcement by ID
POST   /api/announcements            # Create announcement (PENGURUS/ADMIN)
PUT    /api/announcements/:id       # Update announcement
DELETE /api/announcements/:id       # Delete announcement
PUT    /api/announcements/:id/publish # Publish/Unpublish
```

### Events
```
GET    /api/events                   # List events
GET    /api/events/:id               # Get event by ID
POST   /api/events                   # Create event (ADMIN)
PUT    /api/events/:id               # Update event
DELETE /api/events/:id               # Delete event
POST   /api/events/:id/register      # Register for event
GET    /api/events/:id/participants  # Get event participants
```

### Notifications
```
GET    /api/notifications            # Get user notifications
PUT    /api/notifications/:id/read   # Mark as read
PUT    /api/notifications/read-all   # Mark all as read
DELETE /api/notifications/:id        # Delete notification
```

### Admin
```
GET    /api/admin/users              # Get all users (with filters)
GET    /api/admin/users/:id          # Get user detail
PUT    /api/admin/users/:id/verify   # Verify user
PUT    /api/admin/users/:id/reject   # Reject user
PUT    /api/admin/users/:id/role     # Update user role
DELETE /api/admin/users/:id         # Delete user
GET    /api/admin/statistics         # Get statistics
GET    /api/admin/notifications      # Get admin notifications
PUT    /api/admin/notifications/:id/read # Mark admin notification as read
```

### Settings
```
GET    /api/settings                 # Get all settings
GET    /api/settings/:key            # Get setting by key
POST   /api/settings                 # Create setting (ADMIN)
PUT    /api/settings/:id             # Update setting (ADMIN)
DELETE /api/settings/:id             # Delete setting (ADMIN)
```

### File Upload
```
POST   /api/upload                   # Upload file
POST   /api/upload/image              # Upload image (with compression)
DELETE /api/upload/:id                # Delete uploaded file
```

---

## 🔐 ROLE & PERMISSIONS

### Role: ALUMNI
**Akses:**
- ✅ Dashboard (feed)
- ✅ Create/Edit/Delete own posts
- ✅ Like/Comment/Share posts
- ✅ View & Edit own profile
- ✅ Direktori alumni
- ✅ Detail alumni
- ✅ Chat (private & room)
- ✅ Connections
- ✅ Notifications
- ✅ View berita & event (public)

**Tidak Bisa:**
- ❌ Admin panel
- ❌ Create berita
- ❌ Create event
- ❌ Manage users

### Role: PENGURUS
**Akses:**
- ✅ Semua akses ALUMNI
- ✅ `/admin/berita` - Create/Edit/Delete berita
- ✅ Publish/Unpublish berita

**Tidak Bisa:**
- ❌ Admin panel lainnya
- ❌ Manage users
- ❌ Manage events (kecuali via berita)

### Role: ADMIN
**Akses:**
- ✅ Semua akses
- ✅ `/admin/*` - Semua halaman admin
- ✅ Manage users (verify, reject, edit, delete)
- ✅ Manage berita (CRUD)
- ✅ Manage events (CRUD)
- ✅ Manage posts (moderate)
- ✅ Settings
- ✅ Statistics & Analytics

**Tidak Bisa:**
- ❌ Dashboard user biasa (redirect ke admin)

---

## 📊 STRUKTUR DATA

### User Object
```javascript
{
  id: "uuid",
  email: "user@example.com",
  nama: "Ahmad Fauzi",
  nim: "123456789",
  prodi: "Teknik Informatika",
  angkatan: 2015,
  domisili: "Semarang",
  whatsapp: "081234567890",
  role: "ALUMNI" | "PENGURUS" | "ADMIN",
  verified: true,
  emailVerified: true,
  createdAt: "2024-01-15T00:00:00Z",
  profile: {
    fotoProfil: "path/to/image.jpg",
    profesi: "Software Engineer",
    skill: "JavaScript, React, Node.js",
    perusahaan: "PT. Teknologi Indonesia",
    jabatan: "Senior Developer",
    sosialMedia: {
      linkedin: "ahmad-fauzi",
      instagram: "@ahmadfauzi"
    },
    portfolio: [...],
    experience: [...],
    education: [...],
    certifications: [...],
    languages: [...]
  }
}
```

### Post Object
```javascript
{
  id: "uuid",
  content: "Post content text...",
  media: "path/to/image.jpg" | null,
  authorId: "user-uuid",
  author: {
    id: "user-uuid",
    nama: "Ahmad Fauzi",
    fotoProfil: "path/to/avatar.jpg"
  },
  likes: 24,
  comments: 5,
  shares: 3,
  likedBy: ["user-id-1", "user-id-2"],
  createdAt: "2024-12-16T08:30:00Z",
  updatedAt: "2024-12-16T08:30:00Z"
}
```

### Comment Object
```javascript
{
  id: "uuid",
  postId: "post-uuid",
  authorId: "user-uuid",
  author: {
    id: "user-uuid",
    nama: "Siti Nurhaliza",
    fotoProfil: "path/to/avatar.jpg"
  },
  content: "Comment text...",
  parentId: "comment-uuid" | null, // Untuk nested comments
  replies: [...], // Array of Comment objects
  createdAt: "2024-12-16T08:35:00Z"
}
```

### Notification Object
```javascript
{
  id: "uuid",
  userId: "user-uuid",
  type: "like" | "comment" | "event" | "berita" | "connection",
  message: "Ahmad Fauzi menyukai postingan Anda",
  relatedId: "post-uuid",
  relatedType: "post",
  read: false,
  createdAt: "2024-12-16T08:30:00Z"
}
```

### Connection Object
```javascript
{
  id: "uuid",
  userId: "user-uuid",
  connectedUserId: "target-user-uuid",
  status: "PENDING" | "ACCEPTED" | "REJECTED",
  message: "Halo, saya ingin terhubung",
  user: {
    id: "user-uuid",
    nama: "Ahmad Fauzi",
    fotoProfil: "path/to/avatar.jpg",
    profesi: "Software Engineer"
  },
  connectedTo: {
    id: "target-user-uuid",
    nama: "Siti Nurhaliza",
    fotoProfil: "path/to/avatar.jpg",
    profesi: "Business Analyst"
  },
  createdAt: "2024-12-15T10:00:00Z",
  updatedAt: "2024-12-15T10:00:00Z"
}
```

### Announcement Object
```javascript
{
  id: "uuid",
  title: "DPW IKA UII Jateng Gelar Reuni Akbar 2024",
  slug: "dpw-ika-uii-jateng-gelar-reuni-akbar-2024",
  content: "Full content text...",
  category: "Event Alumni",
  image: "path/to/image.jpg",
  published: true,
  views: 245,
  authorId: "user-uuid",
  createdAt: "2024-12-01T00:00:00Z",
  updatedAt: "2024-12-01T00:00:00Z"
}
```

### Event Object
```javascript
{
  id: "uuid",
  title: "Reuni Akbar Alumni UII Jateng 2024",
  description: "Event description...",
  poster: "path/to/poster.jpg",
  tanggal: "2024-12-20T09:00:00Z",
  lokasi: "Hotel Grand Candi, Semarang",
  category: "Event Alumni",
  linkDaftar: "https://example.com/daftar",
  published: true,
  participants: [
    {
      id: "uuid",
      userId: "user-uuid",
      user: {
        nama: "Ahmad Fauzi",
        fotoProfil: "path/to/avatar.jpg"
      }
    }
  ],
  createdAt: "2024-12-01T00:00:00Z"
}
```

---

## 📝 CATATAN PENTING

### Security
1. **Password Hashing:** Semua password di-hash menggunakan bcryptjs (salt rounds: 10)
2. **JWT Token:** Access token expires 7 days, refresh token expires 30 days
3. **Input Validation:** Semua input divalidasi menggunakan express-validator
4. **Rate Limiting:** Diterapkan pada endpoint login, OTP, dan register
5. **CORS:** Hanya frontend URL yang diizinkan
6. **Helmet:** Security headers untuk proteksi HTTP

### File Upload
1. **Image Compression:** Semua gambar di-compress menggunakan Sharp
2. **File Size Limit:** Maksimal 5MB per file
3. **Allowed Types:** JPG, PNG, WebP untuk gambar; PDF untuk dokumen
4. **Storage:** File disimpan di folder `uploads/` dengan struktur:
   ```
   uploads/
   ├── images/
   │   ├── posts/
   │   ├── profiles/
   │   ├── announcements/
   │   └── events/
   └── documents/
   ```

### Real-time Communication
1. **Socket.io:** Digunakan untuk chat dan notifikasi real-time
2. **Rooms:** Setiap chat private menggunakan room: `chat:{userId1}:{userId2}`
3. **Events:**
   - `new_post` - Post baru dibuat
   - `post_liked` - Post di-like
   - `new_comment` - Komentar baru
   - `new_message` - Pesan baru
   - `new_notification` - Notifikasi baru
   - `connection_request` - Connection request baru

### Email Service
1. **OTP Email:** Dikirim saat registrasi
2. **Admin Notification:** Dikirim ke admin saat user baru register
3. **Email Templates:** Dapat dikustomisasi di settings
4. **SMTP Configuration:** Disimpan di settings atau .env

### Database
1. **Prisma ORM:** Digunakan untuk semua operasi database
2. **Migrations:** Semua perubahan schema melalui Prisma migrations
3. **Indexes:** Index pada kolom yang sering di-query (email, nim, angkatan, dll)
4. **Cascade Delete:** Relasi menggunakan cascade delete untuk data integrity

### Performance
1. **Pagination:** Semua list data menggunakan pagination
2. **Lazy Loading:** Infinite scroll untuk feed
3. **Image Optimization:** Kompresi dan konversi ke WebP
4. **Caching:** Dapat ditambahkan untuk data yang jarang berubah (settings, dll)

---

## 🎯 KESIMPULAN

Dokumen ini mencakup semua informasi yang diperlukan untuk memahami dan membangun sistem jejaring sosial alumni. Semua fitur, flow, dan struktur data telah dijelaskan secara detail berdasarkan DEMO-SISTEM yang sudah lengkap.

**Langkah Selanjutnya:**
1. Setup environment (database, email service)
2. Implementasi fitur sesuai prioritas (Auth → Feed → Chat → Admin)
3. Testing setiap fitur
4. Deployment ke production

**Referensi:**
- DEMO-SISTEM: Acuan UI/UX dan fitur lengkap
- APP: Struktur backend & frontend yang sudah ada
- Detail Sistem: Rancangan awal sistem

---

**Dokumen ini dibuat sebagai acuan utama untuk pengembangan sistem.**  
**Terakhir diupdate:** 2025-01-XX

