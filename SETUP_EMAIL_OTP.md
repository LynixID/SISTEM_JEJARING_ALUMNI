# 📧 Setup Email OTP & Notifikasi

## Langkah-langkah Setup

### 1. Setup Gmail App Password

1. **Aktifkan 2-Step Verification:**
   - Buka: https://myaccount.google.com/security
   - Aktifkan "2-Step Verification" jika belum aktif

2. **Buat App Password:**
   - Buka: https://myaccount.google.com/apppasswords
   - Pilih "Mail" dan "Other (Custom name)"
   - Masukkan nama: "Alumni System"
   - Klik "Generate"
   - **SALIN PASSWORD** yang dihasilkan (16 karakter, tanpa spasi)

### 2. Update Environment Variables

Edit file `APP/backend/.env` dan tambahkan:

```env
# Email Configuration
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_SECURE=false
EMAIL_USER=your-email@gmail.com
EMAIL_PASSWORD=your-16-char-app-password
EMAIL_FROM=noreply@alumni-system.com
EMAIL_FROM_NAME=Sistem Alumni DPW IKA UII JATENG

# OTP Configuration
OTP_EXPIRY_MINUTES=10
OTP_LENGTH=6
```

**Contoh:**
```env
EMAIL_USER=admin@example.com
EMAIL_PASSWORD=abcd efgh ijkl mnop
```

### 3. Update Database Schema

Jalankan migration untuk menambahkan field OTP dan model AdminNotification:

```bash
cd APP/backend
npm run prisma:migrate
npm run prisma:generate
```

### 4. Test Email Configuration

Jalankan server backend:

```bash
cd APP/backend
npm run dev
```

Cek console, seharusnya muncul:
```
Email server is ready to send messages
```

Jika ada error, periksa:
- Email dan password sudah benar
- 2-Step Verification sudah aktif
- App Password sudah dibuat dengan benar

## Flow Registrasi Baru

1. **User isi form registrasi** → Submit
2. **Request OTP** → Email dikirim ke user
3. **User input OTP** di halaman verifikasi
4. **Verify OTP** → Jika valid:
   - User dibuat dengan `emailVerified=true`, `verified=false`
   - Email notifikasi dikirim ke admin
   - Notifikasi dibuat di dashboard admin
5. **Admin verifikasi** → User bisa login

## Endpoint API

### Auth Endpoints:
- `POST /api/auth/register/request-otp` - Request OTP
- `POST /api/auth/register/verify-otp` - Verify OTP & Register
- `POST /api/auth/register/resend-otp` - Resend OTP

### Notification Endpoints:
- `GET /api/admin/notifications` - Get all notifications
- `PATCH /api/admin/notifications/:id/read` - Mark as read
- `PATCH /api/admin/notifications/read-all` - Mark all as read
- `DELETE /api/admin/notifications/:id` - Delete notification

## Troubleshooting

### Error: "Invalid login"
- Pastikan App Password sudah benar (16 karakter)
- Pastikan 2-Step Verification sudah aktif

### Error: "Connection timeout"
- Cek koneksi internet
- Pastikan port 587 tidak diblokir firewall

### Email tidak terkirim
- Cek spam folder
- Pastikan email tujuan valid
- Cek console backend untuk error message

### OTP tidak diterima
- Cek spam folder
- Pastikan email sudah benar
- Coba resend OTP

## Catatan Penting

1. **Gmail App Password** hanya bisa digunakan sekali, jika hilang harus buat baru
2. **OTP berlaku 10 menit** (bisa diubah di `.env`)
3. **Rate limiting** disarankan untuk production (maks 3 request per 15 menit)
4. **Untuk production**, pertimbangkan menggunakan layanan email profesional:
   - SendGrid (free: 100 email/hari)
   - Mailgun (free: 5,000 email/bulan)
   - AWS SES (pay as you go)
   - Resend (free: 3,000 email/bulan)

## Testing

1. **Test Request OTP:**
   ```bash
   curl -X POST http://localhost:5000/api/auth/register/request-otp \
     -H "Content-Type: application/json" \
     -d '{"email":"test@example.com"}'
   ```

2. **Test Verify OTP:**
   ```bash
   curl -X POST http://localhost:5000/api/auth/register/verify-otp \
     -H "Content-Type: application/json" \
     -d '{
       "email":"test@example.com",
       "otp":"123456",
       "password":"password123",
       "nama":"Test User",
       "nim":"123456789",
       "prodi":"Teknik Informatika",
       "angkatan":"2020",
       "domisili":"Jakarta",
       "whatsapp":"081234567890"
     }'
   ```

---

**Setelah setup selesai, sistem email OTP siap digunakan! 🚀**


