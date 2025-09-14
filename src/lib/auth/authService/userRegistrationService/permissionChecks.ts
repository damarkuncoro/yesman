import { UserCreateData, RoleRepository } from "./types";
import { logUserRegistration } from './logger';

/**
 * Permission Checks class untuk User Registration
 * Menangani semua validasi permission untuk registrasi user
 */
export class UserRegistrationPermissionChecks {
  constructor(
    private roleRepository: RoleRepository
  ) {}

  /**
   * Check apakah user dapat melakukan registrasi (untuk admin)
   * @param adminUser - User admin yang melakukan registrasi
   * @param targetUserData - Data user yang akan diregistrasi
   * @returns true jika admin dapat melakukan registrasi
   */
  async canRegisterUser(
    adminUser: any,
    targetUserData: UserCreateData
  ): Promise<boolean> {
    try {
      // Super admin dapat register siapa saja
      if (adminUser.role?.name === 'SUPER_ADMIN') {
        logUserRegistration.permission(
          adminUser.email,
          targetUserData.email,
          'register',
          true
        );
        return true;
      }

      // Admin dapat register user dengan level lebih rendah
      if (adminUser.role?.name === 'ADMIN') {
        const canRegister = await this.canAdminRegisterUser(adminUser, targetUserData);
        logUserRegistration.permission(
          adminUser.email,
          targetUserData.email,
          'register',
          canRegister
        );
        return canRegister;
      }

      // HR dapat register user biasa
      if (adminUser.role?.name === 'HR') {
        const canRegister = await this.canHRRegisterUser(targetUserData);
        logUserRegistration.permission(
          adminUser.email,
          targetUserData.email,
          'register',
          canRegister
        );
        return canRegister;
      }

      // Manager dapat register user dalam department yang sama
      if (adminUser.role?.name === 'MANAGER') {
        const canRegister = this.canManagerRegisterUser(adminUser, targetUserData);
        logUserRegistration.permission(
          adminUser.email,
          targetUserData.email,
          'register',
          canRegister
        );
        return canRegister;
      }

      logUserRegistration.permission(
        adminUser.email,
        'unknown',
        'register',
        false
      );
      return false;
    } catch (error) {
      logUserRegistration.permission(
        adminUser.email,
        'unknown',
        'register',
        false
      );
      return false;
    }
  }

  /**
   * Check apakah admin dapat register user tertentu
   * @param adminUser - User admin
   * @param targetUserData - Data user target
   * @returns true jika admin dapat register user
   */
  private async canAdminRegisterUser(
    adminUser: any,
    targetUserData: UserCreateData
  ): Promise<boolean> {
    const targetLevel = targetUserData.level || 1;
    const adminLevel = adminUser.level || 1;
    
    // Admin dapat register user dengan level lebih rendah atau sama
    if (targetLevel <= adminLevel) {
      return true;
    }

    // Admin tidak dapat register user dengan level lebih tinggi
    return false;
  }

  /**
   * Check apakah HR dapat register user tertentu
   * @param targetUserData - Data user target
   * @returns true jika HR dapat register user
   */
  private async canHRRegisterUser(targetUserData: UserCreateData): Promise<boolean> {
    // HR dapat register user tanpa role (akan dapat default role)
    if (!targetUserData.roleId) {
      return true;
    }

    // HR dapat register user dengan role USER
    const targetRole = await this.roleRepository.findById(targetUserData.roleId);
    if (targetRole?.name === 'USER') {
      return true;
    }

    // HR tidak dapat register user dengan role admin atau manager
    const restrictedRoles = ['ADMIN', 'SUPER_ADMIN', 'MANAGER'];
    if (targetRole && restrictedRoles.includes(targetRole.name)) {
      return false;
    }

    return true;
  }

  /**
   * Check apakah manager dapat register user tertentu
   * @param managerUser - User manager
   * @param targetUserData - Data user target
   * @returns true jika manager dapat register user
   */
  private canManagerRegisterUser(
    managerUser: any,
    targetUserData: UserCreateData
  ): boolean {
    // Manager hanya dapat register user dalam department yang sama
    if (managerUser.department && targetUserData.department) {
      return managerUser.department.toLowerCase() === targetUserData.department.toLowerCase();
    }

    // Jika manager tidak punya department atau target user tidak punya department
    return false;
  }

