/**
 * Index file untuk export semua repositories
 * Mengikuti prinsip DRY - satu tempat untuk mengimpor semua repositories
 * Memudahkan import dan maintenance
 */

// Base repository exports
export { BaseRepository, type CrudRepository, type NamedRepository, type CountableRepository } from './base/baseRepository';

// User repository exports
export { UserRepository, userRepository } from './user/userRepository';

// Session repository exports
export { SessionRepository, sessionRepository } from './session/sessionRepository';

// Role repository exports
export { RoleRepository, roleRepository } from './role/roleRepository';

// Feature repository exports
export { FeatureRepository, featureRepository } from './feature/featureRepository';

// User Role repository exports (junction table)
export { UserRoleRepository, userRoleRepository } from './userRole/userRoleRepository';

// Role Feature repository exports (junction table)
export { RoleFeatureRepository, roleFeatureRepository } from './roleFeature/roleFeatureRepository';

// Route Feature repository exports
export { RouteFeatureRepository, routeFeatureRepository } from './routeFeature/routeFeatureRepository';

// Policy repository exports
export { PolicyRepository, policyRepository } from './policy/policyRepository';

// Audit repository exports
export { AccessLogRepository, accessLogRepository } from './accessLog';
export { PolicyViolationRepository, policyViolationRepository } from './policyViolation';
export { ChangeHistoryRepository, changeHistoryRepository } from './changeHistory';

// Import instances untuk repositories object
import { userRepository } from './user/userRepository';
import { sessionRepository } from './session/sessionRepository';
import { roleRepository } from './role/roleRepository';
import { featureRepository } from './feature/featureRepository';
import { userRoleRepository } from './userRole/userRoleRepository';
import { roleFeatureRepository } from './roleFeature/roleFeatureRepository';
import { routeFeatureRepository } from './routeFeature/routeFeatureRepository';
import { policyRepository } from './policy/policyRepository';
import { accessLogRepository } from './accessLog';
import { policyViolationRepository } from './policyViolation';
import { changeHistoryRepository } from './changeHistory';

/**
 * Convenience object untuk mengakses semua repository instances
 * Berguna untuk dependency injection atau testing
 */
export const repositories = {
  user: userRepository,
  session: sessionRepository,
  role: roleRepository,
  feature: featureRepository,
  userRole: userRoleRepository,
  roleFeature: roleFeatureRepository,
  routeFeature: routeFeatureRepository,
  policy: policyRepository,
  accessLog: accessLogRepository,
  policyViolation: policyViolationRepository,
  changeHistory: changeHistoryRepository,
} as const;

/**
 * Type untuk repositories object
 */
export type Repositories = typeof repositories;

/**
 * Default export untuk backward compatibility
 */
export default repositories;