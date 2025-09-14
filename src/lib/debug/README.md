# Debug Utility Documentation

## Overview
Debug utility ini dirancang untuk membantu developer melacak alur proses dari UI hingga database dan kembali ke UI. Debug hanya aktif di environment DEVELOPMENT dan otomatis dinonaktifkan di produksi.

## Fitur Utama
- ✅ Hanya aktif di environment DEVELOPMENT
- ✅ Tracking alur proses dari UI → Service → Repository → Database
- ✅ Logging dengan context yang kaya (user ID, data, timing)
- ✅ Sanitasi data sensitif (password, token, dll)
- ✅ Performance monitoring dengan durasi eksekusi
- ✅ Error tracking dengan stack trace
- ✅ Decorator untuk implementasi yang mudah

## Struktur File
```
src/lib/debug/
├── debugLogger.ts     # Main debug utility
└── README.md         # Dokumentasi ini
```

## Cara Penggunaan

### 1. Base Repository (Sudah Terintegrasi)
```typescript
// src/repositories/base/baseRepository.ts
export class BaseRepository {
  constructor(moduleName: string) {
    this.moduleName = moduleName;
  }

  protected async executeWithErrorHandling<T>(
    operation: string,
    fn: () => Promise<T>,
    data?: any,
    userId?: number
  ): Promise<T> {
    // Debug tracking sudah terintegrasi
  }
}
```

### 2. Base Service (Sudah Terintegrasi)
```typescript
// src/services/base/baseService.ts
export class BaseService {
  constructor(serviceName: string) {
    this.serviceName = serviceName;
  }

  protected async executeWithErrorHandling<T>(
    operation: string,
    fn: () => Promise<T>,
    data?: any,
    userId?: number
  ): Promise<T> {
    // Debug tracking sudah terintegrasi
  }
}
```

### 3. Implementasi di Repository
```typescript
// Contoh: UserRepository
export class UserRepository extends BaseRepository {
  constructor() {
    super('UserRepository'); // Nama module untuk debug
  }

  async findById(id: number): Promise<User | undefined> {
    return this.executeWithErrorHandling(
      'find user by ID',           // Deskripsi operasi
      async () => {                // Function yang dieksekusi
        const result = await db!.select().from(users).where(eq(users.id, id)).limit(1);
        return this.getFirstResult(result);
      },
      { searchId: id },            // Data context untuk debug
      id                           // User ID (opsional)
    );
  }
}
```

### 4. Implementasi di Service
```typescript
// Contoh: UserCrudService
export class UserCrudService extends BaseCrudService {
  constructor() {
    super('UserCrudService'); // Nama service untuk debug
  }

  async getById(id: number): Promise<User | null> {
    return this.executeWithErrorHandling(
      'get user by id',            // Deskripsi operasi
      async () => {                // Function yang dieksekusi
        const user = await userRepository.findById(id);
        return user || null;
      },
      { userId: id },              // Data context untuk debug
      id                           // User ID
    );
  }
}
```

### 5. Menggunakan Decorator (Opsional)
```typescript
// Untuk method yang tidak menggunakan executeWithErrorHandling
@debugRepository('UserRepository')
class UserRepository {
  @debugTime('findByEmail')
  async findByEmail(email: string): Promise<User | undefined> {
    // Implementation
  }
}

@debugService('UserService')
class UserService {
  @debugTime('validateUser')
  async validateUser(userData: any): Promise<boolean> {
    // Implementation
  }
}
```

## Output Debug

### Development Environment
```bash
[DEBUG] [2024-01-15 10:30:15] [UserCrudService] Starting: get user by id
[DEBUG] [2024-01-15 10:30:15] [UserCrudService] Context: {"userId":123}
[DEBUG] [2024-01-15 10:30:15] [UserRepository] Starting: find user by ID
[DEBUG] [2024-01-15 10:30:15] [UserRepository] Context: {"searchId":123}
[DEBUG] [2024-01-15 10:30:16] [UserRepository] Completed: find user by ID (Duration: 45ms)
[DEBUG] [2024-01-15 10:30:16] [UserCrudService] Completed: get user by id (Duration: 52ms)
```

### Production Environment
```bash
# Tidak ada output debug - semua log dinonaktifkan
```

## Environment Variables
```bash
# .env.development
NODE_ENV=development

# .env.production
NODE_ENV=production
```

## Data Sanitization
Debug utility secara otomatis menyembunyikan data sensitif:
- `password`
- `token`
- `secret`
- `key`
- `auth`

```typescript
// Input
const userData = {
  email: 'user@example.com',
  password: 'secret123',
  token: 'abc123'
};

// Output di log
{
  email: 'user@example.com',
  password: '[HIDDEN]',
  token: '[HIDDEN]'
}
```

## Best Practices

1. **Selalu gunakan constructor dengan nama module/service**
   ```typescript
   constructor() {
     super('ModuleName'); // Wajib untuk debug tracking
   }
   ```

2. **Berikan context yang bermakna**
   ```typescript
   // ✅ Good
   { userId: 123, operation: 'create_user' }
   
   // ❌ Bad
   { data: 'some data' }
   ```

3. **Gunakan deskripsi operasi yang jelas**
   ```typescript
   // ✅ Good
   'find user by email'
   
   // ❌ Bad
   'find'
   ```

4. **Sertakan user ID jika tersedia**
   ```typescript
   this.executeWithErrorHandling(
     'operation',
     fn,
     context,
     userId // Membantu tracking per user
   );
   ```

## Troubleshooting

### Debug tidak muncul
1. Pastikan `NODE_ENV=development`
2. Periksa constructor sudah memanggil `super()` dengan nama module
3. Pastikan menggunakan `executeWithErrorHandling`

### Performance Impact
- Debug utility dirancang dengan overhead minimal
- Hanya aktif di development
- Menggunakan lazy evaluation untuk performance

### Memory Usage
- Log entries dibatasi untuk mencegah memory leak
- Automatic cleanup untuk long-running processes

## Contoh Implementasi Lengkap

Lihat file berikut untuk contoh implementasi:
- `src/repositories/user/userRepository.ts`
- `src/services/user/userCrudService.ts`
- `src/repositories/base/baseRepository.ts`
- `src/services/base/baseService.ts`