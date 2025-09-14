const bcrypt = require('bcrypt');
const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://yesman_user:yesman_password@localhost:5432/yesman_db'
});

async function verifyPassword() {
  try {
    // Ambil password hash dari database
    const result = await pool.query('SELECT password_hash FROM users WHERE email = $1', ['admin@company.com']);
    
    if (result.rows.length === 0) {
      console.log('❌ User admin@company.com tidak ditemukan');
      return;
    }
    
    const storedHash = result.rows[0].password_hash;
    const passwordToTest = 'admin123';
    
    console.log('🔍 Testing password:', passwordToTest);
    console.log('🔑 Stored hash:', storedHash);
    
    // Verifikasi password
    const isValid = await bcrypt.compare(passwordToTest, storedHash);
    
    if (isValid) {
      console.log('✅ Password COCOK! admin123 adalah password yang benar');
    } else {
      console.log('❌ Password TIDAK COCOK! admin123 bukan password yang benar');
      
      // Coba beberapa password umum lainnya
      const commonPasswords = ['admin', 'password', 'admin@123', 'Admin123', 'administrator'];
      
      console.log('\n🔍 Mencoba password umum lainnya...');
      for (const pwd of commonPasswords) {
        const testResult = await bcrypt.compare(pwd, storedHash);
        if (testResult) {
          console.log(`✅ Password yang benar adalah: ${pwd}`);
          return;
        }
      }
      
      console.log('❌ Tidak ada password umum yang cocok');
    }
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await pool.end();
  }
}

verifyPassword();