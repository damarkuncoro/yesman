import { Role, User, RoleAccess, PERMISSION_CONSTANTS } from './types';

/**
 * RoleChecker
 * Menangani pengecekan role-based access control
 * Mengikuti Single Responsibility Principle (SRP)
 */
export class RoleChecker {
  /**
   * Check apakah user memiliki role tertentu
   * @param user - User object
   * @param requiredRoles - Role atau array role yang diizinkan
   * @returns true jika user memiliki salah satu role
   */
  hasRole(
    user: User & { role?: Role },
    requiredRoles: RoleAccess
  ): boolean {
    try {
      const roles = Array.isArray(requiredRoles) ? requiredRoles : [requiredRoles];
      const userRole = user.role?.name || '';
      
      return roles.includes(userRole);
    } catch (error) {
      console.error('❌ Role check failed:', error);
      return false;
    }
  }

  /**
   * Check apakah user memiliki semua role yang dibutuhkan
   * @param user - User object
   * @param requiredRoles - Array role yang dibutuhkan
   * @returns true jika user memiliki semua role (untuk multi-role systems)
   */
  hasAllRoles(
    user: User & { role?: Role },
    requiredRoles: string[]
  ): boolean {
    if (!requiredRoles.length) {
      return true;
    }

    // Untuk sistem single-role, user hanya bisa memiliki satu role
    // Jadi hasAllRoles akan sama dengan hasRole untuk array dengan satu elemen
    if (requiredRoles.length === 1) {
      return this.hasRole(user, requiredRoles[0]);
    }

    // Untuk multi-role system (jika dikembangkan di masa depan)
    // Saat ini return false karena user hanya memiliki satu role
    return false;
  }

  /**
   * Check apakah user adalah super admin
   * @param user - User object
   * @returns true jika user adalah super admin
   */
  isSuperAdmin(user: User & { role?: Role }): boolean {
    return user.role?.name === PERMISSION_CONSTANTS.SUPER_ADMIN_ROLE;
  }

  /**
   * Check apakah user memiliki role dengan level tertentu atau lebih tinggi
   * @param user - User object
   * @param roleHierarchy - Object yang mendefinisikan hierarki role
   * @param minimumRole - Role minimum yang dibutuhkan
   * @returns true jika user memiliki role dengan level yang cukup
   */
  hasRoleLevel(
    user: User & { role?: Role },
    roleHierarchy: Record<string, number>,
    minimumRole: string
  ): boolean {
    try {
      const userRole = user.role?.name;
      if (!userRole) {
        return false;
      }

      const userRoleLevel = roleHierarchy[userRole];
      const minimumRoleLevel = roleHierarchy[minimumRole];

      if (userRoleLevel === undefined || minimumRoleLevel === undefined) {
        return false;
      }

      return userRoleLevel >= minimumRoleLevel;
    } catch (error) {
      console.error('❌ Role level check failed:', error);
      return false;
    }
  }

  /**
   * Get role name dari user
   * @param user - User object
   * @returns nama role atau null
   */
  getUserRole(user: User & { role?: Role }): string | null {
    return user.role?.name || null;
  }

  /**
   * Get role ID dari user
   * @param user - User object
   * @returns ID role atau null
   */
  getUserRoleId(user: User & { role?: Role }): string | null {
    return user.role?.id || null;
  }

  /**
   * Check apakah role name valid
   * @param roleName - Nama role
   * @returns true jika format valid
   */
  isValidRoleName(roleName: string): boolean {
    if (!roleName || typeof roleName !== 'string') {
      return false;
    }

    // Role name harus alphanumeric dengan underscore
    const validPattern = /^[A-Z][A-Z0-9_]*$/;
    return validPattern.test(roleName);
  }

  /**
   * Compare dua role berdasarkan hierarki
   * @param roleA - Role pertama
   * @param roleB - Role kedua
   * @param roleHierarchy - Object hierarki role
   * @returns -1 jika roleA < roleB, 0 jika sama, 1 jika roleA > roleB
   */
  compareRoles(
    roleA: string,
    roleB: string,
    roleHierarchy: Record<string, number>
  ): number {
    const levelA = roleHierarchy[roleA] || 0;
    const levelB = roleHierarchy[roleB] || 0;

    if (levelA < levelB) return -1;
    if (levelA > levelB) return 1;
    return 0;
  }

  /**
   * Get daftar role yang dapat diakses oleh user berdasarkan hierarki
   * @param user - User object
   * @param roleHierarchy - Object hierarki role
   * @param allRoles - Daftar semua role yang tersedia
   * @returns Array role yang dapat diakses
   */
  getAccessibleRoles(
    user: User & { role?: Role },
    roleHierarchy: Record<string, number>,
    allRoles: string[]
  ): string[] {
    const userRole = user.role?.name;
    if (!userRole) {
      return [];
    }

    const userRoleLevel = roleHierarchy[userRole] || 0;
    
    return allRoles.filter(role => {
      const roleLevel = roleHierarchy[role] || 0;
      return roleLevel <= userRoleLevel;
    });
  }

  /**
   * Check role dengan logging untuk audit
   * @param user - User object
   * @param requiredRoles - Role yang dibutuhkan
   * @param context - Context untuk logging
   * @returns true jika user memiliki role
   */
  hasRoleWithAudit(
    user: User & { role?: Role },
    requiredRoles: RoleAccess,
    context?: string
  ): boolean {
    const hasAccess = this.hasRole(user, requiredRoles);
    
    // Log untuk audit trail
    const logData = {
      userId: user.id,
      userEmail: user.email,
      userRole: user.role?.name,
      requiredRoles: Array.isArray(requiredRoles) ? requiredRoles : [requiredRoles],
      hasAccess,
      context: context || 'role_check',
      timestamp: new Date().toISOString()
    };

    if (hasAccess) {
      console.log('✅ Role access granted:', logData);
    } else {
      console.warn('❌ Role access denied:', logData);
    }

    return hasAccess;
  }

  /**
   * Validate role assignment untuk user
   * @param user - User object
   * @param newRole - Role baru yang akan di-assign
   * @param roleHierarchy - Object hierarki role
   * @param assignerRole - Role dari user yang melakukan assignment
   * @returns true jika assignment valid
   */
  canAssignRole(
    user: User & { role?: Role },
    newRole: string,
    roleHierarchy: Record<string, number>,
    assignerRole: string
  ): boolean {
    // Super admin dapat assign role apapun
    if (assignerRole === PERMISSION_CONSTANTS.SUPER_ADMIN_ROLE) {
      return true;
    }

    const assignerLevel = roleHierarchy[assignerRole] || 0;
    const newRoleLevel = roleHierarchy[newRole] || 0;

    // User hanya dapat assign role dengan level lebih rendah atau sama
    return assignerLevel >= newRoleLevel;
  }
}

// Export singleton instance
export const roleChecker = new RoleChecker();
export default roleChecker;