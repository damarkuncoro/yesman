# Rencana Reorganisasi API

## Analisis Struktur Saat Ini

### Masalah yang Ditemukan:
1. **Duplikasi Endpoint**: Ada duplikasi antara `/rbac/users/[id]/roles` dan `/users/[id]`
2. **Inkonsistensi Pola**: Beberapa endpoint menggunakan `withFeature`, beberapa `withAuthentication`
3. **Tidak Ada Versioning**: Semua endpoint langsung di root tanpa versioning
4. **Organisasi Tidak Konsisten**: Ada `/roles/` dan `/rbac/roles/` yang overlap
5. **Shared Components**: `_shared` folder baik tapi bisa lebih terstruktur

### Pola yang Ditemukan:
1. **Authentication Endpoints**: `/auth/*` - menggunakan AuthRequestHandler
2. **RBAC Endpoints**: `/rbac/*` - menggunakan withFeature HOC
3. **ABAC Endpoints**: `/abac/*` - untuk attribute-based access control
4. **Audit Endpoints**: `/audit/*` - menggunakan withAuthentication
5. **Dashboard Endpoints**: `/dashboard/*` - menggunakan DashboardHandlers
6. **Admin Endpoints**: `/admin/*` - menggunakan authorizationMiddleware
7. **User Management**: `/users/*` dan `/user/*` - duplikasi yang perlu dibersihkan

## Struktur Baru yang Diusulkan

```
src/app/api/
├── v1/                           # API Version 1
│   ├── auth/                     # Authentication & Authorization
│   │   ├── login/
│   │   ├── logout/
│   │   ├── refresh/
│   │   ├── register/
│   │   └── validate/
│   ├── users/                    # User Management (Consolidated)
│   │   ├── route.ts              # GET /users, POST /users
│   │   ├── [id]/
│   │   │   ├── route.ts          # GET /users/[id], PUT /users/[id], DELETE /users/[id]
│   │   │   ├── roles/            # User Role Management
│   │   │   │   └── route.ts      # GET /users/[id]/roles, POST /users/[id]/roles
│   │   │   ├── permissions/      # User Permissions
│   │   │   │   └── route.ts      # GET /users/[id]/permissions
│   │   │   └── attributes/       # ABAC User Attributes
│   │   │       └── route.ts      # GET /users/[id]/attributes, PUT /users/[id]/attributes
│   │   └── profile/              # Current User Profile
│   │       └── route.ts          # GET /users/profile, PUT /users/profile
│   ├── rbac/                     # Role-Based Access Control
│   │   ├── roles/
│   │   │   ├── route.ts          # GET /rbac/roles, POST /rbac/roles
│   │   │   └── [id]/
│   │   │       ├── route.ts      # GET /rbac/roles/[id], PUT /rbac/roles/[id], DELETE /rbac/roles/[id]
│   │   │       ├── features/     # Role Feature Permissions
│   │   │       │   └── route.ts  # GET /rbac/roles/[id]/features, POST /rbac/roles/[id]/features
│   │   │       └── users/        # Users with this Role
│   │   │           └── route.ts  # GET /rbac/roles/[id]/users
│   │   ├── features/
│   │   │   ├── route.ts          # GET /rbac/features, POST /rbac/features
│   │   │   └── [id]/
│   │   │       └── route.ts      # GET /rbac/features/[id], PUT /rbac/features/[id], DELETE /rbac/features/[id]
│   │   └── route-features/
│   │       ├── route.ts          # GET /rbac/route-features, POST /rbac/route-features
│   │       └── [id]/
│   │           └── route.ts      # GET /rbac/route-features/[id], PUT /rbac/route-features/[id], DELETE /rbac/route-features/[id]
│   ├── abac/                     # Attribute-Based Access Control
│   │   ├── policies/
│   │   │   ├── route.ts          # GET /abac/policies, POST /abac/policies
│   │   │   └── [id]/
│   │   │       └── route.ts      # GET /abac/policies/[id], PUT /abac/policies/[id], DELETE /abac/policies/[id]
│   │   └── attributes/           # User Attribute Management
│   │       └── route.ts          # GET /abac/attributes (list all possible attributes)
│   ├── audit/                    # Audit & Monitoring
│   │   ├── access-logs/
│   │   │   └── route.ts          # GET /audit/access-logs, POST /audit/access-logs
│   │   ├── policy-violations/
│   │   │   └── route.ts          # GET /audit/policy-violations, POST /audit/policy-violations
│   │   ├── change-history/
│   │   │   └── route.ts          # GET /audit/change-history, POST /audit/change-history
│   │   └── session-logs/
│   │       └── route.ts          # GET /audit/session-logs
│   ├── dashboard/                # Dashboard & Analytics
│   │   ├── stats/
│   │   │   └── route.ts          # GET /dashboard/stats (summary)
│   │   ├── user-stats/
│   │   │   └── route.ts          # GET /dashboard/user-stats
│   │   ├── role-stats/
│   │   │   └── route.ts          # GET /dashboard/role-stats
│   │   ├── feature-stats/
│   │   │   └── route.ts          # GET /dashboard/feature-stats
│   │   ├── access-stats/
│   │   │   └── route.ts          # GET /dashboard/access-stats
│   │   └── department-stats/
│   │       └── route.ts          # GET /dashboard/department-stats
│   └── admin/                    # Administrative Functions
│       ├── route-discovery/
│       │   └── route.ts          # POST /admin/route-discovery, GET /admin/route-discovery
│       ├── system-health/
│       │   └── route.ts          # GET /admin/system-health
│       └── maintenance/
│           └── route.ts          # POST /admin/maintenance (maintenance mode)
├── _shared/                      # Shared Components (Enhanced)
│   ├── auth/                     # Authentication Utilities
│   ├── handlers/                 # Base Handlers
│   ├── middleware/               # Shared Middleware
│   ├── validators/               # Validation Schemas
│   ├── types/                    # Type Definitions
│   └── utils/                    # Utility Functions
└── health/                       # Health Check (No versioning needed)
    └── route.ts                  # GET /api/health
```

## Keuntungan Struktur Baru:

1. **Versioning**: API v1 memungkinkan evolusi tanpa breaking changes
2. **Konsistensi**: Semua endpoint dalam kategori yang sama menggunakan pola yang sama
3. **Konsolidasi**: User management terpusat di `/users/`
4. **Skalabilitas**: Mudah menambah v2, v3 di masa depan
5. **Organisasi Logis**: Setiap domain memiliki namespace yang jelas
6. **Maintenance**: Lebih mudah maintain dan debug

## Migrasi Plan:

### Phase 1: Setup Versioning Structure
1. Buat direktori `/v1/`
2. Setup routing untuk backward compatibility

### Phase 2: Migrate Core Modules
1. Auth endpoints
2. User management (consolidate)
3. RBAC endpoints

### Phase 3: Migrate Supporting Modules
1. ABAC endpoints
2. Audit endpoints
3. Dashboard endpoints
4. Admin endpoints

### Phase 4: Update References
1. Update import paths
2. Update middleware references
3. Update service layer calls

### Phase 5: Testing & Validation
1. Test all endpoints
2. Validate backward compatibility
3. Performance testing

## Backward Compatibility:

Untuk menjaga backward compatibility, kita akan:
1. Membuat redirect dari old paths ke new paths
2. Menggunakan middleware untuk handle legacy requests
3. Gradual deprecation dengan warning headers