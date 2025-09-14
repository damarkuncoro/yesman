import { RegistrationStatistics, UserRepository } from "./types";
import { logStatistics } from './logger';

/**
 * Statistics class untuk User Registration
 * Menangani semua operasi statistik terkait registrasi user
 */
export class UserRegistrationStatistics {
  constructor(
    private userRepository: UserRepository
  ) {}

  /**
   * Get registration statistics
   * @returns Object dengan statistik registrasi
   */
  async getRegistrationStatistics(): Promise<RegistrationStatistics> {
    try {
      logStatistics.generate('registration', 'system');

      // Untuk implementasi lengkap, ini akan bergantung pada repository
      // yang memiliki method untuk query statistik
      // Sementara ini return mock data dengan struktur yang benar
      
      const stats: RegistrationStatistics = {
        totalUsers: await this.getTotalUsersCount(),
        usersByDepartment: await this.getUsersByDepartment(),
        usersByRegion: await this.getUsersByRegion(),
        usersByLevel: await this.getUsersByLevel(),
        recentRegistrations: await this.getRecentRegistrationsCount()
      };

      logStatistics.generate('registration-success', 'system');
      return stats;
    } catch (error) {
      logStatistics.generate('registration-failed', 'system');
      return {
        totalUsers: 0,
        usersByDepartment: {},
        usersByRegion: {},
        usersByLevel: {},
        recentRegistrations: 0
      };
    }
  }

  /**
   * Get total users count
   * @returns Total number of users
   */
  private async getTotalUsersCount(): Promise<number> {
    try {
      // Implementasi ini akan bergantung pada repository method
      // Untuk sekarang return 0, nanti bisa diimplementasikan dengan:
      // return await this.userRepository.count();
      return 0;
    } catch (error) {
      console.error('❌ Failed to get total users count:', error);
      return 0;
    }
  }

  /**
   * Get users count by department
   * @returns Object dengan count per department
   */
  private async getUsersByDepartment(): Promise<Record<string, number>> {
    try {
      // Implementasi ini akan bergantung pada repository method
      // Untuk sekarang return empty object, nanti bisa diimplementasikan dengan:
      // return await this.userRepository.countByDepartment();
      return {};
    } catch (error) {
      console.error('❌ Failed to get users by department:', error);
      return {};
    }
  }

  /**
   * Get users count by region
   * @returns Object dengan count per region
   */
  private async getUsersByRegion(): Promise<Record<string, number>> {
    try {
      // Implementasi ini akan bergantung pada repository method
      // Untuk sekarang return empty object, nanti bisa diimplementasikan dengan:
      // return await this.userRepository.countByRegion();
      return {};
    } catch (error) {
      console.error('❌ Failed to get users by region:', error);
      return {};
    }
  }

  /**
   * Get users count by level
   * @returns Object dengan count per level
   */
  private async getUsersByLevel(): Promise<Record<number, number>> {
    try {
      // Implementasi ini akan bergantung pada repository method
      // Untuk sekarang return empty object, nanti bisa diimplementasikan dengan:
      // return await this.userRepository.countByLevel();
      return {};
    } catch (error) {
      console.error('❌ Failed to get users by level:', error);
      return {};
    }
  }

  /**
   * Get recent registrations count (dalam 30 hari terakhir)
   * @returns Number of recent registrations
   */
  private async getRecentRegistrationsCount(): Promise<number> {
    try {
      // Implementasi ini akan bergantung pada repository method
      // Untuk sekarang return 0, nanti bisa diimplementasikan dengan:
      // const thirtyDaysAgo = new Date();
      // thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      // return await this.userRepository.countSince(thirtyDaysAgo);
      return 0;
    } catch (error) {
      console.error('❌ Failed to get recent registrations count:', error);
      return 0;
    }
  }

