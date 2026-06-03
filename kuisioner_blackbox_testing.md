# Kuisioner Pengujian Blackbox (Black Box Testing)
**Sistem Jejaring Alumni (UII Connect)**

Dokumen pengujian ini disusun berdasarkan **Role (Hak Akses)** pengguna di dalam sistem. Skenario dirancang untuk memastikan tiap pengguna hanya memiliki akses ke fitur yang sesuai dan fungsionalitasnya berjalan dengan baik.

---

## Cara Pengisian:
1. Kolom **Status** diisi dengan:
   * `[  ] Sesuai (Pass)` jika hasil pengujian **sama** dengan hasil yang diharapkan.
   * `[  ] Tidak Sesuai (Fail)` jika hasil pengujian **berbeda** atau terjadi *error* / *bug*.
2. Kolom **Catatan / Keterangan** digunakan untuk mencatat perilaku sistem yang tidak wajar.

---

## 1. Role: Public / Pengunjung (Guest)
Pengujian untuk pengguna yang belum memiliki akun terverifikasi atau tidak sedang dalam status *Login*.

| ID | Fitur | Skenario Pengujian (Input / Aksi) | Hasil yang Diharapkan (Expected Output) | Status & Catatan |
| :--- | :--- | :--- | :--- | :--- |
| **PUB-01** | Landing Page | Mengakses halaman utama web (Landing Page). | Dapat melihat statistik, daftar alumni pilihan, event terbaru, dan kontak tanpa perlu login. | [ ] Pass / [ ] Fail <br/> Catatan: |
| **PUB-02** | Registrasi | Mengisi form pendaftaran dengan data lengkap & valid. | Sistem mengirim OTP ke email terdaftar dan mengarahkan ke halaman Verifikasi OTP. | [ ] Pass / [ ] Fail <br/> Catatan: |
| **PUB-03** | Verifikasi OTP | Memasukkan kode OTP yang valid/benar sesuai email. | Sistem memvalidasi, pengguna diarahkan untuk mengisi kelengkapan Profil Dasar. | [ ] Pass / [ ] Fail <br/> Catatan: |
| **PUB-04** | Pembatasan Akses | Mencoba mengakses rute privat seperti `/dashboard` tanpa login. | Sistem menolak akses dan me-redirect paksa pengguna kembali ke halaman Login. | [ ] Pass / [ ] Fail <br/> Catatan: |
| **PUB-05** | Login & Akses Ditahan | Login dengan akun yang baru mendaftar (sudah OTP tapi belum diverifikasi Admin). | Sistem mengarahkan ke halaman "Menunggu Verifikasi Admin" dan memblokir akses ke Dashboard. | [ ] Pass / [ ] Fail <br/> Catatan: |

---

## 2. Role: Alumni (Pengguna Terverifikasi)
Pengujian untuk pengguna biasa yang akunnya telah disetujui (Verified) oleh Admin.

| ID | Fitur | Skenario Pengujian (Input / Aksi) | Hasil yang Diharapkan (Expected Output) | Status & Catatan |
| :--- | :--- | :--- | :--- | :--- |
| **ALM-01** | Feed/Timeline | Membuat postingan status baru (teks dan gambar). | Postingan berhasil tampil di urutan atas Feed Komunitas. | [ ] Pass / [ ] Fail <br/> Catatan: |
| **ALM-02** | Interaksi Sosial | Memberikan "Like" dan Komentar pada postingan alumni lain. | Jumlah Like bertambah, dan komentar langsung muncul di bawah postingan. | [ ] Pass / [ ] Fail <br/> Catatan: |
| **ALM-03** | Direktori | Melakukan pencarian alumni dan filter (berdasarkan Prodi & Angkatan). | Sistem menyaring dan hanya menampilkan kartu profil alumni yang sesuai filter. | [ ] Pass / [ ] Fail <br/> Catatan: |
| **ALM-04** | Manajemen Koneksi | Menekan tombol "Connect" pada profil rekan. | Status koneksi menjadi "Menunggu Persetujuan" dan notifikasi terkirim ke target. | [ ] Pass / [ ] Fail <br/> Catatan: |
| **ALM-05** | Chat Real-Time | Mengirim pesan instan kepada alumni yang sudah "Terhubung" (*Connected*). | Pesan terkirim dan diterima secara *real-time* tanpa *refresh* (Socket.io). | [ ] Pass / [ ] Fail <br/> Catatan: |
| **ALM-06** | Forum Diskusi | Membuat utas (*thread*) baru di Forum sesuai kategori tertentu. | Thread baru berhasil terbuat dan muncul di kategori yang dipilih agar dapat ditanggapi. | [ ] Pass / [ ] Fail <br/> Catatan: |
| **ALM-07** | Pengajuan Loker | Mengisi form lowongan kerja baru dan menyimpannya. | Loker tersimpan dengan status "DRAFT" (menunggu persetujuan Pengurus/Admin). | [ ] Pass / [ ] Fail <br/> Catatan: |
| **ALM-08** | Manajemen Profil | Menambah data Riwayat Pendidikan dan Riwayat Pekerjaan baru. | Data tersimpan dan langsung tampil publik pada halaman Detail Profil pengguna. | [ ] Pass / [ ] Fail <br/> Catatan: |
| **ALM-09** | Report/Laporkan | Melaporkan komentar atau postingan alumni yang tidak pantas (SARA). | Laporan terkirim, pengguna akan mendapatkan pesan "Laporan berhasil diajukan". | [ ] Pass / [ ] Fail <br/> Catatan: |

