# Authentication Hooks

Koleksi custom hooks untuk mengelola state dan lifecycle authentication dalam aplikasi Next.js. Hooks ini dirancang mengikuti prinsip SOLID, DRY, dan Domain-Driven Design.

## Struktur Hooks

### 1. useAuthForm
Hook untuk mengelola state dan lifecycle form authentication.

**Features:**
- State management untuk loading, error, dan success
- Method untuk handle form submission dengan error handling
- Reset state functionality

**Usage:**
```typescript
import { useAuthForm } from '../hook'

const LoginComponent = () => {
  const { isLoading, error, success, handleSubmit, setError, resetState } = useAuthForm()
  
  const onSubmit = async (data: LoginFormData) => {
    await handleSubmit(async () => {
      // API call logic here
      const response = await loginAPI(data)
      if (!response.ok) throw new Error('Login failed')
    })
  }
}
```

### 2. useAuthValidation
Hook untuk mengelola validasi form dengan aturan yang dapat dikonfigurasi.

**Features:**
- Real-time validation
- Predefined validation rules untuk authentication
- Custom validation rules
- Field-level dan form-level validation

**Usage:**
```typescript
import { useAuthValidation, authValidationRules } from '../hook'

const RegisterComponent = () => {
  const validation = useAuthValidation({
    email: authValidationRules.email,
    password: authValidationRules.password,
    name: authValidationRules.name
  })
  
  const handleFieldChange = (field: string, value: string) => {
    validation.handleFieldChange(field, value)
  }
  
  const handleSubmit = (formData: any) => {
    const result = validation.validateForm(formData)
    if (result.isValid) {
      // Submit form
    }
  }
}
```

### 3. useAuthRedirect
Hook untuk mengelola redirect dan navigation dalam authentication flow.

**Features:**
- Redirect setelah login/logout/register
- URL redirect dari query parameters
- Protection terhadap open redirect vulnerability
- Auto-redirect dengan delay

**Usage:**
```typescript
import { useAuthRedirect } from '../hook'

const LoginComponent = () => {
  const { redirectAfterLogin, redirectToLogin, getRedirectUrl } = useAuthRedirect({
    successUrl: '/dashboard',
    failureUrl: '/login'
  })
  
  const handleLoginSuccess = () => {
    redirectAfterLogin() // Akan redirect ke URL dari query param atau /dashboard
  }
}
```

### 4. useAuthSession
Hook untuk mengelola session dan token authentication dengan auto-refresh.

**Features:**
- Session persistence di localStorage
- Auto token refresh
- Permission dan role checking
- Session expiry handling

**Usage:**
```typescript
import { useAuthSession } from '../hook'

const App = () => {
  const {
    user,
    isAuthenticated,
    isLoading,
    setSession,
    clearSession,
    hasPermission,
    hasRole
  } = useAuthSession({
    autoRefresh: true,
    refreshThreshold: 5 // 5 menit sebelum expire
  })
  
  if (isLoading) return <div>Loading...</div>
  
  if (!isAuthenticated) {
    return <LoginForm onSuccess={(user, token) => setSession(user, token)} />
  }
  
  return (
    <div>
      <h1>Welcome {user?.name}</h1>
      {hasPermission('admin') && <AdminPanel />}
      {hasRole('manager') && <ManagerDashboard />}
    </div>
  )
}
```

## Import Patterns

### Named Imports (Recommended)
```typescript
import { useAuthForm, useAuthValidation, authValidationRules } from '../hook'
```

### Individual Imports
```typescript
import { useAuthForm } from '../hook/useAuthForm'
import { useAuthValidation } from '../hook/useAuthValidation'
```

### Alias Imports
```typescript
import { AuthFormHook, AuthValidationHook } from '../hook'
```

## Best Practices

1. **Separation of Concerns**: Setiap hook memiliki tanggung jawab yang spesifik
2. **Reusability**: Hooks dapat digunakan di berbagai komponen authentication
3. **Type Safety**: Semua hooks menggunakan TypeScript dengan interface yang jelas
4. **Error Handling**: Built-in error handling dan validation
5. **Performance**: Menggunakan useCallback dan useMemo untuk optimasi

## Architecture Benefits

- **Single Responsibility Principle**: Setiap hook menangani satu aspek authentication
- **DRY (Don't Repeat Yourself)**: Logic yang sama tidak perlu ditulis berulang
- **SOLID Principles**: Interface yang jelas dan dependency yang minimal
- **Domain-Driven Design**: Hooks diorganisir berdasarkan domain authentication
- **High Cohesion, Low Coupling**: Hooks saling independen namun dapat bekerja sama

## Testing

Setiap hook dapat ditest secara independen menggunakan React Testing Library:

```typescript
import { renderHook, act } from '@testing-library/react'
import { useAuthForm } from '../hook/useAuthForm'

test('useAuthForm should handle form submission', async () => {
  const { result } = renderHook(() => useAuthForm())
  
  await act(async () => {
    await result.current.handleSubmit(async () => {
      // Mock API call
    })
  })
  
  expect(result.current.success).toBe(true)
})
```