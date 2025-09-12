/**
 * AuthContext Module
 * 
 * Module ini menyediakan authentication context untuk aplikasi Next.js
 * dengan menggunakan React Context API dan useReducer untuk state management.
 * 
 * Struktur module:
 * - types.ts: Type definitions dan interfaces
 * - reducer.ts: Auth state reducer dengan localStorage integration
 * - actions.ts: Action creators untuk type-safe dispatching
 * - context.ts: React Context definition
 * - provider.tsx: AuthProvider component dengan business logic
 * - hook.ts: useAuth custom hook
 * 
 * Usage:
 * ```tsx
 * import { AuthProvider, useAuth } from '@/contexts/AuthContext';
 * 
 * // Wrap app with provider
 * <AuthProvider>
 *   <App />
 * </AuthProvider>
 * 
 * // Use in components
 * const { user, login, logout } = useAuth();
 * ```
 */

// Export types
export type { 
  AuthUser, 
  AuthState, 
  AuthAction, 
  AuthContextType,
  AuthApiResponse,
  UpdateProfileResponse 
} from './types';

// Export components and hooks
export { AuthProvider } from './provider';
export { useAuth } from './hook';

// Export utilities (jika diperlukan untuk testing atau advanced usage)
export { authReducer } from './reducer';
export { 
  setLoadingAction,
  loginSuccessAction,
  logoutAction,
  updateUserAction 
} from './actions';
export { initialAuthState } from './types';