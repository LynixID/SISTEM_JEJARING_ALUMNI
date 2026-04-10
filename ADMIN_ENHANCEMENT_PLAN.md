# 🛠️ ADMIN ENHANCEMENT PLAN
## Rencana Pengembangan Lengkap Panel Administrasi
### Sistem Informasi Jejaring Sosial Alumni DPW IKA UII Jawa Tengah

**Mahasiswa:** Ilham Gading Pangestu (233307012)  
**Program Studi:** D3 Teknologi Informasi, Politeknik Negeri Madiun  
**Dibuat:** April 2026  
**Status:** 🔄 Perencanaan

---

## 📋 KONDISI ADMIN PANEL SAAT INI

### ✅ Yang Sudah Ada (Existing)

| Fitur | Backend | Frontend | Status |
|:--|:--:|:--:|:--:|
| Manajemen Alumni (CRUD + Verify) | ✅ | ✅ | Selesai |
| Manajemen Berita/Announcement (CRUD) | ✅ | ✅ | Selesai |
| Manajemen Event (CRUD) | ✅ | ✅ | Selesai |
| Statistik Dasar (count user) | ✅ | ✅ | Selesai |
| Settings Sistem | ✅ | ✅ | Selesai |
| Admin Notifications (registrasi user baru) | ✅ | ✅ | Selesai |
| Manajemen Posts (moderasi dasar) | ⚠️ Parsial | ✅ | Parsial |

### ❌ Yang Belum Ada (Gap)

| Fitur | Prioritas | Estimasi Waktu |
|:--|:--:|:--:|
| Manajemen Komentar | 🔴 Tinggi | 1-2 hari |
| Broadcast Notifikasi ke Semua User | 🔴 Tinggi | 1 hari |
| Sistem Laporan / Report Konten | 🔴 Tinggi | 2-3 hari |
| Manajemen File Upload & Storage | 🟡 Sedang | 1-2 hari |
| Export Data (Excel/CSV) | 🟡 Sedang | 1 hari |
| Statistik & Analitik Lanjutan | 🟡 Sedang | 2-3 hari |
| Manajemen Koneksi Alumni (monitoring) | 🟢 Rendah | 1 hari |
| Monitoring Pesan (statistik saja) | 🟢 Rendah | 1 hari |
| Force Logout / Suspend User | 🟢 Rendah | 1-2 hari |
| Kelola Partisipan Event (CRUD penuh) | 🟡 Sedang | 1 hari |

---

## 🗂️ DAFTAR FITUR YANG AKAN DIBANGUN

---

### FITUR 1: Manajemen Komentar
**Prioritas:** 🔴 Tinggi  
**Estimasi:** 1-2 hari kerja

#### Deskripsi
Admin dapat melihat, mencari, dan menghapus semua komentar di seluruh platform dari satu antarmuka terpusat tanpa harus masuk ke post satu per satu.

#### Yang Dibutuhkan

**Backend:**
- `GET /api/admin/comments` — Daftar semua komentar (dengan filter: postId, authorId, tanggal, keyword)
- `GET /api/admin/comments/:id` — Detail komentar beserta context postnya
- `DELETE /api/admin/comments/:id` — Hapus komentar
- `DELETE /api/admin/comments/bulk` — Hapus banyak komentar sekaligus

**Frontend:**
- Halaman baru: `frontend/src/pages/admin/ManageComments.jsx`
- Fitur:
  - Tabel komentar dengan kolom: Isi Komentar, Author, Post Terkait, Tanggal, Actions
  - Filter berdasarkan: keyword, tanggal, post tertentu
  - Preview link ke post terkait
  - Tombol hapus per komentar (dengan konfirmasi)
  - Bulk delete (checkbox + hapus semua yang dipilih)
  - Pagination

**Database:**
- Tidak perlu perubahan schema (model `Comment` sudah ada)

