/**
 * Test script untuk Audit API endpoints
 * Base URL: /api/v1/audit
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
let testAuditId = null;

/**
 * Test Suite untuk Audit
 */
class AuditTestSuite {
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

  // ==================== AUDIT LOGS TESTS ====================

  /**
   * Test: Get All Audit Logs
   */
  async testGetAllAuditLogs() {
    if (!adminToken) {
      return { success: false, error: 'No admin token available' };
    }

    const response = await makeRequest('/audit', {
      method: 'GET',
      headers: { 'Authorization': `Bearer ${adminToken}` }
    });

    if (response.status === 200 && response.data.success) {
      const auditLogs = response.data.data.auditLogs;
      if (auditLogs && Array.isArray(auditLogs)) {
        if (auditLogs.length > 0) {
          testAuditId = auditLogs[0].id;
        }
        return {
          success: true,
          details: `Retrieved ${auditLogs.length} audit logs`
        };
      } else {
        return { success: false, error: 'Audit logs data is not in expected format' };
      }
    } else {
      return {
        success: false,
        error: `Get audit logs failed: ${response.data.error || 'Unknown error'}`
      };
    }
  }

  /**
   * Test: Get Audit Log by ID
   */
  async testGetAuditLogById() {
    if (!adminToken || !testAuditId) {
      return { success: false, error: 'No admin token or test audit ID available' };
    }

    const response = await makeRequest(`/audit/${testAuditId}`, {
      method: 'GET',
      headers: { 'Authorization': `Bearer ${adminToken}` }
    });

    if (response.status === 200 && response.data.success) {
      const auditLog = response.data.data.auditLog;
      if (auditLog && auditLog.id === testAuditId) {
        return {
          success: true,
          details: `Retrieved audit log: ${auditLog.action || auditLog.id}`
        };
      } else {
        return { success: false, error: 'Audit log data is not in expected format' };
      }
    } else {
      return {
        success: false,
        error: `Get audit log by ID failed: ${response.data.error || 'Unknown error'}`
      };
    }
  }

  /**
   * Test: Get Audit Logs with Pagination
   */
  async testGetAuditLogsWithPagination() {
    if (!adminToken) {
      return { success: false, error: 'No admin token available' };
    }

    const response = await makeRequest('/audit?page=1&limit=10', {
      method: 'GET',
      headers: { 'Authorization': `Bearer ${adminToken}` }
    });

    if (response.status === 200 && response.data.success) {
      const data = response.data.data;
      if (data.auditLogs && Array.isArray(data.auditLogs) && 
          typeof data.pagination === 'object') {
        return {
          success: true,
          details: `Retrieved ${data.auditLogs.length} audit logs with pagination (page ${data.pagination.currentPage})`
        };
      } else {
        return { success: false, error: 'Paginated audit logs data is not in expected format' };
      }
    } else {
      return {
        success: false,
        error: `Get paginated audit logs failed: ${response.data.error || 'Unknown error'}`
      };
    }
  }

  /**
   * Test: Get Audit Logs by User
   */
  async testGetAuditLogsByUser() {
    if (!adminToken) {
      return { success: false, error: 'No admin token available' };
    }

    const response = await makeRequest('/audit/user/1', {
      method: 'GET',
      headers: { 'Authorization': `Bearer ${adminToken}` }
    });

    if (response.status === 200 && response.data.success) {
      const auditLogs = response.data.data.auditLogs;
      if (Array.isArray(auditLogs)) {
        return {
          success: true,
          details: `Retrieved ${auditLogs.length} audit logs for user 1`
        };
      } else {
        return { success: false, error: 'User audit logs data is not in expected format' };
      }
    } else {
      return {
        success: false,
        error: `Get audit logs by user failed: ${response.data.error || 'Unknown error'}`
      };
    }
  }

  /**
   * Test: Get Audit Logs by Action
   */
  async testGetAuditLogsByAction() {
    if (!adminToken) {
      return { success: false, error: 'No admin token available' };
    }

    const response = await makeRequest('/audit/action/login', {
      method: 'GET',
      headers: { 'Authorization': `Bearer ${adminToken}` }
    });

    if (response.status === 200 && response.data.success) {
      const auditLogs = response.data.data.auditLogs;
      if (Array.isArray(auditLogs)) {
        return {
          success: true,
          details: `Retrieved ${auditLogs.length} login audit logs`
        };
      } else {
        return { success: false, error: 'Action audit logs data is not in expected format' };
      }
    } else {
      return {
        success: false,
        error: `Get audit logs by action failed: ${response.data.error || 'Unknown error'}`
      };
    }
  }

