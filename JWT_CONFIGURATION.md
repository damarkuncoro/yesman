# JWT Configuration Guide

## Masalah: JWT Secrets Not Properly Configured

Jika Anda melihat peringatan `⚠️ JWT secrets not properly configured`, ini berarti environment variables untuk JWT belum dikonfigurasi dengan benar.

## Solusi

### 1. Buat File .env

Pastikan file `.env` ada di root directory proyek dengan konfigurasi berikut:

```bash
# JWT Configuration
JWT_SECRET="your-super-secret-jwt-key-change-this-in-production-min-32-chars"
JWT_REFRESH_SECRET="your-super-secret-refresh-jwt-key-change-this-in-production-min-32-chars"
```

### 2. Persyaratan Keamanan

- **Minimal 32 karakter** untuk setiap secret
- **Gunakan karakter acak** yang kuat
- **Berbeda** antara JWT_SECRET dan JWT_REFRESH_SECRET
- **Jangan commit** file .env ke repository

### 3. Generate Secure Secrets

Anda bisa menggunakan command berikut untuk generate secure secrets:

```bash
# Menggunakan Node.js
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

# Menggunakan OpenSSL
openssl rand -hex 32

# Menggunakan online generator (hati-hati dengan keamanan)
# https://generate-secret.vercel.app/32
```

### 4. Verifikasi Konfigurasi

Jalankan script verifikasi untuk memastikan konfigurasi sudah benar:

```bash
node scripts/verify-jwt-config.js
```

## Struktur Konfigurasi JWT

### Environment Variables

| Variable | Deskripsi | Required | Default |
|----------|-----------|----------|----------|
| `JWT_SECRET` | Secret untuk access token | ✅ | fallback-secret |
| `JWT_REFRESH_SECRET` | Secret untuk refresh token | ✅ | fallback-refresh-secret |

### Default Configuration

```typescript
export const JWT_DEFAULTS = {
  ACCESS_TOKEN_EXPIRY: '15m',    // 15 menit
  REFRESH_TOKEN_EXPIRY: '7d',    // 7 hari
  FALLBACK_SECRET: 'fallback-secret',
  FALLBACK_REFRESH_SECRET: 'fallback-refresh-secret'
} as const;
```

## Implementasi

### 1. Konfigurasi Otomatis

Sistem akan otomatis:
- Membaca environment variables
- Menggunakan fallback jika tidak ada
- Menampilkan warning jika menggunakan fallback
- Validasi konfigurasi saat startup

### 2. Validasi Konfigurasi

```typescript
function validateJWTConfig(config: JWTConfig): boolean {
  return (
    !!config.accessTokenSecret &&
    !!config.refreshTokenSecret &&
    !!config.accessTokenExpiry &&
    !!config.refreshTokenExpiry &&
    config.accessTokenSecret !== JWT_DEFAULTS.FALLBACK_SECRET &&
    config.refreshTokenSecret !== JWT_DEFAULTS.FALLBACK_REFRESH_SECRET
  );
}
```

## Production Deployment

### 1. Environment Variables

Pastikan environment variables diset di production:

```bash
# Vercel
vercel env add JWT_SECRET
vercel env add JWT_REFRESH_SECRET

# Docker
docker run -e JWT_SECRET="your-secret" -e JWT_REFRESH_SECRET="your-refresh-secret" app

# Kubernetes
kubectl create secret generic jwt-secrets \
  --from-literal=JWT_SECRET="your-secret" \
  --from-literal=JWT_REFRESH_SECRET="your-refresh-secret"
```

### 2. Security Best Practices

- ✅ Gunakan secrets yang berbeda untuk setiap environment
- ✅ Rotate secrets secara berkala
- ✅ Monitor penggunaan token
- ✅ Implementasi proper logout
- ❌ Jangan hardcode secrets di code
- ❌ Jangan commit .env ke repository
- ❌ Jangan share secrets via chat/email

## Troubleshooting

### Warning Masih Muncul?

1. **Restart development server**:
   ```bash
   pnpm dev
   ```

2. **Cek file .env ada dan readable**:
   ```bash
   ls -la .env
   cat .env | grep JWT
   ```

3. **Verifikasi environment variables loaded**:
   ```bash
   node -e "console.log(process.env.JWT_SECRET)"
   ```

### Build Errors?

1. **Pastikan .env.production ada** (jika diperlukan)
2. **Set environment variables di CI/CD**
3. **Cek Next.js environment loading**

## Files Terkait

- `src/lib/auth/authService/tokenService/constants.ts` - Konfigurasi dan constants
- `src/lib/auth/authService/tokenService/tokenGenerator.ts` - Token generation
- `src/lib/auth/authService/tokenService/tokenValidator.ts` - Token validation
- `.env.example` - Template environment variables
- `scripts/verify-jwt-config.js` - Script verifikasi

## Support

Jika masih ada masalah, cek:
1. Console logs untuk error details
2. Network tab untuk failed requests
3. JWT debugger: https://jwt.io
4. Dokumentasi Next.js environment variables