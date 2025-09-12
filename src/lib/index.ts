/**
 * Main entry point untuk semua lib utilities
 * Mengorganisir exports dengan folder-based approach untuk better separation of concerns
 */

// Types dan interfaces shared
export type {
  ApiResponse,
  RequestOptions,
  JWTPayload,
  AuthenticatedUserContext,
  AuthenticatedUser,
} from './types';

// API Response utilities
export {
  AppRouterResponse,
  PagesRouterResponse,
} from './response/apiResponse';

// HTTP Client
export {
  HttpClient,
  httpClient,
  publicHttpClient,
} from './http/httpClient';

// Authentication services
export {
  authService,
  AuthService,
  AuthErrorHandler,
  verifyTokenAndGetUserContext,
  checkUserPermission,
  hasRole,
  hasAnyRole,
  createErrorResponse,
  isErrorResponse,
} from './auth/authService';

// Export unified services
export { authService as unifiedAuthService } from './auth/authService';
export { ValidationService as unifiedValidationService } from './validation/validator';
export { ErrorHandler as unifiedErrorHandler } from './errors/errorHandler';

// Authentication middleware
export {
  withAuthorization,
  withAuthentication,
  getUserFromHeaders,
} from './auth/authMiddleware';

// Error handling
export {
  ErrorHandler,
  BaseError,
  ValidationError,
  AuthenticationError,
  AuthorizationError,
  NotFoundError,
  ConflictError,
  RateLimitError,
  ExternalServiceError,
  errorUtils,
} from './errors/errorHandler';

// Validation utilities
export {
  Validator,
  validate,
  createValidator,
  quickValidate,
  quickValidateOrThrow,
} from './validation/validator';
export type {
  ValidationRule,
  ValidationResult,
} from './validation/validator';

// General utilities
export {
  cn,
  formatCurrency,
  formatDate,
  debounce,
  throttle,
  generateRandomString,
  capitalize,
  truncateText,
  deepClone,
  sleep,
} from './utils';

// Backward compatibility exports
export { AppRouterResponse as API } from './response/apiResponse';
export { PagesRouterResponse as API_Pages } from './response/apiResponse';
export { httpClient as api, publicHttpClient as publicApi } from './http/httpClient';
export { withAuthorization as withFeature } from './auth/authMiddleware';