#### File yang Dimodifikasi/Dibuat
```
backend/src/modules/admin/adminController.js    → Tambah fungsi comment management
backend/src/modules/admin/adminRoutes.js         → Tambah routes komentar
frontend/src/pages/admin/ManageComments.jsx      → [BARU] Halaman manajemen komentar
frontend/src/App.jsx                             → Tambah route /admin/komentar
```

---

### FITUR 2: Broadcast Notifikasi ke Semua User
**Prioritas:** 🔴 Tinggi  
**Estimasi:** 1 hari kerja

#### Deskripsi
Admin dapat mengirim notifikasi pengumuman ke seluruh alumni yang terdaftar sekaligus, baik melalui sistem notifikasi in-app maupun via Socket.io real-time.

#### Yang Dibutuhkan

**Backend:**
- `POST /api/admin/broadcast` — Kirim notifikasi broadcast
  - Body: `{ title, message, type: "broadcast", targetRole: "ALL" | "ALUMNI" | "PENGURUS" }`
  - Membuat record `Notification` untuk setiap user yang jadi target
  - Emit Socket.io event `broadcast_notification` ke semua user online

**Frontend:**
- Komponen baru di dashboard admin atau halaman tersendiri
- Form sederhana:
  - Input judul notifikasi
  - Textarea isi pesan
  - Dropdown target penerima (Semua, Hanya Alumni, Hanya Pengurus)
  - Preview sebelum kirim
  - Tombol kirim dengan konfirmasi (menampilkan jumlah user yang akan menerima)
- Riwayat broadcast yang pernah dikirim

**Database:**
- Tidak perlu perubahan schema (gunakan model `Notification` yang sudah ada dengan type `"broadcast"`)

#### File yang Dimodifikasi/Dibuat
```
backend/src/modules/admin/adminController.js    → Tambah fungsi broadcastNotification
backend/src/modules/admin/adminRoutes.js         → Tambah route POST /broadcast
frontend/src/pages/admin/BroadcastNotif.jsx      → [BARU] Halaman broadcast
frontend/src/App.jsx                             → Tambah route /admin/broadcast
```

---

### FITUR 3: Sistem Laporan / Report Konten
**Prioritas:** 🔴 Tinggi  
**Estimasi:** 2-3 hari kerja

#### Deskripsi
Fitur paling kritis yang belum ada. User dapat melaporkan post, komentar, atau profil yang melanggar aturan. Admin menerima dan memproses laporan tersebut dari satu panel terpusat.

#### Yang Dibutuhkan

**Database — Schema Baru:**
```prisma
model Report {
  id          String       @id @default(uuid())
  reporterId  String                           // User yang melapor
  targetType  ReportTargetType                 // POST / COMMENT / USER
  targetId    String                           // ID dari konten yang dilaporkan
  reason      ReportReason                     // Enum alasan laporan
  description String?      @db.Text            // Deskripsi tambahan
  status      ReportStatus @default(PENDING)   // PENDING / REVIEWED / RESOLVED / DISMISSED
  adminNote   String?      @db.Text            // Catatan admin saat memproses
  resolvedAt  DateTime?
  createdAt   DateTime     @default(now())
  updatedAt   DateTime     @updatedAt

  reporter    User         @relation(fields: [reporterId], references: [id], onDelete: Cascade)

  @@index([status])
  @@index([targetType])
  @@index([createdAt])
  @@map("reports")
}

enum ReportTargetType {
  POST
  COMMENT
  USER
}

enum ReportReason {
  SPAM
  HARASSMENT
  HATE_SPEECH
  INAPPROPRIATE_CONTENT
  FALSE_INFORMATION
  OTHER
}

enum ReportStatus {
  PENDING
  REVIEWED
  RESOLVED
  DISMISSED
}
```

**Backend:**
- `POST /api/reports` — User membuat laporan (diakses semua user yang login)
- `GET /api/admin/reports` — Daftar semua laporan (filter: status, targetType, tanggal)
- `GET /api/admin/reports/:id` — Detail laporan beserta preview konten yang dilaporkan
- `PATCH /api/admin/reports/:id/status` — Update status laporan (REVIEWED/RESOLVED/DISMISSED)
- `GET /api/admin/reports/statistics` — Ringkasan statistik laporan

