# Panduan Struktur Folder Proyek APP-PUSH (Sistem Jejaring Alumni)

Dokumen ini menjelaskan kegunaan tiap folder dan file utama dalam proyek **APP-PUSH** untuk memudahkan navigasi dan pengembangan.

---

## 📂 Struktur Utama (Root)

| Folder/File | Deskripsi |
| :--- | :--- |
| `backend/` | Berisi seluruh logika server, database, dan API. |
| `frontend/` | Berisi interface pengguna (UI) yang dibuat dengan React.js. |
| `RANCANGAN_SISTEM_LENGKAP.md` | Dokumentasi detail mengenai arsitektur, database, dan alur sistem. |
| `DEPLOYMENT_RECAP.md` | Catatan mengenai proses dan konfigurasi deployment ke server. |
| `SETUP_EMAIL_OTP.md` | Panduan cara mengonfigurasi fitur pengiriman kode OTP melalui email. |

---

## 🔙 Backend (`/backend`)

Folder ini menangani data dan permintaan dari frontend.

- **`prisma/`**: Berisi file `schema.prisma`. Ini adalah tempat Anda mendefinisikan tabel database dan relasinya.
- **`src/`**: Source code utama backend.
    - **`config/`**: Pengaturan database, library, dan variabel lingkungan.
    - **`jobs/`**: Tugas otomatis (cron jobs) jika ada.
    - **`middleware/`**: Fungsi pemeriksa sebelum permintaan diproses (contoh: cek apakah user sudah login, cek role admin).
    - **`modules/`**: Bagian paling penting. Logika dipisah per fitur:
        - `auth/`: Login, register, logout.
        - `users/`: Pengaturan profil dan data alumni.
        - `posts/`: Logika postingan di feed.
        - `announcements/`: Berita dan pengumuman.
        - `events/`: Agenda atau acara alumni.
        - `messages/`: Sistem chat antar pengguna.
        - `...` (dan fitur lainnya).
    - **`services/`**: Berisi layanan bantuan seperti pengiriman email (`emailService.js`).
    - **`utils/`**: Fungsi kecil yang sering digunakan berulang kali.
    - **`server.js`**: Titik masuk (entry point) utama server backend.
- **`uploads/`**: Folder tempat menyimpan file yang diupload pengguna (foto profil, lampiran post, dsb).
- **`uploads_trash/`**: Folder sementara untuk file yang dihapus.

---

## 🎨 Frontend (`/frontend`)

Folder ini adalah tampilan yang dilihat oleh pengguna.

- **`public/`**: Asset statis yang bisa diakses langsung melalui URL (misal: favicon, logo).
- **`src/`**: Source code utama React.
    - **`assets/`**: Gambar, ikon, dan file CSS global.
    - **`components/`**: Komponen UI yang kecil dan bisa digunakan berkali-kali di banyak halaman (Button, Navbar, Modal, dll).
        - `admin/`: Komponen khusus halaman admin.
        - `layout/`: Struktur bingkai halaman (Sidebar, Header).
    - **`pages/`**: Komponen halaman penuh (Login, Dashboard, Profile, dll).
        - `admin/`: Halaman-halaman khusus untuk panel admin.
    - **`services/`**: Tempat menaruh fungsi untuk memanggil API ke Backend (biasanya menggunakan `axios` di `api.js`).
    - **`context/`**: State management global, misalnya menyimpan data user yang sedang login agar bisa diakses di semua halaman.
    - **`utils/`**: Fungsi pembantu untuk format tanggal, validasi input, atau manipulasi gambar.
    - **`App.jsx`**: Berisi pengaturan rute (Routing) aplikasi.
    - **`main.jsx`**: File pertama yang dijalankan oleh browser.

---

## 🛠️ File Konfigurasi (Dotfiles)

- **`.env`**: File rahasia berisi password database dan API Key. **Jangan pernah hapus file ini.**
- **`package.json`**: Daftar library/dependency yang digunakan proyek.
- **`.gitignore`**: Memberitahu Git file mana yang tidak boleh diupload ke GitHub (seperti `node_modules` atau `.env`).

---

> [!TIP]
> Jika Anda ingin menambah fitur baru, mulailah dengan menambahkan model di `backend/prisma/schema.prisma`, buat logic di `backend/src/modules`, lalu buat tampilannya di `frontend/src/pages`.
