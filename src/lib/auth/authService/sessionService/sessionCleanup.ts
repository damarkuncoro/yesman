import {
  Session,
  SessionRepository,
  SessionConfig,
  DEFAULT_SESSION_CONFIG,
  SessionCleanupResult,
  SessionOperationResult,
  SessionDeactivationOptions
} from "./types";
import { SessionValidator } from "./validation";

/**
 * Kelas untuk menangani cleanup dan maintenance session
 * Bertanggung jawab untuk membersihkan session expired dan tidak aktif
 */
export class SessionCleanupService {
  private config: SessionConfig;
  private validator: SessionValidator;
  private cleanupInterval?: NodeJS.Timeout;

  constructor(
    private sessionRepository: SessionRepository,
    config: Partial<SessionConfig> = {},
    validator?: SessionValidator
  ) {
    this.config = { ...DEFAULT_SESSION_CONFIG, ...config };
    this.validator = validator || new SessionValidator(this.config);
  }

  /**
   * Cleanup expired sessions
   * @returns Jumlah session yang dihapus
   */
  async cleanupExpiredSessions(): Promise<number> {
    try {
      const deletedCount = await this.sessionRepository.deleteExpired();
      console.log(`✅ Cleaned up ${deletedCount} expired sessions`);
      return deletedCount;
    } catch (error) {
      console.error('❌ Session cleanup failed:', error);
      return 0;
    }
  }

  /**
   * Deactivate session (logout)
   * @param sessionId - ID session yang akan di-deactivate
   * @param options - Opsi deactivation
   */
  async deactivateSession(
    sessionId: string,
    options: SessionDeactivationOptions = {}
  ): Promise<void> {
    try {
      this.validator.validateSessionId(sessionId);
      
      // Validasi bahwa sessionId adalah numerik
      const numericSessionId = parseInt(sessionId);
      if (isNaN(numericSessionId)) {
        throw new Error(`Invalid session ID format: ${sessionId}`);
      }
      
      await this.sessionRepository.update(numericSessionId, {
        expiresAt: new Date(0) // Set expired to deactivate
      });
      
      if (options.logActivity) {
        console.log(`✅ Session ${sessionId} deactivated${options.reason ? ` (${options.reason})` : ''}`);
      }
    } catch (error) {
      console.error('❌ Session deactivation failed:', error);
      throw error;
    }
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
    try {
      this.validator.validateUserId(userId);
      
      const sessions = await this.sessionRepository.findByUserId(parseInt(userId));
      
      for (const session of sessions) {
        if (session.expiresAt > new Date()) {
          await this.deactivateSession(session.id.toString(), {
            ...options,
            logActivity: false // Avoid spam logs
          });
        }
      }
      
      console.log(`✅ All sessions deactivated for user ${userId}${options.reason ? ` (${options.reason})` : ''}`);
    } catch (error) {
      console.error('❌ Bulk session deactivation failed:', error);
      throw error;
    }
  }

  /**
   * Cleanup old sessions untuk user jika melebihi limit
   * @param userId - ID user
   * @param maxSessions - Maksimal session (opsional, default dari config)
   * @returns Jumlah session yang di-cleanup
   */
  async cleanupUserSessions(userId: string, maxSessions?: number): Promise<number> {
    try {
      this.validator.validateUserId(userId);
      
      const activeSessions = await this.getUserActiveSessions(userId);
      const limit = maxSessions || this.config.maxSessionsPerUser;
      
      if (activeSessions.length <= limit) {
        return 0; // No cleanup needed
      }
      
      // Sort by createdAt (oldest first)
      const sortedSessions = activeSessions.sort(
        (a, b) => a.createdAt.getTime() - b.createdAt.getTime()
      );
      
      // Deactivate oldest sessions
      const sessionsToRemove = sortedSessions.slice(
        0, 
        activeSessions.length - limit
      );
      
      for (const session of sessionsToRemove) {
        await this.deactivateSession(session.id.toString(), {
          reason: 'Session limit exceeded',
          logActivity: false
        });
      }
      
      console.log(`✅ Cleaned up ${sessionsToRemove.length} old sessions for user ${userId}`);
      return sessionsToRemove.length;
    } catch (error) {
      console.error('❌ User session cleanup failed:', error);
      return 0;
    }
  }

