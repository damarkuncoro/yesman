/**
 * Type definitions untuk Permission Service
 * Mendefinisikan interface untuk User, Role, Permission, dan Access Policy
 */

/**
 * Interface untuk Permission
 */
export interface Permission {
  id: string;
  name: string;
  description?: string;
}

/**
 * Interface untuk Role
 */
export interface Role {
  id: string;
  name: string;
  permissions?: Permission[];
}

/**
 * Interface untuk User
 */
export interface User {
  id: string;
  email: string;
  name: string;
  level: number | null;
  department: string | null;
  region: string | null;
  role?: Role;
}

/**
 * Extended User type dengan role dan permissions
 */
export type UserWithPermissions = User & {
  role?: Role & {
    permissions?: Permission[];
  };
};

/**
 * Interface untuk Access Policy (ABAC)
 */
export interface AccessPolicy {
  permissions?: string[];
  roles?: string[];
  minimumLevel?: number;
  departments?: string[];
  regions?: string[];
  requireAll?: boolean; // true = AND logic, false = OR logic
}

/**
 * Interface untuk Permission Summary
 */
export interface PermissionSummary {
  userId: string;
  role: string | null;
  permissions: string[];
  level: number | null;
  department: string | null;
  region: string | null;
  isSuperAdmin: boolean;
}

/**
 * Interface untuk Audit Log
 */
export interface PermissionAuditLog {
  userId: string;
  userEmail: string;
  requiredPermission?: string;
  accessPolicy?: AccessPolicy;
  hasAccess: boolean;
  userRole?: string;
  context: string;
  timestamp: string;
  resourceId?: string;
  resourceType?: string;
}

/**
 * Interface untuk Resource Access Check
 */
export interface ResourceAccessRequest {
  user: UserWithPermissions;
  resourceOwnerId: string;
  fallbackPermission?: string;
  resourceType?: string;
  resourceId?: string;
}

/**
 * Enum untuk Permission Check Result
 */
export enum PermissionCheckResult {
  GRANTED = 'granted',
  DENIED = 'denied',
  ERROR = 'error'
}

/**
 * Interface untuk Permission Check Response
 */
export interface PermissionCheckResponse {
  result: PermissionCheckResult;
  reason?: string;
  grantedBy?: 'permission' | 'role' | 'super_admin' | 'ownership';
  auditLog?: PermissionAuditLog;
}

/**
 * Type untuk Department Access
 */
export type DepartmentAccess = string | string[];

/**
 * Type untuk Region Access
 */
export type RegionAccess = string | string[];

/**
 * Type untuk Role Access
 */
export type RoleAccess = string | string[];

/**
 * Interface untuk Attribute Check Context
 */
export interface AttributeCheckContext {
  checkType: 'level' | 'department' | 'region';
  requiredValue: number | string | string[];
  userValue: number | string | null;
  result: boolean;
}

/**
 * Constants untuk Permission Service
 */
export const PERMISSION_CONSTANTS = {
  SUPER_ADMIN_ROLE: 'SUPER_ADMIN',
  WILDCARD_PERMISSION: '*',
  DEFAULT_LEVEL: 0,
  PERMISSION_NAME_PATTERN: /^[a-zA-Z0-9_.:*]+$/
} as const;

/**
 * Type guards untuk type checking
 */
export function isUser(obj: any): obj is User {
  return obj && 
    typeof obj.id === 'string' && 
    typeof obj.email === 'string' && 
    typeof obj.name === 'string';
}

export function isUserWithPermissions(obj: any): obj is UserWithPermissions {
  return isUser(obj) && 
    (obj.role === undefined || 
     (obj.role && typeof obj.role.id === 'string' && typeof obj.role.name === 'string'));
}

export function isPermission(obj: any): obj is Permission {
  return obj && 
    typeof obj.id === 'string' && 
    typeof obj.name === 'string';
}

export function isRole(obj: any): obj is Role {
  return obj && 
    typeof obj.id === 'string' && 
    typeof obj.name === 'string';
}

export function isAccessPolicy(obj: any): obj is AccessPolicy {
  return obj && typeof obj === 'object';
}