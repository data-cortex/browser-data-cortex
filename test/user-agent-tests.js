/**
 * User Agent Parsing Tests for DataCortex
 * Tests parsing of popular user agent strings (>10% market share)
 */

import { JSDOM } from 'jsdom';
import './crypto-shim.js';

// Set up a minimal browser environment with proper URL
const dom = new JSDOM('<!DOCTYPE html><html><body></body></html>', {
  url: 'https://localhost',
  pretendToBeVisual: true,
  resources: 'usable',
});

// Set up globals
global.window = dom.window;
global.document = dom.window.document;

// Create a simple localStorage mock that properly handles JSON
const localStorageMock = {
  store: {},
  getItem(key) {
    return this.store[key] || null;
  },
  setItem(key, value) {
    this.store[key] = value;
  },
  removeItem(key) {
    delete this.store[key];
  },
  clear() {
    this.store = {};
  },
};

global.localStorage = localStorageMock;

// Mock fetch for testing
global.fetch = async (url, options) => {
  return Promise.resolve({
    ok: true,
    status: 200,
    json: () => Promise.resolve({ success: true }),
    text: () => Promise.resolve('{"success": true}'),
  });
};

// Now import the DataCortex module
import '../dist/browser-data-cortex.min.js';
const DataCortex = global.DataCortex;

// Simple test runner
class TestRunner {
  constructor() {
    this.tests = [];
    this.passed = 0;
    this.failed = 0;
  }

  test(name, fn) {
    this.tests.push({ name, fn });
  }

  async run() {
    console.log('🔍 Running User Agent Parsing Tests...\n');

    for (const test of this.tests) {
      try {
        // Clear localStorage before each test
        localStorageMock.clear();
        
        await test.fn();
        console.log(`✅ ${test.name}`);
        this.passed++;
      } catch (error) {
        console.log(`❌ ${test.name}: ${error.message}`);
        this.failed++;
      }
    }

    console.log(`\n📊 User Agent Tests Summary: ${this.passed} passed, ${this.failed} failed`);
    return this.failed === 0;
  }
}

const runner = new TestRunner();

// Helper functions
function assertEqual(actual, expected, message = '') {
  if (actual !== expected) {
    throw new Error(
      `${message} Expected: ${expected}, Actual: ${actual}`
    );
  }
}

async function testUserAgentParsing(userAgent, expectedResults, testName) {
  // Clear localStorage to ensure clean state
  localStorageMock.clear();
  
  // Create a new JSDOM instance with the specific user agent
  const testDom = new JSDOM('<!DOCTYPE html><html><body></body></html>', {
    url: 'https://localhost',
    userAgent: userAgent,
    pretendToBeVisual: true,
    resources: 'usable',
  });

  // Update globals with the new DOM
  global.window = testDom.window;
  global.document = testDom.window.document;
  Object.defineProperty(global, 'navigator', {
    value: testDom.window.navigator,
    writable: true,
    configurable: true
  });
  global.localStorage = localStorageMock;

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
      json: () => Promise.resolve({ success: true })
    });
  };

  // Import fresh DataCortex module
  const moduleUrl = '../dist/browser-data-cortex.min.js?' + Date.now(); // Cache busting
  await import(moduleUrl);
  const FreshDataCortex = global.DataCortex;

  // Initialize DataCortex to trigger user agent parsing
  FreshDataCortex.init({
    api_key: 'test-key-1234567890123456789012345678',
    org_name: 'test-org'
  });

  // Create a test event
  FreshDataCortex.event({
    kingdom: 'test',
    phylum: 'ua_parsing'
  });

  // Trigger flush to capture the data
  FreshDataCortex.flush();

  // Wait a bit for async operations
  await new Promise(resolve => setTimeout(resolve, 10));

  // Verify the parsed values
  const results = {
    os: capturedData?.os || 'unknown',
    os_ver: capturedData?.os_ver || 'unknown',
    browser: capturedData?.browser || 'unknown',
    browser_ver: capturedData?.browser_ver || 'unknown',
    device_type: capturedData?.device_type || 'unknown',
    device_family: capturedData?.device_family || 'unknown'
  };

  console.log(`   UA: ${userAgent.substring(0, 80)}...`);
  console.log(`   Expected: ${JSON.stringify(expectedResults)}`);
  console.log(`   Actual:   ${JSON.stringify(results)}`);

  // Compare results
  for (const [key, expectedValue] of Object.entries(expectedResults)) {
    assertEqual(results[key], expectedValue, `${testName} - ${key}`);
  }
}

// Test cases for popular user agents
runner.test('Chrome Windows Desktop', () => {
  testUserAgentParsing(
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    {
      os: 'windows',
      os_ver: '10.0',
      browser: 'chrome',
      browser_ver: '120.0.0.0',
      device_type: 'desktop',
      device_family: 'desktop'
    },
    'Chrome Windows'
  );
});

