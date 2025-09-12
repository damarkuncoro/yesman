import { BaseService } from "../base/baseService";
import { SessionRepository } from "../../repositories/session/sessionRepository";
import type { Session } from "../../db/schema";
import { 
  type SessionLog, 
  type AuditFilters 
} from "./types";

/**
 * Service untuk manajemen session log operations
 * Menangani tracking dan monitoring aktivitas session user
 * Menggunakan repository pattern untuk akses data
 */
export class SessionLogService extends BaseService {
  constructor(private sessionRepository: SessionRepository) {
    super();
  }

  /**
   * Log aktivitas session (login/logout)
   * @param data - Data session log
   * @returns Promise<SessionLog> - Session log yang telah disimpan
   */
  async logSessionActivity(data: {
    userId: number;
    action: 'login' | 'logout';
    sessionId: string;
    ipAddress?: string;
    userAgent?: string;
    expiresAt: Date;
  }): Promise<SessionLog> {
    return this.executeWithErrorHandling(
      'log session activity',
      async () => {
        // Create session record using repository
        const sessionData = {
          userId: data.userId,
          refreshToken: data.sessionId,
          expiresAt: data.expiresAt,
          createdAt: new Date()
        };

        const session = await this.sessionRepository.create(sessionData);
        
        // Return as SessionLog format
        return {
          id: session.id.toString(),
          userId: session.userId,
          action: data.action,
          sessionId: data.sessionId,
          ipAddress: data.ipAddress || undefined,
          userAgent: data.userAgent || undefined,
          timestamp: session.createdAt,
          createdAt: session.createdAt,
          expiresAt: session.expiresAt,
          isActive: session.expiresAt > new Date()
        };
      }
    );
  }

  /**
   * Mendapatkan session logs dengan filter
   * @param filters - Filter untuk session logs
   * @returns Promise<SessionLog[]>
   */
  async getSessionLogs(filters: AuditFilters = {}): Promise<SessionLog[]> {
    return this.executeWithErrorHandling(
      'get session logs',
      async () => {
        const sessions = await this.sessionRepository.findAll();
        let filteredSessions = sessions;

        // Apply filters
        if (filters.userId) {
          filteredSessions = filteredSessions.filter(s => s.userId === filters.userId);
        }

        if (filters.startDate) {
          filteredSessions = filteredSessions.filter(s => 
            s.createdAt && s.createdAt >= filters.startDate!
          );
        }

        if (filters.endDate) {
          filteredSessions = filteredSessions.filter(s => 
            s.createdAt && s.createdAt <= filters.endDate!
          );
        }

        // Convert to SessionLog format
        return filteredSessions.map(session => ({
          id: session.id.toString(),
          userId: session.userId,
          action: 'login' as const, // Default action since we don't track logout separately
          sessionId: session.refreshToken,
          ipAddress: undefined,
          userAgent: undefined,
          timestamp: session.createdAt,
          createdAt: session.createdAt,
          expiresAt: session.expiresAt,
          isActive: session.expiresAt > new Date()
        }));
      }
    );
  }

  /**
   * Mendapatkan session logs berdasarkan user ID
   * @param userId - ID user
   * @param filters - Filter tambahan
   * @returns Promise<SessionLog[]>
   */
  async getSessionLogsByUserId(userId: number, filters: Omit<AuditFilters, 'userId'> = {}): Promise<SessionLog[]> {
    return this.getSessionLogs({ ...filters, userId });
  }

  /**
   * Mendapatkan active sessions
   * @param filters - Filter untuk sessions
   * @returns Promise<SessionLog[]>
   */
  async getActiveSessions(filters: AuditFilters = {}): Promise<SessionLog[]> {
    return this.executeWithErrorHandling(
      'get active sessions',
      async () => {
        const sessions = await this.sessionRepository.findAll();
        const now = new Date();
        
        let activeSessions = sessions.filter(s => s.expiresAt > now);

        // Apply filters
        if (filters.userId) {
          activeSessions = activeSessions.filter(s => s.userId === filters.userId);
        }

        if (filters.startDate) {
          activeSessions = activeSessions.filter(s => 
            s.createdAt && s.createdAt >= filters.startDate!
          );
        }

        if (filters.endDate) {
          activeSessions = activeSessions.filter(s => 
            s.createdAt && s.createdAt <= filters.endDate!
          );
        }

        return activeSessions.map(session => ({
          id: session.id.toString(),
          userId: session.userId,
          action: 'login' as const,
          sessionId: session.refreshToken,
          ipAddress: undefined,
          userAgent: undefined,
          timestamp: session.createdAt,
          createdAt: session.createdAt,
          expiresAt: session.expiresAt,
          isActive: true
        }));
      }
    );
  }

