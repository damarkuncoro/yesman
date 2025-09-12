-- Migration: Add Audit Tables
-- Date: 2024-01-10
-- Description: Menambahkan 3 audit tables untuk monitoring dan logging

-- Tabel access_logs untuk mencatat semua akses ke fitur
CREATE TABLE IF NOT EXISTS "access_logs" (
	"id" SERIAL PRIMARY KEY NOT NULL,
	"user_id" INTEGER,
	"role_id" INTEGER,
	"feature_id" INTEGER,
	"path" VARCHAR(255) NOT NULL,
	"method" VARCHAR(10),
	"decision" VARCHAR(10) NOT NULL,
	"reason" TEXT,
	"created_at" TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- Tabel policy_violations untuk mencatat pelanggaran policy ABAC
CREATE TABLE IF NOT EXISTS "policy_violations" (
	"id" SERIAL PRIMARY KEY NOT NULL,
	"user_id" INTEGER,
	"feature_id" INTEGER,
	"policy_id" INTEGER,
	"attribute" VARCHAR(100) NOT NULL,
	"expected_value" TEXT NOT NULL,
	"actual_value" TEXT,
	"created_at" TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- Tabel change_history untuk mencatat perubahan konfigurasi
CREATE TABLE IF NOT EXISTS "change_history" (
	"id" SERIAL PRIMARY KEY NOT NULL,
	"admin_user_id" INTEGER,
	"target_user_id" INTEGER,
	"action" VARCHAR(100) NOT NULL,
	"before" TEXT,
	"after" TEXT,
	"created_at" TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- Tambahkan foreign key constraints
DO $$ BEGIN
 ALTER TABLE "access_logs" ADD CONSTRAINT "access_logs_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE SET NULL;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
 ALTER TABLE "access_logs" ADD CONSTRAINT "access_logs_role_id_roles_id_fk" FOREIGN KEY ("role_id") REFERENCES "roles"("id") ON DELETE SET NULL;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
 ALTER TABLE "access_logs" ADD CONSTRAINT "access_logs_feature_id_features_id_fk" FOREIGN KEY ("feature_id") REFERENCES "features"("id") ON DELETE SET NULL;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
 ALTER TABLE "policy_violations" ADD CONSTRAINT "policy_violations_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE SET NULL;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
 ALTER TABLE "policy_violations" ADD CONSTRAINT "policy_violations_feature_id_features_id_fk" FOREIGN KEY ("feature_id") REFERENCES "features"("id") ON DELETE SET NULL;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
 ALTER TABLE "policy_violations" ADD CONSTRAINT "policy_violations_policy_id_policies_id_fk" FOREIGN KEY ("policy_id") REFERENCES "policies"("id") ON DELETE SET NULL;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
 ALTER TABLE "change_history" ADD CONSTRAINT "change_history_admin_user_id_users_id_fk" FOREIGN KEY ("admin_user_id") REFERENCES "users"("id") ON DELETE SET NULL;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
 ALTER TABLE "change_history" ADD CONSTRAINT "change_history_target_user_id_users_id_fk" FOREIGN KEY ("target_user_id") REFERENCES "users"("id") ON DELETE SET NULL;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

-- Tambahkan index untuk performa query
CREATE INDEX IF NOT EXISTS "idx_access_logs_user_id" ON "access_logs" ("user_id");
CREATE INDEX IF NOT EXISTS "idx_access_logs_feature_id" ON "access_logs" ("feature_id");
CREATE INDEX IF NOT EXISTS "idx_access_logs_decision" ON "access_logs" ("decision");
CREATE INDEX IF NOT EXISTS "idx_access_logs_created_at" ON "access_logs" ("created_at");

CREATE INDEX IF NOT EXISTS "idx_policy_violations_user_id" ON "policy_violations" ("user_id");
CREATE INDEX IF NOT EXISTS "idx_policy_violations_policy_id" ON "policy_violations" ("policy_id");
CREATE INDEX IF NOT EXISTS "idx_policy_violations_created_at" ON "policy_violations" ("created_at");

CREATE INDEX IF NOT EXISTS "idx_change_history_admin_user_id" ON "change_history" ("admin_user_id");
CREATE INDEX IF NOT EXISTS "idx_change_history_target_user_id" ON "change_history" ("target_user_id");
CREATE INDEX IF NOT EXISTS "idx_change_history_action" ON "change_history" ("action");
CREATE INDEX IF NOT EXISTS "idx_change_history_created_at" ON "change_history" ("created_at");