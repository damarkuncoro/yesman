import { z } from "zod";
import type { Policy, User } from "@/db/schema";

/**
 * Re-export types dari schema database
 */
export type { Policy, User } from "@/db/schema";

/**
 * Interface untuk data pembuatan policy baru
 */
export interface PolicyCreateInput {
  featureId: number;
  attribute: string;
  operator: string;
  value: string;
}

/**
 * Interface untuk update user ABAC attributes
 */
export interface UserAttributesUpdateInput {
  department?: string;
  region?: string;
  level?: number;
}

/**
 * Interface untuk hasil evaluasi policy
 */
export interface PolicyEvaluationResult {
  isValid: boolean;
  failedPolicies?: {
    policyId: number;
    attribute: string;
    operator: string;
    value: string;
    reason: string;
  }[];
}

/**
 * Interface untuk comparison result
 */
export interface ComparisonResult {
  success: boolean;
  result?: boolean;
  error?: string;
}

/**
 * Enum untuk supported ABAC operators
 */
export enum AbacOperator {
  EQUALS = "==",
  NOT_EQUALS = "!=",
  GREATER_THAN = ">",
  GREATER_THAN_OR_EQUAL = ">=",
  LESS_THAN = "<",
  LESS_THAN_OR_EQUAL = "<=",
  IN = "in"
}

/**
 * Enum untuk supported user attributes
 */
export enum UserAttribute {
  DEPARTMENT = "department",
  REGION = "region",
  LEVEL = "level"
}

/**
 * Schema validasi untuk create policy
 */
export const createPolicySchema = z.object({
  featureId: z.number().int().positive("Feature ID harus berupa integer positif"),
  attribute: z.string().min(1, "Attribute tidak boleh kosong"),
  operator: z.string().min(1, "Operator tidak boleh kosong"),
  value: z.string().min(1, "Value tidak boleh kosong")
});

/**
 * Schema validasi untuk update user attributes
 */
export const updateUserAttributesSchema = z.object({
  department: z.string().optional(),
  region: z.string().optional(),
  level: z.number().int().min(1).max(10).optional()
});

/**
 * Schema validasi untuk policy evaluation input
 */
export const policyEvaluationSchema = z.object({
  userId: z.number().int().positive("User ID harus berupa integer positif"),
  featureId: z.number().int().positive("Feature ID harus berupa integer positif")
});

/**
 * Type untuk validated input dari schema
 */
export type ValidatedPolicyCreateInput = z.infer<typeof createPolicySchema>;
export type ValidatedUserAttributesUpdateInput = z.infer<typeof updateUserAttributesSchema>;
export type ValidatedPolicyEvaluationInput = z.infer<typeof policyEvaluationSchema>;