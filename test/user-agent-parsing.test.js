/**
 * Comprehensive User Agent String Parsing Tests
 * Tests parsing of popular user agent strings (>10% market share)
 */

import { JSDOM } from 'jsdom';
import './crypto-shim.js';

// Popular User Agent Strings (>10% market share combined)
const POPULAR_USER_AGENTS = {
  // Chrome Desktop (Windows) - ~30% market share
  chrome_windows_latest: {
    ua: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    expected: {
      os: 'windows',
      os_ver: '10.0',
      browser: 'chrome',
      browser_ver: '120.0.0.0',
      device_type: 'desktop',
      device_family: 'desktop',
    },
  },

  // Chrome Desktop (macOS) - ~8% market share
  chrome_macos_latest: {
    ua: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    expected: {
      os: 'mac',
      os_ver: '10.15.7',
      browser: 'chrome',
      browser_ver: '120.0.0.0',
      device_type: 'desktop',
      device_family: 'desktop',
    },
  },

  // Safari Desktop (macOS) - ~6% market share
  safari_macos_latest: {
    ua: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.1 Safari/605.1.15',
    expected: {
      os: 'mac',
      os_ver: '10.15.7',
      browser: 'safari',
      browser_ver: '17.1',
      device_type: 'desktop',
      device_family: 'desktop',
    },
  },

  // Chrome Mobile (Android) - ~25% market share
  chrome_android_latest: {
    ua: 'Mozilla/5.0 (Linux; Android 14; SM-G998B) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Mobile Safari/537.36',
    expected: {
      os: 'android',
      os_ver: '14',
      browser: 'chrome',
      browser_ver: '120.0.0.0',
      device_type: 'android',
      device_family: 'mobile',
    },
  },

  // Safari Mobile (iOS iPhone) - ~15% market share
  safari_ios_iphone_latest: {
    ua: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_1_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.1 Mobile/15E148 Safari/604.1',
    expected: {
      os: 'ios',
      os_ver: '17.1.1',
      browser: 'safari',
      browser_ver: '17.1',
      device_type: 'iphone',
      device_family: 'mobile',
    },
  },

  // Safari Mobile (iOS iPad) - ~8% market share
  safari_ios_ipad_latest: {
    ua: 'Mozilla/5.0 (iPad; CPU OS 17_1_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.1 Mobile/15E148 Safari/604.1',
    expected: {
      os: 'ios',
      os_ver: '17.1.1',
      browser: 'safari',
      browser_ver: '17.1',
      device_type: 'ipad',
      device_family: 'tablet',
    },
  },

  // Chrome Mobile (iOS) - ~5% market share
  chrome_ios_latest: {
    ua: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_1_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) CriOS/120.0.6099.119 Mobile/15E148 Safari/604.1',
    expected: {
      os: 'ios',
      os_ver: '17.1.1',
      browser: 'chrome',
      browser_ver: '120.0.6099.119',
      device_type: 'iphone',
      device_family: 'mobile',
    },
  },

  // Firefox Desktop (Windows) - ~3% market share
  firefox_windows_latest: {
    ua: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:120.0) Gecko/20100101 Firefox/120.0',
    expected: {
      os: 'windows',
      os_ver: '10.0',
      browser: 'firefox',
      browser_ver: '120.0',
      device_type: 'desktop',
      device_family: 'desktop',
    },
  },

  // Legacy Edge (EdgeHTML) - Historical
  edge_legacy_windows: {
    ua: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/70.0.3538.102 Safari/537.36 Edge/18.19041',
    expected: {
      os: 'windows',
      os_ver: '10.0',
      browser: 'edge',
      browser_ver: '18.19041',
      device_type: 'desktop',
      device_family: 'desktop',
    },
  },

  // Internet Explorer 11 - Legacy but still in use
  ie11_windows: {
    ua: 'Mozilla/5.0 (Windows NT 10.0; WOW64; Trident/7.0; rv:11.0) like Gecko',
    expected: {
      os: 'windows',
      os_ver: '10.0',
      browser: 'ie',
      browser_ver: '11.0',
      device_type: 'desktop',
      device_family: 'desktop',
    },
  },

  // Chrome on Linux - ~2% market share
  chrome_linux_latest: {
    ua: 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    expected: {
      os: 'linux',
      os_ver: 'unknown',
      browser: 'chrome',
      browser_ver: '120.0.0.0',
      device_type: 'desktop',
      device_family: 'desktop',
    },
  },

  // Android Tablet (Chrome)
  chrome_android_tablet: {
    ua: 'Mozilla/5.0 (Linux; Android 14; SM-T870) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    expected: {
      os: 'android',
      os_ver: '14',
      browser: 'chrome',
      browser_ver: '120.0.0.0',
      device_type: 'android_tablet',
      device_family: 'tablet',
    },
  },
};

/**
 * Test user agent parsing by mocking navigator.userAgent
 */
