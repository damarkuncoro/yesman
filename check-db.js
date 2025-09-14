const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://yesman_user:yesman_password@localhost:5432/yesman_db'
});

async function checkDatabase() {
  try {
    console.log('=== ALL USERS ===');
    const usersResult = await pool.query('SELECT id, email, name, active FROM users ORDER BY id');
    console.log('Users:', usersResult.rows);
    
    console.log('\n=== CHECK ADMIN USER ===');
    const adminResult = await pool.query('SELECT * FROM users WHERE email = $1', ['admin@company.com']);
    console.log('Admin user:', adminResult.rows);
    
    console.log('\n=== USER COUNT ===');
    const countResult = await pool.query('SELECT COUNT(*) as total FROM users');
    console.log('Total users:', countResult.rows[0].total);
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await pool.end();
  }
}

checkDatabase();