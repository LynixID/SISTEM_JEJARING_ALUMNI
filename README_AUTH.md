# 🔐 Sistem Autentikasi - Login & Register

Dokumentasi lengkap untuk sistem autentikasi dengan Login, Register, dan Admin Management.

---

## ✅ Fitur yang Sudah Dibuat

### Backend
- ✅ Register endpoint dengan validasi
- ✅ Login endpoint dengan JWT
- ✅ Middleware authentication
- ✅ Admin routes untuk management user
- ✅ Seed data untuk 3 user (Alumni, Pengurus, Administrator)

### Frontend
- ✅ Halaman Login sesuai DEMO-SISTEM
- ✅ Halaman Register sesuai DEMO-SISTEM
- ✅ Admin page untuk management user (hanya tampilkan Alumni & Pengurus)
- ✅ AuthContext untuk state management
- ✅ Protected routes
- ✅ Common components (Input, Button, Card)

---

## 🚀 Cara Menjalankan

### 1. Setup Database & Seed Data

```bash
cd APP/backend

# Pastikan migration sudah dijalankan
npm run prisma:migrate

# Jalankan seed untuk membuat 3 user demo
npm run prisma:seed
```

### 2. Jalankan Backend

```bash
cd APP/backend
npm run dev
```

Backend akan berjalan di `http://localhost:5000`

### 3. Jalankan Frontend

```bash
cd APP/frontend
npm run dev
```

Frontend akan berjalan di `http://localhost:5173`

---

## 👤 Demo Credentials

Setelah menjalankan seed, gunakan credentials berikut:

### Alumni
- **Email:** `alumni@demo.com`
- **Password:** `password123`
- **Role:** ALUMNI
- **Status:** Verified

### Pengurus
- **Email:** `pengurus@demo.com`
- **Password:** `password123`
- **Role:** PENGURUS
- **Status:** Verified

### Administrator
- **Email:** `admin@demo.com`
- **Password:** `password123`
- **Role:** ADMIN
- **Status:** Verified

---

## 📁 Struktur File

### Backend
```
backend/
├── src/
│   ├── modules/
│   │   ├── auth/
│   │   │   ├── authController.js    # Login, Register logic
│   │   │   └── authRoutes.js        # Auth routes
│   │   └── admin/
│   │       ├── adminController.js   # Admin management logic
│   │       └── adminRoutes.js       # Admin routes
│   ├── middleware/
│   │   └── auth.js                  # JWT verification & role check
│   ├── config/
│   │   ├── database.js              # Prisma client
│   │   └── socket.js                # Socket.io config
│   └── server.js                    # Express server
└── prisma/
    ├── schema.prisma                # Database schema
    └── seed.js                      # Seed data
```

### Frontend
```
frontend/
├── src/
│   ├── components/
│   │   └── common/
│   │       ├── Input.jsx            # Input component
│   │       ├── Button.jsx           # Button component
│   │       └── Card.jsx             # Card component
│   ├── pages/
│   │   ├── Login.jsx                # Login page
│   │   ├── Register.jsx             # Register page
│   │   └── admin/
│   │       └── UserManagement.jsx   # Admin user management
│   ├── context/
│   │   └── AuthContext.jsx           # Auth state management
│   ├── services/
│   │   └── api.js                    # Axios configuration
│   └── App.jsx                       # Main app with routing
```

---

## 🔑 API Endpoints

### Auth Endpoints

#### POST `/api/auth/register`
Register user baru (status: PENDING)

**Request Body:**
```json
{
  "nama": "Ahmad Fauzi",
  "nim": "123456789",
  "email": "ahmad@example.com",
  "password": "password123",
  "whatsapp": "081234567890",
  "prodi": "Teknik Informatika",
  "angkatan": 2015,
  "domisili": "Semarang",
  "profesi": "Software Engineer"
}
```

**Response:**
```json
{
  "message": "Registrasi berhasil! Menunggu verifikasi dari admin.",
  "user": {
    "id": "...",
    "email": "ahmad@example.com",
    "nama": "Ahmad Fauzi",
    "role": "ALUMNI",
    "verified": false
  }
}
```