**Frontend User (Tombol Laporkan):**
- Tambah tombol "Laporkan" di: Post card, Comment item, Profil alumni
- Modal laporan dengan form: pilih alasan + deskripsi opsional
- File yang dimodifikasi: `Dashboard.jsx`, `PostDetail.jsx`, `DiscussionDetail.jsx`, `Profile.jsx`

**Frontend Admin:**
- Halaman baru: `frontend/src/pages/admin/ManageReports.jsx`
- Fitur:
  - Tabel laporan dengan badge status berwarna (Pending, Reviewed, dll.)
  - Preview konten yang dilaporkan langsung di modal
  - Tombol aksi cepat: Hapus Konten, Dismiss Laporan, Beri Peringatan ke User
  - Filter: by status, by tipe konten, by tanggal
  - Statistik ringkasan di atas tabel

#### File yang Dimodifikasi/Dibuat
```
prisma/schema.prisma                              → Tambah model Report & enums baru
prisma/migrations/                                → Jalankan prisma migrate dev
backend/src/modules/reports/                      → [BARU] Module baru
  reportController.js
  reportRoutes.js
backend/src/modules/admin/adminController.js      → Tambah fungsi report management
backend/src/modules/admin/adminRoutes.js          → Tambah routes laporan admin
backend/src/server.js                             → Register routes baru
frontend/src/pages/admin/ManageReports.jsx        → [BARU] Halaman laporan
frontend/src/pages/Dashboard.jsx                  → Tambah tombol laporkan di post card
frontend/src/pages/PostDetail.jsx                 → Tambah tombol laporkan
frontend/src/App.jsx                              → Tambah route /admin/laporan
```

---

### FITUR 4: Manajemen File Upload & Storage
**Prioritas:** 🟡 Sedang  
**Estimasi:** 1-2 hari kerja

#### Deskripsi
Admin dapat memantau semua file yang pernah diupload ke server, melihat statistik penggunaan storage, dan menghapus file yang tidak diperlukan atau melanggar aturan.

#### Yang Dibutuhkan

**Backend:**
- `GET /api/admin/files` — Daftar semua file upload (filter: tipe, uploader, tanggal, ukuran)
- `GET /api/admin/files/statistics` — Statistik storage (total file, total ukuran, breakdown per tipe)
- `DELETE /api/admin/files/:id` — Hapus file dari server DAN database
- `DELETE /api/admin/files/bulk` — Hapus banyak file sekaligus
- `GET /api/admin/files/orphans` — Deteksi file orphan (ada di DB tapi referensinya sudah dihapus)

**Frontend:**
- Halaman baru: `frontend/src/pages/admin/ManageFiles.jsx`
- Fitur:
  - Kartu statistik: Total file, Total ukuran (MB/GB), Breakdown per kategori (foto profil, postingan, dll.)
  - Tabel file: thumbnail preview, nama file, ukuran, uploader, tanggal, aksi
  - Filter: tipe file, tanggal, ukuran
  - Bulk delete
  - Tombol scan orphan files

**Database:**
- Tidak perlu perubahan schema (model `FileUpload` sudah ada)
- Pastikan semua endpoint upload mencatat ke tabel `file_uploads`

#### File yang Dimodifikasi/Dibuat
```
backend/src/modules/admin/adminController.js    → Tambah fungsi file management
backend/src/modules/admin/adminRoutes.js         → Tambah routes file
backend/src/modules/upload/uploadController.js  → Pastikan mencatat ke FileUpload
frontend/src/pages/admin/ManageFiles.jsx        → [BARU] Halaman manajemen file
frontend/src/App.jsx                             → Tambah route /admin/files
```

---

### FITUR 5: Export Data (Excel / CSV)
**Prioritas:** 🟡 Sedang  
**Estimasi:** 1 hari kerja

