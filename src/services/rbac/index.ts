// Re-export all types and schemas
export * from "./types";

// Re-export all services
export { RoleService, roleService } from "./roleService";
export { FeatureService, featureService } from "./featureService";
export { UserRoleService, userRoleService } from "./userRoleService";
export { RoleFeatureService, roleFeatureService } from "./roleFeatureService";
export { RouteFeatureService, routeFeatureService } from "./routeFeatureService";
export { RBACService, rbacService } from "./rbacService";

// Import instances for backward compatibility exports
import { roleService } from "./roleService";
import { featureService } from "./featureService";
import { userRoleService } from "./userRoleService";
import { roleFeatureService } from "./roleFeatureService";
import { routeFeatureService } from "./routeFeatureService";
import { rbacService } from "./rbacService";

// Backward compatibility - export instances with original names
export {
  roleService as roleServiceInstance,
  featureService as featureServiceInstance,
  userRoleService as userRoleServiceInstance,
  roleFeatureService as roleFeatureServiceInstance,
  routeFeatureService as routeFeatureServiceInstance,
  rbacService as rbacServiceInstance
};