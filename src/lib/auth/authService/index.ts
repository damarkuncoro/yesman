/**
 * Auth Service Module Index
 * Mengekspor semua service authentication yang telah dimodularisasi
 * Mengikuti prinsip Domain-Driven Design dan Single Responsibility Principle
 */

// Core Services
export { TokenService, createTokenService } from './tokenService/index';
export { PasswordService, passwordService } from './passwordService';
export { PermissionService, permissionService } from './permissionService';
export { SessionService } from './sessionService';

// Types
export type {
  JWTPayload,
  AuthResponse,
  IAuthService,
  AuthenticatedUserContext,
  ErrorResponse
} from '../types';

// Re-export utility functions from main authService
export {
  verifyTokenAndGetUserContext,
  verifyRefreshTokenAndGetUserContext,
  checkUserPermission,
  hasRole,
  hasAnyRole
} from '../authService';