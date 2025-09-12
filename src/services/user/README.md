# User Services

Folder ini berisi service-service yang menangani operasi user management yang telah dipecah berdasarkan Single Responsibility Principle (SRP) dan Domain-Driven Design (DDD).

## Struktur Folder

```
src/services/user/
├── README.md                      # Dokumentasi ini
├── types.ts                       # Interface dan type definitions
├── userCrudService.ts            # Service untuk operasi CRUD dasar
├── userProfileService.ts         # Service untuk profile management
├── userRoleAssignmentService.ts  # Service untuk role assignment
└── index.ts                      # Re-export dan backward compatibility
```

## Services

### 1. UserCrudService (`userCrudService.ts`)
**Tanggung Jawab:** Operasi CRUD dasar untuk user

**Methods:**
- `getAll()` - Mendapatkan semua user
- `getById(id)` - Mendapatkan user berdasarkan ID
- `create(userData)` - Membuat user baru
- `update(id, data)` - Update user
- `delete(id)` - Hapus user
- `getActiveUsers()` - Mendapatkan user yang aktif
- `getByEmail(email)` - Mendapatkan user berdasarkan email
- `deactivateUser(userId)` - Deaktivasi user
- `count()` - Mendapatkan jumlah total user

### 2. UserProfileService (`userProfileService.ts`)
**Tanggung Jawab:** Profile management dan operasi terkait data user

**Methods:**
- `updateUserProfile(userId, updateData)` - Update profile user
- `getUserProfile(userId)` - Mendapatkan profile user (sanitized)
- `getUserProfileByEmail(email)` - Mendapatkan profile berdasarkan email
- `updateUserDepartment(userId, department)` - Update department user
- `updateUserRegion(userId, region)` - Update region user
- `updateUserLevel(userId, level)` - Update level user

### 3. UserRoleAssignmentService (`userRoleAssignmentService.ts`)
**Tanggung Jawab:** Assignment dan management role user

**Methods:**
- `assignDefaultRole(userId)` - Assign role default untuk user baru
- `assignAdminRole(userId)` - Assign role Administrator
- `assignUserRole(userId)` - Assign role User
- `assignRoleByName(userId, roleName)` - Assign role berdasarkan nama
- `removeRoleByName(userId, roleName)` - Remove role dari user
- `getUserRoles(userId)` - Mendapatkan semua role user

## Types (`types.ts`)

**Interfaces:**
- `AuthResponse` - Response authentication
- `JWTPayload` - JWT payload structure
- `UserProfileUpdateData` - Data untuk update profile
- `SanitizedUser` - User tanpa password hash

**Re-exported Types:**
- `User` - dari `@/db/schema`
- `UserCreateInput` - dari `@/lib/validation/schemas`

## Backward Compatibility

File `index.ts` menyediakan:
1. **UserService class** - Facade pattern yang menggabungkan semua service kecil
2. **userService instance** - Instance untuk backward compatibility
3. **Re-export semua services** - Untuk penggunaan langsung service kecil

## Penggunaan

### Menggunakan Service Gabungan (Backward Compatible)
```typescript
import { userService } from '@/services/user';

// Semua method yang ada sebelumnya masih bisa digunakan
const users = await userService.getAll();
const newUser = await userService.createUser(userData);
```

### Menggunakan Service Kecil Langsung
```typescript
import { 
  userCrudService, 
  userProfileService, 
  userRoleAssignmentService 
} from '@/services/user';

// Operasi CRUD
const users = await userCrudService.getAll();

// Profile management
const profile = await userProfileService.getUserProfile(userId);

// Role assignment
await userRoleAssignmentService.assignRoleByName(userId, 'admin');
```

### Menggunakan Types
```typescript
import type { 
  AuthResponse, 
  JWTPayload, 
  SanitizedUser 
} from '@/services/user';
```

## Prinsip Design

1. **Single Responsibility Principle (SRP)** - Setiap service memiliki tanggung jawab yang jelas
2. **Domain-Driven Design (DDD)** - Service diorganisir berdasarkan domain bisnis
3. **Facade Pattern** - UserService sebagai facade untuk semua service kecil
4. **Dependency Injection** - Service menggunakan repository pattern
5. **Error Handling** - Consistent error handling di semua service
6. **Type Safety** - Strong typing dengan TypeScript

## Migrasi dari File Lama

File `src/services/userService.ts` sekarang hanya berisi re-export dari folder ini, sehingga:
- ✅ Semua import existing tetap berfungsi
- ✅ API interface tetap sama
- ✅ Backward compatibility terjaga
- ✅ Code lebih modular dan maintainable

## Testing

Setiap service dapat di-test secara independen:
```typescript
// Test CRUD operations
import { userCrudService } from '@/services/user/userCrudService';

// Test profile management
import { userProfileService } from '@/services/user/userProfileService';

// Test role assignment
import { userRoleAssignmentService } from '@/services/user/userRoleAssignmentService';
```

## Business Rules

1. **User Creation:**
   - Email harus unik
   - User pertama otomatis mendapat role Administrator
   - User selanjutnya mendapat role default 'user'

2. **Profile Update:**
   - Validasi input menggunakan Zod
   - Email baru harus unik (jika diubah)
   - Password hash tidak pernah di-return (sanitized)

3. **Role Assignment:**
   - User dapat memiliki multiple roles
   - Role assignment tidak mempengaruhi user creation (fail-safe)
   - Log semua role assignment activities