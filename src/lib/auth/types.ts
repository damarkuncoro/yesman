import type { User } from "@/db/schema";

/**
 * Interface untuk JWT payload
 * Mengikuti Interface Segregation Principle
 */
export interface JWTPayload {
  userId: number;
  email: string;
  iat?: number;
  exp?: number;
}

/**
 * Interface untuk authentication response
 * Mengikuti Interface Segregation Principle
 */
export interface AuthResponse {
  user: Omit<User, 'passwordHash'>;
  accessToken: string;
  refreshToken: string;
}

/**
 * Interface untuk authenticated user context
 * Digunakan untuk middleware dan context management
 */
export interface AuthenticatedUserContext {
  user: Omit<User, 'passwordHash'>;
  roles: string[];
  permissions: string[];
  hasGrantsAll: boolean;
}

/**
 * Interface untuk authenticated user (simplified)
 */
export interface AuthenticatedUser {
  id: number;
  email: string;
  name: string;
  roles: string[];
}

/**
 * Interface untuk authentication service
 * Mengikuti Dependency Inversion Principle
 */
export interface IAuthService {
  // Token management
  verifyToken(token: string): Promise<JWTPayload | null>;
  verifyRefreshToken(token: string): Promise<JWTPayload>;
  
  // Permission management
  getUserPermissionSummary(userId: number): Promise<any>;
  checkPermission(userId: number, feature: string, action: string): Promise<boolean>;
  hasRole(userId: number, role: string): Promise<boolean>;
  hasAnyRole(userId: number, roles: string[]): Promise<boolean>;
  
  // Authentication operations
  register(userData: unknown): Promise<AuthResponse>;
  login(loginData: unknown): Promise<AuthResponse>;
  logout(refreshToken: string): Promise<void>;
  refreshAccessToken(refreshToken: string): Promise<{ accessToken: string }>;
  
  // Password management
  changePassword(userId: number, currentPassword: string, newPassword: string): Promise<void>;
}

/**
 * Interface untuk error response
 */
export interface ErrorResponse {
  success: false;
  error: {
    message: string;
    code?: string;
    statusCode: number;
    context?: Record<string, any>;
  };
}

/**
 * Interface untuk API response
 */
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: {
    message: string;
    code?: string;
    statusCode: number;
    context?: Record<string, any>;
  };
}