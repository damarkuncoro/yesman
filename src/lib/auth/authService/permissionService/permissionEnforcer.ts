import { User, UserWithPermissions, AccessPolicy, PermissionAuditLog, PermissionCheckResponse, PermissionCheckResult } from './types';
import { accessPolicyEvaluator } from './accessPolicyEvaluator';
import { permissionChecker } from './permissionChecker';
import { roleChecker } from './roleChecker';

/**
 * Custom error untuk authorization failures
 */
export class AuthorizationError extends Error {
  public readonly code: string;
  public readonly statusCode: number;
  public readonly auditLog?: PermissionAuditLog;

  constructor(
    message: string,
    code: string = 'AUTHORIZATION_FAILED',
    statusCode: number = 403,
    auditLog?: PermissionAuditLog
  ) {
    super(message);
    this.name = 'AuthorizationError';
    this.code = code;
    this.statusCode = statusCode;
    this.auditLog = auditLog;
  }
}

/**
 * PermissionEnforcer
 * Menangani enforcement permission dengan exception handling
 * dan audit logging yang komprehensif
 * Mengikuti Single Responsibility Principle (SRP)
 */
export class PermissionEnforcer {
  private auditLogs: PermissionAuditLog[] = [];
  private maxAuditLogs: number = 1000;

  /**
   * Enforce permission dengan throw exception jika tidak memiliki akses
   * @param user - User object
   * @param requiredPermission - Permission yang dibutuhkan
   * @param context - Context untuk audit
   * @param resourceId - ID resource yang diakses
   * @param resourceType - Type resource yang diakses
   * @throws AuthorizationError jika tidak memiliki permission
   */
  enforcePermission(
    user: UserWithPermissions,
    requiredPermission: string,
    context: string = 'permission_check',
    resourceId?: string,
    resourceType?: string
  ): void {
    const hasPermission = permissionChecker.hasPermission(user, requiredPermission);
    
    const auditLog = this.createAuditLog(
      user,
      hasPermission,
      context,
      { requiredPermission },
      resourceId,
      resourceType
    );

    this.addAuditLog(auditLog);

    if (!hasPermission) {
      throw new AuthorizationError(
        `Access denied. Required permission: ${requiredPermission}`,
        'PERMISSION_DENIED',
        403,
        auditLog
      );
    }
  }

  /**
   * Enforce multiple permissions dengan AND logic
   * @param user - User object
   * @param requiredPermissions - Array permissions yang dibutuhkan
   * @param context - Context untuk audit
   * @param resourceId - ID resource yang diakses
   * @param resourceType - Type resource yang diakses
   * @throws AuthorizationError jika tidak memiliki semua permissions
   */
  enforceAllPermissions(
    user: UserWithPermissions,
    requiredPermissions: string[],
    context: string = 'multiple_permission_check',
    resourceId?: string,
    resourceType?: string
  ): void {
    const hasAllPermissions = permissionChecker.hasAllPermissions(user, requiredPermissions);
    
    const auditLog = this.createAuditLog(
      user,
      hasAllPermissions,
      context,
      { permissions: requiredPermissions },
      resourceId,
      resourceType
    );

    this.addAuditLog(auditLog);

    if (!hasAllPermissions) {
      const missingPermissions = requiredPermissions.filter(permission => 
        !permissionChecker.hasPermission(user, permission)
      );
      
      throw new AuthorizationError(
        `Access denied. Missing permissions: ${missingPermissions.join(', ')}`,
        'MULTIPLE_PERMISSIONS_DENIED',
        403,
        auditLog
      );
    }
  }

  /**
   * Enforce role dengan throw exception jika tidak memiliki role
   * @param user - User object
   * @param requiredRoles - Role atau array roles yang dibutuhkan
   * @param context - Context untuk audit
   * @param resourceId - ID resource yang diakses
   * @param resourceType - Type resource yang diakses
   * @throws AuthorizationError jika tidak memiliki role
   */
  enforceRole(
    user: UserWithPermissions,
    requiredRoles: string | string[],
    context: string = 'role_check',
    resourceId?: string,
    resourceType?: string
  ): void {
    const hasRole = roleChecker.hasRole(user, requiredRoles);
    
    const auditLog = this.createAuditLog(
      user,
      hasRole,
      context,
      { roles: Array.isArray(requiredRoles) ? requiredRoles : [requiredRoles] },
      resourceId,
      resourceType
    );

    this.addAuditLog(auditLog);

    if (!hasRole) {
      const rolesList = Array.isArray(requiredRoles) ? requiredRoles.join(', ') : requiredRoles;
      throw new AuthorizationError(
        `Access denied. Required role(s): ${rolesList}`,
        'ROLE_DENIED',
        403,
        auditLog
      );
    }
  }

