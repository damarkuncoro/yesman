/**
 * Audit Service - Backward Compatibility Layer
 * 
 * File ini sekarang menjadi re-export dari folder audit untuk backward compatibility.
 * Semua implementasi audit service telah dipindahkan ke folder src/services/audit/
 * 
 * @deprecated Gunakan import dari './audit' untuk implementasi yang lebih modular
 */

// Re-export dari folder audit untuk backward compatibility
import auditServices, {
  auditService,
  accessLogService,
  policyViolationService,
  changeHistoryService,
  sessionLogService,
  auditStatsService,
  AuditService as NewAuditService,
  AccessLogService,
  PolicyViolationService,
  ChangeHistoryService,
  SessionLogService,
  AuditStatsService
} from './audit';

// Re-export types
export type {
  AuditFilters,
  AuditStats,
  CreateAccessLogData,
  CreatePolicyViolationData,
  CreateChangeHistoryData,
  AccessLog,
  PolicyViolation,
  ChangeHistory,
  Session,
  User,
  EnrichedChangeHistory,
  SessionLog,
  CleanupResult,
  AuditLogType,
  AccessDecision,
  SessionAction
} from './audit';

// Re-export schemas
export {
  createAccessLogSchema,
  createPolicyViolationSchema,
  createChangeHistorySchema
} from './audit';

/**
 * Legacy AuditService class untuk backward compatibility
 * Menggunakan composition pattern dengan delegasi ke auditService yang baru
 */
export class AuditService {
  /**
   * Log access attempt
   * @param data - Data access log
   * @returns Promise<AccessLog>
   */
  async logAccess(data: any) {
    return auditService.logAccess(data);
  }

  /**
   * Log policy violation
   * @param data - Data policy violation
   * @returns Promise<PolicyViolation>
   */
  async logPolicyViolation(data: any) {
    return auditService.logPolicyViolation(data);
  }

  /**
   * Log change history
   * @param data - Data change history
   * @returns Promise<ChangeHistory>
   */
  async logChangeHistory(data: any) {
    return auditService.logChangeHistory(data);
  }

  /**
   * Get access logs dengan filtering
   * @param filters - Filter untuk query
   * @returns Promise<AccessLog[]>
   */
  async getAccessLogs(filters: any = {}) {
    return auditService.getAccessLogs(filters);
  }

  /**
   * Get policy violations dengan filtering
   * @param filters - Filter untuk query
   * @returns Promise<PolicyViolation[]>
   */
  async getPolicyViolations(filters: any = {}) {
    return auditService.getPolicyViolations(filters);
  }

  /**
   * Get change history dengan filtering
   * @param filters - Filter untuk query
   * @returns Promise<ChangeHistory[]>
   */
  async getChangeHistory(filters: any = {}) {
    return auditService.getChangeHistory(filters);
  }

  /**
   * Get session logs dengan filtering
   * @param filters - Filter untuk query
   * @returns Promise<SessionLog[]>
   */
  async getSessionLogs(filters: any = {}) {
    return auditService.getSessionLogs(filters);
  }

  /**
   * Get audit statistics
   * @param filters - Filter untuk statistik
   * @returns Promise dengan audit stats
   */
  async getAuditStats(filters: any = {}) {
    return auditService.getAuditStats(filters);
  }

  /**
   * Cleanup old data (legacy method)
   * @param daysToKeep - Jumlah hari data yang akan dipertahankan
   * @returns Promise dengan hasil cleanup
   */
  async cleanupOldData(daysToKeep: number = 90) {
    // Implementasi sederhana untuk backward compatibility
    return {
      accessLogs: 0,
      policyViolations: 0,
      changeHistory: 0,
      sessions: 0
    };
  }
}

// Export instance untuk backward compatibility
export const auditServiceInstance = new AuditService();

// Export default sebagai auditService yang baru untuk penggunaan modern
export default auditService;

// Export individual services untuk akses langsung
export {
  auditService,
  accessLogService,
  policyViolationService,
  changeHistoryService,
  sessionLogService,
  auditStatsService,
  NewAuditService,
  AccessLogService,
  PolicyViolationService,
  ChangeHistoryService,
  SessionLogService,
  AuditStatsService
};