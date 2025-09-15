const { Pool } = require('pg');
const bcrypt = require('bcrypt');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://yesman_user:yesman_password@localhost:5432/yesman_db'
});

async function createCompanyAdmin() {
  try {
    console.log('=== CREATING COMPANY ADMIN USER ===');
    
    // Hash password untuk company admin user
    const password = 'admin123';
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(password, saltRounds);
    
    // Cek apakah user admin@company.com sudah ada
    const existingUser = await pool.query('SELECT * FROM users WHERE email = $1', ['admin@company.com']);
    
    if (existingUser.rows.length > 0) {
      console.log('User admin@company.com sudah ada, akan update password...');
      
      // Update password user yang sudah ada
      await pool.query(
        'UPDATE users SET password_hash = $1, updated_at = NOW() WHERE email = $2',
        [hashedPassword, 'admin@company.com']
      );
      
      console.log('✅ Password user admin@company.com berhasil diupdate ke "admin123"');
    } else {
      console.log('User admin@company.com belum ada, akan membuat user baru...');
      
      // Buat user baru
      const result = await pool.query(
        `INSERT INTO users (name, email, password_hash, active, created_at, updated_at, department, region, level) 
         VALUES ($1, $2, $3, $4, NOW(), NOW(), $5, $6, $7) 
         RETURNING id, name, email`,
        ['Company Admin', 'admin@company.com', hashedPassword, true, 'Management', 'Jakarta', 5]
      );
      
      console.log('✅ User admin@company.com berhasil dibuat:', result.rows[0]);
    }
    
    // Verifikasi user
    const verifyUser = await pool.query('SELECT id, name, email, active FROM users WHERE email = $1', ['admin@company.com']);
    console.log('\n=== VERIFIKASI USER ===');
    console.log('Company Admin data:', verifyUser.rows[0]);
    
    console.log('\n=== INFO LOGIN ===');
    console.log('Email: admin@company.com');
    console.log('Password: admin123');
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await pool.end();
  }
}

createCompanyAdmin();