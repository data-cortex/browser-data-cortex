#!/usr/bin/env tsx

// Real server integration test that determines API key validity based on server response
import { JSDOM } from 'jsdom';
import './crypto-shim.js';

// Create JSDOM environment but use Node.js native timers
const dom = new JSDOM('<!DOCTYPE html><html><body></body></html>', {
  url: 'https://example.com',
  pretendToBeVisual: true,
  resources: 'usable',
});

// Set up globals but use Node.js native timers
(global as any).window = dom.window;
(global as any).document = dom.window.document;
(global as any).localStorage = dom.window.localStorage;
(global as any).XMLHttpRequest = dom.window.XMLHttpRequest;

// Handle navigator carefully
if (!(global as any).navigator) {
  (global as any).navigator = dom.window.navigator;
} else {
  Object.assign((global as any).navigator, dom.window.navigator);
}

// Use Node.js native timers instead of JSDOM timers
(global as any).window.setTimeout = setTimeout;
(global as any).window.clearTimeout = clearTimeout;
(global as any).window.setInterval = setInterval;
(global as any).window.clearInterval = clearInterval;

// Crypto is now handled by crypto-shim.js

// Import DataCortex after setting up environment
import '../dist/browser-data-cortex.min.js';
const DataCortex = (global as any).DataCortex;

console.log('🧪 REAL SERVER TEST: DataCortex API Key Validation');
console.log('==================================================');

// Use the provided API key (or default invalid one)
const testApiKey = process.env.DC_API_KEY || 'DEFINITELY_INVALID_KEY_12345';

console.log(`Testing with API key: ${testApiKey}`);
console.log(`Key length: ${testApiKey.length} characters`);

// We'll determine if it's valid based on the server response, not assumptions

const errorLogCalls: any[][] = [];
const customErrorLog = (...args: any[]): void => {
  errorLogCalls.push(args);
  console.log('🔴 Server Error Captured:', args[0]);
};

console.log('\n🔧 Initializing DataCortex with custom error logging...');

// Initialize DataCortex with the test API key
DataCortex.init({
  api_key: testApiKey,
  org_name: 'real-server-test-org',
  app_ver: '1.0.0',
  errorLog: customErrorLog,
});

console.log(`✅ DataCortex initialized. Ready: ${DataCortex.isReady()}`);

// Add test events and logs
console.log('\n📊 Adding test events and logs...');

DataCortex.event({
  kingdom: 'real-server',
  phylum: 'integration',
  class: 'test',
  order: 'validation',
  family: 'api-key',
  genus: 'server',
  species: 'response',
  float1: 123.456,
  float2: 789.012,
});

DataCortex.economyEvent({
  spend_currency: 'test-gold',
  spend_amount: 99.99,
  spend_type: 'test-purchase',
  kingdom: 'real-server',
  phylum: 'economy',
  class: 'test',
  order: 'validation',
  family: 'api-key',
  genus: 'server',
  species: 'response',
});

DataCortex.log('Real server test log message', { timestamp: Date.now() });

DataCortex.logEvent({
  log_line: 'Real server test log event',
  log_level: 'info',
  hostname: 'test-server.example.com',
});

console.log('✅ Test data added to local storage');

// Flush to trigger immediate server requests
console.log('\n🚀 Flushing to trigger real server requests...');
DataCortex.flush();

// Wait for server responses
console.log('⏳ Waiting for server responses...');

const waitForServerResponse = (): Promise<void> => {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve();
    }, 3000); // Wait 3 seconds for server response
  });
};

waitForServerResponse().then(() => {
  console.log('\n📊 REAL SERVER TEST RESULTS:');
  console.log('============================');

  console.log(`Error log calls captured: ${errorLogCalls.length}`);
  console.log(`Library ready status: ${DataCortex.isReady()}`);

  if (errorLogCalls.length === 0) {
    console.log('✅ SUCCESS: No server errors detected');
    console.log('   - API key appears to be VALID');
    console.log('   - Server accepted all requests');
    console.log('   - No authentication errors');
    console.log('   - Library remains ready for use');

    console.log('\n🎉 REAL SERVER TEST PASSED');
    console.log('   The provided API key is valid and working correctly.');

    process.exit(0);
  } else {
    console.log('❌ ERRORS: Server errors detected');
    console.log('   - API key appears to be INVALID');
    console.log('   - Server rejected requests');

    // Analyze error messages
    let hasBadApiKeyError = false;
    let has403Error = false;

    errorLogCalls.forEach((call, index) => {
      console.log(`   Error ${index + 1}:`, call[0]);

      const errorMessage = call.join(' ').toLowerCase();
      if (
        errorMessage.includes('bad api key') ||
        errorMessage.includes('invalid api key')
      ) {
        hasBadApiKeyError = true;
      }
      if (errorMessage.includes('403') || errorMessage.includes('forbidden')) {
        has403Error = true;
      }
    });

    if (hasBadApiKeyError) {
      console.log('   🎯 Confirmed: Bad API Key error from server');
    }

    if (has403Error) {
      console.log('   🔒 Confirmed: 403 Forbidden response from server');
      console.log(`   📴 Library disabled status: ${!DataCortex.isReady()}`);
    }

    console.log('\n💥 REAL SERVER TEST FAILED');
    console.log(
      '   The provided API key is invalid or there are server issues.'
    );
    console.log('   This is expected behavior when testing with invalid keys.');

    // Exit with error code to fail the test
    process.exit(1);
  }
});

// Handle any uncaught errors
process.on('uncaughtException', (error) => {
  console.error('\n💥 Uncaught Exception:', error.message);
  console.log('   This might indicate a network error or server issue.');
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('\n💥 Unhandled Rejection:', reason);
  console.log('   This might indicate a network error or server issue.');
  process.exit(1);
});

export {};
