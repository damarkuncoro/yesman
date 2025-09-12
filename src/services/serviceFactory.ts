import { 
  userRepository, 
  roleRepository, 
  featureRepository, 
  userRoleRepository, 
  roleFeatureRepository, 
  routeFeatureRepository,
  policyRepository,
  accessLogRepository,
  policyViolationRepository,
  changeHistoryRepository,
  sessionRepository
} from '@/repositories';

import { UserService } from './userService';
import { AuthService } from '../lib/auth/authService';
import { RoleService, FeatureService, UserRoleService, RoleFeatureService, RouteFeatureService, RBACService } from './rbacService';
import { AbacService } from './abacService';
import { AuditService } from './auditService';
// HybridAuthService telah digantikan oleh unified AuthService
import { ValidationService } from '../lib/validation/validator';
import { ErrorHandler } from '../lib/errors/errorHandler';

/**
 * Service Factory untuk mengelola dependency injection
 * Mengimplementasikan Singleton pattern untuk memastikan instance yang konsisten
 */
export class ServiceFactory {
  private static instances: Map<string, object> = new Map();

  /**
   * Membuat atau mengambil instance UserService
   * @returns UserService instance
   */
  static getUserService(): UserService {
    if (!this.instances.has('UserService')) {
      this.instances.set('UserService', new UserService());
    }
    return this.instances.get('UserService') as UserService;
  }

  /**
   * Membuat atau mengambil instance AuthService (Unified)
   * @returns AuthService instance
   */
  static getAuthService(): AuthService {
    if (!this.instances.has('AuthService')) {
      this.instances.set('AuthService', new AuthService());
    }
    return this.instances.get('AuthService') as AuthService;
  }

  /**
   * Membuat atau mengambil instance RoleService
   * @returns RoleService instance
   */
  static getRoleService(): RoleService {
    if (!this.instances.has('RoleService')) {
      this.instances.set('RoleService', new RoleService());
    }
    return this.instances.get('RoleService') as RoleService;
  }

  /**
   * Membuat atau mengambil instance FeatureService
   * @returns FeatureService instance
   */
  static getFeatureService(): FeatureService {
    if (!this.instances.has('FeatureService')) {
      this.instances.set('FeatureService', new FeatureService());
    }
    return this.instances.get('FeatureService') as FeatureService;
  }

  /**
   * Membuat atau mengambil instance UserRoleService
   * @returns UserRoleService instance
   */
  static getUserRoleService(): UserRoleService {
    if (!this.instances.has('UserRoleService')) {
      this.instances.set('UserRoleService', new UserRoleService());
    }
    return this.instances.get('UserRoleService') as UserRoleService;
  }

  /**
   * Membuat atau mengambil instance RoleFeatureService
   * @returns RoleFeatureService instance
   */
  static getRoleFeatureService(): RoleFeatureService {
    if (!this.instances.has('RoleFeatureService')) {
      this.instances.set('RoleFeatureService', new RoleFeatureService());
    }
    return this.instances.get('RoleFeatureService') as RoleFeatureService;
  }

  /**
   * Membuat atau mengambil instance RouteFeatureService
   * @returns RouteFeatureService instance
   */
  static getRouteFeatureService(): RouteFeatureService {
    if (!this.instances.has('RouteFeatureService')) {
      this.instances.set('RouteFeatureService', new RouteFeatureService());
    }
    return this.instances.get('RouteFeatureService') as RouteFeatureService;
  }

  /**
   * Membuat atau mengambil instance RBACService
   * @returns RBACService instance
   */
  static getRBACService(): RBACService {
    if (!this.instances.has('RBACService')) {
      this.instances.set('RBACService', new RBACService());
    }
    return this.instances.get('RBACService') as RBACService;
  }

  /**
   * Mendapatkan instance AbacService
   * @returns AbacService instance
   */
  static getAbacService(): AbacService {
    if (!this.instances.has('AbacService')) {
      const validationService = this.getValidationService();
      const errorHandler = this.getErrorHandlerService();
      
      this.instances.set('AbacService', new AbacService(
        policyRepository,
        userRepository,
        validationService,
        errorHandler
      ));
    }
    return this.instances.get('AbacService') as AbacService;
  }

  /**
   * Mendapatkan instance AuditService
   * @returns AuditService instance
   */
  static getAuditService(): AuditService {
    if (!this.instances.has('AuditService')) {
      this.instances.set('AuditService', new AuditService(
        accessLogRepository,
        policyViolationRepository,
        changeHistoryRepository,
        sessionRepository,
        userRepository
      ));
    }
    return this.instances.get('AuditService') as AuditService;
  }

  /**
   * @deprecated HybridAuthService telah digantikan oleh unified AuthService
   * Gunakan getAuthService() sebagai gantinya
   */
  static getHybridAuthService(): never {
    throw new Error('HybridAuthService telah deprecated. Gunakan getAuthService() untuk unified authentication.');
  }

  /**
   * Membuat atau mengambil instance ValidationService (Unified)
   * @returns ValidationService class
   */
  static getValidationService(): typeof ValidationService {
    // ValidationService adalah static class, tidak perlu instance
    return ValidationService;
  }

  /**
   * Membuat atau mengambil instance ErrorHandler (Unified)
   * @returns ErrorHandler class
   */
  static getErrorHandlerService(): typeof ErrorHandler {
    // ErrorHandler adalah static class, tidak perlu instance
    return ErrorHandler;
  }

  /**
   * Reset semua instances (untuk testing)
   */
  static resetInstances(): void {
    this.instances.clear();
  }

  /**
   * Mendapatkan semua service instances yang telah dibuat
   * @returns Map dari service instances
   */
  static getAllInstances(): Map<string, object> {
    return new Map(this.instances);
  }
}

// Export default instances untuk backward compatibility
export const userService = ServiceFactory.getUserService();
export const authService = ServiceFactory.getAuthService();
export const roleService = ServiceFactory.getRoleService();
export const featureService = ServiceFactory.getFeatureService();
export const userRoleService = ServiceFactory.getUserRoleService();
export const roleFeatureService = ServiceFactory.getRoleFeatureService();
export const routeFeatureService = ServiceFactory.getRouteFeatureService();
export const rbacService = ServiceFactory.getRBACService();
export const abacService = ServiceFactory.getAbacService();
export const auditService = ServiceFactory.getAuditService();
// hybridAuthService telah deprecated, gunakan authService
export const validationService = ServiceFactory.getValidationService();
export const errorHandlerService = ServiceFactory.getErrorHandlerService();

// Export unified services untuk backward compatibility
export { authService as unifiedAuthService };
export { validationService as unifiedValidationService };
export { errorHandlerService as unifiedErrorHandler };