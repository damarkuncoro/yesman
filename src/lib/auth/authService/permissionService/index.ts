/**
 * Permission Service - Modular Implementation
 * Entry point untuk semua permission-related functionality
 * Mengikuti Domain-Driven Design (DDD) dan Single Responsibility Principle (SRP)
 */

// Export types
export * from './types';

// Export individual services
export { PermissionChecker, permissionChecker } from './permissionChecker';
export { RoleChecker, roleChecker } from './roleChecker';
export { AttributeChecker, attributeChecker } from './attributeChecker';
export { AccessPolicyEvaluator, accessPolicyEvaluator } from './accessPolicyEvaluator';
export { PermissionEnforcer, permissionEnforcer, AuthorizationError } from './permissionEnforcer';
export { ResourceAccessChecker, resourceAccessChecker } from './resourceAccessChecker';

// Import all services for main class
import { PermissionChecker, permissionChecker } from './permissionChecker';
import { RoleChecker, roleChecker } from './roleChecker';
import { AttributeChecker, attributeChecker } from './attributeChecker';
import { AccessPolicyEvaluator, accessPolicyEvaluator } from './accessPolicyEvaluator';
import { PermissionEnforcer, permissionEnforcer } from './permissionEnforcer';
import { ResourceAccessChecker, resourceAccessChecker } from './resourceAccessChecker';
import { 
  User, 
  UserWithPermissions, 
  AccessPolicy, 
  PermissionSummary, 
  PermissionCheckResponse,
  PermissionCheckResult,
  PERMISSION_CONSTANTS
} from './types';

/**
 * Main PermissionService class yang menggabungkan semua komponen modular
 * Menyediakan interface yang kompatibel dengan implementasi sebelumnya
 * sekaligus memanfaatkan arsitektur modular yang baru
 */
export class PermissionService {
  // Inject semua service dependencies
  private permissionChecker: PermissionChecker;
  private roleChecker: RoleChecker;
  private attributeChecker: AttributeChecker;
  private accessPolicyEvaluator: AccessPolicyEvaluator;
  private permissionEnforcer: PermissionEnforcer;
  private resourceAccessChecker: ResourceAccessChecker;

  constructor(
    permissionCheckerInstance?: PermissionChecker,
    roleCheckerInstance?: RoleChecker,
    attributeCheckerInstance?: AttributeChecker,
    accessPolicyEvaluatorInstance?: AccessPolicyEvaluator,
    permissionEnforcerInstance?: PermissionEnforcer,
    resourceAccessCheckerInstance?: ResourceAccessChecker
  ) {
    // Use provided instances or default singletons
    this.permissionChecker = permissionCheckerInstance || permissionChecker;
    this.roleChecker = roleCheckerInstance || roleChecker;
    this.attributeChecker = attributeCheckerInstance || attributeChecker;
    this.accessPolicyEvaluator = accessPolicyEvaluatorInstance || accessPolicyEvaluator;
    this.permissionEnforcer = permissionEnforcerInstance || permissionEnforcer;
    this.resourceAccessChecker = resourceAccessCheckerInstance || resourceAccessChecker;
  }

  /**
   * Check apakah user memiliki permission tertentu
   * @param user - User object
   * @param requiredPermission - Permission yang dibutuhkan
   * @returns true jika user memiliki permission
   */
  hasPermission(user: UserWithPermissions, requiredPermission: string): boolean {
    return this.permissionChecker.hasPermission(user, requiredPermission);
  }

  /**
   * Check apakah user memiliki semua permissions yang dibutuhkan
   * @param user - User object
   * @param requiredPermissions - Array permissions yang dibutuhkan
   * @returns true jika user memiliki semua permissions
   */
  hasAllPermissions(user: UserWithPermissions, requiredPermissions: string[]): boolean {
    return this.permissionChecker.hasAllPermissions(user, requiredPermissions);
  }

  /**
   * Check apakah user memiliki minimal satu dari permissions yang dibutuhkan
   * @param user - User object
   * @param requiredPermissions - Array permissions yang dibutuhkan
   * @returns true jika user memiliki minimal satu permission
   */
  hasAnyPermission(user: UserWithPermissions, requiredPermissions: string[]): boolean {
    return this.permissionChecker.hasAnyPermission(user, requiredPermissions);
  }

