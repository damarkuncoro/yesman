import { AuthenticationError } from "../../../errors/errorHandler";
import { SessionService } from "../sessionService";
import { UserAuthenticationValidator } from "./validation";

/**
 * Session Manager class
 * Menangani operasi session management seperti terminate session, get active sessions
 */
export class UserAuthenticationSessionManager {
  constructor(
    private sessionService: SessionService,
    private validator: UserAuthenticationValidator
  ) {}

  /**
   * Get active sessions untuk user
   * @param userId - ID user
   * @returns Array of active sessions
   */
  async getUserActiveSessions(userId: string): Promise<any[]> {
    try {
      this.validator.validateUserId(userId);
      return await this.sessionService.getUserSessions(userId);
    } catch (error) {
      console.error('❌ Failed to get user sessions:', error);
      return [];
    }
  }

  /**
   * Terminate specific session
   * @param userId - ID user (untuk authorization)
   * @param sessionId - ID session yang akan diterminasi
   */
  async terminateSession(userId: string, sessionId: string): Promise<void> {
    try {
      this.validator.validateUserId(userId);
      this.validator.validateSessionId(sessionId);

      // Verify bahwa session belongs to user
      const sessions = await this.getUserActiveSessions(userId);
      const targetSession = sessions.find(s => s.id === sessionId);
      
      if (!targetSession) {
        throw new AuthenticationError('Session tidak ditemukan atau tidak valid');
      }
      
      await this.sessionService.deactivateSession(sessionId);
      console.log(`✅ Session terminated: ${sessionId}`);
    } catch (error) {
      console.error('❌ Session termination failed:', error);
      throw error;
    }
  }

  /**
   * Terminate multiple sessions
   * @param userId - ID user
   * @param sessionIds - Array of session IDs yang akan diterminasi
   */
  async terminateMultipleSessions(userId: string, sessionIds: string[]): Promise<void> {
    try {
      this.validator.validateUserId(userId);

      if (!sessionIds || sessionIds.length === 0) {
        throw new AuthenticationError('Session IDs harus diisi');
      }

      // Verify bahwa semua sessions belongs to user
      const userSessions = await this.getUserActiveSessions(userId);
      const userSessionIds = userSessions.map(s => s.id);
      
      const invalidSessionIds = sessionIds.filter(id => !userSessionIds.includes(id));
      
      if (invalidSessionIds.length > 0) {
        throw new AuthenticationError(
          `Session tidak valid: ${invalidSessionIds.join(', ')}`
        );
      }

      // Terminate sessions
      const terminationPromises = sessionIds.map(sessionId => 
        this.sessionService.deactivateSession(sessionId)
      );

      await Promise.all(terminationPromises);
      console.log(`✅ Multiple sessions terminated: ${sessionIds.join(', ')}`);
    } catch (error) {
      console.error('❌ Multiple session termination failed:', error);
      throw error;
    }
  }

  /**
   * Get session details
   * @param userId - ID user (untuk authorization)
   * @param sessionId - ID session
   * @returns Session details
   */
  async getSessionDetails(userId: string, sessionId: string): Promise<any> {
    try {
      this.validator.validateUserId(userId);
      this.validator.validateSessionId(sessionId);

      // Get user sessions
      const sessions = await this.getUserActiveSessions(userId);
      const targetSession = sessions.find(s => s.id === sessionId);
      
      if (!targetSession) {
        throw new AuthenticationError('Session tidak ditemukan atau tidak valid');
      }

      return targetSession;
    } catch (error) {
      console.error('❌ Failed to get session details:', error);
      throw error;
    }
  }

  /**
   * Refresh session expiry
   * @param userId - ID user (untuk authorization)
   * @param sessionId - ID session yang akan di-refresh
   * @returns Updated session
   */
  async refreshSessionExpiry(userId: string, sessionId: string): Promise<any> {
    try {
      this.validator.validateUserId(userId);
      this.validator.validateSessionId(sessionId);

      // Verify bahwa session belongs to user
      const sessions = await this.getUserActiveSessions(userId);
      const targetSession = sessions.find(s => s.id === sessionId);
      
      if (!targetSession) {
        throw new AuthenticationError('Session tidak ditemukan atau tidak valid');
      }

      const refreshedSession = await this.sessionService.refreshSession(sessionId);
      console.log(`✅ Session expiry refreshed: ${sessionId}`);
      
      return refreshedSession;
    } catch (error) {
      console.error('❌ Session refresh failed:', error);
      throw error;
    }
  }

  /**
   * Get session statistics untuk user
   * @param userId - ID user
   * @returns Session statistics
   */
  async getUserSessionStatistics(userId: string): Promise<{
    totalActiveSessions: number;
    oldestSession: Date | null;
    newestSession: Date | null;
    sessionsByDevice: Record<string, number>;
  }> {
    try {
      this.validator.validateUserId(userId);

      const sessions = await this.getUserActiveSessions(userId);
      
      if (sessions.length === 0) {
        return {
          totalActiveSessions: 0,
          oldestSession: null,
          newestSession: null,
          sessionsByDevice: {}
        };
      }

      // Sort sessions by creation date
      const sortedSessions = sessions.sort((a, b) => 
        new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
      );

      // Group by user agent (device)
      const sessionsByDevice: Record<string, number> = {};
      sessions.forEach(session => {
        const device = session.userAgent || 'Unknown Device';
        sessionsByDevice[device] = (sessionsByDevice[device] || 0) + 1;
      });

      return {
        totalActiveSessions: sessions.length,
        oldestSession: new Date(sortedSessions[0].createdAt),
        newestSession: new Date(sortedSessions[sortedSessions.length - 1].createdAt),
        sessionsByDevice
      };
    } catch (error) {
      console.error('❌ Failed to get session statistics:', error);
      return {
        totalActiveSessions: 0,
        oldestSession: null,
        newestSession: null,
        sessionsByDevice: {}
      };
    }
  }

  /**
   * Check apakah user memiliki session aktif
   * @param userId - ID user
   * @returns true jika user memiliki session aktif
   */
  async hasActiveSessions(userId: string): Promise<boolean> {
    try {
      this.validator.validateUserId(userId);
      const sessions = await this.getUserActiveSessions(userId);
      return sessions.length > 0;
    } catch (error) {
      console.error('❌ Failed to check active sessions:', error);
      return false;
    }
  }
}

/**
 * Factory function untuk membuat UserAuthenticationSessionManager
 * @param sessionService - Session service dependency
 * @param validator - Validator dependency (optional)
 * @returns Instance dari UserAuthenticationSessionManager
 */
export function createUserAuthenticationSessionManager(
  sessionService: SessionService,
  validator?: UserAuthenticationValidator
): UserAuthenticationSessionManager {
  const authValidator = validator || new UserAuthenticationValidator();
  
  return new UserAuthenticationSessionManager(
    sessionService,
    authValidator
  );
}