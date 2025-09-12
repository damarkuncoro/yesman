import { accessLogService } from './accessLogService';
import { policyViolationService } from './policyViolationService';
import { changeHistoryService } from './changeHistoryService';
import { sessionLogService } from './sessionLogService';
import { auditStatsService } from './auditStatsService';
import type {
  AuditFilters,
  CreateAccessLogData,
  CreatePolicyViolationData,
  CreateChangeHistoryData,
  AccessLog,
  PolicyViolation,
  ChangeHistory,
  SessionLog
} from './types';

/**
 * Service utama untuk orchestration dan high-level audit operations
 * Menggabungkan semua service audit dalam satu interface yang mudah digunakan
 */
export class AuditService {
  // Access Log Operations
  /**
   * Log aktivitas akses user
   * @param data - Data access log
   * @returns Promise<AccessLog>
   */
  async logAccess(data: CreateAccessLogData): Promise<AccessLog> {
    return accessLogService.logAccess(data);
  }

  /**
   * Mendapatkan access logs dengan filter
   * @param filters - Filter untuk access logs
   * @returns Promise dengan access logs
   */
  async getAccessLogs(filters: AuditFilters = {}) {
    return accessLogService.getAccessLogs(filters);
  }

  /**
   * Mendapatkan access logs berdasarkan user ID
   * @param userId - ID user
   * @param filters - Filter tambahan
   * @returns Promise dengan access logs user
   */
  async getAccessLogsByUserId(userId: number, filters: AuditFilters = {}) {
    return accessLogService.getAccessLogsByUserId(userId, filters);
  }

  /**
   * Mendapatkan access logs berdasarkan decision
   * @param decision - Decision (allow/deny)
   * @param filters - Filter tambahan
   * @returns Promise dengan access logs berdasarkan decision
   */
  async getAccessLogsByDecision(decision: 'allow' | 'deny', filters: AuditFilters = {}) {
    return accessLogService.getAccessLogsByDecision(decision, filters);
  }

  // Policy Violation Operations
  /**
   * Log policy violation
   * @param data - Data policy violation
   * @returns Promise<PolicyViolation>
   */
  async logPolicyViolation(data: CreatePolicyViolationData): Promise<PolicyViolation> {
    return policyViolationService.logPolicyViolation(data);
  }

  /**
   * Mendapatkan policy violations dengan filter
   * @param filters - Filter untuk policy violations
   * @returns Promise dengan policy violations
   */
  async getPolicyViolations(filters: AuditFilters = {}) {
    return policyViolationService.getPolicyViolations(filters);
  }

  /**
   * Mendapatkan policy violations berdasarkan user ID
   * @param userId - ID user
   * @param filters - Filter tambahan
   * @returns Promise dengan policy violations user
   */
  async getPolicyViolationsByUserId(userId: number, filters: AuditFilters = {}) {
    return policyViolationService.getPolicyViolationsByUserId(userId, filters);
  }

  /**
   * Mendapatkan policy violations berdasarkan policy ID
   * @param policyId - ID policy
   * @param filters - Filter tambahan
   * @returns Promise dengan policy violations policy
   */
  async getPolicyViolationsByPolicyId(policyId: number, filters: AuditFilters = {}) {
    return policyViolationService.getPolicyViolationsByPolicyId(policyId, filters);
  }

  // Change History Operations
  /**
   * Log perubahan history
   * @param data - Data change history
   * @returns Promise<ChangeHistory>
   */
  async logChangeHistory(data: CreateChangeHistoryData): Promise<ChangeHistory> {
    return changeHistoryService.logChangeHistory(data);
  }

  /**
   * Mendapatkan change history dengan filter
   * @param filters - Filter untuk change history
   * @returns Promise dengan change history
   */
  async getChangeHistory(filters: AuditFilters = {}) {
    return changeHistoryService.getChangeHistory(filters);
  }

