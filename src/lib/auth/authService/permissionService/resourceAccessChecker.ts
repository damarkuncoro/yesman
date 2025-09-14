import { User, UserWithPermissions, ResourceAccessRequest, PermissionCheckResult, PermissionCheckResponse } from './types';
import { permissionChecker } from './permissionChecker';
import { roleChecker } from './roleChecker';
import { attributeChecker } from './attributeChecker';

/**
 * ResourceAccessChecker
 * Menangani resource-based access control termasuk ownership checks
 * dan hierarchical access berdasarkan department/region
 * Mengikuti Single Responsibility Principle (SRP)
 */
export class ResourceAccessChecker {
  /**
   * Check apakah user dapat mengakses resource berdasarkan ownership
   * @param request - Resource access request
   * @returns PermissionCheckResponse dengan detail hasil
   */
  checkResourceAccess(request: ResourceAccessRequest): PermissionCheckResponse {
    try {
      const { user, resourceOwnerId, fallbackPermission, resourceType, resourceId } = request;

      // Super admin selalu memiliki akses
      if (roleChecker.isSuperAdmin(user)) {
        return {
          result: PermissionCheckResult.GRANTED,
          reason: 'Super admin access',
          grantedBy: 'super_admin'
        };
      }

      // Check ownership - user dapat mengakses resource milik sendiri
      if (user.id === resourceOwnerId) {
        return {
          result: PermissionCheckResult.GRANTED,
          reason: 'Resource owner access',
          grantedBy: 'ownership'
        };
      }

      // Check fallback permission jika ada
      if (fallbackPermission) {
        const hasPermission = permissionChecker.hasPermission(user, fallbackPermission);
        if (hasPermission) {
          return {
            result: PermissionCheckResult.GRANTED,
            reason: `Permission-based access: ${fallbackPermission}`,
            grantedBy: 'permission'
          };
        }
      }

      return {
        result: PermissionCheckResult.DENIED,
        reason: `Access denied to ${resourceType || 'resource'} ${resourceId || resourceOwnerId}. Not owner and no fallback permission.`
      };

    } catch (error) {
      console.error('❌ Resource access check failed:', error);
      return {
        result: PermissionCheckResult.ERROR,
        reason: `Resource access check error: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }

  /**
   * Check hierarchical access berdasarkan department
   * User dengan level lebih tinggi dapat mengakses resource dari department yang sama
   * @param user - User yang mengakses
   * @param resourceOwner - User pemilik resource
   * @param minimumLevelDifference - Minimum perbedaan level untuk akses
   * @returns true jika user dapat mengakses resource
   */
  checkDepartmentHierarchicalAccess(
    user: UserWithPermissions,
    resourceOwner: User,
    minimumLevelDifference: number = 1
  ): PermissionCheckResponse {
    try {
      // Super admin selalu memiliki akses
      if (roleChecker.isSuperAdmin(user)) {
        return {
          result: PermissionCheckResult.GRANTED,
          reason: 'Super admin access',
          grantedBy: 'super_admin'
        };
      }

      // Check apakah di department yang sama
      if (!user.department || !resourceOwner.department) {
        return {
          result: PermissionCheckResult.DENIED,
          reason: 'Department information missing for hierarchical access'
        };
      }

      if (user.department !== resourceOwner.department) {
        return {
          result: PermissionCheckResult.DENIED,
          reason: 'Different department - no hierarchical access'
        };
      }

      // Check level hierarchy
      const userLevel = user.level || 0;
      const ownerLevel = resourceOwner.level || 0;
      const levelDifference = userLevel - ownerLevel;

      if (levelDifference >= minimumLevelDifference) {
        return {
          result: PermissionCheckResult.GRANTED,
          reason: `Hierarchical access - level ${userLevel} > ${ownerLevel} in department ${user.department}`
        };
      }

      return {
        result: PermissionCheckResult.DENIED,
        reason: `Insufficient level for hierarchical access. Required difference: ${minimumLevelDifference}, actual: ${levelDifference}`
      };

    } catch (error) {
      console.error('❌ Department hierarchical access check failed:', error);
      return {
        result: PermissionCheckResult.ERROR,
        reason: `Hierarchical access check error: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }

  /**
   * Check regional access - user dapat mengakses resource dari region yang sama
   * @param user - User yang mengakses
   * @param resourceOwner - User pemilik resource
   * @param allowCrossRegion - Apakah mengizinkan akses lintas region
   * @returns PermissionCheckResponse
   */
  checkRegionalAccess(
    user: UserWithPermissions,
    resourceOwner: User,
    allowCrossRegion: boolean = false
  ): PermissionCheckResponse {
    try {
      // Super admin selalu memiliki akses
      if (roleChecker.isSuperAdmin(user)) {
        return {
          result: PermissionCheckResult.GRANTED,
          reason: 'Super admin access',
          grantedBy: 'super_admin'
        };
      }

      // Jika cross-region diizinkan, langsung grant
      if (allowCrossRegion) {
        return {
          result: PermissionCheckResult.GRANTED,
          reason: 'Cross-region access allowed'
        };
      }

      // Check apakah di region yang sama
      if (!user.region || !resourceOwner.region) {
        return {
          result: PermissionCheckResult.DENIED,
          reason: 'Region information missing for regional access'
        };
      }

      if (user.region === resourceOwner.region) {
        return {
          result: PermissionCheckResult.GRANTED,
          reason: `Same region access: ${user.region}`
        };
      }

      return {
        result: PermissionCheckResult.DENIED,
        reason: `Different region - user in ${user.region}, resource owner in ${resourceOwner.region}`
      };

    } catch (error) {
      console.error('❌ Regional access check failed:', error);
      return {
        result: PermissionCheckResult.ERROR,
        reason: `Regional access check error: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }

  /**
   * Check team access - user dapat mengakses resource dari team member
   * @param user - User yang mengakses
   * @param resourceOwner - User pemilik resource
   * @param teamMembers - Array user ID yang merupakan team members
   * @returns PermissionCheckResponse
   */
  checkTeamAccess(
    user: UserWithPermissions,
    resourceOwner: User,
    teamMembers: string[]
  ): PermissionCheckResponse {
    try {
      // Super admin selalu memiliki akses
      if (roleChecker.isSuperAdmin(user)) {
        return {
          result: PermissionCheckResult.GRANTED,
          reason: 'Super admin access',
          grantedBy: 'super_admin'
        };
      }

      // Check apakah user dan resource owner adalah team members
      const userIsTeamMember = teamMembers.includes(user.id);
      const ownerIsTeamMember = teamMembers.includes(resourceOwner.id);

      if (userIsTeamMember && ownerIsTeamMember) {
        return {
          result: PermissionCheckResult.GRANTED,
          reason: 'Team member access'
        };
      }

      if (!userIsTeamMember) {
        return {
          result: PermissionCheckResult.DENIED,
          reason: 'User is not a team member'
        };
      }

      if (!ownerIsTeamMember) {
        return {
          result: PermissionCheckResult.DENIED,
          reason: 'Resource owner is not a team member'
        };
      }

      return {
        result: PermissionCheckResult.DENIED,
        reason: 'Team access check failed'
      };

    } catch (error) {
      console.error('❌ Team access check failed:', error);
      return {
        result: PermissionCheckResult.ERROR,
        reason: `Team access check error: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }

  /**
   * Check comprehensive resource access dengan multiple criteria
   * @param request - Resource access request
   * @param options - Additional options untuk access check
   * @returns PermissionCheckResponse
   */
  checkComprehensiveAccess(
    request: ResourceAccessRequest,
    options: {
      allowHierarchical?: boolean;
      minimumLevelDifference?: number;
      allowRegional?: boolean;
      allowCrossRegion?: boolean;
      teamMembers?: string[];
      requireAll?: boolean; // AND vs OR logic
    } = {}
  ): PermissionCheckResponse {
    const {
      allowHierarchical = false,
      minimumLevelDifference = 1,
      allowRegional = false,
      allowCrossRegion = false,
      teamMembers = [],
      requireAll = false
    } = options;

    try {
      // Basic resource access check (ownership + permission)
      const basicAccess = this.checkResourceAccess(request);
      if (basicAccess.result === PermissionCheckResult.GRANTED) {
        return basicAccess;
      }

      const results: PermissionCheckResponse[] = [];
      const { user, resourceOwnerId } = request;

      // Untuk comprehensive check, kita perlu resource owner object
      // Dalam implementasi nyata, ini harus di-fetch dari database
      // Untuk sekarang, kita asumsikan resourceOwner tersedia
      const resourceOwner: User = {
        id: resourceOwnerId,
        email: 'unknown@example.com',
        name: 'Unknown User',
        level: null,
        department: null,
        region: null
      };

      // Check hierarchical access jika diizinkan
      if (allowHierarchical) {
        const hierarchicalResult = this.checkDepartmentHierarchicalAccess(
          user,
          resourceOwner,
          minimumLevelDifference
        );
        results.push(hierarchicalResult);
      }

      // Check regional access jika diizinkan
      if (allowRegional) {
        const regionalResult = this.checkRegionalAccess(
          user,
          resourceOwner,
          allowCrossRegion
        );
        results.push(regionalResult);
      }

      // Check team access jika team members disediakan
      if (teamMembers.length > 0) {
        const teamResult = this.checkTeamAccess(user, resourceOwner, teamMembers);
        results.push(teamResult);
      }

      // Evaluate results berdasarkan requireAll flag
      if (requireAll) {
        // AND logic: semua check harus granted
        const allGranted = results.every(r => r.result === PermissionCheckResult.GRANTED);
        if (allGranted) {
          return {
            result: PermissionCheckResult.GRANTED,
            reason: 'All comprehensive access criteria met'
          };
        }
        
        const failedReasons = results
          .filter(r => r.result !== PermissionCheckResult.GRANTED)
          .map(r => r.reason)
          .join('; ');
        
        return {
          result: PermissionCheckResult.DENIED,
          reason: `Comprehensive access failed: ${failedReasons}`
        };
      } else {
        // OR logic: minimal satu check harus granted
        const grantedResult = results.find(r => r.result === PermissionCheckResult.GRANTED);
        if (grantedResult) {
          return grantedResult;
        }
        
        const allReasons = results.map(r => r.reason).join('; ');
        return {
          result: PermissionCheckResult.DENIED,
          reason: `All comprehensive access checks failed: ${allReasons}`
        };
      }

    } catch (error) {
      console.error('❌ Comprehensive access check failed:', error);
      return {
        result: PermissionCheckResult.ERROR,
        reason: `Comprehensive access check error: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }

  /**
   * Check bulk resource access untuk multiple resources
   * @param user - User yang mengakses
   * @param resourceOwnerIds - Array resource owner IDs
   * @param fallbackPermission - Fallback permission
   * @param resourceType - Type resource
   * @returns Map dengan resource ID sebagai key dan PermissionCheckResponse sebagai value
   */
  checkBulkResourceAccess(
    user: UserWithPermissions,
    resourceOwnerIds: string[],
    fallbackPermission?: string,
    resourceType?: string
  ): Map<string, PermissionCheckResponse> {
    const results = new Map<string, PermissionCheckResponse>();

    for (const resourceOwnerId of resourceOwnerIds) {
      const request: ResourceAccessRequest = {
        user,
        resourceOwnerId,
        fallbackPermission,
        resourceType,
        resourceId: resourceOwnerId
      };

      const result = this.checkResourceAccess(request);
      results.set(resourceOwnerId, result);
    }

    return results;
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
    const bulkResults = this.checkBulkResourceAccess(
      user,
      resourceOwnerIds,
      fallbackPermission
    );

    return Array.from(bulkResults.entries())
      .filter(([_, result]) => result.result === PermissionCheckResult.GRANTED)
      .map(([resourceId, _]) => resourceId);
  }

  /**
   * Create resource access request helper
   * @param user - User object
   * @param resourceOwnerId - Resource owner ID
   * @param options - Additional options
   * @returns ResourceAccessRequest object
   */
  createResourceAccessRequest(
    user: UserWithPermissions,
    resourceOwnerId: string,
    options: {
      fallbackPermission?: string;
      resourceType?: string;
      resourceId?: string;
    } = {}
  ): ResourceAccessRequest {
    return {
      user,
      resourceOwnerId,
      fallbackPermission: options.fallbackPermission,
      resourceType: options.resourceType,
      resourceId: options.resourceId || resourceOwnerId
    };
  }
}

// Export singleton instance
export const resourceAccessChecker = new ResourceAccessChecker();
export default resourceAccessChecker;