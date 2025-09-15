/**
 * Test script untuk Dashboard API endpoints
 * Base URL: /api/v1/dashboard
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

/**
 * Test Suite untuk Dashboard
 */
class DashboardTestSuite {
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

  // ==================== DASHBOARD STATISTICS TESTS ====================

  /**
   * Test: Get User Role Statistics
   */
  async testGetUserRoleStats() {
    if (!adminToken) {
      return { success: false, error: 'No admin token available' };
    }

    const response = await makeRequest('/dashboard/user-role-stats', {
      method: 'GET',
      headers: { 'Authorization': `Bearer ${adminToken}` }
    });

    if (response.status === 200 && response.data.success) {
      const stats = response.data.data.stats;
      if (stats && Array.isArray(stats)) {
        return {
          success: true,
          details: `Retrieved user role statistics with ${stats.length} roles`
        };
      } else {
        return { success: false, error: 'User role stats data is not in expected format' };
      }
    } else {
      return {
        success: false,
        error: `Get user role stats failed: ${response.data.error || 'Unknown error'}`
      };
    }
  }

  /**
   * Test: Get Department Statistics
   */
  async testGetDepartmentStats() {
    if (!adminToken) {
      return { success: false, error: 'No admin token available' };
    }

    const response = await makeRequest('/dashboard/department-stats', {
      method: 'GET',
      headers: { 'Authorization': `Bearer ${adminToken}` }
    });

    if (response.status === 200 && response.data.success) {
      const stats = response.data.data.stats;
      if (stats && Array.isArray(stats)) {
        return {
          success: true,
          details: `Retrieved department statistics with ${stats.length} departments`
        };
      } else {
        return { success: false, error: 'Department stats data is not in expected format' };
      }
    } else {
      return {
        success: false,
        error: `Get department stats failed: ${response.data.error || 'Unknown error'}`
      };
    }
  }

  /**
   * Test: Get Region Statistics
   */
  async testGetRegionStats() {
    if (!adminToken) {
      return { success: false, error: 'No admin token available' };
    }

    const response = await makeRequest('/dashboard/region-stats', {
      method: 'GET',
      headers: { 'Authorization': `Bearer ${adminToken}` }
    });

    if (response.status === 200 && response.data.success) {
      const stats = response.data.data.stats;
      if (stats && Array.isArray(stats)) {
        return {
          success: true,
          details: `Retrieved region statistics with ${stats.length} regions`
        };
      } else {
        return { success: false, error: 'Region stats data is not in expected format' };
      }
    } else {
      return {
        success: false,
        error: `Get region stats failed: ${response.data.error || 'Unknown error'}`
      };
    }
  }

  /**
   * Test: Get Department Region Statistics
   */
  async testGetDepartmentRegionStats() {
    if (!adminToken) {
      return { success: false, error: 'No admin token available' };
    }

    const response = await makeRequest('/dashboard/department-region-stats', {
      method: 'GET',
      headers: { 'Authorization': `Bearer ${adminToken}` }
    });

    if (response.status === 200 && response.data.success) {
      const stats = response.data.data.stats;
      if (stats && Array.isArray(stats)) {
        return {
          success: true,
          details: `Retrieved department-region statistics with ${stats.length} combinations`
        };
      } else {
        return { success: false, error: 'Department-region stats data is not in expected format' };
      }
    } else {
      return {
        success: false,
        error: `Get department-region stats failed: ${response.data.error || 'Unknown error'}`
      };
    }
  }

  /**
   * Test: Get Feature Access Statistics
   */
  async testGetFeatureAccessStats() {
    if (!adminToken) {
      return { success: false, error: 'No admin token available' };
    }

    const response = await makeRequest('/dashboard/feature-access-stats', {
      method: 'GET',
      headers: { 'Authorization': `Bearer ${adminToken}` }
    });

    if (response.status === 200 && response.data.success) {
      const stats = response.data.data.stats;
      if (stats && Array.isArray(stats)) {
        return {
          success: true,
          details: `Retrieved feature access statistics with ${stats.length} features`
        };
      } else {
        return { success: false, error: 'Feature access stats data is not in expected format' };
      }
    } else {
      return {
        success: false,
        error: `Get feature access stats failed: ${response.data.error || 'Unknown error'}`
      };
    }
  }

  /**
   * Test: Get Access Denied Statistics
   */
  async testGetAccessDeniedStats() {
    if (!adminToken) {
      return { success: false, error: 'No admin token available' };
    }

    const response = await makeRequest('/dashboard/access-denied-stats', {
      method: 'GET',
      headers: { 'Authorization': `Bearer ${adminToken}` }
    });

    if (response.status === 200 && response.data.success) {
      const stats = response.data.data.stats;
      if (stats && Array.isArray(stats)) {
        return {
          success: true,
          details: `Retrieved access denied statistics with ${stats.length} entries`
        };
      } else {
        return { success: false, error: 'Access denied stats data is not in expected format' };
      }
    } else {
      return {
        success: false,
        error: `Get access denied stats failed: ${response.data.error || 'Unknown error'}`
      };
    }
  }

