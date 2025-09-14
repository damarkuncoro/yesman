import { BaseService } from '../base/baseService';
import { AccessLogRepository } from '../../repositories/accessLog';
import { PolicyViolationRepository } from '../../repositories/policyViolation';
import { ChangeHistoryRepository } from '../../repositories/changeHistory';
import { SessionRepository } from '../../repositories/session/sessionRepository';
import type { AuditStats, AuditFilters, AccessLog, PolicyViolation, ChangeHistory, Session } from './types';

/**
 * Service untuk mengelola statistik audit dan reporting
 * Mengumpulkan data dari semua service audit lainnya
 * Menggunakan repository pattern untuk akses data
 */
export class AuditStatsService extends BaseService {
  constructor(
    private accessLogRepository: AccessLogRepository,
    private policyViolationRepository: PolicyViolationRepository,
    private changeHistoryRepository: ChangeHistoryRepository,
    private sessionRepository: SessionRepository
  ) {
    super();
  }

  /**
   * Mendapatkan statistik audit secara keseluruhan
   * @param filters - Filter untuk statistik
   * @returns Promise<AuditStats>
   */
  async getAuditStats(filters: AuditFilters = {}): Promise<AuditStats> {
    return this.executeWithErrorHandling(
      'get audit stats',
      async () => {
        // Get data from repositories
        const accessLogs = await this.accessLogRepository.findAll();
        const policyViolations = await this.policyViolationRepository.findAll();
        const changeHistory = await this.changeHistoryRepository.findAll();
        const sessions = await this.sessionRepository.findAll();

        // Apply filters and calculate stats
        const filteredAccessLogs = this.applyAccessLogFilters(accessLogs, filters);
        const filteredViolations = this.applyViolationFilters(policyViolations, filters);
        const filteredChanges = this.applyChangeFilters(changeHistory, filters);
        const filteredSessions = this.applySessionFilters(sessions, filters);

        // Calculate access log stats
        const totalAccess = filteredAccessLogs.length;
        const allowedAccess = filteredAccessLogs.filter(log => log.decision === 'allow').length;
        const deniedAccess = filteredAccessLogs.filter(log => log.decision === 'deny').length;
        const uniqueUsers = new Set(filteredAccessLogs.map(log => log.userId)).size;

        // Calculate policy violation stats
        const totalViolations = filteredViolations.length;
        const uniqueViolationUsers = new Set(filteredViolations.map(v => v.userId)).size;
        const uniqueFeatures = new Set(filteredViolations.map(v => v.featureId)).size;

        // Calculate change history stats
        const totalChanges = filteredChanges.length;
        const uniqueAdmins = new Set(filteredChanges.map(c => c.adminUserId)).size;
        const uniqueTargets = new Set(filteredChanges.map(c => c.targetUserId)).size;

        // Calculate session stats
        const totalSessions = filteredSessions.length;
        const now = new Date();
        const activeSessions = filteredSessions.filter(s => s.expiresAt > now).length;
        const expiredSessions = filteredSessions.filter(s => s.expiresAt <= now).length;

        return {
          accessLogs: {
            total: totalAccess,
            allowed: allowedAccess,
            denied: deniedAccess,
            uniqueUsers: uniqueUsers
          },
          policyViolations: {
            total: totalViolations,
            uniqueUsers: uniqueViolationUsers,
            uniqueFeatures: uniqueFeatures
          },
          changeHistory: {
            total: totalChanges,
            uniqueAdmins: uniqueAdmins,
            uniqueTargets: uniqueTargets
          },
          sessions: {
            total: totalSessions,
            active: activeSessions,
            expired: expiredSessions
          }
        };
      }
    );
  }

  /**
   * Apply filters to access logs
   * @param data - Array of access logs to filter
   * @param filters - Filters to apply
   * @returns Filtered array
   */
  private applyAccessLogFilters(data: AccessLog[], filters: AuditFilters): AccessLog[] {
    let filtered = data;

    if (filters.userId) {
      filtered = filtered.filter(item => item.userId === filters.userId);
    }

    if (filters.featureId) {
      filtered = filtered.filter(item => item.featureId === filters.featureId);
    }

    if (filters.startDate) {
      filtered = filtered.filter(item => 
        item.createdAt && item.createdAt >= filters.startDate!
      );
    }

    if (filters.endDate) {
      filtered = filtered.filter(item => 
        item.createdAt && item.createdAt <= filters.endDate!
      );
    }

    return filtered;
  }

