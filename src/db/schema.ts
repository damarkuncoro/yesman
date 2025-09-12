import { pgTable, serial, integer, varchar, text, boolean, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { z } from "zod";
import { relations } from "drizzle-orm";

/**
 * Tabel users untuk menyimpan data pengguna
 * Menggunakan PostgreSQL dengan serial primary key
 * Ditambahkan ABAC attributes: department, region, level
 */
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 100 }).notNull(),
  email: varchar("email", { length: 255 }).notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  active: boolean("active").default(true),
  rolesUpdatedAt: timestamp("roles_updated_at", { withTimezone: true }),
  // ABAC attributes untuk attribute-based access control
  department: varchar("department", { length: 100 }),
  region: varchar("region", { length: 100 }),
  level: integer("level"), // seniority/grade level
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

/**
 * Tabel sessions untuk JWT token management
 * Menyimpan refresh tokens dan session data
 */
export const sessions = pgTable("sessions", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  refreshToken: text("refresh_token").notNull().unique(),
  expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

/**
 * Tabel roles untuk menyimpan role/peran dalam sistem
 */
export const roles = pgTable("roles", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 100 }).notNull().unique(),
  grantsAll: boolean("grants_all").default(false),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

/**
 * Tabel features untuk menyimpan fitur-fitur yang dapat diakses
 */
export const features = pgTable("features", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 100 }).notNull().unique(),
  description: text("description"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

/**
 * Tabel user_roles untuk many-to-many relationship antara users dan roles
 */
export const userRoles = pgTable("user_roles", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  roleId: integer("role_id").notNull().references(() => roles.id, { onDelete: "cascade" }),
});

/**
 * Tabel role_features untuk many-to-many relationship antara roles dan features
 * Dengan CRUD permissions per feature per role
 */
export const roleFeatures = pgTable("role_features", {
  id: serial("id").primaryKey(),
  roleId: integer("role_id").notNull().references(() => roles.id, { onDelete: "cascade" }),
  featureId: integer("feature_id").notNull().references(() => features.id, { onDelete: "cascade" }),
  canCreate: boolean("can_create").default(false),
  canRead: boolean("can_read").default(false),
  canUpdate: boolean("can_update").default(false),
  canDelete: boolean("can_delete").default(false),
});

/**
 * Tabel route_features untuk mapping route patterns ke features
 */
export const routeFeatures = pgTable("route_features", {
  id: serial("id").primaryKey(),
  path: varchar("path", { length: 255 }).notNull(),
  method: varchar("method", { length: 10 }),
  featureId: integer("feature_id").notNull().references(() => features.id, { onDelete: "cascade" }),
});

/**
 * Tabel policies untuk ABAC (Attribute-Based Access Control)
 * Menyimpan aturan akses berdasarkan atribut user
 */
