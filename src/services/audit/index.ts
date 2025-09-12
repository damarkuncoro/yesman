/**
 * Audit Services Index
 * Re-export semua service audit untuk kemudahan import dan backward compatibility
 */

// Import dan export semua service instances
import { accessLogService } from './accessLogService';
import { policyViolationService } from './policyViolationService';
import { changeHistoryService } from './changeHistoryService';
import { sessionLogService } from './sessionLogService';
import { auditStatsService } from './auditStatsService';
import { auditService } from './auditService';
import type { AuditFilters, CreateAccessLogData, CreatePolicyViolationData, CreateChangeHistoryData } from './types';

export { accessLogService, policyViolationService, changeHistoryService, sessionLogService, auditStatsService, auditService };

// Export semua service classes
export { AccessLogService } from './accessLogService';
export { PolicyViolationService } from './policyViolationService';
export { ChangeHistoryService } from './changeHistoryService';
export { SessionLogService } from './sessionLogService';
export { AuditStatsService } from './auditStatsService';
export { AuditService } from './auditService';

// Export semua types dan interfaces
export type {
  AuditFilters,
  AuditStats,
  CreateAccessLogData,
  CreatePolicyViolationData,
  CreateChangeHistoryData,
  EnrichedChangeHistory,
  SessionLog,
  CleanupResult,
  AuditLogType,
  AccessDecision,
  SessionAction,
  AccessLog,
  PolicyViolation,
  ChangeHistory,
  Session,
  User
} from './types';

// Export schema validasi
export {
  createAccessLogSchema,
  createPolicyViolationSchema,
  createChangeHistorySchema
} from './types';

// Default export untuk backward compatibility
// Menggunakan auditService sebagai main service yang mengorkestrasikan semua service lainnya
const auditServiceModule = {
  // Main orchestration service
  auditService,
  
  // Individual services
  accessLog: accessLogService,
  policyViolation: policyViolationService,
  changeHistory: changeHistoryService,
  sessionLog: sessionLogService,
  stats: auditStatsService,
  
  // Utility methods untuk backward compatibility
  /**
   * Log access attempt (backward compatibility)
   * @param data - Data access log
   * @returns Promise<AccessLog>
   */
  logAccess: (data: CreateAccessLogData) => auditService.logAccess(data),
  
  /**
   * Log policy violation (backward compatibility)
   * @param data - Data policy violation
   * @returns Promise<PolicyViolation>
   */
  logPolicyViolation: (data: CreatePolicyViolationData) => auditService.logPolicyViolation(data),
  
  /**
   * Log change history (backward compatibility)
   * @param data - Data change history
   * @returns Promise<ChangeHistory>
   */
  logChangeHistory: (data: CreateChangeHistoryData) => auditService.logChangeHistory(data),
  
  /**
   * Get audit statistics (backward compatibility)
   * @param filters - Filter untuk statistik
   * @returns Promise dengan statistik audit
   */
  getAuditStats: (filters?: AuditFilters) => auditService.getAuditStats(filters),
  
  /**
   * Get access logs (backward compatibility)
   * @param filters - Filter untuk access logs
   * @returns Promise dengan access logs
   */
  getAccessLogs: (filters?: AuditFilters) => auditService.getAccessLogs(filters),
  
  /**
   * Get policy violations (backward compatibility)
   * @param filters - Filter untuk policy violations
   * @returns Promise dengan policy violations
   */
  getPolicyViolations: (filters?: AuditFilters) => auditService.getPolicyViolations(filters),
  
  /**
   * Get change history (backward compatibility)
   * @param filters - Filter untuk change history
   * @returns Promise dengan change history
   */
  getChangeHistory: (filters?: AuditFilters) => auditService.getChangeHistory(filters),
  
  /**
   * Get session logs (backward compatibility)
   * @param filters - Filter untuk session logs
   * @returns Promise dengan session logs
   */
  getSessionLogs: (filters?: AuditFilters) => auditService.getSessionLogs(filters)
};

export default auditServiceModule;