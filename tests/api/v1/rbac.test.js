/**
 * Test script untuk RBAC (Role-Based Access Control) API endpoints
 * Base URLs: /api/v1/roles, /api/v1/features, /api/v1/route-features
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
let testRoleId = null;
let testFeatureId = null;
let testRouteFeatureId = null;

/**
 * Test Suite untuk RBAC
 */
class RBACTestSuite {
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

  // ==================== ROLES TESTS ====================

  /**
   * Test: Get All Roles
   */
  async testGetAllRoles() {
    if (!adminToken) {
      return { success: false, error: 'No admin token available' };
    }

    const response = await makeRequest('/roles', {
      method: 'GET',
      headers: { 'Authorization': `Bearer ${adminToken}` }
    });

    if (response.status === 200 && response.data.success) {
      const roles = response.data.data.roles;
      if (roles && Array.isArray(roles)) {
        if (roles.length > 0) {
          testRoleId = roles[0].id;
        }
        return {
          success: true,
          details: `Retrieved ${roles.length} roles`
        };
      } else {
        return { success: false, error: 'Roles data is not in expected format' };
      }
    } else {
      return {
        success: false,
        error: `Get roles failed: ${response.data.error || 'Unknown error'}`
      };
    }
  }

  /**
   * Test: Get Role by ID
   */
  async testGetRoleById() {
    if (!adminToken || !testRoleId) {
      return { success: false, error: 'No admin token or test role ID available' };
    }

    const response = await makeRequest(`/roles/${testRoleId}`, {
      method: 'GET',
      headers: { 'Authorization': `Bearer ${adminToken}` }
    });

    if (response.status === 200 && response.data.success) {
      const role = response.data.data.role;
      if (role && role.id === testRoleId) {
        return {
          success: true,
          details: `Retrieved role: ${role.name}`
        };
      } else {
        return { success: false, error: 'Role data is not in expected format' };
      }
    } else {
      return {
        success: false,
        error: `Get role by ID failed: ${response.data.error || 'Unknown error'}`
      };
    }
  }

  /**
   * Test: Get Role Features
   */
  async testGetRoleFeatures() {
    if (!adminToken || !testRoleId) {
      return { success: false, error: 'No admin token or test role ID available' };
    }

    const response = await makeRequest(`/roles/${testRoleId}/features`, {
      method: 'GET',
      headers: { 'Authorization': `Bearer ${adminToken}` }
    });

    if (response.status === 200 && response.data.success) {
      const features = response.data.data.features;
      if (Array.isArray(features)) {
        return {
          success: true,
          details: `Role has ${features.length} features`
        };
      } else {
        return { success: false, error: 'Features data is not in expected format' };
      }
    } else {
      return {
        success: false,
        error: `Get role features failed: ${response.data.error || 'Unknown error'}`
      };
    }
  }

  // ==================== FEATURES TESTS ====================

  /**
   * Test: Get All Features
   */
  async testGetAllFeatures() {
    if (!adminToken) {
      return { success: false, error: 'No admin token available' };
    }

    const response = await makeRequest('/features', {
      method: 'GET',
      headers: { 'Authorization': `Bearer ${adminToken}` }
    });

    if (response.status === 200 && response.data.success) {
      const features = response.data.data.features;
      if (features && Array.isArray(features)) {
        if (features.length > 0) {
          testFeatureId = features[0].id;
        }
        return {
          success: true,
          details: `Retrieved ${features.length} features`
        };
      } else {
        return { success: false, error: 'Features data is not in expected format' };
      }
    } else {
      return {
        success: false,
        error: `Get features failed: ${response.data.error || 'Unknown error'}`
      };
    }
  }

  /**
   * Test: Get Feature by ID
   */
  async testGetFeatureById() {
    if (!adminToken || !testFeatureId) {
      return { success: false, error: 'No admin token or test feature ID available' };
    }

    const response = await makeRequest(`/features/${testFeatureId}`, {
      method: 'GET',
      headers: { 'Authorization': `Bearer ${adminToken}` }
    });

    if (response.status === 200 && response.data.success) {
      const feature = response.data.data.feature;
      if (feature && feature.id === testFeatureId) {
        return {
          success: true,
          details: `Retrieved feature: ${feature.name}`
        };
      } else {
        return { success: false, error: 'Feature data is not in expected format' };
      }
    } else {
      return {
        success: false,
        error: `Get feature by ID failed: ${response.data.error || 'Unknown error'}`
      };
    }
  }

  /**
   * Test: Get Feature Routes
   */
  async testGetFeatureRoutes() {
    if (!adminToken || !testFeatureId) {
      return { success: false, error: 'No admin token or test feature ID available' };
    }

    const response = await makeRequest(`/features/${testFeatureId}/routes`, {
      method: 'GET',
      headers: { 'Authorization': `Bearer ${adminToken}` }
    });

    if (response.status === 200 && response.data.success) {
      const routes = response.data.data.routes;
      if (Array.isArray(routes)) {
        return {
          success: true,
          details: `Feature has ${routes.length} routes`
        };
      } else {
        return { success: false, error: 'Routes data is not in expected format' };
      }
    } else {
      return {
        success: false,
        error: `Get feature routes failed: ${response.data.error || 'Unknown error'}`
      };
    }
  }

