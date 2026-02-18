# Setup Settings System

## Langkah-langkah Setup

### 1. Generate Prisma Client
```bash
cd APP/backend
npx prisma generate
```

### 2. Jalankan Migration
```bash
npx prisma migrate deploy
```
atau jika development:
```bash
npx prisma migrate dev
```

### 3. Jalankan Seed (untuk data default)
```bash
npm run prisma:seed
```

## Fitur yang Tersedia

### Backend API
- `GET /api/settings` - Get all settings (grouped by category)
- `GET /api/settings/:key` - Get single setting
- `PUT /api/settings/:key` - Update setting
- `POST /api/settings` - Create new setting (admin only)

### Frontend
- Halaman Settings di `/admin/settings`
- Menu "Pengaturan" di sidebar admin
- Form untuk mengelola email notifikasi admin (multiple emails)
- Dummy settings untuk preview (AI API Key, Site Name, dll)

## Default Settings

Setelah seed, akan ada settings berikut:
- **admin_notification_emails**: `["gadinglalala121212@gmail.com"]` (JSON array)
- **ai_openai_api_key**: Empty string
- **site_name**: "Sistem Alumni DPW IKA UII JATENG"
- **site_description**: "Platform jejaring alumni untuk DPW IKA UII JATENG"
- **max_file_size**: 5242880 (bytes)
- **enable_registration**: true

## Catatan

- Email notifikasi admin sekarang diambil dari settings, bukan dari semua user dengan role ADMIN
- Jika settings tidak ada, sistem akan fallback ke semua admin user
- Settings disimpan sebagai JSON array untuk multiple emails

