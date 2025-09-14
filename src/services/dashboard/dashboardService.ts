// Re-export dari dashboard services yang sudah dipecah
export {
  summaryService,
  userRoleStatsService,
  featureAccessStatsService,
  accessDeniedStatsService,
  departmentRegionStatsService
} from './index';

// Re-export types
export type {
  UserRoleStats,
  FeatureAccessStats,
  AccessDeniedStats,
  DepartmentRegionStats,
  DashboardSummary,
  AccessDeniedStatsFromLogs,
  DepartmentStatsFromLogs,
  RegionStatsFromLogs
} from './index';

// Export default dashboardService untuk backward compatibility
export { dashboardService as default } from './index';
export { dashboardService } from './index';