  /**
   * Test: Get Audit Logs by Date Range
   */
  async testGetAuditLogsByDateRange() {
    if (!adminToken) {
      return { success: false, error: 'No admin token available' };
    }

    const endDate = new Date();
    const startDate = new Date(endDate.getTime() - (7 * 24 * 60 * 60 * 1000)); // 7 days ago

    const response = await makeRequest(`/audit/range?startDate=${startDate.toISOString()}&endDate=${endDate.toISOString()}`, {
      method: 'GET',
      headers: { 'Authorization': `Bearer ${adminToken}` }
    });

    if (response.status === 200 && response.data.success) {
      const auditLogs = response.data.data.auditLogs;
      if (Array.isArray(auditLogs)) {
        return {
          success: true,
          details: `Retrieved ${auditLogs.length} audit logs from last 7 days`
        };
      } else {
        return { success: false, error: 'Date range audit logs data is not in expected format' };
      }
    } else {
      return {
        success: false,
        error: `Get audit logs by date range failed: ${response.data.error || 'Unknown error'}`
      };
    }
  }

  /**
   * Test: Search Audit Logs
   */
  async testSearchAuditLogs() {
    if (!adminToken) {
      return { success: false, error: 'No admin token available' };
    }

    const response = await makeRequest('/audit/search?q=login', {
      method: 'GET',
      headers: { 'Authorization': `Bearer ${adminToken}` }
    });

    if (response.status === 200 && response.data.success) {
      const auditLogs = response.data.data.auditLogs;
      if (Array.isArray(auditLogs)) {
        return {
          success: true,
          details: `Found ${auditLogs.length} audit logs matching 'login'`
        };
      } else {
        return { success: false, error: 'Search audit logs data is not in expected format' };
      }
    } else {
      return {
        success: false,
        error: `Search audit logs failed: ${response.data.error || 'Unknown error'}`
      };
    }
  }

  // ==================== AUDIT STATISTICS TESTS ====================

  /**
   * Test: Get Audit Statistics
   */
  async testGetAuditStatistics() {
    if (!adminToken) {
      return { success: false, error: 'No admin token available' };
    }

    const response = await makeRequest('/audit/stats', {
      method: 'GET',
      headers: { 'Authorization': `Bearer ${adminToken}` }
    });

    if (response.status === 200 && response.data.success) {
      const stats = response.data.data.statistics;
      if (stats && typeof stats === 'object') {
        return {
          success: true,
          details: `Retrieved audit statistics with ${Object.keys(stats).length} metrics`
        };
      } else {
        return { success: false, error: 'Audit statistics data is not in expected format' };
      }
    } else {
      return {
        success: false,
        error: `Get audit statistics failed: ${response.data.error || 'Unknown error'}`
      };
    }
  }

  /**
   * Test: Get Audit Statistics by Period
   */
  async testGetAuditStatsByPeriod() {
    if (!adminToken) {
      return { success: false, error: 'No admin token available' };
    }

    const response = await makeRequest('/audit/stats/daily?days=7', {
      method: 'GET',
      headers: { 'Authorization': `Bearer ${adminToken}` }
    });

    if (response.status === 200 && response.data.success) {
      const stats = response.data.data.statistics;
      if (Array.isArray(stats)) {
        return {
          success: true,
          details: `Retrieved daily audit statistics for ${stats.length} days`
        };
      } else {
        return { success: false, error: 'Daily audit statistics data is not in expected format' };
      }
    } else {
      return {
        success: false,
        error: `Get daily audit statistics failed: ${response.data.error || 'Unknown error'}`
      };
    }
  }

  // ==================== AUDIT EXPORT TESTS ====================

