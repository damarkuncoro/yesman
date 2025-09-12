/**
 * Interface untuk statistik user per role
 */
export interface UserRoleStats {
  roleName: string;
  userCount: number;
  percentage: number;
  trend: 'up' | 'down' | 'stable';
  trendValue: number;
}

/**
 * Interface untuk statistik akses feature
 */
export interface FeatureAccessStats {
  featureName: string;
  accessCount: number;
  percentage: number;
  lastAccessed: string;
}

/**
 * Interface untuk statistik akses yang ditolak
 */
export interface AccessDeniedStats {
  featureName: string;
  deniedCount: number;
  percentage: number;
  lastDenied: string;
}

/**
 * Interface untuk statistik department/region
 */
export interface DepartmentRegionStats {
  department: string;
  region: string;
  userCount: number;
  activeUsers: number;
  percentage: number;
}

/**
 * Interface untuk ringkasan dashboard
 */
export interface DashboardSummary {
  totalUsers: number;
  totalRoles: number;
  totalFeatures: number;
  activeUsers: number;
  inactiveUsers: number;
}

/**
 * Interface untuk statistik access denied dari logs
 */
export interface AccessDeniedStatsFromLogs {
  totalDenied: number;
  todayDenied: number;
  topReason: string;
  topResource: string;
  trend: number;
  severityBreakdown: Record<string, number>;
  trendPercentage: number;
}

/**
 * Interface untuk statistik department dari logs
 */
export interface DepartmentStatsFromLogs {
  department: string;
  accessCount: number;
  deniedCount: number;
  userCount: number;
  successRate: number;
  trend: 'up' | 'down' | 'stable';
  trendValue: number;
}

/**
 * Interface untuk statistik region dari logs
 */
export interface RegionStatsFromLogs {
  region: string;
  accessCount: number;
  deniedCount: number;
  userCount: number;
  successRate: number;
  trend: 'up' | 'down' | 'stable';
  trendValue: number;
}