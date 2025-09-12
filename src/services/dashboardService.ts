// Re-export dari dashboard services yang sudah dipecah
export {
  summaryService,
  userRoleStatsService,
  featureAccessStatsService,
  accessDeniedStatsService,
  departmentRegionStatsService
} from './dashboard';

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
} from './dashboard';

// Export default dashboardService untuk backward compatibility
export { dashboardService as default } from './dashboard';
export { dashboardService } from './dashboard';