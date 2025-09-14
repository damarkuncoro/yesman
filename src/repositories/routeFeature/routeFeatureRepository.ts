import { eq, and, count, like } from "drizzle-orm";
import { db } from "@/db";
import { routeFeatures, features, type RouteFeature, type NewRouteFeature } from "@/db/schema";
import { BaseRepository, CrudRepository, CountableRepository } from "../base/baseRepository";

/**
 * Repository untuk operasi CRUD route feature (mapping route ke feature)
 * Mengikuti prinsip Single Responsibility - hanya menangani akses data route feature
 * Mengextend BaseRepository untuk menghilangkan duplikasi kode
 */
export class RouteFeatureRepository extends BaseRepository implements CrudRepository<RouteFeature, NewRouteFeature>, CountableRepository {
  /**
   * Mengambil semua route feature dari database
   * @returns Promise<RouteFeature[]> - Array semua route feature
   */
  async findAll(): Promise<RouteFeature[]> {
    return this.executeWithErrorHandling('fetch all route features', async () => {
      return await db!.select().from(routeFeatures);
    });
  }

  /**
   * Mengambil semua route feature dengan informasi feature (join)
   * @returns Promise<Array> - Array route feature dengan nama feature
   */
  async findAllWithFeatures(): Promise<Array<RouteFeature & { feature: { name: string } | null }>> {
    return this.executeWithErrorHandling('fetch all route features with features', async () => {
      return await db!.select({
        id: routeFeatures.id,
        path: routeFeatures.path,
        method: routeFeatures.method,
        featureId: routeFeatures.featureId,
        feature: {
          name: features.name
        }
      })
      .from(routeFeatures)
      .leftJoin(features, eq(routeFeatures.featureId, features.id));
    });
  }

  /**
   * Mencari route feature berdasarkan ID
   * @param id - ID route feature yang dicari
   * @returns Promise<RouteFeature | undefined> - RouteFeature jika ditemukan, undefined jika tidak
   */
  async findById(id: number): Promise<RouteFeature | undefined> {
    return this.executeWithErrorHandling('find route feature by ID', async () => {
      const result = await db!.select().from(routeFeatures).where(eq(routeFeatures.id, id)).limit(1);
      return this.getFirstResult(result);
    });
  }

  /**
   * Mencari route feature berdasarkan feature ID
   * @param featureId - ID feature yang dicari
   * @returns Promise<RouteFeature[]> - Array route feature dengan feature tertentu
   */
  async findByFeatureId(featureId: number): Promise<RouteFeature[]> {
    return this.executeWithErrorHandling('find route features by feature ID', async () => {
      return await db!.select().from(routeFeatures).where(eq(routeFeatures.featureId, featureId));
    });
  }

  /**
   * Mencari route feature berdasarkan path
   * @param path - Path yang dicari
   * @returns Promise<RouteFeature[]> - Array route feature dengan path tertentu
   */
  async findByPath(path: string): Promise<RouteFeature[]> {
    return this.executeWithErrorHandling('find route features by path', async () => {
      return await db!.select().from(routeFeatures).where(eq(routeFeatures.path, path));
    });
  }

  /**
   * Mencari route feature berdasarkan path pattern (menggunakan LIKE)
   * @param pathPattern - Pattern path yang dicari (bisa menggunakan % untuk wildcard)
   * @returns Promise<RouteFeature[]> - Array route feature yang cocok dengan pattern
   */
  async findByPathPattern(pathPattern: string): Promise<RouteFeature[]> {
    return this.executeWithErrorHandling('find route features by path pattern', async () => {
      return await db!.select().from(routeFeatures).where(like(routeFeatures.path, pathPattern));
    });
  }

  /**
   * Mencari route feature berdasarkan method
   * @param method - HTTP method yang dicari (GET, POST, PUT, DELETE, dll)
   * @returns Promise<RouteFeature[]> - Array route feature dengan method tertentu
   */
  async findByMethod(method: string): Promise<RouteFeature[]> {
    return this.executeWithErrorHandling('find route features by method', async () => {
      return await db!.select().from(routeFeatures).where(eq(routeFeatures.method, method));
    });
  }

