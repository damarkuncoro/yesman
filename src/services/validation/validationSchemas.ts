import { z } from "zod";

/**
 * Centralized validation schemas untuk semua entities
 * Menerapkan DRY principle dengan menggunakan shared schemas
 */

// Base schemas yang dapat digunakan ulang
const baseStringSchema = z.string().min(1, "Field tidak boleh kosong");
const baseEmailSchema = z.string().email("Format email tidak valid");
const basePasswordSchema = z.string().min(8, "Password minimal 8 karakter");
const baseIdSchema = z.number().int().positive("ID harus berupa angka positif");

// User schemas
export const userCreateSchema = z.object({
  name: baseStringSchema,
  email: baseEmailSchema,
  password: basePasswordSchema,
  role: baseStringSchema.optional(),
  department: baseStringSchema.optional(),
  region: baseStringSchema.optional(),
  level: z.number().int().min(1).max(10).optional(),
});

export const userUpdateSchema = z.object({
  name: baseStringSchema.optional(),
  email: baseEmailSchema.optional(),
  password: basePasswordSchema.optional(),
  role: baseStringSchema.optional(),
}).refine(data => Object.keys(data).length > 0, {
  message: "Minimal satu field harus diisi untuk update"
});

export const userLoginSchema = z.object({
  email: baseEmailSchema,
  password: baseStringSchema,
});

// Role schemas
export const roleCreateSchema = z.object({
  name: baseStringSchema,
  description: z.string().optional(),
});

export const roleUpdateSchema = z.object({
  name: baseStringSchema.optional(),
  description: z.string().optional(),
}).refine(data => Object.keys(data).length > 0, {
  message: "Minimal satu field harus diisi untuk update"
});

// Feature schemas
export const featureCreateSchema = z.object({
  name: baseStringSchema,
  description: z.string().optional(),
  module: baseStringSchema,
});

export const featureUpdateSchema = z.object({
  name: baseStringSchema.optional(),
  description: z.string().optional(),
  module: baseStringSchema.optional(),
}).refine(data => Object.keys(data).length > 0, {
  message: "Minimal satu field harus diisi untuk update"
});

// Permission schemas
export const permissionCreateSchema = z.object({
  roleId: baseIdSchema,
  featureId: baseIdSchema,
  canRead: z.boolean().default(false),
  canWrite: z.boolean().default(false),
  canUpdate: z.boolean().default(false),
  canDelete: z.boolean().default(false),
});

export const permissionUpdateSchema = z.object({
  canRead: z.boolean().optional(),
  canWrite: z.boolean().optional(),
  canUpdate: z.boolean().optional(),
  canDelete: z.boolean().optional(),
}).refine(data => Object.keys(data).length > 0, {
  message: "Minimal satu field harus diisi untuk update"
});

// User Role schemas
export const userRoleCreateSchema = z.object({
  userId: baseIdSchema,
  roleId: baseIdSchema,
});

// ABAC schemas
export const abacPolicyCreateSchema = z.object({
  name: baseStringSchema,
  description: z.string().optional(),
  subject: baseStringSchema,
  resource: baseStringSchema,
  action: baseStringSchema,
  condition: z.string().optional(),
  effect: z.enum(["allow", "deny"]),
});

export const abacPolicyUpdateSchema = z.object({
  name: baseStringSchema.optional(),
  description: z.string().optional(),
  subject: baseStringSchema.optional(),
  resource: baseStringSchema.optional(),
  action: baseStringSchema.optional(),
  condition: z.string().optional(),
  effect: z.enum(["allow", "deny"]).optional(),
}).refine(data => Object.keys(data).length > 0, {
  message: "Minimal satu field harus diisi untuk update"
});

// Access validation schemas
export const accessValidationSchema = z.object({
  userId: baseIdSchema,
  resource: baseStringSchema,
  action: baseStringSchema,
  context: z.record(z.string(), z.any()).optional(),
});

// ID validation schemas
export const idParamSchema = z.object({
  id: baseIdSchema,
});

export const multipleIdsSchema = z.object({
  ids: z.array(baseIdSchema).min(1, "Minimal satu ID harus disediakan"),
});

// Query parameter schemas
export const paginationSchema = z.object({
  page: z.number().int().positive().default(1),
  limit: z.number().int().positive().max(100).default(10),
});

export const searchSchema = z.object({
  query: baseStringSchema.optional(),
  sortBy: baseStringSchema.optional(),
  sortOrder: z.enum(["asc", "desc"]).default("asc"),
});

// Combined schemas
export const searchWithPaginationSchema = searchSchema.merge(paginationSchema);

// Type exports untuk TypeScript
export type UserCreateInput = z.infer<typeof userCreateSchema>;
export type UserUpdateInput = z.infer<typeof userUpdateSchema>;
export type UserLoginInput = z.infer<typeof userLoginSchema>;
export type RoleCreateInput = z.infer<typeof roleCreateSchema>;
export type RoleUpdateInput = z.infer<typeof roleUpdateSchema>;
export type FeatureCreateInput = z.infer<typeof featureCreateSchema>;
export type FeatureUpdateInput = z.infer<typeof featureUpdateSchema>;
export type PermissionCreateInput = z.infer<typeof permissionCreateSchema>;
export type PermissionUpdateInput = z.infer<typeof permissionUpdateSchema>;
export type UserRoleCreateInput = z.infer<typeof userRoleCreateSchema>;
export type AbacPolicyCreateInput = z.infer<typeof abacPolicyCreateSchema>;
export type AbacPolicyUpdateInput = z.infer<typeof abacPolicyUpdateSchema>;
export type AccessValidationInput = z.infer<typeof accessValidationSchema>;
export type IdParam = z.infer<typeof idParamSchema>;
export type MultipleIds = z.infer<typeof multipleIdsSchema>;
export type PaginationParams = z.infer<typeof paginationSchema>;
export type SearchParams = z.infer<typeof searchSchema>;
export type SearchWithPaginationParams = z.infer<typeof searchWithPaginationSchema>;