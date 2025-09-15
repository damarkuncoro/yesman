# Public Routes Configuration

Dokumentasi untuk konfigurasi routes yang tidak memerlukan authentication dalam sistem YesMan.

## Overview

Sistem middleware YesMan menggunakan pendekatan **separation of concerns** untuk mengelola routes yang tidak memerlukan authentication. Routes dibagi menjadi dua kategori utama:

1. **Public Web Routes** - Halaman web yang dapat diakses tanpa login
2. **Public API Routes** - API endpoints yang tidak memerlukan authentication

## File Konfigurasi

### Location
```
src/middleware/utils/routeMatcher.ts
```

### Structure

```typescript
export class DefaultRouteMatcher implements RouteMatcher {
  // Public web routes
  private readonly publicRoutes: string[] = [...]
  
  // Public API routes  
  private readonly publicApiRoutes: string[] = [...]
  
  // Skip patterns
  private readonly skipPatterns: string[] = [...]
}
```

## Public Web Routes

**Array:** `publicRoutes`

**Deskripsi:** Halaman web yang dapat diakses tanpa authentication

**Current Routes:**
- `/` - Homepage
- `/login` - Halaman login
- `/register` - Halaman registrasi
- `/forgot-password` - Halaman lupa password
- `/reset-password` - Halaman reset password

**Cara Menambah:**
```typescript
private readonly publicRoutes: string[] = [
  '/',
  '/login',
  '/register',
  '/forgot-password',
  '/reset-password',
  '/new-public-page' // ← Tambahkan di sini
];
```

## Public API Routes

**Array:** `publicApiRoutes`

**Deskripsi:** API endpoints yang tidak memerlukan authentication

**Current Routes:**
- `/api/health` - Health check endpoint
- `/api/version` - API version information
- `/api/auth/login` - Login endpoint
- `/api/auth/register` - Registration endpoint
- `/api/auth/refresh` - Token refresh endpoint
- `/api/auth/validate` - Token validation endpoint

**Cara Menambah:**
```typescript
private readonly publicApiRoutes: string[] = [
  '/api/health',
  '/api/version',
  '/api/auth/login',
  '/api/auth/register',
  '/api/auth/refresh',
  '/api/auth/validate',
  '/api/public/new-endpoint' // ← Tambahkan di sini
];
```

## Skip Patterns

**Array:** `skipPatterns`

**Deskripsi:** Pattern yang akan di-skip dari middleware processing

**Current Patterns:**
- `/_next/` - Next.js internal files
- `/api/auth/` - Authentication endpoints (pattern-based)
- `/favicon.ico` - Favicon file

## Available Methods

### Checking Methods

```typescript
// Cek apakah route adalah public (web atau API)
isPublicRoute(pathname: string): boolean

// Cek apakah route adalah public API
isPublicApiRoute(pathname: string): boolean

// Cek apakah route adalah public web
isPublicWebRoute(pathname: string): boolean

// Cek apakah middleware harus di-skip
shouldSkipMiddleware(pathname: string): boolean
```

### Getter Methods

```typescript
// Dapatkan semua public API routes
getPublicApiRoutes(): string[]

// Dapatkan semua public web routes
getPublicWebRoutes(): string[]
```

### Utility Methods

```typescript
// Konversi HTTP method ke action type
getActionFromMethod(method: string): ActionType
```

## Usage Examples

### Dalam Middleware

```typescript
const routeMatcher = createRouteMatcher();
const pathname = request.nextUrl.pathname;

// Cek apakah route public
if (routeMatcher.isPublicRoute(pathname)) {
  return NextResponse.next();
}

// Cek spesifik API route
if (routeMatcher.isPublicApiRoute(pathname)) {
  console.log('Public API route accessed');
}

// Cek spesifik web route
if (routeMatcher.isPublicWebRoute(pathname)) {
  console.log('Public web route accessed');
}
```

### Dalam Testing

```typescript
const routeMatcher = createRouteMatcher();

// Test semua public API routes
const publicApiRoutes = routeMatcher.getPublicApiRoutes();
publicApiRoutes.forEach(route => {
  // Test route accessibility
});

// Test semua public web routes
const publicWebRoutes = routeMatcher.getPublicWebRoutes();
publicWebRoutes.forEach(route => {
  // Test route accessibility
});
```

## Best Practices

### 1. **Separation of Concerns**
- Pisahkan web routes dan API routes
- Gunakan method yang spesifik untuk checking

### 2. **Security First**
- Hanya tambahkan routes yang benar-benar tidak memerlukan auth
- Review secara berkala routes yang ada

### 3. **Documentation**
- Selalu dokumentasikan alasan menambah public route
- Update dokumentasi saat menambah/menghapus routes

### 4. **Testing**
- Test semua public routes secara otomatis
- Pastikan routes yang seharusnya protected tidak masuk ke public

## Security Considerations

⚠️ **PENTING:**

1. **Jangan tambahkan routes sensitif** ke public routes
2. **Review berkala** - Audit public routes secara berkala
3. **Principle of Least Privilege** - Hanya buat public jika benar-benar diperlukan
4. **Rate Limiting** - Public routes tetap harus di-rate limit

## Migration Guide

### Dari Versi Lama

Jika sebelumnya menggunakan satu array `publicRoutes`:

```typescript
// LAMA
private readonly publicRoutes: string[] = [
  '/',
  '/login',
  '/api/health',
  '/api/auth/login'
];

// BARU
private readonly publicRoutes: string[] = [
  '/',
  '/login'
];

private readonly publicApiRoutes: string[] = [
  '/api/health',
  '/api/auth/login'
];
```

### Update Method Calls

```typescript
// LAMA
if (routeMatcher.isPublicRoute('/api/health')) {
  // logic
}

// BARU - Lebih spesifik
if (routeMatcher.isPublicApiRoute('/api/health')) {
  // logic
}
```

## Troubleshooting

### Route Tidak Accessible

1. **Cek apakah route ada di array yang benar**
   - Web routes → `publicRoutes`
   - API routes → `publicApiRoutes`

2. **Cek middleware config**
   - Pastikan route tidak di-exclude di `middleware.ts`

3. **Cek skip patterns**
   - Pastikan route tidak match dengan `skipPatterns`

### Route Masih Memerlukan Auth

1. **Restart development server**
2. **Clear browser cache**
3. **Check middleware logs**

---

**Last Updated:** January 2025  
**Version:** 1.0.0