  /**
   * Get detailed registration statistics dengan filter
   * @param filters - Filter options
   * @returns Detailed statistics
   */
  async getDetailedStatistics(filters?: {
    startDate?: Date;
    endDate?: Date;
    department?: string;
    region?: string;
    roleId?: string;
  }): Promise<{
    totalUsers: number;
    activeUsers: number;
    inactiveUsers: number;
    verifiedUsers: number;
    unverifiedUsers: number;
    usersByDepartment: Record<string, number>;
    usersByRegion: Record<string, number>;
    usersByLevel: Record<number, number>;
    usersByRole: Record<string, number>;
    registrationTrend: { date: string; count: number }[];
  }> {
    try {
      logStatistics.generate('detailed-registration', 'system');

      // Implementasi lengkap akan menggunakan repository methods dengan filters
      // Untuk sekarang return struktur kosong
      return {
        totalUsers: 0,
        activeUsers: 0,
        inactiveUsers: 0,
        verifiedUsers: 0,
        unverifiedUsers: 0,
        usersByDepartment: {},
        usersByRegion: {},
        usersByLevel: {},
        usersByRole: {},
        registrationTrend: []
      };
    } catch (error) {
      logStatistics.generate('detailed-registration-failed', 'system');
      throw error;
    }
  }

  /**
   * Generate registration report
   * @param period - Period untuk report ('daily', 'weekly', 'monthly')
   * @returns String report
   */
  async generateRegistrationReport(period: 'daily' | 'weekly' | 'monthly' = 'monthly'): Promise<string> {
    try {
      logStatistics.generate(`${period}-report`, 'system');

      const stats = await this.getRegistrationStatistics();
      
      let report = `\n=== LAPORAN REGISTRASI USER (${period.toUpperCase()}) ===\n`;
      report += `Generated: ${new Date().toLocaleString('id-ID')}\n\n`;
      
      report += `RINGKASAN:\n`;
      report += `Total User: ${stats.totalUsers}\n`;
      report += `Registrasi Terbaru (30 hari): ${stats.recentRegistrations}\n\n`;
      
      // Department breakdown
      if (Object.keys(stats.usersByDepartment).length > 0) {
        report += `BREAKDOWN PER DEPARTMENT:\n`;
        Object.entries(stats.usersByDepartment)
          .sort(([,a], [,b]) => b - a)
          .forEach(([dept, count]) => {
            report += `- ${dept}: ${count} user\n`;
          });
        report += `\n`;
      }
      
      // Region breakdown
      if (Object.keys(stats.usersByRegion).length > 0) {
        report += `BREAKDOWN PER REGION:\n`;
        Object.entries(stats.usersByRegion)
          .sort(([,a], [,b]) => b - a)
          .forEach(([region, count]) => {
            report += `- ${region}: ${count} user\n`;
          });
        report += `\n`;
      }
      
      // Level breakdown
      if (Object.keys(stats.usersByLevel).length > 0) {
        report += `BREAKDOWN PER LEVEL:\n`;
        Object.entries(stats.usersByLevel)
          .sort(([a], [b]) => Number(a) - Number(b))
          .forEach(([level, count]) => {
            report += `- Level ${level}: ${count} user\n`;
          });
      }
      
      logStatistics.generate(`${period}-report-success`, 'system');
      return report;
    } catch (error) {
      logStatistics.generate(`${period}-report-failed`, 'system');
      return 'Error generating report';
    }
  }

  /**
   * Export statistics to CSV format
   * @returns CSV string
   */
  async exportStatisticsToCSV(): Promise<string> {
    try {
      logStatistics.export('csv', 0, 'system');

      const stats = await this.getDetailedStatistics();
      
      let csv = 'Category,Subcategory,Count\n';
      
      // Add department data
      Object.entries(stats.usersByDepartment).forEach(([dept, count]) => {
        csv += `Department,${dept},${count}\n`;
      });
      
      // Add region data
      Object.entries(stats.usersByRegion).forEach(([region, count]) => {
        csv += `Region,${region},${count}\n`;
      });
      
      // Add level data
      Object.entries(stats.usersByLevel).forEach(([level, count]) => {
        csv += `Level,Level ${level},${count}\n`;
      });
      
      // Add role data
      Object.entries(stats.usersByRole).forEach(([role, count]) => {
        csv += `Role,${role},${count}\n`;
      });
      
      logStatistics.export('csv-success', 0, 'system');
      return csv;
    } catch (error) {
      logStatistics.export('csv-failed', 0, 'system');
      return 'Error exporting statistics';
    }
  }
}

/**
 * Factory function untuk membuat UserRegistrationStatistics
 */
export function createUserRegistrationStatistics(
  userRepository: UserRepository
): UserRegistrationStatistics {
  return new UserRegistrationStatistics(userRepository);
}