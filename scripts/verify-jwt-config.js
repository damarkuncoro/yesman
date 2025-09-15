/**
 * Script untuk memverifikasi konfigurasi JWT
 * Menguji apakah JWT secrets sudah dikonfigurasi dengan benar
 */

const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

/**
 * Load environment variables dari file .env
 */
function loadEnvFile() {
  try {
    const envPath = path.join(__dirname, '..', '.env');
    if (fs.existsSync(envPath)) {
      const envContent = fs.readFileSync(envPath, 'utf8');
      const lines = envContent.split('\n');
      
      lines.forEach(line => {
        const trimmedLine = line.trim();
        if (trimmedLine && !trimmedLine.startsWith('#')) {
          const [key, ...valueParts] = trimmedLine.split('=');
          if (key && valueParts.length > 0) {
            const value = valueParts.join('=').replace(/^["']|["']$/g, ''); // Remove quotes
            process.env[key] = value;
          }
        }
      });
      
      console.log('📁 File .env berhasil dimuat');
    } else {
      console.log('⚠️ File .env tidak ditemukan');
    }
  } catch (error) {
    console.log('❌ Error membaca file .env:', error.message);
  }
}

/**
 * Verifikasi konfigurasi JWT dari environment variables
 */
function verifyJWTConfiguration() {
  // Load .env file terlebih dahulu
  loadEnvFile();
  console.log('🔍 Memverifikasi konfigurasi JWT...');
  
  try {
    // 1. Cek environment variables
    const jwtSecret = process.env.JWT_SECRET;
    const jwtRefreshSecret = process.env.JWT_REFRESH_SECRET;
    
    console.log('\n📋 Environment Variables:');
    console.log(`   - JWT_SECRET: ${jwtSecret ? 'SET (' + jwtSecret.substring(0, 10) + '...)' : 'NOT SET'}`);
    console.log(`   - JWT_REFRESH_SECRET: ${jwtRefreshSecret ? 'SET (' + jwtRefreshSecret.substring(0, 10) + '...)' : 'NOT SET'}`);
    
    // 2. Validasi konfigurasi
    const fallbackSecret = 'fallback-secret';
    const fallbackRefreshSecret = 'fallback-refresh-secret';
    
    // Warn if using fallback secrets
    if (!process.env.JWT_SECRET || !process.env.JWT_REFRESH_SECRET) {
      console.warn(process.env.JWT_SECRET, process.env.JWT_REFRESH_SECRET);
      console.warn(`⚠️ ⚠️ JWT secrets not properly configured`);
    }
    
    let isValid = true;
    const issues = [];
    
    if (!jwtSecret) {
      issues.push('JWT_SECRET tidak diset');
      isValid = false;
    } else if (jwtSecret === fallbackSecret) {
      issues.push('JWT_SECRET menggunakan fallback value');
      isValid = false;
    } else if (jwtSecret.length < 32) {
      issues.push('JWT_SECRET terlalu pendek (minimal 32 karakter)');
      isValid = false;
    }
    
    if (!jwtRefreshSecret) {
      issues.push('JWT_REFRESH_SECRET tidak diset');
      isValid = false;
    } else if (jwtRefreshSecret === fallbackRefreshSecret) {
      issues.push('JWT_REFRESH_SECRET menggunakan fallback value');
      isValid = false;
    } else if (jwtRefreshSecret.length < 32) {
      issues.push('JWT_REFRESH_SECRET terlalu pendek (minimal 32 karakter)');
      isValid = false;
    }
    
    if (jwtSecret === jwtRefreshSecret) {
      issues.push('JWT_SECRET dan JWT_REFRESH_SECRET tidak boleh sama');
      isValid = false;
    }
    
    console.log(`\n✅ Konfigurasi valid: ${isValid ? 'YA' : 'TIDAK'}`);
    
    if (!isValid) {
      console.log('\n❌ Issues ditemukan:');
      issues.forEach(issue => console.log(`   - ${issue}`));
      console.log('\n💡 Solusi:');
      console.log('   1. Pastikan file .env ada di root directory');
      console.log('   2. Set JWT_SECRET dan JWT_REFRESH_SECRET dengan nilai yang kuat');
      console.log('   3. Restart development server setelah mengubah .env');
      return false;
    }
    
    // 3. Test basic JWT operations (jika ada jsonwebtoken)
    try {
      const jwt = require('jsonwebtoken');
      
      console.log('\n🔧 Testing JWT operations...');
      const testPayload = { userId: 1, email: 'test@example.com' };
      
      // Generate tokens
      const accessToken = jwt.sign(testPayload, jwtSecret, { expiresIn: '15m' });
      const refreshToken = jwt.sign(testPayload, jwtRefreshSecret, { expiresIn: '7d' });
      
      console.log(`   - Access Token: ${accessToken.substring(0, 20)}...`);
      console.log(`   - Refresh Token: ${refreshToken.substring(0, 20)}...`);
      
      // Verify tokens
      const accessPayload = jwt.verify(accessToken, jwtSecret);
      const refreshPayload = jwt.verify(refreshToken, jwtRefreshSecret);
      
      console.log(`   - Access Token Valid: ${accessPayload ? 'YA' : 'TIDAK'}`);
      console.log(`   - Refresh Token Valid: ${refreshPayload ? 'YA' : 'TIDAK'}`);
      
      if (accessPayload && refreshPayload) {
        console.log('\n🎉 Semua test berhasil! JWT configuration sudah bekerja dengan benar.');
        return true;
      }
    } catch (jwtError) {
      console.log('\n⚠️ JWT library tidak tersedia, tapi environment variables sudah benar.');
      console.log('   JWT operations akan ditest saat aplikasi berjalan.');
      return true;
    }
    
    return true;
    
  } catch (error) {
    console.error('\n❌ Error saat memverifikasi JWT configuration:', error.message);
    return false;
  }
}

/**
 * Generate secure random secrets
 */
function generateSecureSecrets() {
  console.log('\n🔐 Generating secure JWT secrets...');
  console.log('\nTambahkan ke file .env Anda:');
  console.log(`JWT_SECRET="${crypto.randomBytes(32).toString('hex')}"`);
  console.log(`JWT_REFRESH_SECRET="${crypto.randomBytes(32).toString('hex')}"`);
}

// Jalankan verifikasi
if (require.main === module) {
  const success = verifyJWTConfiguration();
  
  if (!success) {
    console.log('\n' + '='.repeat(60));
    generateSecureSecrets();
  }
  
  process.exit(success ? 0 : 1);
}

module.exports = { verifyJWTConfiguration, generateSecureSecrets };