#### Deskripsi
Admin dapat mengekspor data alumni dan peserta event ke format Excel atau CSV untuk keperluan laporan, arsip, atau pemrosesan data offline.

#### Yang Dibutuhkan

**Dependency Baru:**
```bash
npm install xlsx
# atau
npm install exceljs
```

**Backend:**
- `GET /api/admin/export/alumni` — Export data alumni (dengan filter yang sama seperti halaman manajemen alumni) → response file `.xlsx`
- `GET /api/admin/export/events/:id/participants` — Export peserta event tertentu → response file `.xlsx`
- `GET /api/admin/export/posts` — Export daftar postingan (untuk audit) → response file `.xlsx`

**Format Export Alumni (.xlsx):**
```
Kolom: No | Nama | NIM | Email | Prodi | Angkatan | Domisili | WhatsApp | Profesi | Perusahaan | Status | Bergabung
```

**Format Export Peserta Event (.xlsx):**
```
Kolom: No | Nama | NIM | Email | Prodi | Angkatan | Domisili | WhatsApp | Tanggal Daftar
```

**Frontend:**
- Tambah tombol "📥 Export Excel" di:
  - Halaman `UserManagement.jsx` (Export Alumni)
  - Halaman `ManageEvents.jsx` → per event (Export Peserta)
- Tombol langsung trigger download file tanpa navigasi baru

#### File yang Dimodifikasi/Dibuat
```
backend/src/modules/admin/adminController.js       → Tambah fungsi export
backend/src/modules/admin/adminRoutes.js            → Tambah routes export
backend/src/services/exportService.js               → [BARU] Service generate Excel
frontend/src/pages/admin/UserManagement.jsx         → Tambah tombol export
frontend/src/pages/admin/ManageEvents.jsx           → Tambah tombol export peserta
```

---

### FITUR 6: Statistik & Analitik Lanjutan
**Prioritas:** 🟡 Sedang  
**Estimasi:** 2-3 hari kerja

#### Deskripsi
Dashboard admin yang selama ini hanya menampilkan angka total (count) akan diperkaya dengan grafik pertumbuhan, tren aktivitas, dan breakdown data yang lebih informatif menggunakan library chart.

#### Yang Dibutuhkan

**Backend — Endpoint Baru:**
- `GET /api/admin/statistics/overview` — Angka summary lengkap (upgrade dari yang sudah ada):
  - Total user, post, komentar, berita, event, koneksi, laporan
- `GET /api/admin/statistics/growth?period=30d|3m|1y` — Data pertumbuhan user per hari/minggu/bulan
- `GET /api/admin/statistics/activity?period=30d` — Aktivitas harian: post baru, komentar, likes, registrasi baru
- `GET /api/admin/statistics/content` — Breakdown: alumni per angkatan, alumni per prodi/fakultas, alumni per domisili
- `GET /api/admin/statistics/engagement` — Post terpopuler, berita paling banyak dibaca, event paling banyak peserta

**Frontend:**
- **Upgrade** halaman: `frontend/src/pages/admin/AdminDashboard.jsx`
- Dependency baru: `npm install recharts` (atau Chart.js via `react-chartjs-2`)
- Komponen grafik baru:
  - Line chart: Pertumbuhan user per bulan
  - Bar chart: Alumni per angkatan
  - Pie chart: Alumni per fakultas/prodi
  - Bar chart: Alumni per domisili (top 10)
  - Area chart: Aktivitas harian (post, komentar)
  - Kartu "Top Content": 5 post terpopuler, 5 berita paling dibaca
- Selector periode (7 hari, 30 hari, 3 bulan, 1 tahun)

#### File yang Dimodifikasi/Dibuat
```
backend/src/modules/admin/adminController.js       → Upgrade & tambah fungsi statistik
backend/src/modules/admin/adminRoutes.js            → Tambah routes statistik baru
frontend/src/pages/admin/AdminDashboard.jsx         → Upgrade tampilan dashboard
frontend/src/components/admin/                      → [BARU] Folder komponen charts
  StatCard.jsx
  GrowthChart.jsx
  ActivityChart.jsx
  ContentBreakdownChart.jsx
  TopContentList.jsx
```

