# Route Management Documentation

## Overview
Route Management adalah modul untuk mengelola mapping antara route API dengan fitur dan role dalam sistem RBAC (Role-Based Access Control). Modul ini memungkinkan admin untuk mengatur akses ke endpoint API berdasarkan role pengguna.

## Struktur Komponen

### 1. RouteManagementTabs (Main Container)
**File:** `components/route-management-tabs.tsx`

**Fungsi:**
- Komponen utama yang mengatur navigasi antar tab
- Mengelola state untuk tab aktif dan route yang dipilih
- Mengintegrasikan semua handler CRUD operations

**State Management:**
- `activeTab`: Tab yang sedang aktif (list, detail, create-edit)
- `selectedRouteId`: ID route yang dipilih untuk detail/edit
- `isEditMode`: Flag untuk membedakan mode create vs edit

**Handlers:**
- `handleRouteSelect()`: Navigasi ke detail route
- `handleRouteEdit()`: Navigasi ke form edit route
- `handleRouteCreate()`: Navigasi ke form create route
- `handleRouteDelete()`: Menghapus route dengan konfirmasi
- `handleSuccess()`: Callback setelah operasi berhasil
- `handleCancel()`: Membatalkan operasi dan kembali ke list

### 2. RouteListTab (List View)
**File:** `components/route-list-tab.tsx`

**Fungsi:**
- Menampilkan daftar semua route dalam bentuk tabel
- Menyediakan fitur search dan filter
- Menangani operasi view, edit, dan delete

**Features:**
- **Search**: Pencarian berdasarkan path, feature name, atau description
- **Filter Method**: Filter berdasarkan HTTP method (GET, POST, PUT, DELETE, PATCH)
- **Filter Feature**: Filter berdasarkan feature yang terkait
- **Actions**: View detail, Edit, Delete dengan konfirmasi

**API Integration:**
- `GET /api/rbac/route-features`: Mengambil daftar semua route-feature mappings
- Data ditransformasi untuk menampilkan informasi feature dan role count

### 3. RouteCreateEditTab (Form View)
**File:** `components/route-create-edit-tab.tsx`

**Fungsi:**
- Form untuk membuat atau mengedit route-feature mapping
- Mengelola policies dan role assignments
- Validasi form menggunakan Zod schema

**Form Fields:**
- `path`: Path endpoint API (required)
- `method`: HTTP method (optional, default ALL)
- `featureId`: Feature yang terkait (required)
- `description`: Deskripsi route (optional)
- `isActive`: Status aktif/non-aktif
- `roleIds`: Array role yang memiliki akses
- `policies`: Array kebijakan akses dengan conditions

**API Integration:**
- `GET /api/rbac/features`: Mengambil daftar features
- `GET /api/rbac/roles`: Mengambil daftar roles
- `GET /api/rbac/route-features/{id}`: Mengambil detail route (edit mode)
- `POST /api/rbac/route-features`: Membuat route baru
- `PUT /api/rbac/route-features/{id}`: Update route existing

### 4. RouteDetailTab (Detail View)
**File:** `components/route-detail-tab.tsx`

**Fungsi:**
- Menampilkan detail lengkap dari route-feature mapping
- Menampilkan policies dan role assignments
- Menyediakan aksi untuk edit

## Alur Data (UI to Database)

### 1. Create Route Flow
```
User Input (Form) → Validation (Zod) → API Call (POST) → Database Insert → UI Update
```

**Detail Steps:**
1. User mengisi form di `RouteCreateEditTab`
2. Form divalidasi menggunakan Zod schema
3. Data dikirim ke `POST /api/rbac/route-features`
4. Backend memproses dan menyimpan ke database
5. Response success memicu refresh UI dan navigasi ke list

### 2. Read Routes Flow
```
Component Mount → API Call (GET) → Data Transform → UI Render
```

**Detail Steps:**
1. `RouteListTab` dimount, memanggil `loadRoutes()`
2. API call ke `GET /api/rbac/route-features`
3. Data response ditransformasi untuk UI (feature names, role counts)
4. State diupdate dan tabel dirender

### 3. Update Route Flow
```
Edit Button → Load Existing Data → Form Pre-fill → User Edit → Validation → API Call (PUT) → Database Update → UI Update
```

