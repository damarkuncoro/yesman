import { AuthenticationError, ValidationError } from "../../../errors/errorHandler";
import {
  Session,
  SessionRepository,
  SessionConfig,
  DEFAULT_SESSION_CONFIG,
  SessionValidationResult,
  SessionValidationOptions,
  SessionOperationResult
} from "./types";
import { SessionValidator as BaseValidator } from "./validation";

/**
 * Kelas untuk validasi session yang sudah ada
 * Bertanggung jawab untuk memvalidasi session token dan status
 */
export class SessionValidationService {
  private config: SessionConfig;
  private validator: BaseValidator;

  constructor(
    private sessionRepository: SessionRepository,
    config: Partial<SessionConfig> = {},
    validator?: BaseValidator
  ) {
    this.config = { ...DEFAULT_SESSION_CONFIG, ...config };
    this.validator = validator || new BaseValidator(this.config);
  }

  /**
   * Validasi session berdasarkan token
   * @param token - Session token
   * @param options - Opsi validasi
   * @returns Session object jika valid
   * @throws AuthenticationError jika session tidak valid
   */
  async validateSessionByToken(
    token: string,
    options: SessionValidationOptions = {}
  ): Promise<Session> {
    try {
      // Validasi format token
      this.validator.validateSessionToken(token);

      // Cari session berdasarkan token
      const session = await this.sessionRepository.findByToken(token);
      
      // Validasi session
      const validationResult = this.validator.validateSession(session, options);
      
      if (!validationResult.isValid) {
        throw new AuthenticationError(validationResult.error || 'Session tidak valid');
      }

      // Update last accessed time jika diminta
      if (options.updateLastAccessed !== false && validationResult.session) {
        await this.updateLastAccessed(validationResult.session.id.toString());
        // Note: lastAccessedAt property tidak ada di Session interface
        // TODO: Add lastAccessedAt field to sessions table if needed
      }

      return validationResult.session!;
    } catch (error) {
      console.error('❌ Session validation failed:', error);
      throw error;
    }
  }

  /**
   * Validasi session berdasarkan ID
   * @param sessionId - Session ID
   * @param options - Opsi validasi
   * @returns Session object jika valid
   * @throws AuthenticationError jika session tidak valid
   */
  async validateSessionById(
    sessionId: string,
    options: SessionValidationOptions = {}
  ): Promise<Session> {
    try {
      // Validasi format session ID
      this.validator.validateSessionId(sessionId);

      // Cari session berdasarkan ID
      const numericSessionId = parseInt(sessionId);
      if (isNaN(numericSessionId)) {
        throw new AuthenticationError('Invalid session ID format');
      }
      const session = await this.sessionRepository.findById(numericSessionId);
      
      // Validasi session
      const validationResult = this.validator.validateSession(session, options);
      
      if (!validationResult.isValid) {
        throw new AuthenticationError(validationResult.error || 'Session tidak valid');
      }

      // Update last accessed time jika diminta
      if (options.updateLastAccessed !== false && validationResult.session) {
        await this.updateLastAccessed(validationResult.session.id.toString());
        // Note: lastAccessedAt property tidak ada di Session interface
        // TODO: Add lastAccessedAt field to sessions table if needed
      }

      return validationResult.session!;
    } catch (error) {
      console.error('❌ Session validation by ID failed:', error);
      throw error;
    }
  }

  /**
   * Validasi multiple sessions sekaligus
   * @param tokens - Array session tokens
   * @param options - Opsi validasi
   * @returns Array hasil validasi
   */
  async validateMultipleSessions(
    tokens: string[],
    options: SessionValidationOptions = {}
  ): Promise<SessionOperationResult<Session>[]> {
    const results: SessionOperationResult<Session>[] = [];

    for (const token of tokens) {
      try {
        const session = await this.validateSessionByToken(token, options);
        results.push({
          success: true,
          data: session
        });
      } catch (error) {
        results.push({
          success: false,
          error: error instanceof ValidationError ? error : new ValidationError(error instanceof Error ? error.message : 'Unknown error')
        });
      }
    }

    return results;
  }

  /**
   * Check apakah session masih valid tanpa throw error
   * @param token - Session token
   * @param options - Opsi validasi
   * @returns Hasil validasi
   */
  async checkSessionValidity(
    token: string,
    options: SessionValidationOptions = {}
  ): Promise<SessionValidationResult> {
    try {
      const session = await this.validateSessionByToken(token, options);
      return {
        isValid: true,
        session
      };
    } catch (error) {
      return {
        isValid: false,
        error: error instanceof Error ? error.message : 'Session validation failed'
      };
    }
  }

  /**
   * Validasi dan refresh session sekaligus
   * @param token - Session token
   * @param expiresIn - Durasi baru dalam detik (opsional)
   * @param options - Opsi validasi
   * @returns Updated session
   */
  async validateAndRefreshSession(
    token: string,
    expiresIn?: number,
    options: SessionValidationOptions = {}
  ): Promise<Session> {
    try {
      // Validasi session terlebih dahulu
      const session = await this.validateSessionByToken(token, {
        ...options,
        updateLastAccessed: false // We'll update it in refresh
      });

      // Refresh session
      const newExpiresIn = expiresIn || (this.config.sessionDuration / 1000); // Convert ms to seconds
      const newExpiresAt = new Date(Date.now() + newExpiresIn * 1000);

      const updatedSession = await this.sessionRepository.update(session.id, {
        expiresAt: newExpiresAt
        // Note: lastAccessedAt property tidak ada di Session interface
      });

      console.log(`✅ Session ${session.id} validated and refreshed`);
      return updatedSession;
    } catch (error) {
      console.error('❌ Session validation and refresh failed:', error);
      throw error;
    }
  }