---

### FITUR 7: Manajemen Koneksi Alumni (Monitoring)
**Prioritas:** 🟢 Rendah  
**Estimasi:** 1 hari kerja

#### Deskripsi
Admin dapat memantau data jaringan koneksi antar alumni: siapa terhubung dengan siapa, berapa banyak koneksi yang terbentuk, dan dapat memutus koneksi yang bermasalah jika dilaporkan.

#### Yang Dibutuhkan

**Backend:**
- `GET /api/admin/connections` — Daftar semua koneksi (filter: status, user, tanggal)
- `GET /api/admin/connections/statistics` — Ringkasan: total koneksi aktif, pending, rata-rata koneksi per user
- `DELETE /api/admin/connections/:id` — Putus koneksi tertentu (jika dilaporkan bermasalah)

**Frontend:**
- Halaman baru: `frontend/src/pages/admin/ManageConnections.jsx`
- Fitur:
  - Kartu statistik jaringan: Total koneksi aktif, Total pending, Rata-rata per user
  - Tabel koneksi: User A ↔ User B, Status, Tanggal terbentuk, Aksi
  - Filter: by status, by tanggal

#### File yang Dimodifikasi/Dibuat
```
backend/src/modules/admin/adminController.js    → Tambah fungsi connection monitoring
backend/src/modules/admin/adminRoutes.js         → Tambah routes koneksi
frontend/src/pages/admin/ManageConnections.jsx  → [BARU] Halaman monitoring koneksi
frontend/src/App.jsx                             → Tambah route /admin/koneksi
```

---

### FITUR 8: Monitoring Pesan (Statistik Saja)
**Prioritas:** 🟢 Rendah  
**Estimasi:** 1 hari kerja

#### Deskripsi
Bukan untuk membaca isi pesan (demi privasi), melainkan untuk melihat statistik volume pesan dan aktivitas chat di platform. Data ini berguna untuk mengukur tingkat keterhubungan komunitas alumni.

#### Yang Dibutuhkan

**Backend:**
- `GET /api/admin/messages/statistics` — Statistik pesan:
  - Total pesan terkirim hari ini / minggu ini / bulan ini
  - Rata-rata pesan per hari
  - User paling aktif di chat (top 10, hanya nama - bukan isi pesan)
  - Tren volume pesan per hari (untuk grafik)

**Frontend:**
- Tambah section atau kartu "Aktivitas Chat" di halaman `AdminDashboard.jsx`
- Tidak perlu halaman tersendiri — cukup widget di dashboard

#### File yang Dimodifikasi/Dibuat
```
backend/src/modules/admin/adminController.js    → Tambah fungsi message statistics
backend/src/modules/admin/adminRoutes.js         → Tambah route statistik pesan
frontend/src/pages/admin/AdminDashboard.jsx     → Tambah widget statistik chat
```

---

### FITUR 9: Suspend User / Force Logout
**Prioritas:** 🟢 Rendah  
**Estimasi:** 1-2 hari kerja

#### Deskripsi
Admin dapat menangguhkan akun user sementara (suspend) tanpa harus menghapusnya. User yang di-suspend tidak bisa login hingga suspensi dicabut.

#### Yang Dibutuhkan

**Database — Modifikasi Schema:**
```prisma
// Tambahkan field pada model User yang sudah ada:
model User {
  // ... field yang sudah ada ...
  isSuspended  Boolean   @default(false)   // [BARU]
  suspendedAt  DateTime?                   // [BARU]
  suspendReason String?  @db.Text          // [BARU]
}
```

**Backend:**
- `PATCH /api/admin/users/:id/suspend` — Suspend user (body: `{ reason, duration? }`)
- `PATCH /api/admin/users/:id/unsuspend` — Cabut suspensi user
- Modifikasi middleware login: cek field `isSuspended` sebelum generate token