  /**
   * Check apakah user dapat register dalam department tertentu
   * @param adminUser - User admin yang melakukan registrasi
   * @param targetDepartment - Department target
   * @returns true jika admin dapat register dalam department tersebut
   */
  async canRegisterInDepartment(
    adminUser: any,
    targetDepartment: string
  ): Promise<boolean> {
    try {
      // Super admin dapat register di department manapun
      if (adminUser.role?.name === 'SUPER_ADMIN') {
        return true;
      }

      // Admin dapat register di department manapun
      if (adminUser.role?.name === 'ADMIN') {
        return true;
      }

      // HR dapat register di department manapun
      if (adminUser.role?.name === 'HR') {
        return true;
      }

      // Manager hanya dapat register dalam department sendiri
      if (adminUser.role?.name === 'MANAGER') {
        return adminUser.department?.toLowerCase() === targetDepartment.toLowerCase();
      }

      return false;
    } catch (error) {
      logUserRegistration.permission(
        adminUser.email,
        'unknown',
        'department-register',
        false
      );
      return false;
    }
  }

  /**
   * Check apakah user dapat register dengan role tertentu
   * @param adminUser - User admin yang melakukan registrasi
   * @param targetRoleId - ID role target
   * @returns true jika admin dapat assign role tersebut
   */
  async canAssignRole(
    adminUser: any,
    targetRoleId: string
  ): Promise<boolean> {
    try {
      const targetRole = await this.roleRepository.findById(targetRoleId);
      if (!targetRole) {
        return false;
      }

      // Super admin dapat assign role apapun
      if (adminUser.role?.name === 'SUPER_ADMIN') {
        return true;
      }

      // Admin dapat assign role kecuali SUPER_ADMIN
      if (adminUser.role?.name === 'ADMIN') {
        return targetRole.name !== 'SUPER_ADMIN';
      }

      // HR hanya dapat assign role USER
      if (adminUser.role?.name === 'HR') {
        return targetRole.name === 'USER';
      }

      // Manager tidak dapat assign role apapun
      if (adminUser.role?.name === 'MANAGER') {
        return false;
      }

      return false;
    } catch (error) {
      logUserRegistration.permission(
        adminUser.email,
        'unknown',
        'role-assign',
        false
      );
      return false;
    }
  }

  /**
   * Get maximum level yang dapat diassign oleh admin
   * @param adminUser - User admin
   * @returns Maximum level yang dapat diassign
   */
  getMaxAssignableLevel(adminUser: any): number {
    // Super admin dapat assign level apapun
    if (adminUser.role?.name === 'SUPER_ADMIN') {
      return 10;
    }

    // Admin dapat assign level sampai level mereka sendiri
    if (adminUser.role?.name === 'ADMIN') {
      return adminUser.level || 1;
    }

    // HR dapat assign level 1-3
    if (adminUser.role?.name === 'HR') {
      return 3;
    }

    // Manager dapat assign level 1-2
    if (adminUser.role?.name === 'MANAGER') {
      return 2;
    }

    // Default: level 1
    return 1;
  }

  /**
   * Validate permission untuk bulk registration
   * @param adminUser - User admin yang melakukan bulk registration
   * @param usersData - Array data user yang akan diregistrasi
   * @returns Array error permission jika ada
   */
  async validateBulkRegistrationPermissions(
    adminUser: any,
    usersData: UserCreateData[]
  ): Promise<string[]> {
    const errors: string[] = [];

    for (let i = 0; i < usersData.length; i++) {
      const userData = usersData[i];
      const canRegister = await this.canRegisterUser(adminUser, userData);
      
      if (!canRegister) {
        errors.push(`User index ${i} (${userData.email}): Permission denied`);
      }
    }

    return errors;
  }
}

/**
 * Factory function untuk membuat UserRegistrationPermissionChecks
 */
export function createUserRegistrationPermissionChecks(
  roleRepository: RoleRepository
): UserRegistrationPermissionChecks {
  return new UserRegistrationPermissionChecks(roleRepository);
}