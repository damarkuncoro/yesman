import { BaseService } from "../base/baseService";
import { ValidationService } from "../../lib/validation/validator";
import { PolicyViolationRepository } from "../../repositories/policyViolation";
import { 
  createPolicyViolationSchema, 
  type PolicyViolation, 
  type AuditFilters 
} from "./types";

/**
 * Service untuk manajemen Policy Violation
 * Menangani business logic untuk operasi policy violation dalam sistem audit
 */
export class PolicyViolationService extends BaseService {
  constructor(private policyViolationRepository: PolicyViolationRepository) {
    super();
  }

  /**
   * Log policy violation
   * @param data - Data policy violation
   * @returns PolicyViolation yang dibuat
   * @throws Error jika validasi gagal atau terjadi kesalahan database
   */
  async logPolicyViolation(data: unknown): Promise<PolicyViolation> {
    const validatedData = ValidationService.validate(createPolicyViolationSchema, data);
    
    return this.executeWithErrorHandling(
      'log policy violation',
      () => this.policyViolationRepository.create(validatedData)
    );
  }

  /**
   * Get policy violations dengan filtering
   * @param filters - Filter untuk query
   * @returns Array of policy violations
   */
  async getPolicyViolations(filters: AuditFilters = {}): Promise<PolicyViolation[]> {
    return this.executeWithErrorHandling(
      'get policy violations',
      async () => {
        let violations = await this.policyViolationRepository.findAll();
        
        // Apply filters
        if (filters.userId) {
          violations = violations.filter(violation => violation.userId === filters.userId);
        }
        if (filters.startDate) {
          violations = violations.filter(violation => new Date(violation.createdAt) >= filters.startDate!);
        }
        if (filters.endDate) {
          violations = violations.filter(violation => new Date(violation.createdAt) <= filters.endDate!);
        }
        
        // Apply pagination
        if (filters.offset || filters.limit) {
          const offset = filters.offset || 0;
          const limit = filters.limit || 50;
          violations = violations.slice(offset, offset + limit);
        }
        
        return violations;
      }
    );
  }

  /**
   * Get policy violations by user ID
   * @param userId - ID user
   * @param filters - Filter tambahan
   * @returns Array of policy violations untuk user tertentu
   */
  async getPolicyViolationsByUserId(userId: number, filters: Omit<AuditFilters, 'userId'> = {}): Promise<PolicyViolation[]> {
    return this.getPolicyViolations({ ...filters, userId });
  }

  /**
   * Get policy violations by policy ID
   * @param policyId - ID policy
   * @param filters - Filter tambahan
   * @returns Array of policy violations dengan policy ID tertentu
   */
  async getPolicyViolationsByPolicyId(policyId: number, filters: AuditFilters = {}): Promise<PolicyViolation[]> {
    return this.executeWithErrorHandling(
      `get policy violations by policy ID: ${policyId}`,
      async () => {
        const violations = await this.getPolicyViolations(filters);
        return violations.filter(violation => violation.policyId === policyId);
      }
    );
  }

  /**
   * Get policy violations by attribute
   * @param attribute - Attribute yang dilanggar
   * @param filters - Filter tambahan
   * @returns Array of policy violations dengan attribute tertentu
   */
  async getPolicyViolationsByAttribute(attribute: string, filters: AuditFilters = {}): Promise<PolicyViolation[]> {
    return this.executeWithErrorHandling(
      `get policy violations by attribute: ${attribute}`,
      async () => {
        const violations = await this.getPolicyViolations(filters);
        return violations.filter(violation => violation.attribute === attribute);
      }
    );
  }

  /**
   * Get policy violations statistics
   * @param filters - Filter untuk query
   * @returns Statistics policy violations
   */
  async getPolicyViolationStats(filters: AuditFilters = {}) {
    return this.executeWithErrorHandling(
      'get policy violation statistics',
      async () => {
        const violations = await this.getPolicyViolations(filters);
        
        const attributeCount = violations.reduce((acc, violation) => {
          acc[violation.attribute] = (acc[violation.attribute] || 0) + 1;
          return acc;
        }, {} as Record<string, number>);

        const policyIdCount = violations.reduce((acc, violation) => {
            if (violation.policyId) {
              acc[violation.policyId] = (acc[violation.policyId] || 0) + 1;
            }
            return acc;
          }, {} as Record<number, number>);
        
        return {
            total: violations.length,
            attributeBreakdown: attributeCount,
            policyIdBreakdown: policyIdCount,
            uniqueUsers: new Set(violations.map(violation => violation.userId).filter(id => id !== null)).size,
            uniquePolicyIds: new Set(violations.map(violation => violation.policyId).filter(id => id !== null)).size,
            uniqueAttributes: new Set(violations.map(violation => violation.attribute)).size
          };
      }
    );
  }

  /**
   * Get recent policy violations
   * @param limit - Jumlah violation yang akan diambil
   * @returns Array of recent policy violations
   */
  async getRecentPolicyViolations(limit: number = 50): Promise<PolicyViolation[]> {
    return this.executeWithErrorHandling(
      'get recent policy violations',
      async () => {
        const violations = await this.policyViolationRepository.findAll();
        return violations
          .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
          .slice(0, limit);
      }
    );
  }

  /**
   * Get policy violations by feature ID
   * @param featureId - ID feature
   * @param filters - Filter tambahan
   * @returns Array of policy violations untuk feature tertentu
   */
  async getPolicyViolationsByFeatureId(featureId: number, filters: AuditFilters = {}): Promise<PolicyViolation[]> {
     return this.getPolicyViolations({ ...filters, featureId });
  }

  /**
   * Get policy violations by date range
   * @param startDate - Tanggal mulai
   * @param endDate - Tanggal akhir
   * @param additionalFilters - Filter tambahan
   * @returns Array of policy violations dalam rentang tanggal
   */
  async getPolicyViolationsByDateRange(
    startDate: Date, 
    endDate: Date, 
    additionalFilters: Omit<AuditFilters, 'startDate' | 'endDate'> = {}
  ): Promise<PolicyViolation[]> {
    return this.getPolicyViolations({ 
      ...additionalFilters, 
      startDate, 
      endDate 
    });
  }

  /**
   * Get top violating users
   * @param limit - Jumlah user yang akan diambil
   * @param filters - Filter untuk query
   * @returns Array of user dengan violation terbanyak
   */
  async getTopViolatingUsers(limit: number = 10, filters: AuditFilters = {}) {
    return this.executeWithErrorHandling(
      'get top violating users',
      async () => {
        const violations = await this.getPolicyViolations(filters);
        
        const userViolationCount = violations.reduce((acc, violation) => {
          if (violation.userId !== null) {
            acc[violation.userId] = (acc[violation.userId] || 0) + 1;
          }
          return acc;
        }, {} as Record<number, number>);
        
        return Object.entries(userViolationCount)
          .map(([userId, count]) => ({ userId: parseInt(userId), violationCount: count }))
          .sort((a, b) => b.violationCount - a.violationCount)
          .slice(0, limit);
      }
    );
  }
}

// Export instance dengan dependency injection
export const policyViolationService = new PolicyViolationService(
  new PolicyViolationRepository('PolicyViolationRepository')
);