export const policies = pgTable("policies", {
  id: serial("id").primaryKey(),
  featureId: integer("feature_id").notNull().references(() => features.id, { onDelete: "cascade" }),
  attribute: varchar("attribute", { length: 100 }).notNull(), // 'department', 'region', 'level'
  operator: varchar("operator", { length: 10 }).notNull(), // '==', '!=', '>', '>=', '<', '<=', 'in'
  value: text("value").notNull(), // 'Finance', 'Jakarta', '[1,2,3]'
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

/**
 * =====================
 * AUDIT & MONITORING
 * =====================
 */

/**
 * Tabel access_logs untuk mencatat semua akses ke fitur
 * Digunakan untuk audit trail dan monitoring
 */
export const accessLogs = pgTable("access_logs", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id, { onDelete: "set null" }),
  roleId: integer("role_id").references(() => roles.id, { onDelete: "set null" }),
  featureId: integer("feature_id").references(() => features.id, { onDelete: "set null" }),
  path: varchar("path", { length: 255 }).notNull(),
  method: varchar("method", { length: 10 }),
  decision: varchar("decision", { length: 10 }).notNull(), // 'allow' / 'deny'
  reason: text("reason"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

/**
 * Tabel policy_violations untuk mencatat pelanggaran policy ABAC
 * Digunakan untuk debugging dan security monitoring
 */
export const policyViolations = pgTable("policy_violations", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id, { onDelete: "set null" }),
  featureId: integer("feature_id").references(() => features.id, { onDelete: "set null" }),
  policyId: integer("policy_id").references(() => policies.id, { onDelete: "set null" }),
  attribute: varchar("attribute", { length: 100 }).notNull(),
  expectedValue: text("expected_value").notNull(),
  actualValue: text("actual_value"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

/**
 * Tabel change_history untuk mencatat perubahan pada user roles dan policies
 * Digunakan untuk audit trail perubahan konfigurasi
 */
export const changeHistory = pgTable("change_history", {
  id: serial("id").primaryKey(),
  adminUserId: integer("admin_user_id").references(() => users.id, { onDelete: "set null" }),
  targetUserId: integer("target_user_id").references(() => users.id, { onDelete: "set null" }),
  action: varchar("action", { length: 100 }).notNull(), // 'assignRole', 'revokeRole', 'updatePolicy', etc
  before: text("before"), // JSON string
  after: text("after"),   // JSON string
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

// Relations untuk Drizzle ORM
export const usersRelations = relations(users, ({ many }) => ({
  userRoles: many(userRoles),
  sessions: many(sessions),
  accessLogs: many(accessLogs),
  policyViolations: many(policyViolations),
  adminChangeHistory: many(changeHistory, { relationName: "adminChanges" }),
  targetChangeHistory: many(changeHistory, { relationName: "targetChanges" }),
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

export const userRolesRelations = relations(userRoles, ({ one }) => ({
  user: one(users, {
    fields: [userRoles.userId],
    references: [users.id],
  }),
  role: one(roles, {
    fields: [userRoles.roleId],
    references: [roles.id],
  }),
}));

export const roleFeaturesRelations = relations(roleFeatures, ({ one }) => ({
  role: one(roles, {
    fields: [roleFeatures.roleId],
    references: [roles.id],
  }),
  feature: one(features, {
    fields: [roleFeatures.featureId],
    references: [features.id],
  }),
}));

export const routeFeaturesRelations = relations(routeFeatures, ({ one }) => ({
  feature: one(features, {
    fields: [routeFeatures.featureId],
    references: [features.id],
  }),
}));

export const sessionsRelations = relations(sessions, ({ one }) => ({
  user: one(users, {
    fields: [sessions.userId],
    references: [users.id],
  }),
}));

export const policiesRelations = relations(policies, ({ one, many }) => ({
  feature: one(features, {
    fields: [policies.featureId],
    references: [features.id],
  }),
  policyViolations: many(policyViolations),
}));

// Relations untuk audit tables
export const accessLogsRelations = relations(accessLogs, ({ one }) => ({
  user: one(users, {
    fields: [accessLogs.userId],
    references: [users.id],
  }),
  role: one(roles, {
    fields: [accessLogs.roleId],
    references: [roles.id],
  }),
  feature: one(features, {
    fields: [accessLogs.featureId],
    references: [features.id],
  }),
}));

export const policyViolationsRelations = relations(policyViolations, ({ one }) => ({
  user: one(users, {
    fields: [policyViolations.userId],
    references: [users.id],
  }),
  feature: one(features, {
    fields: [policyViolations.featureId],
    references: [features.id],
  }),
  policy: one(policies, {
    fields: [policyViolations.policyId],
    references: [policies.id],
  }),
}));

export const changeHistoryRelations = relations(changeHistory, ({ one }) => ({
  adminUser: one(users, {
    fields: [changeHistory.adminUserId],
    references: [users.id],
    relationName: "adminChanges",
  }),
  targetUser: one(users, {
    fields: [changeHistory.targetUserId],
    references: [users.id],
    relationName: "targetChanges",
  }),
}));

// Zod schemas untuk validasi
export const insertUserSchema = createInsertSchema(users, {
  name: z.string().min(3, "Nama minimal 3 karakter").max(100, "Nama maksimal 100 karakter"),
  email: z.string().email("Format email tidak valid"),
  passwordHash: z.string().min(1, "Password hash diperlukan"),
  department: z.string().max(100, "Department maksimal 100 karakter").optional(),
  region: z.string().max(100, "Region maksimal 100 karakter").optional(),
  level: z.number().int().min(1, "Level minimal 1").max(10, "Level maksimal 10").optional(),
});

export const selectUserSchema = createSelectSchema(users);
export const insertSessionSchema = createInsertSchema(sessions);
export const selectSessionSchema = createSelectSchema(sessions);

// RBAC Zod schemas
export const insertRoleSchema = createInsertSchema(roles, {
  name: z.string().min(1, "Nama role diperlukan").max(100, "Nama role maksimal 100 karakter"),
});

export const selectRoleSchema = createSelectSchema(roles);

export const insertFeatureSchema = createInsertSchema(features, {
  name: z.string().min(1, "Nama feature diperlukan").max(100, "Nama feature maksimal 100 karakter"),
});

export const selectFeatureSchema = createSelectSchema(features);
export const insertUserRoleSchema = createInsertSchema(userRoles);
export const selectUserRoleSchema = createSelectSchema(userRoles);
export const insertRoleFeatureSchema = createInsertSchema(roleFeatures);
export const selectRoleFeatureSchema = createSelectSchema(roleFeatures);
export const insertRouteFeatureSchema = createInsertSchema(routeFeatures);
export const selectRouteFeatureSchema = createSelectSchema(routeFeatures);

// ABAC Policy schemas
export const insertPolicySchema = createInsertSchema(policies, {
  attribute: z.string().min(1, "Attribute diperlukan").max(100, "Attribute maksimal 100 karakter"),
  operator: z.enum(["==", "!=", ">", ">=", "<", "<=", "in"], {
    message: "Operator harus salah satu dari: ==, !=, >, >=, <, <=, in",
  }),
  value: z.string().min(1, "Value diperlukan"),
});

export const selectPolicySchema = createSelectSchema(policies);

// Audit tables schemas
export const insertAccessLogSchema = createInsertSchema(accessLogs, {
  path: z.string().min(1, "Path diperlukan").max(255, "Path maksimal 255 karakter"),
  method: z.string().max(10, "Method maksimal 10 karakter").optional(),
  decision: z.enum(["allow", "deny"], {
    message: "Decision harus 'allow' atau 'deny'",
  }),
  reason: z.string().optional(),
});

export const selectAccessLogSchema = createSelectSchema(accessLogs);

export const insertPolicyViolationSchema = createInsertSchema(policyViolations, {
  attribute: z.string().min(1, "Attribute diperlukan").max(100, "Attribute maksimal 100 karakter"),
  expectedValue: z.string().min(1, "Expected value diperlukan"),
  actualValue: z.string().optional(),
});

export const selectPolicyViolationSchema = createSelectSchema(policyViolations);

export const insertChangeHistorySchema = createInsertSchema(changeHistory, {
  action: z.string().min(1, "Action diperlukan").max(100, "Action maksimal 100 karakter"),
  before: z.string().optional(), // JSON string
  after: z.string().optional(),  // JSON string
});

export const selectChangeHistorySchema = createSelectSchema(changeHistory);

// Types untuk TypeScript
export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
export type Session = typeof sessions.$inferSelect;
export type NewSession = typeof sessions.$inferInsert;

// RBAC Types
export type Role = typeof roles.$inferSelect;
export type NewRole = typeof roles.$inferInsert;
export type Feature = typeof features.$inferSelect;
export type NewFeature = typeof features.$inferInsert;
export type UserRole = typeof userRoles.$inferSelect;
export type NewUserRole = typeof userRoles.$inferInsert;
export type RoleFeature = typeof roleFeatures.$inferSelect;
export type NewRoleFeature = typeof roleFeatures.$inferInsert;
export type RouteFeature = typeof routeFeatures.$inferSelect;
export type NewRouteFeature = typeof routeFeatures.$inferInsert;
export type Policy = typeof policies.$inferSelect;
export type NewPolicy = typeof policies.$inferInsert;
export type AccessLog = typeof accessLogs.$inferSelect;
export type NewAccessLog = typeof accessLogs.$inferInsert;
export type PolicyViolation = typeof policyViolations.$inferSelect;
export type NewPolicyViolation = typeof policyViolations.$inferInsert;
export type ChangeHistory = typeof changeHistory.$inferSelect;
export type NewChangeHistory = typeof changeHistory.$inferInsert;

// Validation schemas untuk API
export const createUserSchema = z.object({
  name: z.string().min(3, "Nama minimal 3 karakter").max(100, "Nama maksimal 100 karakter"),
  email: z.string().email("Format email tidak valid"),
  password: z.string().min(8, "Password minimal 8 karakter"),
  // ABAC attributes (optional)
  department: z.string().max(100, "Department maksimal 100 karakter").optional(),
  region: z.string().max(100, "Region maksimal 100 karakter").optional(),
  level: z.number().int().min(1, "Level minimal 1").max(10, "Level maksimal 10").optional(),
});

export const loginSchema = z.object({
  email: z.string().email("Format email tidak valid"),
  password: z.string().min(1, "Password diperlukan"),
});

// RBAC API schemas
export const createRoleSchema = z.object({
  name: z.string().min(1, "Nama role diperlukan").max(100, "Nama role maksimal 100 karakter"),
  grantsAll: z.boolean().optional().default(false),
});

export const createFeatureSchema = z.object({
  name: z.string().min(1, "Nama feature diperlukan").max(100, "Nama feature maksimal 100 karakter"),
  description: z.string().optional(),
});

export const assignRoleSchema = z.object({
  userId: z.number().int().positive("User ID harus berupa integer positif"),
  roleId: z.number().int().positive("Role ID harus berupa integer positif"),
});

export const setRoleFeatureSchema = z.object({
  roleId: z.number().int().positive("Role ID harus berupa integer positif"),
  featureId: z.number().int().positive("Feature ID harus berupa integer positif"),
  canCreate: z.boolean().optional().default(false),
  canRead: z.boolean().optional().default(false),
  canUpdate: z.boolean().optional().default(false),
  canDelete: z.boolean().optional().default(false),
});

export const createRouteFeatureSchema = z.object({
  path: z.string().min(1, "Path diperlukan"),
  method: z.string().optional(),
  featureId: z.number().int().positive("Feature ID harus berupa integer positif"),
});

// ABAC Policy API schema
export const createPolicySchema = z.object({
  featureId: z.number().int().positive("Feature ID harus berupa integer positif"),
  attribute: z.enum(["department", "region", "level"], {
    message: "Attribute harus salah satu dari: department, region, level",
  }),
  operator: z.enum(["==", "!=", ">", ">=", "<", "<=", "in"], {
    message: "Operator harus salah satu dari: ==, !=, >, >=, <, <=, in",
  }),
  value: z.string().min(1, "Value diperlukan"),
});

// Update user ABAC attributes schema
export const updateUserAbacSchema = z.object({
  department: z.string().max(100, "Department maksimal 100 karakter").optional(),
  region: z.string().max(100, "Region maksimal 100 karakter").optional(),
  level: z.number().int().min(1, "Level minimal 1").max(10, "Level maksimal 10").optional(),
});

// Audit API schemas
export const createAccessLogSchema = z.object({
  userId: z.number().int().positive("User ID harus berupa integer positif").optional(),
  roleId: z.number().int().positive("Role ID harus berupa integer positif").optional(),
  featureId: z.number().int().positive("Feature ID harus berupa integer positif").optional(),
  path: z.string().min(1, "Path diperlukan").max(255, "Path maksimal 255 karakter"),
  method: z.string().max(10, "Method maksimal 10 karakter").optional(),
  decision: z.enum(["allow", "deny"], {
    message: "Decision harus 'allow' atau 'deny'",
  }),
  reason: z.string().optional(),
});

export const createPolicyViolationSchema = z.object({
  userId: z.number().int().positive("User ID harus berupa integer positif").optional(),
  featureId: z.number().int().positive("Feature ID harus berupa integer positif").optional(),
  policyId: z.number().int().positive("Policy ID harus berupa integer positif").optional(),
  attribute: z.string().min(1, "Attribute diperlukan").max(100, "Attribute maksimal 100 karakter"),
  expectedValue: z.string().min(1, "Expected value diperlukan"),
  actualValue: z.string().optional(),
});

export const createChangeHistorySchema = z.object({
  adminUserId: z.number().int().positive("Admin User ID harus berupa integer positif").optional(),
  targetUserId: z.number().int().positive("Target User ID harus berupa integer positif").optional(),
  action: z.enum(["assignRole", "revokeRole", "updatePolicy", "createPolicy", "deletePolicy", "updateUser"], {
    message: "Action harus salah satu dari: assignRole, revokeRole, updatePolicy, createPolicy, deletePolicy, updateUser",
  }),
  before: z.string().optional(), // JSON string
  after: z.string().optional(),  // JSON string
});

export type CreateUserInput = z.infer<typeof createUserSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type CreateRoleInput = z.infer<typeof createRoleSchema>;
export type CreateFeatureInput = z.infer<typeof createFeatureSchema>;
export type AssignRoleInput = z.infer<typeof assignRoleSchema>;
export type SetRoleFeatureInput = z.infer<typeof setRoleFeatureSchema>;
export type CreateRouteFeatureInput = z.infer<typeof createRouteFeatureSchema>;
// ABAC types
export type CreatePolicyInput = z.infer<typeof createPolicySchema>;
export type UpdateUserAbacInput = z.infer<typeof updateUserAbacSchema>;

// Audit types
export type CreateAccessLogInput = z.infer<typeof createAccessLogSchema>;
export type CreatePolicyViolationInput = z.infer<typeof createPolicyViolationSchema>;
export type CreateChangeHistoryInput = z.infer<typeof createChangeHistorySchema>;