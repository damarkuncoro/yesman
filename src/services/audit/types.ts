import { z } from "zod";
import type { AccessLog, PolicyViolation, ChangeHistory, Session, User } from "@/db/schema";

/**
 * Schema validasi untuk create access log
 */
export const createAccessLogSchema = z.object({
  userId: z.number().int().positive("User ID harus berupa integer positif"),
  path: z.string().min(1, "Path tidak boleh kosong"),
  method: z.string().min(1, "Method tidak boleh kosong"),
  decision: z.enum(["allow", "deny"], { message: "Decision harus 'allow' atau 'deny'" }),
  reason: z.string().optional(),
  userAgent: z.string().optional(),
  ipAddress: z.string().optional()
});

/**
 * Schema validasi untuk create policy violation
 */
export const createPolicyViolationSchema = z.object({
  userId: z.number().int().positive("User ID harus berupa integer positif"),
  featureId: z.number().int().positive("Feature ID harus berupa integer positif"),
  policyId: z.number().int().positive("Policy ID harus berupa integer positif"),
  attribute: z.string().min(1, "Attribute tidak boleh kosong"),
  expectedValue: z.string().min(1, "Expected value tidak boleh kosong"),
  actualValue: z.string().min(1, "Actual value tidak boleh kosong"),
  reason: z.string().optional()
});

/**
 * Schema validasi untuk create change history
 */
export const createChangeHistorySchema = z.object({
  adminUserId: z.number().int().positive("Admin User ID harus berupa integer positif"),
  targetUserId: z.number().int().positive("Target User ID harus berupa integer positif"),
  action: z.string().min(1, "Action tidak boleh kosong"),
  oldValue: z.string().optional(),
  newValue: z.string().optional(),
  reason: z.string().optional()
});

/**
 * Interface untuk audit statistics
 */
export interface AuditStats {
  accessLogs: {
    total: number;
    allowed: number;
    denied: number;
    uniqueUsers: number;
  };
  policyViolations: {
    total: number;
    uniqueUsers: number;
    uniqueFeatures: number;
  };
  changeHistory: {
    total: number;
    uniqueAdmins: number;
    uniqueTargets: number;
  };
  sessions: {
    total: number;
    active: number;
    expired: number;
  };
}

/**
 * Interface untuk audit filters
 */
export interface AuditFilters {
  userId?: number;
  featureId?: number;
  startDate?: Date;
  endDate?: Date;
  limit?: number;
  offset?: number;
}

/**
 * Interface untuk enriched change history dengan user data
 */
export interface EnrichedChangeHistory extends ChangeHistory {
  adminUser?: {
    id: number;
    name: string;
    email: string;
    department?: string;
    region?: string;
  };
  targetUser?: {
    id: number;
    name: string;
    email: string;
    department?: string;
    region?: string;
  };
}

/**
 * Interface untuk session log format
 */
export interface SessionLog {
  id: string;
  userId: number;
  user?: {
    id: number;
    name: string;
    email: string;
    department?: string;
    region?: string;
  };
  action: 'login' | 'logout';
  timestamp: Date;
  ipAddress?: string;
  userAgent?: string;
  sessionId: string;
  expiresAt: Date;
  isActive: boolean;
}

/**
 * Interface untuk cleanup result
 */
export interface CleanupResult {
  accessLogs: number;
  policyViolations: number;
  changeHistory: number;
  sessions: number;
}

/**
 * Type untuk audit log types
 */
export type AuditLogType = 'access' | 'policy_violation' | 'change_history' | 'session';

/**
 * Type untuk access decision
 */
export type AccessDecision = 'allow' | 'deny';

/**
 * Type untuk session action
 */
export type SessionAction = 'login' | 'logout';

// Re-export types from schema for convenience
export type { AccessLog, PolicyViolation, ChangeHistory, Session, User };

// Type inference dari schema
export type CreateAccessLogData = z.infer<typeof createAccessLogSchema>;
export type CreatePolicyViolationData = z.infer<typeof createPolicyViolationSchema>;
export type CreateChangeHistoryData = z.infer<typeof createChangeHistorySchema>;