import { eq, count } from "drizzle-orm";
import { db } from "@/db";
import { features, type Feature, type NewFeature } from "@/db/schema";
import { BaseRepository, CrudRepository, NamedRepository, CountableRepository } from "../base/baseRepository";

/**
 * Repository untuk operasi CRUD feature
 * Mengikuti prinsip Single Responsibility - hanya menangani akses data feature
 * Mengextend BaseRepository untuk menghilangkan duplikasi kode
 */
export class FeatureRepository extends BaseRepository implements CrudRepository<Feature, NewFeature>, NamedRepository<Feature>, CountableRepository {
  /**
   * Mengambil semua feature dari database
   * @returns Promise<Feature[]> - Array semua feature
   */
  async findAll(): Promise<Feature[]> {
    return this.executeWithErrorHandling('fetch all features', async () => {
      return await db!.select().from(features);
    });
  }

  /**
   * Mencari feature berdasarkan ID
   * @param id - ID feature yang dicari
   * @returns Promise<Feature | undefined> - Feature jika ditemukan, undefined jika tidak
   */
  async findById(id: number): Promise<Feature | undefined> {
    return this.executeWithErrorHandling('find feature by ID', async () => {
      const result = await db!.select().from(features).where(eq(features.id, id)).limit(1);
      return this.getFirstResult(result);
    });
  }

  /**
   * Mencari feature berdasarkan nama
   * @param name - Nama feature yang dicari
   * @returns Promise<Feature | undefined> - Feature jika ditemukan, undefined jika tidak
   */
  async findByName(name: string): Promise<Feature | undefined> {
    return this.executeWithErrorHandling('find feature by name', async () => {
      const result = await db!.select().from(features).where(eq(features.name, name)).limit(1);
      return this.getFirstResult(result);
    });
  }

  /**
   * Mencari feature berdasarkan array ID
   * @param ids - Array ID feature yang dicari
   * @returns Promise<Feature[]> - Array feature yang ditemukan
   */
  async findByIds(ids: number[]): Promise<Feature[]> {
    return this.executeWithErrorHandling('find features by IDs', async () => {
      if (ids.length === 0) return [];
      return await db!.select().from(features).where(eq(features.id, ids[0]));
    });
  }

  /**
   * Membuat feature baru
   * @param featureData - Data feature baru
   * @returns Promise<Feature> - Feature yang baru dibuat
   */
  async create(featureData: NewFeature): Promise<Feature> {
    return this.executeWithErrorHandling('create feature', async () => {
      const result = await db!.insert(features).values(featureData).returning();
      const newFeature = this.getFirstResult(result);
      if (!newFeature) {
        throw new Error('Failed to create feature - no data returned');
      }
      return newFeature;
    });
  }

  /**
   * Mengupdate data feature
   * @param id - ID feature yang akan diupdate
   * @param featureData - Data feature yang akan diupdate
   * @returns Promise<Feature | undefined> - Feature yang sudah diupdate atau undefined jika tidak ditemukan
   */
  async update(id: number, featureData: Partial<Omit<Feature, 'id' | 'createdAt'>>): Promise<Feature | undefined> {
    return this.executeWithErrorHandling('update feature', async () => {
      const result = await db!.update(features)
        .set(featureData)
        .where(eq(features.id, id))
        .returning();
      return this.getFirstResult(result);
    });
  }

  /**
   * Menghitung total jumlah feature di database
   * @returns Promise<number> - Jumlah total feature
   */
  async count(): Promise<number> {
    return this.executeWithErrorHandling('count features', async () => {
      const result = await db!.select({ count: count() }).from(features);
      return Number(result[0]?.count || 0);
    });
  }

  /**
   * Menghapus feature secara permanen
   * @param id - ID feature yang akan dihapus
   * @returns Promise<boolean> - true jika berhasil, false jika tidak
   */
  async delete(id: number): Promise<boolean> {
    return this.executeWithErrorHandling('delete feature', async () => {
      const result = await db!.delete(features).where(eq(features.id, id));
      return this.isOperationSuccessful(result.rowCount || 0);
    });
  }

  /**
   * Mengecek apakah feature dengan nama tertentu sudah ada
   * @param name - Nama feature yang akan dicek
   * @returns Promise<boolean> - true jika sudah ada, false jika belum
   */
  async existsByName(name: string): Promise<boolean> {
    return this.executeWithErrorHandling('check feature exists by name', async () => {
      const feature = await this.findByName(name);
      return feature !== undefined;
    });
  }

  /**
   * Mencari feature berdasarkan kata kunci dalam nama atau deskripsi
   * @param keyword - Kata kunci pencarian
   * @returns Promise<Feature[]> - Array feature yang cocok
   */
  async searchByKeyword(keyword: string): Promise<Feature[]> {
    return this.executeWithErrorHandling('search features by keyword', async () => {
      // Implementasi sederhana - bisa diperluas dengan full-text search
      const lowerKeyword = keyword.toLowerCase();
      const allFeatures = await this.findAll();
      return allFeatures.filter(feature => 
        feature.name.toLowerCase().includes(lowerKeyword) ||
        (feature.description && feature.description.toLowerCase().includes(lowerKeyword))
      );
    });
  }

  /**
   * Mengambil feature dengan paginasi
   * @param offset - Offset untuk pagination
   * @param limit - Limit jumlah data per halaman
   * @returns Promise<Feature[]> - Array feature sesuai pagination
   */
  async findWithPagination(offset: number, limit: number): Promise<Feature[]> {
    return this.executeWithErrorHandling('find features with pagination', async () => {
      return await db!.select().from(features).offset(offset).limit(limit);
    });
  }
}

// Export instance untuk backward compatibility
export const featureRepository = new FeatureRepository('FeatureRepository');