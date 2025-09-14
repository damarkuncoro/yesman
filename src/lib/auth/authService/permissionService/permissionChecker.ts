import { Permission, Role, User } from './types';

/**
 * PermissionChecker
 * Menangani pengecekan permission dasar pada user
 * Mengikuti Single Responsibility Principle (SRP)
 */
export class PermissionChecker {
  /**
   * Check apakah user memiliki permission tertentu
   * @param user - User object dengan role dan permissions
   * @param requiredPermission - Permission yang dibutuhkan
   * @returns true jika user memiliki permission
   */
  hasPermission(
    user: User & { role?: Role & { permissions?: Permission[] } },
    requiredPermission: string
  ): boolean {
    try {
      // Super admin memiliki semua permission
      if (this.isSuperAdmin(user)) {
        return true;
      }

      // Check permission dari role
      const rolePermissions = user.role?.permissions || [];
      return rolePermissions.some((permission: Permission) => 
        permission.name === requiredPermission || 
        permission.name === '*' // Wildcard permission
      );
    } catch (error) {
      console.error('❌ Permission check failed:', error);
      return false;
    }
  }

  /**
   * Check multiple permissions (user harus memiliki semua permission)
   * @param user - User object
   * @param requiredPermissions - Array permission yang dibutuhkan
   * @returns true jika user memiliki semua permission
   */
  hasAllPermissions(
    user: User & { role?: Role & { permissions?: Permission[] } },
    requiredPermissions: string[]
  ): boolean {
    if (!requiredPermissions.length) {
      return true;
    }

    return requiredPermissions.every(permission => 
      this.hasPermission(user, permission)
    );
  }

  /**
   * Check multiple permissions (user hanya perlu memiliki salah satu permission)
   * @param user - User object
   * @param requiredPermissions - Array permission yang dibutuhkan
   * @returns true jika user memiliki minimal satu permission
   */
  hasAnyPermission(
    user: User & { role?: Role & { permissions?: Permission[] } },
    requiredPermissions: string[]
  ): boolean {
    if (!requiredPermissions.length) {
      return true;
    }

    return requiredPermissions.some(permission => 
      this.hasPermission(user, permission)
    );
  }

  /**
   * Check apakah user adalah super admin
   * @param user - User object
   * @returns true jika user adalah super admin
   */
  isSuperAdmin(user: User & { role?: Role }): boolean {
    return user.role?.name === 'SUPER_ADMIN';
  }

  /**
   * Get daftar permission yang dimiliki user
   * @param user - User object
   * @returns Array nama permission
   */
  getUserPermissions(
    user: User & { role?: Role & { permissions?: Permission[] } }
  ): string[] {
    if (this.isSuperAdmin(user)) {
      return ['*']; // Super admin memiliki semua permission
    }

    return user.role?.permissions?.map((p: Permission) => p.name) || [];
  }

  /**
   * Check apakah user memiliki wildcard permission
   * @param user - User object
   * @returns true jika user memiliki wildcard permission
   */
  hasWildcardPermission(
    user: User & { role?: Role & { permissions?: Permission[] } }
  ): boolean {
    return this.hasPermission(user, '*');
  }

  /**
   * Validate permission name format
   * @param permissionName - Nama permission
   * @returns true jika format valid
   */
  isValidPermissionName(permissionName: string): boolean {
    if (!permissionName || typeof permissionName !== 'string') {
      return false;
    }

    // Permission name harus alphanumeric dengan underscore/dot/colon
    const validPattern = /^[a-zA-Z0-9_.:*]+$/;
    return validPattern.test(permissionName);
  }

  /**
   * Get permission details dari user role
   * @param user - User object
   * @param permissionName - Nama permission
   * @returns Permission object atau null
   */
  getPermissionDetails(
    user: User & { role?: Role & { permissions?: Permission[] } },
    permissionName: string
  ): Permission | null {
    const rolePermissions = user.role?.permissions || [];
    return rolePermissions.find((p: Permission) => p.name === permissionName) || null;
  }

  /**
   * Check permission dengan logging untuk audit
   * @param user - User object
   * @param requiredPermission - Permission yang dibutuhkan
   * @param context - Context untuk logging
   * @returns true jika user memiliki permission
   */
  hasPermissionWithAudit(
    user: User & { role?: Role & { permissions?: Permission[] } },
    requiredPermission: string,
    context?: string
  ): boolean {
    const hasAccess = this.hasPermission(user, requiredPermission);
    
    // Log untuk audit trail
    const logData = {
      userId: user.id,
      userEmail: user.email,
      requiredPermission,
      hasAccess,
      userRole: user.role?.name,
      context: context || 'permission_check',
      timestamp: new Date().toISOString()
    };

    if (hasAccess) {
      console.log('✅ Permission granted:', logData);
    } else {
      console.warn('❌ Permission denied:', logData);
    }

    return hasAccess;
  }
}

// Export singleton instance
export const permissionChecker = new PermissionChecker();
export default permissionChecker;