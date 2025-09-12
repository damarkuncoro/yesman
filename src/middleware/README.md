# Middleware Architecture

Middleware ini telah direfactor mengikuti prinsip **SOLID**, **DRY**, dan **Domain-Driven Design (DDD)** untuk meningkatkan maintainability, testability, dan scalability.

## Struktur Folder

```
src/middleware/
├── auth/                    # Authentication & Authorization handlers
│   ├── authHandler.ts       # Authentication logic (SRP)
│   ├── authorizationHandler.ts # Authorization logic (SRP)
│   └── middlewareOrchestrator.ts # Main orchestrator (DIP)
├── context/                 # Context creation logic
│   └── contextFactory.ts    # Factory untuk authorization context
├── route/                   # Route-specific handlers
│   └── routeHandler.ts      # Route authorization logic
├── types/                   # Type definitions
│   └── index.ts            # Interfaces dan types
├── utils/                   # Utility functions
│   └── routeMatcher.ts     # Route matching utilities
├── index.ts                # Main exports
├── middlewareFactory.ts    # Main factory dengan DI
└── README.md               # Dokumentasi ini
```

## Prinsip SOLID yang Diterapkan

### 1. Single Responsibility Principle (SRP)
- **AuthHandler**: Hanya menangani authentication
- **AuthorizationHandler**: Hanya menangani authorization
- **RouteHandler**: Hanya menangani route-specific logic
- **ContextFactory**: Hanya membuat authorization context
- **RouteMatcher**: Hanya menangani route matching

### 2. Open/Closed Principle (OCP)
- Semua handler menggunakan interface yang dapat di-extend
- Factory pattern memungkinkan penambahan handler baru tanpa mengubah kode existing

### 3. Liskov Substitution Principle (LSP)
- Semua implementation mengikuti contract dari interface
- Handler dapat diganti dengan implementation lain tanpa breaking changes

### 4. Interface Segregation Principle (ISP)
- Interface dibagi berdasarkan tanggung jawab spesifik
- Tidak ada interface yang memaksa class mengimplement method yang tidak digunakan

### 5. Dependency Inversion Principle (DIP)
- High-level modules (MiddlewareOrchestrator) tidak depend pada low-level modules
- Semua dependencies di-inject melalui constructor
- Factory pattern untuk dependency management

## Prinsip DRY (Don't Repeat Yourself)

- **Shared Types**: Semua types didefinisikan sekali di `types/index.ts`
- **Utility Functions**: Route matching logic di-centralize di `utils/routeMatcher.ts`
- **Factory Pattern**: Dependency creation di-centralize di `middlewareFactory.ts`
- **Error Handling**: Consistent error handling di semua handler

## Prinsip KISS (Keep It Simple, Stupid)

- Setiap class memiliki tanggung jawab yang jelas dan sederhana
- Method names yang descriptive dan mudah dipahami
- Minimal dependencies antar module

## Usage

### Basic Usage
```typescript
import { createRouteAuthorizationMiddleware } from '@/middleware';

// Untuk route-based authorization
const middleware = createRouteAuthorizationMiddleware();
const result = await middleware.handleRouteAuthorization(request, 'read');
```

### Advanced Usage
```typescript
import { 
  createAuthHandler,
  createAuthorizationHandler,
  createRouteHandler,
  createContextFactory,
  createRouteMatcher
} from '@/middleware';

// Custom configuration dengan dependency injection
const routeMatcher = createRouteMatcher();
const contextFactory = createContextFactory();
const authHandler = createAuthHandler(contextFactory);
const authorizationHandler = createAuthorizationHandler();
const routeHandler = createRouteHandler(
  routeMatcher,
  authHandler,
  authorizationHandler,
  contextFactory
);
```

## Testing

Struktur ini memudahkan unit testing karena:
- Setiap handler dapat di-test secara terpisah
- Dependencies dapat di-mock dengan mudah
- Clear separation of concerns

```typescript
// Example unit test
const mockContextFactory = {
  createAuthorizationContext: jest.fn(),
  createPublicContext: jest.fn()
};

const authHandler = createAuthHandler(mockContextFactory);
// Test authHandler secara isolated
```

## Migration dari Struktur Lama

File `src/middleware/authorizationMiddleware.ts` yang lama telah dipecah menjadi:
- Authentication logic → `auth/authHandler.ts`
- Authorization logic → `auth/authorizationHandler.ts`
- Route handling → `route/routeHandler.ts`
- Context creation → `context/contextFactory.ts`
- Utility functions → `utils/routeMatcher.ts`

File `src/middleware.ts` sekarang menggunakan factory pattern untuk dependency injection.

## Benefits

1. **Maintainability**: Easier to modify individual components
2. **Testability**: Each component can be tested in isolation
3. **Scalability**: Easy to add new features without affecting existing code
4. **Reusability**: Components can be reused in different contexts
5. **Type Safety**: Strong typing throughout the architecture
6. **Performance**: Singleton pattern untuk shared instances