  /**
   * Enforce access policy dengan throw exception jika tidak memenuhi policy
   * @param user - User object
   * @param policy - Access policy yang harus dipenuhi
   * @param context - Context untuk audit
   * @param resourceId - ID resource yang diakses
   * @param resourceType - Type resource yang diakses
   * @throws AuthorizationError jika tidak memenuhi policy
   */
  enforcePolicy(
    user: UserWithPermissions,
    policy: AccessPolicy,
    context: string = 'policy_check',
    resourceId?: string,
    resourceType?: string
  ): void {
    const result = accessPolicyEvaluator.evaluatePolicy(user, policy, context);
    
    const auditLog = this.createAuditLog(
      user,
      result.result === PermissionCheckResult.GRANTED,
      context,
      { accessPolicy: policy },
      resourceId,
      resourceType
    );

    this.addAuditLog(auditLog);

    if (result.result !== PermissionCheckResult.GRANTED) {
      throw new AuthorizationError(
        `Access denied. Policy violation: ${result.reason}`,
        'POLICY_DENIED',
        403,
        auditLog
      );
    }
  }

  /**
   * Enforce dengan custom check function
   * @param user - User object
   * @param checkFunction - Function yang return boolean untuk access check
   * @param errorMessage - Error message jika check gagal
   * @param context - Context untuk audit
   * @param resourceId - ID resource yang diakses
   * @param resourceType - Type resource yang diakses
   * @throws AuthorizationError jika check function return false
   */
  enforceCustomCheck(
    user: UserWithPermissions,
    checkFunction: (user: UserWithPermissions) => boolean,
    errorMessage: string,
    context: string = 'custom_check',
    resourceId?: string,
    resourceType?: string
  ): void {
    let hasAccess: boolean;
    
    try {
      hasAccess = checkFunction(user);
    } catch (error) {
      hasAccess = false;
      console.error('❌ Custom check function failed:', error);
    }
    
    const auditLog = this.createAuditLog(
      user,
      hasAccess,
      context,
      { customCheck: true },
      resourceId,
      resourceType
    );

    this.addAuditLog(auditLog);

    if (!hasAccess) {
      throw new AuthorizationError(
        errorMessage,
        'CUSTOM_CHECK_DENIED',
        403,
        auditLog
      );
    }
  }

  /**
   * Safe enforce yang return boolean instead of throwing exception
   * @param user - User object
   * @param requiredPermission - Permission yang dibutuhkan
   * @param context - Context untuk audit
   * @param resourceId - ID resource yang diakses
   * @param resourceType - Type resource yang diakses
   * @returns true jika memiliki permission, false jika tidak
   */
  safeEnforcePermission(
    user: UserWithPermissions,
    requiredPermission: string,
    context: string = 'safe_permission_check',
    resourceId?: string,
    resourceType?: string
  ): boolean {
    try {
      this.enforcePermission(user, requiredPermission, context, resourceId, resourceType);
      return true;
    } catch (error) {
      return false;
    }
  }

