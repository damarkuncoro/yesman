import { AuthenticationError, ValidationError } from "../../../errors/errorHandler";

/**
 * Interface untuk Session entity - sesuai dengan schema database
 */
export interface Session {
  id: number;
  userId: number;
  refreshToken: string;
  expiresAt: Date;
  createdAt: Date;
}

/**
 * Interface untuk data pembuatan session baru
 */
export interface SessionCreateData {
  userId: string;
  expiresIn?: number; // dalam detik
}

/**
 * Interface untuk repository session
 */
export interface SessionRepository {
  create(data: Omit<Session, 'id' | 'createdAt'>): Promise<Session>;
  findById(id: number): Promise<Session | null>;
  findByToken(token: string): Promise<Session | null>;
  findByRefreshToken(refreshToken: string): Promise<Session | null>;
  findByUserId(userId: number): Promise<Session[]>;
  update(id: number, data: Partial<Session>): Promise<Session>;
  delete(id: number): Promise<void>;
  deleteByUserId(userId: number): Promise<void>;
  deleteExpired(): Promise<number>;
}

/**
 * Interface untuk statistik session
 */
export interface SessionStatistics {
  totalActiveSessions: number;
  sessionsByUser: Record<string, number>;
  averageSessionDuration: number;
}

/**
 * Interface untuk validasi session
 */
export interface SessionValidationResult {
  isValid: boolean;
  session?: Session;
  error?: string;
}

/**
 * Interface untuk security check result
 */
export interface SecurityCheckResult {
  isSuspicious: boolean;
  reasons: string[];
}

/**
 * Konfigurasi session service
 */
export interface SessionConfig {
  sessionDuration: number; // in milliseconds
  refreshThreshold: number; // in milliseconds
  maxSessionsPerUser: number;
  cleanupInterval?: number; // in milliseconds
  securityChecks: {
    validateIpAddress: boolean;
    validateUserAgent: boolean;
    maxLoginAttempts: number;
  };
}

/**
 * Default konfigurasi session
 */
export const DEFAULT_SESSION_CONFIG: SessionConfig = {
  sessionDuration: 24 * 60 * 60 * 1000, // 24 jam dalam milidetik
  refreshThreshold: 30 * 60 * 1000, // 30 menit dalam milidetik
  maxSessionsPerUser: 5,
  cleanupInterval: 60 * 60 * 1000, // 1 jam dalam milidetik
  securityChecks: {
    validateIpAddress: true,
    validateUserAgent: true,
    maxLoginAttempts: 5
  }
};

/**
 * Type untuk session error
 */
export type SessionError = AuthenticationError | ValidationError;

/**
 * Type untuk session operation result
 */
export type SessionOperationResult<T = any> = {
  success: boolean;
  data?: T;
  error?: SessionError;
  message?: string;
};

export interface SessionSecurityEvent {
  type: SessionEventType;
  sessionId: string;
  userId: string;
  details: {
    timestamp?: Date;
    [key: string]: any;
  };
  riskLevel: 'low' | 'medium' | 'high';
}

export interface SessionSecurityResult {
  isValid: boolean;
  warnings: string[];
  threats: string[];
  shouldTerminate: boolean;
  riskScore: number;
}

/**
 * Interface untuk session cleanup result
 */
export interface SessionCleanupResult {
  expiredSessionsDeleted: number;
  oldSessionsDeactivated: number;
  totalProcessed: number;
}

/**
 * Interface untuk session refresh options
 */
export interface SessionRefreshOptions {
  expiresIn?: number;
  updateLastAccessed?: boolean;
}

/**
 * Interface untuk session security options
 */
export interface SessionSecurityOptions {
  checkIpAddress?: boolean;
  checkUserAgent?: boolean;
  strictMode?: boolean;
}

/**
 * Interface untuk session query options
 */
export interface SessionQueryOptions {
  includeInactive?: boolean;
  includeExpired?: boolean;
  sortBy?: 'createdAt' | 'lastAccessedAt' | 'expiresAt';
  sortOrder?: 'asc' | 'desc';
  limit?: number;
  offset?: number;
}

/**
 * Interface untuk session creation options
 */
export interface SessionCreationOptions {
  cleanupOldSessions?: boolean;
  validateUserExists?: boolean;
  generateRefreshToken?: boolean;
}

/**
 * Interface untuk session validation options
 */
export interface SessionValidationOptions {
  updateLastAccessed?: boolean;
  checkSecurity?: boolean;
  securityOptions?: SessionSecurityOptions;
}

/**
 * Interface untuk session deactivation options
 */
export interface SessionDeactivationOptions {
  reason?: string;
  notifyUser?: boolean;
  logActivity?: boolean;
}

/**
 * Enum untuk session status
 */
export enum SessionStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  EXPIRED = 'expired',
  SUSPENDED = 'suspended'
}

/**
 * Enum untuk session event types
 */
export enum SessionEventType {
  SESSION_CREATED = 'session_created',
  SESSION_VALIDATED = 'session_validated',
  SESSION_REFRESHED = 'session_refreshed',
  SESSION_DEACTIVATED = 'session_deactivated',
  SESSION_EXPIRED = 'session_expired',
  IP_MISMATCH = 'ip_mismatch',
  USER_AGENT_MISMATCH = 'user_agent_mismatch',
  RAPID_SESSION_CREATION = 'rapid_session_creation'
}

/**
 * Interface untuk session event
 */
export interface SessionEvent {
  type: SessionEventType;
  sessionId: string;
  userId: string;
  timestamp: Date;
  metadata?: Record<string, any>;
}