  /**
   * Mendapatkan expired sessions
   * @param filters - Filter untuk sessions
   * @returns Promise<SessionLog[]>
   */
  async getExpiredSessions(filters: AuditFilters = {}): Promise<SessionLog[]> {
    return this.executeWithErrorHandling(
      'get expired sessions',
      async () => {
        const sessions = await this.sessionRepository.findAll();
        const now = new Date();
        
        let expiredSessions = sessions.filter(s => s.expiresAt <= now);

        // Apply filters
        if (filters.userId) {
          expiredSessions = expiredSessions.filter(s => s.userId === filters.userId);
        }

        if (filters.startDate) {
          expiredSessions = expiredSessions.filter(s => 
            s.createdAt && s.createdAt >= filters.startDate!
          );
        }

        if (filters.endDate) {
          expiredSessions = expiredSessions.filter(s => 
            s.createdAt && s.createdAt <= filters.endDate!
          );
        }

        return expiredSessions.map(session => ({
          id: session.id.toString(),
          userId: session.userId,
          action: 'logout' as const,
          sessionId: session.refreshToken,
          ipAddress: undefined,
          userAgent: undefined,
          timestamp: session.createdAt,
          createdAt: session.createdAt,
          expiresAt: session.expiresAt,
          isActive: false
        }));
      }
    );
  }

  /**
   * Mendapatkan statistik session
   * @param filters - Filter untuk statistik
   * @returns Promise dengan statistik session
   */
  async getSessionStats(filters: AuditFilters = {}) {
    return this.executeWithErrorHandling(
      'get session stats',
      async () => {
        const sessions = await this.sessionRepository.findAll();
        const now = new Date();
        
        let filteredSessions = sessions;

        // Apply filters
        if (filters.userId) {
          filteredSessions = filteredSessions.filter(s => s.userId === filters.userId);
        }

        if (filters.startDate) {
          filteredSessions = filteredSessions.filter(s => 
            s.createdAt && s.createdAt >= filters.startDate!
          );
        }

        if (filters.endDate) {
          filteredSessions = filteredSessions.filter(s => 
            s.createdAt && s.createdAt <= filters.endDate!
          );
        }

        const totalSessions = filteredSessions.length;
        const activeSessions = filteredSessions.filter(s => s.expiresAt > now).length;
        const expiredSessions = filteredSessions.filter(s => s.expiresAt <= now).length;
        const uniqueUsers = new Set(filteredSessions.map(s => s.userId)).size;

        return {
          totalSessions,
          activeSessions,
          expiredSessions,
          uniqueUsers
        };
      }
    );
  }

  /**
   * Cleanup expired sessions
   * @param olderThanDays - Hapus session yang expired lebih dari X hari
   * @returns Promise<number> - Jumlah session yang dihapus
   */
  async cleanupExpiredSessions(olderThanDays: number = 30): Promise<number> {
    return this.executeWithErrorHandling(
      'cleanup expired sessions',
      async () => {
        const sessions = await this.sessionRepository.findAll();
        const cutoffDate = new Date();
        cutoffDate.setDate(cutoffDate.getDate() - olderThanDays);
        
        const expiredSessions = sessions.filter(s => 
          s.expiresAt <= cutoffDate
        );

        let deletedCount = 0;
        for (const session of expiredSessions) {
          const deleted = await this.sessionRepository.delete(session.id);
          if (deleted) deletedCount++;
        }

        return deletedCount;
      }
    );
  }
}

// Export instance dengan dependency injection
export const sessionLogService = new SessionLogService(
  new SessionRepository()
);