  /**
   * Safe enforce policy yang return PermissionCheckResponse
   * @param user - User object
   * @param policy - Access policy
   * @param context - Context untuk audit
   * @param resourceId - ID resource yang diakses
   * @param resourceType - Type resource yang diakses
   * @returns PermissionCheckResponse dengan detail hasil
   */
  safeEnforcePolicy(
    user: UserWithPermissions,
    policy: AccessPolicy,
    context: string = 'safe_policy_check',
    resourceId?: string,
    resourceType?: string
  ): PermissionCheckResponse {
    try {
      this.enforcePolicy(user, policy, context, resourceId, resourceType);
      return {
        result: PermissionCheckResult.GRANTED,
        reason: 'Policy requirements met'
      };
    } catch (error) {
      if (error instanceof AuthorizationError) {
        return {
          result: PermissionCheckResult.DENIED,
          reason: error.message
        };
      }
      return {
        result: PermissionCheckResult.ERROR,
        reason: `Enforcement error: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }

  /**
   * Create audit log entry
   * @param user - User object
   * @param hasAccess - Apakah user memiliki akses
   * @param context - Context check
   * @param checkDetails - Detail dari check yang dilakukan
   * @param resourceId - ID resource
   * @param resourceType - Type resource
   * @returns PermissionAuditLog object
   */
  private createAuditLog(
    user: UserWithPermissions,
    hasAccess: boolean,
    context: string,
    checkDetails: {
      requiredPermission?: string;
      permissions?: string[];
      roles?: string[];
      accessPolicy?: AccessPolicy;
      customCheck?: boolean;
    },
    resourceId?: string,
    resourceType?: string
  ): PermissionAuditLog {
    return {
      userId: user.id,
      userEmail: user.email,
      requiredPermission: checkDetails.requiredPermission,
      accessPolicy: checkDetails.accessPolicy,
      hasAccess,
      userRole: user.role?.name,
      context,
      timestamp: new Date().toISOString(),
      resourceId,
      resourceType
    };
  }

  /**
   * Add audit log dengan limit management
   * @param auditLog - Audit log entry
   */
  private addAuditLog(auditLog: PermissionAuditLog): void {
    this.auditLogs.push(auditLog);
    
    // Keep only recent logs to prevent memory issues
    if (this.auditLogs.length > this.maxAuditLogs) {
      this.auditLogs = this.auditLogs.slice(-this.maxAuditLogs);
    }

    // Log untuk monitoring
    if (auditLog.hasAccess) {
      console.log('✅ Access granted:', {
        user: auditLog.userEmail,
        context: auditLog.context,
        resource: auditLog.resourceId || 'N/A'
      });
    } else {
      console.warn('❌ Access denied:', {
        user: auditLog.userEmail,
        context: auditLog.context,
        resource: auditLog.resourceId || 'N/A',
        reason: auditLog.requiredPermission || 'Policy violation'
      });
    }
  }

  /**
   * Get audit logs untuk user tertentu
   * @param userId - ID user
   * @param limit - Limit jumlah logs
   * @returns Array audit logs
   */
  getUserAuditLogs(userId: string, limit: number = 50): PermissionAuditLog[] {
    return this.auditLogs
      .filter(log => log.userId === userId)
      .slice(-limit)
      .reverse(); // Most recent first
  }

  /**
   * Get audit logs untuk context tertentu
   * @param context - Context string
   * @param limit - Limit jumlah logs
   * @returns Array audit logs
   */
  getContextAuditLogs(context: string, limit: number = 50): PermissionAuditLog[] {
    return this.auditLogs
      .filter(log => log.context === context)
      .slice(-limit)
      .reverse(); // Most recent first
  }

  /**
   * Get failed access attempts
   * @param limit - Limit jumlah logs
   * @returns Array audit logs untuk failed attempts
   */
  getFailedAccessAttempts(limit: number = 50): PermissionAuditLog[] {
    return this.auditLogs
      .filter(log => !log.hasAccess)
      .slice(-limit)
      .reverse(); // Most recent first
  }

  /**
   * Clear audit logs (untuk testing atau maintenance)
   */
  clearAuditLogs(): void {
    this.auditLogs = [];
    console.log('🧹 Audit logs cleared');
  }

  /**
   * Get audit statistics
   * @returns Object dengan statistik audit
   */
  getAuditStatistics(): {
    totalLogs: number;
    successfulAccess: number;
    failedAccess: number;
    uniqueUsers: number;
    recentActivity: PermissionAuditLog[];
  } {
    const successfulAccess = this.auditLogs.filter(log => log.hasAccess).length;
    const failedAccess = this.auditLogs.filter(log => !log.hasAccess).length;
    const uniqueUsers = new Set(this.auditLogs.map(log => log.userId)).size;
    const recentActivity = this.auditLogs.slice(-10).reverse();

    return {
      totalLogs: this.auditLogs.length,
      successfulAccess,
      failedAccess,
      uniqueUsers,
      recentActivity
    };
  }

  /**
   * Set maximum audit logs to keep in memory
   * @param maxLogs - Maximum number of logs
   */
  setMaxAuditLogs(maxLogs: number): void {
    this.maxAuditLogs = Math.max(100, maxLogs); // Minimum 100 logs
    
    // Trim existing logs if needed
    if (this.auditLogs.length > this.maxAuditLogs) {
      this.auditLogs = this.auditLogs.slice(-this.maxAuditLogs);
    }
  }
}

// Export singleton instance
export const permissionEnforcer = new PermissionEnforcer();
export default permissionEnforcer;