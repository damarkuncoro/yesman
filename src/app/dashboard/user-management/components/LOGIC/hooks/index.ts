/**
 * Base hooks untuk user management
 * Mengikuti prinsip DRY, SOLID, dan Domain-Driven Design
 */

// Export hooks
export { useApiCall } from './useApiCall'
export { useCache } from './useCache'
export { useValidation, useRealtimeValidation, commonValidationRules } from './useValidation'
export { 
  usePerformanceMonitor, 
  useDebounce, 
  useThrottle, 
  useDeepMemo, 
  useLazyRef, 
  useBatchedUpdates, 
  useVirtualList 
} from './usePerformance'

// Export utility functions
export { toast } from '../utils/toast'

// Re-export types for convenience
export type {
  UseApiCallReturn,
  ApiCallConfig,
  RetryConfig
} from './useApiCall'

export type {
  ValidationRule,
  ValidationResult,
  ValidationSchema
} from './useValidation'

export type {
  PerformanceMetrics,
  DebounceOptions
} from './usePerformance'