  // ==================== ROUTE-FEATURES TESTS ====================

  /**
   * Test: Get All Route Features
   */
  async testGetAllRouteFeatures() {
    if (!adminToken) {
      return { success: false, error: 'No admin token available' };
    }

    const response = await makeRequest('/route-features', {
      method: 'GET',
      headers: { 'Authorization': `Bearer ${adminToken}` }
    });

    if (response.status === 200 && response.data.success) {
      const routeFeatures = response.data.data.routeFeatures;
      if (routeFeatures && Array.isArray(routeFeatures)) {
        if (routeFeatures.length > 0) {
          testRouteFeatureId = routeFeatures[0].id;
        }
        return {
          success: true,
          details: `Retrieved ${routeFeatures.length} route features`
        };
      } else {
        return { success: false, error: 'Route features data is not in expected format' };
      }
    } else {
      return {
        success: false,
        error: `Get route features failed: ${response.data.error || 'Unknown error'}`
      };
    }
  }

  /**
   * Test: Get Route Feature by ID
   */
  async testGetRouteFeatureById() {
    if (!adminToken || !testRouteFeatureId) {
      return { success: false, error: 'No admin token or test route feature ID available' };
    }

    const response = await makeRequest(`/route-features/${testRouteFeatureId}`, {
      method: 'GET',
      headers: { 'Authorization': `Bearer ${adminToken}` }
    });

    if (response.status === 200 && response.data.success) {
      const routeFeature = response.data.data.routeFeature;
      if (routeFeature && routeFeature.id === testRouteFeatureId) {
        return {
          success: true,
          details: `Retrieved route feature: ${routeFeature.route}`
        };
      } else {
        return { success: false, error: 'Route feature data is not in expected format' };
      }
    } else {
      return {
        success: false,
        error: `Get route feature by ID failed: ${response.data.error || 'Unknown error'}`
      };
    }
  }

  // ==================== ERROR CASES ====================

  /**
   * Test: Unauthorized Access (tanpa token)
   */
  async testUnauthorizedAccess() {
    const response = await makeRequest('/roles', {
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
   * Test: Invalid Role ID
   */
  async testInvalidRoleId() {
    if (!adminToken) {
      return { success: false, error: 'No admin token available' };
    }

    const response = await makeRequest('/roles/99999', {
      method: 'GET',
      headers: { 'Authorization': `Bearer ${adminToken}` }
    });

    if (response.status === 404 && !response.data.success) {
      return {
        success: true,
        details: 'Invalid role ID correctly handled'
      };
    } else {
      return {
        success: false,
        error: 'Invalid role ID should return 404'
      };
    }
  }

  /**
   * Test: Invalid Feature ID
   */
  async testInvalidFeatureId() {
    if (!adminToken) {
      return { success: false, error: 'No admin token available' };
    }

    const response = await makeRequest('/features/99999', {
      method: 'GET',
      headers: { 'Authorization': `Bearer ${adminToken}` }
    });

    if (response.status === 404 && !response.data.success) {
      return {
        success: true,
        details: 'Invalid feature ID correctly handled'
      };
    } else {
      return {
        success: false,
        error: 'Invalid feature ID should return 404'
      };
    }
  }

  /**
   * Menjalankan semua test RBAC
   */
  async runAllTests() {
    console.log('🚀 Starting RBAC API Tests');
    console.log('===========================');

    // Setup
    await this.runTest('Admin Login Setup', () => this.setupAdminLogin());
    
    // Roles tests
    console.log('\n🔐 Testing Roles Endpoints');
    await this.runTest('Get All Roles', () => this.testGetAllRoles());
    await this.runTest('Get Role by ID', () => this.testGetRoleById());
    await this.runTest('Get Role Features', () => this.testGetRoleFeatures());
    
    // Features tests
    console.log('\n⚡ Testing Features Endpoints');
    await this.runTest('Get All Features', () => this.testGetAllFeatures());
    await this.runTest('Get Feature by ID', () => this.testGetFeatureById());
    await this.runTest('Get Feature Routes', () => this.testGetFeatureRoutes());
    
    // Route Features tests
    console.log('\n🛣️  Testing Route Features Endpoints');
    await this.runTest('Get All Route Features', () => this.testGetAllRouteFeatures());
    await this.runTest('Get Route Feature by ID', () => this.testGetRouteFeatureById());
    
    // Error cases
    console.log('\n❌ Testing Error Cases');
    await this.runTest('Unauthorized Access', () => this.testUnauthorizedAccess());
    await this.runTest('Invalid Role ID', () => this.testInvalidRoleId());
    await this.runTest('Invalid Feature ID', () => this.testInvalidFeatureId());

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
  module.exports = { RBACTestSuite };
}

/**
 * Jalankan test jika file ini dieksekusi langsung
 */
if (require.main === module) {
  (async () => {
    const testSuite = new RBACTestSuite();
    const results = await testSuite.runAllTests();
    
    // Exit dengan kode error jika ada test yang gagal
    process.exit(results.failed > 0 || results.errors > 0 ? 1 : 0);
  })();
}