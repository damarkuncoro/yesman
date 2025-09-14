import { Pool } from "pg";
import { drizzle } from "drizzle-orm/node-postgres";
import * as schema from "./schema";

/**
 * Inisialisasi koneksi database PostgreSQL
 * Menggunakan pg (node-postgres) untuk koneksi ke PostgreSQL
 * Skip initialization saat build time untuk menghindari error
 */
let pool: Pool | null = null;

// Hanya inisialisasi database jika bukan saat build time
if (process.env.NODE_ENV !== 'production' || process.env.SKIP_DB_INIT !== 'true') {
  try {
    console.log('🔄 Initializing database connection...');
    
    /**
     * Konfigurasi connection pool PostgreSQL
     * Menggunakan environment variables untuk kredensial database
     */
    pool = new Pool({
      connectionString: process.env.DATABASE_URL || "postgresql://yesman_user:yesman_password@localhost:5432/yesman_db",
      // Konfigurasi connection pool untuk performa optimal
      max: 20,                    // Maximum number of clients in the pool
      idleTimeoutMillis: 30000,   // Close idle clients after 30 seconds
      connectionTimeoutMillis: 2000, // Return an error after 2 seconds if connection could not be established
      maxUses: 7500,              // Close (and replace) a connection after it has been used 7500 times
    });
    
    // Test koneksi database
    pool.on('error', (err) => {
      console.error('❌ Unexpected error on idle client', err);
    });
    
    console.log('✅ Database initialization completed successfully');
    
  } catch (error) {
    console.warn('⚠️ Database initialization skipped during build:', error);
    pool = null;
  }
} else {
  console.log('⏭️ Database initialization skipped (build time)');
}

export const db = pool ? drizzle(pool, { schema }) : null;

/**
 * Fungsi untuk menutup koneksi database
 * Berguna untuk cleanup saat aplikasi shutdown
 */
export const closeDatabase = async () => {
  if (pool) {
    await pool.end();
  }
};

/**
 * Export schema untuk digunakan di layer lain
 */
export * from "./schema";