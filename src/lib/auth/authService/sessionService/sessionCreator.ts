import { randomBytes, createHash } from "crypto";
import { ValidationError } from "../../../errors/errorHandler";
import {
  Session,
  SessionCreateData,
  SessionRepository,
  SessionConfig,
  DEFAULT_SESSION_CONFIG,
  SessionCreationOptions,
  SessionOperationResult
} from "./types";
import { SessionValidator } from "./validation";

/**
 * Kelas untuk menangani pembuatan session
 * Bertanggung jawab untuk generate token dan membuat session baru
 */
export class SessionCreator {
  private config: SessionConfig;
  private validator: SessionValidator;

  constructor(
    private sessionRepository: SessionRepository,
    config: Partial<SessionConfig> = {},
    validator?: SessionValidator
  ) {
    this.config = { ...DEFAULT_SESSION_CONFIG, ...config };
    this.validator = validator || new SessionValidator(this.config);
  }

  /**
   * Buat session baru untuk user
   * @param data - Data untuk membuat session
   * @param options - Opsi pembuatan session
   * @returns Session object yang baru dibuat
   */
  async createSession(
    data: SessionCreateData,
    options: SessionCreationOptions = {}
  ): Promise<Session> {
    try {
      // Validasi input
      this.validator.validateSessionCreateData(data);

      // Cleanup old sessions jika diperlukan
      if (options.cleanupOldSessions !== false) {
        await this.cleanupUserSessions(data.userId);
      }

      // Generate secure refresh token
      const refreshToken = this.generateRefreshToken();
      
      // Calculate expiration time
      const expiresIn = data.expiresIn || (this.config.sessionDuration / 1000); // Convert ms to seconds
      const expiresAt = new Date(Date.now() + expiresIn * 1000);

      // Buat session baru sesuai dengan schema database
      const sessionData = {
        userId: parseInt(data.userId),
        refreshToken,
        expiresAt
      };

      const session = await this.sessionRepository.create(sessionData);

      console.log(`✅ Session created for user ${data.userId}`);
      return session;
    } catch (error) {
      console.error('❌ Session creation failed:', error);
      throw error;
    }
  }

  /**
   * Buat multiple sessions sekaligus (batch creation)
   * @param sessionsData - Array data session
   * @param options - Opsi pembuatan session
   * @returns Array hasil operasi
   */
  async createMultipleSessions(
    sessionsData: SessionCreateData[],
    options: SessionCreationOptions = {}
  ): Promise<SessionOperationResult<Session>[]> {
    const results: SessionOperationResult<Session>[] = [];

    for (const data of sessionsData) {
      try {
        const session = await this.createSession(data, options);
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
   * Generate secure session token
   * @returns Random session token
   */
  generateSessionToken(): string {
    const randomData = randomBytes(32);
    return createHash('sha256')
      .update(randomData)
      .update(Date.now().toString())
      .update(Math.random().toString())
      .digest('hex');
  }

  /**
   * Generate secure refresh token
   * @returns Random refresh token
   */
  generateRefreshToken(): string {
    const randomData = randomBytes(64);
    return createHash('sha256')
      .update(randomData)
      .update('refresh')
      .update(Date.now().toString())
      .digest('hex');
  }

  /**
   * Validate token uniqueness
   * @param token - Token yang akan dicek
   * @returns true jika token unik
   */
  async isTokenUnique(token: string): Promise<boolean> {
    try {
      const existingSession = await this.sessionRepository.findByToken(token);
      return existingSession === null;
    } catch (error) {
      console.error('❌ Failed to check token uniqueness:', error);
      return false;
    }
  }

  /**
   * Generate unique session token
   * @param maxRetries - Maksimal retry jika token tidak unik
   * @returns Unique session token
   */
  async generateUniqueSessionToken(maxRetries: number = 5): Promise<string> {
    for (let i = 0; i < maxRetries; i++) {
      const token = this.generateSessionToken();
      
      if (await this.isTokenUnique(token)) {
        return token;
      }
      
      console.warn(`⚠️ Token collision detected, retrying... (${i + 1}/${maxRetries})`);
    }
    
    throw new ValidationError('Gagal generate unique session token setelah beberapa percobaan');
  }

  /**
   * Cleanup old sessions untuk user jika melebihi limit
   * @param userId - ID user
   */
  private async cleanupUserSessions(userId: string): Promise<void> {
    try {
      const activeSessions = await this.getActiveUserSessions(userId);
      
      if (activeSessions.length >= this.config.maxSessionsPerUser) {
        // Sort by creation time (oldest first)
        const sortedSessions = activeSessions.sort(
          (a, b) => a.createdAt.getTime() - b.createdAt.getTime()
        );
        
        // Deactivate oldest sessions
        const sessionsToRemove = sortedSessions.slice(
          0, 
          activeSessions.length - this.config.maxSessionsPerUser + 1
        );
        
        for (const session of sessionsToRemove) {
          await this.sessionRepository.delete(session.id);
        }
        
        console.log(`✅ Cleaned up ${sessionsToRemove.length} old sessions for user ${userId}`);
      }
    } catch (error) {
      console.error('❌ User session cleanup failed:', error);
      // Don't throw error, just log it
    }
  }

  /**
   * Get active sessions untuk user
   * @param userId - ID user
   * @returns Array of active sessions
   */
  private async getActiveUserSessions(userId: string): Promise<Session[]> {
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

  /**
   * Create session dengan custom expiration
   * @param data - Data session
   * @param customExpiresAt - Custom expiration date
   * @param options - Opsi pembuatan
   * @returns Session baru
   */
  async createSessionWithCustomExpiration(
    data: Omit<SessionCreateData, 'expiresIn'>,
    customExpiresAt: Date,
    options: SessionCreationOptions = {}
  ): Promise<Session> {
    if (customExpiresAt <= new Date()) {
      throw new ValidationError('Custom expiration date harus di masa depan');
    }

    const sessionData: SessionCreateData = {
      ...data,
      expiresIn: Math.floor((customExpiresAt.getTime() - Date.now()) / 1000)
    };

    return this.createSession(sessionData, options);
  }

  /**
   * Create temporary session (short-lived)
   * @param data - Data session
   * @param durationMinutes - Durasi dalam menit
   * @param options - Opsi pembuatan
   * @returns Session temporary
   */
  async createTemporarySession(
    data: Omit<SessionCreateData, 'expiresIn'>,
    durationMinutes: number = 15,
    options: SessionCreationOptions = {}
  ): Promise<Session> {
    if (durationMinutes <= 0 || durationMinutes > 1440) { // max 24 hours
      throw new ValidationError('Durasi temporary session harus antara 1 menit dan 24 jam');
    }

    const sessionData: SessionCreateData = {
      ...data,
      expiresIn: durationMinutes * 60 // convert to seconds
    };

    return this.createSession(sessionData, {
      ...options,
      cleanupOldSessions: false // Don't cleanup for temporary sessions
    });
  }

  /**
   * Update konfigurasi session creator
   * @param newConfig - Konfigurasi baru
   */
  updateConfig(newConfig: Partial<SessionConfig>): void {
    this.config = { ...this.config, ...newConfig };
    this.validator = new SessionValidator(this.config);
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
 * Factory function untuk membuat SessionCreator
 * @param sessionRepository - Repository session
 * @param config - Konfigurasi session (opsional)
 * @param validator - Validator session (opsional)
 * @returns Instance SessionCreator
 */
export function createSessionCreator(
  sessionRepository: SessionRepository,
  config?: Partial<SessionConfig>,
  validator?: SessionValidator
): SessionCreator {
  return new SessionCreator(sessionRepository, config, validator);
}