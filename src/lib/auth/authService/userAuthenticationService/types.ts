// Type definitions untuk User Authentication Service

/**
 * Interface untuk credentials login
 */
export interface LoginCredentials {
  email: string;
  password: string;
  rememberMe?: boolean;
  ipAddress?: string;
  userAgent?: string;
}

/**
 * Interface untuk response login
 */
export interface LoginResponse {
  user: {
    id: string;
    name: string;
    email: string;
    department: string | null;
    region: string | null;
    level: number | null;
    role?: {
      id: string;
      name: string;
      permissions?: string[];
    };
  };
  tokens: {
    accessToken: string;
    refreshToken: string;
    expiresIn: number;
  };
  session: {
    id: string;
    expiresAt: Date;
  };
}

/**
 * Interface untuk refresh token request
 */
export interface RefreshTokenRequest {
  refreshToken: string;
  ipAddress?: string;
  userAgent?: string;
}

/**
 * Interface untuk refresh token response
 */
export interface RefreshTokenResponse {
  accessToken: string;
  expiresIn: number;
  session: {
    id: string;
    expiresAt: Date;
  };
}

/**
 * Interface untuk session verification response
 */
export interface SessionVerificationResponse {
  session: any; // Session type dari sessionService
  user: any;
}

/**
 * Interface untuk login statistics
 */
export interface LoginStatistics {
  totalLogins: number;
  uniqueUsers: number;
  failedAttempts: number;
  activeSessionsCount: number;
  loginsByHour: Record<number, number>;
}

/**
 * Interface untuk login attempt tracking
 */
export interface LoginAttempt {
  count: number;
  lastAttempt: Date;
}

/**
 * Interface untuk UserRepository dependency
 */
export interface UserRepository {
  findByEmail(email: string): Promise<any | null>;
  findById(id: string): Promise<any | null>;
  updateLastLogin(id: string, loginData: { lastLoginAt: Date; lastLoginIp?: string }): Promise<void>;
}

/**
 * Configuration constants untuk authentication
 */
export const AUTH_CONFIG = {
  MAX_LOGIN_ATTEMPTS: 5,
  LOCKOUT_DURATION: 15 * 60 * 1000, // 15 menit
  DEFAULT_SESSION_DURATION: 24 * 60 * 60, // 1 hari
  REMEMBER_ME_DURATION: 30 * 24 * 60 * 60, // 30 hari
} as const;

/**
 * Type untuk authentication errors
 */
export type AuthenticationErrorType = 
  | 'INVALID_CREDENTIALS'
  | 'ACCOUNT_INACTIVE'
  | 'RATE_LIMITED'
  | 'INVALID_TOKEN'
  | 'SESSION_EXPIRED'
  | 'SUSPICIOUS_LOGIN';

/**
 * Type untuk validation errors
 */
export type ValidationErrorType =
  | 'MISSING_EMAIL'
  | 'MISSING_PASSWORD'
  | 'INVALID_EMAIL_FORMAT'
  | 'INVALID_INPUT';