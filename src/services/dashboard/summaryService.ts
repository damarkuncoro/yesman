import { userRepository, roleRepository, featureRepository } from "@/repositories";
import { DashboardSummary } from "./types";

/**
 * Service untuk mengelola statistik ringkasan dashboard
 */
export class SummaryService {
  /**
   * Mengambil ringkasan statistik dashboard
   * @returns Promise<DashboardSummary> - Data ringkasan dashboard
   */
  async getDashboardSummary(): Promise<DashboardSummary> {
    try {
      const [totalUsers, totalRoles, totalFeatures] = await Promise.all([
        userRepository.count(),
        roleRepository.count(),
        featureRepository.count()
      ]);

      // Hitung active users dari semua users
      const allUsers = await userRepository.findAll();
      const activeUsers = allUsers.filter(user => user.active).length;
      const inactiveUsers = totalUsers - activeUsers;

      return {
        totalUsers,
        totalRoles,
        totalFeatures,
        activeUsers,
        inactiveUsers
      };
    } catch (error) {
      console.error('Error fetching dashboard summary:', error);
      throw new Error('Gagal mengambil ringkasan dashboard');
    }
  }
}

// Export instance
export const summaryService = new SummaryService();