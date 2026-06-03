# Buku Panduan Penggunaan & Dokumentasi Fitur: UII Connect
### Sistem Jejaring Alumni Ikatan Alumni Universitas Islam Indonesia Wilayah Jawa Tengah

Selamat datang di **Buku Panduan Penggunaan UII Connect**! Dokumen ini dirancang sebagai panduan lengkap bagi **Alumni**, **Pengurus**, dan **Administrator** untuk memahami, mengoperasikan, dan mengelola seluruh fitur yang tersedia di platform UII Connect.

---

## 📌 Daftar Isi
1. [Pendahuluan & Arsitektur Platform](#-pendahuluan--arsitektur-platform)
2. [Alur Registrasi & Onboarding Pengguna](#-alur-registrasi--onboarding-pengguna)
3. [Panduan Pengguna: Dashboard & Fitur Alumni](#-panduan-pengguna-dashboard--fitur-alumni)
   - [3.1 Beranda & Feed Komunitas](#31-beranda--feed-komunitas)
   - [3.2 Direktori & Jejaring Alumni](#32-direktori--jejaring-alumni)
   - [3.3 Manajemen Koneksi & Pertemanan](#33-manajemen-koneksi--pertemanan)
   - [3.4 Sistem Pesan Real-Time (Chat)](#34-sistem-pesan-real-time-chat)
   - [3.5 Forum Diskusi & Komunitas](#35-forum-diskusi--komunitas)
   - [3.6 Hub Karir & Lowongan Kerja (Loker)](#36-hub-karir--lowongan-kerja-loker)
   - [3.7 Profil Saya & Manajemen Portofolio](#37-profil-saya--manajemen-portofolio)
4. [Panduan Pengurus & Admin: Dashboard Pengelolaan](#-panduan-pengurus--admin-dashboard-pengelolaan)
   - [4.1 Dashboard Analitik Utama](#41-dashboard-analitik-utama)
   - [4.2 Manajemen Verifikasi & Akun Pengguna](#42-manajemen-verifikasi--akun-pengguna)
   - [4.3 Manajemen Berita & Pengumuman (Announcements)](#43-manajemen-berita--pengumuman-announcements)
   - [4.4 Manajemen Event & Kegiatan](#44-manajemen-event--kegiatan)
   - [4.5 Manajemen Lowongan Kerja (Loker)](#45-manajemen-lowongan-kerja-loker)
   - [4.6 Moderasi Konten & Sistem Laporan (Reports)](#46-moderasi-konten--sistem-laporan-reports)
   - [4.7 Manajemen Kategori Forum](#47-manajemen-kategori-forum)
   - [4.8 Manajemen Berkas Unggahan (File Manager)](#48-manajemen-berkas-unggahan-file-manager)
   - [4.9 Kustomisasi Landing Page (Display Home Page)](#49-kustomisasi-landing-page-display-home-page)
5. [Pertanyaan yang Sering Diajukan (FAQ) & Kontak Bantuan](#-pertanyaan-yang-sering-diajukan-faq--kontak-bantuan)

---

## 🏛️ Pendahuluan & Arsitektur Platform

**UII Connect** adalah platform digital interaktif yang dirancang khusus untuk mempererat tali silaturahmi, memfasilitasi kolaborasi profesional, serta menyediakan informasi karir dan kegiatan eksklusif bagi seluruh alumni Universitas Islam Indonesia (UII) di wilayah Jawa Tengah.

Platform ini terbagi menjadi dua area utama:
1. **Landing Page Publik:** Halaman informasi umum tentang IKA UII Jateng, statistik alumni, dokumentasi kegiatan, video YouTube resmi, profil alumni teladan, serta formulir kontak.
2. **Dashboard Internal (Aplikasi Utama):** Area interaktif berbasis autentikasi untuk memposting status, mengirim pesan instan, memperluas jejaring koneksi, berkontribusi dalam forum diskusi, mencari pekerjaan, dan mengelola profil portofolio profesional alumni secara komprehensif.

---

## 🚀 Alur Registrasi & Onboarding Pengguna

Sebelum masuk ke sistem, setiap alumni harus melalui proses autentikasi yang aman untuk menjaga kredibilitas database alumni.

```
       [Registrasi Akun Baru]
                 │
                 ▼
       [Verifikasi OTP Email]
                 │
                 ▼
     [Lengkapi Data Diri Awal]
                 │
                 ▼
     [Menunggu Verifikasi Admin]
         /               \
 (Ditolak)               (Disetujui)
     /                       \
[Hubungi Pengurus]       [Akses Dashboard Alumni]
```

### 1. Registrasi Akun Baru
* Akses halaman pendaftaran (`/register`).
* Isi data wajib: **Nama Lengkap**, **Email Aktif** (disarankan email institusi/pribadi resmi), **Nomor Whatsapp**, **Program Studi**, **Angkatan**, dan **Kata Sandi**.
* Klik tombol **Daftar**.

### 2. Verifikasi OTP (One-Time Password)
* Sistem secara otomatis mengirimkan 6-digit kode OTP ke alamat email terdaftar.
* Masukkan kode OTP di halaman `/verify-otp`.
* *Catatan:* Kode OTP berlaku selama 10 menit. Jika tidak menerima email, silakan periksa folder *Spam* atau klik **Kirim Ulang Kode**.

### 3. Pengisian Data Onboarding Awal (`/lengkapi-data`)
* Pengguna yang mendaftar via SSO/Google atau berhasil verifikasi OTP pertama kali wajib melengkapi data profil dasar:
  * **Nama Lengkap & Panggilan**
  * **Program Studi & Tahun Angkatan**
  * **Profesi Saat Ini & Instansi/Perusahaan tempat bekerja**
* Data ini krusial agar profil Anda dapat dicari oleh rekan sejawat pada Direktori Alumni.

### 4. Menunggu Verifikasi Admin (`/waiting-verification`)
* Demi keamanan jejaring, akun Anda masuk ke mode penahanan sementara.
* Admin IKA UII Jateng akan meninjau validitas data Anda.
* Begitu akun diverifikasi oleh Admin, Anda akan menerima akses penuh ke seluruh ekosistem dashboard UII Connect.

---

## 💻 Panduan Pengguna: Dashboard & Fitur Alumni

Sebagai alumni terverifikasi, Anda memiliki akses penuh ke fitur sosial, komunikasi, dan karir. Berikut adalah penjelasan lengkap fungsi dan penggunaan fiturnya.

### 3.1 Beranda & Feed Komunitas
Halaman Beranda (`/dashboard`) adalah ruang utama interaksi sosial komunitas.
* **Membuat Postingan Baru:** Anda dapat membagikan pemikiran, tulisan, tautan, atau mengunggah gambar ke timeline.
* **Unggahan Gambar:** Maksimal kapasitas berkas adalah 5MB (sistem secara otomatis mengompres gambar untuk efisiensi performa).
* **Interaksi Sosial:** 
  * Anda dapat menyukai (*Like*) postingan alumni lain.
  * Berikan tanggapan atau opini konstruktif pada kolom komentar (*Comment*).
  * **Laporkan Postingan:** Jika melihat konten tidak pantas atau spam, klik ikon titik tiga `...` di pojok kanan postingan lalu pilih **Laporkan** untuk ditinjau oleh tim moderator.

### 3.2 Direktori & Jejaring Alumni
Direktori Alumni (`/direktori`) memudahkan Anda menemukan sesama alumni UII di seluruh Jawa Tengah.
* **Pencarian Cepat:** Cari alumni berdasarkan **Nama**.
* **Filter Akademik:** Saring data secara akurat berdasarkan **Program Studi (Prodi)** dan **Tahun Angkatan**.
* **Filter Wilayah/Instansi:** Temukan alumni yang bekerja di perusahaan tertentu untuk membuka potensi kerjasama bisnis.
* **Detail Profil:** Klik pada kartu nama alumni untuk mengunjungi profil publik mereka dan mempelajari kompetensi, portofolio, serta kontak sosial mereka.

### 3.3 Manajemen Koneksi & Pertemanan
Menghubungkan Anda langsung ke alumni lain via halaman `/koneksi`.
* **Tampilan Fleksibel (Grid / List):** Pada versi mobile, Anda dapat beralih ke format *List* minimalis agar memuat banyak data kontak di layar tanpa membuang-buang ruang scroll.
* **Kirim Permintaan (Connect):** Klik tombol **Connect** pada profil rekan yang ingin Anda tambahkan ke jejaring pertemanan pribadi Anda.
* **Terima/Tolak Permintaan:** Permintaan koneksi masuk dapat disetujui (*Accept*) atau ditolak (*Decline*) langsung melalui sub-tab koneksi masuk.
* **Indikator Status:** Status koneksi terbagi atas `Belum Terhubung`, `Menunggu Persetujuan` (Pending), dan `Terhubung`.

### 3.4 Sistem Pesan Real-Time (Chat)
Begitu terkoneksi/berteman dengan alumni lain, fitur chat pribadi (`/pesan`) otomatis terbuka.
* **Komunikasi Instan:** Menggunakan teknologi *Socket.io* untuk pengiriman pesan secara instan dan responsif.
* **Riwayat Percakapan:** Disimpan dengan aman, memudahkan Anda melanjutkan diskusi kolaborasi bisnis atau profesional kapan saja.
* **Indikator Notifikasi:** Pesan baru memicu notifikasi visual berupa lingkaran merah berisi jumlah pesan yang belum dibaca pada bilah navigasi utama Anda.

### 3.5 Forum Diskusi & Komunitas
Halaman Forum (`/diskusi`) merupakan wadah bertukar pikiran secara terstruktur berdasarkan topik/kategori tertentu.
* **Menjelajahi Kategori:** Pilih topik bahasan seperti *Teknologi*, *Bisnis & UMKM*, *Kesehatan*, *Info Kampus*, atau *Kegiatan IKA*.
* **Membuat Diskusi Baru:** Klik **Mulai Diskusi Baru**, masukkan judul menarik, deskripsi lengkap, serta kategori yang sesuai.
* **Tanggapan & Diskusi:** Berikan solusi atau tanggapan interaktif pada utas (*thread*) diskusi.
* **Moderasi Forum:** Konten diskusi yang melanggar ketentuan dapat dilaporkan ke Admin via tombol **Laporkan**.

### 3.6 Hub Karir & Lowongan Kerja (Loker)
Layanan Karir UII Connect (`/lowongan`) memfasilitasi pencarian kerja dan rekrutmen internal alumni.
* **Mencari Lowongan:** Filter lowongan berdasarkan judul pekerjaan, tipe waktu kerja (*Full-time, Part-time, Internship, Freelance*), lokasi kota, dan nama instansi.
* **Berbagi Informasi Loker:** Sebagai alumni, Anda dapat mengunggah lowongan kerja yang tersedia di instansi Anda saat ini.
* **Persetujuan Pengurus (Draft Loker):** Setiap loker yang diajukan oleh alumni akan masuk ke daftar *Draft* dan baru akan dipublikasikan ke publik setelah lolos peninjauan validitas oleh Pengurus IKA.

### 3.7 Profil Saya & Manajemen Portofolio
Profil Anda (`/profil/:id`) adalah kartu nama digital profesional Anda. Klik **Edit Profil** (`/profil/:id/edit`) untuk mengakses sistem konfigurasi data berlapis yang mencakup 7 tab berikut:

| Nama Tab | Deskripsi Informasi yang Dikelola |
| :--- | :--- |
| **Info Dasar** | Nama lengkap, nama panggilan, nomor telepon publik, program studi, angkatan, link media sosial pribadi, serta status visibilitas profil. |
| **Data Profil** | Deskripsi diri singkat (*biografi*), profesi saat ini, spesialisasi keahlian, instansi/perusahaan, jabatan, alamat lengkap tinggal, serta unggahan foto profil & foto sampul (cover). |
| **Portofolio** | Portofolio proyek atau hasil karya Anda. Lengkap dengan judul proyek, deskripsi pekerjaan, tanggal pengerjaan, dan tautan luar (*link* karya). |
| **Riwayat Pengalaman** | Daftar riwayat karir terdahulu hingga sekarang: nama instansi/perusahaan, posisi/jabatan, status kerja, rentang waktu bekerja, serta deskripsi pencapaian kerja Anda. |
| **Riwayat Pendidikan** | Riwayat studi formal Anda: nama institusi/universitas, gelar yang diperoleh, program studi, rentang tahun lulus, dan catatan prestasi akademik. |
| **Sertifikasi** | Koleksi lisensi profesional: nama sertifikat/lisensi, lembaga penerbit sertifikasi, tanggal penerbitan, tanggal kedaluwarsa (jika ada), nomor kredensial, dan URL pembuktian kredensial sertifikasi. |

---

## 🛠️ Panduan Pengurus & Admin: Dashboard Pengelolaan

Pengguna dengan status role **ADMIN** atau **PENGURUS** memiliki kendali penuh untuk memoderasi data dan memastikan ekosistem UII Connect berjalan tertib.

---

### 4.1 Dashboard Analitik Utama
Dashboard Admin (`/admin`) menyediakan statistik kinerja real-time:
* **Metrik Utama:** Jumlah total alumni terdaftar, jumlah alumni aktif/terverifikasi, pengajuan verifikasi akun pending, laporan konten masuk, jumlah lowongan kerja aktif, serta statistik postingan dan kegiatan IKA.

---

### 4.2 Manajemen Verifikasi & Akun Pengguna
Dikelola di menu **User Management** (`/admin/users`).
* **Verifikasi Alumni Baru:** Tinjau daftar alumni dengan status `PENDING`. Periksa keabsahan nama, program studi, dan angkatan mereka. Klik **Setujui** untuk memverifikasi akun mereka, atau **Tolak** jika data mencurigakan/palsu.
* **Perubahan Role Akun:** Admin utama dapat mengubah level akses pengguna dari `ALUMNI` menjadi `PENGURUS` atau `ADMIN`.
* **Suspend/Tangguhkan Akun:** Jika pengguna melakukan pelanggaran berat, Admin dapat mengklik tombol **Suspend** untuk mematikan akses akun tersebut secara permanen atau sementara.

---

### 4.3 Manajemen Berita & Pengumuman (Announcements)
Dikelola di menu **Berita & Pengumuman** (`/admin/announcements` atau `/pengurus/berita`).
* **Membuat Berita Baru:** Masukkan Judul Berita, Kategori (*Berita* / *Pengumuman*), serta Isi Berita secara lengkap menggunakan Tiptap Rich Text Editor.
* **Upload Gambar Berita:**
  * Anda diperbolehkan mengunggah 1 gambar utama (maksimal 5MB).
  * **Fleksibilitas Gambar:** Gambar bersifat **Opsional (boleh Null)**. Jika tidak menyertakan gambar, berita tetap dapat dibuat secara sukses (sistem otomatis menampilkan *placeholder* gambar resmi IKA UII Jateng).
* **Edit & Hapus Berita:** Anda dapat mengubah konten berita kapan saja atau menghapusnya jika konten sudah kedaluwarsa.

---

### 4.4 Manajemen Event & Kegiatan
Dikelola di menu **Manajemen Event** (`/admin/events` atau `/pengurus/events`).
* **Membuat Agenda Kegiatan:** Klik **Buat Event Baru**. Isi data wajib: Judul Kegiatan, Deskripsi Rinci, Tanggal Pelaksanaan, Waktu/Jam, Lokasi Fisik (atau Tautan Ruang Virtual), Tautan Pendaftaran Eksternal (jika ada), dan Gambar Pamflet Agenda.
* **Modifikasi Acara:** Sesuaikan detail atau hapus agenda jika terjadi pembatalan kegiatan.

---

### 4.5 Manajemen Lowongan Kerja (Loker)
Dikelola di menu **Verifikasi Loker** (`/admin/loker` or `/pengurus/lowongan`).
* **Persetujuan Pengajuan Alumni:** Semua lowongan kerja yang diunggah oleh pengguna biasa berstatus `DRAFT`.
* **Verifikasi Konten:** Pengurus harus memeriksa konten loker untuk menghindari penipuan atau spam iklan.
* **Publikasikan Loker:** Klik **Setujui / Publish** untuk mempublikasikannya secara resmi ke halaman karir alumni, atau **Tolak** untuk mengabaikan usulan.

---

### 4.6 Moderasi Konten & Sistem Laporan (Reports)
Dikelola di menu **Laporan Konten** (`/admin/laporan`).
* Setiap kali alumni melaporkan pengguna lain, postingan feed, atau komentar tidak pantas, laporan tersebut otomatis masuk ke tabel moderasi.
* **Tindakan Moderasi:**
  * **Abaikan Laporan:** Klik **Abaikan** jika laporan dirasa tidak valid/kurang bukti (konten tetap aman).
  * **Hapus Konten:** Klik **Hapus Konten** untuk melenyapkan postingan/komentar pelanggar dari sistem secara permanen.
  * **Sanksi Pengguna:** Klik **Suspend Pengguna** untuk memblokir akun pelaku penyebar spam atau konten SARA secara langsung.

---

### 4.7 Manajemen Kategori Forum
Dikelola di menu **Manajemen Forum** (`/admin/forum`).
* **Pembuatan Kategori:** Admin dapat menambahkan kategori diskusi baru (misalnya: *UMKM Alumni*, *Lowongan CPNS*, *Temu Alumni*, dll) agar komunikasi lebih terarah.
* **Moderasi Thread:** Admin memiliki kuasa penuh untuk memindahkan, menutup, atau menghapus utas diskusi (*thread*) yang keluar dari topik utama.

---

### 4.8 Manajemen Berkas Unggahan (File Manager)
Dikelola di menu **File Manager** (`/admin/files`).
* Menampilkan daftar semua file media (gambar, dokumen, pdf) yang pernah diunggah ke server oleh seluruh pengguna.
* **Optimasi Server:** Memudahkan Admin memantau penggunaan kapasitas penyimpanan disk server dan menghapus berkas-berkas sampah/kedaluwarsa untuk menghemat ruang *hosting*.

---

### 4.9 Kustomisasi Landing Page (Display Home Page)
Ini adalah modul paling dinamis (`/admin/display-home-page`) yang mengontrol elemen visual landing page utama tanpa perlu menyentuh baris kode program backend/frontend.

Menu Display Home Page dibagi menjadi beberapa segmen:
1. **Atur Kontak & Sosial Resmi:**
   * **Email Kontak:** Digunakan pada footer landing page dan alamat pengiriman formulir pesan masuk.
   * **Nomor HP WhatsApp:** Untuk mengarahkan tombol "Hubungi Kami" langsung ke chat WhatsApp resmi admin.
   * **Link Video YouTube:** Masukkan tautan video YouTube resmi profil IKA UII Jateng (misal: `https://www.youtube.com/watch?v=xxxxxx`). Sistem akan secara otomatis memformat video agar tampil responsif di bagian pemutar video landing page.
2. **Atur Statistik Keberhasilan:**
   * Masukkan jumlah **Alumni Aktif**, rata-rata **Kegiatan/Event per Tahun**, dan jumlah sebaran **Kabupaten/Kota Tercover**. Angka ini otomatis memperbarui visual counter statistik di bagian depan.
3. **Manajemen Banner & Visual Utama:**
   * **Upload Hero Image (Banner Utama):** Ganti background banner utama landing page dengan gambar resolusi tinggi.
   * **Upload Gambar Tentang Kami:** Ganti ilustrasi section Profil IKA UII Jateng.
   * **Upload Logo Navbar (Logo Utama):**
     * **Prosedur Penggunaan:** Klik tombol unggah berkas logo resmi institusi Anda.
     * **Sistem Kompresi Pintar:** Server otomatis memotong dan mengompres gambar Anda menjadi resolusi ideal **300x80px** (Retina density), memastikan website dimuat dengan sangat kencang.
     * **Proteksi Layout (Fixed Height):** Sistem layout landing page mengunci ukuran logo ini pada tinggi **40px** (`height: 40px !important`). Apapun dimensi file asli gambar yang Anda unggah, navigasi web dijamin **tidak akan rusak, tidak melenceng, dan tidak nabrak-nabrak menu lain**.
4. **Manajemen Alumni & Event Pilihan (Drag-and-Drop):**
   * Di tab **Alumni** dan **Event/Program**, Anda dapat memilih data alumni berprestasi atau berita pilihan mana saja yang ingin diletakkan di halaman depan.
   * **Fitur Drag-and-Drop:** Urutkan susunan kemunculan kartu profil/berita secara langsung dengan menggeser (*drag*) kartu-kartu visual tersebut ke urutan yang diinginkan.
   * Klik tombol **Simpan Urutan** untuk menerapkan perubahan susunan secara real-time.

---

## ❓ Pertanyaan yang Sering Diajukan (FAQ) & Kontak Bantuan

#### 1. Saya belum menerima Email Kode OTP saat registrasi, apa yang harus saya lakukan?
* Periksa folder **Spam/Junk/Promotions** pada email Anda. Beberapa layanan email seperti Gmail kadang menyaring email otomatis baru. Jika setelah 3 menit belum masuk, klik tombol **Kirim Ulang Kode OTP** di halaman verifikasi.

#### 2. Akun saya berstatus "Menunggu Verifikasi Admin", berapa lama prosesnya?
* Tim pengurus IKA UII Wilayah Jawa Tengah biasanya memverifikasi keanggotaan dalam waktu 1x24 jam hari kerja dengan membandingkan data pendaftaran Anda dengan database resmi alumni. Anda juga dapat menghubungi admin via kontak WhatsApp yang tersedia di landing page untuk mempercepat konfirmasi.

#### 3. Apakah saya bisa mengunggah lowongan kerja meskipun bukan Pengurus?
* **Bisa.** Seluruh alumni terverifikasi dapat mengunggah lowongan pekerjaan di halaman `/lowongan`. Namun, lowongan Anda tidak akan langsung tampil di beranda karir publik. Konten tersebut akan ditinjau terlebih dahulu oleh Pengurus demi menghindari indikasi penipuan lowongan kerja.

#### 4. Bagaimana cara menjaga akun saya agar tidak ditangguhkan (suspended)?
* Pastikan Anda memposting konten yang sopan, menghindari SARA, tidak membagikan informasi bohong (hoax), tidak melakukan spamming di feed diskusi, serta menghormati hak cipta dalam memposting media karya/portofolio.

---

### 📞 Kontak & Informasi Bantuan Lebih Lanjut
Jika Anda menemui kendala teknis atau memiliki pertanyaan terkait pengelolaan platform, jangan ragu untuk menghubungi tim pengembang atau administrator resmi melalui:
* **Surel Resmi:** `info@ikauiijateng.org`
* **Layanan WhatsApp Admin:** Hubungi nomor kontak yang tertera di kaki halaman (*footer*) situs UII Connect.

---
*Dokumentasi ini dibuat untuk memandu kemudahan interaksi dan mempererat kolaborasi keluarga besar alumni IKA UII Wilayah Jawa Tengah. Terus terhubung dan jalin kolaborasi bersama UII Connect!*