  /**
   * Check apakah user memiliki role tertentu
   * @param user - User object
   * @param requiredRoles - Role atau array role yang dibutuhkan
   * @returns true jika user memiliki role
   */
  hasRole(user: UserWithPermissions, requiredRoles: string | string[]): boolean {
    return this.roleChecker.hasRole(user, requiredRoles);
  }

  /**
   * Check access berdasarkan policy kompleks
   * @param user - User object
   * @param policy - Access policy
   * @param context - Context untuk logging
   * @returns PermissionCheckResponse dengan detail hasil
   */
  checkAccess(
    user: UserWithPermissions,
    policy: AccessPolicy,
    context?: string
  ): PermissionCheckResponse {
    return this.accessPolicyEvaluator.evaluatePolicy(user, policy, context);
  }

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
    context?: string,
    resourceId?: string,
    resourceType?: string
  ): void {
    this.permissionEnforcer.enforcePermission(
      user,
      requiredPermission,
      context,
      resourceId,
      resourceType
    );
  }

  /**
   * Check resource access berdasarkan ownership
   * @param user - User object
   * @param resourceOwnerId - ID pemilik resource
   * @param fallbackPermission - Permission fallback jika bukan owner
   * @param resourceType - Type resource
   * @param resourceId - ID resource
   * @returns PermissionCheckResponse
   */
  checkResourceAccess(
    user: UserWithPermissions,
    resourceOwnerId: string,
    fallbackPermission?: string,
    resourceType?: string,
    resourceId?: string
  ): PermissionCheckResponse {
    const request = this.resourceAccessChecker.createResourceAccessRequest(
      user,
      resourceOwnerId,
      { fallbackPermission, resourceType, resourceId }
    );
    return this.resourceAccessChecker.checkResourceAccess(request);
  }

  /**
   * Get user permission summary
   * @param user - User object
   * @returns PermissionSummary object
   */
  getUserPermissionSummary(user: UserWithPermissions): PermissionSummary {
    const userPermissions = this.permissionChecker.getUserPermissions(user);
    const attributeSummary = this.attributeChecker.getUserAttributeSummary(user);
    
    return {
      userId: user.id,
      role: user.role?.name || null,
      permissions: userPermissions,
      level: attributeSummary.level,
      department: attributeSummary.department,
      region: attributeSummary.region,
      isSuperAdmin: this.roleChecker.isSuperAdmin(user)
    };
  }

  /**
   * Create simple permission policy
   * @param permissions - Array permission names
   * @param requireAll - Apakah semua permission dibutuhkan
   * @returns AccessPolicy object
   */
  createPermissionPolicy(permissions: string[], requireAll: boolean = false): AccessPolicy {
    return this.accessPolicyEvaluator.createPermissionPolicy(permissions, requireAll);
  }

  /**
   * Create role-based policy
   * @param roles - Array role names
   * @returns AccessPolicy object
   */
  createRolePolicy(roles: string[]): AccessPolicy {
    return this.accessPolicyEvaluator.createRolePolicy(roles);
  }

  /**
   * Create attribute-based policy
   * @param criteria - Attribute criteria
   * @param requireAll - Logic untuk multiple criteria
   * @returns AccessPolicy object
   */
  createAttributePolicy(
    criteria: {
      minimumLevel?: number;
      departments?: string[];
      regions?: string[];
    },
    requireAll: boolean = true
  ): AccessPolicy {
    return this.accessPolicyEvaluator.createAttributePolicy(criteria, requireAll);
  }

  /**
   * Create combined policy dengan permission, role, dan attributes
   * @param config - Configuration untuk policy
   * @returns AccessPolicy object
   */
  createCombinedPolicy(config: {
    permissions?: string[];
    roles?: string[];
    minimumLevel?: number;
    departments?: string[];
    regions?: string[];
    requireAll?: boolean;
  }): AccessPolicy {
    return this.accessPolicyEvaluator.createCombinedPolicy(config);
  }

  /**
   * Get audit logs untuk user tertentu
   * @param userId - ID user
   * @param limit - Limit jumlah logs
   * @returns Array audit logs
   */
  getUserAuditLogs(userId: string, limit: number = 50) {
    return this.permissionEnforcer.getUserAuditLogs(userId, limit);
  }

  /**
   * Get failed access attempts
   * @param limit - Limit jumlah logs
   * @returns Array audit logs untuk failed attempts
   */
  getFailedAccessAttempts(limit: number = 50) {
    return this.permissionEnforcer.getFailedAccessAttempts(limit);
  }

  /**
   * Get audit statistics
   * @returns Object dengan statistik audit
   */
  getAuditStatistics() {
    return this.permissionEnforcer.getAuditStatistics();
  }

  /**
   * Validate user attributes
   * @param user - User object
   * @returns Object hasil validasi
   */
  validateUserAttributes(user: User) {
    return this.attributeChecker.validateUserAttributes(user);
  }

  /**
   * Get accessible resources dari list berdasarkan ownership dan permission
   * @param user - User yang mengakses
   * @param resourceOwnerIds - Array resource owner IDs
   * @param fallbackPermission - Fallback permission
   * @returns Array resource owner IDs yang dapat diakses
   */
  getAccessibleResources(
    user: UserWithPermissions,
    resourceOwnerIds: string[],
    fallbackPermission?: string
  ): string[] {
    return this.resourceAccessChecker.getAccessibleResources(
      user,
      resourceOwnerIds,
      fallbackPermission
    );
  }

  /**
   * Check comprehensive resource access dengan multiple criteria
   * @param user - User yang mengakses
   * @param resourceOwnerId - Resource owner ID
   * @param options - Additional options untuk access check
   * @returns PermissionCheckResponse
   */
  checkComprehensiveResourceAccess(
    user: UserWithPermissions,
    resourceOwnerId: string,
    options: {
      fallbackPermission?: string;
      resourceType?: string;
      resourceId?: string;
      allowHierarchical?: boolean;
      minimumLevelDifference?: number;
      allowRegional?: boolean;
      allowCrossRegion?: boolean;
      teamMembers?: string[];
      requireAll?: boolean;
    } = {}
  ): PermissionCheckResponse {
    const request = this.resourceAccessChecker.createResourceAccessRequest(
      user,
      resourceOwnerId,
      {
        fallbackPermission: options.fallbackPermission,
        resourceType: options.resourceType,
        resourceId: options.resourceId
      }
    );

    return this.resourceAccessChecker.checkComprehensiveAccess(request, {
      allowHierarchical: options.allowHierarchical,
      minimumLevelDifference: options.minimumLevelDifference,
      allowRegional: options.allowRegional,
      allowCrossRegion: options.allowCrossRegion,
      teamMembers: options.teamMembers,
      requireAll: options.requireAll
    });
  }

  /**
   * Clear audit logs (untuk testing atau maintenance)
   */
  clearAuditLogs(): void {
    this.permissionEnforcer.clearAuditLogs();
  }

  /**
   * Set maximum audit logs to keep in memory
   * @param maxLogs - Maximum number of logs
   */
  setMaxAuditLogs(maxLogs: number): void {
    this.permissionEnforcer.setMaxAuditLogs(maxLogs);
  }

  // Getter untuk akses langsung ke individual services jika diperlukan
  get permissions(): PermissionChecker {
    return this.permissionChecker;
  }

  get roles(): RoleChecker {
    return this.roleChecker;
  }

  get attributes(): AttributeChecker {
    return this.attributeChecker;
  }

  get policies(): AccessPolicyEvaluator {
    return this.accessPolicyEvaluator;
  }

  get enforcer(): PermissionEnforcer {
    return this.permissionEnforcer;
  }

  get resources(): ResourceAccessChecker {
    return this.resourceAccessChecker;
  }
}

// Create and export singleton instance
export const permissionService = new PermissionService();

// Export default untuk backward compatibility
export default permissionService;

// Export constants
export { PERMISSION_CONSTANTS };