**Detail Steps:**
1. User klik edit button di `RouteListTab`
2. Navigasi ke `RouteCreateEditTab` dengan `isEditMode=true`
3. Form memuat data existing dari `GET /api/rbac/route-features/{id}`
4. User mengedit data dan submit
5. Data divalidasi dan dikirim ke `PUT /api/rbac/route-features/{id}`
6. Database diupdate dan UI refresh

### 4. Delete Route Flow
```
Delete Button → Confirmation Dialog → API Call (DELETE) → Database Delete → UI Update
```

**Detail Steps:**
1. User klik delete button di `RouteListTab`
2. AlertDialog muncul untuk konfirmasi
3. Setelah konfirmasi, API call ke `DELETE /api/rbac/route-features/{id}`
4. Database record dihapus
5. UI diupdate dengan menghapus item dari list

## Database Schema

### Route-Feature Mapping Table
```sql
CREATE TABLE route_features (
  id SERIAL PRIMARY KEY,
  path VARCHAR(255) NOT NULL,
  method VARCHAR(10), -- GET, POST, PUT, DELETE, PATCH, atau NULL untuk ALL
  feature_id INTEGER REFERENCES features(id),
  description TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### Related Tables
- `features`: Menyimpan daftar fitur aplikasi
- `roles`: Menyimpan daftar role pengguna
- `route_role_mappings`: Junction table untuk many-to-many relationship antara routes dan roles
- `policies`: Menyimpan kebijakan akses dengan conditions

## API Endpoints

### Route Features
- `GET /api/rbac/route-features` - List semua route-feature mappings
- `GET /api/rbac/route-features/{id}` - Detail route-feature mapping
- `POST /api/rbac/route-features` - Create route-feature mapping baru
- `PUT /api/rbac/route-features/{id}` - Update route-feature mapping
- `DELETE /api/rbac/route-features/{id}` - Delete route-feature mapping

### Supporting Endpoints
- `GET /api/rbac/features` - List semua features
- `GET /api/rbac/roles` - List semua roles

## Error Handling

### Frontend Error Handling
- Form validation errors ditampilkan inline
- API errors ditampilkan menggunakan toast notifications
- Loading states untuk operasi async
- Confirmation dialogs untuk operasi destructive

### Backend Error Handling
- Validation errors (400 Bad Request)
- Authentication errors (401 Unauthorized)
- Authorization errors (403 Forbidden)
- Not found errors (404 Not Found)
- Server errors (500 Internal Server Error)

## Security Considerations

### Authentication
- Semua API calls menggunakan Bearer token authentication
- Token diambil dari `useAuth` context

### Authorization
- Hanya admin yang dapat mengakses route management
- Setiap API call divalidasi di backend

### Data Validation
- Frontend validation menggunakan Zod schema
- Backend validation untuk data integrity
- SQL injection prevention

## Performance Optimizations

### Frontend
- Debounced search untuk mengurangi API calls
- Optimistic updates untuk better UX
- Lazy loading untuk large datasets

### Backend
- Database indexing pada kolom yang sering diquery
- Pagination untuk large result sets
- Caching untuk data yang jarang berubah

## Testing Strategy

### Unit Tests
- Component rendering tests
- Form validation tests
- Utility function tests

### Integration Tests
- API endpoint tests
- Database operation tests
- End-to-end user flows

### Manual Testing
- Cross-browser compatibility
- Mobile responsiveness
- Accessibility compliance

## Deployment Considerations

### Environment Variables
- API base URL configuration
- Authentication settings
- Database connection strings

### Database Migrations
- Schema creation scripts
- Data seeding for initial setup
- Backup and recovery procedures

## Future Enhancements

### Planned Features
- Bulk operations (create/update/delete multiple routes)
- Import/export functionality
- Audit logging untuk track changes
- Advanced filtering dan sorting
- Route testing interface

### Performance Improvements
- Virtual scrolling untuk large lists
- Real-time updates menggunakan WebSocket
- Advanced caching strategies

## Troubleshooting

### Common Issues
1. **Routes tidak muncul**: Check API endpoint dan authentication
2. **Form validation errors**: Verify Zod schema dan input data
3. **Delete tidak berfungsi**: Check permissions dan API response
4. **Performance issues**: Monitor API response times dan optimize queries

### Debug Tools
- Browser developer tools untuk network requests
- Console logs untuk error tracking
- Database query logs untuk performance analysis