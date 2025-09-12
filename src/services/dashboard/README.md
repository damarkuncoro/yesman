# Dashboard Services

Folder ini berisi service-service kecil yang dipecah dari `dashboardService.ts` berdasarkan prinsip Single Responsibility Principle (SRP) dan Domain-Driven Design (DDD).

## Struktur Folder

```
src/services/dashboard/
├── types.ts                           # Interface dan type definitions
├── summaryService.ts                  # Service untuk ringkasan dashboard
├── userRoleStatsService.ts           # Service untuk statistik user per role
├── featureAccessStatsService.ts      # Service untuk statistik akses fitur
├── accessDeniedStatsService.ts       # Service untuk statistik akses ditolak
├── departmentRegionStatsService.ts   # Service untuk statistik department/region
├── index.ts                          # Export semua services dan types
└── README.md                         # Dokumentasi ini
```

## Services

### 1. SummaryService
**File:** `summaryService.ts`
**Tanggung jawab:** Mengambil data ringkasan dashboard (total users, roles, features, dll)
**Methods:**
- `getDashboardSummary()`: Mengambil ringkasan statistik dashboard

### 2. UserRoleStatsService
**File:** `userRoleStatsService.ts`
**Tanggung jawab:** Mengelola statistik user per role
**Methods:**
- `getUserRoleStats()`: Mengambil dan memproses data statistik user per role

### 3. FeatureAccessStatsService
**File:** `featureAccessStatsService.ts`
**Tanggung jawab:** Mengelola statistik akses fitur
**Methods:**
- `getFeatureAccessStats()`: Mengambil statistik akses fitur (sementara mock data)

### 4. AccessDeniedStatsService
**File:** `accessDeniedStatsService.ts`
**Tanggung jawab:** Mengelola statistik akses yang ditolak
**Methods:**
- `getAccessDeniedStats()`: Mengambil statistik akses yang ditolak berdasarkan data real
- `getAccessDeniedStatsFromLogs()`: Mengambil statistik access denied dari access logs

### 5. DepartmentRegionStatsService
**File:** `departmentRegionStatsService.ts`
**Tanggung jawab:** Mengelola statistik department dan region
**Methods:**
- `getDepartmentRegionStats()`: Mengambil statistik department dan region
- `getDepartmentStatsFromLogs()`: Mengambil statistik department dari access logs
- `getRegionStatsFromLogs()`: Mengambil statistik region dari access logs

## Types

**File:** `types.ts`

Berisi semua interface yang digunakan oleh dashboard services:
- `UserRoleStats`
- `FeatureAccessStats`
- `AccessDeniedStats`
- `DepartmentRegionStats`
- `DashboardSummary`
- `AccessDeniedStatsFromLogs`
- `DepartmentStatsFromLogs`
- `RegionStatsFromLogs`

## Backward Compatibility

**File:** `index.ts`

Menyediakan:
1. Export semua individual services
2. Export semua types
3. `DashboardService` class yang menggunakan semua service kecil untuk backward compatibility
4. `dashboardService` instance untuk kompatibilitas dengan kode yang sudah ada

## Penggunaan

### Menggunakan Individual Services
```typescript
import { summaryService, userRoleStatsService } from '@/services/dashboard';

// Menggunakan service terpisah
const summary = await summaryService.getDashboardSummary();
const userStats = await userRoleStatsService.getUserRoleStats();
```

### Menggunakan Main Service (Backward Compatibility)
```typescript
import { dashboardService } from '@/services/dashboard';

// Menggunakan service utama seperti sebelumnya
const summary = await dashboardService.getDashboardSummary();
const userStats = await dashboardService.getUserRoleStats();
```

### Import Types
```typescript
import type { DashboardSummary, UserRoleStats } from '@/services/dashboard';
```

## Prinsip Design

1. **Single Responsibility Principle (SRP)**: Setiap service memiliki tanggung jawab yang spesifik
2. **Domain-Driven Design (DDD)**: Service diorganisir berdasarkan domain bisnis
3. **DRY (Don't Repeat Yourself)**: Menghindari duplikasi kode
4. **KISS (Keep It Simple, Stupid)**: Struktur yang sederhana dan mudah dipahami
5. **High Cohesion & Low Coupling**: Service yang terkait dikelompokkan, dependency minimal

## Migrasi dari File Lama

File `src/services/dashboardService.ts` sekarang hanya berisi re-export dari dashboard services yang sudah dipecah. Semua kode yang sudah ada akan tetap berfungsi tanpa perubahan.

## Testing

Setiap service dapat ditest secara independen:
```typescript
import { summaryService } from '@/services/dashboard/summaryService';

describe('SummaryService', () => {
  it('should get dashboard summary', async () => {
    const result = await summaryService.getDashboardSummary();
    expect(result).toBeDefined();
  });
});
```