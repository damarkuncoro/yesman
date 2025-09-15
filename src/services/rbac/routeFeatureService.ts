import { featureRepository, routeFeatureRepository } from "@/repositories";
import { type RouteFeature, type Feature } from "@/db/schema";
import { createRouteFeatureSchema, RBACError } from "./types";
import { z } from "zod";

/**
 * Service untuk manajemen route-feature mappings
 * Menangani operasi CRUD untuk mapping antara route dan feature
 */
export class RouteFeatureService {
  /**
   * Mengambil semua route-feature mappings
   * @returns Promise<RouteFeature[]> - Array semua route-feature mappings
   */
  async getAllRouteMappings(): Promise<RouteFeature[]> {
    return await routeFeatureRepository.findAll();
  }

  /**
   * Mengambil route-feature mapping berdasarkan ID
   * @param id - ID route-feature mapping
   * @returns Promise<RouteFeature | undefined> - RouteFeature jika ditemukan
   */
  async getRouteMappingById(id: number): Promise<RouteFeature | undefined> {
    return await routeFeatureRepository.findById(id);
  }

  /**
   * Membuat route-feature mapping baru
   * @param routeData - Data route-feature mapping
   * @returns Promise<RouteFeature> - RouteFeature yang baru dibuat
   * @throws RBACError jika feature tidak ditemukan atau mapping sudah ada
   */
  async createRouteMapping(routeData: z.infer<typeof createRouteFeatureSchema>): Promise<RouteFeature> {
    // Validasi input
    const validatedData = createRouteFeatureSchema.parse(routeData);
    
    // Cek apakah feature ada
    const feature = await featureRepository.findById(validatedData.featureId);
    if (!feature) {
      throw new RBACError(`Feature dengan ID ${validatedData.featureId} tidak ditemukan`);
    }
    
    // Cek apakah mapping sudah ada
    const existingMapping = await routeFeatureRepository.findByPathAndMethod(
      validatedData.path, 
      validatedData.method
    );
    if (existingMapping) {
      throw new RBACError(`Mapping untuk path '${validatedData.path}' dan method '${validatedData.method || 'ALL'}' sudah ada`);
    }

    return await routeFeatureRepository.create(validatedData);
  }

  /**
   * Update route-feature mapping
   * @param id - ID route-feature
   * @param routeData - Data yang akan diupdate
   * @returns Promise<RouteFeature> - RouteFeature yang sudah diupdate
   * @throws RBACError jika mapping tidak ditemukan
   */
  async updateRouteMapping(id: number, routeData: Partial<z.infer<typeof createRouteFeatureSchema>>): Promise<RouteFeature> {
    const updatedMapping = await routeFeatureRepository.update(id, routeData);
    if (!updatedMapping) {
      throw new RBACError(`Route mapping dengan ID ${id} tidak ditemukan`);
    }
    
    return updatedMapping;
  }

  /**
   * Hapus route-feature mapping
   * @param id - ID route-feature
   * @returns Promise<boolean> - true jika berhasil dihapus
   */
  async deleteRouteMapping(id: number): Promise<boolean> {
    return await routeFeatureRepository.delete(id);
  }

  /**
   * Mencari feature berdasarkan route path dan method
   * @param path - Path route
   * @param method - HTTP method
   * @returns Promise<Feature | null> - Feature jika ditemukan
   */
  async getFeatureByRoute(path: string, method?: string): Promise<Feature | null> {
    const routeMapping = await routeFeatureRepository.findByPathAndMethod(path, method);
    if (!routeMapping) {
      return null;
    }
    
    const feature = await featureRepository.findById(routeMapping.featureId);
    return feature || null;
  }
}

// Export instance untuk digunakan di aplikasi
export const routeFeatureService = new RouteFeatureService();