  /**
   * Mencari route feature berdasarkan path dan method
   * @param path - Path yang dicari
   * @param method - HTTP method yang dicari
   * @returns Promise<RouteFeature | undefined> - RouteFeature jika ditemukan, undefined jika tidak
   */
  async findByPathAndMethod(path: string, method?: string): Promise<RouteFeature | undefined> {
    return this.executeWithErrorHandling('find route feature by path and method', async () => {
      if (method) {
        const result = await db!.select().from(routeFeatures)
          .where(and(eq(routeFeatures.path, path), eq(routeFeatures.method, method)))
          .limit(1);
        return this.getFirstResult(result);
      } else {
        const result = await db!.select().from(routeFeatures)
          .where(eq(routeFeatures.path, path))
          .limit(1);
        return this.getFirstResult(result);
      }
    });
  }

  /**
   * Membuat route feature baru
   * @param routeFeatureData - Data route feature baru
   * @returns Promise<RouteFeature> - RouteFeature yang baru dibuat
   */
  async create(routeFeatureData: NewRouteFeature): Promise<RouteFeature> {
    return this.executeWithErrorHandling('create route feature', async () => {
      const result = await db!.insert(routeFeatures).values(routeFeatureData).returning();
      const newRouteFeature = this.getFirstResult(result);
      if (!newRouteFeature) {
        throw new Error('Failed to create route feature - no data returned');
      }
      return newRouteFeature;
    });
  }

  /**
   * Mengupdate data route feature
   * @param id - ID route feature yang akan diupdate
   * @param routeFeatureData - Data route feature yang akan diupdate
   * @returns Promise<RouteFeature | undefined> - RouteFeature yang sudah diupdate atau undefined jika tidak ditemukan
   */
  async update(id: number, routeFeatureData: Partial<Omit<RouteFeature, 'id'>>): Promise<RouteFeature | undefined> {
    return this.executeWithErrorHandling('update route feature', async () => {
      const result = await db!.update(routeFeatures)
        .set(routeFeatureData)
        .where(eq(routeFeatures.id, id))
        .returning();
      return this.getFirstResult(result);
    });
  }

  /**
   * Menghitung total jumlah route feature di database
   * @returns Promise<number> - Jumlah total route feature
   */
  async count(): Promise<number> {
    return this.executeWithErrorHandling('count route features', async () => {
      const result = await db!.select({ count: count() }).from(routeFeatures);
      return Number(result[0]?.count || 0);
    });
  }

  /**
   * Menghapus route feature berdasarkan ID
   * @param id - ID route feature yang akan dihapus
   * @returns Promise<boolean> - true jika berhasil, false jika tidak
   */
  async delete(id: number): Promise<boolean> {
    return this.executeWithErrorHandling('delete route feature', async () => {
      const result = await db!.delete(routeFeatures).where(eq(routeFeatures.id, id));
      return this.isOperationSuccessful(result.rowCount || 0);
    });
  }

  /**
   * Menghapus route feature berdasarkan path dan method
   * @param path - Path yang akan dihapus
   * @param method - HTTP method (optional)
   * @returns Promise<number> - Jumlah route feature yang dihapus
   */
  async deleteByPathAndMethod(path: string, method?: string): Promise<number> {
    return this.executeWithErrorHandling('delete route feature by path and method', async () => {
      if (method) {
        const result = await db!.delete(routeFeatures)
          .where(and(eq(routeFeatures.path, path), eq(routeFeatures.method, method)));
        return result.rowCount || 0;
      } else {
        const result = await db!.delete(routeFeatures)
          .where(eq(routeFeatures.path, path));
        return result.rowCount || 0;
      }
    });
  }

  /**
   * Menghapus semua route feature dari feature tertentu
   * @param featureId - ID feature yang route-nya akan dihapus
   * @returns Promise<number> - Jumlah route feature yang dihapus
   */
  async deleteByFeatureId(featureId: number): Promise<number> {
    return this.executeWithErrorHandling('delete route features by feature ID', async () => {
      const result = await db!.delete(routeFeatures).where(eq(routeFeatures.featureId, featureId));
      return result.rowCount || 0;
    });
  }

