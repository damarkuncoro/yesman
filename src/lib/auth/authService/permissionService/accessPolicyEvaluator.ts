import { User, Role, Permission, AccessPolicy, UserWithPermissions, PermissionCheckResult, PermissionCheckResponse } from './types';
import { permissionChecker } from './permissionChecker';
import { roleChecker } from './roleChecker';
import { attributeChecker } from './attributeChecker';

/**
 * AccessPolicyEvaluator
 * Menangani evaluasi policy kompleks yang menggabungkan
 * permission-based, role-based, dan attribute-based access control
 * Mengikuti Single Responsibility Principle (SRP)
 */
export class AccessPolicyEvaluator {
  /**
   * Evaluate access policy untuk user
   * @param user - User object dengan permissions
   * @param policy - Access policy yang akan dievaluasi
   * @param context - Context untuk logging
   * @returns PermissionCheckResponse dengan detail hasil
   */
  evaluatePolicy(
    user: UserWithPermissions,
    policy: AccessPolicy,
    context?: string
  ): PermissionCheckResponse {
    try {
      const checkResults = {
        permissions: false,
        roles: false,
        attributes: false
      };

      let grantedBy: 'permission' | 'role' | 'super_admin' | 'ownership' | undefined;
      const reasons: string[] = [];

      // Check super admin first (always grants access)
      if (roleChecker.isSuperAdmin(user)) {
        return {
          result: PermissionCheckResult.GRANTED,
          reason: 'Super admin access',
          grantedBy: 'super_admin'
        };
      }

      // Check permissions jika ada
      if (policy.permissions && policy.permissions.length > 0) {
        checkResults.permissions = permissionChecker.hasAnyPermission(user, policy.permissions);
        if (checkResults.permissions) {
          grantedBy = 'permission';
        } else {
          reasons.push(`Missing required permissions: ${policy.permissions.join(', ')}`);
        }
      }

      // Check roles jika ada
      if (policy.roles && policy.roles.length > 0) {
        checkResults.roles = roleChecker.hasRole(user, policy.roles);
        if (checkResults.roles && !grantedBy) {
          grantedBy = 'role';
        } else if (!checkResults.roles) {
          reasons.push(`Missing required roles: ${policy.roles.join(', ')}`);
        }
      }

      // Check attributes (level, department, region)
      const attributeCriteria = {
        minimumLevel: policy.minimumLevel,
        departments: policy.departments,
        regions: policy.regions
      };

      if (policy.minimumLevel !== undefined || policy.departments || policy.regions) {
        if (policy.requireAll) {
          // AND logic untuk attributes
          checkResults.attributes = attributeChecker.checkAllAttributes(user, attributeCriteria);
        } else {
          // OR logic untuk attributes
          checkResults.attributes = attributeChecker.checkAnyAttribute(user, attributeCriteria);
        }

        if (!checkResults.attributes) {
          const attributeDetails = attributeChecker.getAttributeCheckDetails(user, attributeCriteria);
          const failedChecks = attributeDetails
            .filter(detail => !detail.result)
            .map(detail => `${detail.checkType}: required ${JSON.stringify(detail.requiredValue)}, user has ${detail.userValue}`);
          
          if (failedChecks.length > 0) {
            reasons.push(`Attribute requirements not met: ${failedChecks.join(', ')}`);
          }
        }
      } else {
        // Jika tidak ada attribute criteria, anggap passed
        checkResults.attributes = true;
      }

      // Determine final result berdasarkan requireAll flag
      let hasAccess: boolean;
      
      if (policy.requireAll) {
        // AND logic: semua check harus pass
        const allChecks = [];
        if (policy.permissions && policy.permissions.length > 0) allChecks.push(checkResults.permissions);
        if (policy.roles && policy.roles.length > 0) allChecks.push(checkResults.roles);
        if (policy.minimumLevel !== undefined || policy.departments || policy.regions) {
          allChecks.push(checkResults.attributes);
        }
        
        hasAccess = allChecks.length > 0 && allChecks.every(check => check);
      } else {
        // OR logic: minimal satu check harus pass
        const anyChecks = [];
        if (policy.permissions && policy.permissions.length > 0) anyChecks.push(checkResults.permissions);
        if (policy.roles && policy.roles.length > 0) anyChecks.push(checkResults.roles);
        if (policy.minimumLevel !== undefined || policy.departments || policy.regions) {
          anyChecks.push(checkResults.attributes);
        }
        
        hasAccess = anyChecks.length > 0 && anyChecks.some(check => check);
      }

      return {
        result: hasAccess ? PermissionCheckResult.GRANTED : PermissionCheckResult.DENIED,
        reason: hasAccess ? 'Policy requirements met' : reasons.join('; '),
        grantedBy: hasAccess ? grantedBy : undefined
      };

    } catch (error) {
      console.error('❌ Policy evaluation failed:', error);
      return {
        result: PermissionCheckResult.ERROR,
        reason: `Policy evaluation error: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }

  /**
   * Evaluate multiple policies dengan OR logic
   * @param user - User object
   * @param policies - Array access policies
   * @param context - Context untuk logging
   * @returns true jika user memenuhi minimal satu policy
   */
  evaluateAnyPolicy(
    user: UserWithPermissions,
    policies: AccessPolicy[],
    context?: string
  ): PermissionCheckResponse {
    if (!policies || policies.length === 0) {
      return {
        result: PermissionCheckResult.DENIED,
        reason: 'No policies provided'
      };
    }

    const results: PermissionCheckResponse[] = [];
    
    for (const policy of policies) {
      const result = this.evaluatePolicy(user, policy, context);
      results.push(result);
      
      // Jika ada policy yang granted, return immediately
      if (result.result === PermissionCheckResult.GRANTED) {
        return result;
      }
    }

    // Jika tidak ada yang granted, return hasil dari policy terakhir
    const lastResult = results[results.length - 1];
    const allReasons = results
      .filter(r => r.reason)
      .map(r => r.reason)
      .join('; ');

    return {
      result: PermissionCheckResult.DENIED,
      reason: `All policies failed: ${allReasons}`
    };
  }

  /**
   * Evaluate multiple policies dengan AND logic
   * @param user - User object
   * @param policies - Array access policies
   * @param context - Context untuk logging
   * @returns true jika user memenuhi semua policies
   */
  evaluateAllPolicies(
    user: UserWithPermissions,
    policies: AccessPolicy[],
    context?: string
  ): PermissionCheckResponse {
    if (!policies || policies.length === 0) {
      return {
        result: PermissionCheckResult.GRANTED,
        reason: 'No policies to evaluate'
      };
    }

    for (const policy of policies) {
      const result = this.evaluatePolicy(user, policy, context);
      
      // Jika ada policy yang denied, return immediately
      if (result.result !== PermissionCheckResult.GRANTED) {
        return result;
      }
    }

    return {
      result: PermissionCheckResult.GRANTED,
      reason: 'All policies satisfied'
    };
  }

  /**
   * Create simple permission policy
   * @param permissions - Array permission names
   * @param requireAll - Apakah semua permission dibutuhkan
   * @returns AccessPolicy object
   */
  createPermissionPolicy(permissions: string[], requireAll: boolean = false): AccessPolicy {
    return {
      permissions,
      requireAll
    };
  }

  /**
   * Create simple role policy
   * @param roles - Array role names
   * @returns AccessPolicy object
   */
  createRolePolicy(roles: string[]): AccessPolicy {
    return {
      roles,
      requireAll: false // OR logic untuk roles
    };
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
    return {
      minimumLevel: criteria.minimumLevel,
      departments: criteria.departments,
      regions: criteria.regions,
      requireAll
    };
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
    return {
      permissions: config.permissions,
      roles: config.roles,
      minimumLevel: config.minimumLevel,
      departments: config.departments,
      regions: config.regions,
      requireAll: config.requireAll || false
    };
  }

  /**
   * Validate access policy structure
   * @param policy - Policy yang akan divalidasi
   * @returns Object hasil validasi
   */
  validatePolicy(policy: AccessPolicy): {
    valid: boolean;
    errors: string[];
  } {
    const errors: string[] = [];

    // Check jika policy kosong
    if (!policy.permissions && !policy.roles && 
        policy.minimumLevel === undefined && 
        !policy.departments && !policy.regions) {
      errors.push('Policy must have at least one requirement');
    }

    // Validate permissions
    if (policy.permissions) {
      if (!Array.isArray(policy.permissions) || policy.permissions.length === 0) {
        errors.push('Permissions must be a non-empty array');
      } else {
        const invalidPermissions = policy.permissions.filter(p => 
          typeof p !== 'string' || p.trim() === ''
        );
        if (invalidPermissions.length > 0) {
          errors.push('All permissions must be non-empty strings');
        }
      }
    }

    // Validate roles
    if (policy.roles) {
      if (!Array.isArray(policy.roles) || policy.roles.length === 0) {
        errors.push('Roles must be a non-empty array');
      } else {
        const invalidRoles = policy.roles.filter(r => 
          typeof r !== 'string' || r.trim() === ''
        );
        if (invalidRoles.length > 0) {
          errors.push('All roles must be non-empty strings');
        }
      }
    }

    // Validate minimum level
    if (policy.minimumLevel !== undefined) {
      if (typeof policy.minimumLevel !== 'number' || policy.minimumLevel < 0) {
        errors.push('Minimum level must be a non-negative number');
      }
    }

    // Validate departments
    if (policy.departments) {
      if (!Array.isArray(policy.departments) || policy.departments.length === 0) {
        errors.push('Departments must be a non-empty array');
      }
    }

    // Validate regions
    if (policy.regions) {
      if (!Array.isArray(policy.regions) || policy.regions.length === 0) {
        errors.push('Regions must be a non-empty array');
      }
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }

  /**
   * Get policy summary untuk debugging
   * @param policy - Access policy
   * @returns String summary
   */
  getPolicySummary(policy: AccessPolicy): string {
    const parts: string[] = [];

    if (policy.permissions) {
      parts.push(`Permissions: ${policy.permissions.join(', ')}`);
    }

    if (policy.roles) {
      parts.push(`Roles: ${policy.roles.join(', ')}`);
    }

    if (policy.minimumLevel !== undefined) {
      parts.push(`Min Level: ${policy.minimumLevel}`);
    }

    if (policy.departments) {
      parts.push(`Departments: ${policy.departments.join(', ')}`);
    }

    if (policy.regions) {
      parts.push(`Regions: ${policy.regions.join(', ')}`);
    }

    const logic = policy.requireAll ? 'AND' : 'OR';
    return `Policy (${logic}): ${parts.join(' | ')}`;
  }
}

// Export singleton instance
export const accessPolicyEvaluator = new AccessPolicyEvaluator();
export default accessPolicyEvaluator;