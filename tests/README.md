# YesMan API Test Suite

Test suite lengkap untuk YesMan API v1 yang mencakup semua endpoint dan fungsionalitas sistem.

## 📋 Daftar Isi

- [Instalasi](#instalasi)
- [Konfigurasi](#konfigurasi)
- [Menjalankan Test](#menjalankan-test)
- [Test Suite](#test-suite)
- [Laporan Test](#laporan-test)
- [Troubleshooting](#troubleshooting)

## 🚀 Instalasi

### 1. Install Dependencies

```bash
cd tests
npm install
```

### 2. Pastikan Server Berjalan

Pastikan YesMan API server sudah berjalan di `http://localhost:3000` (atau URL yang sesuai).

```bash
# Di root project
npm run dev
# atau
npm start
```

## ⚙️ Konfigurasi

### Environment Variables

Buat file `.env` di direktori `tests/` (opsional):

```env
API_BASE_URL=http://localhost:3000
TEST_TIMEOUT=30000
TEST_RETRIES=1
GENERATE_REPORT=true
REPORT_PATH=./test-results
```

### Konfigurasi Test Data

Sesuaikan data test di setiap file test jika diperlukan:

- `auth.test.js` - Data user untuk authentication
- `users.test.js` - Data admin dan user
- `rbac.test.js` - Data roles dan features
- `abac.test.js` - Data policies dan attributes
- `audit.test.js` - Filter dan parameter audit
- `dashboard.test.js` - Parameter statistik dashboard
- `admin.test.js` - Data admin dan konfigurasi sistem

## 🧪 Menjalankan Test

### Menjalankan Semua Test

```bash
# Jalankan semua test suite
npm test

# Atau dengan environment khusus
npm run test:dev
npm run test:prod
```

### Menjalankan Test Individual

```bash
# Authentication tests
npm run test:auth

# User management tests
npm run test:users

# RBAC tests
npm run test:rbac

# ABAC tests
npm run test:abac

# Audit tests
npm run test:audit

# Dashboard tests
npm run test:dashboard

# Admin tests
npm run test:admin
```

### Watch Mode (Development)

```bash
npm run test:watch
```

## 📊 Test Suite

### 1. Authentication Test Suite (`auth.test.js`)

**Endpoint yang ditest:**
- `POST /api/v1/auth/register` - Registrasi user baru
- `POST /api/v1/auth/login` - Login user
- `GET /api/v1/auth/validate` - Validasi token
- `POST /api/v1/auth/refresh` - Refresh token
- `POST /api/v1/auth/logout` - Logout user

**Test Cases:**
- ✅ Registrasi user berhasil
- ✅ Login dengan kredensial valid
- ✅ Validasi token yang valid
- ✅ Refresh token berhasil
- ✅ Logout berhasil
- ❌ Login dengan kredensial invalid
- ❌ Validasi token invalid
- ❌ Registrasi dengan data invalid

### 2. User Management Test Suite (`users.test.js`)

**Endpoint yang ditest:**
- `GET /api/v1/users` - Get all users
- `GET /api/v1/users/:id` - Get user by ID
- `GET /api/v1/users/:id/roles` - Get user roles
- `GET /api/v1/users/:id/permissions` - Get user permissions
- `GET /api/v1/users/profile` - Get user profile

**Test Cases:**
- ✅ Get all users (dengan admin token)
- ✅ Get user by valid ID
- ✅ Get user roles
- ✅ Get user permissions
- ✅ Get user profile
- ❌ Unauthorized access
- ❌ Invalid user ID

### 3. RBAC Test Suite (`rbac.test.js`)

**Endpoint yang ditest:**
- `GET /api/v1/rbac/roles` - Get all roles
- `GET /api/v1/rbac/roles/:id` - Get role by ID
- `GET /api/v1/rbac/roles/:id/features` - Get role features
- `GET /api/v1/rbac/features` - Get all features
- `GET /api/v1/rbac/features/:id` - Get feature by ID
- `GET /api/v1/rbac/features/:id/routes` - Get feature routes
- `GET /api/v1/rbac/route-features` - Get all route features
- `GET /api/v1/rbac/route-features/:id` - Get route feature by ID

### 4. ABAC Test Suite (`abac.test.js`)

**Endpoint yang ditest:**
- `GET /api/v1/abac/policies` - Get all policies
- `GET /api/v1/abac/policies/:id` - Get policy by ID
- `POST /api/v1/abac/policies/evaluate` - Evaluate policy
- `GET /api/v1/abac/attributes` - Get all attributes
- `GET /api/v1/abac/attributes/:id` - Get attribute by ID
- `POST /api/v1/abac/policies/batch-evaluate` - Batch policy evaluation

### 5. Audit Test Suite (`audit.test.js`)

**Endpoint yang ditest:**
- `GET /api/v1/audit` - Get all audit logs
- `GET /api/v1/audit/:id` - Get audit log by ID
- `GET /api/v1/audit/stats` - Get audit statistics
- `GET /api/v1/audit/export` - Export audit logs

### 6. Dashboard Test Suite (`dashboard.test.js`)

**Endpoint yang ditest:**
- `GET /api/v1/dashboard/overview` - Get dashboard overview
- `GET /api/v1/dashboard/user-role-stats` - Get user role statistics
- `GET /api/v1/dashboard/feature-access-stats` - Get feature access statistics
- `GET /api/v1/dashboard/department-stats` - Get department statistics
- `GET /api/v1/dashboard/region-stats` - Get region statistics
- `GET /api/v1/dashboard/department-region-stats` - Get department-region statistics
- `GET /api/v1/dashboard/access-denied-stats` - Get access denied statistics

### 7. Admin Test Suite (`admin.test.js`)

**Endpoint yang ditest:**
- `GET /api/v1/admin/route-discovery` - Get route discovery
- `POST /api/v1/admin/route-discovery/refresh` - Refresh route discovery
- `GET /api/v1/admin/system/status` - Get system status
- `GET /api/v1/admin/system/config` - Get system configuration
- `PUT /api/v1/admin/system/config` - Update system configuration
- `GET /api/v1/admin/users` - Get all users (admin view)
- `POST /api/v1/admin/users` - Create new user
- `PUT /api/v1/admin/users/:id/status` - Update user status
- `POST /api/v1/admin/roles` - Create new role
- `POST /api/v1/admin/users/:id/roles` - Assign role to user
- `GET /api/v1/admin/audit` - Get audit logs (admin view)
- `POST /api/v1/admin/audit/cleanup` - Clear old audit logs

## 📈 Laporan Test

### Format Laporan

Test runner akan menghasilkan laporan dalam dua format:

1. **JSON Report** - `test-results/api-test-results-[timestamp].json`
2. **HTML Report** - `test-results/api-test-results-[timestamp].html`

### Struktur Laporan JSON

```json
{
  "startTime": 1703123456789,
  "endTime": 1703123567890,
  "duration": 111101,
  "suites": [
    {
      "name": "Authentication",
      "status": "COMPLETED",
      "duration": 15000,
      "results": {
        "total": 8,
        "passed": 7,
        "failed": 1,
        "errors": 0
      }
    }
  ],
  "summary": {
    "totalTests": 56,
    "passed": 52,
    "failed": 3,
    "errors": 1,
    "successRate": 92.86
  }
}
```

### HTML Report

Laporan HTML menyediakan visualisasi yang lebih baik dengan:
- Progress bar success rate
- Breakdown per test suite
- Detail error dan failure
- Responsive design

## 🔧 Troubleshooting

### Server Tidak Berjalan

```
❌ Server health check failed: fetch failed
💡 Make sure the server is running on http://localhost:3000
```

**Solusi:**
1. Pastikan server YesMan berjalan
2. Periksa URL di konfigurasi
3. Periksa firewall/network

### Authentication Gagal

```
❌ FAIL: Admin Login Setup - Admin login failed: Invalid credentials
```

**Solusi:**
1. Periksa kredensial admin di `auth.test.js`
2. Pastikan user admin sudah ada di database
3. Periksa endpoint `/api/v1/auth/login`

### Timeout Error

```
❌ Authentication failed: Test suite timeout after 30000ms
```

**Solusi:**
1. Tingkatkan timeout di konfigurasi
2. Periksa performa server
3. Periksa koneksi network

### Permission Denied

```
❌ FAIL: Get All Users - Insufficient permissions
```

**Solusi:**
1. Pastikan user test memiliki role yang sesuai
2. Periksa sistem RBAC/ABAC
3. Periksa token authentication

### Database Connection Error

```
❌ ERROR: Get All Users - Database connection failed
```

**Solusi:**
1. Periksa koneksi database server
2. Periksa konfigurasi database
3. Pastikan migrasi database sudah dijalankan

## 📝 Menambah Test Baru

### 1. Menambah Test Case Baru

```javascript
/**
 * Test: Nama test case baru
 */
async testNewFeature() {
  if (!this.adminToken) {
    return { success: false, error: 'No admin token available' };
  }

  const response = await makeRequest('/new-endpoint', {
    method: 'GET',
    headers: { 'Authorization': `Bearer ${this.adminToken}` }
  });

  if (response.status === 200 && response.data.success) {
    return {
      success: true,
      details: 'New feature test passed'
    };
  } else {
    return {
      success: false,
      error: `New feature test failed: ${response.data.error || 'Unknown error'}`
    };
  }
}
```

### 2. Menambah Test ke Suite

```javascript
async runAllTests() {
  // ... existing tests
  
  // Tambahkan test baru
  await this.runTest('New Feature Test', () => this.testNewFeature());
  
  // ... rest of the method
}
```

### 3. Membuat Test Suite Baru

1. Buat file baru: `api/v1/new-feature.test.js`
2. Ikuti struktur yang sama dengan test suite lain
3. Export class test suite
4. Tambahkan ke `test-runner.js`

## 🤝 Kontribusi

1. Fork repository
2. Buat branch feature (`git checkout -b feature/new-test`)
3. Commit perubahan (`git commit -am 'Add new test'`)
4. Push ke branch (`git push origin feature/new-test`)
5. Buat Pull Request

## 📄 Lisensi

MIT License - lihat file [LICENSE](../LICENSE) untuk detail.

---

**Happy Testing! 🧪✨**