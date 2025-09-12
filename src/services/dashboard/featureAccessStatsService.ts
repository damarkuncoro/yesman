import { featureRepository } from "@/repositories";
import { FeatureAccessStats } from "./types";

/**
 * Service untuk mengelola statistik akses feature
 */
export class FeatureAccessStatsService {
  /**
   * Mengambil statistik akses feature (mock data untuk sekarang)
   * @returns Promise<FeatureAccessStats[]> - Array statistik akses feature
   */
  async getFeatureAccessStats(): Promise<FeatureAccessStats[]> {
    try {
      // Ambil semua features
      const allFeatures = await featureRepository.findAll();
      
      // Mock data untuk access stats - nanti bisa diganti dengan data real dari audit log
      const featureAccessStats: FeatureAccessStats[] = allFeatures.map((feature, index) => {
        const accessCount = Math.floor(Math.random() * 1000) + 50;
        const totalAccess = allFeatures.reduce((sum, _, i) => sum + (Math.floor(Math.random() * 1000) + 50), 0);
        const percentage = (accessCount / totalAccess) * 100;
        
        // Mock last accessed date
        const lastAccessed = new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000).toISOString();

        return {
          featureName: feature.name,
          accessCount,
          percentage: Math.round(percentage * 10) / 10,
          lastAccessed
        };
      });

      return featureAccessStats.sort((a, b) => b.accessCount - a.accessCount);
    } catch (error) {
      console.error('Error fetching feature access stats:', error);
      throw new Error('Gagal mengambil statistik akses feature');
    }
  }
}

// Export instance
export const featureAccessStatsService = new FeatureAccessStatsService();