  // ==================== DASHBOARD OVERVIEW TESTS ====================

  /**
   * Test: Get Dashboard Overview
   */
  async testGetDashboardOverview() {
    if (!adminToken) {
      return { success: false, error: 'No admin token available' };
    }

    const response = await makeRequest('/dashboard/overview', {
      method: 'GET',
      headers: { 'Authorization': `Bearer ${adminToken}` }
    });

    if (response.status === 200 && response.data.success) {
      const overview = response.data.data.overview;
      if (overview && typeof overview === 'object') {
        const expectedKeys = ['totalUsers', 'totalRoles', 'totalFeatures', 'totalDepartments'];
        const hasRequiredKeys = expectedKeys.some(key => overview.hasOwnProperty(key));
        
        if (hasRequiredKeys) {
          return {
            success: true,
            details: `Retrieved dashboard overview with ${Object.keys(overview).length} metrics`
          };
        } else {
          return { success: false, error: 'Dashboard overview missing expected metrics' };
        }
      } else {
        return { success: false, error: 'Dashboard overview data is not in expected format' };
      }
    } else {
      return {
        success: false,
        error: `Get dashboard overview failed: ${response.data.error || 'Unknown error'}`
      };
    }
  }

  /**
   * Test: Get Recent Activities
   */
  async testGetRecentActivities() {
    if (!adminToken) {
      return { success: false, error: 'No admin token available' };
    }

    const response = await makeRequest('/dashboard/recent-activities', {
      method: 'GET',
      headers: { 'Authorization': `Bearer ${adminToken}` }
    });

    if (response.status === 200 && response.data.success) {
      const activities = response.data.data.activities;
      if (Array.isArray(activities)) {
        return {
          success: true,
          details: `Retrieved ${activities.length} recent activities`
        };
      } else {
        return { success: false, error: 'Recent activities data is not in expected format' };
      }
    } else {
      return {
        success: false,
        error: `Get recent activities failed: ${response.data.error || 'Unknown error'}`
      };
    }
  }

  // ==================== DASHBOARD FILTERS TESTS ====================

  /**
   * Test: Get Statistics with Date Filter
   */
  async testGetStatsWithDateFilter() {
    if (!adminToken) {
      return { success: false, error: 'No admin token available' };
    }

    const endDate = new Date();
    const startDate = new Date(endDate.getTime() - (30 * 24 * 60 * 60 * 1000)); // 30 days ago

    const response = await makeRequest(`/dashboard/user-role-stats?startDate=${startDate.toISOString()}&endDate=${endDate.toISOString()}`, {
      method: 'GET',
      headers: { 'Authorization': `Bearer ${adminToken}` }
    });

    if (response.status === 200 && response.data.success) {
      const stats = response.data.data.stats;
      if (Array.isArray(stats)) {
        return {
          success: true,
          details: `Retrieved filtered statistics for last 30 days with ${stats.length} entries`
        };
      } else {
        return { success: false, error: 'Filtered stats data is not in expected format' };
      }
    } else {
      return {
        success: false,
        error: `Get filtered stats failed: ${response.data.error || 'Unknown error'}`
      };
    }
  }

  /**
   * Test: Get Statistics with Department Filter
   */
  async testGetStatsWithDepartmentFilter() {
    if (!adminToken) {
      return { success: false, error: 'No admin token available' };
    }

    const response = await makeRequest('/dashboard/user-role-stats?department=IT', {
      method: 'GET',
      headers: { 'Authorization': `Bearer ${adminToken}` }
    });

    if (response.status === 200 && response.data.success) {
      const stats = response.data.data.stats;
      if (Array.isArray(stats)) {
        return {
          success: true,
          details: `Retrieved IT department statistics with ${stats.length} entries`
        };
      } else {
        return { success: false, error: 'Department filtered stats data is not in expected format' };
      }
    } else {
      return {
        success: false,
        error: `Get department filtered stats failed: ${response.data.error || 'Unknown error'}`
      };
    }
  }

  /**
   * Test: Get Statistics with Region Filter
   */
  async testGetStatsWithRegionFilter() {
    if (!adminToken) {
      return { success: false, error: 'No admin token available' };
    }

    const response = await makeRequest('/dashboard/department-stats?region=Jakarta', {
      method: 'GET',
      headers: { 'Authorization': `Bearer ${adminToken}` }
    });

    if (response.status === 200 && response.data.success) {
      const stats = response.data.data.stats;
      if (Array.isArray(stats)) {
        return {
          success: true,
          details: `Retrieved Jakarta region statistics with ${stats.length} entries`
        };
      } else {
        return { success: false, error: 'Region filtered stats data is not in expected format' };
      }
    } else {
      return {
        success: false,
        error: `Get region filtered stats failed: ${response.data.error || 'Unknown error'}`
      };
    }
  }

