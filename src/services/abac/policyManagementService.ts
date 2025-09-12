import { BaseService } from "../base/baseService";
import { ValidationService } from "../../lib/validation/validator";
import { ErrorHandler, NotFoundError } from "../../lib/errors/errorHandler";
import { PolicyRepository } from "../../repositories/policy/policyRepository";
import { PolicyComparisonService } from "./policyComparisonService";
import {
  Policy,
  PolicyCreateInput,
  ValidatedPolicyCreateInput,
  createPolicySchema
} from "./types";

/**
 * Service untuk mengelola ABAC policies (CRUD operations)
 * Bertanggung jawab untuk create, read, update, delete policies
 */
export class PolicyManagementService extends BaseService {
  constructor(
    private policyRepository: PolicyRepository,
    private policyComparisonService: PolicyComparisonService,
    private validationService: ValidationService,
    private errorHandler: ErrorHandler
  ) {
    super();
  }

  /**
   * Buat policy baru untuk feature
   * @param policyData - Data policy yang akan dibuat
   * @returns Promise<Policy> - Policy yang dibuat
   */
  async createPolicy(policyData: PolicyCreateInput): Promise<Policy> {
    return this.executeWithErrorHandling(
      'create ABAC policy',
      async () => {
        // Validasi input
        const validatedData = this.validateInput(createPolicySchema, policyData);
        
        // Validasi operator dan attribute
        this.validatePolicyData(validatedData);
        
        // Buat policy baru
        return await this.policyRepository.create(validatedData);
      }
    );
  }

  /**
   * Update policy yang sudah ada
   * @param policyId - ID policy yang akan diupdate
   * @param policyData - Data policy yang akan diupdate
   * @returns Promise<Policy> - Policy yang diupdate
   */
  async updatePolicy(
    policyId: number,
    policyData: Partial<PolicyCreateInput>
  ): Promise<Policy> {
    return this.executeWithErrorHandling(
      'update ABAC policy',
      async () => {
        // Cek apakah policy ada
        const existingPolicy = await this.policyRepository.findById(policyId);
        if (!existingPolicy) {
          throw new NotFoundError('Policy', policyId);
        }

        // Validasi data yang akan diupdate
        if (policyData.operator && !this.policyComparisonService.isValidOperator(policyData.operator)) {
          throw new Error(`Invalid operator: ${policyData.operator}`);
        }
        
        if (policyData.attribute && !this.policyComparisonService.isValidAttribute(policyData.attribute)) {
          throw new Error(`Invalid attribute: ${policyData.attribute}`);
        }

        // Update policy
        const updatedPolicy = await this.policyRepository.update(policyId, policyData);

        if (!updatedPolicy) {
          throw new Error('Failed to update policy');
        }

        return updatedPolicy;
      }
    );
  }

  /**
   * Hapus policy berdasarkan ID
   * @param policyId - ID policy yang akan dihapus
   * @returns Promise<boolean> - true jika berhasil dihapus
   */
  async deletePolicy(policyId: number): Promise<boolean> {
    return this.executeWithErrorHandling(
      'delete ABAC policy',
      async () => {
        const policy = await this.policyRepository.findById(policyId);
        if (!policy) {
          throw new NotFoundError('Policy', policyId);
        }
        
        return await this.policyRepository.delete(policyId);
      }
    );
  }

  /**
   * Ambil policy berdasarkan ID
   * @param policyId - ID policy
   * @returns Promise<Policy | null> - Policy atau null jika tidak ditemukan
   */
  async getPolicyById(policyId: number): Promise<Policy | null> {
    return this.executeWithErrorHandling(
      'get policy by ID',
      async () => {
        const policy = await this.policyRepository.findById(policyId);
        return policy || null;
      }
    );
  }

  /**
   * Ambil semua policies untuk feature tertentu
   * @param featureId - ID feature
   * @returns Promise<Policy[]> - Array policies
   */
  async getPoliciesByFeature(featureId: number): Promise<Policy[]> {
    return this.executeWithErrorHandling(
      'get policies by feature',
      () => this.policyRepository.findByFeatureId(featureId)
    );
  }

  /**
   * Ambil semua policies dengan pagination
   * @param page - Nomor halaman (mulai dari 1)
   * @param limit - Jumlah item per halaman
   * @returns Promise<{policies: Policy[], total: number}> - Policies dengan total count
   */
  async getAllPolicies(
    page: number = 1,
    limit: number = 10
  ): Promise<{ policies: Policy[], total: number }> {
    return this.executeWithErrorHandling(
      'get all policies',
      async () => {
        const offset = (page - 1) * limit;
        const [policies, total] = await Promise.all([
          this.policyRepository.findAll(),
          this.policyRepository.count()
        ]);
        
        // Apply pagination manually if repository doesn't support it
        const paginatedPolicies = policies.slice(offset, offset + limit);
        
        return { policies: paginatedPolicies, total };
      }
    );
  }