**Frontend:**
- Tambah tombol "⛔ Suspend" di halaman `UserManagement.jsx`
- Modal konfirmasi suspend dengan input alasan
- Indikator badge "Suspended" di tabel user management
- Tombol "Cabut Suspend" untuk user yang sedang di-suspend

#### File yang Dimodifikasi/Dibuat
```
prisma/schema.prisma                              → Tambah field suspend di model User
prisma/migrations/                                → Jalankan prisma migrate dev
backend/src/modules/auth/authController.js        → Cek isSuspended saat login
backend/src/modules/admin/adminController.js      → Tambah fungsi suspend/unsuspend
backend/src/modules/admin/adminRoutes.js           → Tambah routes suspend
frontend/src/pages/admin/UserManagement.jsx       → Tambah UI suspend/unsuspend
```

---

### FITUR 10: Kelola Partisipan Event (Admin CRUD Penuh)
**Prioritas:** 🟡 Sedang  
**Estimasi:** 1 hari kerja

#### Deskripsi
Saat ini admin hanya bisa melihat daftar peserta event. Fitur ini menambahkan kemampuan admin untuk mendaftarkan peserta secara manual (misal: alumni yang daftar offline) dan menghapus peserta.

#### Yang Dibutuhkan

**Backend:**
- `POST /api/admin/events/:id/participants` — Tambah peserta manual (body: `{ userId }` atau `{ userIds: [] }`)
- `DELETE /api/admin/events/:eventId/participants/:userId` — Hapus peserta dari event
- `DELETE /api/admin/events/:eventId/participants/bulk` — Hapus banyak peserta

**Frontend:**
- Upgrade halaman `ManageEvents.jsx` — di bagian detail event:
  - Tambah tombol "➕ Tambah Peserta" → Modal search & pilih alumni
  - Tambah checkbox & tombol hapus di tabel peserta
  - Tombol "📥 Export Peserta" → terhubung ke Fitur 5

#### File yang Dimodifikasi/Dibuat
```
backend/src/modules/events/eventController.js    → Tambah fungsi admin CRUD peserta
backend/src/modules/events/eventRoutes.js         → Tambah routes admin peserta
frontend/src/pages/admin/ManageEvents.jsx         → Upgrade UI kelola peserta
```

---

## 📅 TIMELINE PENGERJAAN

### Sprint 1 — Fitur Kritis (Estimasi: 5-7 hari)
> Target: Semua fitur moderasi & keamanan platform selesai

| Hari | Kegiatan | Output |
|:--|:--|:--|
| 1 | Setup & Persiapan: migrate schema laporan, install deps | Schema Report siap |
| 2 | Backend Fitur 3: Module Reports (user buat laporan) | API laporan selesai |
| 3 | Frontend Fitur 3: Tombol laporkan di konten + Modal laporan | User bisa lapor |
| 4 | Backend + Frontend Fitur 3: ManageReports admin panel | Admin bisa proses laporan |
| 5 | Backend + Frontend Fitur 1: ManageComments admin panel | Admin bisa moderasi komentar |
| 6 | Backend + Frontend Fitur 2: Broadcast Notifikasi | Admin bisa kirim pengumuman |
| 7 | Testing Sprint 1, bug fixing | Semua Sprint 1 stabil |

### Sprint 2 — Fitur Data & Analitik (Estimasi: 4-5 hari)
> Target: Dashboard admin informatif dan data exportable

| Hari | Kegiatan | Output |
|:--|:--|:--|
| 8 | Backend Fitur 6: Endpoints statistik lanjutan | API statistik siap |
| 9 | Frontend Fitur 6: Grafik di AdminDashboard (install recharts) | Dashboard hidup & informatif |
| 10 | Backend + Frontend Fitur 5: Export Excel (install exceljs) | Export alumni & peserta bisa diunduh |
| 11 | Backend + Frontend Fitur 10: Kelola peserta event penuh | Admin bisa tambah/hapus peserta |
| 12 | Testing Sprint 2, bug fixing | Semua Sprint 2 stabil |