  /**
   * Apply filters to policy violations
   * @param data - Array of policy violations to filter
   * @param filters - Filters to apply
   * @returns Filtered array
   */
  private applyViolationFilters(data: PolicyViolation[], filters: AuditFilters): PolicyViolation[] {
    let filtered = data;

    if (filters.userId) {
      filtered = filtered.filter(item => item.userId === filters.userId);
    }

    if (filters.featureId) {
      filtered = filtered.filter(item => item.featureId === filters.featureId);
    }

    if (filters.startDate) {
      filtered = filtered.filter(item => 
        item.createdAt && item.createdAt >= filters.startDate!
      );
    }

    if (filters.endDate) {
      filtered = filtered.filter(item => 
        item.createdAt && item.createdAt <= filters.endDate!
      );
    }

    return filtered;
  }

  /**
   * Apply filters to change history
   * @param data - Array of change history to filter
   * @param filters - Filters to apply
   * @returns Filtered array
   */
  private applyChangeFilters(data: ChangeHistory[], filters: AuditFilters): ChangeHistory[] {
    let filtered = data;

    if (filters.userId) {
      filtered = filtered.filter(item => 
        item.adminUserId === filters.userId || item.targetUserId === filters.userId
      );
    }

    if (filters.startDate) {
      filtered = filtered.filter(item => 
        item.createdAt && item.createdAt >= filters.startDate!
      );
    }

    if (filters.endDate) {
      filtered = filtered.filter(item => 
        item.createdAt && item.createdAt <= filters.endDate!
      );
    }

    return filtered;
  }

  /**
   * Apply filters to sessions
   * @param data - Array of sessions to filter
   * @param filters - Filters to apply
   * @returns Filtered array
   */
  private applySessionFilters(data: Session[], filters: AuditFilters): Session[] {
    let filtered = data;

    if (filters.userId) {
      filtered = filtered.filter(item => item.userId === filters.userId);
    }

    if (filters.startDate) {
      filtered = filtered.filter(item => 
        item.createdAt && item.createdAt >= filters.startDate!
      );
    }

    if (filters.endDate) {
      filtered = filtered.filter(item => 
        item.createdAt && item.createdAt <= filters.endDate!
      );
    }

    return filtered;
  }

  /**
   * Mendapatkan statistik akses berdasarkan feature
   * @param filters - Filter untuk statistik
   * @returns Promise dengan statistik per feature
   */
  async getAccessStatsByFeature(filters: AuditFilters = {}) {
    return this.executeWithErrorHandling(
      'get access stats by feature',
      async () => {
         const accessLogs = await this.accessLogRepository.findAll();
         const filteredLogs = this.applyAccessLogFilters(accessLogs, filters);
        
        const statsByFeature = new Map();
        
        filteredLogs.forEach(log => {
          const featureId = log.featureId;
          if (!statsByFeature.has(featureId)) {
            statsByFeature.set(featureId, {
              featureId,
              totalAccess: 0,
              allowedAccess: 0,
              deniedAccess: 0
            });
          }
          
          const stats = statsByFeature.get(featureId);
          stats.totalAccess++;
          if (log.decision === 'allow') stats.allowedAccess++;
          if (log.decision === 'deny') stats.deniedAccess++;
        });
        
        return Array.from(statsByFeature.values());
      }
    );
  }

  /**
   * Mendapatkan ringkasan audit
   * @param filters - Filter untuk statistik
   * @returns Promise dengan ringkasan audit
   */
  async getAuditSummary(filters: AuditFilters = {}) {
    return this.executeWithErrorHandling(
      'get audit summary',
      async () => {
        const stats = await this.getAuditStats(filters);
        
        return {
          totalEvents: stats.accessLogs.total + stats.policyViolations.total + stats.changeHistory.total,
          securityEvents: stats.policyViolations.total + stats.accessLogs.denied,
          adminActions: stats.changeHistory.total,
          activeUsers: stats.accessLogs.uniqueUsers,
          activeSessions: stats.sessions.active
        };
      }
    );
  }
}

// Export instance dengan dependency injection
const accessLogRepository = new AccessLogRepository('AccessLogRepository');
const policyViolationRepository = new PolicyViolationRepository('PolicyViolationRepository');
const changeHistoryRepository = new ChangeHistoryRepository('ChangeHistoryRepository');
const sessionRepository = new SessionRepository('SessionRepository');

export const auditStatsService = new AuditStatsService(
  accessLogRepository,
  policyViolationRepository,
  changeHistoryRepository,
  sessionRepository
);