---

## 3. Role: Pengurus
Role menengah (di atas Alumni). Memiliki akses ke fitur harian organisasi tanpa hak *Super Admin*. (Catatan: Pengurus secara otomatis juga dapat melakukan semua fitur Role Alumni).

| ID | Fitur | Skenario Pengujian (Input / Aksi) | Hasil yang Diharapkan (Expected Output) | Status & Catatan |
| :--- | :--- | :--- | :--- | :--- |
| **PNG-01** | Manajemen Event | Membuat Event/Agenda Kegiatan baru lengkap beserta gambar pamflet. | Event tersimpan dan otomatis muncul di daftar Event Publik untuk alumni & pengunjung. | [ ] Pass / [ ] Fail <br/> Catatan: |
| **PNG-02** | Berita & Pengumuman | Menulis Berita baru menggunakan editor *Rich Text* lalu dipublikasikan. | Berita muncul pada daftar berita di Landing Page dan Dashboard Alumni. | [ ] Pass / [ ] Fail <br/> Catatan: |
| **PNG-03** | Verifikasi Loker | Mengakses menu Loker, mengecek DRAFT dari alumni, dan klik "Setujui/Publish". | Status Loker berubah aktif dan resmi muncul di halaman Bursa Karir (Lowongan). | [ ] Pass / [ ] Fail <br/> Catatan: |
| **PNG-04** | Tolak Loker | Klik "Tolak" pada usulan lowongan kerja palsu/spam. | Loker tersebut tidak akan dipublikasikan ke publik. | [ ] Pass / [ ] Fail <br/> Catatan: |

---

## 4. Role: Administrator Utama (Super Admin)
Role tertinggi yang mengontrol sisi keamanan (User & Moderasi) serta visual Landing Page utama.

| ID | Fitur | Skenario Pengujian (Input / Aksi) | Hasil yang Diharapkan (Expected Output) | Status & Catatan |
| :--- | :--- | :--- | :--- | :--- |
| **ADM-01** | Verifikasi User | Mengakses menu User Management dan menekan "Setujui" pada pendaftar baru. | Akun alumni aktif; alumni tersebut kini dapat mengakses Dashboard sepenuhnya. | [ ] Pass / [ ] Fail <br/> Catatan: |
| **ADM-02** | Suspend Akun | Memberikan sanksi (Suspend) pada akun alumni yang melanggar. | Akun tersebut akan ter-logout paksa dan tidak bisa login kembali ke sistem. | [ ] Pass / [ ] Fail <br/> Catatan: |
| **ADM-03** | Moderasi Konten | Mengakses tabel Laporan (*Report*), mengecek bukti, lalu "Hapus Konten". | Postingan / Thread yang bersangkutan otomatis lenyap dari sistem secara permanen. | [ ] Pass / [ ] Fail <br/> Catatan: |
| **ADM-04** | Kategori Forum | Menambah Kategori Baru (contoh: "Info CPNS") di menu Manajemen Forum. | Kategori "Info CPNS" langsung muncul sebagai pilihan saat Alumni membuat Thread. | [ ] Pass / [ ] Fail <br/> Catatan: |
| **ADM-05** | CMS - Drag & Drop | Mengubah urutan kartu Alumni Pilihan pada halaman Display Home Page (*Drag-Drop*). | Susunan pada Landing Page publik otomatis terupdate mengikuti urutan baru tersebut. | [ ] Pass / [ ] Fail <br/> Catatan: |
| **ADM-06** | CMS - Ganti Logo | Mengunggah gambar Logo Navigasi baru. | Logo lama terganti dengan logo baru yang otomatis dikompres ke tinggi proporsional (40px). | [ ] Pass / [ ] Fail <br/> Catatan: |
| **ADM-07** | File Manager | Mengakses menu File Manager untuk memantau sisa *storage* dan menghapus file lawas. | File terhapus dari server fisik aplikasi untuk menghemat penyimpanan data. | [ ] Pass / [ ] Fail <br/> Catatan: |
