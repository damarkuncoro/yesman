/**
 * Test script untuk ABAC (Attribute-Based Access Control) API endpoints
 * Base URLs: /api/v1/policies, /api/v1/attributes
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
let testPolicyId = null;
let testAttributeId = null;

/**
 * Test Suite untuk ABAC
 */
class ABACTestSuite {
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

  // ==================== POLICIES TESTS ====================

  /**
   * Test: Get All Policies
   */
  async testGetAllPolicies() {
    if (!adminToken) {
      return { success: false, error: 'No admin token available' };
    }

    const response = await makeRequest('/policies', {
      method: 'GET',
      headers: { 'Authorization': `Bearer ${adminToken}` }
    });

    if (response.status === 200 && response.data.success) {
      const policies = response.data.data.policies;
      if (policies && Array.isArray(policies)) {
        if (policies.length > 0) {
          testPolicyId = policies[0].id;
        }
        return {
          success: true,
          details: `Retrieved ${policies.length} policies`
        };
      } else {
        return { success: false, error: 'Policies data is not in expected format' };
      }
    } else {
      return {
        success: false,
        error: `Get policies failed: ${response.data.error || 'Unknown error'}`
      };
    }
  }

  /**
   * Test: Get Policy by ID
   */
  async testGetPolicyById() {
    if (!adminToken || !testPolicyId) {
      return { success: false, error: 'No admin token or test policy ID available' };
    }

    const response = await makeRequest(`/policies/${testPolicyId}`, {
      method: 'GET',
      headers: { 'Authorization': `Bearer ${adminToken}` }
    });

    if (response.status === 200 && response.data.success) {
      const policy = response.data.data.policy;
      if (policy && policy.id === testPolicyId) {
        return {
          success: true,
          details: `Retrieved policy: ${policy.name || policy.id}`
        };
      } else {
        return { success: false, error: 'Policy data is not in expected format' };
      }
    } else {
      return {
        success: false,
        error: `Get policy by ID failed: ${response.data.error || 'Unknown error'}`
      };
    }
  }

  /**
   * Test: Get Policy Rules
   */
  async testGetPolicyRules() {
    if (!adminToken || !testPolicyId) {
      return { success: false, error: 'No admin token or test policy ID available' };
    }

    const response = await makeRequest(`/policies/${testPolicyId}/rules`, {
      method: 'GET',
      headers: { 'Authorization': `Bearer ${adminToken}` }
    });

    if (response.status === 200 && response.data.success) {
      const rules = response.data.data.rules;
      if (Array.isArray(rules)) {
        return {
          success: true,
          details: `Policy has ${rules.length} rules`
        };
      } else {
        return { success: false, error: 'Rules data is not in expected format' };
      }
    } else {
      return {
        success: false,
        error: `Get policy rules failed: ${response.data.error || 'Unknown error'}`
      };
    }
  }

