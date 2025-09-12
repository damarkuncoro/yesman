import { pgTable, serial, integer, varchar, text, boolean, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { z } from "zod";
import { relations } from "drizzle-orm";

/**
 * =====================
 * USERS & SESSIONS
 * =====================
 */
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 100 }).notNull(),
  email: varchar("email", { length: 255 }).notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  active: boolean("active").default(true),
  rolesUpdatedAt: timestamp("roles_updated_at", { withTimezone: true }),
  // ABAC attributes
  department: varchar("department", { length: 100 }),
  region: varchar("region", { length: 100 }),
  level: integer("level"), // seniority/grade
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

export const sessions = pgTable("sessions", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  refreshToken: text("refresh_token").notNull().unique(),
  expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

/**
 * =====================
 * RBAC CORE
 * =====================
 */
export const roles = pgTable("roles", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 100 }).notNull().unique(),
  grantsAll: boolean("grants_all").default(false),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export const features = pgTable("features", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 100 }).notNull().unique(),
  description: text("description"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export const userRoles = pgTable("user_roles", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  roleId: integer("role_id").notNull().references(() => roles.id, { onDelete: "cascade" }),
});

export const roleFeatures = pgTable("role_features", {
  id: serial("id").primaryKey(),
  roleId: integer("role_id").notNull().references(() => roles.id, { onDelete: "cascade" }),
  featureId: integer("feature_id").notNull().references(() => features.id, { onDelete: "cascade" }),
  canCreate: boolean("can_create").default(false),
  canRead: boolean("can_read").default(false),
  canUpdate: boolean("can_update").default(false),
  canDelete: boolean("can_delete").default(false),
});

export const routeFeatures = pgTable("route_features", {
  id: serial("id").primaryKey(),
  path: varchar("path", { length: 255 }).notNull(),
  method: varchar("method", { length: 10 }),
  featureId: integer("feature_id").notNull().references(() => features.id, { onDelete: "cascade" }),
});

/**
 * =====================
 * ABAC POLICIES
 * =====================
 */
export const policies = pgTable("policies", {
  id: serial("id").primaryKey(),
  featureId: integer("feature_id").notNull().references(() => features.id, { onDelete: "cascade" }),
  attribute: varchar("attribute", { length: 100 }).notNull(), // department, region, level
  operator: varchar("operator", { length: 10 }).notNull(),    // ==, !=, >, >=, <, <=, in
  value: text("value").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

/**
 * =====================
 * AUDIT & MONITORING
 * =====================
 */
export const accessLogs = pgTable("access_logs", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id, { onDelete: "set null" }),
  roleId: integer("role_id").references(() => roles.id, { onDelete: "set null" }),
  featureId: integer("feature_id").references(() => features.id, { onDelete: "set null" }),
  path: varchar("path", { length: 255 }).notNull(),
  method: varchar("method", { length: 10 }),
  decision: varchar("decision", { length: 10 }).notNull(), // allow / deny
  reason: text("reason"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export const policyViolations = pgTable("policy_violations", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id, { onDelete: "set null" }),
  featureId: integer("feature_id").references(() => features.id, { onDelete: "set null" }),
  policyId: integer("policy_id").references(() => policies.id, { onDelete: "set null" }),
  attribute: varchar("attribute", { length: 100 }).notNull(),
  expectedValue: text("expected_value").notNull(),
  actualValue: text("actual_value"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export const changeHistory = pgTable("change_history", {
  id: serial("id").primaryKey(),
  adminUserId: integer("admin_user_id").references(() => users.id, { onDelete: "set null" }),
  targetUserId: integer("target_user_id").references(() => users.id, { onDelete: "set null" }),
  action: varchar("action", { length: 100 }).notNull(), // assignRole, revokeRole, updatePolicy, etc
  before: text("before"), // JSON string
  after: text("after"),   // JSON string
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

/**
 * =====================
 * RELATIONS
 * =====================
 */
export const usersRelations = relations(users, ({ many }) => ({
  userRoles: many(userRoles),
  sessions: many(sessions),
  accessLogs: many(accessLogs),
  changeHistory: many(changeHistory),
}));

export const rolesRelations = relations(roles, ({ many }) => ({
  userRoles: many(userRoles),
  roleFeatures: many(roleFeatures),
  accessLogs: many(accessLogs),
}));

export const featuresRelations = relations(features, ({ many }) => ({
  roleFeatures: many(roleFeatures),
  routeFeatures: many(routeFeatures),
  policies: many(policies),
  accessLogs: many(accessLogs),
  policyViolations: many(policyViolations),
}));

export const policiesRelations = relations(policies, ({ one }) => ({
  feature: one(features, {
    fields: [policies.featureId],
    references: [features.id],
  }),
}));

/**
 * =====================
 * ZOD SCHEMAS
 * =====================
 */
// User
export const insertUserSchema = createInsertSchema(users, {
  name: z.string().min(3).max(100),
  email: z.string().email(),
  passwordHash: z.string().min(1),
  department: z.string().max(100).optional(),
  region: z.string().max(100).optional(),
  level: z.number().int().min(1).max(10).optional(),
});
export const selectUserSchema = createSelectSchema(users);

// Session
export const insertSessionSchema = createInsertSchema(sessions);
export const selectSessionSchema = createSelectSchema(sessions);

// RBAC
export const insertRoleSchema = createInsertSchema(roles);
export const selectRoleSchema = createSelectSchema(roles);
export const insertFeatureSchema = createInsertSchema(features);
export const selectFeatureSchema = createSelectSchema(features);
export const insertUserRoleSchema = createInsertSchema(userRoles);
export const selectUserRoleSchema = createSelectSchema(userRoles);
export const insertRoleFeatureSchema = createInsertSchema(roleFeatures);
export const selectRoleFeatureSchema = createSelectSchema(roleFeatures);
export const insertRouteFeatureSchema = createInsertSchema(routeFeatures);
export const selectRouteFeatureSchema = createSelectSchema(routeFeatures);

// ABAC
export const insertPolicySchema = createInsertSchema(policies, {
  operator: z.enum(["==", "!=", ">", ">=", "<", "<=", "in"]),
});
export const selectPolicySchema = createSelectSchema(policies);

// Audit
export const insertAccessLogSchema = createInsertSchema(accessLogs);
export const selectAccessLogSchema = createSelectSchema(accessLogs);
export const insertPolicyViolationSchema = createInsertSchema(policyViolations);
export const selectPolicyViolationSchema = createSelectSchema(policyViolations);
export const insertChangeHistorySchema = createInsertSchema(changeHistory);
export const selectChangeHistorySchema = createSelectSchema(changeHistory);

/**
 * =====================
 * TYPES
 * =====================
 */
export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
export type Session = typeof sessions.$inferSelect;
export type Role = typeof roles.$inferSelect;
export type Feature = typeof features.$inferSelect;
export type Policy = typeof policies.$inferSelect;
export type AccessLog = typeof accessLogs.$inferSelect;
export type PolicyViolation = typeof policyViolations.$inferSelect;
export type ChangeHistory = typeof changeHistory.$inferSelect;
