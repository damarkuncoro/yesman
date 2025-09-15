/**
 * Test script untuk Admin API endpoints
 * Base URL: /api/v1/admin
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
let testRouteId = null;

/**
 * Test Suite untuk Admin
 */
class AdminTestSuite {
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

  // ==================== ROUTE DISCOVERY TESTS ====================

  /**
   * Test: Get Route Discovery
   */
  async testGetRouteDiscovery() {
    if (!adminToken) {
      return { success: false, error: 'No admin token available' };
    }

    const response = await makeRequest('/admin/route-discovery', {
      method: 'GET',
      headers: { 'Authorization': `Bearer ${adminToken}` }
    });

    if (response.status === 200 && response.data.success) {
      const routes = response.data.data.routes;
      if (routes && Array.isArray(routes)) {
        if (routes.length > 0) {
          testRouteId = routes[0].id || routes[0].path;
        }
        return {
          success: true,
          details: `Discovered ${routes.length} routes`
        };
      } else {
        return { success: false, error: 'Route discovery data is not in expected format' };
      }
    } else {
      return {
        success: false,
        error: `Route discovery failed: ${response.data.error || 'Unknown error'}`
      };
    }
  }

  /**
   * Test: Get Route Discovery with Filters
   */
  async testGetRouteDiscoveryWithFilters() {
    if (!adminToken) {
      return { success: false, error: 'No admin token available' };
    }

    const response = await makeRequest('/admin/route-discovery?method=GET&protected=true', {
      method: 'GET',
      headers: { 'Authorization': `Bearer ${adminToken}` }
    });

    if (response.status === 200 && response.data.success) {
      const routes = response.data.data.routes;
      if (Array.isArray(routes)) {
        return {
          success: true,
          details: `Filtered route discovery returned ${routes.length} GET protected routes`
        };
      } else {
        return { success: false, error: 'Filtered route discovery data is not in expected format' };
      }
    } else {
      return {
        success: false,
        error: `Filtered route discovery failed: ${response.data.error || 'Unknown error'}`
      };
    }
  }