runner.test('Chrome macOS Desktop', () => {
  testUserAgentParsing(
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    {
      os: 'mac',
      os_ver: '10.15.7',
      browser: 'chrome',
      browser_ver: '120.0.0.0',
      device_type: 'desktop',
      device_family: 'desktop'
    },
    'Chrome macOS'
  );
});

runner.test('Safari macOS Desktop', () => {
  testUserAgentParsing(
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.1 Safari/605.1.15',
    {
      os: 'mac',
      os_ver: '10.15.7',
      browser: 'safari',
      browser_ver: '17.1',
      device_type: 'desktop',
      device_family: 'desktop'
    },
    'Safari macOS'
  );
});

runner.test('Chrome Android Mobile', () => {
  testUserAgentParsing(
    'Mozilla/5.0 (Linux; Android 14; SM-G998B) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Mobile Safari/537.36',
    {
      os: 'android',
      os_ver: '14',
      browser: 'chrome',
      browser_ver: '120.0.0.0',
      device_type: 'android',
      device_family: 'mobile'
    },
    'Chrome Android'
  );
});

runner.test('Safari iOS iPhone', () => {
  testUserAgentParsing(
    'Mozilla/5.0 (iPhone; CPU iPhone OS 17_1_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.1 Mobile/15E148 Safari/604.1',
    {
      os: 'ios',
      os_ver: '17.1.1',
      browser: 'safari',
      browser_ver: '17.1',
      device_type: 'iphone',
      device_family: 'mobile'
    },
    'Safari iOS iPhone'
  );
});

runner.test('Safari iOS iPad', () => {
  testUserAgentParsing(
    'Mozilla/5.0 (iPad; CPU OS 17_1_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.1 Mobile/15E148 Safari/604.1',
    {
      os: 'ios',
      os_ver: '17.1.1',
      browser: 'safari',
      browser_ver: '17.1',
      device_type: 'ipad',
      device_family: 'tablet'
    },
    'Safari iOS iPad'
  );
});

runner.test('Chrome iOS', () => {
  testUserAgentParsing(
    'Mozilla/5.0 (iPhone; CPU iPhone OS 17_1_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) CriOS/120.0.6099.119 Mobile/15E148 Safari/604.1',
    {
      os: 'ios',
      os_ver: '17.1.1',
      browser: 'chrome',
      browser_ver: '120.0.6099.119',
      device_type: 'iphone',
      device_family: 'mobile'
    },
    'Chrome iOS'
  );
});

runner.test('Firefox Windows', () => {
  testUserAgentParsing(
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:120.0) Gecko/20100101 Firefox/120.0',
    {
      os: 'windows',
      os_ver: '10.0',
      browser: 'firefox',
      browser_ver: '120.0',
      device_type: 'desktop',
      device_family: 'desktop'
    },
    'Firefox Windows'
  );
});

runner.test('Edge Legacy Windows', () => {
  testUserAgentParsing(
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/70.0.3538.102 Safari/537.36 Edge/18.19041',
    {
      os: 'windows',
      os_ver: '10.0',
      browser: 'edge',
      browser_ver: '18.19041',
      device_type: 'desktop',
      device_family: 'desktop'
    },
    'Edge Legacy'
  );
});

runner.test('Internet Explorer 11', () => {
  testUserAgentParsing(
    'Mozilla/5.0 (Windows NT 10.0; WOW64; Trident/7.0; rv:11.0) like Gecko',
    {
      os: 'windows',
      os_ver: '10.0',
      browser: 'ie',
      browser_ver: '11.0',
      device_type: 'desktop',
      device_family: 'desktop'
    },
    'IE 11'
  );
});

runner.test('Chrome Linux', () => {
  testUserAgentParsing(
    'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    {
      os: 'linux',
      os_ver: 'unknown',
      browser: 'chrome',
      browser_ver: '120.0.0.0',
      device_type: 'desktop',
      device_family: 'desktop'
    },
    'Chrome Linux'
  );
});

runner.test('Chrome Android Tablet', () => {
  testUserAgentParsing(
    'Mozilla/5.0 (Linux; Android 14; SM-T870) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    {
      os: 'android',
      os_ver: '14',
      browser: 'chrome',
      browser_ver: '120.0.0.0',
      device_type: 'android_tablet',
      device_family: 'tablet'
    },
    'Chrome Android Tablet'
  );
});

// Export the test runner for use in other files
export { runner as userAgentTestRunner };

// Run tests if this file is executed directly
if (process.argv[1] === new URL(import.meta.url).pathname) {
  runner.run().then(success => {
    if (!success) {
      process.exit(1);
    }
  });
}
