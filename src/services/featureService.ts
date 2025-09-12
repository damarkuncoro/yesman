import { BaseCrudService } from "./base/baseService";
import { ValidationService } from "../lib/validation/validator";
import { ErrorHandler, NotFoundError, ConflictError, errorUtils } from "../lib/errors/errorHandler";
import { FeatureRepository } from "../repositories/feature/featureRepository";
import type { Feature } from "../db/schema";
import type { FeatureCreateInput, FeatureUpdateInput } from "../lib/validation/schemas";
import { featureCreateSchema, featureUpdateSchema, paginationSchema, multipleIdsSchema } from "../lib/validation/schemas";

/**
 * Feature service yang mengextend BaseCrudService
 * Menerapkan Single Responsibility Principle untuk feature management
 */
export class FeatureService extends BaseCrudService<Feature, FeatureCreateInput, FeatureUpdateInput> {
  constructor(private featureRepository: FeatureRepository) {
    super();
  }

  /**
   * Get semua features
   * @returns Array of features
   */
  async getAll(): Promise<Feature[]> {
    return this.executeWithErrorHandling(
      'get all features',
      () => this.featureRepository.findAll()
    );
  }

  /**
   * Get feature by ID
   * @param id - Feature ID
   * @returns Feature atau null jika tidak ditemukan
   */
  async getById(id: number): Promise<Feature | null> {
    const feature = await this.executeWithErrorHandling(
      'get feature by id',
      () => this.featureRepository.findById(id)
    );
    return feature || null;
  }

  /**
   * Get feature by ID dengan validasi exists
   * @param id - Feature ID
   * @returns Feature
   * @throws NotFoundError jika feature tidak ditemukan
   */
  async getByIdOrThrow(id: number): Promise<Feature> {
    const feature = await this.getById(id);
    if (!feature) {
      throw errorUtils.notFound('Feature', id);
    }
    return feature;
  }

  /**
   * Get feature by name
   * @param name - Feature name
   * @returns Feature atau null jika tidak ditemukan
   */
  async getByName(name: string): Promise<Feature | null> {
    const feature = await this.executeWithErrorHandling(
      'get feature by name',
      () => this.featureRepository.findByName(name)
    );
    return feature || null;
  }

  /**
   * Create feature baru
   * @param data - Data feature yang akan dibuat
   * @returns Feature yang dibuat
   * @throws ValidationError jika data tidak valid
   * @throws ConflictError jika feature dengan name yang sama sudah ada
   */
  async create(data: unknown): Promise<Feature> {
    // Validasi input
    const validatedData = ValidationService.validate(featureCreateSchema, data);

    // Check apakah feature dengan name yang sama sudah ada
    const existingFeature = await this.getByName(validatedData.name);
    if (existingFeature) {
      throw errorUtils.conflict('Feature', 'name', validatedData.name);
    }

    return this.executeWithErrorHandling(
      'create feature',
      () => this.featureRepository.create(validatedData)
    );
  }

  /**
   * Update feature
   * @param id - Feature ID
   * @param data - Data yang akan diupdate
   * @returns Feature yang diupdate
   * @throws ValidationError jika data tidak valid
   * @throws NotFoundError jika feature tidak ditemukan
   * @throws ConflictError jika name sudah digunakan feature lain
   */
  async update(id: number, data: unknown): Promise<Feature> {
    // Validasi input
    const validatedData = ValidationService.validate(featureUpdateSchema, data);

    // Check apakah feature exists
    await this.getByIdOrThrow(id);

    // Jika ada perubahan name, check conflict
    if (validatedData.name) {
      const existingFeature = await this.getByName(validatedData.name);
      if (existingFeature && existingFeature.id !== id) {
        throw errorUtils.conflict('Feature', 'name', validatedData.name);
      }
    }

    const updatedFeature = await this.executeWithErrorHandling(
      'update feature',
      () => this.featureRepository.update(id, validatedData)
    );

    if (!updatedFeature) {
      throw errorUtils.notFound('Feature', id);
    }

    return updatedFeature;
  }

