const bcrypt = require('bcryptjs');
const { Pool } = require('pg');

// Konfigurasi database
const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://yesman_user:yesman_password@localhost:5432/yesman_db'
});

async function debugBcrypt() {
  try {
    console.log('🔍 Debug bcrypt untuk user admin@company.com');
    
    // Ambil data user dari database
    const userQuery = 'SELECT id, email, password_hash FROM users WHERE email = $1';
    const userResult = await pool.query(userQuery, ['admin@company.com']);
    
    if (userResult.rows.length === 0) {
      console.log('❌ User admin@company.com tidak ditemukan');
      return;
    }
    
    const user = userResult.rows[0];
    console.log('👤 User ditemukan:', {
      id: user.id,
      email: user.email,
      passwordHash: user.password_hash.substring(0, 20) + '...'
    });
    
    // Test password dengan bcryptjs
    const testPassword = 'admin123';
    console.log('\n🧪 Testing password:', testPassword);
    
    try {
      const isValid = await bcrypt.compare(testPassword, user.password_hash);
      console.log('✅ bcrypt.compare result:', isValid);
    } catch (error) {
      console.log('❌ bcrypt.compare error:', error.message);
      console.log('Error details:', error);
    }
    
    // Test hash baru untuk perbandingan
    console.log('\n🔨 Creating new hash for comparison...');
    const newHash = await bcrypt.hash(testPassword, 12);
    console.log('New hash:', newHash.substring(0, 20) + '...');
    
    const newHashValid = await bcrypt.compare(testPassword, newHash);
    console.log('New hash validation:', newHashValid);
    
    // Cek format hash yang ada
    console.log('\n📊 Hash analysis:');
    console.log('Current hash length:', user.password_hash.length);
    console.log('Current hash starts with:', user.password_hash.substring(0, 7));
    console.log('Expected bcrypt format: $2a$, $2b$, or $2y$');
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await pool.end();
  }
}

debugBcrypt();