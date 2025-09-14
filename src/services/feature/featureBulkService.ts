import { BaseService } from "../base/baseService";
import { FeatureRepository } from "../../repositories/feature/featureRepository";
import { FeatureValidationService } from "./featureValidationService";
import type { Feature } from "../../db/schema";
import type { FeatureCreateInput } from "../../lib/validation/schemas";

/**
 * Interface untuk hasil operasi bulk
 */
export interface BulkOperationResult {
  successful: number;
  failed: number;
  errors: Array<{
    index: number;
    error: string;
    data?: any;
  }>;
}

/**
 * Interface untuk hasil bulk create
 */
export interface BulkCreateResult extends BulkOperationResult {
  createdFeatures: Feature[];
}

/**
 * Interface untuk hasil bulk delete
 */
export interface BulkDeleteResult extends BulkOperationResult {
  deletedIds: number[];
}

/**
 * Service untuk operasi bulk pada Feature
 * Menerapkan Single Responsibility Principle untuk operasi bulk
 */
export class FeatureBulkService extends BaseService {
  constructor(
    private featureRepository: FeatureRepository,
    private validationService: FeatureValidationService
  ) {
    super();
  }

  /**
   * Membuat multiple features sekaligus
   * @param dataArray - Array data features yang akan dibuat
   * @returns Promise<BulkCreateResult> - Hasil operasi bulk create
   */
  async bulkCreate(dataArray: unknown): Promise<BulkCreateResult> {
    return this.executeWithErrorHandling(
      'bulk create features',
      async () => {
        // Validasi input
        const validatedData = await this.validationService.validateBulkCreateData(dataArray);
        
        const result: BulkCreateResult = {
          successful: 0,
          failed: 0,
          errors: [],
          createdFeatures: []
        };

        // Proses setiap item
        for (let i = 0; i < validatedData.length; i++) {
          try {
            const featureData = validatedData[i];
            const createdFeature = await this.featureRepository.create(featureData);
            
            result.createdFeatures.push(createdFeature);
            result.successful++;
          } catch (error: any) {
            result.failed++;
            result.errors.push({
              index: i,
              error: error.message || 'Unknown error occurred',
              data: validatedData[i]
            });
          }
        }

        return result;
      }
    );
  }

  /**
   * Menghapus multiple features sekaligus
   * @param ids - Array ID features yang akan dihapus
   * @returns Promise<BulkDeleteResult> - Hasil operasi bulk delete
   */
  async bulkDelete(ids: unknown): Promise<BulkDeleteResult> {
    return this.executeWithErrorHandling(
      'bulk delete features',
      async () => {
        // Validasi input
        const validatedIds = this.validationService.validateBulkIds(ids);
        
        const result: BulkDeleteResult = {
          successful: 0,
          failed: 0,
          errors: [],
          deletedIds: []
        };

        // Proses setiap ID
        for (let i = 0; i < validatedIds.length; i++) {
          try {
            const id = validatedIds[i];
            
            // Validasi apakah feature dapat dihapus
            await this.validationService.validateFeatureCanBeDeleted(id);
            
            // Hapus feature
            const deleted = await this.featureRepository.delete(id);
            
            if (deleted) {
              result.deletedIds.push(id);
              result.successful++;
            } else {
              result.failed++;
              result.errors.push({
                index: i,
                error: 'Failed to delete feature',
                data: { id }
              });
            }
          } catch (error: any) {
            result.failed++;
            result.errors.push({
              index: i,
              error: error.message || 'Unknown error occurred',
              data: { id: validatedIds[i] }
            });
          }
        }

        return result;
      }
    );
  }

  /**
   * Mendapatkan multiple features berdasarkan array ID
   * @param ids - Array ID features yang akan diambil
   * @returns Promise<Feature[]> - Array features yang ditemukan
   */
  async bulkGet(ids: unknown): Promise<Feature[]> {
    return this.executeWithErrorHandling(
      'bulk get features',
      async () => {
        // Validasi input
        const validatedIds = this.validationService.validateBulkIds(ids);
        
        // Ambil features berdasarkan IDs
        return await this.featureRepository.findByIds(validatedIds);
      }
    );
  }

  /**
   * Mengecek ketersediaan multiple nama features
   * @param names - Array nama features yang akan dicek
   * @returns Promise<{available: string[], taken: string[]}> - Hasil pengecekan
   */
  async bulkCheckNameAvailability(names: string[]): Promise<{
    available: string[];
    taken: string[];
  }> {
    return this.executeWithErrorHandling(
      'bulk check name availability',
      async () => {
        if (!Array.isArray(names)) {
          throw new Error('Names must be an array');
        }

        if (names.length === 0) {
          throw new Error('Names array cannot be empty');
        }

        if (names.length > 50) {
          throw new Error('Cannot check more than 50 names at once');
        }

        const result = {
          available: [] as string[],
          taken: [] as string[]
        };

        // Proses setiap nama
        for (const name of names) {
          if (typeof name !== 'string' || name.trim().length === 0) {
            continue; // Skip invalid names
          }

          const cleanName = name.trim();
          const exists = await this.featureRepository.existsByName(cleanName);
          
          if (exists) {
            result.taken.push(cleanName);
          } else {
            result.available.push(cleanName);
          }
        }

        return result;
      }
    );
  }

  /**
   * Update description untuk multiple features
   * @param updates - Array object dengan id dan description baru
   * @returns Promise<BulkOperationResult> - Hasil operasi bulk update
   */
  async bulkUpdateDescription(updates: Array<{ id: number; description?: string }>): Promise<BulkOperationResult> {
    return this.executeWithErrorHandling(
      'bulk update feature description',
      async () => {
        // Validasi input
        if (!Array.isArray(updates)) {
          throw new Error('Updates must be an array');
        }
        
        if (updates.length === 0) {
          throw new Error('Updates array cannot be empty');
        }
        
        const result: BulkOperationResult = {
          successful: 0,
          failed: 0,
          errors: []
        };

        // Proses setiap update
        for (let i = 0; i < updates.length; i++) {
          try {
            const update = updates[i];
            
            if (!update.id || typeof update.id !== 'number') {
              throw new Error('Invalid ID provided');
            }
            
            // Validasi apakah feature ada
            await this.validationService.validateFeatureExists(update.id);
            
            // Update description
            const updated = await this.featureRepository.update(update.id, { description: update.description });
            
            if (updated) {
              result.successful++;
            } else {
              result.failed++;
              result.errors.push({
                index: i,
                error: 'Failed to update feature description',
                data: update
              });
            }
          } catch (error: any) {
            result.failed++;
            result.errors.push({
              index: i,
              error: error.message || 'Unknown error occurred',
              data: updates[i]
            });
          }
        }

        return result;
      }
    );
  }

  /**
   * Mendapatkan statistik operasi bulk
   * @param result - Hasil operasi bulk
   * @returns Object dengan statistik operasi
   */
  getBulkOperationStats(result: BulkOperationResult): {
    total: number;
    successRate: number;
    failureRate: number;
    hasErrors: boolean;
  } {
    const total = result.successful + result.failed;
    
    return {
      total,
      successRate: total > 0 ? (result.successful / total) * 100 : 0,
      failureRate: total > 0 ? (result.failed / total) * 100 : 0,
      hasErrors: result.errors.length > 0
    };
  }
}

// Export instance dengan dependency injection
export const featureBulkService = new FeatureBulkService(
  new FeatureRepository('FeatureRepository'),
  new FeatureValidationService(new FeatureRepository('FeatureRepository'))
);