  /**
   * Menghitung jumlah route feature berdasarkan feature ID
   * @param featureId - ID feature
   * @returns Promise<number> - Jumlah route feature untuk feature tersebut
   */
  async countByFeatureId(featureId: number): Promise<number> {
    return this.executeWithErrorHandling('count route features by feature ID', async () => {
      const result = await db!.select({ count: count() }).from(routeFeatures)
        .where(eq(routeFeatures.featureId, featureId));
      return Number(result[0]?.count || 0);
    });
  }

  /**
   * Menghitung jumlah route feature berdasarkan method
   * @param method - HTTP method
   * @returns Promise<number> - Jumlah route feature dengan method tersebut
   */
  async countByMethod(method: string): Promise<number> {
    return this.executeWithErrorHandling('count route features by method', async () => {
      const result = await db!.select({ count: count() }).from(routeFeatures)
        .where(eq(routeFeatures.method, method));
      return Number(result[0]?.count || 0);
    });
  }

  /**
   * Batch create multiple route features
   * @param routeFeatureDataArray - Array data route feature yang akan dibuat
   * @returns Promise<RouteFeature[]> - Array RouteFeature yang baru dibuat
   */
  async createMany(routeFeatureDataArray: NewRouteFeature[]): Promise<RouteFeature[]> {
    return this.executeWithErrorHandling('create multiple route features', async () => {
      const result = await db!.insert(routeFeatures).values(routeFeatureDataArray).returning();
      return result;
    });
  }

  /**
   * Mencari route feature yang cocok dengan path menggunakan pattern matching
   * Berguna untuk route matching dalam aplikasi dengan dynamic routes
   * @param requestPath - Path request yang akan dicocokkan (contoh: /api/rbac/user-permissions/20)
   * @param method - HTTP method (optional)
   * @returns Promise<RouteFeature[]> - Array route feature yang cocok
   */
  async findMatchingRoutes(requestPath: string, method?: string): Promise<RouteFeature[]> {
    return this.executeWithErrorHandling('find matching routes', async () => {
      // Pertama coba exact match
      let routes = await this.findByPathAndMethod(requestPath, method);
      if (routes) {
        return [routes];
      }

      // Jika tidak ada exact match, coba pattern matching untuk dynamic routes
      const allRoutes = method 
        ? await db!.select().from(routeFeatures).where(eq(routeFeatures.method, method))
        : await db!.select().from(routeFeatures);

      // Filter routes yang cocok dengan pattern
      const matchingRoutes = allRoutes.filter(route => {
        return this.matchesRoutePattern(route.path, requestPath);
      });

      return matchingRoutes;
    });
  }

  /**
   * Mengecek apakah request path cocok dengan route pattern
   * @param routePattern - Pattern route dari database (contoh: /api/rbac/user-permissions/:id)
   * @param requestPath - Path request yang akan dicocokkan (contoh: /api/rbac/user-permissions/20)
   * @returns boolean - true jika cocok
   */
  private matchesRoutePattern(routePattern: string, requestPath: string): boolean {
    // Konversi pattern menjadi regex
    // :id, :userId, dll menjadi [^/]+ (match any character except slash)
    const regexPattern = routePattern
      .replace(/:[^/]+/g, '[^/]+') // Replace :id, :userId, etc dengan [^/]+
      .replace(/\//g, '\\/'); // Escape forward slashes
    
    const regex = new RegExp(`^${regexPattern}$`);
    return regex.test(requestPath);
  }

  /**
   * Mengecek apakah route sudah terdaftar
   * @param path - Path yang akan dicek
   * @param method - HTTP method (optional)
   * @returns Promise<boolean> - true jika route sudah terdaftar, false jika belum
   */
  async routeExists(path: string, method?: string): Promise<boolean> {
    return this.executeWithErrorHandling('check route exists', async () => {
      const routeFeature = await this.findByPathAndMethod(path, method);
      return routeFeature !== undefined;
    });
  }
}

// Export instance untuk backward compatibility
export const routeFeatureRepository = new RouteFeatureRepository('RouteFeatureRepository');