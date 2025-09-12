import { userRepository, roleRepository, userRoleRepository } from "@/repositories";
import { UserRoleStats } from "./types";

/**
 * Service untuk mengelola statistik user per role
 */
export class UserRoleStatsService {
  /**
   * Mengambil statistik user per role
   * @returns Promise<UserRoleStats[]> - Array statistik user per role
   */
  async getUserRoleStats(): Promise<UserRoleStats[]> {
    try {
      // Ambil semua roles dan user roles
      const [allRoles, allUserRoles, totalUsers] = await Promise.all([
        roleRepository.findAll(),
        userRoleRepository.findAll(),
        userRepository.count()
      ]);

      // Hitung jumlah user per role
      const roleUserCounts = allRoles.map(role => {
        const userCount = allUserRoles.filter(ur => ur.roleId === role.id).length;
        return {
          roleName: role.name,
          userCount
        };
      });

      // Sort berdasarkan user count descending
      roleUserCounts.sort((a, b) => b.userCount - a.userCount);

      // Transform data dan tambahkan trend (mock untuk sekarang)
      const userRoleStats: UserRoleStats[] = roleUserCounts.map((stat, index) => {
        const percentage = (stat.userCount / totalUsers) * 100;
        
        // Mock trend data - nanti bisa diganti dengan data historis
        const trends: Array<'up' | 'down' | 'stable'> = ['up', 'down', 'stable'];
        const trend = trends[index % 3];
        const trendValue = trend === 'up' ? Math.random() * 5 : 
                          trend === 'down' ? -(Math.random() * 3) : 0;

        return {
          roleName: stat.roleName,
          userCount: stat.userCount,
          percentage: Math.round(percentage * 10) / 10,
          trend,
          trendValue: Math.round(trendValue * 10) / 10
        };
      });

      return userRoleStats;
    } catch (error) {
      console.error('Error fetching user role stats:', error);
      throw new Error('Gagal mengambil statistik user per role');
    }
  }
}

// Export instance
export const userRoleStatsService = new UserRoleStatsService();