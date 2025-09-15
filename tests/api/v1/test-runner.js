/**
 * Test Runner Utama untuk YesMan API v1
 * Menjalankan semua test suite secara berurutan
 */

const fs = require('fs');
const path = require('path');

// Import fetch untuk Node.js compatibility
let fetch;
try {
  fetch = globalThis.fetch || require('node-fetch');
} catch (error) {
  console.warn('⚠️  fetch not available, some features may not work');
}

// Import semua test suite
const { AuthTestSuite } = require('./auth.test.js');
const { UserTestSuite } = require('./users.test.js');
const { RBACTestSuite } = require('./rbac.test.js');
const { ABACTestSuite } = require('./abac.test.js');
const { AuditTestSuite } = require('./audit.test.js');
const { DashboardTestSuite } = require('./dashboard.test.js');
const { AdminTestSuite } = require('./admin.test.js');

/**
 * Konfigurasi test runner
 */
const CONFIG = {
  baseUrl: process.env.API_BASE_URL || 'http://localhost:3000',
  timeout: 30000, // 30 detik timeout per test
  retries: 1, // Retry sekali jika gagal
  parallel: false, // Jalankan secara sequential untuk menghindari konflik
  generateReport: true,
  reportPath: './test-results'
};

/**
 * Main Test Runner Class
 */
class APITestRunner {
  constructor(config = CONFIG) {
    this.config = config;
    this.results = {
      startTime: null,
      endTime: null,
      duration: 0,
      suites: [],
      summary: {
        totalTests: 0,
        passed: 0,
        failed: 0,
        errors: 0,
        skipped: 0,
        successRate: 0
      }
    };
  }

  /**
   * Menjalankan satu test suite dengan error handling
   */
  async runTestSuite(SuiteClass, suiteName) {
    console.log(`\n🎯 Starting ${suiteName} Test Suite`);
    console.log('='.repeat(50));
    
    const startTime = Date.now();
    let suiteResult = {
      name: suiteName,
      startTime,
      endTime: null,
      duration: 0,
      status: 'RUNNING',
      results: null,
      error: null
    };

    try {
      const testSuite = new SuiteClass();
      const results = await this.runWithTimeout(
        () => testSuite.runAllTests(),
        this.config.timeout
      );
      
      suiteResult.endTime = Date.now();
      suiteResult.duration = suiteResult.endTime - startTime;
      suiteResult.status = 'COMPLETED';
      suiteResult.results = results;
      
      console.log(`\n✅ ${suiteName} completed in ${(suiteResult.duration / 1000).toFixed(2)}s`);
      
    } catch (error) {
      suiteResult.endTime = Date.now();
      suiteResult.duration = suiteResult.endTime - startTime;
      suiteResult.status = 'ERROR';
      suiteResult.error = error.message;
      
      console.log(`\n❌ ${suiteName} failed: ${error.message}`);
      
      // Retry jika diaktifkan
      if (this.config.retries > 0) {
        console.log(`🔄 Retrying ${suiteName}...`);
        try {
          const testSuite = new SuiteClass();
          const results = await this.runWithTimeout(
            () => testSuite.runAllTests(),
            this.config.timeout
          );
          
          suiteResult.status = 'COMPLETED';
          suiteResult.results = results;
          suiteResult.error = null;
          
          console.log(`✅ ${suiteName} retry successful`);
        } catch (retryError) {
          console.log(`❌ ${suiteName} retry also failed: ${retryError.message}`);
        }
      }
    }

    this.results.suites.push(suiteResult);
    return suiteResult;
  }

  /**
   * Menjalankan fungsi dengan timeout
   */
  async runWithTimeout(fn, timeout) {
    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => {
        reject(new Error(`Test suite timeout after ${timeout}ms`));
      }, timeout);

