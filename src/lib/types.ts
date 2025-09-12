import type { User } from "@/db/schema";

/**
 * Base interface untuk response API yang standar
 * Digunakan di seluruh aplikasi untuk konsistensi format response
 */
export interface ApiResponse<T = any> {
  success: boolean;
  message?: string;
  data?: T;
  meta?: Record<string, any>;
  errors?: Array<{ field: string; message: string }> | any;
}

/**
 * Interface untuk JWT payload
 * Standar untuk semua token JWT di aplikasi
 */
export interface JWTPayload {
  userId: number;
  email: string;
  iat: number;
  exp: number;
}

/**
 * Interface untuk authenticated user context
 * Digunakan untuk authorization dan user management
 */
export interface AuthenticatedUserContext {
  user: Omit<User, 'passwordHash'>;
  permissions: string[];
  roles: string[];
  hasGrantsAll: boolean;
}

/**
 * Interface untuk authenticated user (simplified)
 * Digunakan untuk basic user info
 */
export interface AuthenticatedUser {
  id: number;
  email: string;
  name: string;
  active: boolean;
}

/**
 * Interface untuk request options
 * Digunakan untuk HTTP client configuration
 */
export interface RequestOptions extends Omit<RequestInit, 'body'> {
  body?: any;
  requireAuth?: boolean;
}

/**
 * Type untuk HTTP methods
 */
export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';

/**
 * Type untuk RBAC actions
 */
export type RbacAction = 'create' | 'read' | 'update' | 'delete';

/**
 * Interface untuk error response
 */
export interface ErrorResponse {
  success: false;
  message: string;
  statusCode: number;
  timestamp: string;
  errors?: any;
}

/**
 * Interface untuk success response
 */
export interface SuccessResponse<T = any> {
  success: true;
  data: T;
  meta?: Record<string, any>;
}

/**
 * Union type untuk API responses
 */
export type StandardApiResponse<T = any> = SuccessResponse<T> | ErrorResponse;

/**
 * Interface untuk pagination metadata
 */
export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

/**
 * Interface untuk paginated response
 */
export interface PaginatedResponse<T = any> extends SuccessResponse<T[]> {
  meta: PaginationMeta;
}