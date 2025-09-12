import { featureRepository, roleFeatureRepository } from "@/repositories";
import { 
  type Feature,
  type CreateFeatureInput,
  createFeatureSchema,
  FeatureNotFoundError,
  DuplicateFeatureError,
  RBACError
} from "./types";

/**
 * Service untuk manajemen Feature dalam sistem RBAC
 * Menangani business logic untuk operasi feature
 */
export class FeatureService {
  /**
   * Mengambil semua feature
   * @returns Promise<Feature[]> - Array semua feature
   */
  async getAllFeatures(): Promise<Feature[]> {
    return await featureRepository.findAll();
  }

  /**
   * Mengambil feature berdasarkan ID
   * @param id - ID feature
   * @returns Promise<Feature> - Feature yang ditemukan
   * @throws FeatureNotFoundError jika feature tidak ditemukan
   */
  async getFeatureById(id: number): Promise<Feature> {
    const feature = await featureRepository.findById(id);
    if (!feature) {
      throw new FeatureNotFoundError(id);
    }
    return feature;
  }

  /**
   * Membuat feature baru
   * @param featureData - Data feature yang akan dibuat
   * @returns Promise<Feature> - Feature yang baru dibuat
   * @throws DuplicateFeatureError jika nama feature sudah ada
   */
  async createFeature(featureData: CreateFeatureInput): Promise<Feature> {
    // Validasi input
    const validatedData = createFeatureSchema.parse(featureData);
    
    // Cek apakah nama feature sudah ada
    const existingFeature = await featureRepository.findByName(validatedData.name);
    if (existingFeature) {
      throw new DuplicateFeatureError(validatedData.name);
    }

    return await featureRepository.create(validatedData);
  }

  /**
   * Update feature
   * @param id - ID feature yang akan diupdate
   * @param featureData - Data feature yang akan diupdate
   * @returns Promise<Feature> - Feature yang sudah diupdate
   * @throws FeatureNotFoundError jika feature tidak ditemukan
   * @throws DuplicateFeatureError jika nama sudah ada
   */
  async updateFeature(id: number, featureData: Partial<CreateFeatureInput>): Promise<Feature> {
    // Cek apakah feature ada
    const existingFeature = await this.getFeatureById(id);
    
    // Jika mengupdate nama, cek apakah nama baru sudah ada
    if (featureData.name && featureData.name !== existingFeature.name) {
      const featureWithSameName = await featureRepository.findByName(featureData.name);
      if (featureWithSameName) {
        throw new DuplicateFeatureError(featureData.name);
      }
    }

    const updatedFeature = await featureRepository.update(id, featureData);
    if (!updatedFeature) {
      throw new RBACError(`Gagal mengupdate feature dengan ID ${id}`);
    }
    
    return updatedFeature;
  }

  /**
   * Hapus feature
   * @param id - ID feature yang akan dihapus
   * @returns Promise<boolean> - true jika berhasil dihapus
   * @throws FeatureNotFoundError jika feature tidak ditemukan
   * @throws RBACError jika feature masih digunakan
   */
  async deleteFeature(id: number): Promise<boolean> {
    // Cek apakah feature ada
    await this.getFeatureById(id);
    
    // Cek apakah feature masih digunakan dalam role permissions
    const rolePermissions = await roleFeatureRepository.findByFeatureId(id);
    if (rolePermissions.length > 0) {
      throw new RBACError(`Feature tidak dapat dihapus karena masih digunakan dalam ${rolePermissions.length} role permission`);
    }

    return await featureRepository.delete(id);
  }

  /**
   * Mencari feature berdasarkan nama
   * @param name - Nama feature
   * @returns Promise<Feature | undefined> - Feature yang ditemukan atau undefined
   */
  async findFeatureByName(name: string): Promise<Feature | undefined> {
    return await featureRepository.findByName(name);
  }

  /**
   * Mengecek apakah feature dengan nama tertentu sudah ada
   * @param name - Nama feature
   * @returns Promise<boolean> - true jika feature sudah ada
   */
  async featureExists(name: string): Promise<boolean> {
    const feature = await this.findFeatureByName(name);
    return feature !== undefined;
  }
}

// Export instance untuk digunakan di aplikasi
export const featureService = new FeatureService();