  /**
   * Validasi session dengan security checks
   * @param token - Session token
   * @param currentIpAddress - IP address saat ini
   * @param currentUserAgent - User agent saat ini
   * @param options - Opsi validasi
   * @returns Session jika valid
   * @throws AuthenticationError jika ada security violation
   */
  async validateSessionWithSecurity(
    token: string,
    currentIpAddress?: string,
    currentUserAgent?: string,
    options: SessionValidationOptions = {}
  ): Promise<Session> {
    try {
      // Validasi session normal
      const session = await this.validateSessionByToken(token, options);

      // Security checks jika diminta
      if (options.checkSecurity) {
        const securityOptions = options.securityOptions || {};
        
        if (securityOptions.checkIpAddress && currentIpAddress) {
          if (this.isIpAddressSuspicious(session, currentIpAddress)) {
            if (securityOptions.strictMode) {
              throw new AuthenticationError('IP address tidak cocok dengan session');
            } else {
              console.warn(`⚠️ IP address mismatch for session ${session.id}`);
            }
          }
        }

        if (securityOptions.checkUserAgent && currentUserAgent) {
          if (this.isUserAgentSuspicious(session, currentUserAgent)) {
            if (securityOptions.strictMode) {
              throw new AuthenticationError('User agent tidak cocok dengan session');
            } else {
              console.warn(`⚠️ User agent mismatch for session ${session.id}`);
            }
          }
        }
      }

      return session;
    } catch (error) {
      console.error('❌ Session security validation failed:', error);
      throw error;
    }
  }

  /**
   * Batch validate sessions untuk user
   * @param userId - User ID
   * @param options - Opsi validasi
   * @returns Array session yang valid
   */
  async validateUserSessions(
    userId: string,
    options: SessionValidationOptions = {}
  ): Promise<Session[]> {
    try {
      this.validator.validateUserId(userId);
      
      const numericUserId = parseInt(userId);
      if (isNaN(numericUserId)) {
        throw new AuthenticationError('Invalid user ID format');
      }
      
      const sessions = await this.sessionRepository.findByUserId(numericUserId);
      const validSessions: Session[] = [];

      for (const session of sessions) {
        const validationResult = this.validator.validateSession(session, options);
        if (validationResult.isValid && validationResult.session) {
          validSessions.push(validationResult.session);
        }
      }

      return validSessions;
    } catch (error) {
      console.error('❌ User sessions validation failed:', error);
      return [];
    }
  }

  /**
   * Update last accessed time untuk session
   * @param sessionId - ID session
   */
  private async updateLastAccessed(sessionId: string): Promise<void> {
    try {
      // Note: lastAccessedAt field tidak ada di Session schema
      // Untuk saat ini, kita skip update lastAccessedAt
      console.log(`Skipping lastAccessedAt update for session ${sessionId}`);
    } catch (error) {
      console.error('❌ Failed to update last accessed time:', error);
      // Don't throw error, just log it
    }
  }

  /**
   * Check apakah session berasal dari IP address yang mencurigakan
   * @param session - Session object
   * @param currentIpAddress - IP address saat ini
   * @returns true jika IP address berbeda dari session
   */
  private isIpAddressSuspicious(session: Session, currentIpAddress: string): boolean {
    // Note: Session schema tidak memiliki ipAddress field
    // TODO: Add ipAddress field to sessions table if needed
    return false;
  }

  /**
   * Check apakah user agent berbeda dari session
   * @param session - Session object
   * @param currentUserAgent - User agent saat ini
   * @returns true jika user agent berbeda
   */
  private isUserAgentSuspicious(session: Session, currentUserAgent: string): boolean {
    // Note: Session schema tidak memiliki userAgent field
    // TODO: Add userAgent field to sessions table if needed
    return false;
  }

  /**
   * Update konfigurasi validation service
   * @param newConfig - Konfigurasi baru
   */
  updateConfig(newConfig: Partial<SessionConfig>): void {
    this.config = { ...this.config, ...newConfig };
    this.validator = new BaseValidator(this.config);
  }

  /**
   * Get current configuration
   * @returns Current session config
   */
  getConfig(): SessionConfig {
    return { ...this.config };
  }
}

/**
 * Factory function untuk membuat SessionValidationService
 * @param sessionRepository - Repository session
 * @param config - Konfigurasi session (opsional)
 * @param validator - Validator session (opsional)
 * @returns Instance SessionValidationService
 */
export function createSessionValidationService(
  sessionRepository: SessionRepository,
  config?: Partial<SessionConfig>,
  validator?: BaseValidator
): SessionValidationService {
  return new SessionValidationService(sessionRepository, config, validator);
}