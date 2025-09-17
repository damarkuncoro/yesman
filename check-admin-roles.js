const { Pool } = require('pg');

// Konfigurasi database dari environment variables atau default
const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432'),
  database: process.env.DB_NAME || 'yesman_db',
  user: process.env.DB_USER || 'yesman_user',
  password: process.env.DB_PASSWORD || 'yesman_password',
});

async function checkAdminRoles() {
  try {
    console.log('Connecting to database...');
    const client = await pool.connect();
    
    // Query untuk mengambil user admin
    const userResult = await client.query(
      'SELECT id, name, email, active FROM users WHERE email = $1',
      ['admin@example.com']
    );
    
    if (userResult.rows.length === 0) {
      console.log('❌ Admin user not found');
      client.release();
      await pool.end();
      return;
    }
    
    const adminUser = userResult.rows[0];
    console.log('✅ Admin user found:', adminUser);
    
    // Query untuk mengambil roles user admin
    const rolesResult = await client.query(`
      SELECT r.id, r.name, r.grants_all
      FROM user_roles ur
      JOIN roles r ON ur.role_id = r.id
      WHERE ur.user_id = $1
      ORDER BY r.name
    `, [adminUser.id]);
    
    console.log(`\n📋 Admin user has ${rolesResult.rows.length} roles:`);
    rolesResult.rows.forEach(role => {
      console.log(`  - ${role.name} (grants_all: ${role.grants_all})`);
    });
    
    // Cek apakah ada role dengan grants_all = true
    const hasFullAccess = rolesResult.rows.some(role => role.grants_all);
    console.log(`\n🔐 Has full access (grants_all): ${hasFullAccess ? '✅ YES' : '❌ NO'}`);
    
    client.release();
    await pool.end();
  } catch (error) {
    console.error('❌ Error checking admin roles:', error);
    process.exit(1);
  }
}

checkAdminRoles();