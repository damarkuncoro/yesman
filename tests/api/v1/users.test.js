/**
 * Test script untuk User Management API endpoints
 * Base URL: /api/v1/users
 */

const { makeRequest } = require('./auth.test.js');

const BASE_URL = process.env.API_BASE_URL || 'http://localhost:3000';
const API_VERSION = 'v1';

/**
 * Test data
 */
const adminUser = {
  email: 'admin@example.com',
  password: 'AdminPassword123!'
};

let adminToken = null;
let testUserId = null;

/**
 * Test Suite untuk User Management
 */
class UserTestSuite {
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
   * Setup: Login sebagai admin untuk mendapatkan token
   */
  async setupAdminLogin() {
    const response = await makeRequest('/auth/login', {
      method: 'POST',
      body: adminUser
    });

    if (response.status === 200 && response.data.success) {
      adminToken = response.data.data.accessToken;
      return {
        success: true,
        details: 'Admin login successful'
      };
    } else {
      return {
        success: false,
        error: `Admin login failed: ${response.data.error || 'Unknown error'}`
      };
    }
  }

  /**
   * Test: Get All Users
   */
  async testGetAllUsers() {
    if (!adminToken) {
      return {
        success: false,
        error: 'No admin token available'
      };
    }

    const response = await makeRequest('/users', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${adminToken}`
      }
    });

    if (response.status === 200 && response.data.success) {
      const users = response.data.data.users;
      if (users && Array.isArray(users)) {
        // Simpan ID user pertama untuk test selanjutnya
        if (users.length > 0) {
          testUserId = users[0].id;
        }
        return {
          success: true,
          details: `Retrieved ${users.length} users`
        };
      } else {
        return {
          success: false,
          error: 'Users data is not in expected format'
        };
      }
    } else {
      return {
        success: false,
        error: `Get users failed: ${response.data.error || 'Unknown error'}`
      };
    }
  }

  /**
   * Test: Get User by ID
   */
  async testGetUserById() {
    if (!adminToken || !testUserId) {
      return {
        success: false,
        error: 'No admin token or test user ID available'
      };
    }

    const response = await makeRequest(`/users/${testUserId}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${adminToken}`
      }
    });

    if (response.status === 200 && response.data.success) {
      const user = response.data.data.user;
      if (user && user.id === testUserId) {
        return {
          success: true,
          details: `Retrieved user: ${user.email}`
        };
      } else {
        return {
          success: false,
          error: 'User data is not in expected format'
        };
      }
    } else {
      return {
        success: false,
        error: `Get user by ID failed: ${response.data.error || 'Unknown error'}`
      };
    }
  }

  /**
   * Test: Get User Roles
   */
  async testGetUserRoles() {
    if (!adminToken || !testUserId) {
      return {
        success: false,
        error: 'No admin token or test user ID available'
      };
    }

    const response = await makeRequest(`/users/${testUserId}/roles`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${adminToken}`
      }
    });

    if (response.status === 200 && response.data.success) {
      const roles = response.data.data.roles;
      if (Array.isArray(roles)) {
        return {
          success: true,
          details: `User has ${roles.length} roles`
        };
      } else {
        return {
          success: false,
          error: 'Roles data is not in expected format'
        };
      }
    } else {
      return {
        success: false,
        error: `Get user roles failed: ${response.data.error || 'Unknown error'}`
      };
    }
  }

  /**
   * Test: Get User Permissions
   */
  async testGetUserPermissions() {
    if (!adminToken || !testUserId) {
      return {
        success: false,
        error: 'No admin token or test user ID available'
      };
    }

    const response = await makeRequest(`/users/${testUserId}/permissions`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${adminToken}`
      }
    });

    if (response.status === 200 && response.data.success) {
      const permissions = response.data.data.permissions;
      if (Array.isArray(permissions)) {
        return {
          success: true,
          details: `User has ${permissions.length} permissions`
        };
      } else {
        return {
          success: false,
          error: 'Permissions data is not in expected format'
        };
      }
    } else {
      return {
        success: false,
        error: `Get user permissions failed: ${response.data.error || 'Unknown error'}`
      };
    }
  }

  /**
   * Test: Get User Profile (authenticated user)
   */
  async testGetUserProfile() {
    if (!adminToken) {
      return {
        success: false,
        error: 'No admin token available'
      };
    }

    const response = await makeRequest('/users/profile', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${adminToken}`
      }
    });

    if (response.status === 200 && response.data.success) {
      const profile = response.data.data.profile;
      if (profile && profile.email) {
        return {
          success: true,
          details: `Profile retrieved for: ${profile.email}`
        };
      } else {
        return {
          success: false,
          error: 'Profile data is not in expected format'
        };
      }
    } else {
      return {
        success: false,
        error: `Get user profile failed: ${response.data.error || 'Unknown error'}`
      };
    }
  }

  /**
   * Test: Unauthorized Access (tanpa token)
   */
  async testUnauthorizedAccess() {
    const response = await makeRequest('/users', {
      method: 'GET'
      // Tidak ada Authorization header
    });

    if (response.status === 401 && !response.data.success) {
      return {
        success: true,
        details: 'Unauthorized access correctly rejected'
      };
    } else {
      return {
        success: false,
        error: 'Unauthorized access should have been rejected'
      };
    }
  }

  /**
   * Test: Invalid User ID
   */
  async testInvalidUserId() {
    if (!adminToken) {
      return {
        success: false,
        error: 'No admin token available'
      };
    }

    const response = await makeRequest('/users/99999', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${adminToken}`
      }
    });

    if (response.status === 404 && !response.data.success) {
      return {
        success: true,
        details: 'Invalid user ID correctly handled'
      };
    } else {
      return {
        success: false,
        error: 'Invalid user ID should return 404'
      };
    }
  }

  /**
   * Menjalankan semua test user management
   */
  async runAllTests() {
    console.log('🚀 Starting User Management API Tests');
    console.log('======================================');

    // Setup
    await this.runTest('Admin Login Setup', () => this.setupAdminLogin());
    
    // Main tests
    await this.runTest('Get All Users', () => this.testGetAllUsers());
    await this.runTest('Get User by ID', () => this.testGetUserById());
    await this.runTest('Get User Roles', () => this.testGetUserRoles());
    await this.runTest('Get User Permissions', () => this.testGetUserPermissions());
    await this.runTest('Get User Profile', () => this.testGetUserProfile());
    
    // Error cases
    await this.runTest('Unauthorized Access', () => this.testUnauthorizedAccess());
    await this.runTest('Invalid User ID', () => this.testInvalidUserId());

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
  module.exports = { UserTestSuite };
}

/**
 * Jalankan test jika file ini dieksekusi langsung
 */
if (require.main === module) {
  (async () => {
    const testSuite = new UserTestSuite();
    const results = await testSuite.runAllTests();
    
    // Exit dengan kode error jika ada test yang gagal
    process.exit(results.failed > 0 || results.errors > 0 ? 1 : 0);
  })();
}