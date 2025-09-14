/**
 * Services Index File
 * Menyediakan ekspor terpusat untuk semua services dengan dependency injection yang tepat
 * Mengikuti prinsip Single Responsibility dan Dependency Inversion
 */

// Export service factory untuk dependency management
export { ServiceFactory } from './serviceFactory';

// Export individual services untuk direct import
export { UserService } from './user/userService';
export { AuthService } from '../lib/auth/authService';
export { 
  RoleService, 
  FeatureService, 
  UserRoleService, 
  RoleFeatureService, 
  RouteFeatureService, 
  RBACService 
} from './rbac';
export { AbacService } from './abac/abacService';
export { AuditService } from './audit/auditService';
export { dashboardService } from './dashboard/dashboardService';
export { RouteDiscoveryService } from './discovery/routeDiscoveryService';
export { routeDiscovery } from './discovery';
// HybridAuthService telah deprecated, gunakan AuthService

// Export utility services (unified)
export { ValidationService } from '../lib/validation/validator';
export { ErrorHandler } from '../lib/errors/errorHandler';
export { BaseService, BaseCrudService } from './base/baseService';

// Export pre-configured service instances untuk backward compatibility
export {
  userService,
  authService,
  roleService,
  featureService,
  userRoleService,
  roleFeatureService,
  routeFeatureService,
  rbacService,
  abacService,
  auditService,
  // hybridAuthService telah deprecated
  validationService,
  errorHandlerService,

} from './serviceFactory';

// Export validation schemas
export * from '../lib/validation/schemas';

// Export error types
export * from '../lib/errors/errorHandler';

/**
 * Service Usage Guidelines:
 * 
 * 1. Untuk aplikasi baru, gunakan ServiceFactory:
 *    const userService = ServiceFactory.getUserService();
 * 
 * 2. Untuk backward compatibility, gunakan pre-configured instances:
 *    import { userService } from '@/services';
 * 
 * 3. Untuk testing, reset instances jika diperlukan:
 *    ServiceFactory.resetInstances();
 * 
 * 4. Semua services mengikuti prinsip:
 *    - Single Responsibility Principle (SRP)
 *    - Dependency Inversion Principle (DIP)
 *    - Don't Repeat Yourself (DRY)
 *    - Keep It Simple, Stupid (KISS)
 */