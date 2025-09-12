import { BaseService } from "../base/baseService";
import { ValidationService } from "../../lib/validation/validator";
import { AccessLogRepository } from "../../repositories/accessLog";
import { 
  createAccessLogSchema, 
  type AccessLog, 
  type CreateAccessLogData, 
  type AuditFilters 
} from "./types";

/**
 * Service untuk manajemen Access Log
 * Menangani business logic untuk operasi access log dalam sistem audit
 */
export class AccessLogService extends BaseService {
  constructor(private accessLogRepository: AccessLogRepository) {
    super();
  }

  /**
   * Log access attempt (allow/deny)
   * @param data - Data access log
   * @returns AccessLog yang dibuat
   * @throws Error jika validasi gagal atau terjadi kesalahan database
   */
  async logAccess(data: unknown): Promise<AccessLog> {
    const validatedData = ValidationService.validate(createAccessLogSchema, data);
    
    return this.executeWithErrorHandling(
      'log access attempt',
      () => this.accessLogRepository.create(validatedData)
    );
  }

  /**
   * Get access logs dengan filtering
   * @param filters - Filter untuk query
   * @returns Array of access logs
   */
  async getAccessLogs(filters: AuditFilters = {}): Promise<AccessLog[]> {
    return this.executeWithErrorHandling(
      'get access logs',
      async () => {
        let logs = await this.accessLogRepository.findAll();
        
        // Apply filters
        if (filters.userId) {
          logs = logs.filter(log => log.userId === filters.userId);
        }
        if (filters.startDate) {
          logs = logs.filter(log => new Date(log.createdAt) >= filters.startDate!);
        }
        if (filters.endDate) {
          logs = logs.filter(log => new Date(log.createdAt) <= filters.endDate!);
        }
        
        // Apply pagination
        if (filters.offset || filters.limit) {
          const offset = filters.offset || 0;
          const limit = filters.limit || 50;
          logs = logs.slice(offset, offset + limit);
        }
        
        return logs;
      }
    );
  }

  /**
   * Get access logs by user ID
   * @param userId - ID user
   * @param filters - Filter tambahan
   * @returns Array of access logs untuk user tertentu
   */
  async getAccessLogsByUserId(userId: number, filters: Omit<AuditFilters, 'userId'> = {}): Promise<AccessLog[]> {
    return this.getAccessLogs({ ...filters, userId });
  }

  /**
   * Get access logs by decision (allow/deny)
   * @param decision - Decision type
   * @param filters - Filter tambahan
   * @returns Array of access logs dengan decision tertentu
   */
  async getAccessLogsByDecision(decision: 'allow' | 'deny', filters: AuditFilters = {}): Promise<AccessLog[]> {
    return this.executeWithErrorHandling(
      `get access logs by decision: ${decision}`,
      async () => {
        const logs = await this.getAccessLogs(filters);
        return logs.filter(log => log.decision === decision);
      }
    );
  }

  /**
   * Get access logs statistics
   * @param filters - Filter untuk query
   * @returns Statistics access logs
   */
  async getAccessLogStats(filters: AuditFilters = {}) {
    return this.executeWithErrorHandling(
      'get access log statistics',
      async () => {
        const logs = await this.getAccessLogs(filters);
        
        return {
          total: logs.length,
          allowed: logs.filter(log => log.decision === 'allow').length,
          denied: logs.filter(log => log.decision === 'deny').length,
          uniqueUsers: new Set(logs.map(log => log.userId)).size,
          uniquePaths: new Set(logs.map(log => log.path)).size,
          uniqueMethods: new Set(logs.map(log => log.method)).size
        };
      }
    );
  }

  /**
   * Get recent access logs
   * @param limit - Jumlah log yang akan diambil
   * @returns Array of recent access logs
   */
  async getRecentAccessLogs(limit: number = 50): Promise<AccessLog[]> {
    return this.executeWithErrorHandling(
      'get recent access logs',
      async () => {
        const logs = await this.accessLogRepository.findAll();
        return logs
          .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
          .slice(0, limit);
      }
    );
  }

  /**
   * Get failed access attempts
   * @param filters - Filter untuk query
   * @returns Array of denied access logs
   */
  async getFailedAccessAttempts(filters: AuditFilters = {}): Promise<AccessLog[]> {
    return this.getAccessLogsByDecision('deny', filters);
  }

  /**
   * Get successful access attempts
   * @param filters - Filter untuk query
   * @returns Array of allowed access logs
   */
  async getSuccessfulAccessAttempts(filters: AuditFilters = {}): Promise<AccessLog[]> {
    return this.getAccessLogsByDecision('allow', filters);
  }
}

// Export instance dengan dependency injection
export const accessLogService = new AccessLogService(
  new AccessLogRepository()
);