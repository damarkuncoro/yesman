// Test bcrypt dengan import yang sama seperti di aplikasi
import bcrypt from 'bcryptjs';
import { Pool } from 'pg';

// Konfigurasi database
const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://yesman_user:yesman_password@localhost:5432/yesman_db'
});

async function testAppBcrypt() {
  try {
    console.log('🔍 Test bcrypt dengan import ES6 seperti di aplikasi');
    
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
    
    // Test password dengan bcryptjs (ES6 import)
    const testPassword = 'admin123';
    console.log('\n🧪 Testing password dengan ES6 import:', testPassword);
    
    try {
      console.log('🔄 Calling bcrypt.compare...');
      const isValid = await bcrypt.compare(testPassword, user.password_hash);
      console.log('✅ bcrypt.compare result:', isValid);
      
      if (!isValid) {
        console.log('❌ Password tidak cocok!');
        
        // Test dengan hash baru
        console.log('\n🔨 Creating new hash for testing...');
        const newHash = await bcrypt.hash(testPassword, 12);
        const newHashValid = await bcrypt.compare(testPassword, newHash);
        console.log('New hash validation:', newHashValid);
      }
      
    } catch (error) {
      console.log('❌ bcrypt.compare error:', error.message);
      console.log('Error stack:', error.stack);
    }
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await pool.end();
  }
}

testAppBcrypt();