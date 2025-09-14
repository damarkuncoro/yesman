import { BaseService } from "../base/baseService";
import { ValidationService } from "../../lib/validation/validator";
import { errorUtils } from "../../lib/errors/errorHandler";
import { FeatureRepository } from "../../repositories/feature/featureRepository";
import type { Feature } from "../../db/schema";
import type { FeatureCreateInput, FeatureUpdateInput } from "../../lib/validation/schemas";
import { featureCreateSchema, featureUpdateSchema } from "../../lib/validation/schemas";

interface ValidationResult {
  isValid: boolean;
  errors: string[];
}

/**
 * Service untuk validasi dan business rules pada Feature
 * Menerapkan Single Responsibility Principle untuk operasi validasi
 */
export class FeatureValidationService extends BaseService {
  constructor(private featureRepository: FeatureRepository) {
    super();
  }

  /**
   * Validasi data untuk membuat feature baru
   * @param data - Data yang akan divalidasi
   * @returns FeatureCreateInput - Data yang sudah tervalidasi
   * @throws ValidationError jika data tidak valid
   */
  validateCreateData(data: unknown): FeatureCreateInput {
    return ValidationService.validate(featureCreateSchema, data);
  }

  /**
   * Validasi data untuk update feature
   * @param data - Data yang akan divalidasi
   * @returns FeatureUpdateInput - Data yang sudah tervalidasi
   * @throws ValidationError jika data tidak valid
   */
  validateUpdateData(data: unknown): FeatureUpdateInput {
    return ValidationService.validate(featureUpdateSchema, data);
  }

  /**
   * Validasi apakah nama feature sudah digunakan (untuk create)
   * @param name - Nama feature yang akan dicek
   * @throws ConflictError jika nama sudah digunakan
   */
  async validateNameAvailability(name: string): Promise<void> {
    const existingFeature = await this.executeWithErrorHandling(
      'check feature name availability',
      () => this.featureRepository.findByName(name)
    );

    if (existingFeature) {
      throw errorUtils.conflict('Feature', 'name', name);
    }
  }

  /**
   * Validasi apakah nama feature sudah digunakan oleh feature lain (untuk update)
   * @param name - Nama feature yang akan dicek
   * @param excludeId - ID feature yang dikecualikan dari pengecekan
   * @throws ConflictError jika nama sudah digunakan oleh feature lain
   */
  async validateNameAvailabilityForUpdate(name: string, excludeId: number): Promise<void> {
    const existingFeature = await this.executeWithErrorHandling(
      'check feature name availability for update',
      () => this.featureRepository.findByName(name)
    );

    if (existingFeature && existingFeature.id !== excludeId) {
      throw errorUtils.conflict('Feature', 'name', name);
    }
  }

  /**
   * Validasi apakah feature dengan ID tertentu ada
   * @param id - ID feature yang akan dicek
   * @returns Promise<Feature> - Feature yang ditemukan
   * @throws NotFoundError jika feature tidak ditemukan
   */
  async validateFeatureExists(id: number): Promise<Feature> {
    const feature = await this.executeWithErrorHandling(
      'validate feature exists',
      () => this.featureRepository.findById(id)
    );

    if (!feature) {
      throw errorUtils.notFound('Feature', id);
    }

    return feature;
  }

  /**
   * Validasi apakah feature dapat dihapus
   * Mengecek apakah feature sedang digunakan oleh entitas lain
   * @param id - ID feature yang akan dihapus
   * @throws ConflictError jika feature sedang digunakan
   */
  async validateFeatureCanBeDeleted(id: number): Promise<void> {
    // Pastikan feature ada terlebih dahulu
    await this.validateFeatureExists(id);

    // TODO: Implementasi pengecekan apakah feature sedang digunakan
    // Misalnya: cek di route_features, user_permissions, dll.
    // Untuk saat ini, kita asumsikan feature selalu bisa dihapus
    
    // Contoh implementasi jika ada relasi:
    // const isUsedInRoutes = await this.routeFeatureRepository.existsByFeatureId(id);
    // if (isUsedInRoutes) {
    //   throw errorUtils.conflict('Feature', 'id', id, 'Feature is currently being used in routes');
    // }
  }

