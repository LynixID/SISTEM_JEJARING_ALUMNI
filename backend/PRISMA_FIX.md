# 🔧 Fix Prisma Error

## Masalah
Error: `Using engine type "client" requires either "adapter" or "accelerateUrl"`

## Penyebab
Prisma 7 memerlukan adapter yang belum tersedia untuk MySQL, atau konfigurasi yang kompleks.

## Solusi
Downgrade ke Prisma 6 yang lebih stabil dan tidak memerlukan adapter.

## Yang Sudah Diperbaiki

1. ✅ Downgrade Prisma ke v6.0.0
2. ✅ Update `schema.prisma` - Tambah `url = env("DATABASE_URL")`
3. ✅ Update `database.js` - Hapus adapter, gunakan format Prisma 6
4. ✅ Hapus `prisma.config.ts` - Tidak diperlukan di Prisma 6

## Langkah Selanjutnya

### 1. Install ulang dependencies
```bash
cd APP/backend
rm -rf node_modules package-lock.json
npm install
```

### 2. Generate Prisma Client ulang
```bash
npm run prisma:generate
```

### 3. Restart server
```bash
npm run dev
```

## Perubahan File

### package.json
- `@prisma/client`: `^7.2.0` → `^6.0.0`
- `prisma`: `^7.2.0` → `^6.0.0`

### prisma/schema.prisma
```prisma
datasource db {
  provider = "mysql"
  url      = env("DATABASE_URL")  // Ditambahkan
}
```

### src/config/database.js
```javascript
const prisma = new PrismaClient({
  log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
})
// Tidak perlu adapter
```

---

**Setelah install ulang, server akan berjalan! 🚀**


