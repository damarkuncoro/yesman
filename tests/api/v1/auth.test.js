/**
 * Test script untuk Authentication API endpoints
 * Base URL: /api/v1/auth
 */

const BASE_URL = process.env.API_BASE_URL || 'http://localhost:3000';
const API_VERSION = 'v1';

/**
 * Utility function untuk melakukan HTTP request
 */
async function makeRequest(endpoint, options = {}) {
  const url = `${BASE_URL}/api${endpoint}`;
  const defaultOptions = {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      ...options.headers
    }
  };

  const config = { ...defaultOptions, ...options };
  
  if (config.body && typeof config.body === 'object') {
    config.body = JSON.stringify(config.body);
  }

  try {
    const response = await fetch(url, config);
    const data = await response.json();
    
    return {
      status: response.status,
      ok: response.ok,
      data: data
    };
  } catch (error) {
    return {
      status: 500,
      ok: false,
      error: error.message
    };
  }
}

/**
 * Test data untuk authentication
 */
const testUser = {
  email: `test${Date.now()}@example.com`,
  password: 'password123',
  name: 'Test User 1',
  department: 'IT',
  region: 'Jakarta',
  level: 1
};

let authToken = null;
let refreshToken = null;

/**
 * Test Suite untuk Authentication
 */
class AuthTestSuite {
  constructor() {
    this.results = [];
  }

  /**
   * Menjalankan test dan mencatat hasil
   */
  async runTest(testName, testFunction) {
    console.log(`\n🧪 Running: ${testName}`);
    
    try {
      const result = await testFunction();
      
      if (result.success) {
        console.log(`✅ PASS: ${testName}`);
        this.results.push({ test: testName, status: 'PASS', details: result.details });
      } else {
        console.log(`❌ FAIL: ${testName} - ${result.error}`);
        this.results.push({ test: testName, status: 'FAIL', error: result.error });
      }
    } catch (error) {
      console.log(`💥 ERROR: ${testName} - ${error.message}`);
      this.results.push({ test: testName, status: 'ERROR', error: error.message });
    }
  }

  /**
   * Test: User Registration
   */
  async testUserRegistration() {
    const response = await makeRequest('/auth/register', {
      method: 'POST',
      body: testUser
    });

    if (response.status === 201 && response.data.success) {
      return {
        success: true,
        details: `User registered successfully with ID: ${response.data.data?.user?.id}`
      };
    } else if (response.status === 409) {
      return {
        success: true,
        details: 'User already exists (expected for repeated tests)'
      };
    } else {
      return {
        success: false,
        error: `Registration failed: ${response.data.error || 'Unknown error'}`
      };
    }
  }

  /**
   * Test: User Login
   */
  async testUserLogin() {
    const response = await makeRequest('/auth/login', {
      method: 'POST',
      body: {
        email: testUser.email,
        password: testUser.password
      }
    });

    if (response.status === 200 && response.data.success) {
      authToken = response.data.data.accessToken;
      refreshToken = response.data.data.refreshToken;
      
      return {
        success: true,
        details: `Login successful, token received: ${authToken ? 'Yes' : 'No'}`
      };
    } else {
      return {
        success: false,
        error: `Login failed: ${response.data.error || 'Unknown error'}`
      };
    }
  }

  /**
   * Test: Token Validation
   */
  async testTokenValidation() {
    if (!authToken) {
      return {
        success: false,
        error: 'No auth token available for validation'
      };
    }

    const response = await makeRequest('/auth/validate', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${authToken}`
      }
    });

    if (response.status === 200 && response.data.success) {
      return {
        success: true,
        details: `Token validation successful for user: ${response.data.data?.user?.email}`
      };
    } else {
      return {
        success: false,
        error: `Token validation failed: ${response.data.error || 'Unknown error'}`
      };
    }
  }

  /**
   * Test: Token Refresh
   */
  async testTokenRefresh() {
    if (!refreshToken) {
      return {
        success: false,
        error: 'No refresh token available'
      };
    }

    const response = await makeRequest('/auth/refresh', {
      method: 'POST',
      body: {
        refreshToken: refreshToken
      }
    });

    if (response.status === 200 && response.data.success) {
      const newToken = response.data.data.accessToken;
      if (newToken && newToken !== authToken) {
        authToken = newToken; // Update token for subsequent tests
        return {
          success: true,
          details: 'Token refresh successful, new token received'
        };
      } else {
        return {
          success: false,
          error: 'Token refresh did not return a new token'
        };
      }
    } else {
      return {
        success: false,
        error: `Token refresh failed: ${response.data.error || 'Unknown error'}`
      };
    }
  }

  /**
   * Test: User Logout
   */
  async testUserLogout() {
    if (!authToken) {
      return {
        success: false,
        error: 'No auth token available for logout'
      };
    }

    const response = await makeRequest('/auth/logout', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${authToken}`
      }
    });

    if (response.status === 200 && response.data.success) {
      return {
        success: true,
        details: 'Logout successful'
      };
    } else {
      return {
        success: false,
        error: `Logout failed: ${response.data.error || 'Unknown error'}`
      };
    }
  }

  /**
   * Test: Invalid Login Credentials
   */
  async testInvalidLogin() {
    const response = await makeRequest('/auth/login', {
      method: 'POST',
      body: {
        email: testUser.email,
        password: 'wrongpassword'
      }
    });

    if (response.status === 401 && !response.data.success) {
      return {
        success: true,
        details: 'Invalid login correctly rejected'
      };
    } else {
      return {
        success: false,
        error: 'Invalid login should have been rejected'
      };
    }
  }

  /**
   * Menjalankan semua test authentication
   */
  async runAllTests() {
    console.log('🚀 Starting Authentication API Tests');
    console.log('=====================================');

    // Test sequence yang logis
    await this.runTest('User Registration', () => this.testUserRegistration());
    await this.runTest('User Login', () => this.testUserLogin());
    await this.runTest('Token Validation', () => this.testTokenValidation());
    await this.runTest('Token Refresh', () => this.testTokenRefresh());
    await this.runTest('Invalid Login', () => this.testInvalidLogin());
    await this.runTest('User Logout', () => this.testUserLogout());

    // Summary
    console.log('\n📊 Test Results Summary');
    console.log('========================');
    
    const passed = this.results.filter(r => r.status === 'PASS').length;
    const failed = this.results.filter(r => r.status === 'FAIL').length;
    const errors = this.results.filter(r => r.status === 'ERROR').length;
    
    console.log(`✅ Passed: ${passed}`);
    console.log(`❌ Failed: ${failed}`);
    console.log(`💥 Errors: ${errors}`);
    console.log(`📈 Success Rate: ${((passed / this.results.length) * 100).toFixed(1)}%`);

    if (failed > 0 || errors > 0) {
      console.log('\n🔍 Failed/Error Details:');
      this.results
        .filter(r => r.status !== 'PASS')
        .forEach(r => {
          console.log(`  - ${r.test}: ${r.error}`);
        });
    }

    return {
      total: this.results.length,
      passed,
      failed,
      errors,
      results: this.results
    };
  }
}

/**
 * Export untuk digunakan oleh test runner utama
 */
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { AuthTestSuite, makeRequest };
}

/**
 * Jalankan test jika file ini dieksekusi langsung
 */
if (require.main === module) {
  (async () => {
    const testSuite = new AuthTestSuite();
    const results = await testSuite.runAllTests();
    
    // Exit dengan kode error jika ada test yang gagal
    process.exit(results.failed > 0 || results.errors > 0 ? 1 : 0);
  })();
}