  /**
   * Delete feature
   * @param id - Feature ID
   * @returns true jika berhasil dihapus
   * @throws NotFoundError jika feature tidak ditemukan
   */
  async delete(id: number): Promise<boolean> {
    // Check apakah feature exists
    await this.getByIdOrThrow(id);

    return this.executeWithErrorHandling(
      'delete feature',
      () => this.featureRepository.delete(id)
    );
  }

  /**
   * Get features dengan pagination
   * @param page - Page number
   * @param limit - Items per page
   * @returns Paginated features
   */
  async getPaginated(page: number = 1, limit: number = 10): Promise<{
    data: Feature[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }> {
    // Validasi pagination parameters
    const paginationData = ValidationService.validate(paginationSchema, { page, limit });

    return this.executeWithErrorHandling(
      'get paginated features',
      async () => {
        const offset = (paginationData.page - 1) * paginationData.limit;
        const [data, total] = await Promise.all([
          this.featureRepository.findWithPagination(paginationData.limit, offset),
          this.featureRepository.count()
        ]);

        return {
          data,
          total,
          page: paginationData.page,
          limit: paginationData.limit,
          totalPages: Math.ceil(total / paginationData.limit)
        };
      }
    );
  }

  /**
   * Search features by keyword
   * @param query - Search query
   * @returns Search results
   */
  async search(query: string): Promise<Feature[]> {
    return this.executeWithErrorHandling(
      'search features',
      () => this.featureRepository.searchByKeyword(query)
    );
  }



  /**
   * Check apakah feature name sudah digunakan
   * @param name - Feature name
   * @param excludeId - ID feature yang dikecualikan (untuk update)
   * @returns true jika name sudah digunakan
   */
  async isNameTaken(name: string, excludeId?: number): Promise<boolean> {
    return this.executeWithErrorHandling(
      'check if name is taken',
      async () => {
        const exists = await this.featureRepository.existsByName(name);
        if (!exists) return false;
        
        if (excludeId) {
          const existingFeature = await this.getByName(name);
          return existingFeature !== null && existingFeature.id !== excludeId;
        }
        
        return exists;
      }
    );
  }



  /**
   * Bulk create features
   * @param featuresData - Array of feature data
   * @returns Array of created features
   */
  async bulkCreate(featuresData: unknown[]): Promise<Feature[]> {
    // Validasi semua input
    const validatedFeatures = featuresData.map(data => ValidationService.validate(featureCreateSchema, data));

    // Check duplicate names dalam batch
    const names = validatedFeatures.map(feature => feature.name);
    const duplicateNames = names.filter((name, index) => names.indexOf(name) !== index);
    if (duplicateNames.length > 0) {
      throw errorUtils.validation(
        `Duplicate feature names in batch: ${duplicateNames.join(', ')}`
      );
    }

    // Check existing features
    const existingFeatures = await Promise.all(
      names.map(name => this.getByName(name))
    );
    const existingNames = existingFeatures
      .filter((feature: Feature | null) => feature !== null)
      .map((feature: Feature | null) => feature!.name);
    
    if (existingNames.length > 0) {
      throw errorUtils.conflict(
        'Feature',
        'names',
        existingNames.join(', ')
      );
    }

    // Create features satu per satu karena tidak ada bulk create di repository
    const createdFeatures: Feature[] = [];
    for (const featureData of validatedFeatures) {
      const created = await this.create(featureData);
      createdFeatures.push(created);
    }

    return createdFeatures;
  }

  /**
   * Bulk delete features
   * @param ids - Array of feature IDs
   * @returns Number of deleted features
   */
  async bulkDelete(ids: number[]): Promise<number> {
    // Validasi IDs
    const validatedData = ValidationService.validate(multipleIdsSchema, { ids });

    // Check apakah semua features exist
    const features = await Promise.all(
      validatedData.ids.map((id: number) => this.getById(id))
    );
    const notFoundIds = validatedData.ids.filter((id: number, index: number) => features[index] === null);
    
    if (notFoundIds.length > 0) {
      throw errorUtils.notFound(
        'Features',
        notFoundIds.join(', ')
      );
    }

    // Delete features satu per satu karena tidak ada bulk delete di repository
    let deletedCount = 0;
    for (const id of validatedData.ids) {
      const deleted = await this.delete(id);
      if (deleted) deletedCount++;
    }

    return deletedCount;
  }


}