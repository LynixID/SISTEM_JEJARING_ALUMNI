# Rekap Deployment LynixID (Sistem Jejaring Alumni)

Dokumen ini mencatat langkah-langkah yang dilakukan untuk mendeploy aplikasi ke VPS aaPanel pada 14 April 2026.

## 1. Persiapan Server (aaPanel)
- **Instalasi AppStore**: Menginstal Nginx, MySQL, dan Node.js Version Manager.
- **Node.js Setup**: Menginstal Node v20 dan memastikan perintah `node` bisa diakses melalui CLI (Terminal) dengan melakukan manual link `ln -sf`.
- **PM2**: Menginstal PM2 secara global (`npm install -g pm2`) untuk menjaga backend tetap berjalan.

## 2. Persiapan File (Lokal)
- **Backend**: Melakukan zip folder backend tanpa menyertakan `node_modules`.
- **Frontend**: 
    - Memperbarui `frontend/.env` dengan URL produksi:
    ```env
    VITE_API_URL=https://lynix.fun/api
    VITE_SOCKET_URL=https://lynix.fun
    VITE_GOOGLE_CLIENT_ID=319115318119-r03ib909qpp0l82hu65s336m4a97mjgu.apps.googleusercontent.com
    ```
    - Menjalankan `npm run build` untuk menghasilkan folder `dist`.
    - Melakukan zip isian folder `dist`.

## 3. Deployment Backend
- **Upload & Extract**: Mengunggah `backend.zip` ke folder `/www/wwwroot/lynix.fun/api` dan mengekstraknya.
- **Environment (.env)**: Update file `.env` di dalam folder `api` server:
    ```env
    DATABASE_URL="mysql://USER:PASSWORD@localhost:3306/DATABASE_NAME"
    FRONTEND_URL="https://lynix.fun"
    NODE_ENV="production"
    PORT=5000
    # Copy SMTP/Email settings dari local .env
    ```
- **Setup Perintah**:
    - `npm install`: Instalasi dependensi.
    - `npx prisma generate`: Menyiapkan client database.
    - `npx prisma migrate deploy`: Menjalankan migrasi schema ke database server.
    - `npm run prisma:seed`: Mengisi data awal akun admin dan pengaturan situs.
- **Process Manager**: Menjalankan server menggunakan PM2 (`alumni-backend`) agar backend berjalan terus-menerus.

## 4. Deployment Frontend & Nginx
- **Files**: Mengunggah dan mengekstrak isi `dist` langsung ke root folder `/www/wwwroot/lynix.fun`.
- **Nginx Configuration**: Tambahkan kode berikut di dalam menu **Config** website di aaPanel:
```nginx
    # API Proxy
    location /api {
        proxy_pass http://127.0.0.1:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }

    # Socket.io Proxy (Real-time)
    location /socket.io {
        proxy_pass http://127.0.0.1:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "Upgrade";
        proxy_set_header Host $host;
    }

    # SPA Routing
    location / {
        try_files $uri $uri/ /index.html;
    }
```
- **SSL**: Mengaktifkan Let's Encrypt dan Force HTTPS agar koneksi aman.

---

### Kredensial Default:
- **Admin:** `admin@demo.com` / `password123`
- **Pengurus:** `pengurus@demo.com` / `password123`
- **Alumni:** `alumni@demo.com` / `password123`

---
**Status: BERHASIL DEPLOYED 🚀**
