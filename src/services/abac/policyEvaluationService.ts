import { BaseService } from "../base/baseService";
import { ValidationService } from "../../lib/validation/validator";
import { PolicyRepository } from "../../repositories/policy/policyRepository";
import { UserRepository } from "../../repositories/user/userRepository";
import { PolicyComparisonService } from "./policyComparisonService";
import {
  Policy,
  User,
  PolicyEvaluationResult,
  ValidatedPolicyEvaluationInput,
  policyEvaluationSchema
} from "./types";

/**
 * Service untuk evaluasi ABAC policies berdasarkan user attributes
 * Bertanggung jawab untuk mengevaluasi apakah user memenuhi semua policies untuk feature tertentu
 */
export class PolicyEvaluationService extends BaseService {
  constructor(
    private policyRepository: PolicyRepository,
    private userRepository: UserRepository,
    private policyComparisonService: PolicyComparisonService,
    private validationService: ValidationService
  ) {
    super();
  }

  /**
   * Evaluasi semua policies untuk feature tertentu berdasarkan user attributes
   * @param userId - ID user yang akan dievaluasi
   * @param featureId - ID feature yang akan diakses
   * @returns Promise<boolean> - true jika semua policies terpenuhi
   */
  async evaluatePolicies(userId: number, featureId: number): Promise<boolean> {
    return this.executeWithErrorHandling(
      'evaluate ABAC policies',
      async () => {
        // Validasi input
        const validatedInput = this.validateInput(policyEvaluationSchema, {
          userId,
          featureId
        });

        // Ambil user data dengan attributes
        const user = await this.userRepository.findById(validatedInput.userId);
        if (!user) {
          console.warn(`User dengan ID ${validatedInput.userId} tidak ditemukan`);
          return false;
        }

        // Ambil semua policies untuk feature ini
        const featurePolicies = await this.policyRepository.findByFeatureId(validatedInput.featureId);

        // Jika tidak ada policies, akses diizinkan (hanya RBAC yang berlaku)
        if (featurePolicies.length === 0) {
          return true;
        }

        // Evaluasi setiap policy
        for (const policy of featurePolicies) {
          const isValid = this.evaluatePolicy(user, policy);
          if (!isValid) {
            console.warn(
              `Policy gagal untuk user ${validatedInput.userId}, feature ${validatedInput.featureId}: ` +
              `${policy.attribute} ${policy.operator} ${policy.value}`
            );
            return false;
          }
        }

        return true;
      }
    );
  }

  /**
   * Evaluasi semua policies dengan detail hasil untuk debugging
   * @param userId - ID user yang akan dievaluasi
   * @param featureId - ID feature yang akan diakses
   * @returns Promise<PolicyEvaluationResult> - Hasil evaluasi dengan detail
   */
  async evaluatePoliciesWithDetails(
    userId: number,
    featureId: number
  ): Promise<PolicyEvaluationResult> {
    return this.executeWithErrorHandling(
      'evaluate ABAC policies with details',
      async () => {
        // Validasi input
        const validatedInput = this.validateInput(policyEvaluationSchema, {
          userId,
          featureId
        });

        // Ambil user data dengan attributes
        const user = await this.userRepository.findById(validatedInput.userId);
        if (!user) {
          return {
            isValid: false,
            failedPolicies: [{
              policyId: 0,
              attribute: "user",
              operator: "exists",
              value: "true",
              reason: `User dengan ID ${validatedInput.userId} tidak ditemukan`
            }]
          };
        }

        // Ambil semua policies untuk feature ini
        const featurePolicies = await this.policyRepository.findByFeatureId(validatedInput.featureId);

        // Jika tidak ada policies, akses diizinkan
        if (featurePolicies.length === 0) {
          return { isValid: true };
        }

        const failedPolicies: PolicyEvaluationResult['failedPolicies'] = [];

        // Evaluasi setiap policy
        for (const policy of featurePolicies) {
          const evaluationResult = this.evaluatePolicyWithDetails(user, policy);
          if (!evaluationResult.isValid) {
            failedPolicies!.push({
              policyId: policy.id,
              attribute: policy.attribute,
              operator: policy.operator,
              value: policy.value,
              reason: evaluationResult.reason || "Policy tidak terpenuhi"
            });
          }
        }

        return {
          isValid: failedPolicies.length === 0,
          failedPolicies: failedPolicies.length > 0 ? failedPolicies : undefined
        };
      }
    );
  }

  /**
   * Evaluasi single policy berdasarkan user attributes
   * @param user - User object dengan attributes
   * @param policy - Policy yang akan dievaluasi
   * @returns boolean - true jika policy terpenuhi
   */
  private evaluatePolicy(user: User, policy: Policy): boolean {
    const userValue = this.policyComparisonService.getUserAttributeValue(user, policy.attribute);
    
    // Jika user tidak memiliki attribute yang diperlukan, policy gagal
    if (userValue === null || userValue === undefined) {
      return false;
    }

    const comparisonResult = this.policyComparisonService.compareValues(
      userValue,
      policy.operator,
      policy.value
    );

    return comparisonResult.success && comparisonResult.result === true;
  }

  /**
   * Evaluasi single policy dengan detail hasil
   * @param user - User object dengan attributes
   * @param policy - Policy yang akan dievaluasi
   * @returns object - Hasil evaluasi dengan detail
   */
  private evaluatePolicyWithDetails(
    user: User,
    policy: Policy
  ): { isValid: boolean; reason?: string } {
    const userValue = this.policyComparisonService.getUserAttributeValue(user, policy.attribute);
    
    // Jika user tidak memiliki attribute yang diperlukan, policy gagal
    if (userValue === null || userValue === undefined) {
      return {
        isValid: false,
        reason: `User tidak memiliki attribute '${policy.attribute}'`
      };
    }

    const comparisonResult = this.policyComparisonService.compareValues(
      userValue,
      policy.operator,
      policy.value
    );

    if (!comparisonResult.success) {
      return {
        isValid: false,
        reason: comparisonResult.error || "Error dalam perbandingan nilai"
      };
    }

    if (comparisonResult.result !== true) {
      return {
        isValid: false,
        reason: `Nilai user '${userValue}' tidak memenuhi kondisi '${policy.operator} ${policy.value}'`
      };
    }

    return { isValid: true };
  }

  /**
   * Cek apakah user memiliki akses ke feature berdasarkan ABAC policies
   * @param userId - ID user
   * @param featureId - ID feature
   * @returns Promise<boolean> - true jika user memiliki akses
   */
  async hasAccess(userId: number, featureId: number): Promise<boolean> {
    return this.evaluatePolicies(userId, featureId);
  }

  /**
   * Batch evaluation untuk multiple features sekaligus
   * @param userId - ID user
   * @param featureIds - Array ID features
   * @returns Promise<Record<number, boolean>> - Map featureId -> hasAccess
   */
  async batchEvaluate(
    userId: number,
    featureIds: number[]
  ): Promise<Record<number, boolean>> {
    return this.executeWithErrorHandling(
      'batch evaluate ABAC policies',
      async () => {
        const results: Record<number, boolean> = {};
        
        for (const featureId of featureIds) {
          results[featureId] = await this.evaluatePolicies(userId, featureId);
        }
        
        return results;
      }
    );
  }
}

// Export instance untuk digunakan di service lain
export const policyEvaluationService = new PolicyEvaluationService(
  new PolicyRepository('PolicyRepository'),
  new UserRepository(),
  new PolicyComparisonService(),
  new ValidationService()
);