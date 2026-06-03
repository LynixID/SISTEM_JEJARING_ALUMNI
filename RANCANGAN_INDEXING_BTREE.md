# Rancangan Optimalisasi Database: MySQL B-Tree Indexing
**Studi Kasus: Aplikasi Portal Jejaring Alumni**

Dokumen ini memuat analisis, rekomendasi penambahan indeks B-Tree, kode Prisma schema yang diperlukan, dan cara mengujinya di masa mendatang ketika data sistem Anda mulai mencapai puluhan hingga ratusan ribu baris.

---

## 1. Pendahuluan & Potensi Bottleneck Data
Dalam aplikasi Jejaring Alumni, database akan mengalami pertumbuhan yang tidak merata. Seiring waktu, tabel relasi interaksi sosial dan komunikasi akan menumpuk jauh lebih cepat dibanding tabel profil dasar.

Tabel yang berpotensi menjadi *bottleneck* (membuat sistem lambat) di antaranya:
* **Tabel Pesan (`messages` & `discussion_messages`)** - Mengakomodasi chat real-time antar alumni.
* **Tabel Notifikasi (`notifications`)** - Mencatat setiap riwayat aktivitas yang perlu diberitahukan ke user.
* **Tabel Komentar & Like (`comments` & `likes`)** - Menampung jutaan interaksi feed postingan.
* **Tabel Antrean Email (`mail_queues`)** - Menampung ribuan email sistem sebelum dikirim oleh worker.

---

## 2. Rancangan Penerapan B-Tree Index (Prisma Schema)

Berikut adalah detail rekomendasi indeks komposit dan indeks tunggal yang dapat disalin ke dalam berkas `backend/prisma/schema.prisma` Anda di kemudian hari:

### A. Fitur Chat / Pesan Langsung (`Message`)
* **Kasus Penggunaan**: Membuka halaman percakapan dua arah antara Alumni A dan Alumni B secara kronologis (`createdAt DESC`).
* **Modifikasi Model `Message`**:
  ```prisma
  model Message {
    id         String   @id @default(uuid())
    content    String   @db.Text
    senderId   String
    receiverId String
    createdAt  DateTime @default(now())
    // ... field lainnya

    // Tambahkan 2 Indeks Komposit B-Tree di bagian bawah model
    @@index([senderId, receiverId, createdAt])
    @@index([receiverId, senderId, createdAt])
    @@map("messages")
  }
  ```

### B. Fitur Notifikasi Aktif (`Notification`)
* **Kasus Penggunaan**: Memuat daftar notifikasi yang belum dibaca (`read = false`) milik alumni tertentu diurutkan dari yang terbaru.
* **Modifikasi Model `Notification`**:
  ```prisma
  model Notification {
    id        String   @id @default(uuid())
    userId    String
    read      Boolean  @default(false)
    createdAt DateTime @default(now())
    // ... field lainnya

    // Tambahkan indeks komposit ini
    @@index([userId, read, createdAt]) // Untuk notifikasi belum dibaca
    @@index([userId, createdAt])       // Untuk tab "semua" notifikasi
    @@map("notifications")
  }
  ```

### C. Fitur Komentar Postingan (`Comment`)
* **Kasus Penggunaan**: Menampilkan utas komentar berurutan (`createdAt ASC`) per postingan, menyaring antara komentar utama (di mana `parentId` bernilai `null`) dan balasannya.
* **Modifikasi Model `Comment`**:
  ```prisma
  model Comment {
    id        String   @id @default(uuid())
    postId    String
    parentId  String?
    createdAt DateTime @default(now())
    // ... field lainnya

    // Ganti indeks lama dengan indeks komposit berikut
    @@index([postId, parentId, createdAt])
    @@map("comments")
  }
  ```

### D. Fitur Jejak Menyukai Postingan (`Like`)
* **Kasus Penggunaan**: Menampilkan daftar postingan yang disukai oleh alumni tertentu (`WHERE userId = ?`). Indeks gabungan bawaan `[postId, userId]` tidak efisien untuk pencarian berdasar `userId` saja karena aturan *Leftmost Prefix*.
* **Modifikasi Model `Like`**:
  ```prisma
  model Like {
    id        String   @id @default(uuid())
    postId    String
    userId    String
    // ...

    // Tambahkan indeks tunggal untuk pencarian berdasarkan user
    @@index([userId])
    @@map("likes")
  }
  ```

### E. Fitur Peserta Event (`EventParticipant`)
* **Kasus Penggunaan**: Menampilkan semua daftar event yang diikuti oleh alumni tertentu (`WHERE userId = ?`).
* **Modifikasi Model `EventParticipant`**:
  ```prisma
  model EventParticipant {
    id      String @id @default(uuid())
    eventId String
    userId  String

    // Tambahkan indeks tunggal untuk pencarian berdasarkan user
    @@index([userId])
    @@map("event_participants")
  }
  ```

### F. Fitur Antrean Email Massal (`MailQueue`)
* **Kasus Penggunaan**: Background worker/cronjob memproses antrean email secara kronologis untuk status yang tertunda (`WHERE status = 'PENDING' ORDER BY createdAt ASC`).
* **Modifikasi Model `MailQueue`**:
  ```prisma
  model MailQueue {
    id        String   @id @default(uuid())
    status    String   @default("PENDING")
    createdAt DateTime @default(now())
    // ...

    // Ganti @@index([status]) lama dengan indeks komposit ini
    @@index([status, createdAt])
    @@map("mail_queues")
  }
  ```

---

## 3. Langkah-Langkah Penerapan di Masa Depan
Jika Anda siap menerapkan perubahan indeks ini ke database production/development Anda:

1. **Buka Berkas**: `backend/prisma/schema.prisma`
2. **Tambahkan Deklarasi Indeks**: Tempelkan sintaks `@@index([...])` yang direkomendasikan di atas ke bagian bawah masing-masing model.
3. **Jalankan Migrasi**: Buka terminal di direktori `/backend` dan jalankan perintah:
   ```bash
   npx prisma migrate dev --name tambahkan_indeks_btree_performa
   ```
   *Prisma akan otomatis membaca perubahan skema, membuat berkas migrasi SQL, dan menerapkannya langsung ke server MySQL Anda.*
4. **Verifikasi Jalannya Indeks**:
   Gunakan MySQL Client (misal DBeaver atau phpMyAdmin) untuk menjalankan query lambat dengan kata kunci `EXPLAIN` di depannya:
   ```sql
   EXPLAIN SELECT * FROM notifications WHERE userId = "id-user-anda" AND `read` = false ORDER BY createdAt DESC;
   ```
   Pastikan nilai pada kolom `key` merujuk ke nama indeks komposit yang baru dibuat (bukan bernilai `NULL`).
