/**
 * User Authentication Service - Modular Implementation
 * 
 * Struktur folder:
 * ├── types.ts                 - Type definitions dan interfaces
 * ├── validation.ts            - Input validation logic
 * ├── rateLimiting.ts         - Rate limiting dan login attempt tracking
 * ├── authenticationCore.ts   - Core authentication logic (login, logout, refresh)
 * ├── sessionManager.ts       - Session management operations
 * ├── statistics.ts           - Authentication statistics dan monitoring
 * └── index.ts               - Main service class dan exports
 */

import { PasswordService } from "../passwordService";
import { TokenService } from "../tokenService/index";
import { SessionService } from "../sessionService";
import { PermissionService } from "../permissionService/index";

// Import sub-services
import { UserAuthenticationValidator, createUserAuthenticationValidator } from "./validation";
import { UserAuthenticationRateLimiter, createUserAuthenticationRateLimiter } from "./rateLimiting";
import { UserAuthenticationCore, createUserAuthenticationCore } from "./authenticationCore";
import { UserAuthenticationSessionManager, createUserAuthenticationSessionManager } from "./sessionManager";
import { UserAuthenticationStatistics, createUserAuthenticationStatistics } from "./statistics";

// Import types
import {
  LoginCredentials,
  LoginResponse,
  RefreshTokenRequest,
  RefreshTokenResponse,
  SessionVerificationResponse,
  LoginStatistics,
  UserRepository,
  AUTH_CONFIG
} from "./types";

/**
 * Main User Authentication Service Class
 * Menggabungkan semua sub-services dalam satu interface yang mudah digunakan
 */
export class UserAuthenticationService {
  // Sub-services
  public readonly validator: UserAuthenticationValidator;
  public readonly rateLimiter: UserAuthenticationRateLimiter;
  public readonly core: UserAuthenticationCore;
  public readonly sessionManager: UserAuthenticationSessionManager;
  public readonly statistics: UserAuthenticationStatistics;

  constructor(
    private userRepository: UserRepository,
    private passwordService: PasswordService,
    private tokenService: TokenService,
    private sessionService: SessionService,
    private permissionService: PermissionService
  ) {
    // Initialize sub-services
    this.validator = createUserAuthenticationValidator();
    this.rateLimiter = createUserAuthenticationRateLimiter();
    this.core = createUserAuthenticationCore(
      userRepository,
      passwordService,
      tokenService,
      sessionService,
      this.validator,
      this.rateLimiter
    );
    this.sessionManager = createUserAuthenticationSessionManager(
      sessionService,
      this.validator
    );
    this.statistics = createUserAuthenticationStatistics(
      userRepository,
      this.rateLimiter,
      this.sessionManager
    );
  }

  // ===== CORE AUTHENTICATION METHODS =====

  /**
   * Login user dengan email dan password
   * @param credentials - Login credentials
   * @returns Login response dengan tokens dan session
   */
  async login(credentials: LoginCredentials): Promise<LoginResponse> {
    return this.core.login(credentials);
  }

  /**
   * Logout user (deactivate session)
   * @param sessionId - ID session yang akan di-logout
   */
  async logout(sessionId: string): Promise<void> {
    return this.core.logout(sessionId);
  }

  /**
   * Logout user berdasarkan refresh token
   * @param refreshToken - Refresh token yang akan di-logout
   */
  async logoutByRefreshToken(refreshToken: string): Promise<void> {
    try {
      // Cari session berdasarkan refresh token
      const sessionRepository = (this.sessionService as any).sessionRepository;
      const session = await sessionRepository.findByRefreshToken(refreshToken);
      
      if (!session) {
        // Jika session tidak ditemukan, tidak perlu throw error
        // karena logout tetap dianggap berhasil
        console.log('⚠️ Session not found for refresh token, logout considered successful');
        return;
      }
      
      // Logout menggunakan session ID
      await this.core.logout(session.id.toString());
    } catch (error) {
      console.error('❌ Logout by refresh token failed:', error);
      throw error;
    }
  }

  /**
   * Logout dari semua device (deactivate all sessions)
   * @param userId - ID user
   */
  async logoutFromAllDevices(userId: string): Promise<void> {
    return this.core.logoutFromAllDevices(userId);
  }

  /**
   * Refresh access token menggunakan refresh token
   * @param request - Refresh token request
   * @returns New access token dan updated session
   */
  async refreshToken(request: RefreshTokenRequest): Promise<RefreshTokenResponse> {
    return this.core.refreshToken(request);
  }

  /**
   * Verify current session
   * @param sessionToken - Session token
   * @returns Session data jika valid
   */
  async verifySession(sessionToken: string): Promise<SessionVerificationResponse> {
    return this.core.verifySession(sessionToken);
  }

  /**
   * Check apakah login dari lokasi yang mencurigakan
   * @param userId - ID user
   * @param currentIpAddress - IP address saat ini
   * @returns true jika login mencurigakan
   */
  async isSuspiciousLogin(userId: string, currentIpAddress?: string): Promise<boolean> {
    return this.core.isSuspiciousLogin(userId, currentIpAddress);
  }

  // ===== SESSION MANAGEMENT METHODS =====

  /**
   * Get active sessions untuk user
   * @param userId - ID user
   * @returns Array of active sessions
   */
  async getUserActiveSessions(userId: string): Promise<any[]> {
    return this.sessionManager.getUserActiveSessions(userId);
  }

