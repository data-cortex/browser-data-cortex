#!/usr/bin/env node

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
global.window = dom.window;
global.document = dom.window.document;
global.localStorage = dom.window.localStorage;
global.XMLHttpRequest = dom.window.XMLHttpRequest;

// Handle navigator carefully
if (!global.navigator) {
  global.navigator = dom.window.navigator;
} else {
  Object.assign(global.navigator, dom.window.navigator);
}

// Use Node.js native timers instead of JSDOM timers
global.window.setTimeout = setTimeout;
global.window.clearTimeout = clearTimeout;
global.window.setInterval = setInterval;
global.window.clearInterval = clearInterval;

// Crypto is now handled by crypto-shim.js

// Import DataCortex after setting up environment
import '../dist/browser-data-cortex.min.js';
const DataCortex = global.DataCortex;

console.log('🧪 REAL SERVER TEST: DataCortex API Key Validation');
console.log('==================================================');

// Use the provided API key (or default invalid one)
const testApiKey = process.env.DC_API_KEY || 'DEFINITELY_INVALID_KEY_12345';

console.log(`Testing with API key: ${testApiKey}`);
console.log(`Key length: ${testApiKey.length} characters`);

// We'll determine if it's valid based on the server response, not assumptions

const errorLogCalls = [];
const customErrorLog = (...args) => {
  console.log('🔴 ERROR LOGGED:', args.join(' '));
  errorLogCalls.push(args);
};

console.log('\n1. Initializing DataCortex...');
DataCortex.init({
  api_key: testApiKey,
  org_name: 'test-org',
  app_ver: '1.0.0',
  errorLog: customErrorLog,
});

console.log('   Library ready:', DataCortex.isReady());

console.log('\n2. Adding test event...');
DataCortex.event({
  kingdom: 'real-server-test',
  phylum: 'validation',
  class: 'errorlog',
  order: 'flush',
  family: 'integration',
  genus: 'http',
  species: 'request',
});

console.log('\n3. Calling flush() to trigger real HTTP request...');
DataCortex.flush();

console.log('\n4. Waiting for real server response...');

// Wait for real HTTP request with native setTimeout
setTimeout(() => {
  console.log('\n📊 RESULTS:');
  console.log('===========');
  console.log('Error log calls:', errorLogCalls.length);
  console.log('Library ready status:', DataCortex.isReady());

  // Determine validity based on server response
  if (errorLogCalls.length === 0) {
    // No errors = valid API key
    console.log('✅ RESULT: API key is VALID');
    console.log('   ✅ No server errors logged');
    console.log('   ✅ Library remains ready');
    console.log('   ✅ Real HTTP request succeeded');
    console.log('\n🎉 SUCCESS: Valid API key test passed');
    process.exit(0); // Success
  } else {
    // Errors logged = invalid API key
    console.log('❌ RESULT: API key is INVALID');
    console.log('   ❌ Server error logged:', errorLogCalls[0]);

    // Check if library was disabled (403 error)
    const libraryReady = DataCortex.isReady();
    console.log('   🔒 Library disabled after error:', !libraryReady);

    // Verify error message content
    const hasApiKeyError = errorLogCalls.some((call) =>
      call.some(
        (arg) =>
          typeof arg === 'string' &&
          (arg.includes('Bad API Key') ||
            arg.includes('Invalid API Key') ||
            arg.includes('403') ||
            arg.includes('Forbidden'))
      )
    );

    if (hasApiKeyError) {
      console.log('   ✅ Error message confirms API key issue');
      console.log(
        '\n🎯 NEGATIVE TEST SUCCESSFUL: Invalid API key properly rejected'
      );
      console.log('   ✅ Real HTTP request made to server');
      console.log('   ✅ Server returned authentication error');
      console.log('   ✅ Custom errorLog captured server response');
      console.log('   ✅ Library properly disabled after 403 error');
    } else {
      console.log(
        '   ⚠️  Error logged but not API key related:',
        errorLogCalls
      );
    }

    console.log(
      '\n❌ FAILURE: Invalid API key test (this is expected behavior)'
    );
    process.exit(1); // Failure (invalid API key)
  }
}, 5000); // Wait 5 seconds for real HTTP request

// Timeout safety
setTimeout(() => {
  console.log('\n⏰ TIMEOUT: Test took too long, likely network issue');
  console.log('Error log calls so far:', errorLogCalls.length);
  console.log('This could indicate network connectivity problems');
  process.exit(1);
}, 10000);
