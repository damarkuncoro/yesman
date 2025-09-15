// Script untuk menguji environment variables
require('dotenv').config();

console.log('=== Environment Variables Test ===');
console.log('JWT_SECRET:', process.env.JWT_SECRET ? 'SET' : 'NOT SET');
console.log('JWT_REFRESH_SECRET:', process.env.JWT_REFRESH_SECRET ? 'SET' : 'NOT SET');

if (process.env.JWT_SECRET) {
  console.log('JWT_SECRET length:', process.env.JWT_SECRET.length);
}
if (process.env.JWT_REFRESH_SECRET) {
  console.log('JWT_REFRESH_SECRET length:', process.env.JWT_REFRESH_SECRET.length);
}

// Test fungsi getJWTConfig
try {
  const { getJWTConfig } = require('./src/lib/auth/authService/tokenService/constants.ts');
  console.log('\n=== Testing getJWTConfig ===');
  const config = getJWTConfig();
  console.log('Config loaded successfully');
} catch (error) {
  console.error('Error loading getJWTConfig:', error.message);
}