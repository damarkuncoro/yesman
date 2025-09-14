import { RouteScanner, DiscoveredRoute } from "./routeScanner";
import { routeFeatureRepository, featureRepository } from "@/repositories";
import { type NewRouteFeature } from "@/db/schema";

export interface DiscoveryResult {
  discovered: DiscoveredRoute[];
  registered: number;
  skipped: number;
  errors: string[];
}

class DiscoveryError extends Error {
  constructor(public route: string, public method: string, cause: unknown) {
    super(`Failed to register ${method} ${route}: ${String(cause)}`);
    this.name = "DiscoveryError";
  }
}

export class RouteDiscoveryService {
  private readonly scanner: RouteScanner;

  constructor(scanner?: RouteScanner) {
    this.scanner = scanner || new RouteScanner();
  }

  async runFullDiscovery(): Promise<DiscoveryResult> {
    console.log("🔍 Memulai auto-discovery route API...");

    const discoveredRoutes = await this.scanner.discoverRoutes();
    
    console.log(`📋 Ditemukan ${discoveredRoutes.length} route`);

    const result = await this.registerDiscoveredRoutes(discoveredRoutes);

    console.log(
      `✅ Registrasi selesai: ${result.registered} terdaftar, ${result.skipped} dilewati`
    );
    if (result.errors.length > 0) {
      console.log(`❌ ${result.errors.length} error terjadi`);
    }

    return result;
  }

  private async registerDiscoveredRoutes(
    routes: DiscoveredRoute[]
  ): Promise<DiscoveryResult> {
    const result: DiscoveryResult = {
      discovered: routes,
      registered: 0,
      skipped: 0,
      errors: [],
    };

    for (const route of routes) {
      try {
        const existingRoute =
          await routeFeatureRepository.findByPathAndMethod(
            route.path,
            route.method
          );

        if (existingRoute) {
          result.skipped++;
          continue;
        }

        let feature = await featureRepository.findByName(route.feature!);
        if (!feature) {
          feature = await featureRepository.create({
            name: route.feature!,
            description: `Auto-generated feature for ${route.feature} functionality`,
          });
        }

        const newRouteFeature: NewRouteFeature = {
          path: route.path,
          method: route.method,
          featureId: feature.id,
        };

        await routeFeatureRepository.create(newRouteFeature);
        result.registered++;
      } catch (err) {
        const error = new DiscoveryError(route.path, route.method, err);
        result.errors.push(error.message);
        console.error(error);
      }
    }

    return result;
  }

  /**
   * Mendapatkan semua routes yang telah terdaftar di database
   * @returns Promise<DiscoveredRoute[]> - Array routes yang terdaftar
   */
  async getAllRoutes(): Promise<DiscoveredRoute[]> {
    try {
      const registeredRoutes = await routeFeatureRepository.findAllWithFeatures();
      return registeredRoutes.map(route => ({
        path: route.path,
        method: route.method || 'GET', // Default ke GET jika null
        filePath: '', // Tidak tersedia dari database
        feature: route.feature?.name
      }));
    } catch (error) {
      console.error('Error getting all routes:', error);
      return [];
    }
  }

  /**
   * Mendapatkan routes yang ditemukan dari scanning filesystem
   * @returns Promise<DiscoveredRoute[]> - Array routes yang ditemukan
   */
  async getDiscoveredRoutes(): Promise<DiscoveredRoute[]> {
    return await this.scanner.discoverRoutes();
  }
}

// Export instance siap pakai
export const routeDiscoveryService = new RouteDiscoveryService();