  /**
   * Mendapatkan change history berdasarkan admin user ID
   * @param adminUserId - ID admin user
   * @param filters - Filter tambahan
   * @returns Promise dengan change history admin
   */
  async getChangeHistoryByAdminUserId(adminUserId: number, filters: AuditFilters = {}) {
    return changeHistoryService.getChangeHistoryByAdminUserId(adminUserId, filters);
  }

  // Session Log Operations
  /**
   * Log aktivitas session
   * @param userId - ID user
   * @param action - Action yang dilakukan
   * @param sessionId - ID session
   * @param expiresAt - Waktu expire session
   * @param ipAddress - IP address (optional)
   * @param userAgent - User agent (optional)
   * @returns Promise<SessionLog>
   */
  async logSessionActivity(
    userId: number, 
    action: 'login' | 'logout', 
    sessionId: string, 
    expiresAt: Date,
    ipAddress?: string,
    userAgent?: string
  ): Promise<SessionLog> {
    return sessionLogService.logSessionActivity({
      userId,
      action,
      sessionId,
      ipAddress,
      userAgent,
      expiresAt
    });
  }

  /**
   * Mendapatkan session logs dengan filter
   * @param filters - Filter untuk session logs
   * @returns Promise dengan session logs
   */
  async getSessionLogs(filters: AuditFilters = {}) {
    return sessionLogService.getSessionLogs(filters);
  }

  /**
   * Mendapatkan active sessions
   * @returns Promise dengan active sessions
   */
  async getActiveSessions() {
    return sessionLogService.getActiveSessions();
  }

  /**
   * Mendapatkan expired sessions
   * @returns Promise dengan expired sessions
   */
  async getExpiredSessions() {
    return sessionLogService.getExpiredSessions();
  }

  // Statistics and Reporting
  /**
   * Mendapatkan statistik audit secara keseluruhan
   * @param filters - Filter untuk statistik
   * @returns Promise dengan statistik audit
   */
  async getAuditStats(filters: AuditFilters = {}) {
    return auditStatsService.getAuditStats(filters);
  }

  /**
   * Mendapatkan statistik akses berdasarkan feature
   * @param filters - Filter untuk statistik
   * @returns Promise dengan statistik per feature
   */
  async getAccessStatsByFeature(filters: AuditFilters = {}) {
    return auditStatsService.getAccessStatsByFeature(filters);
  }



  /**
   * Mendapatkan summary audit untuk dashboard
   * @param filters - Filter untuk statistik
   * @returns Promise dengan summary data
   */
  async getAuditSummary(filters: AuditFilters = {}) {
    return auditStatsService.getAuditSummary(filters);
  }

  // Additional Operations
  /**
   * Mendapatkan failed access attempts
   * @param filters - Filter untuk query
   * @returns Promise dengan failed access attempts
   */
  async getFailedAccessAttempts(filters: AuditFilters = {}) {
    return accessLogService.getFailedAccessAttempts(filters);
  }

  /**
   * Mendapatkan successful access attempts
   * @param filters - Filter untuk query
   * @returns Promise dengan successful access attempts
   */
  async getSuccessfulAccessAttempts(filters: AuditFilters = {}) {
    return accessLogService.getSuccessfulAccessAttempts(filters);
  }

  /**
   * Mendapatkan recent access logs
   * @param limit - Jumlah maksimal logs yang dikembalikan
   * @returns Promise dengan recent access logs
   */
  async getRecentAccessLogs(limit: number = 50) {
    return accessLogService.getRecentAccessLogs(limit);
  }

  /**
   * Mendapatkan access log statistics
   * @param filters - Filter untuk statistik
   * @returns Promise dengan access log statistics
   */
  async getAccessLogStats(filters: AuditFilters = {}) {
    return accessLogService.getAccessLogStats(filters);
  }

  // Utility Methods
  /**
   * Mendapatkan semua service audit yang tersedia
   * @returns Object dengan semua service instances
   */
  getServices() {
    return {
      accessLog: accessLogService,
      policyViolation: policyViolationService,
      changeHistory: changeHistoryService,
      sessionLog: sessionLogService,
      stats: auditStatsService
    };
  }
}

// Export instance untuk digunakan di aplikasi
export const auditService = new AuditService();