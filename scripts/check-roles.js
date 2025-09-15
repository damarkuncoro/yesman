const { Pool } = require('pg');

// Konfigurasi database dari environment variables atau default
const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432'),
  database: process.env.DB_NAME || 'yesman_db',
  user: process.env.DB_USER || 'yesman_user',
  password: process.env.DB_PASSWORD || 'yesman_password',
});

async function checkRoles() {
  try {
    console.log('Connecting to database...');
    const client = await pool.connect();
    
    // Query untuk mengambil semua roles
    const result = await client.query('SELECT * FROM roles ORDER BY id');
    
    console.log(`Found ${result.rows.length} roles in database:`);
    console.log(result.rows);
    
    client.release();
    await pool.end();
  } catch (error) {
    console.error('Error checking roles:', error);
    process.exit(1);
  }
}

checkRoles();