  /**
   * Test: Evaluate Policy
   */
  async testEvaluatePolicy() {
    if (!adminToken || !testPolicyId) {
      return { success: false, error: 'No admin token or test policy ID available' };
    }

    // Sample evaluation context
    const evaluationContext = {
      user: {
        id: 1,
        role: 'admin',
        department: 'IT'
      },
      resource: {
        type: 'document',
        owner: 1,
        classification: 'public'
      },
      action: 'read',
      environment: {
        time: new Date().toISOString(),
        location: 'office'
      }
    };

    const response = await makeRequest(`/policies/${testPolicyId}/evaluate`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${adminToken}` },
      body: evaluationContext
    });

    if (response.status === 200 && response.data.success) {
      const evaluation = response.data.data.evaluation;
      if (evaluation && typeof evaluation.decision !== 'undefined') {
        return {
          success: true,
          details: `Policy evaluation result: ${evaluation.decision}`
        };
      } else {
        return { success: false, error: 'Evaluation data is not in expected format' };
      }
    } else {
      return {
        success: false,
        error: `Policy evaluation failed: ${response.data.error || 'Unknown error'}`
      };
    }
  }

  // ==================== ATTRIBUTES TESTS ====================

  /**
   * Test: Get All Attributes
   */
  async testGetAllAttributes() {
    if (!adminToken) {
      return { success: false, error: 'No admin token available' };
    }

    const response = await makeRequest('/attributes', {
      method: 'GET',
      headers: { 'Authorization': `Bearer ${adminToken}` }
    });

    if (response.status === 200 && response.data.success) {
      const attributes = response.data.data.attributes;
      if (attributes && Array.isArray(attributes)) {
        if (attributes.length > 0) {
          testAttributeId = attributes[0].id;
        }
        return {
          success: true,
          details: `Retrieved ${attributes.length} attributes`
        };
      } else {
        return { success: false, error: 'Attributes data is not in expected format' };
      }
    } else {
      return {
        success: false,
        error: `Get attributes failed: ${response.data.error || 'Unknown error'}`
      };
    }
  }

  /**
   * Test: Get Attribute by ID
   */
  async testGetAttributeById() {
    if (!adminToken || !testAttributeId) {
      return { success: false, error: 'No admin token or test attribute ID available' };
    }

    const response = await makeRequest(`/attributes/${testAttributeId}`, {
      method: 'GET',
      headers: { 'Authorization': `Bearer ${adminToken}` }
    });

    if (response.status === 200 && response.data.success) {
      const attribute = response.data.data.attribute;
      if (attribute && attribute.id === testAttributeId) {
        return {
          success: true,
          details: `Retrieved attribute: ${attribute.name || attribute.key}`
        };
      } else {
        return { success: false, error: 'Attribute data is not in expected format' };
      }
    } else {
      return {
        success: false,
        error: `Get attribute by ID failed: ${response.data.error || 'Unknown error'}`
      };
    }
  }

  /**
   * Test: Get Attributes by Category
   */
  async testGetAttributesByCategory() {
    if (!adminToken) {
      return { success: false, error: 'No admin token available' };
    }

    const response = await makeRequest('/attributes?category=user', {
      method: 'GET',
      headers: { 'Authorization': `Bearer ${adminToken}` }
    });

    if (response.status === 200 && response.data.success) {
      const attributes = response.data.data.attributes;
      if (Array.isArray(attributes)) {
        return {
          success: true,
          details: `Retrieved ${attributes.length} user attributes`
        };
      } else {
        return { success: false, error: 'Attributes data is not in expected format' };
      }
    } else {
      return {
        success: false,
        error: `Get attributes by category failed: ${response.data.error || 'Unknown error'}`
      };
    }
  }

  /**
   * Test: Get User Attributes
   */
  async testGetUserAttributes() {
    if (!adminToken) {
      return { success: false, error: 'No admin token available' };
    }

    const response = await makeRequest('/attributes/user/1', {
      method: 'GET',
      headers: { 'Authorization': `Bearer ${adminToken}` }
    });

    if (response.status === 200 && response.data.success) {
      const userAttributes = response.data.data.attributes;
      if (userAttributes && typeof userAttributes === 'object') {
        return {
          success: true,
          details: `Retrieved user attributes with ${Object.keys(userAttributes).length} properties`
        };
      } else {
        return { success: false, error: 'User attributes data is not in expected format' };
      }
    } else {
      return {
        success: false,
        error: `Get user attributes failed: ${response.data.error || 'Unknown error'}`
      };
    }
  }

  // ==================== POLICY EVALUATION TESTS ====================

  /**
   * Test: Batch Policy Evaluation
   */
  async testBatchPolicyEvaluation() {
    if (!adminToken) {
      return { success: false, error: 'No admin token available' };
    }

    const batchRequest = {
      evaluations: [
        {
          policyId: testPolicyId || 1,
          context: {
            user: { id: 1, role: 'admin' },
            resource: { type: 'document', id: 1 },
            action: 'read'
          }
        },
        {
          policyId: testPolicyId || 1,
          context: {
            user: { id: 2, role: 'user' },
            resource: { type: 'document', id: 1 },
            action: 'write'
          }
        }
      ]
    };

    const response = await makeRequest('/policies/evaluate/batch', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${adminToken}` },
      body: batchRequest
    });

    if (response.status === 200 && response.data.success) {
      const results = response.data.data.results;
      if (Array.isArray(results) && results.length === 2) {
        return {
          success: true,
          details: `Batch evaluation completed for ${results.length} requests`
        };
      } else {
        return { success: false, error: 'Batch evaluation results not in expected format' };
      }
    } else {
      return {
        success: false,
        error: `Batch policy evaluation failed: ${response.data.error || 'Unknown error'}`
      };
    }
  }

  // ==================== ERROR CASES ====================

  /**
   * Test: Unauthorized Access (tanpa token)
   */
  async testUnauthorizedAccess() {
    const response = await makeRequest('/policies', {
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
   * Test: Invalid Policy ID
   */
  async testInvalidPolicyId() {
    if (!adminToken) {
      return { success: false, error: 'No admin token available' };
    }

    const response = await makeRequest('/policies/99999', {
      method: 'GET',
      headers: { 'Authorization': `Bearer ${adminToken}` }
    });

    if (response.status === 404 && !response.data.success) {
      return {
        success: true,
        details: 'Invalid policy ID correctly handled'
      };
    } else {
      return {
        success: false,
        error: 'Invalid policy ID should return 404'
      };
    }
  }

  /**
   * Test: Invalid Attribute ID
   */
  async testInvalidAttributeId() {
    if (!adminToken) {
      return { success: false, error: 'No admin token available' };
    }

    const response = await makeRequest('/attributes/99999', {
      method: 'GET',
      headers: { 'Authorization': `Bearer ${adminToken}` }
    });

    if (response.status === 404 && !response.data.success) {
      return {
        success: true,
        details: 'Invalid attribute ID correctly handled'
      };
    } else {
      return {
        success: false,
        error: 'Invalid attribute ID should return 404'
      };
    }
  }

  /**
   * Test: Invalid Policy Evaluation Context
   */
  async testInvalidEvaluationContext() {
    if (!adminToken || !testPolicyId) {
      return { success: false, error: 'No admin token or test policy ID available' };
    }

    // Invalid context (missing required fields)
    const invalidContext = {
      user: { id: 1 }
      // Missing resource, action, etc.
    };

    const response = await makeRequest(`/policies/${testPolicyId}/evaluate`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${adminToken}` },
      body: invalidContext
    });

    if (response.status === 400 && !response.data.success) {
      return {
        success: true,
        details: 'Invalid evaluation context correctly rejected'
      };
    } else {
      return {
        success: false,
        error: 'Invalid evaluation context should return 400'
      };
    }
  }

  /**
   * Menjalankan semua test ABAC
   */
  async runAllTests() {
    console.log('🚀 Starting ABAC API Tests');
    console.log('===========================');

    // Setup
    await this.runTest('Admin Login Setup', () => this.setupAdminLogin());
    
    // Policies tests
    console.log('\n📋 Testing Policies Endpoints');
    await this.runTest('Get All Policies', () => this.testGetAllPolicies());
    await this.runTest('Get Policy by ID', () => this.testGetPolicyById());
    await this.runTest('Get Policy Rules', () => this.testGetPolicyRules());
    await this.runTest('Evaluate Policy', () => this.testEvaluatePolicy());
    
    // Attributes tests
    console.log('\n🏷️  Testing Attributes Endpoints');
    await this.runTest('Get All Attributes', () => this.testGetAllAttributes());
    await this.runTest('Get Attribute by ID', () => this.testGetAttributeById());
    await this.runTest('Get Attributes by Category', () => this.testGetAttributesByCategory());
    await this.runTest('Get User Attributes', () => this.testGetUserAttributes());
    
    // Advanced tests
    console.log('\n⚡ Testing Advanced Features');
    await this.runTest('Batch Policy Evaluation', () => this.testBatchPolicyEvaluation());
    
    // Error cases
    console.log('\n❌ Testing Error Cases');
    await this.runTest('Unauthorized Access', () => this.testUnauthorizedAccess());
    await this.runTest('Invalid Policy ID', () => this.testInvalidPolicyId());
    await this.runTest('Invalid Attribute ID', () => this.testInvalidAttributeId());
    await this.runTest('Invalid Evaluation Context', () => this.testInvalidEvaluationContext());

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
  module.exports = { ABACTestSuite };
}

/**
 * Jalankan test jika file ini dieksekusi langsung
 */
if (require.main === module) {
  (async () => {
    const testSuite = new ABACTestSuite();
    const results = await testSuite.runAllTests();
    
    // Exit dengan kode error jika ada test yang gagal
    process.exit(results.failed > 0 || results.errors > 0 ? 1 : 0);
  })();
}