#### POST `/api/auth/login`
Login user

**Request Body:**
```json
{
  "email": "alumni@demo.com",
  "password": "password123"
}
```

**Response:**
```json
{
  "message": "Login berhasil",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refreshToken": "...",
  "user": {
    "id": "...",
    "email": "alumni@demo.com",
    "nama": "Ahmad Fauzi",
    "role": "ALUMNI",
    "verified": true
  }
}
```

#### GET `/api/auth/me`
Get current user (requires token)

**Headers:**
```
Authorization: Bearer <token>
```

**Response:**
```json
{
  "user": {
    "id": "...",
    "email": "...",
    "nama": "...",
    "role": "...",
    "verified": true
  }
}
```

### Admin Endpoints (Requires ADMIN role)

#### GET `/api/admin/users`
Get all users (Alumni & Pengurus only)

**Query Parameters:**
- `page` - Page number (default: 1)
- `limit` - Items per page (default: 10)
- `search` - Search by name, email, or NIM
- `verified` - Filter by verified status (true/false)
- `role` - Filter by role (ALUMNI/PENGURUS)

**Response:**
```json
{
  "users": [...],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 50,
    "totalPages": 5
  }
}
```

#### GET `/api/admin/statistics`
Get user statistics

**Response:**
```json
{
  "statistics": {
    "totalUsers": 50,
    "verifiedUsers": 45,
    "pendingUsers": 5,
    "alumniCount": 40,
    "pengurusCount": 10
  }
}
```

#### PATCH `/api/admin/users/:id/verify`
Verify user

**Response:**
```json
{
  "message": "User berhasil diverifikasi",
  "user": {...}
}
```

#### PATCH `/api/admin/users/:id/reject`
Reject user (delete user)

**Response:**
```json
{
  "message": "User berhasil ditolak dan dihapus"
}
```

#### PATCH `/api/admin/users/:id/role`
Update user role

**Request Body:**
```json
{
  "role": "PENGURUS"
}
```

**Response:**
```json
{
  "message": "Role user berhasil diupdate",
  "user": {...}
}
```

---

## 🛡️ Security Features

1. **Password Hashing** - Menggunakan bcryptjs
2. **JWT Authentication** - Token-based auth
3. **Role-Based Access Control** - Middleware untuk cek role
4. **Input Validation** - Menggunakan express-validator
5. **CORS Protection** - Hanya frontend yang diizinkan
6. **Helmet** - Security headers

---

## 📝 Catatan Penting

1. **User yang baru register** akan memiliki status `verified: false`
2. **Admin harus verifikasi** user sebelum bisa login
3. **Administrator tidak muncul** di list user management (sengaja di-exclude)
4. **Token disimpan** di localStorage
5. **Token expired** akan auto redirect ke login

---

## 🐛 Troubleshooting

### Error: "Email sudah terdaftar"
- User dengan email tersebut sudah ada di database
- Gunakan email lain atau hapus user yang ada

### Error: "Token expired"
- Token sudah kadaluarsa
- User harus login ulang

### Error: "Forbidden: Insufficient permissions"
- User tidak punya akses (bukan admin)
- Pastikan login sebagai admin

### Error: "Database connection failed"
- Cek `.env` DATABASE_URL
- Pastikan MySQL running
- Pastikan database sudah dibuat

---

## ✅ Checklist Testing

- [ ] Seed data berhasil dijalankan
- [ ] Backend server running
- [ ] Frontend server running
- [ ] Bisa register user baru
- [ ] Bisa login dengan credentials demo
- [ ] Admin bisa akses user management
- [ ] Admin bisa verifikasi user
- [ ] Admin bisa ubah role user
- [ ] Admin bisa reject user
- [ ] Filter & search bekerja
- [ ] Pagination bekerja

---

**Selamat! Sistem autentikasi sudah siap digunakan! 🎉**