  // ==================== ERROR CASES ====================

  /**
   * Test: Unauthorized Access (tanpa token)
   */
  async testUnauthorizedAccess() {
    const response = await makeRequest('/dashboard/overview', {
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
   * Test: Invalid Date Range
   */
  async testInvalidDateRange() {
    if (!adminToken) {
      return { success: false, error: 'No admin token available' };
    }

    // End date before start date
    const startDate = new Date();
    const endDate = new Date(startDate.getTime() - (24 * 60 * 60 * 1000)); // 1 day before

    const response = await makeRequest(`/dashboard/user-role-stats?startDate=${startDate.toISOString()}&endDate=${endDate.toISOString()}`, {
      method: 'GET',
      headers: { 'Authorization': `Bearer ${adminToken}` }
    });

    if (response.status === 400 && !response.data.success) {
      return {
        success: true,
        details: 'Invalid date range correctly rejected'
      };
    } else {
      return {
        success: false,
        error: 'Invalid date range should return 400'
      };
    }
  }

  /**
   * Test: Invalid Department Filter
   */
  async testInvalidDepartmentFilter() {
    if (!adminToken) {
      return { success: false, error: 'No admin token available' };
    }

    const response = await makeRequest('/dashboard/user-role-stats?department=NonExistentDept', {
      method: 'GET',
      headers: { 'Authorization': `Bearer ${adminToken}` }
    });

    // This might return empty results rather than error, so we check for valid response structure
    if (response.status === 200 && response.data.success) {
      const stats = response.data.data.stats;
      if (Array.isArray(stats)) {
        return {
          success: true,
          details: `Non-existent department filter handled correctly (${stats.length} results)`
        };
      } else {
        return { success: false, error: 'Invalid department filter response format' };
      }
    } else {
      return {
        success: false,
        error: `Invalid department filter failed: ${response.data.error || 'Unknown error'}`
      };
    }
  }

  /**
   * Test: Non-existent Dashboard Endpoint
   */
  async testNonExistentEndpoint() {
    if (!adminToken) {
      return { success: false, error: 'No admin token available' };
    }

    const response = await makeRequest('/dashboard/non-existent-stats', {
      method: 'GET',
      headers: { 'Authorization': `Bearer ${adminToken}` }
    });

    if (response.status === 404) {
      return {
        success: true,
        details: 'Non-existent endpoint correctly returns 404'
      };
    } else {
      return {
        success: false,
        error: 'Non-existent endpoint should return 404'
      };
    }
  }

  /**
   * Menjalankan semua test dashboard
   */
  async runAllTests() {
    console.log('🚀 Starting Dashboard API Tests');
    console.log('================================');

    // Setup
    await this.runTest('Admin Login Setup', () => this.setupAdminLogin());
    
    // Statistics tests
    console.log('\n📊 Testing Dashboard Statistics Endpoints');
    await this.runTest('Get User Role Stats', () => this.testGetUserRoleStats());
    await this.runTest('Get Department Stats', () => this.testGetDepartmentStats());
    await this.runTest('Get Region Stats', () => this.testGetRegionStats());
    await this.runTest('Get Department Region Stats', () => this.testGetDepartmentRegionStats());
    await this.runTest('Get Feature Access Stats', () => this.testGetFeatureAccessStats());
    await this.runTest('Get Access Denied Stats', () => this.testGetAccessDeniedStats());
    
    // Overview tests
    console.log('\n🎯 Testing Dashboard Overview Endpoints');
    await this.runTest('Get Dashboard Overview', () => this.testGetDashboardOverview());
    await this.runTest('Get Recent Activities', () => this.testGetRecentActivities());
    
    // Filter tests
    console.log('\n🔍 Testing Dashboard Filter Features');
    await this.runTest('Get Stats with Date Filter', () => this.testGetStatsWithDateFilter());
    await this.runTest('Get Stats with Department Filter', () => this.testGetStatsWithDepartmentFilter());
    await this.runTest('Get Stats with Region Filter', () => this.testGetStatsWithRegionFilter());
    
    // Error cases
    console.log('\n❌ Testing Error Cases');
    await this.runTest('Unauthorized Access', () => this.testUnauthorizedAccess());
    await this.runTest('Invalid Date Range', () => this.testInvalidDateRange());
    await this.runTest('Invalid Department Filter', () => this.testInvalidDepartmentFilter());
    await this.runTest('Non-existent Endpoint', () => this.testNonExistentEndpoint());

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
  module.exports = { DashboardTestSuite };
}

/**
 * Jalankan test jika file ini dieksekusi langsung
 */
if (require.main === module) {
  (async () => {
    const testSuite = new DashboardTestSuite();
    const results = await testSuite.runAllTests();
    
    // Exit dengan kode error jika ada test yang gagal
    process.exit(results.failed > 0 || results.errors > 0 ? 1 : 0);
  })();
}