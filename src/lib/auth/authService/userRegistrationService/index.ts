/**
 * User Registration Service Module
 * 
 * Module ini menyediakan semua komponen yang diperlukan untuk registrasi user
 * dengan arsitektur yang modular dan terpisah berdasarkan tanggung jawab.
 * 
 * Struktur:
 * - types.ts: Type definitions dan interfaces
 * - validators.ts: Logic validasi data registrasi
 * - bulkOperations.ts: Operasi bulk registration
 * - permissionChecks.ts: Validasi permission
 * - statistics.ts: Statistik registrasi
 */

// Export sub-services
export { 
  UserRegistrationValidator, 
  createUserRegistrationValidator 
} from './validators';

export { 
  UserRegistrationBulkOperations, 
  createUserRegistrationBulkOperations 
} from './bulkOperations';

export { 
  UserRegistrationPermissionChecks, 
  createUserRegistrationPermissionChecks 
} from './permissionChecks';

export { 
  UserRegistrationStatistics, 
  createUserRegistrationStatistics 
} from './statistics';

// Export all types
export type {
  UserCreateData,
  UserResponse,
  UserRepository,
  RoleRepository,
  BulkRegistrationResult,
  RegistrationStatistics,
  ValidDepartment,
  ValidRegion
} from './types';

// Export constants
export {
  VALID_DEPARTMENTS,
  VALID_REGIONS,
  LEVEL_CONSTRAINTS,
  DEFAULT_ROLE_NAME
} from './types';

// Export constants and logger
export * from './constants';
export { default as logger, logUserRegistration, logBulkOperation, logStatistics } from './logger';

// Import untuk internal use
import { 
  createUserRegistrationValidator 
} from './validators';
import { 
  createUserRegistrationBulkOperations 
} from './bulkOperations';
import { 
  createUserRegistrationPermissionChecks 
} from './permissionChecks';
import { 
  createUserRegistrationStatistics 
} from './statistics';
import type { 
  UserCreateData, 
  UserResponse, 
  UserRepository, 
  RoleRepository 
} from './types';
import { logUserRegistration } from './logger';
import { SUCCESS_MESSAGES, ERROR_MESSAGES } from './constants';

/**
 * Composite UserRegistrationService yang menggabungkan semua sub-services
 * untuk backward compatibility
 */
export class UserRegistrationService {
  private validator: any;
  private bulkOperations: any;
  private permissionChecks: any;
  private statistics: any;

  constructor(
    userRepository: UserRepository,
    roleRepository: RoleRepository,
    passwordService: any,
    permissionService: any
  ) {
    this.validator = createUserRegistrationValidator(userRepository, roleRepository, passwordService);
    
    // Create a bound registerUser function for bulk operations
    const registerUserFunction = async (userData: UserCreateData) => {
      return this.validator.registerUser(userData, { role: { name: 'SYSTEM' } });
    };
    
    this.bulkOperations = createUserRegistrationBulkOperations(registerUserFunction);
    this.permissionChecks = createUserRegistrationPermissionChecks(roleRepository);
    this.statistics = createUserRegistrationStatistics(userRepository);
  }

  // Delegate methods to sub-services
  async registerUser(userData: UserCreateData, currentUser: any): Promise<UserResponse> {
    return this.validator.registerUser(userData, currentUser);
  }

  async bulkRegisterUsers(usersData: UserCreateData[], currentUser: any) {
    return this.bulkOperations.bulkRegisterUsers(usersData, currentUser);
  }

  async canRegisterUser(currentUser: any, targetRole?: string, targetDepartment?: string): Promise<boolean> {
    return this.permissionChecks.canRegisterUser(currentUser, targetRole, targetDepartment);
  }

  async getRegistrationStatistics(currentUser: any) {
    return this.statistics.getRegistrationStatistics(currentUser);
  }
}

/**
 * Factory function untuk membuat UserRegistrationService
 */
export function createUserRegistrationService(
  userRepository: UserRepository,
  roleRepository: RoleRepository,
  passwordService: any,
  permissionService: any
): UserRegistrationService {
  return new UserRegistrationService(
    userRepository,
    roleRepository,
    passwordService,
    permissionService
  );
}

/**
 * Default export untuk backward compatibility
 */
export default UserRegistrationService;