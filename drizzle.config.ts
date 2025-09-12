import type { Config } from "drizzle-kit";

/**
 * Konfigurasi Drizzle Kit untuk migration dan introspection
 * Menggunakan PostgreSQL sebagai database driver
 */
export default {
  schema: "./src/db/schema.ts",
  out: "./drizzle",
  dialect: "postgresql",
  dbCredentials: {
    url: process.env.DATABASE_URL || "postgresql://yesman_user:yesman_password@localhost:5432/yesman_db",
  },
  verbose: true,
  strict: true,
} satisfies Config;