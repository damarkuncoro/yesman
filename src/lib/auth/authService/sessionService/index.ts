import {
  Session,
  SessionCreateData,
  SessionRepository,
  SessionConfig,
  SessionOperationResult,
  SessionValidationResult,
  SessionSecurityResult,
  SessionCleanupResult,
  SessionDeactivationOptions,
  DEFAULT_SESSION_CONFIG
} from "./types";
import { SessionValidator, createSessionValidator } from "./validation";
import { SessionCreator, createSessionCreator } from "./sessionCreator";
import { SessionValidationService, createSessionValidationService } from "./sessionValidator";
import { SessionCleanupService, createSessionCleanupService } from "./sessionCleanup";
import { SessionSecurityService, createSessionSecurityService } from "./sessionSecurity";

/**
 * Kelas utama SessionService yang menggabungkan semua sub-services
 * Menyediakan interface yang sama dengan file asli untuk backward compatibility
 */
export class SessionService {
  private validator: SessionValidator;
  private creator: SessionCreator;
  private validationService: SessionValidationService;
  private cleanupService: SessionCleanupService;
  private securityService: SessionSecurityService;
  private config: SessionConfig;

  constructor(
    private sessionRepository: SessionRepository,
    config: Partial<SessionConfig> = {}
  ) {
    this.config = { ...DEFAULT_SESSION_CONFIG, ...config };
    
    // Initialize sub-services
    this.validator = createSessionValidator(this.config);
    this.creator = createSessionCreator(sessionRepository, this.config, this.validator);
    this.validationService = createSessionValidationService(sessionRepository, this.config, this.validator);
    this.cleanupService = createSessionCleanupService(sessionRepository, this.config, this.validator);
    this.securityService = createSessionSecurityService(sessionRepository, this.config, this.validator);
  }

  // ==================== SESSION CREATION ====================

  /**
   * Buat session baru untuk user
   * @param sessionData - Data untuk membuat session
   * @returns Session yang dibuat atau error
   */
  async createSession(sessionData: SessionCreateData): Promise<SessionOperationResult<Session>> {
    try {
      const session = await this.creator.createSession(sessionData);
      return {
        success: true,
        data: session
      };
    } catch (error) {
      return {
        success: false,
        error: error as any,
        message: 'Failed to create session'
      };
    }
  }

  /**
   * Buat session dengan cleanup otomatis untuk user yang melebihi limit
   * @param sessionData - Data untuk membuat session
   * @returns Session yang dibuat atau error
   */
  async createSessionWithCleanup(sessionData: SessionCreateData): Promise<SessionOperationResult<Session>> {
    try {
      // First cleanup old sessions for the user
      await this.cleanupService.cleanupUserSessions(sessionData.userId);
      
      // Then create new session
      const session = await this.creator.createSession(sessionData);
      return {
        success: true,
        data: session
      };
    } catch (error) {
      return {
        success: false,
        error: error as any,
        message: 'Failed to create session with cleanup'
      };
    }
  }

  // ==================== SESSION VALIDATION ====================

  /**
   * Validasi session berdasarkan token
   * @param token - Token session
   * @param ipAddress - IP address saat ini (opsional)
   * @param userAgent - User agent saat ini (opsional)
   * @returns Hasil validasi session
   */
  async validateSession(
    token: string,
    ipAddress?: string,
    userAgent?: string
  ): Promise<SessionValidationResult> {
    return this.validationService.checkSessionValidity(token);
  }

  /**
   * Validasi session berdasarkan ID
   * @param sessionId - ID session
   * @param ipAddress - IP address saat ini (opsional)
   * @param userAgent - User agent saat ini (opsional)
   * @returns Hasil validasi session
   */
  async validateSessionById(
    sessionId: string,
    ipAddress?: string,
    userAgent?: string
  ): Promise<SessionValidationResult> {
    try {
      const session = await this.validationService.validateSessionById(sessionId);
      return {
        isValid: true,
        session: session
      };
    } catch (error) {
      return {
        isValid: false,
        session: undefined,
        error: error instanceof Error ? error.message : 'Session validation failed'
      };
    }
  }

  /**
   * Refresh session (perpanjang waktu expired)
   * @param sessionId - ID session
   * @returns Session yang di-refresh atau error
   */
  async refreshSession(sessionId: string): Promise<SessionOperationResult<Session>> {
    try {
      const session = await this.validationService.validateAndRefreshSession(sessionId);
      return {
        success: true,
        data: session
      };
    } catch (error) {
      return {
        success: false,
        error: error as any,
        message: 'Failed to refresh session'
      };
    }
  }

  /**
   * Get session berdasarkan token
   * @param token - Token session
   * @returns Session atau null jika tidak ditemukan
   */
  async getSessionByToken(token: string): Promise<Session | null> {
    try {
      const session = await this.validationService.validateSessionByToken(token);
      return session;
    } catch (error) {
      return null;
    }
  }

  /**
   * Get session berdasarkan ID
   * @param sessionId - ID session
   * @returns Session atau null jika tidak ditemukan
   */
  async getSessionById(sessionId: string): Promise<Session | null> {
    try {
      return await this.sessionRepository.findById(parseInt(sessionId));
    } catch (error) {
      console.error('❌ Failed to get session by ID:', error);
      return null;
    }
  }

  /**
   * Get semua session aktif untuk user
   * @param userId - ID user
   * @returns Array of active sessions
   */
  async getUserSessions(userId: string): Promise<Session[]> {
    try {
      const sessions = await this.sessionRepository.findByUserId(parseInt(userId));
      return sessions.filter(session => 
        session.expiresAt > new Date()
      );
    } catch (error) {
      console.error('❌ Failed to get user sessions:', error);
      return [];
    }
  }

