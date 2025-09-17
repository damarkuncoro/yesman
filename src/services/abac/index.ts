/**
 * ABAC Services Index
 * 
 * Re-exports semua service ABAC dan menyediakan backward compatibility
 * dengan AbacService class yang original.
 */

// Export types dan interfaces
export * from './types';

// Export individual services
export { policyEvaluationService } from './policyEvaluationService';
export { policyManagementService } from './policyManagementService';
export { userAttributeService } from './userAttributeService';
export { policyComparisonService } from './policyComparisonService';

// Export service classes untuk advanced usage
export { PolicyEvaluationService } from './policyEvaluationService';
export { PolicyManagementService } from './policyManagementService';
export { UserAttributeService } from './userAttributeService';
export { PolicyComparisonService } from './policyComparisonService';

// Import services untuk backward compatibility
import { policyEvaluationService } from './policyEvaluationService';
import { policyManagementService } from './policyManagementService';
import { userAttributeService } from './userAttributeService';
import { policyComparisonService } from './policyComparisonService';
import type { 
  PolicyEvaluationResult,
  PolicyCreateInput,
  UserAttributesUpdateInput,
  UserAttribute,
  AbacOperator,
  ComparisonResult,
  ValidatedPolicyEvaluationInput
} from './types';

/**
 * AbacService class untuk backward compatibility
 * 
 * Menggabungkan semua service kecil menjadi satu interface
 * yang kompatibel dengan implementasi sebelumnya.
 */
export class AbacService {
  /**
   * Evaluasi multiple policies untuk user tertentu
   */
  async evaluatePolicies(
    userId: number,
    featureId: number
  ): Promise<boolean> {
    return await policyEvaluationService.evaluatePolicies(userId, featureId);
  }

  /**
   * Evaluasi policies dengan detail untuk user tertentu
   */
  async evaluatePoliciesWithDetails(
    userId: number,
    featureId: number
  ): Promise<PolicyEvaluationResult> {
    return await policyEvaluationService.evaluatePoliciesWithDetails(userId, featureId);
  }

  /**
   * Mendapatkan nilai attribute user
   */
  async getUserAttributeValue(
    user: any,
    attribute: UserAttribute
  ): Promise<any> {
    return await policyComparisonService.getUserAttributeValue(user, attribute);
  }

  /**
   * Membandingkan values dengan operator tertentu
   */
  compareValues(
    userValue: any,
    policyValue: any,
    operator: AbacOperator
  ): ComparisonResult {
    return policyComparisonService.compareValues(userValue, policyValue, operator);
  }

  /**
   * Membuat policy baru
   */
  async createPolicy(input: PolicyCreateInput) {
    return await policyManagementService.createPolicy(input);
  }

  /**
   * Menghapus policy
   */
  async deletePolicy(policyId: number): Promise<boolean> {
    return await policyManagementService.deletePolicy(policyId);
  }

  /**
   * Mendapatkan policy berdasarkan ID
   */
  async getPolicyById(policyId: number) {
    return await policyManagementService.getPolicyById(policyId);
  }

  /**
   * Mendapatkan policies berdasarkan feature
   */
  async getPoliciesByFeature(featureId: number) {
    return await policyManagementService.getPoliciesByFeature(featureId);
  }

  /**
   * Update user attributes
   */
  async updateUserAttributes(
    userId: number,
    input: UserAttributesUpdateInput
  ) {
    return await userAttributeService.updateUserAttributes(userId, input);
  }

  // Additional methods untuk extended functionality
  
  /**
   * Cek apakah user memiliki akses ke feature tertentu
   */
  async hasAccess(
    userId: number,
    featureId: number
  ): Promise<boolean> {
    return await policyEvaluationService.hasAccess(userId, featureId);
  }

  /**
   * Batch evaluasi untuk multiple features
   */
  async batchEvaluate(
    userId: number,
    featureIds: number[]
  ) {
    return await policyEvaluationService.batchEvaluate(userId, featureIds);
  }

  /**
   * Mendapatkan user attributes
   */
  async getUserAttributes(userId: number) {
    return await userAttributeService.getUserAttributes(userId);
  }

  /**
   * Mendapatkan supported operators
   */
  getSupportedOperators(): string[] {
    return policyComparisonService.getSupportedOperators();
  }

  /**
   * Mendapatkan supported attributes
   */
  getSupportedAttributes(): string[] {
    return policyComparisonService.getSupportedAttributes();
  }
}

// Export default instance untuk backward compatibility
export const abacService = new AbacService();

// Default export
export default abacService;