async function testUserAgentParsing() {
  console.log('🔍 COMPREHENSIVE USER AGENT PARSING TESTS');
  console.log('==========================================');
  console.log(
    `Testing ${Object.keys(POPULAR_USER_AGENTS).length} popular user agent strings\n`
  );

  let totalTests = 0;
  let passedTests = 0;
  let failedTests = [];

  for (const [testName, testData] of Object.entries(POPULAR_USER_AGENTS)) {
    console.log(`📱 Testing: ${testName}`);
    console.log(`   UA: ${testData.ua.substring(0, 80)}...`);

    // Create a new JSDOM instance for each test
    const dom = new JSDOM(`<!DOCTYPE html><html><body></body></html>`, {
      url: 'https://example.com',
      userAgent: testData.ua,
    });

    // Set up globals
    global.window = dom.window;
    global.document = dom.window.document;
    Object.defineProperty(global, 'navigator', {
      value: dom.window.navigator,
      writable: true,
      configurable: true,
    });
    global.localStorage = {
      getItem: () => null,
      setItem: () => {},
      removeItem: () => {},
    };

    try {
      // Import DataCortex using the same pattern as existing tests
      await import('../dist/browser-data-cortex.min.js');
      const DataCortex = global.DataCortex;

      // Set up fetch mock to capture the data
      let capturedData = null;
      global.fetch = async (url, options) => {
        if (options && options.body) {
          try {
            capturedData = JSON.parse(options.body);
          } catch (e) {
            capturedData = options.body;
          }
        }
        return Promise.resolve({
          ok: true,
          status: 200,
          json: () => Promise.resolve({ success: true }),
        });
      };

      // Initialize DataCortex
      DataCortex.init({
        api_key: 'test_key_1234567890123456789012345678',
        org_name: 'test_org',
      });

      // Create a test event
      DataCortex.event({
        kingdom: 'test',
        phylum: 'ua_parsing',
      });

      // Trigger flush to capture the data
      DataCortex.flush();

      // Wait for async operations
      await new Promise((resolve) => setTimeout(resolve, 50));

      // Verify the parsed values
      const results = {
        os: capturedData?.os || 'unknown',
        os_ver: capturedData?.os_ver || 'unknown',
        browser: capturedData?.browser || 'unknown',
        browser_ver: capturedData?.browser_ver || 'unknown',
        device_type: capturedData?.device_type || 'unknown',
        device_family: capturedData?.device_family || 'unknown',
      };

      console.log(`   Expected: ${JSON.stringify(testData.expected)}`);
      console.log(`   Actual:   ${JSON.stringify(results)}`);

      // Compare results
      let testPassed = true;
      const failures = [];

      for (const [key, expectedValue] of Object.entries(testData.expected)) {
        if (results[key] !== expectedValue) {
          testPassed = false;
          failures.push(
            `${key}: expected "${expectedValue}", got "${results[key]}"`
          );
        }
      }

      totalTests++;
      if (testPassed) {
        passedTests++;
        console.log(`   ✅ PASSED\n`);
      } else {
        console.log(`   ❌ FAILED: ${failures.join(', ')}\n`);
        failedTests.push({
          name: testName,
          ua: testData.ua,
          expected: testData.expected,
          actual: results,
          failures: failures,
        });
      }
    } catch (error) {
      totalTests++;
      console.log(`   ❌ ERROR: ${error.message}\n`);
      failedTests.push({
        name: testName,
        ua: testData.ua,
        expected: testData.expected,
        actual: null,
        failures: [`Error: ${error.message}`],
      });
    }

    // Clean up globals
    delete global.window;
    delete global.document;
    delete global.navigator;
    delete global.localStorage;
    delete global.fetch;
  }

  // Summary
  console.log('📊 USER AGENT PARSING TEST RESULTS');
  console.log('===================================');
  console.log(`Total tests: ${totalTests}`);
  console.log(`Passed: ${passedTests}`);
  console.log(`Failed: ${failedTests.length}`);
  console.log(
    `Success rate: ${((passedTests / totalTests) * 100).toFixed(1)}%\n`
  );

  if (failedTests.length > 0) {
    console.log('❌ FAILED TESTS DETAILS:');
    console.log('========================');
    failedTests.forEach((test, index) => {
      console.log(`${index + 1}. ${test.name}`);
      console.log(`   UA: ${test.ua.substring(0, 100)}...`);
      console.log(`   Failures: ${test.failures.join(', ')}`);
      console.log('');
    });
  }

  return {
    totalTests,
    passedTests,
    failedTests: failedTests.length,
    successRate: (passedTests / totalTests) * 100,
  };
}

// Export for use in other test files
export { testUserAgentParsing, POPULAR_USER_AGENTS };

// Run tests if this file is executed directly
if (process.argv[1] === new URL(import.meta.url).pathname) {
  testUserAgentParsing().then((results) => {
    if (results.failedTests > 0) {
      process.exit(1);
    }
  });
}
