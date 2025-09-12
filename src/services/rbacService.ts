// Re-export everything from the refactored RBAC services
// This file maintains backward compatibility while using the new modular structure

export * from "./rbac";

// For backward compatibility, also export with original names
export {
  roleService,
  featureService,
  userRoleService,
  roleFeatureService,
  routeFeatureService,
  rbacService
} from "./rbac";