/**
 * Index file untuk mengekspor semua custom hooks authentication
 * Mengikuti prinsip DRY dan memudahkan import dari satu lokasi
 */

// Export useAuthForm hook dan types
export {
  useAuthForm,
  type AuthFormState,
  type LoginFormData,
  type RegisterFormData,
  type ForgotPasswordFormData,
  type ResetPasswordFormData
} from './useAuthForm'

// Export useAuthValidation hook dan types
export {
  useAuthValidation,
  authValidationRules,
  type ValidationRule,
  type ValidationConfig,
  type ValidationResult
} from './useAuthValidation'

// Export useAuthRedirect hook dan types
export {
  useAuthRedirect,
  type RedirectConfig
} from './useAuthRedirect'

// Export useAuthSession hook dan types
export {
  useAuthSession,
  type UserSession,
  type TokenData,
  type SessionState,
  type SessionConfig
} from './useAuthSession'

// Re-export default exports dengan alias untuk menghindari konflik
export { default as AuthFormHook } from './useAuthForm'
export { default as AuthValidationHook } from './useAuthValidation'
export { default as AuthRedirectHook } from './useAuthRedirect'
export { default as AuthSessionHook } from './useAuthSession'