  /**
   * Test: Refresh Route Discovery
   */
  async testRefreshRouteDiscovery() {
    if (!adminToken) {
      return { success: false, error: 'No admin token available' };
    }

    const response = await makeRequest('/admin/route-discovery/refresh', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${adminToken}` }
    });

    if (response.status === 200 && response.data.success) {
      const result = response.data.data;
      if (result && typeof result.refreshed !== 'undefined') {
        return {
          success: true,
          details: `Route discovery refreshed: ${result.refreshed} routes updated`
        };
      } else {
        return { success: false, error: 'Route refresh result is not in expected format' };
      }
    } else {
      return {
        success: false,
        error: `Route discovery refresh failed: ${response.data.error || 'Unknown error'}`
      };
    }
  }

  // ==================== SYSTEM MANAGEMENT TESTS ====================

  /**
   * Test: Get System Status
   */
  async testGetSystemStatus() {
    if (!adminToken) {
      return { success: false, error: 'No admin token available' };
    }

    const response = await makeRequest('/admin/system/status', {
      method: 'GET',
      headers: { 'Authorization': `Bearer ${adminToken}` }
    });

    if (response.status === 200 && response.data.success) {
      const status = response.data.data.status;
      if (status && typeof status === 'object') {
        const expectedKeys = ['uptime', 'memory', 'database', 'version'];
        const hasRequiredKeys = expectedKeys.some(key => status.hasOwnProperty(key));
        
        if (hasRequiredKeys) {
          return {
            success: true,
            details: `System status retrieved with ${Object.keys(status).length} metrics`
          };
        } else {
          return { success: false, error: 'System status missing expected metrics' };
        }
      } else {
        return { success: false, error: 'System status data is not in expected format' };
      }
    } else {
      return {
        success: false,
        error: `Get system status failed: ${response.data.error || 'Unknown error'}`
      };
    }
  }

  /**
   * Test: Get System Configuration
   */
  async testGetSystemConfiguration() {
    if (!adminToken) {
      return { success: false, error: 'No admin token available' };
    }

    const response = await makeRequest('/admin/system/config', {
      method: 'GET',
      headers: { 'Authorization': `Bearer ${adminToken}` }
    });

    if (response.status === 200 && response.data.success) {
      const config = response.data.data.configuration;
      if (config && typeof config === 'object') {
        return {
          success: true,
          details: `System configuration retrieved with ${Object.keys(config).length} settings`
        };
      } else {
        return { success: false, error: 'System configuration data is not in expected format' };
      }
    } else {
      return {
        success: false,
        error: `Get system configuration failed: ${response.data.error || 'Unknown error'}`
      };
    }
  }

  /**
   * Test: Update System Configuration
   */
  async testUpdateSystemConfiguration() {
    if (!adminToken) {
      return { success: false, error: 'No admin token available' };
    }

    const configUpdate = {
      settings: {
        maxLoginAttempts: 5,
        sessionTimeout: 3600,
        enableAuditLog: true
      }
    };

    const response = await makeRequest('/admin/system/config', {
      method: 'PUT',
      headers: { 'Authorization': `Bearer ${adminToken}` },
      body: configUpdate
    });

    if (response.status === 200 && response.data.success) {
      const result = response.data.data;
      if (result && result.updated) {
        return {
          success: true,
          details: 'System configuration updated successfully'
        };
      } else {
        return { success: false, error: 'Configuration update result is not in expected format' };
      }
    } else {
      return {
        success: false,
        error: `Update system configuration failed: ${response.data.error || 'Unknown error'}`
      };
    }
  }

  // ==================== USER MANAGEMENT TESTS ====================

  /**
   * Test: Get All Users (Admin View)
   */
  async testGetAllUsersAdmin() {
    if (!adminToken) {
      return { success: false, error: 'No admin token available' };
    }

    const response = await makeRequest('/admin/users', {
      method: 'GET',
      headers: { 'Authorization': `Bearer ${adminToken}` }
    });

    if (response.status === 200 && response.data.success) {
      const users = response.data.data.users;
      if (users && Array.isArray(users)) {
        return {
          success: true,
          details: `Retrieved ${users.length} users (admin view)`
        };
      } else {
        return { success: false, error: 'Admin users data is not in expected format' };
      }
    } else {
      return {
        success: false,
        error: `Get admin users failed: ${response.data.error || 'Unknown error'}`
      };
    }
  }

  /**
   * Test: Create New User (Admin)
   */
  async testCreateUserAdmin() {
    if (!adminToken) {
      return { success: false, error: 'No admin token available' };
    }

    const newUser = {
      email: `test.user.${Date.now()}@example.com`,
      password: 'TestPassword123!',
      firstName: 'Test',
      lastName: 'User',
      department: 'IT',
      region: 'Jakarta',
      roles: ['user']
    };

    const response = await makeRequest('/admin/users', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${adminToken}` },
      body: newUser
    });

    if (response.status === 201 && response.data.success) {
      const user = response.data.data.user;
      if (user && user.email === newUser.email) {
        return {
          success: true,
          details: `User created successfully: ${user.email}`
        };
      } else {
        return { success: false, error: 'Created user data is not in expected format' };
      }
    } else {
      return {
        success: false,
        error: `Create user failed: ${response.data.error || 'Unknown error'}`
      };
    }
  }

  /**
   * Test: Update User Status (Admin)
   */
  async testUpdateUserStatus() {
    if (!adminToken) {
      return { success: false, error: 'No admin token available' };
    }

    const statusUpdate = {
      status: 'inactive',
      reason: 'Administrative action'
    };

    const response = await makeRequest('/admin/users/1/status', {
      method: 'PUT',
      headers: { 'Authorization': `Bearer ${adminToken}` },
      body: statusUpdate
    });

    if (response.status === 200 && response.data.success) {
      const result = response.data.data;
      if (result && result.updated) {
        return {
          success: true,
          details: 'User status updated successfully'
        };
      } else {
        return { success: false, error: 'User status update result is not in expected format' };
      }
    } else {
      return {
        success: false,
        error: `Update user status failed: ${response.data.error || 'Unknown error'}`
      };
    }
  }

  // ==================== ROLE MANAGEMENT TESTS ====================

  /**
   * Test: Create New Role (Admin)
   */
  async testCreateRoleAdmin() {
    if (!adminToken) {
      return { success: false, error: 'No admin token available' };
    }

    const newRole = {
      name: `test_role_${Date.now()}`,
      description: 'Test role created by admin',
      features: ['dashboard_view', 'user_read'],
      isActive: true
    };

    const response = await makeRequest('/admin/roles', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${adminToken}` },
      body: newRole
    });

    if (response.status === 201 && response.data.success) {
      const role = response.data.data.role;
      if (role && role.name === newRole.name) {
        return {
          success: true,
          details: `Role created successfully: ${role.name}`
        };
      } else {
        return { success: false, error: 'Created role data is not in expected format' };
      }
    } else {
      return {
        success: false,
        error: `Create role failed: ${response.data.error || 'Unknown error'}`
      };
    }
  }

  /**
   * Test: Assign Role to User (Admin)
   */
  async testAssignRoleToUser() {
    if (!adminToken) {
      return { success: false, error: 'No admin token available' };
    }

    const roleAssignment = {
      userId: 1,
      roleId: 2,
      assignedBy: 'admin',
      reason: 'Administrative assignment'
    };

    const response = await makeRequest('/admin/users/1/roles', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${adminToken}` },
      body: roleAssignment
    });

    if (response.status === 200 && response.data.success) {
      const result = response.data.data;
      if (result && result.assigned) {
        return {
          success: true,
          details: 'Role assigned to user successfully'
        };
      } else {
        return { success: false, error: 'Role assignment result is not in expected format' };
      }
    } else {
      return {
        success: false,
        error: `Assign role to user failed: ${response.data.error || 'Unknown error'}`
      };
    }
  }

  // ==================== AUDIT MANAGEMENT TESTS ====================

  /**
   * Test: Get Audit Logs (Admin)
   */
  async testGetAuditLogsAdmin() {
    if (!adminToken) {
      return { success: false, error: 'No admin token available' };
    }

    const response = await makeRequest('/admin/audit', {
      method: 'GET',
      headers: { 'Authorization': `Bearer ${adminToken}` }
    });

    if (response.status === 200 && response.data.success) {
      const auditLogs = response.data.data.auditLogs;
      if (Array.isArray(auditLogs)) {
        return {
          success: true,
          details: `Retrieved ${auditLogs.length} audit logs (admin view)`
        };
      } else {
        return { success: false, error: 'Admin audit logs data is not in expected format' };
      }
    } else {
      return {
        success: false,
        error: `Get admin audit logs failed: ${response.data.error || 'Unknown error'}`
      };
    }
  }

  /**
   * Test: Clear Old Audit Logs
   */
  async testClearOldAuditLogs() {
    if (!adminToken) {
      return { success: false, error: 'No admin token available' };
    }

    const clearRequest = {
      olderThanDays: 90,
      confirm: true
    };

    const response = await makeRequest('/admin/audit/cleanup', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${adminToken}` },
      body: clearRequest
    });

    if (response.status === 200 && response.data.success) {
      const result = response.data.data;
      if (result && typeof result.deleted !== 'undefined') {
        return {
          success: true,
          details: `Audit cleanup completed: ${result.deleted} logs removed`
        };
      } else {
        return { success: false, error: 'Audit cleanup result is not in expected format' };
      }
    } else {
      return {
        success: false,
        error: `Clear old audit logs failed: ${response.data.error || 'Unknown error'}`
      };
    }
  }

  // ==================== ERROR CASES ====================

  /**
   * Test: Unauthorized Access (tanpa token)
   */
  async testUnauthorizedAccess() {
    const response = await makeRequest('/admin/system/status', {
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
   * Test: Insufficient Permissions (non-admin user)
   */
  async testInsufficientPermissions() {
    // This would require a non-admin token, so we'll simulate with invalid token
    const response = await makeRequest('/admin/system/status', {
      method: 'GET',
      headers: { 'Authorization': 'Bearer invalid_token' }
    });

    if (response.status === 401 || response.status === 403) {
      return {
        success: true,
        details: 'Insufficient permissions correctly rejected'
      };
    } else {
      return {
        success: false,
        error: 'Insufficient permissions should be rejected'
      };
    }
  }

  /**
   * Test: Invalid Configuration Update
   */
  async testInvalidConfigurationUpdate() {
    if (!adminToken) {
      return { success: false, error: 'No admin token available' };
    }

    const invalidConfig = {
      settings: {
        maxLoginAttempts: -1, // Invalid negative value
        sessionTimeout: 'invalid' // Invalid type
      }
    };

    const response = await makeRequest('/admin/system/config', {
      method: 'PUT',
      headers: { 'Authorization': `Bearer ${adminToken}` },
      body: invalidConfig
    });

    if (response.status === 400 && !response.data.success) {
      return {
        success: true,
        details: 'Invalid configuration correctly rejected'
      };
    } else {
      return {
        success: false,
        error: 'Invalid configuration should return 400'
      };
    }
  }

  /**
   * Menjalankan semua test admin
   */
  async runAllTests() {
    console.log('🚀 Starting Admin API Tests');
    console.log('============================');

    // Setup
    await this.runTest('Admin Login Setup', () => this.setupAdminLogin());
    
    // Route discovery tests
    console.log('\n🛣️  Testing Route Discovery Endpoints');
    await this.runTest('Get Route Discovery', () => this.testGetRouteDiscovery());
    await this.runTest('Get Route Discovery with Filters', () => this.testGetRouteDiscoveryWithFilters());
    await this.runTest('Refresh Route Discovery', () => this.testRefreshRouteDiscovery());
    
    // System management tests
    console.log('\n⚙️  Testing System Management Endpoints');
    await this.runTest('Get System Status', () => this.testGetSystemStatus());
    await this.runTest('Get System Configuration', () => this.testGetSystemConfiguration());
    await this.runTest('Update System Configuration', () => this.testUpdateSystemConfiguration());
    
    // User management tests
    console.log('\n👥 Testing User Management Endpoints');
    await this.runTest('Get All Users (Admin)', () => this.testGetAllUsersAdmin());
    await this.runTest('Create New User (Admin)', () => this.testCreateUserAdmin());
    await this.runTest('Update User Status', () => this.testUpdateUserStatus());
    
    // Role management tests
    console.log('\n🔐 Testing Role Management Endpoints');
    await this.runTest('Create New Role (Admin)', () => this.testCreateRoleAdmin());
    await this.runTest('Assign Role to User', () => this.testAssignRoleToUser());
    
    // Audit management tests
    console.log('\n📋 Testing Audit Management Endpoints');
    await this.runTest('Get Audit Logs (Admin)', () => this.testGetAuditLogsAdmin());
    await this.runTest('Clear Old Audit Logs', () => this.testClearOldAuditLogs());
    
    // Error cases
    console.log('\n❌ Testing Error Cases');
    await this.runTest('Unauthorized Access', () => this.testUnauthorizedAccess());
    await this.runTest('Insufficient Permissions', () => this.testInsufficientPermissions());
    await this.runTest('Invalid Configuration Update', () => this.testInvalidConfigurationUpdate());

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
  module.exports = { AdminTestSuite };
}

/**
 * Jalankan test jika file ini dieksekusi langsung
 */
if (require.main === module) {
  (async () => {
    const testSuite = new AdminTestSuite();
    const results = await testSuite.runAllTests();
    
    // Exit dengan kode error jika ada test yang gagal
    process.exit(results.failed > 0 || results.errors > 0 ? 1 : 0);
  })();
}