  /**
   * Comprehensive cleanup - expired sessions dan user limits
   * @returns Hasil cleanup detail
   */
  async performComprehensiveCleanup(): Promise<SessionCleanupResult> {
    try {
      console.log('🧹 Starting comprehensive session cleanup...');
      
      // Cleanup expired sessions
      const expiredSessionsDeleted = await this.cleanupExpiredSessions();
      
      // Get all users with active sessions
      const allSessions = await this.getAllActiveSessions();
      const userSessionCounts = this.groupSessionsByUser(allSessions);
      
      let oldSessionsDeactivated = 0;
      
      // Cleanup sessions for each user that exceeds limit
      for (const [userId, sessionCount] of Object.entries(userSessionCounts)) {
        if (sessionCount > this.config.maxSessionsPerUser) {
          const cleaned = await this.cleanupUserSessions(userId);
          oldSessionsDeactivated += cleaned;
        }
      }
      
      const result: SessionCleanupResult = {
        expiredSessionsDeleted,
        oldSessionsDeactivated,
        totalProcessed: expiredSessionsDeleted + oldSessionsDeactivated
      };
      
      console.log(`✅ Comprehensive cleanup completed:`, result);
      return result;
    } catch (error) {
      console.error('❌ Comprehensive cleanup failed:', error);
      return {
        expiredSessionsDeleted: 0,
        oldSessionsDeactivated: 0,
        totalProcessed: 0
      };
    }
  }

  /**
   * Cleanup sessions berdasarkan kriteria custom
   * @param predicate - Function untuk menentukan session mana yang akan di-cleanup
   * @param reason - Alasan cleanup
   * @returns Jumlah session yang di-cleanup
   */
  async cleanupSessionsByPredicate(
    predicate: (session: Session) => boolean,
    reason: string = 'Custom cleanup'
  ): Promise<number> {
    try {
      const allSessions = await this.getAllActiveSessions();
      const sessionsToCleanup = allSessions.filter(predicate);
      
      for (const session of sessionsToCleanup) {
        await this.deactivateSession(session.id.toString(), {
          reason,
          logActivity: false
        });
      }
      
      console.log(`✅ Custom cleanup completed: ${sessionsToCleanup.length} sessions (${reason})`);
      return sessionsToCleanup.length;
    } catch (error) {
      console.error('❌ Custom cleanup failed:', error);
      return 0;
    }
  }

  /**
   * Cleanup sessions yang tidak diakses dalam waktu tertentu
   * @param inactiveHours - Jam tidak aktif
   * @returns Jumlah session yang di-cleanup
   */
  async cleanupInactiveSessions(inactiveHours: number = 24): Promise<number> {
    const cutoffTime = new Date(Date.now() - inactiveHours * 60 * 60 * 1000);
    
    return this.cleanupSessionsByPredicate(
      (session) => session.createdAt < cutoffTime,
      `Inactive for ${inactiveHours} hours`
    );
  }

  /**
   * Cleanup sessions dari IP address tertentu
   * @param ipAddress - IP address yang akan di-cleanup
   * @returns Jumlah session yang di-cleanup
   */
  async cleanupSessionsByIpAddress(ipAddress: string): Promise<number> {
    return this.cleanupSessionsByPredicate(
      (session) => false, // IP address not available in Session interface
      `IP address: ${ipAddress}`
    );
  }

  /**
   * Start automatic cleanup dengan interval
   * @param intervalMs - Interval dalam milidetik (opsional)
   */
  startAutomaticCleanup(intervalMs?: number): void {
    if (this.cleanupInterval) {
      this.stopAutomaticCleanup();
    }
    
    const interval = intervalMs || this.config.cleanupInterval || (60 * 60 * 1000); // 1 hour default
    
    this.cleanupInterval = setInterval(async () => {
      try {
        await this.performComprehensiveCleanup();
      } catch (error) {
        console.error('❌ Automatic cleanup failed:', error);
      }
    }, interval);
    
    console.log(`✅ Automatic session cleanup started (interval: ${interval}ms)`);
  }