  // ==================== SESSION CLEANUP ====================

  /**
   * Deactivate session (logout)
   * @param sessionId - ID session
   * @param options - Opsi deactivation
   */
  async deactivateSession(
    sessionId: string,
    options: SessionDeactivationOptions = {}
  ): Promise<void> {
    return this.cleanupService.deactivateSession(sessionId, options);
  }

  /**
   * Deactivate semua session user (logout from all devices)
   * @param userId - ID user
   * @param options - Opsi deactivation
   */
  async deactivateAllUserSessions(
    userId: string,
    options: SessionDeactivationOptions = {}
  ): Promise<void> {
    return this.cleanupService.deactivateAllUserSessions(userId, options);
  }

  /**
   * Cleanup expired sessions
   * @returns Jumlah session yang dihapus
   */
  async cleanupExpiredSessions(): Promise<number> {
    return this.cleanupService.cleanupExpiredSessions();
  }

  /**
   * Comprehensive cleanup - expired sessions dan user limits
   * @returns Hasil cleanup detail
   */
  async performComprehensiveCleanup(): Promise<SessionCleanupResult> {
    return this.cleanupService.performComprehensiveCleanup();
  }

  /**
   * Start automatic cleanup dengan interval
   * @param intervalMs - Interval dalam milidetik (opsional)
   */
  startAutomaticCleanup(intervalMs?: number): void {
    return this.cleanupService.startAutomaticCleanup(intervalMs);
  }

  /**
   * Stop automatic cleanup
   */
  stopAutomaticCleanup(): void {
    return this.cleanupService.stopAutomaticCleanup();
  }

  // ==================== SESSION SECURITY ====================

  /**
   * Validasi security session dengan berbagai checks
   * @param session - Session yang akan divalidasi
   * @param currentIp - IP address saat ini
   * @param currentUserAgent - User agent saat ini
   * @returns Hasil validasi security
   */
  async validateSessionSecurity(
    session: Session,
    currentIp?: string,
    currentUserAgent?: string
  ): Promise<SessionSecurityResult> {
    return this.securityService.validateSessionSecurity(session, currentIp, currentUserAgent);
  }

  /**
   * Get security events untuk user atau session
   * @param filters - Filter untuk events
   * @returns Array of security events
   */
  getSecurityEvents(filters: {
    userId?: string;
    sessionId?: string;
    since?: Date;
    limit?: number;
  } = {}) {
    return this.securityService.getSecurityEvents(filters);
  }

  /**
   * Get security statistics
   * @param timeWindow - Time window dalam milidetik
   * @returns Security statistics
   */
  getSecurityStatistics(timeWindow?: number) {
    return this.securityService.getSecurityStatistics(timeWindow);
  }

  // ==================== CONFIGURATION ====================

  /**
   * Update konfigurasi session service
   * @param newConfig - Konfigurasi baru
   */
  updateConfig(newConfig: Partial<SessionConfig>): void {
    this.config = { ...this.config, ...newConfig };
    
    // Update all sub-services
    this.validator = createSessionValidator(this.config);
    this.creator.updateConfig(newConfig);
    this.validationService.updateConfig(newConfig);
    this.cleanupService.updateConfig(newConfig);
    this.securityService.updateConfig(newConfig);
  }

  /**
   * Get current configuration
   * @returns Current session config
   */
  getConfig(): SessionConfig {
    return { ...this.config };
  }

  // ==================== UTILITY METHODS ====================

  /**
   * Generate session token baru
   * @returns Token string
   */
  generateSessionToken(): string {
    return this.creator.generateSessionToken();
  }

  /**
   * Validasi data session creation
   * @param sessionData - Data session
   * @returns Hasil validasi
   */
  validateSessionData(sessionData: SessionCreateData): SessionValidationResult {
    try {
      this.validator.validateSessionCreateData(sessionData);
      return {
        isValid: true
      };
    } catch (error) {
      return {
        isValid: false,
        error: error instanceof Error ? error.message : 'Session data validation failed'
      };
    }
  }

  /**
   * Check apakah session masih valid (belum expired)
   * @param session - Session object
   * @returns True jika valid
   */
  isSessionValid(session: Session): boolean {
    const validation = this.validator.validateSession(session);
    return validation.isValid && session.expiresAt > new Date();
  }

  /**
   * Get session statistics
   * @returns Session statistics
   */
  async getSessionStatistics(): Promise<{
    totalActiveSessions: number;
    expiredSessions: number;
    inactiveSessions: number;
    sessionsPerUser: Record<string, number>;
  }> {
    return this.cleanupService.getCleanupStatistics();
  }
}

/**
 * Factory function untuk membuat SessionService
 * @param sessionRepository - Repository session
 * @param config - Konfigurasi session (opsional)
 * @returns Instance SessionService
 */
export function createSessionService(
  sessionRepository: SessionRepository,
  config?: Partial<SessionConfig>
): SessionService {
  return new SessionService(sessionRepository, config);
}

// ==================== EXPORTS ====================

// Export semua types untuk backward compatibility
export * from "./types";

// Export sub-services untuk advanced usage
export {
  SessionValidator,
  createSessionValidator,
  SessionCreator,
  createSessionCreator,
  SessionValidationService,
  createSessionValidationService,
  SessionCleanupService,
  createSessionCleanupService,
  SessionSecurityService,
  createSessionSecurityService
};

// Default export untuk backward compatibility
export default SessionService;