### Sprint 3 — Fitur Monitoring & Utility (Estimasi: 4-5 hari)
> Target: Admin punya visibilitas penuh terhadap seluruh aktivitas sistem

| Hari | Kegiatan | Output |
|:--|:--|:--|
| 13 | Backend + Frontend Fitur 4: ManageFiles & storage stats | Admin bisa kelola file |
| 14 | Backend + Frontend Fitur 9: Suspend User + modifikasi login | Admin bisa suspend akun |
| 15 | Backend + Frontend Fitur 7: ManageConnections monitoring | Admin bisa pantau jaringan |
| 16 | Backend + Frontend Fitur 8: Statistik pesan di dashboard | Widget chat aktif di dashboard |
| 17 | Testing menyeluruh, bug fixing, polish UI | Semua fitur siap |

**Total Estimasi: 15-17 hari kerja**

---

## 🗺️ NAVIGASI ADMIN PANEL (SETELAH SELESAI)

```
/admin                          → AdminDashboard (Statistik Lengkap)
/admin/alumni                   → UserManagement (✅ Ada + tambah Suspend, Export)
/admin/berita                   → ManageAnnouncements (✅ Ada)
/admin/event                    → ManageEvents (✅ Ada + tambah Kelola Peserta, Export)
/admin/posts                    → ManagePosts (⚠️ Ada sebagian, perlu dilengkapi)
/admin/komentar                 → ManageComments (❌ BARU - Fitur 1)
/admin/laporan                  → ManageReports (❌ BARU - Fitur 3)
/admin/broadcast                → BroadcastNotif (❌ BARU - Fitur 2)
/admin/files                    → ManageFiles (❌ BARU - Fitur 4)
/admin/koneksi                  → ManageConnections (❌ BARU - Fitur 7)
/admin/settings                 → Settings (✅ Ada)
```

---

## 🗄️ RINGKASAN PERUBAHAN DATABASE

### Schema Baru yang Perlu Ditambahkan

#### Model `Report` (Fitur 3 — Wajib)
```prisma
model Report {
  id          String           @id @default(uuid())
  reporterId  String
  targetType  ReportTargetType
  targetId    String
  reason      ReportReason
  description String?          @db.Text
  status      ReportStatus     @default(PENDING)
  adminNote   String?          @db.Text
  resolvedAt  DateTime?
  createdAt   DateTime         @default(now())
  updatedAt   DateTime         @updatedAt

  reporter    User             @relation(fields: [reporterId], references: [id], onDelete: Cascade)

  @@index([status])
  @@index([targetType])
  @@index([createdAt])
  @@map("reports")
}

enum ReportTargetType { POST COMMENT USER }
enum ReportReason { SPAM HARASSMENT HATE_SPEECH INAPPROPRIATE_CONTENT FALSE_INFORMATION OTHER }
enum ReportStatus { PENDING REVIEWED RESOLVED DISMISSED }
```

#### Modifikasi Model `User` (Fitur 9 — Suspend)
```prisma
// Tambah field berikut ke model User yang sudah ada:
isSuspended   Boolean   @default(false)
suspendedAt   DateTime?
suspendReason String?   @db.Text
```

### Migrasi yang Perlu Dijalankan
```bash
# Setelah update schema.prisma:
npx prisma migrate dev --name add_reports_and_suspend
npx prisma generate
```

---

## 📦 DEPENDENCY BARU YANG DIBUTUHKAN

### Backend
```bash
npm install exceljs        # Untuk export Excel (Fitur 5)
```

### Frontend
```bash
npm install recharts       # Untuk grafik statistik (Fitur 6)
```

---

## ✅ CHECKLIST PENGERJAAN

