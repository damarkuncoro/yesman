-- Migration: Add ABAC (Attribute-Based Access Control) support
-- Date: 2024-01-10
-- Description: Menambahkan user attributes dan policies table untuk Hybrid RBAC + ABAC

-- Tambahkan ABAC attributes ke tabel users
ALTER TABLE "users" ADD COLUMN "department" VARCHAR(100);
ALTER TABLE "users" ADD COLUMN "region" VARCHAR(100);
ALTER TABLE "users" ADD COLUMN "level" INTEGER;

-- Buat tabel policies untuk ABAC rules
CREATE TABLE IF NOT EXISTS "policies" (
	"id" SERIAL PRIMARY KEY NOT NULL,
	"feature_id" INTEGER NOT NULL,
	"attribute" VARCHAR(100) NOT NULL,
	"operator" VARCHAR(10) NOT NULL,
	"value" TEXT NOT NULL,
	"created_at" TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- Tambahkan foreign key constraint
DO $$ BEGIN
 ALTER TABLE "policies" ADD CONSTRAINT "policies_feature_id_features_id_fk" FOREIGN KEY ("feature_id") REFERENCES "features"("id") ON DELETE CASCADE;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

-- Tambahkan index untuk performa query ABAC
CREATE INDEX IF NOT EXISTS "idx_policies_feature_id" ON "policies" ("feature_id");
CREATE INDEX IF NOT EXISTS "idx_policies_attribute" ON "policies" ("attribute");
CREATE INDEX IF NOT EXISTS "idx_users_department" ON "users" ("department");
CREATE INDEX IF NOT EXISTS "idx_users_region" ON "users" ("region");
CREATE INDEX IF NOT EXISTS "idx_users_level" ON "users" ("level");

-- Tambahkan constraint untuk operator yang valid
ALTER TABLE "policies" ADD CONSTRAINT "policies_operator_check" 
  CHECK ("operator" IN ('==', '!=', '>', '>=', '<', '<=', 'in'));

-- Tambahkan constraint untuk attribute yang valid
ALTER TABLE "policies" ADD CONSTRAINT "policies_attribute_check" 
  CHECK ("attribute" IN ('department', 'region', 'level'));

-- Tambahkan comment untuk dokumentasi
COMMENT ON TABLE "policies" IS 'Tabel untuk menyimpan aturan ABAC (Attribute-Based Access Control)';
COMMENT ON COLUMN "policies"."attribute" IS 'Atribut user yang akan dievaluasi: department, region, level';
COMMENT ON COLUMN "policies"."operator" IS 'Operator perbandingan: ==, !=, >, >=, <, <=, in';
COMMENT ON COLUMN "policies"."value" IS 'Nilai yang akan dibandingkan dengan atribut user';
COMMENT ON COLUMN "users"."department" IS 'Department/divisi user untuk ABAC';
COMMENT ON COLUMN "users"."region" IS 'Region/wilayah user untuk ABAC';
COMMENT ON COLUMN "users"."level" IS 'Level/grade user untuk ABAC (1-10)';