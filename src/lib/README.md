# Lib Utilities

Koleksi utility functions dan services yang telah diorganisir dengan baik mengikuti prinsip DRY dan SOLID.

## Struktur Folder

```
src/lib/
├── index.ts                    # Main entry point
├── types.ts                    # Shared interfaces dan types
├── utils.ts                    # General utility functions
├── api.ts                      # Backward compatibility exports
├── apiClient.ts                # Backward compatibility exports
├── authUtils.ts                # Backward compatibility exports
├── withFeature.ts              # Backward compatibility exports
├── auth/
│   ├── authService.ts          # Authentication service
│   └── authMiddleware.ts       # Authentication middleware
├── http/
│   └── httpClient.ts           # HTTP client dengan interceptors
├── response/
│   └── apiResponse.ts          # API response formatters
├── errors/
│   └── errorHandler.ts         # Error handling utilities
└── validation/
    └── validator.ts            # Validation utilities
```

## Penggunaan

### Import dari Main Entry Point

```typescript
import {
  // Types
  ApiResponse,
  AuthenticatedUser,
  
  // HTTP Client
  httpClient,
  publicHttpClient,
  
  // Authentication
  authService,
  withAuthorization,
  
  // Error Handling
  ErrorHandler,
  ValidationError,
  
  // Validation
  createValidator,
  quickValidate,
  
  // Utilities
  cn,
  formatCurrency,
  debounce,
} from '@/lib';
```

### Backward Compatibility

Semua exports lama masih tersedia untuk backward compatibility:

```typescript
// Masih bisa digunakan
import { API, API_Pages } from '@/lib/api';
import { api, publicApi } from '@/lib/apiClient';
import { withFeature } from '@/lib/withFeature';
import { verifyTokenAndGetUserContext } from '@/lib/authUtils';
```

## Fitur Utama

### 1. HTTP Client

```typescript
import { httpClient, publicHttpClient } from '@/lib';

// Authenticated requests
const response = await httpClient.get('/api/users');
const user = await httpClient.post('/api/users', userData);

// Public requests (tanpa auth)
const publicData = await publicHttpClient.get('/api/public/data');
```

### 2. Authentication Middleware

```typescript
import { withAuthorization } from '@/lib';

// Protect API route dengan feature-based authorization
export const GET = withAuthorization('users', 'read', async (request, userInfo) => {
  // Handler code dengan user info yang sudah terverifikasi
  return NextResponse.json({ users: [] });
});
```

### 3. Error Handling

```typescript
import { ErrorHandler, ValidationError, NotFoundError } from '@/lib';

try {
  // Some operation
} catch (error) {
  // Log error dengan format konsisten
  ErrorHandler.logError(error, 'UserService');
  
  // Return formatted error response
  return ErrorHandler.createErrorResponse(error);
}

// Throw custom errors
throw new ValidationError('Email tidak valid');
throw new NotFoundError('User tidak ditemukan');
```

### 4. Validation

```typescript
import { createValidator, quickValidate } from '@/lib';

// Menggunakan Validator class
const validator = createValidator()
  .field('email', userData.email, [
    { type: 'required' },
    { type: 'email' }
  ])
  .field('password', userData.password, [
    { type: 'required' },
    { type: 'minLength', params: 8 }
  ]);

validator.validateOrThrow(); // Throw ValidationError jika tidak valid

// Quick validation
const result = quickValidate(userData, {
  email: [{ type: 'required' }, { type: 'email' }],
  password: [{ type: 'required' }, { type: 'minLength', params: 8 }]
});
```

### 5. API Response Formatting

```typescript
import { AppRouterResponse, PagesRouterResponse } from '@/lib';

// App Router
export async function GET() {
  return AppRouterResponse.success({ users: [] });
}

export async function POST() {
  return AppRouterResponse.error('Validation failed', 400);
}

// Pages Router
export default function handler(req: NextApiRequest, res: NextApiResponse) {
  return PagesRouterResponse.success(res, { users: [] });
}
```

### 6. General Utilities

```typescript
import { cn, formatCurrency, debounce, sleep } from '@/lib';

// Class name utility
const className = cn('base-class', {
  'active': isActive,
  'disabled': isDisabled
});

// Currency formatting
const price = formatCurrency(150000); // "Rp 150.000"

// Debounce function
const debouncedSearch = debounce(searchFunction, 300);

// Sleep/delay
await sleep(1000); // Wait 1 second
```

## Prinsip Desain

### DRY (Don't Repeat Yourself)
- Shared types dan interfaces di `types.ts`
- Reusable utilities di berbagai modules
- Backward compatibility tanpa duplikasi kode

### SOLID Principles
- **Single Responsibility**: Setiap class/module memiliki tanggung jawab tunggal
- **Open/Closed**: Mudah di-extend tanpa modifikasi existing code
- **Liskov Substitution**: Subclasses dapat menggantikan parent classes
- **Interface Segregation**: Interfaces yang spesifik dan focused
- **Dependency Inversion**: Depend on abstractions, not concretions

### Separation of Concerns
- Authentication logic terpisah dari HTTP client
- Error handling terpusat dan konsisten
- Validation logic terpisah dari business logic
- Response formatting terpisah dari handler logic

## Migration Guide

Jika Anda menggunakan utilities lama, tidak perlu mengubah kode existing. Semua exports lama masih tersedia untuk backward compatibility. Namun, untuk kode baru, disarankan menggunakan imports dari main entry point (`@/lib`) untuk mendapatkan manfaat dari struktur yang lebih baik.

### Contoh Migration

```typescript
// Lama (masih bisa digunakan)
import { API } from '@/lib/api';
import { api } from '@/lib/apiClient';
import { withFeature } from '@/lib/withFeature';

// Baru (disarankan)
import { AppRouterResponse, httpClient, withAuthorization } from '@/lib';
```