# Initial Setup Guide - YesMan Application

## Overview

YesMan application memiliki sistem **Initial Setup Wizard** yang secara otomatis membuat Super Administrator pertama ketika aplikasi baru diinstall dan belum memiliki user sama sekali (users == 0).

## Cara Kerja Initial Setup

### 1. Deteksi Kebutuhan Setup

Sistem akan otomatis mendeteksi apakah initial setup diperlukan dengan mengecek:
- **Jumlah user di database** - Jika users == 0, maka setup diperlukan
- **Keberadaan Super Admin** - Jika belum ada user dengan role `super_admin`

### 2. Akses Setup Wizard

#### Melalui Web Interface
- Buka browser dan akses: `http://localhost:3000/setup`
- Halaman akan otomatis mendeteksi apakah setup diperlukan
- Jika tidak diperlukan, akan redirect ke halaman login

#### Melalui API Endpoint
- **GET** `/api/setup/initial` - Cek status setup
- **POST** `/api/setup/initial` - Jalankan setup wizard
- **DELETE** `/api/setup/initial` - Reset setup (development only)

### 3. Proses Setup Otomatis

Ketika setup dijalankan, sistem akan:

1. **Validasi Keamanan**
   - Memastikan tidak ada user di database
   - Memastikan belum ada Super Admin
   - Mencegah eksekusi ganda

2. **Pembuatan Super Admin**
   - Email: `admin@company.com`
   - Password: `admin123` (temporary)
   - Name: `Super Administrator`
   - Role: `super_admin`
   - Status: Active

3. **Assignment Role**
   - Assign role `super_admin` ke user yang baru dibuat
   - Rollback otomatis jika gagal

## Keamanan dan Validasi

### Validasi Ketat
- ✅ **Single Execution**: Wizard hanya bisa dijalankan sekali
- ✅ **Zero Users Only**: Hanya aktif ketika users == 0
- ✅ **No Existing Super Admin**: Tidak bisa membuat jika sudah ada
- ✅ **Automatic Rollback**: Rollback otomatis jika ada error
- ✅ **Security Logging**: Log semua aktivitas setup

### Proteksi Endpoint
- Endpoint `/api/setup/initial` ditambahkan ke **public routes**
- Tidak memerlukan authentication (karena belum ada user)
- Validasi ketat di level service

## Penggunaan

### Scenario 1: Fresh Installation
```bash
# 1. Install dan setup database
npm install
npm run db:migrate

# 2. Start aplikasi
npm run dev

# 3. Akses setup wizard
# Browser: http://localhost:3000/setup
# Atau API: POST http://localhost:3000/api/setup/initial
```

### Scenario 2: Cek Status Setup
```bash
# API Call
curl -X GET http://localhost:3000/api/setup/initial

# Response jika perlu setup:
{
  "success": true,
  "needsSetup": true,
  "message": "Initial setup is required"
}

# Response jika tidak perlu setup:
{
  "success": true,
  "needsSetup": false,
  "message": "System is already initialized"
}
```

### Scenario 3: Jalankan Setup
```bash
# API Call
curl -X POST http://localhost:3000/api/setup/initial

# Response sukses:
{
  "success": true,
  "data": {
    "setupCompleted": true,
    "credentials": {
      "email": "admin@company.com",
      "password": "admin123",
      "warning": "Please change this password immediately..."
    }
  }
}
```

## Setelah Setup

### 1. Login Pertama
- Email: `admin@company.com`
- Password: `admin123`
- **WAJIB** ganti password setelah login pertama

### 2. Manajemen User Selanjutnya
Setelah Super Admin dibuat, semua user lain harus dibuat melalui:
- **Register Process** - Pendaftaran normal
- **Invite System** - Undangan dari admin
- **Admin Panel** - Pembuatan manual oleh admin

### 3. Setup Wizard Disabled
- Wizard otomatis **disabled** setelah ada user
- Tidak bisa dijalankan lagi kecuali database di-reset
- Keamanan: Mencegah pembuatan Super Admin ganda

## Development & Testing

### Reset Setup (Development Only)
```bash
# Hanya tersedia di development mode
curl -X DELETE http://localhost:3000/api/setup/initial

# Atau reset database
npm run db:reset
npm run db:migrate
```

### Environment Variables
```env
# Setup wizard configuration
NODE_ENV=development  # Untuk enable reset endpoint
```

## Troubleshooting

### Problem: Setup tidak muncul
**Solusi:**
1. Cek jumlah user di database: `SELECT COUNT(*) FROM users`
2. Jika ada user, setup tidak akan muncul
3. Untuk testing, reset database atau hapus semua user

### Problem: Setup gagal
**Solusi:**
1. Cek log aplikasi untuk error detail
2. Pastikan database connection aktif
3. Pastikan role `super_admin` ada di sistem
4. Cek permission database untuk create user

### Problem: Tidak bisa login setelah setup
**Solusi:**
1. Pastikan credentials: `admin@company.com` / `admin123`
2. Cek status user di database: `SELECT * FROM users WHERE email = 'admin@company.com'`
3. Cek role assignment: `SELECT * FROM user_roles WHERE user_id = ?`

## File Structure

```
src/
├── app/
│   ├── setup/
│   │   └── page.tsx                 # Setup wizard UI
│   └── api/setup/initial/
│       └── route.ts                 # Setup API endpoint
├── services/
│   └── setup/
│       └── initialSetupService.ts   # Setup business logic
└── middleware/
    └── routeMatcher.ts              # Public routes config
```

## Security Best Practices

1. **Ganti Password Default**
   - Password `admin123` harus diganti immediately
   - Gunakan password yang kuat dan unik

2. **Monitor Setup Activity**
   - Log semua aktivitas setup
   - Alert jika ada attempt setup yang mencurigakan

3. **Database Security**
   - Pastikan database connection secure
   - Gunakan environment variables untuk credentials

4. **Production Deployment**
   - Disable development endpoints di production
   - Monitor access ke setup endpoints
   - Backup database sebelum setup

---

**Note**: Initial Setup Wizard adalah fitur one-time yang dirancang untuk kemudahan deployment aplikasi baru. Setelah Super Admin dibuat, gunakan sistem manajemen user normal untuk operasi selanjutnya.