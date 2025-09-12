import { z } from "zod";
import { 
  type Role, type NewRole, 
  type Feature, type NewFeature,
  type UserRole, type NewUserRole,
  type RoleFeature, type NewRoleFeature,
  type RouteFeature, type NewRouteFeature
} from "@/db/schema";

// Re-export database types
export type {
  Role,
  NewRole,
  Feature,
  NewFeature,
  UserRole,
  NewUserRole,
  RoleFeature,
  NewRoleFeature,
  RouteFeature,
  NewRouteFeature
};

// Validation schemas untuk RBAC operations
export const createRoleSchema = z.object({
  name: z.string().min(1, "Nama role harus diisi").max(50, "Nama role maksimal 50 karakter"),
  grantsAll: z.boolean().default(false),
});

export const createFeatureSchema = z.object({
  name: z.string().min(1, "Nama feature harus diisi").max(100, "Nama feature maksimal 100 karakter"),
  description: z.string().optional(),
});

export const assignRoleSchema = z.object({
  userId: z.number().int().positive("User ID harus berupa integer positif"),
  roleId: z.number().int().positive("Role ID harus berupa integer positif"),
});

export const setPermissionSchema = z.object({
  roleId: z.number().int().positive("Role ID harus berupa integer positif"),
  featureId: z.number().int().positive("Feature ID harus berupa integer positif"),
  canCreate: z.boolean().default(false),
  canRead: z.boolean().default(false),
  canUpdate: z.boolean().default(false),
  canDelete: z.boolean().default(false),
});

export const createRouteFeatureSchema = z.object({
  path: z.string().min(1, "Path harus diisi"),
  method: z.string().optional(),
  featureId: z.number().int().positive("Feature ID harus berupa integer positif"),
});

// Inferred types dari schemas
export type CreateRoleInput = z.infer<typeof createRoleSchema>;
export type CreateFeatureInput = z.infer<typeof createFeatureSchema>;
export type AssignRoleInput = z.infer<typeof assignRoleSchema>;
export type SetPermissionInput = z.infer<typeof setPermissionSchema>;
export type CreateRouteFeatureInput = z.infer<typeof createRouteFeatureSchema>;

// Interface untuk response types
export interface UserPermission {
  featureId: string;
  featureName: string;
  featureDescription: string;
}

export interface RoleWithUsers extends Role {
  users: Array<{
    userId: number;
    userName: string;
  }>;
}

export interface UserWithRoles {
  userId: number;
  roles: Array<UserRole & { role: Role }>;
}

// Action types untuk permission checking
export type PermissionAction = "create" | "read" | "update" | "delete";
export type ActionType = "create" | "read" | "update" | "delete";

// Response types untuk API
export interface UserPermissionResponse {
  featureId: string;
  featureName: string;
  featureDescription: string;
}

// Error types
export class RBACError extends Error {
  constructor(message: string, public code?: string) {
    super(message);
    this.name = "RBACError";
  }
}

export class RoleNotFoundError extends RBACError {
  constructor(roleId: number) {
    super(`Role dengan ID ${roleId} tidak ditemukan`, "ROLE_NOT_FOUND");
  }
}

export class FeatureNotFoundError extends RBACError {
  constructor(featureId: number) {
    super(`Feature dengan ID ${featureId} tidak ditemukan`, "FEATURE_NOT_FOUND");
  }
}

export class UserNotFoundError extends RBACError {
  constructor(userId: number) {
    super(`User dengan ID ${userId} tidak ditemukan`, "USER_NOT_FOUND");
  }
}

export class DuplicateRoleError extends RBACError {
  constructor(roleName: string) {
    super(`Role dengan nama '${roleName}' sudah ada`, "DUPLICATE_ROLE");
  }
}

export class DuplicateFeatureError extends RBACError {
  constructor(featureName: string) {
    super(`Feature dengan nama '${featureName}' sudah ada`, "DUPLICATE_FEATURE");
  }
}

export class RoleAssignmentExistsError extends RBACError {
  constructor(userId: number, roleId: number) {
    super(`User ${userId} sudah memiliki role ${roleId}`, "ROLE_ASSIGNMENT_EXISTS");
  }
}

export class PermissionNotFoundError extends RBACError {
  constructor(roleId: number, featureId: number) {
    super(`Permission untuk role ${roleId} dan feature ${featureId} tidak ditemukan`, "PERMISSION_NOT_FOUND");
  }
}