  /**
   * Terminate specific session
   * @param userId - ID user (untuk authorization)
   * @param sessionId - ID session yang akan diterminasi
   */
  async terminateSession(userId: string, sessionId: string): Promise<void> {
    return this.sessionManager.terminateSession(userId, sessionId);
  }

  /**
   * Terminate multiple sessions
   * @param userId - ID user
   * @param sessionIds - Array of session IDs yang akan diterminasi
   */
  async terminateMultipleSessions(userId: string, sessionIds: string[]): Promise<void> {
    return this.sessionManager.terminateMultipleSessions(userId, sessionIds);
  }

  /**
   * Get session details
   * @param userId - ID user (untuk authorization)
   * @param sessionId - ID session
   * @returns Session details
   */
  async getSessionDetails(userId: string, sessionId: string): Promise<any> {
    return this.sessionManager.getSessionDetails(userId, sessionId);
  }

  /**
   * Refresh session expiry
   * @param userId - ID user (untuk authorization)
   * @param sessionId - ID session yang akan di-refresh
   * @returns Updated session
   */
  async refreshSessionExpiry(userId: string, sessionId: string): Promise<any> {
    return this.sessionManager.refreshSessionExpiry(userId, sessionId);
  }

  // ===== STATISTICS AND MONITORING METHODS =====

  /**
   * Get login statistics
   * @returns Object dengan statistik login
   */
  async getLoginStatistics(): Promise<LoginStatistics> {
    return this.statistics.getLoginStatistics();
  }

  /**
   * Get detailed authentication metrics
   * @param timeRange - Time range untuk analisis
   * @returns Detailed metrics
   */
  async getDetailedMetrics(timeRange: 'day' | 'week' | 'month' = 'day'): Promise<any> {
    return this.statistics.getDetailedMetrics(timeRange);
  }

  /**
   * Get security metrics
   * @returns Security-related metrics
   */
  async getSecurityMetrics(): Promise<any> {
    return this.statistics.getSecurityMetrics();
  }

  /**
   * Get user-specific statistics
   * @param userId - ID user
   * @returns User-specific statistics
   */
  async getUserStatistics(userId: string): Promise<any> {
    return this.statistics.getUserStatistics(userId);
  }

  /**
   * Generate authentication report
   * @param timeRange - Time range untuk report
   * @returns Comprehensive authentication report
   */
  async generateAuthenticationReport(timeRange: 'day' | 'week' | 'month' = 'day'): Promise<any> {
    return this.statistics.generateAuthenticationReport(timeRange);
  }

  // ===== RATE LIMITING METHODS =====

  /**
   * Get failed attempts count untuk email
   * @param email - Email yang akan dicek
   * @returns Jumlah failed attempts
   */
  getFailedAttemptsCount(email: string): number {
    return this.rateLimiter.getFailedAttemptsCount(email);
  }

  /**
   * Check apakah email sedang dalam lockout period
   * @param email - Email yang akan dicek
   * @returns true jika sedang dalam lockout
   */
  isInLockoutPeriod(email: string): boolean {
    return this.rateLimiter.isInLockoutPeriod(email);
  }

  /**
   * Get remaining lockout time dalam menit
   * @param email - Email yang akan dicek
   * @returns Remaining time dalam menit
   */
  getRemainingLockoutTime(email: string): number {
    return this.rateLimiter.getRemainingLockoutTime(email);
  }

  /**
   * Clear failed attempts untuk specific email (untuk admin purposes)
   * @param email - Email yang akan di-clear
   */
  clearFailedAttemptsForEmail(email: string): void {
    return this.rateLimiter.clearFailedAttemptsForEmail(email);
  }
}

/**
 * Factory function untuk membuat UserAuthenticationService
 * @param userRepository - User repository dependency
 * @param passwordService - Password service dependency
 * @param tokenService - Token service dependency
 * @param sessionService - Session service dependency
 * @param permissionService - Permission service dependency
 * @returns Instance dari UserAuthenticationService
 */
export function createUserAuthenticationService(
  userRepository: UserRepository,
  passwordService: PasswordService,
  tokenService: TokenService,
  sessionService: SessionService,
  permissionService: PermissionService
): UserAuthenticationService {
  return new UserAuthenticationService(
    userRepository,
    passwordService,
    tokenService,
    sessionService,
    permissionService
  );
}

// ===== EXPORTS =====

// Export main service
export default UserAuthenticationService;

// Export sub-services untuk advanced usage
export {
  UserAuthenticationValidator,
  UserAuthenticationRateLimiter,
  UserAuthenticationCore,
  UserAuthenticationSessionManager,
  UserAuthenticationStatistics
};

// Export factory functions
export {
  createUserAuthenticationValidator,
  createUserAuthenticationRateLimiter,
  createUserAuthenticationCore,
  createUserAuthenticationSessionManager,
  createUserAuthenticationStatistics
};

// Export types
export type {
  LoginCredentials,
  LoginResponse,
  RefreshTokenRequest,
  RefreshTokenResponse,
  SessionVerificationResponse,
  LoginStatistics,
  UserRepository
};

// Export constants
export { AUTH_CONFIG };

// ===== BACKWARD COMPATIBILITY =====
// Untuk memastikan kode existing tetap berfungsi
export { UserAuthenticationService as UserAuthenticationServiceClass };
export { createUserAuthenticationService as createUserAuthenticationServiceFunction };