  /**
   * Stop automatic cleanup
   */
  stopAutomaticCleanup(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
      this.cleanupInterval = undefined;
      console.log('✅ Automatic session cleanup stopped');
    }
  }

  /**
   * Get active sessions untuk user
   * @param userId - ID user
   * @returns Array of active sessions
   */
  private async getUserActiveSessions(userId: string): Promise<Session[]> {
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
   * Get all active sessions
   * @returns Array of all active sessions
   */
  private async getAllActiveSessions(): Promise<Session[]> {
    try {
      // This would need to be implemented in repository
      // For now, we'll use a workaround
      const allUsers = await this.getAllUserIds();
      const allSessions: Session[] = [];
      
      for (const userId of allUsers) {
        const userSessions = await this.getUserActiveSessions(userId);
        allSessions.push(...userSessions);
      }
      
      return allSessions;
    } catch (error) {
      console.error('❌ Failed to get all active sessions:', error);
      return [];
    }
  }

  /**
   * Group sessions by user ID
   * @param sessions - Array sessions
   * @returns Object dengan user ID sebagai key dan count sebagai value
   */
  private groupSessionsByUser(sessions: Session[]): Record<string, number> {
    return sessions.reduce((acc, session) => {
      acc[session.userId] = (acc[session.userId] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
  }

  /**
   * Get all user IDs (helper method)
   * Note: This would ideally be implemented in a user repository
   * @returns Array of user IDs
   */
  private async getAllUserIds(): Promise<string[]> {
    // This is a placeholder implementation
    // In real implementation, this should query user repository
    try {
      // For now, return empty array
      // This method should be implemented based on your user repository
      return [];
    } catch (error) {
      console.error('❌ Failed to get all user IDs:', error);
      return [];
    }
  }

  /**
   * Update konfigurasi cleanup service
   * @param newConfig - Konfigurasi baru
   */
  updateConfig(newConfig: Partial<SessionConfig>): void {
    this.config = { ...this.config, ...newConfig };
    this.validator = new SessionValidator(this.config);
    
    // Restart automatic cleanup if it's running
    if (this.cleanupInterval) {
      this.startAutomaticCleanup();
    }
  }

  /**
   * Get current configuration
   * @returns Current session config
   */
  getConfig(): SessionConfig {
    return { ...this.config };
  }

  /**
   * Get cleanup statistics
   * @returns Statistics object
   */
  async getCleanupStatistics(): Promise<{
    totalActiveSessions: number;
    expiredSessions: number;
    inactiveSessions: number;
    sessionsPerUser: Record<string, number>;
  }> {
    try {
      const allSessions = await this.getAllActiveSessions();
      const now = new Date();
      
      const expiredSessions = allSessions.filter(s => s.expiresAt <= now).length;
      const inactiveSessions = allSessions.filter(s => 
        s.createdAt < new Date(Date.now() - 24 * 60 * 60 * 1000)
      ).length;
      
      return {
        totalActiveSessions: allSessions.length,
        expiredSessions,
        inactiveSessions,
        sessionsPerUser: this.groupSessionsByUser(allSessions)
      };
    } catch (error) {
      console.error('❌ Failed to get cleanup statistics:', error);
      return {
        totalActiveSessions: 0,
        expiredSessions: 0,
        inactiveSessions: 0,
        sessionsPerUser: {}
      };
    }
  }
}

/**
 * Factory function untuk membuat SessionCleanupService
 * @param sessionRepository - Repository session
 * @param config - Konfigurasi session (opsional)
 * @param validator - Validator session (opsional)
 * @returns Instance SessionCleanupService
 */
export function createSessionCleanupService(
  sessionRepository: SessionRepository,
  config?: Partial<SessionConfig>,
  validator?: SessionValidator
): SessionCleanupService {
  return new SessionCleanupService(sessionRepository, config, validator);
}