  /**
   * Validasi parameter pagination
   * @param params - Parameter pagination
   * @returns ValidationResult - Hasil validasi
   */
  validatePaginationParams(params: { page: number; limit: number }): ValidationResult {
    const errors: string[] = [];

    if (!params.page || params.page < 1) {
      errors.push('Page harus berupa angka positif mulai dari 1');
    }

    if (!params.limit || params.limit < 1 || params.limit > 100) {
      errors.push('Limit harus berupa angka antara 1-100');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  /**
   * Validasi ID feature
   * @param id - ID yang akan divalidasi
   * @throws Error jika ID tidak valid
   */
  validateId(id: number): void {
    if (!id || typeof id !== 'number' || id < 1) {
      throw new Error('ID harus berupa angka positif');
    }
  }

  /**
   * Validasi parameter pencarian
   * @param params - Parameter pencarian
   * @throws Error jika parameter tidak valid
   */
  validateSearchParams(params: { keyword: string; page: number; limit: number }): void {
    if (!params.keyword || typeof params.keyword !== 'string' || params.keyword.trim().length === 0) {
      throw new Error('Keyword pencarian tidak boleh kosong');
    }

    const paginationResult = this.validatePaginationParams({ page: params.page, limit: params.limit });
    if (!paginationResult.isValid) {
      throw new Error(paginationResult.errors.join(', '));
    }
  }

  /**
   * Validasi query string untuk pencarian
   * @param query - Query string yang akan divalidasi
   * @returns string - Query yang sudah dibersihkan
   */
  validateSearchQuery(query: string): string {
    if (typeof query !== 'string') {
      throw new Error('Search query must be a string');
    }

    const cleanQuery = query.trim();
    
    if (cleanQuery.length === 0) {
      throw new Error('Search query cannot be empty');
    }

    if (cleanQuery.length < 2) {
      throw new Error('Search query must be at least 2 characters long');
    }

    if (cleanQuery.length > 100) {
      throw new Error('Search query cannot exceed 100 characters');
    }

    return cleanQuery;
  }

  /**
   * Validasi array ID untuk operasi bulk
   * @param ids - Array ID yang akan divalidasi
   * @returns number[] - Array ID yang sudah tervalidasi
   */
  validateBulkIds(ids: unknown): number[] {
    if (!Array.isArray(ids)) {
      throw new Error('IDs must be an array');
    }

    if (ids.length === 0) {
      throw new Error('IDs array cannot be empty');
    }

    if (ids.length > 50) {
      throw new Error('Cannot process more than 50 items at once');
    }

    const validIds: number[] = [];
    
    for (let i = 0; i < ids.length; i++) {
      const id = ids[i];
      
      if (!Number.isInteger(id) || id <= 0) {
        throw new Error(`Invalid ID at index ${i}: must be a positive integer`);
      }
      
      if (validIds.includes(id)) {
        throw new Error(`Duplicate ID found: ${id}`);
      }
      
      validIds.push(id);
    }

    return validIds;
  }

  /**
   * Validasi data untuk operasi bulk create
   * @param dataArray - Array data yang akan divalidasi
   * @returns Promise<FeatureCreateInput[]> - Array data yang sudah tervalidasi
   */
  async validateBulkCreateData(dataArray: unknown): Promise<FeatureCreateInput[]> {
    if (!Array.isArray(dataArray)) {
      throw new Error('Data must be an array');
    }

    if (dataArray.length === 0) {
      throw new Error('Data array cannot be empty');
    }

    if (dataArray.length > 20) {
      throw new Error('Cannot create more than 20 features at once');
    }

    const validatedData: FeatureCreateInput[] = [];
    const usedNames = new Set<string>();

    for (let i = 0; i < dataArray.length; i++) {
      const data = dataArray[i];
      
      // Validasi struktur data
      const validatedItem = this.validateCreateData(data);
      
      // Cek duplikasi nama dalam batch
      if (usedNames.has(validatedItem.name)) {
        throw new Error(`Duplicate feature name in batch: ${validatedItem.name}`);
      }
      
      usedNames.add(validatedItem.name);
      validatedData.push(validatedItem);
    }

    // Cek apakah ada nama yang sudah ada di database
    for (const item of validatedData) {
      await this.validateNameAvailability(item.name);
    }

    return validatedData;
  }
}

// Export instance dengan dependency injection
export const featureValidationService = new FeatureValidationService(
  new FeatureRepository('FeatureRepository')
);