      fn()
        .then(result => {
          clearTimeout(timer);
          resolve(result);
        })
        .catch(error => {
          clearTimeout(timer);
          reject(error);
        });
    });
  }

  /**
   * Menghitung summary dari semua hasil test
   */
  calculateSummary() {
    let totalTests = 0;
    let passed = 0;
    let failed = 0;
    let errors = 0;
    let skipped = 0;

    this.results.suites.forEach(suite => {
      if (suite.results) {
        totalTests += suite.results.total || 0;
        passed += suite.results.passed || 0;
        failed += suite.results.failed || 0;
        errors += suite.results.errors || 0;
      } else if (suite.status === 'ERROR') {
        errors += 1;
        totalTests += 1;
      }
    });

    const successRate = totalTests > 0 ? ((passed / totalTests) * 100) : 0;

    this.results.summary = {
      totalTests,
      passed,
      failed,
      errors,
      skipped,
      successRate: parseFloat(successRate.toFixed(2))
    };
  }

  /**
   * Menampilkan hasil akhir
   */
  displayFinalResults() {
    console.log('\n' + '='.repeat(60));
    console.log('🏁 FINAL TEST RESULTS');
    console.log('='.repeat(60));
    
    const { summary } = this.results;
    
    console.log(`⏱️  Total Duration: ${(this.results.duration / 1000).toFixed(2)}s`);
    console.log(`📊 Total Tests: ${summary.totalTests}`);
    console.log(`✅ Passed: ${summary.passed}`);
    console.log(`❌ Failed: ${summary.failed}`);
    console.log(`💥 Errors: ${summary.errors}`);
    console.log(`⏭️  Skipped: ${summary.skipped}`);
    console.log(`📈 Success Rate: ${summary.successRate}%`);
    
    console.log('\n📋 Suite Results:');
    this.results.suites.forEach(suite => {
      const status = suite.status === 'COMPLETED' ? '✅' : '❌';
      const duration = (suite.duration / 1000).toFixed(2);
      console.log(`  ${status} ${suite.name}: ${duration}s`);
      
      if (suite.results) {
        console.log(`     Tests: ${suite.results.passed}/${suite.results.total} passed`);
      }
      
      if (suite.error) {
        console.log(`     Error: ${suite.error}`);
      }
    });

    // Tampilkan detail kegagalan jika ada
    const failedSuites = this.results.suites.filter(s => 
      s.status === 'ERROR' || (s.results && (s.results.failed > 0 || s.results.errors > 0))
    );
    
    if (failedSuites.length > 0) {
      console.log('\n🔍 Failure Details:');
      failedSuites.forEach(suite => {
        console.log(`\n  📦 ${suite.name}:`);
        
        if (suite.error) {
          console.log(`    💥 Suite Error: ${suite.error}`);
        }
        
        if (suite.results && suite.results.results) {
          const failedTests = suite.results.results.filter(r => r.status !== 'PASS');
          failedTests.forEach(test => {
            console.log(`    ${test.status === 'FAIL' ? '❌' : '💥'} ${test.test}: ${test.error}`);
          });
        }
      });
    }
  }

  /**
   * Generate laporan dalam format JSON
   */
  async generateJSONReport() {
    if (!this.config.generateReport) return;

    try {
      // Buat direktori jika belum ada
      const reportDir = path.resolve(this.config.reportPath);
      if (!fs.existsSync(reportDir)) {
        fs.mkdirSync(reportDir, { recursive: true });
      }

      // Generate nama file dengan timestamp
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const reportFile = path.join(reportDir, `api-test-results-${timestamp}.json`);
      
      // Tulis hasil ke file
      fs.writeFileSync(reportFile, JSON.stringify(this.results, null, 2));
      
      console.log(`\n📄 Test report saved to: ${reportFile}`);
      
    } catch (error) {
      console.log(`\n⚠️  Failed to generate report: ${error.message}`);
    }
  }

  /**
   * Generate laporan dalam format HTML
   */
  async generateHTMLReport() {
    if (!this.config.generateReport) return;

    try {
      const reportDir = path.resolve(this.config.reportPath);
      if (!fs.existsSync(reportDir)) {
        fs.mkdirSync(reportDir, { recursive: true });
      }

      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const reportFile = path.join(reportDir, `api-test-results-${timestamp}.html`);
      
      const htmlContent = this.generateHTMLContent();
      fs.writeFileSync(reportFile, htmlContent);
      
      console.log(`📄 HTML report saved to: ${reportFile}`);
      
    } catch (error) {
      console.log(`⚠️  Failed to generate HTML report: ${error.message}`);
    }
  }

  /**
   * Generate konten HTML untuk laporan
   */
  generateHTMLContent() {
    const { summary } = this.results;
    const timestamp = new Date().toISOString();
    
    return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>YesMan API Test Results</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; background-color: #f5f5f5; }
        .container { max-width: 1200px; margin: 0 auto; background: white; padding: 20px; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
        .header { text-align: center; margin-bottom: 30px; }
        .summary { display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap: 15px; margin-bottom: 30px; }
        .metric { background: #f8f9fa; padding: 15px; border-radius: 6px; text-align: center; }
        .metric-value { font-size: 24px; font-weight: bold; margin-bottom: 5px; }
        .metric-label { color: #666; font-size: 14px; }
        .passed { color: #28a745; }
        .failed { color: #dc3545; }
        .error { color: #fd7e14; }
        .suite { margin-bottom: 20px; border: 1px solid #dee2e6; border-radius: 6px; }
        .suite-header { background: #e9ecef; padding: 15px; font-weight: bold; }
        .suite-content { padding: 15px; }
        .test-item { padding: 8px 0; border-bottom: 1px solid #f1f3f4; }
        .test-item:last-child { border-bottom: none; }
        .status-pass { color: #28a745; }
        .status-fail { color: #dc3545; }
        .status-error { color: #fd7e14; }
        .progress-bar { width: 100%; height: 20px; background: #e9ecef; border-radius: 10px; overflow: hidden; margin: 10px 0; }
        .progress-fill { height: 100%; background: linear-gradient(90deg, #28a745, #20c997); transition: width 0.3s ease; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🧪 YesMan API Test Results</h1>
            <p>Generated on: ${timestamp}</p>
            <p>Duration: ${(this.results.duration / 1000).toFixed(2)} seconds</p>
        </div>
        
        <div class="summary">
            <div class="metric">
                <div class="metric-value">${summary.totalTests}</div>
                <div class="metric-label">Total Tests</div>
            </div>
            <div class="metric">
                <div class="metric-value passed">${summary.passed}</div>
                <div class="metric-label">Passed</div>
            </div>
            <div class="metric">
                <div class="metric-value failed">${summary.failed}</div>
                <div class="metric-label">Failed</div>
            </div>
            <div class="metric">
                <div class="metric-value error">${summary.errors}</div>
                <div class="metric-label">Errors</div>
            </div>
            <div class="metric">
                <div class="metric-value">${summary.successRate}%</div>
                <div class="metric-label">Success Rate</div>
            </div>
        </div>
        
        <div class="progress-bar">
            <div class="progress-fill" style="width: ${summary.successRate}%"></div>
        </div>
        
        <div class="suites">
            ${this.results.suites.map(suite => `
                <div class="suite">
                    <div class="suite-header">
                        ${suite.status === 'COMPLETED' ? '✅' : '❌'} ${suite.name}
                        <span style="float: right;">${(suite.duration / 1000).toFixed(2)}s</span>
                    </div>
                    <div class="suite-content">
                        ${suite.error ? `<p class="error">Error: ${suite.error}</p>` : ''}
                        ${suite.results && suite.results.results ? suite.results.results.map(test => `
                            <div class="test-item">
                                <span class="status-${test.status.toLowerCase()}">
                                    ${test.status === 'PASS' ? '✅' : test.status === 'FAIL' ? '❌' : '💥'}
                                </span>
                                ${test.test}
                                ${test.error ? `<br><small style="color: #666;">Error: ${test.error}</small>` : ''}
                                ${test.details ? `<br><small style="color: #666;">${test.details}</small>` : ''}
                            </div>
                        `).join('') : ''}
                    </div>
                </div>
            `).join('')}
        </div>
    </div>
</body>
</html>`;
  }

  /**
   * Cek apakah server sedang berjalan
   */
  async checkServerHealth() {
    console.log('🔍 Checking server health...');
    
    try {
      // Coba beberapa endpoint untuk health check
      const endpoints = [
        `${this.config.baseUrl}/api/v1/health`,
        `${this.config.baseUrl}/api/v1/version`,
        `${this.config.baseUrl}/api/health`,
        `${this.config.baseUrl}/`
      ];
      
      for (const endpoint of endpoints) {
        try {
          const response = await fetch(endpoint);
          
          // Jika response OK atau bahkan 401/403, berarti server berjalan
          if (response.status < 500) {
            console.log(`✅ Server is running (${response.status} from ${endpoint})`);
            return true;
          }
        } catch (endpointError) {
          // Lanjut ke endpoint berikutnya
          continue;
        }
      }
      
      console.log('❌ All health check endpoints failed');
      return false;
      
    } catch (error) {
      console.log(`❌ Server health check failed: ${error.message}`);
      console.log('💡 Make sure the server is running on', this.config.baseUrl);
      return false;
    }
  }

  /**
   * Menjalankan semua test suite
   */
  async runAllTests() {
    console.log('🚀 YesMan API Test Runner v1.0');
    console.log('================================');
    console.log(`Base URL: ${this.config.baseUrl}`);
    console.log(`Timeout: ${this.config.timeout}ms`);
    console.log(`Retries: ${this.config.retries}`);
    
    this.results.startTime = Date.now();
    
    // Cek kesehatan server terlebih dahulu
    const serverHealthy = await this.checkServerHealth();
    if (!serverHealthy) {
      console.log('\n❌ Aborting tests due to server health check failure');
      process.exit(1);
    }
    
    // Daftar test suite yang akan dijalankan
    const testSuites = [
      { class: AuthTestSuite, name: 'Authentication' },
      { class: UserTestSuite, name: 'User Management' },
      { class: RBACTestSuite, name: 'RBAC (Role-Based Access Control)' },
      { class: ABACTestSuite, name: 'ABAC (Attribute-Based Access Control)' },
      { class: AuditTestSuite, name: 'Audit Logging' },
      { class: DashboardTestSuite, name: 'Dashboard Statistics' },
      { class: AdminTestSuite, name: 'Admin Management' }
    ];
    
    // Jalankan setiap test suite
    for (const suite of testSuites) {
      await this.runTestSuite(suite.class, suite.name);
      
      // Jeda sebentar antar suite untuk menghindari rate limiting
      if (testSuites.indexOf(suite) < testSuites.length - 1) {
        console.log('⏳ Waiting 2 seconds before next suite...');
        await new Promise(resolve => setTimeout(resolve, 2000));
      }
    }
    
    this.results.endTime = Date.now();
    this.results.duration = this.results.endTime - this.results.startTime;
    
    // Hitung summary
    this.calculateSummary();
    
    // Tampilkan hasil
    this.displayFinalResults();
    
    // Generate laporan
    await this.generateJSONReport();
    await this.generateHTMLReport();
    
    return this.results;
  }
}

/**
 * Fungsi utilitas untuk menjalankan test runner
 */
async function runAPITests(config = {}) {
  const runner = new APITestRunner({ ...CONFIG, ...config });
  return await runner.runAllTests();
}

/**
 * Export untuk penggunaan sebagai module
 */
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { 
    APITestRunner, 
    runAPITests,
    CONFIG 
  };
}

/**
 * Jalankan test jika file ini dieksekusi langsung
 */
if (require.main === module) {
  (async () => {
    try {
      const results = await runAPITests();
      
      // Exit dengan kode sesuai hasil test
      const exitCode = results.summary.failed > 0 || results.summary.errors > 0 ? 1 : 0;
      
      console.log(`\n🏁 Test runner finished with exit code: ${exitCode}`);
      process.exit(exitCode);
      
    } catch (error) {
      console.error('💥 Test runner crashed:', error.message);
      process.exit(1);
    }
  })();
}