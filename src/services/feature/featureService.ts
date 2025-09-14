import { featureCrudService } from './featureCrudService';
import { featureSearchService } from './featureSearchService';
import { featureValidationService } from './featureValidationService';
import { featureBulkService } from './featureBulkService';
import type { Feature, NewFeature } from '../../db/schema';
import type { PaginatedResponse } from '../../lib/types';

/**
 * Service orchestrator untuk menggabungkan semua feature services
 * Mengimplementasikan facade pattern untuk menyediakan interface tunggal
 * ke semua operasi feature yang tersedia
 */
export class FeatureService {
  private crudService = featureCrudService;
  private searchService = featureSearchService;
  private validationService = featureValidationService;
  private bulkService = featureBulkService;

  // ===== CRUD Operations =====
  
  /**
   * Mendapatkan semua features
   * @returns Promise<Feature[]> - Array semua features
   */
  async getAll(): Promise<Feature[]> {
    return this.crudService.getAll();
  }

  /**
   * Mendapatkan feature berdasarkan ID
   * @param id - ID feature yang dicari
   * @returns Promise<Feature | null> - Feature yang ditemukan atau null
   */
  async getById(id: number): Promise<Feature | null> {
    return this.crudService.getById(id);
  }

  /**
   * Mendapatkan feature berdasarkan nama
   * @param name - Nama feature yang dicari
   * @returns Promise<Feature | null> - Feature yang ditemukan atau null
   */
  async getByName(name: string): Promise<Feature | null> {
    return this.crudService.getByName(name);
  }

  /**
   * Membuat feature baru
   * @param data - Data feature baru
   * @returns Promise<Feature> - Feature yang berhasil dibuat
   */
  async create(data: NewFeature): Promise<Feature> {
    // Validasi sebelum create
    this.validationService.validateCreateData(data);
    
    // Cek apakah nama sudah digunakan
    const nameExists = await this.searchService.existsByName(data.name);
    if (nameExists) {
      throw new Error(`Feature dengan nama '${data.name}' sudah ada`);
    }

    return this.crudService.create(data);
  }

  /**
   * Update feature berdasarkan ID
   * @param id - ID feature yang akan diupdate
   * @param data - Data update
   * @returns Promise<Feature | null> - Feature yang berhasil diupdate atau null
   */
  async update(id: number, data: Partial<Omit<Feature, 'id' | 'createdAt'>>): Promise<Feature | null> {
    // Validasi sebelum update
    this.validationService.validateUpdateData(data);
    this.validationService.validateId(id);
    
    // Jika ada perubahan nama, cek apakah nama baru sudah digunakan
    if (data.name) {
      const existingFeature = await this.getByName(data.name);
      if (existingFeature && existingFeature.id !== id) {
        throw new Error(`Feature dengan nama '${data.name}' sudah ada`);
      }
    }

    return this.crudService.update(id, data);
  }

  /**
   * Hapus feature berdasarkan ID
   * @param id - ID feature yang akan dihapus
   * @returns Promise<boolean> - true jika berhasil dihapus
   */
  async delete(id: number): Promise<boolean> {
    this.validationService.validateId(id);
    return this.crudService.delete(id);
  }

  // ===== Search & Query Operations =====

  /**
   * Mendapatkan features dengan pagination
   * @param page - Nomor halaman (mulai dari 1)
   * @param limit - Jumlah item per halaman
   * @returns Promise<PaginatedResponse<Feature>> - Data features dengan pagination
   */
  async getPaginated(page: number = 1, limit: number = 10): Promise<PaginatedResponse<Feature>> {
    const validationResult = this.validationService.validatePaginationParams({ page, limit });
    if (!validationResult.isValid) {
      throw new Error(validationResult.errors.join(', '));
    }
    
    const result = await this.searchService.getPaginated(page, limit);
    
    // Transform ke format PaginatedResponse
    return {
      data: result.data,
      meta: result.pagination,
      success: true
    };
  }

  /**
   * Mencari features berdasarkan keyword
   * @param keyword - Kata kunci pencarian
   * @param page - Nomor halaman (default: 1)
   * @param limit - Jumlah item per halaman (default: 10)
   * @returns Promise<PaginatedResponse<Feature>> - Hasil pencarian dengan pagination
   */
  async search(keyword: string, page: number = 1, limit: number = 10): Promise<PaginatedResponse<Feature>> {
    this.validationService.validateSearchParams({ keyword, page, limit });
    
    const result = await this.searchService.search(keyword, page, limit);
    
    // Transform ke format PaginatedResponse
    return {
      data: result.data,
      meta: result.pagination,
      success: true
    };
  }

  /**
   * Cek apakah nama feature sudah digunakan
   * @param name - Nama yang akan dicek
   * @param excludeId - ID yang dikecualikan dari pengecekan (untuk update)
   * @returns Promise<boolean> - true jika nama sudah digunakan
   */
  async isNameTaken(name: string, excludeId?: number): Promise<boolean> {
    const existingFeature = await this.getByName(name);
    if (!existingFeature) return false;
    
    // Jika ada excludeId, cek apakah feature yang ditemukan bukan yang dikecualikan
    if (excludeId && existingFeature.id === excludeId) {
      return false;
    }
    
    return true;
  }

  // ===== Bulk Operations =====

  /**
   * Membuat beberapa features sekaligus
   * @param features - Array data features yang akan dibuat
   * @returns Promise dengan hasil operasi bulk
   */
  async bulkCreate(features: NewFeature[]) {
    // Validasi bulk data
    this.validationService.validateBulkCreateData(features);
    
    return this.bulkService.bulkCreate(features);
  }

  /**
   * Hapus beberapa features sekaligus berdasarkan ID
   * @param ids - Array ID features yang akan dihapus
   * @returns Promise dengan hasil operasi bulk
   */
  async bulkDelete(ids: number[]) {
    this.validationService.validateBulkIds(ids);
    
    return this.bulkService.bulkDelete(ids);
  }

  /**
   * Mendapatkan beberapa features sekaligus berdasarkan ID
   * @param ids - Array ID features yang dicari
   * @returns Promise dengan hasil operasi bulk
   */
  async bulkGet(ids: number[]) {
    this.validationService.validateBulkIds(ids);
    
    return this.bulkService.bulkGet(ids);
  }

  /**
   * Cek ketersediaan nama untuk beberapa features sekaligus
   * @param names - Array nama yang akan dicek
   * @returns Promise dengan hasil pengecekan
   */
  async bulkCheckNameAvailability(names: string[]) {
    if (!Array.isArray(names) || names.length === 0) {
      throw new Error('Names array tidak boleh kosong');
    }
    
    return this.bulkService.bulkCheckNameAvailability(names);
  }

  /**
   * Update description beberapa features sekaligus
   * @param updates - Array object dengan id dan description baru
   * @returns Promise dengan hasil operasi bulk
   */
  async bulkUpdateDescription(updates: Array<{ id: number; description?: string }>) {
    if (!Array.isArray(updates) || updates.length === 0) {
      throw new Error('Updates array tidak boleh kosong');
    }
    
    return this.bulkService.bulkUpdateDescription(updates);
  }
}

// Export instance untuk digunakan di aplikasi
export const featureService = new FeatureService();