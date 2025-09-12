// Import all dashboard services
import { summaryService } from './summaryService';
import { userRoleStatsService } from './userRoleStatsService';
import { featureAccessStatsService } from './featureAccessStatsService';
import { accessDeniedStatsService } from './accessDeniedStatsService';
import { departmentRegionStatsService } from './departmentRegionStatsService';

// Export all dashboard services
export { summaryService } from './summaryService';
export { userRoleStatsService } from './userRoleStatsService';
export { featureAccessStatsService } from './featureAccessStatsService';
export { accessDeniedStatsService } from './accessDeniedStatsService';
export { departmentRegionStatsService } from './departmentRegionStatsService';

// Export types
export * from './types';



/**
 * Main dashboard service yang menggunakan semua service kecil
 * Untuk backward compatibility dengan kode yang sudah ada
 */
export class DashboardService {
  /**
   * Mengambil ringkasan dashboard
   */
  async getDashboardSummary() {
    return summaryService.getDashboardSummary();
  }

  /**
   * Mengambil statistik user per role
   */
  async getUserRoleStats() {
    return userRoleStatsService.getUserRoleStats();
  }

  /**
   * Mengambil statistik akses fitur
   */
  async getFeatureAccessStats() {
    return featureAccessStatsService.getFeatureAccessStats();
  }

  /**
   * Mengambil statistik akses yang ditolak
   */
  async getAccessDeniedStats() {
    return accessDeniedStatsService.getAccessDeniedStats();
  }

  /**
   * Mengambil statistik akses yang ditolak dari logs
   */
  async getAccessDeniedStatsFromLogs() {
    return accessDeniedStatsService.getAccessDeniedStatsFromLogs();
  }

  /**
   * Mengambil statistik department dan region
   */
  async getDepartmentRegionStats() {
    return departmentRegionStatsService.getDepartmentRegionStats();
  }

  /**
   * Mengambil statistik department dari logs
   */
  async getDepartmentStatsFromLogs() {
    return departmentRegionStatsService.getDepartmentStatsFromLogs();
  }

  /**
   * Mengambil statistik region dari logs
   */
  async getRegionStatsFromLogs() {
    return departmentRegionStatsService.getRegionStatsFromLogs();
  }
}

// Export instance untuk backward compatibility
export const dashboardService = new DashboardService();