### Sprint 1 — Moderasi & Keamanan
- [x] Update `prisma/schema.prisma` — tambah model `Report` & enums
- [x] Jalankan `prisma migrate dev`
- [x] Buat `backend/src/modules/reports/reportController.js`
- [x] Buat `backend/src/modules/reports/reportRoutes.js`
- [x] Register report routes di `backend/src/server.js`
- [x] Tambah fungsi admin report di `adminController.js`
- [x] Tambah routes admin report di `adminRoutes.js`
- [x] Buat `frontend/src/pages/admin/ManageReports.jsx`
- [x] Tambah tombol "Laporkan" di `PostDetail.jsx` (post card)
- [x] Tambah tombol "Laporkan" di `Profile.jsx` (profil alumni)
- [x] Buat komponen ReportModal reusable `frontend/src/components/common/ReportModal.jsx`
- [x] Tambah fungsi komentar management di `adminController.js`
- [x] Tambah routes komentar di `adminRoutes.js`
- [x] Buat `frontend/src/pages/admin/ManageComments.jsx`
- [ ] Tambah fungsi broadcast di `adminController.js`
- [ ] Buat `frontend/src/pages/admin/BroadcastNotif.jsx`
- [x] Update routing di `frontend/src/App.jsx` (route /admin/laporan & /admin/komentar)

### Sprint 2 — Data & Analitik
- [x] Tambah endpoint statistik lanjutan di `adminController.js`
- [x] Install `recharts` di frontend
- [x] Upgrade `frontend/src/pages/admin/AdminDashboard.jsx` dengan grafik
- [x] Buat komponen grafik di dashboard admin
- [ ] Install `exceljs` di backend
- [ ] Buat `backend/src/services/exportService.js`
- [ ] Tambah endpoints export di `adminController.js` & `adminRoutes.js`
- [ ] Tambah tombol export di `UserManagement.jsx`
- [ ] Tambah tombol export peserta di `ManageEvents.jsx`
- [ ] Tambah routes admin peserta di `eventRoutes.js`
- [ ] Upgrade UI kelola peserta di `ManageEvents.jsx`

### Sprint 3 — Monitoring & Utility
- [x] Tambah fungsi file management di `adminController.js`
- [x] Buat `frontend/src/pages/admin/ManageFiles.jsx`
- [x] Tambah fungsi suspend di `adminController.js` & `adminRoutes.js`
- [x] Modifikasi `authController.js` — cek `isSuspended` saat login
- [x] Upgrade UI `UserManagement.jsx` — tambah suspend/unsuspend
- [ ] Tambah fungsi connection monitoring di `adminController.js`
- [ ] Buat `frontend/src/pages/admin/ManageConnections.jsx`
- [ ] Tambah endpoint statistik pesan di `adminController.js`
- [ ] Tambah widget statistik chat di `AdminDashboard.jsx`
- [ ] Testing menyeluruh semua fitur
- [ ] Update navigasi admin sidebar

---

## 📝 CATATAN PENTING

### Keamanan
- Semua endpoint admin **wajib** menggunakan middleware `verifyToken` + `requireRole('ADMIN')`
- Endpoint laporan (POST oleh user) cukup dengan `verifyToken`
- Data pesan (chat) **tidak boleh** bisa dibaca isi-nya oleh admin — hanya statistik agregat

### Privasi
- Fitur monitoring pesan hanya boleh menampilkan: jumlah pesan, user teraktif (tanpa isi pesan)
- Data laporan hanya bisa diakses admin, bukan pengurus

### Konsistensi UI
- Semua halaman admin baru harus mengikuti desain yang sama dengan halaman admin yang sudah ada
- Gunakan komponen yang sudah ada (tabel, modal, badge) agar konsisten

### Testing
- Setiap fitur harus diuji dengan skenario: happy path, error case, unauthorized access
- Khusus broadcast notifikasi: uji dengan jumlah user besar (simulasi 50+ user)

---

*Dokumen ini adalah panduan pengembangan lengkap untuk enhancement Admin Panel.*  
*Update checklist seiring pengerjaan berlangsung.*  
**Terakhir diupdate:** April 2026
