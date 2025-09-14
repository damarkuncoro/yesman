import { BaseService } from "../base/baseService";
import { FeatureRepository } from "../../repositories/feature/featureRepository";
import type { Feature } from "../../db/schema";
import type { PaginationMeta } from "../../lib/types";

/**
 * Service untuk operasi pencarian dan query pada Feature
 * Menerapkan Single Responsibility Principle untuk operasi search dan pagination
 */
export class FeatureSearchService extends BaseService {
  constructor(private featureRepository: FeatureRepository) {
    super();
  }

  /**
   * Mendapatkan features dengan pagination
   * @param page - Nomor halaman (mulai dari 1)
   * @param limit - Jumlah item per halaman
   * @returns Promise<{data: Feature[], pagination: PaginationMeta}> - Hasil dengan pagination
   */
  async getPaginated(page: number = 1, limit: number = 10): Promise<{
    data: Feature[];
    pagination: PaginationMeta;
  }> {
    return this.executeWithErrorHandling(
      'get paginated features',
      async () => {
        const offset = (page - 1) * limit;
        const [data, total] = await Promise.all([
          this.featureRepository.findWithPagination(offset, limit),
          this.featureRepository.count()
        ]);

        const totalPages = Math.ceil(total / limit);
        
        return {
          data,
          pagination: {
            page,
            limit,
            total,
            totalPages,
            hasNext: page < totalPages,
            hasPrev: page > 1
          }
        };
      }
    );
  }

  /**
   * Mencari features berdasarkan query string
   * @param query - String pencarian
   * @param page - Nomor halaman (opsional)
   * @param limit - Jumlah item per halaman (opsional)
   * @returns Promise<{data: Feature[], pagination: PaginationMeta}> - Hasil pencarian dengan pagination
   */
  async search(query: string, page: number = 1, limit: number = 10): Promise<{
    data: Feature[];
    pagination: PaginationMeta;
  }> {
    if (!query || query.trim().length === 0) {
      // Jika query kosong, return hasil kosong
      return {
        data: [],
        pagination: {
          page,
          limit,
          total: 0,
          totalPages: 0,
          hasNext: false,
          hasPrev: false
        }
      };
    }

    return this.executeWithErrorHandling(
      'search features',
      async () => {
        const searchResults = await this.featureRepository.searchByKeyword(query.trim());
        const total = searchResults.length;
        const offset = (page - 1) * limit;
        const data = searchResults.slice(offset, offset + limit);
        const totalPages = Math.ceil(total / limit);

        return {
          data,
          pagination: {
            page,
            limit,
            total,
            totalPages,
            hasNext: page < totalPages,
            hasPrev: page > 1
          }
        };
      }
    );
  }

  /**
   * Mencari features berdasarkan nama (exact match)
   * @param name - Nama feature yang dicari
   * @returns Promise<Feature | null> - Feature yang cocok atau null
   */
  async searchByName(name: string): Promise<Feature | null> {
    if (!name || name.trim().length === 0) {
      return null;
    }

    const feature = await this.executeWithErrorHandling(
      'search features by name',
      () => this.featureRepository.findByName(name.trim())
    );
    
    return feature || null;
  }

  /**
   * Mencari features berdasarkan keyword
   * @param keyword - Keyword yang dicari
   * @returns Promise<Feature[]> - Array features yang cocok
   */
  async searchByKeyword(keyword: string): Promise<Feature[]> {
    if (!keyword || keyword.trim().length === 0) {
      return [];
    }

    return this.executeWithErrorHandling(
      'search features by keyword',
      () => this.featureRepository.searchByKeyword(keyword.trim())
    );
  }

  /**
   * Mendapatkan jumlah total features
   * @returns Promise<number> - Total jumlah features
   */
  async getTotalCount(): Promise<number> {
    return this.executeWithErrorHandling(
      'get total feature count',
      () => this.featureRepository.count()
    );
  }

  /**
   * Mengecek apakah feature dengan nama tertentu sudah ada
   * @param name - Nama feature yang dicek
   * @returns Promise<boolean> - true jika sudah ada, false jika belum
   */
  async existsByName(name: string): Promise<boolean> {
    if (!name || name.trim().length === 0) {
      return false;
    }

    return this.executeWithErrorHandling(
      'check feature exists by name',
      () => this.featureRepository.existsByName(name.trim())
    );
  }
}

// Export instance dengan dependency injection
export const featureSearchService = new FeatureSearchService(
  new FeatureRepository('FeatureRepository')
);