# YesMan API Documentation

## Overview
YesMan API adalah sistem Role-Based Access Control (RBAC) dan Attribute-Based Access Control (ABAC) yang menyediakan manajemen pengguna, peran, fitur, dan kebijakan akses yang komprehensif.

## API Versioning

### Current Version: v1
- **Base URL**: `/api/v1`
- **Status**: Active
- **Supported**: ✅

### Version Information
- **GET** `/api/version` - Mendapatkan informasi versi API yang tersedia

### Health Check
- **GET** `/api/health` - Status kesehatan sistem

## Authentication Endpoints

### Base Path: `/api/v1/auth`

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| POST | `/login` | Login pengguna | ❌ |
| POST | `/register` | Registrasi pengguna baru | ❌ |
| POST | `/logout` | Logout pengguna | ✅ |
| POST | `/refresh` | Refresh token | ✅ |
| POST | `/validate` | Validasi token | ✅ |

## User Management

### Base Path: `/api/v1/users`

| Method | Endpoint | Description | Permission Required |
|--------|----------|-------------|--------------------|
| GET | `/` | Daftar semua pengguna aktif | `user_management:read` |
| GET | `/[id]` | Detail pengguna berdasarkan ID | `user_management:read` |
| GET | `/[id]/roles` | Daftar peran pengguna | `user_management:read` |
| GET | `/[id]/permissions` | Daftar permission pengguna | `user_management:read` |
| GET | `/profile` | Profil pengguna yang sedang login | ✅ (authenticated) |

## Role-Based Access Control (RBAC)

### Roles Management
**Base Path**: `/api/v1/rbac/roles`

| Method | Endpoint | Description | Permission Required |
|--------|----------|-------------|--------------------|
| GET | `/` | Daftar semua peran | `role_management:read` |
| POST | `/` | Buat peran baru | `role_management:create` |
| GET | `/[id]` | Detail peran berdasarkan ID | `role_management:read` |
| PUT | `/[id]` | Update peran | `role_management:update` |
| DELETE | `/[id]` | Hapus peran | `role_management:delete` |
| GET | `/[id]/features` | Daftar fitur dalam peran | `role_management:read` |
| GET | `/[id]/users` | Daftar pengguna dalam peran | `role_management:read` |

### Features Management
**Base Path**: `/api/v1/rbac/features`

| Method | Endpoint | Description | Permission Required |
|--------|----------|-------------|--------------------|
| GET | `/` | Daftar semua fitur | `feature_management:read` |
| POST | `/` | Buat fitur baru | `feature_management:create` |
| GET | `/[id]` | Detail fitur berdasarkan ID | `feature_management:read` |
| PUT | `/[id]` | Update fitur | `feature_management:update` |
| DELETE | `/[id]` | Hapus fitur | `feature_management:delete` |

### Route Features
**Base Path**: `/api/v1/rbac/route-features`

| Method | Endpoint | Description | Permission Required |
|--------|----------|-------------|--------------------|
| GET | `/` | Daftar semua route features | `feature_management:read` |
| POST | `/` | Buat route feature baru | `feature_management:create` |
| GET | `/[id]` | Detail route feature | `feature_management:read` |
| PUT | `/[id]` | Update route feature | `feature_management:update` |
| DELETE | `/[id]` | Hapus route feature | `feature_management:delete` |

## Attribute-Based Access Control (ABAC)

### Policies Management
**Base Path**: `/api/v1/abac/policies`

| Method | Endpoint | Description | Permission Required |
|--------|----------|-------------|--------------------|
| GET | `/` | Daftar kebijakan berdasarkan feature ID | `policy_management:read` |
| POST | `/` | Buat kebijakan baru | `policy_management:create` |
| GET | `/[id]` | Detail kebijakan | `policy_management:read` |
| PUT | `/[id]` | Update kebijakan | `policy_management:update` |
| DELETE | `/[id]` | Hapus kebijakan | `policy_management:delete` |

### Attributes Management
**Base Path**: `/api/v1/abac/attributes`

| Method | Endpoint | Description | Permission Required |
|--------|----------|-------------|--------------------|
| GET | `/` | Daftar semua atribut | `attribute_management:read` |
| POST | `/` | Buat atribut baru | `attribute_management:create` |
| GET | `/[id]` | Detail atribut | `attribute_management:read` |
| PUT | `/[id]` | Update atribut | `attribute_management:update` |
| DELETE | `/[id]` | Hapus atribut | `attribute_management:delete` |

## Audit & Monitoring

### Access Logs
**Base Path**: `/api/v1/audit/access-logs`

| Method | Endpoint | Description | Permission Required |
|--------|----------|-------------|--------------------|
| GET | `/` | Daftar log akses dengan filter | `audit:read` |
| POST | `/` | Catat log akses baru | System Internal |

### Policy Violations
**Base Path**: `/api/v1/audit/policy-violations`

| Method | Endpoint | Description | Permission Required |
|--------|----------|-------------|--------------------|
| GET | `/` | Daftar pelanggaran kebijakan | `audit:read` |
| POST | `/` | Catat pelanggaran baru | System Internal |

