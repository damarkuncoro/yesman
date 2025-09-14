import { BaseCrudService } from "../base/baseService";
import { ValidationService } from "../../lib/validation/validator";
import { errorUtils } from "../../lib/errors/errorHandler";
import { FeatureRepository } from "../../repositories/feature/featureRepository";
import type { Feature } from "../../db/schema";
import type { FeatureCreateInput, FeatureUpdateInput } from "../../lib/validation/schemas";
import { featureCreateSchema, featureUpdateSchema } from "../../lib/validation/schemas";

/**
 * Service untuk operasi CRUD dasar pada Feature
 * Menerapkan Single Responsibility Principle untuk operasi Create, Read, Update, Delete
 */
export class FeatureCrudService extends BaseCrudService<Feature, FeatureCreateInput, FeatureUpdateInput> {
  constructor(private featureRepository: FeatureRepository) {
    super();
  }

  /**
   * Mendapatkan semua features
   * @returns Promise<Feature[]> - Array semua features
   */
  async getAll(): Promise<Feature[]> {
    return this.executeWithErrorHandling(
      'get all features',
      () => this.featureRepository.findAll()
    );
  }

  /**
   * Mendapatkan feature berdasarkan ID
   * @param id - ID feature yang dicari
   * @returns Promise<Feature | null> - Feature atau null jika tidak ditemukan
   */
  async getById(id: number): Promise<Feature | null> {
    const feature = await this.executeWithErrorHandling(
      'get feature by id',
      () => this.featureRepository.findById(id)
    );
    return feature || null;
  }

  /**
   * Mendapatkan feature berdasarkan ID dengan validasi exists
   * @param id - ID feature yang dicari
   * @returns Promise<Feature> - Feature yang ditemukan
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
   * Mendapatkan feature berdasarkan nama
   * @param name - Nama feature yang dicari
   * @returns Promise<Feature | null> - Feature atau null jika tidak ditemukan
   */
  async getByName(name: string): Promise<Feature | null> {
    const feature = await this.executeWithErrorHandling(
      'get feature by name',
      () => this.featureRepository.findByName(name)
    );
    return feature || null;
  }

  /**
   * Membuat feature baru
   * @param data - Data feature yang akan dibuat
   * @returns Promise<Feature> - Feature yang berhasil dibuat
   * @throws ValidationError jika data tidak valid
   * @throws ConflictError jika feature dengan nama yang sama sudah ada
   */
  async create(data: unknown): Promise<Feature> {
    // Validasi input
    const validatedData = ValidationService.validate(featureCreateSchema, data);

    // Check apakah feature dengan nama yang sama sudah ada
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
   * Mengupdate feature yang sudah ada
   * @param id - ID feature yang akan diupdate
   * @param data - Data yang akan diupdate
   * @returns Promise<Feature> - Feature yang berhasil diupdate
   * @throws ValidationError jika data tidak valid
   * @throws NotFoundError jika feature tidak ditemukan
   * @throws ConflictError jika nama sudah digunakan feature lain
   */
  async update(id: number, data: unknown): Promise<Feature> {
    // Validasi input
    const validatedData = ValidationService.validate(featureUpdateSchema, data);

    // Check apakah feature exists
    await this.getByIdOrThrow(id);

    // Jika ada perubahan nama, check conflict
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
   * Menghapus feature
   * @param id - ID feature yang akan dihapus
   * @returns Promise<boolean> - true jika berhasil dihapus
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
}

// Export instance dengan dependency injection
export const featureCrudService = new FeatureCrudService(
  new FeatureRepository('FeatureRepository')
);