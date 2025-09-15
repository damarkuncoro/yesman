# HTTP Testing Files untuk YesMan API

File ini berisi panduan untuk menggunakan file `.http` yang telah dibuat untuk testing API YesMan.

## File yang Tersedia

### 1. `api-tests.http`
File lengkap yang berisi semua endpoint API yang tersedia dalam sistem YesMan.

**Fitur:**
- ✅ Semua endpoint Authentication
- ✅ User Management lengkap
- ✅ RBAC (Roles, Features, Route Features)
- ✅ ABAC (Policies, Attributes)
- ✅ Audit & Monitoring
- ✅ Dashboard & Analytics
- ✅ Administration
- ✅ Error Testing scenarios

### 2. `quick-test.http`
File untuk quick testing dengan flow yang paling umum digunakan.

**Fitur:**
- ✅ Authentication flow lengkap
- ✅ User management dasar
- ✅ RBAC testing
- ✅ Dashboard statistics
- ✅ Permission testing
- ✅ Error scenarios
- ✅ Cleanup operations

## Cara Menggunakan

### Prerequisites
1. **VS Code** dengan extension **REST Client** atau **Thunder Client**
2. **Server YesMan** harus berjalan di `http://localhost:3000`
3. **Database** sudah di-setup dengan data awal

### Setup Awal

1. **Jalankan server development:**
   ```bash
   pnpm dev
   ```

2. **Update variables di file .http:**
   ```http
   @baseUrl = http://localhost:3000
   @adminEmail = admin@yesman.com
   @adminPassword = admin123
   ```

### Testing Flow Recommended

#### Untuk Development Harian:
**Gunakan `quick-test.http`**

1. **Health Check** - Pastikan server berjalan
2. **Login Admin** - Dapatkan token admin
3. **Test basic operations** - User management, roles, features
4. **Check dashboard** - Statistik dan monitoring

#### Untuk Testing Komprehensif:
**Gunakan `api-tests.http`**

1. **Authentication testing** - Semua skenario login/logout
2. **RBAC testing** - Roles, features, permissions
3. **ABAC testing** - Policies dan attributes
4. **Audit testing** - Logs dan monitoring
5. **Error scenarios** - Rate limiting, unauthorized access

## Variables yang Dapat Dikustomisasi

### Global Variables
```http
@baseUrl = http://localhost:3000
@token = your_jwt_token_here
@userId = 1
@roleId = 1
@featureId = 1
@policyId = 1
@attributeId = 1
```

### Authentication Variables
```http
@adminEmail = admin@yesman.com
@adminPassword = admin123
@testEmail = test@yesman.com
@testPassword = test123
```

## Tips Penggunaan

### 1. **Response Chaining**
Dalam `quick-test.http`, response dari request sebelumnya dapat digunakan:
```http
# @name loginAdmin
POST {{baseUrl}}/api/v1/auth/login

### Gunakan token dari response login
GET {{baseUrl}}/api/v1/users/profile
Authorization: Bearer {{loginAdmin.response.body.data.token}}
```

### 2. **Environment Setup**
Buat file `.vscode/settings.json` untuk konfigurasi REST Client:
```json
{
  "rest-client.environmentVariables": {
    "development": {
      "baseUrl": "http://localhost:3000",
      "adminEmail": "admin@yesman.com",
      "adminPassword": "admin123"
    },
    "production": {
      "baseUrl": "https://api.yesman.com",
      "adminEmail": "admin@production.com",
      "adminPassword": "secure_password"
    }
  }
}
```

### 3. **Testing Sequence**
Untuk testing yang efektif, ikuti urutan ini:

1. **Health Check** → Pastikan server aktif
2. **Authentication** → Login dan dapatkan token
3. **Basic Operations** → CRUD operations
4. **Permission Testing** → Test dengan user berbeda
5. **Error Scenarios** → Test edge cases
6. **Cleanup** → Logout dan bersihkan data test

## Common Issues & Solutions

### 1. **Server Not Running**
```
Error: connect ECONNREFUSED 127.0.0.1:3000
```
**Solution:** Jalankan `pnpm dev` terlebih dahulu

### 2. **Invalid Token**
```json
{
  "success": false,
  "error": "Invalid token",
  "code": "UNAUTHORIZED"
}
```
**Solution:** Login ulang untuk mendapatkan token baru

### 3. **Rate Limiting**
```json
{
  "success": false,
  "error": "Too many requests",
  "code": "RATE_LIMIT_EXCEEDED"
}
```
**Solution:** Tunggu beberapa menit atau restart server dalam mode development

### 4. **Permission Denied**
```json
{
  "success": false,
  "error": "Insufficient permissions",
  "code": "FORBIDDEN"
}
```
**Solution:** Gunakan token admin atau user dengan permission yang sesuai

## Development Mode Features

Dalam mode development (`NODE_ENV=development`):
- ✅ **Rate limiting disabled** - Tidak ada batasan request
- ✅ **Enhanced logging** - Log lebih detail
- ✅ **CORS relaxed** - Allow semua origin
- ✅ **Debug mode** - Error messages lebih detail

## Security Notes

⚠️ **PENTING:**
- Jangan commit file `.http` dengan credentials asli
- Gunakan environment variables untuk production
- Selalu logout setelah testing
- Jangan share token JWT dengan orang lain

## Monitoring & Debugging

### Check Logs
```bash
# Terminal dengan pnpm dev akan menampilkan:
# - Mode aplikasi (development/production)
# - Environment variables
# - Request logs
# - Error details
```

### Database Monitoring
```bash
# Check database connections
pnpm db:status

# View recent logs
pnpm logs
```

---

**Happy Testing! 🚀**

Untuk pertanyaan atau issue, silakan buat issue di repository atau hubungi tim development.