### Change History
**Base Path**: `/api/v1/audit/change-history`

| Method | Endpoint | Description | Permission Required |
|--------|----------|-------------|--------------------|
| GET | `/` | Riwayat perubahan sistem | `audit:read` |
| POST | `/` | Catat perubahan baru | System Internal |

### Session Logs
**Base Path**: `/api/v1/audit/session-logs`

| Method | Endpoint | Description | Permission Required |
|--------|----------|-------------|--------------------|
| GET | `/` | Log sesi pengguna | `audit:read` |
| POST | `/` | Catat sesi baru | System Internal |

## Dashboard & Analytics

### Statistics
**Base Path**: `/api/v1/dashboard`

| Method | Endpoint | Description | Permission Required |
|--------|----------|-------------|--------------------|
| GET | `/stats` | Statistik umum dashboard | `dashboard:read` |
| GET | `/user-stats` | Statistik pengguna | `dashboard:read` |
| GET | `/role-stats` | Statistik peran | `dashboard:read` |
| GET | `/feature-stats` | Statistik fitur | `dashboard:read` |
| GET | `/access-stats` | Statistik akses | `dashboard:read` |
| GET | `/department-stats` | Statistik departemen | `dashboard:read` |
| GET | `/user-role-stats` | Statistik peran pengguna | `dashboard:read` |
| GET | `/feature-access-stats` | Statistik akses fitur | `dashboard:read` |
| GET | `/access-denied-stats` | Statistik akses ditolak | `dashboard:read` |
| GET | `/region-stats` | Statistik regional | `dashboard:read` |
| GET | `/department-region-stats` | Statistik departemen per region | `dashboard:read` |

## Administration

### System Management
**Base Path**: `/api/v1/admin`

| Method | Endpoint | Description | Permission Required |
|--------|----------|-------------|--------------------|
| POST | `/route-discovery` | Jalankan route discovery manual | Admin Only |
| GET | `/route-discovery` | Status route discovery | Admin Only |
| GET | `/system-health` | Status kesehatan sistem | Admin Only |
| POST | `/maintenance` | Mode maintenance | Admin Only |

## Response Format

### Success Response
```json
{
  "success": true,
  "data": {
    // response data
  },
  "message": "Optional success message"
}
```

### Error Response
```json
{
  "success": false,
  "error": "Error message",
  "code": "ERROR_CODE",
  "details": {
    // additional error details
  }
}
```

## HTTP Status Codes

| Code | Description |
|------|-------------|
| 200 | OK - Request berhasil |
| 201 | Created - Resource berhasil dibuat |
| 400 | Bad Request - Request tidak valid |
| 401 | Unauthorized - Authentication diperlukan |
| 403 | Forbidden - Permission tidak mencukupi |
| 404 | Not Found - Resource tidak ditemukan |
| 409 | Conflict - Konflik data |
| 422 | Unprocessable Entity - Validasi gagal |
| 500 | Internal Server Error - Error server |

## Authentication

API menggunakan JWT (JSON Web Token) untuk authentication:

1. **Login** melalui `/api/v1/auth/login` untuk mendapatkan token
2. **Include token** dalam header: `Authorization: Bearer <token>`
3. **Refresh token** melalui `/api/v1/auth/refresh` sebelum expired

## Permission System

Sistem menggunakan format permission: `{feature}:{action}`

### Available Actions:
- `read` - Membaca data
- `create` - Membuat data baru
- `update` - Mengubah data existing
- `delete` - Menghapus data

### Common Features:
- `user_management`
- `role_management`
- `feature_management`
- `policy_management`
- `attribute_management`
- `audit`
- `dashboard`

## Rate Limiting

- **Default**: 100 requests per minute per IP
- **Authenticated**: 1000 requests per minute per user
- **Admin**: 5000 requests per minute

## Migration from Legacy API

Untuk migrasi dari struktur API lama:

1. **Update base URL** dari `/api/{module}` ke `/api/v1/{module}`
2. **Update endpoint paths** sesuai struktur baru
3. **Verify permissions** masih sesuai dengan sistem baru
4. **Test thoroughly** semua endpoint yang digunakan

### Mapping Endpoint Lama ke Baru

| Legacy | New (v1) |
|--------|----------|
| `/api/auth/*` | `/api/v1/auth/*` |
| `/api/users/*` | `/api/v1/users/*` |
| `/api/user/profile` | `/api/v1/users/profile` |
| `/api/rbac/*` | `/api/v1/rbac/*` |
| `/api/roles/*` | `/api/v1/rbac/roles/*` |
| `/api/abac/*` | `/api/v1/abac/*` |
| `/api/audit/*` | `/api/v1/audit/*` |
| `/api/dashboard/*` | `/api/v1/dashboard/*` |
| `/api/admin/*` | `/api/v1/admin/*` |

---

**Last Updated**: January 2025  
**API Version**: v1.0.0  
**Documentation Version**: 1.0