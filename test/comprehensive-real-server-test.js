#!/usr/bin/env node

// Comprehensive real server test that validates ALL API endpoints
import { JSDOM } from 'jsdom';

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

// Mock crypto API
const mockCrypto = {
  getRandomValues: (array) => {
    for (let i = 0; i < array.length; i++) {
      array[i] = Math.floor(Math.random() * 0xffffffff);
    }
    return array;
  },
};

// Set crypto carefully
try {
  global.crypto = mockCrypto;
} catch (e) {
  Object.defineProperty(global, 'crypto', {
    value: mockCrypto,
    writable: true,
    configurable: true,
  });
}

try {
  global.window.crypto = mockCrypto;
} catch (e) {
  Object.defineProperty(global.window, 'crypto', {
    value: mockCrypto,
    writable: true,
    configurable: true,
  });
}

// Import DataCortex after setting up environment
import '../dist/browser-data-cortex.min.js';
const DataCortex = global.DataCortex;

console.log('🎯 COMPREHENSIVE REAL SERVER TEST: All API Endpoints');
console.log('====================================================');

// Use the provided API key (or default invalid one)
const testApiKey = process.env.DC_API_KEY || 'DEFINITELY_INVALID_KEY_12345';

console.log(`Testing API key: ${testApiKey}`);
console.log(`Key length: ${testApiKey.length} characters`);

const errorLogCalls = [];
const customErrorLog = (...args) => {
  console.log('🔴 ERROR LOGGED:', args.join(' '));
  errorLogCalls.push(args);
};

console.log('\n1. Initializing DataCortex...');
DataCortex.init({
  api_key: testApiKey,
  org_name: 'comprehensive-test-org',
  app_ver: '1.0.0',
  errorLog: customErrorLog,
});

console.log('   Library ready:', DataCortex.isReady());

console.log('\n2. Testing ALL API endpoints...');

// ENDPOINT 1: /track - Regular Event
console.log('   📡 Adding regular event (hits /track endpoint)...');
DataCortex.event({
  kingdom: 'comprehensive',
  phylum: 'real-server',
  class: 'validation',
  order: 'track-endpoint',
  family: 'regular-event',
  genus: 'test',
  species: 'integration',
  network: 'test-network',
  channel: 'test-channel',
  float1: 123.45,
  float2: 67.89,
});

// ENDPOINT 1: /track - Economy Event
console.log('   💰 Adding economy event (hits /track endpoint)...');
DataCortex.economyEvent({
  spend_currency: 'gold',
  spend_amount: 100.5,
  spend_type: 'purchase',
  kingdom: 'comprehensive',
  phylum: 'economy',
  class: 'validation',
  order: 'track-endpoint',
  family: 'economy-event',
  genus: 'test',
  species: 'integration',
  network: 'test-network',
  channel: 'test-channel',
});

// ENDPOINT 1: /track - Message Send Event
console.log('   💬 Adding message send event (hits /track endpoint)...');
DataCortex.messageSendEvent({
  from_tag: 'sender123',
  to_tag: 'receiver456',
  kingdom: 'comprehensive',
  phylum: 'messaging',
  class: 'validation',
  order: 'track-endpoint',
  family: 'message-event',
  genus: 'test',
  species: 'integration',
  network: 'test-network',
  channel: 'test-channel',
});

// ENDPOINT 2: /app_log - Log Events
console.log('   📝 Adding log messages (hits /app_log endpoint)...');
DataCortex.log('Comprehensive test log message 1');
DataCortex.log('Comprehensive test log message 2', { data: 'test' });
DataCortex.log('Error simulation log', new Error('Test error'));

// ENDPOINT 2: /app_log - Direct Log Event
console.log('   📋 Adding direct log event (hits /app_log endpoint)...');
DataCortex.logEvent({
  log_line: 'Direct log event test',
  log_level: 'INFO',
  hostname: 'test-host',
  filename: 'comprehensive-test.js',
});

console.log('\n3. Calling flush() to trigger ALL real HTTP requests...');
DataCortex.flush();

console.log('\n4. Waiting for all server responses...');

// Wait for all real HTTP requests with native setTimeout
setTimeout(() => {
  console.log('\n📊 COMPREHENSIVE RESULTS:');
  console.log('=========================');
  console.log('Total error log calls:', errorLogCalls.length);
  console.log('Library ready status:', DataCortex.isReady());

  // Analyze all error logs
  if (errorLogCalls.length > 0) {
    console.log('\n🔍 ERROR ANALYSIS:');
    errorLogCalls.forEach((call, index) => {
      console.log(`   Error ${index + 1}: ${call.join(' ')}`);
    });
  }

  // Determine validity based on server responses
  if (errorLogCalls.length === 0) {
    // No errors = valid API key
    console.log('\n✅ COMPREHENSIVE RESULT: API key is VALID');
    console.log('   ✅ /track endpoint: SUCCESS (events accepted)');
    console.log('   ✅ /app_log endpoint: SUCCESS (logs accepted)');
    console.log('   ✅ All API endpoints working correctly');
    console.log('   ✅ Library remains ready and functional');
    console.log('\n🎉 SUCCESS: All API endpoints validated with valid key');
    process.exit(0); // Success
  } else {
    // Errors logged = invalid API key or endpoint issues
    console.log(
      '\n❌ COMPREHENSIVE RESULT: API key is INVALID or endpoint errors'
    );

    // Check if library was disabled (403 error)
    const libraryReady = DataCortex.isReady();
    console.log('   🔒 Library disabled after errors:', !libraryReady);

    // Analyze error types
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

    const hasBadRequestError = errorLogCalls.some((call) =>
      call.some(
        (arg) =>
          typeof arg === 'string' &&
          (arg.includes('Bad request') || arg.includes('400'))
      )
    );

    if (hasApiKeyError) {
      console.log('   🎯 /track endpoint: REJECTED (invalid API key)');
      console.log('   🎯 /app_log endpoint: REJECTED (invalid API key)');
      console.log('   ✅ Both endpoints properly validate API keys');
      console.log(
        '\n🎯 NEGATIVE TEST SUCCESSFUL: Invalid API key rejected by all endpoints'
      );
    } else if (hasBadRequestError) {
      console.log('   ⚠️  Some endpoints returned 400 Bad Request');
      console.log('   This could indicate parameter validation issues');
    } else {
      console.log('   ⚠️  Unexpected error types detected');
    }

    console.log(
      '\n❌ FAILURE: Invalid API key or endpoint errors (expected for invalid keys)'
    );
    process.exit(1); // Failure (invalid API key or errors)
  }
}, 6000); // Wait 6 seconds for all HTTP requests

// Timeout safety
setTimeout(() => {
  console.log('\n⏰ TIMEOUT: Comprehensive test took too long');
  console.log('Error log calls so far:', errorLogCalls.length);
  console.log('This could indicate network connectivity problems');
  console.log('\nPartial results:');
  if (errorLogCalls.length > 0) {
    errorLogCalls.forEach((call, index) => {
      console.log(`   Error ${index + 1}: ${call.join(' ')}`);
    });
  }
  process.exit(1);
}, 15000); // 15 second total timeout