  /**
   * Test: Export Audit Logs
   */
  async testExportAuditLogs() {
    if (!adminToken) {
      return { success: false, error: 'No admin token available' };
    }

    const response = await makeRequest('/audit/export?format=csv', {
      method: 'GET',
      headers: { 'Authorization': `Bearer ${adminToken}` }
    });

    if (response.status === 200) {
      // Check if response contains CSV data or export URL
      if (response.data && (typeof response.data === 'string' || response.data.exportUrl)) {
        return {
          success: true,
          details: 'Audit logs export initiated successfully'
        };
      } else {
        return { success: false, error: 'Export response is not in expected format' };
      }
    } else {
      return {
        success: false,
        error: `Export audit logs failed: ${response.data?.error || 'Unknown error'}`
      };
    }
  }

  // ==================== ERROR CASES ====================

  /**
   * Test: Unauthorized Access (tanpa token)
   */
  async testUnauthorizedAccess() {
    const response = await makeRequest('/audit', {
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
   * Test: Invalid Audit Log ID
   */
  async testInvalidAuditLogId() {
    if (!adminToken) {
      return { success: false, error: 'No admin token available' };
    }

    const response = await makeRequest('/audit/99999', {
      method: 'GET',
      headers: { 'Authorization': `Bearer ${adminToken}` }
    });

    if (response.status === 404 && !response.data.success) {
      return {
        success: true,
        details: 'Invalid audit log ID correctly handled'
      };
    } else {
      return {
        success: false,
        error: 'Invalid audit log ID should return 404'
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

    const response = await makeRequest(`/audit/range?startDate=${startDate.toISOString()}&endDate=${endDate.toISOString()}`, {
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
   * Test: Invalid Export Format
   */
  async testInvalidExportFormat() {
    if (!adminToken) {
      return { success: false, error: 'No admin token available' };
    }

    const response = await makeRequest('/audit/export?format=invalid', {
      method: 'GET',
      headers: { 'Authorization': `Bearer ${adminToken}` }
    });

    if (response.status === 400 && !response.data.success) {
      return {
        success: true,
        details: 'Invalid export format correctly rejected'
      };
    } else {
      return {
        success: false,
        error: 'Invalid export format should return 400'
      };
    }
  }

  /**
   * Menjalankan semua test audit
   */
  async runAllTests() {
    console.log('🚀 Starting Audit API Tests');
    console.log('============================');

    // Setup
    await this.runTest('Admin Login Setup', () => this.setupAdminLogin());
    
    // Basic audit logs tests
    console.log('\n📋 Testing Basic Audit Endpoints');
    await this.runTest('Get All Audit Logs', () => this.testGetAllAuditLogs());
    await this.runTest('Get Audit Log by ID', () => this.testGetAuditLogById());
    await this.runTest('Get Audit Logs with Pagination', () => this.testGetAuditLogsWithPagination());
    
    // Filtered audit logs tests
    console.log('\n🔍 Testing Filtered Audit Endpoints');
    await this.runTest('Get Audit Logs by User', () => this.testGetAuditLogsByUser());
    await this.runTest('Get Audit Logs by Action', () => this.testGetAuditLogsByAction());
    await this.runTest('Get Audit Logs by Date Range', () => this.testGetAuditLogsByDateRange());
    await this.runTest('Search Audit Logs', () => this.testSearchAuditLogs());
    
    // Statistics tests
    console.log('\n📊 Testing Audit Statistics Endpoints');
    await this.runTest('Get Audit Statistics', () => this.testGetAuditStatistics());
    await this.runTest('Get Audit Stats by Period', () => this.testGetAuditStatsByPeriod());
    
    // Export tests
    console.log('\n📤 Testing Audit Export Endpoints');
    await this.runTest('Export Audit Logs', () => this.testExportAuditLogs());
    
    // Error cases
    console.log('\n❌ Testing Error Cases');
    await this.runTest('Unauthorized Access', () => this.testUnauthorizedAccess());
    await this.runTest('Invalid Audit Log ID', () => this.testInvalidAuditLogId());
    await this.runTest('Invalid Date Range', () => this.testInvalidDateRange());
    await this.runTest('Invalid Export Format', () => this.testInvalidExportFormat());

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
  module.exports = { AuditTestSuite };
}

/**
 * Jalankan test jika file ini dieksekusi langsung
 */
if (require.main === module) {
  (async () => {
    const testSuite = new AuditTestSuite();
    const results = await testSuite.runAllTests();
    
    // Exit dengan kode error jika ada test yang gagal
    process.exit(results.failed > 0 || results.errors > 0 ? 1 : 0);
  })();
}