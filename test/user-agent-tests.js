#!/usr/bin/env node

import { JSDOM } from 'jsdom';
import './crypto-shim.js';

console.log('🔍 Running User Agent Parsing Tests...\n');

// Test cases for popular user agents
const testCases = [
  {
    name: 'Chrome Windows Desktop',
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    expected: {
      os: 'windows',
      os_ver: '10.0',
      browser: 'chrome',
      browser_ver: '120.0.0.0',
      device_type: 'desktop',
      device_family: 'desktop'
    }
  },
  {
    name: 'Chrome macOS Desktop',
    userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    expected: {
      os: 'mac',
      os_ver: '10.15.7',
      browser: 'chrome',
      browser_ver: '120.0.0.0',
      device_type: 'desktop',
      device_family: 'desktop'
    }
  },
  {
    name: 'Safari macOS Desktop',
    userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.1 Safari/605.1.15',
    expected: {
      os: 'mac',
      os_ver: '10.15.7',
      browser: 'safari',
      browser_ver: '17.1',
      device_type: 'desktop',
      device_family: 'desktop'
    }
  },
  {
    name: 'Chrome Android Mobile',
    userAgent: 'Mozilla/5.0 (Linux; Android 13; SM-G991B) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Mobile Safari/537.36',
    expected: {
      os: 'android',
      os_ver: '13',
      browser: 'chrome',
      browser_ver: '120.0.0.0',
      device_type: 'android',
      device_family: 'android'
    }
  },
  {
    name: 'Safari iOS iPhone',
    userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_1_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.1 Mobile/15E148 Safari/604.1',
    expected: {
      os: 'ios',
      os_ver: '17.1.1',
      browser: 'safari',
      browser_ver: '17.1',
      device_type: 'iphone',
      device_family: 'iphone'
    }
  },
  {
    name: 'Safari iOS iPad',
    userAgent: 'Mozilla/5.0 (iPad; CPU OS 17_1_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.1 Mobile/15E148 Safari/604.1',
    expected: {
      os: 'ios',
      os_ver: '17.1.1',
      browser: 'safari',
      browser_ver: '17.1',
      device_type: 'ipad',
      device_family: 'ipad'
    }
  },
  {
    name: 'Chrome iOS',
    userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_1_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) CriOS/120.0.0.0 Mobile/15E148 Safari/604.1',
    expected: {
      os: 'ios',
      os_ver: '17.1.1',
      browser: 'chrome',
      browser_ver: '120.0.0.0',
      device_type: 'iphone',
      device_family: 'iphone'
    }
  },
  {
    name: 'Firefox Windows',
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:120.0) Gecko/20100101 Firefox/120.0',
    expected: {
      os: 'windows',
      os_ver: '10.0',
      browser: 'firefox',
      browser_ver: '120.0',
      device_type: 'desktop',
      device_family: 'desktop'
    }
  },
  {
    name: 'Edge Legacy Windows',
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36 Edg/120.0.0.0',
    expected: {
      os: 'windows',
      os_ver: '10.0',
      browser: 'edge',
      browser_ver: '120.0.0.0',
      device_type: 'desktop',
      device_family: 'desktop'
    }
  },
  {
    name: 'Internet Explorer 11',
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; WOW64; Trident/7.0; rv:11.0) like Gecko',
    expected: {
      os: 'windows',
      os_ver: '10.0',
      browser: 'ie',
      browser_ver: '11.0',
      device_type: 'desktop',
      device_family: 'desktop'
    }
  },
  {
    name: 'Chrome Linux',
    userAgent: 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    expected: {
      os: 'unix',
      os_ver: 'unknown',
      browser: 'chrome',
      browser_ver: '120.0.0.0',
      device_type: 'desktop',
      device_family: 'desktop'
    }
  },
  {
    name: 'Chrome Android Tablet',
    userAgent: 'Mozilla/5.0 (Linux; Android 13; SM-T870) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    expected: {
      os: 'android',
      os_ver: '13',
      browser: 'chrome',
      browser_ver: '120.0.0.0',
      device_type: 'android_tablet',
      device_family: 'android_tablet'
    }
  }
];

let passed = 0;
let failed = 0;

for (const testCase of testCases) {
  try {
    // Create fresh environment for each test
    const dom = new JSDOM('<!DOCTYPE html><html><body></body></html>', {
      url: 'https://localhost',
      pretendToBeVisual: true,
      resources: 'usable',
    });

    // Set up globals
    global.window = dom.window;
    global.document = dom.window.document;

    // Force set the user agent properly
    Object.defineProperty(dom.window.navigator, 'userAgent', {
      value: testCase.userAgent,
      writable: true,
      configurable: true
    });

    Object.defineProperty(global, 'navigator', {
      value: dom.window.navigator,
      writable: true,
      configurable: true
    });

    // Simple localStorage mock
    const storage = {};
    global.localStorage = {
      getItem: (key) => storage[key] || null,
      setItem: (key, value) => { storage[key] = String(value); },
      removeItem: (key) => { delete storage[key]; },
      clear: () => { Object.keys(storage).forEach(k => delete storage[k]); }
    };

    // Mock timers to prevent hanging
    global.setTimeout = (fn, delay) => Math.random();
    global.clearTimeout = () => {};
    global.setInterval = () => Math.random();
    global.clearInterval = () => {};

    // Mock fetch to capture data without network calls
    let capturedBundle = null;
    global.fetch = async (url, options) => {
      if (options && options.body) {
        try {
          capturedBundle = JSON.parse(options.body);
        } catch (e) {
          // Ignore parse errors
        }
      }
      return Promise.resolve({
        ok: true,
        status: 200,
        json: () => Promise.resolve({ success: true })
      });
    };

    // Clear module cache
    delete global.DataCortex;

    // Import DataCortex fresh with cache busting
    const moduleUrl = `../dist/browser-data-cortex.min.js?t=${Date.now()}&r=${Math.random()}`;
    await import(moduleUrl);
    const DataCortex = global.DataCortex;

    // Initialize
    DataCortex.init({
      api_key: 'test-key-12345678901234567890123456789012',
      org_name: 'test-org'
    });

    // Add an event to trigger bundle creation
    DataCortex.event({
      kingdom: 'test',
      phylum: 'ua_test'
    });

    // Force flush
    DataCortex.flush();

    // Give minimal time for synchronous operations
    await new Promise(resolve => setImmediate(resolve));

    // Check results
    if (capturedBundle) {
      let testPassed = true;
      for (const [key, expected] of Object.entries(testCase.expected)) {
        const actual = capturedBundle[key];
        if (actual !== expected) {
          testPassed = false;
          break;
        }
      }
      
      if (testPassed) {
        console.log(`✅ ${testCase.name}`);
        passed++;
      } else {
        console.log(`❌ ${testCase.name}`);
        console.log(`   Expected: ${JSON.stringify(testCase.expected)}`);
        console.log(`   Actual: ${JSON.stringify({
          os: capturedBundle.os,
          os_ver: capturedBundle.os_ver,
          browser: capturedBundle.browser,
          browser_ver: capturedBundle.browser_ver,
          device_type: capturedBundle.device_type,
          device_family: capturedBundle.device_family
        })}`);
        failed++;
      }
    } else {
      console.log(`❌ ${testCase.name} - No data captured`);
      failed++;
    }

  } catch (error) {
    console.log(`❌ ${testCase.name} - Error: ${error.message}`);
    failed++;
  }
}

console.log(`\n📊 User Agent Tests Summary: ${passed} passed, ${failed} failed`);

if (failed > 0) {
  process.exit(1);
}
