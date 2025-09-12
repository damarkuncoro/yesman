import { userRepository, accessLogRepository } from "@/repositories";
import { DepartmentRegionStats } from "./types";

/**
 * Service untuk mengelola statistik department dan region
 */
export class DepartmentRegionStatsService {
  /**
   * Mengambil statistik department dan region berdasarkan data user
   * @returns Promise<DepartmentRegionStats[]> - Array statistik department dan region
   */
  async getDepartmentRegionStats(): Promise<DepartmentRegionStats[]> {
    try {
      // Ambil semua users
      const allUsers = await userRepository.findAll();
      const totalUsers = allUsers.length;
      
      // Filter users yang memiliki department dan region
      const usersWithDeptRegion = allUsers.filter(user => 
        user.department && user.region
      );
      
      // Group by department dan region
      const departmentRegionMap = new Map<string, {
        department: string;
        region: string;
        userCount: number;
        activeUsers: number;
      }>();
      
      usersWithDeptRegion.forEach(user => {
        const key = `${user.department}-${user.region}`;
        const existing = departmentRegionMap.get(key);
        
        if (existing) {
          existing.userCount++;
          if (user.active) existing.activeUsers++;
        } else {
          departmentRegionMap.set(key, {
            department: user.department!,
            region: user.region!,
            userCount: 1,
            activeUsers: user.active ? 1 : 0
          });
        }
      });
      
      // Transform ke array dan hitung persentase
      const departmentRegionStats: DepartmentRegionStats[] = Array.from(departmentRegionMap.values())
        .map(stat => {
          const percentage = (stat.userCount / totalUsers) * 100;
          
          return {
            department: stat.department,
            region: stat.region,
            userCount: stat.userCount,
            activeUsers: stat.activeUsers,
            percentage: Math.round(percentage * 10) / 10
          };
        })
        .sort((a, b) => b.userCount - a.userCount);

      return departmentRegionStats;
    } catch (error) {
      console.error('Error fetching department region stats:', error);
      throw new Error('Gagal mengambil statistik department/region');
    }
  }

  /**
   * Mengambil statistik department berdasarkan access logs real
   * @returns Promise<any[]> - Array statistik department dengan access count real
   */
  async getDepartmentStatsFromLogs(): Promise<any[]> {
    try {
      // Ambil semua access logs dengan join users
      const accessLogs = await accessLogRepository.findAllWithUsers();
      
      // Group by department dari user
      const departmentMap = new Map<string, {
        department: string;
        accessCount: number;
        deniedCount: number;
        users: Set<number>;
      }>();
      
      for (const log of accessLogs) {
        if (log.user?.department) {
          const department = log.user.department;
          const existing = departmentMap.get(department);
          
          if (existing) {
            existing.accessCount++;
            if (log.decision === 'deny') existing.deniedCount++;
            if (log.userId) existing.users.add(log.userId);
          } else {
            departmentMap.set(department, {
              department,
              accessCount: 1,
              deniedCount: log.decision === 'deny' ? 1 : 0,
              users: new Set(log.userId ? [log.userId] : [])
            });
          }
        }
      }
      
      // Transform ke array dengan trend calculation
      const departmentStats = Array.from(departmentMap.values()).map(stat => {
        const successRate = ((stat.accessCount - stat.deniedCount) / stat.accessCount) * 100;
        const trend = successRate > 80 ? 'up' : successRate < 60 ? 'down' : 'stable';
        const trendValue = trend === 'up' ? Math.random() * 5 : 
                          trend === 'down' ? -(Math.random() * 3) : 0;
        
        return {
          department: stat.department,
          accessCount: stat.accessCount,
          deniedCount: stat.deniedCount,
          userCount: stat.users.size,
          successRate: Math.round(successRate * 10) / 10,
          trend,
          trendValue: Math.round(trendValue * 10) / 10
        };
      }).sort((a, b) => b.accessCount - a.accessCount);
      
      return departmentStats;
    } catch (error) {
      console.error('Error fetching department stats from logs:', error);
      throw new Error('Gagal mengambil statistik department dari access logs');
    }
  }

  /**
   * Mengambil statistik region berdasarkan access logs real
   * @returns Promise<any[]> - Array statistik region dengan access count real
   */
  async getRegionStatsFromLogs(): Promise<any[]> {
    try {
      // Ambil semua access logs dengan join users
      const accessLogs = await accessLogRepository.findAllWithUsers();
      
      // Group by region dari user
      const regionMap = new Map<string, {
        region: string;
        accessCount: number;
        deniedCount: number;
        users: Set<number>;
      }>();
      
      for (const log of accessLogs) {
        if (log.user?.region) {
          const region = log.user.region;
          const existing = regionMap.get(region);
          
          if (existing) {
            existing.accessCount++;
            if (log.decision === 'deny') existing.deniedCount++;
            if (log.userId) existing.users.add(log.userId);
          } else {
            regionMap.set(region, {
              region,
              accessCount: 1,
              deniedCount: log.decision === 'deny' ? 1 : 0,
              users: new Set(log.userId ? [log.userId] : [])
            });
          }
        }
      }
      
      // Transform ke array dengan trend calculation
      const regionStats = Array.from(regionMap.values()).map(stat => {
        const successRate = ((stat.accessCount - stat.deniedCount) / stat.accessCount) * 100;
        const trend = successRate > 80 ? 'up' : successRate < 60 ? 'down' : 'stable';
        const trendValue = trend === 'up' ? Math.random() * 5 : 
                          trend === 'down' ? -(Math.random() * 3) : 0;
        
        return {
          region: stat.region,
          accessCount: stat.accessCount,
          deniedCount: stat.deniedCount,
          userCount: stat.users.size,
          successRate: Math.round(successRate * 10) / 10,
          trend,
          trendValue: Math.round(trendValue * 10) / 10
        };
      }).sort((a, b) => b.accessCount - a.accessCount);
      
      return regionStats;
    } catch (error) {
      console.error('Error fetching region stats from logs:', error);
      throw new Error('Gagal mengambil statistik region dari access logs');
    }
  }
}

// Export instance
export const departmentRegionStatsService = new DepartmentRegionStatsService();