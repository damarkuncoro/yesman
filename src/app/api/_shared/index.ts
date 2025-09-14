/**
 * Shared API Components
 * Mengikuti prinsip DRY (Don't Repeat Yourself) dan SOLID
 * 
 * Komponen-komponen ini dapat digunakan bersama antara
 * semua API routes untuk konsistensi dan reusability
 */

// Base Handlers
export { BaseApiHandler } from './handlers/BaseApiHandler';

// Response Builders
export { 
  BaseResponseBuilder, 
  ResponseBuilder, 
  createResponseBuilder, 
  responseBuilder 
} from './builders/ResponseBuilder';
export { AuthResponseBuilder } from './auth/auth-response-builder';

// Request Handlers
export { 
  BaseRequestHandler, 
  RequestHandler, 
  createRequestHandler, 
  requestHandler 
} from './handlers/RequestHandler';
export { AuthRequestHandler } from './auth/auth-request-handler';

// Auth Components
export { AuthCookieManager } from './auth/cookie-manager';
export { AuthValidationHandler } from './handlers/validation-handler';
export { AuthErrorHandler, authErrorHandler } from './handlers/error-handler';

// Dashboard Components
export { CrudHandler, CrudHandlerBuilder, createCrudHandler } from './handlers/CrudHandler';
export { DashboardReadHandler, createDashboardReadHandler, DashboardHandlers } from './handlers/DashboardReadHandler';
export { BaseApiHandler as DashboardBaseApiHandler } from './handlers/DashboardBaseApiHandler';

// Types
export type {
  ApiResponse,
  UserData,
  TokenResponse,
  CookieConfig,
  RequestContext,
  ErrorContext,
  ValidationResult,
  HandlerConfig,
  ValidationSchema,
  RequestHandler as RequestHandlerType,
  ServiceMethod
} from './types';

// Import types for internal use
import { HandlerConfig } from './types';

/**
 * Default configurations untuk berbagai jenis API handlers
 */
export const DEFAULT_AUTH_CONFIG: HandlerConfig = {
  requireAuth: true,
  validateInput: true
};

export const DEFAULT_DASHBOARD_CONFIG: HandlerConfig = {
  requireAuth: true,
  validateInput: true,
  requiredPermissions: ['dashboard:read']
};

export const DEFAULT_PUBLIC_CONFIG: HandlerConfig = {
  requireAuth: false,
  validateInput: true
};