  /**
   * Cari policies berdasarkan attribute
   * @param attribute - Nama attribute
   * @returns Promise<Policy[]> - Array policies
   */
  async getPoliciesByAttribute(attribute: string): Promise<Policy[]> {
    return this.executeWithErrorHandling(
      'get policies by attribute',
      () => this.policyRepository.findByAttribute(attribute)
    );
  }

  /**
   * Batch delete policies berdasarkan feature ID
   * @param featureId - ID feature
   * @returns Promise<number> - Jumlah policies yang dihapus
   */
  async deletePoliciesByFeature(featureId: number): Promise<number> {
    return this.executeWithErrorHandling(
      'delete policies by feature',
      async () => {
        const policies = await this.policyRepository.findByFeatureId(featureId);
        let deletedCount = 0;
        
        for (const policy of policies) {
          const deleted = await this.policyRepository.delete(policy.id);
          if (deleted) deletedCount++;
        }
        
        return deletedCount;
      }
    );
  }

  /**
   * Duplicate policy untuk feature lain
   * @param policyId - ID policy yang akan diduplicate
   * @param targetFeatureId - ID feature tujuan
   * @returns Promise<Policy> - Policy baru yang diduplicate
   */
  async duplicatePolicy(policyId: number, targetFeatureId: number): Promise<Policy> {
    return this.executeWithErrorHandling(
      'duplicate policy',
      async () => {
        const sourcePolicy = await this.policyRepository.findById(policyId);
        if (!sourcePolicy) {
          throw new NotFoundError('Policy', policyId);
        }
        
        const newPolicyData: PolicyCreateInput = {
          featureId: targetFeatureId,
          attribute: sourcePolicy.attribute,
          operator: sourcePolicy.operator,
          value: sourcePolicy.value
        };
        
        return await this.createPolicy(newPolicyData);
      }
    );
  }

  /**
   * Validasi data policy sebelum create/update
   * @param policyData - Data policy yang akan divalidasi
   * @throws Error jika data tidak valid
   */
  private validatePolicyData(policyData: ValidatedPolicyCreateInput): void {
    // Validasi operator
    if (!this.policyComparisonService.isValidOperator(policyData.operator)) {
      throw new Error(
        `Invalid operator: ${policyData.operator}. ` +
        `Supported operators: ${this.policyComparisonService.getSupportedOperators().join(', ')}`
      );
    }
    
    // Validasi attribute
    if (!this.policyComparisonService.isValidAttribute(policyData.attribute)) {
      throw new Error(
        `Invalid attribute: ${policyData.attribute}. ` +
        `Supported attributes: ${this.policyComparisonService.getSupportedAttributes().join(', ')}`
      );
    }
    
    // Validasi value untuk operator 'in'
    if (policyData.operator === 'in') {
      try {
        const parsedValue = JSON.parse(policyData.value);
        if (!Array.isArray(parsedValue)) {
          throw new Error("Value untuk operator 'in' harus berupa JSON array");
        }
      } catch (error) {
        throw new Error(
          `Invalid value untuk operator 'in': ${policyData.value}. ` +
          "Value harus berupa valid JSON array, contoh: [\"value1\", \"value2\"]"
        );
      }
    }
  }

  /**
   * Get statistik policies
   * @returns Promise<object> - Statistik policies
   */
  async getPolicyStatistics(): Promise<{
    totalPolicies: number;
    policiesByAttribute: Record<string, number>;
    policiesByOperator: Record<string, number>;
  }> {
    return this.executeWithErrorHandling(
      'get policy statistics',
      async () => {
        const allPolicies = await this.policyRepository.findAll();
        
        const policiesByAttribute: Record<string, number> = {};
        const policiesByOperator: Record<string, number> = {};
        
        for (const policy of allPolicies) {
          // Count by attribute
          policiesByAttribute[policy.attribute] = 
            (policiesByAttribute[policy.attribute] || 0) + 1;
          
          // Count by operator
          policiesByOperator[policy.operator] = 
            (policiesByOperator[policy.operator] || 0) + 1;
        }
        
        return {
          totalPolicies: allPolicies.length,
          policiesByAttribute,
          policiesByOperator
        };
      }
    );
  }
}

// Export instance untuk digunakan di service lain
export const policyManagementService = new PolicyManagementService(
  new PolicyRepository(),
  new PolicyComparisonService(),
  new ValidationService(),
  new ErrorHandler()
);