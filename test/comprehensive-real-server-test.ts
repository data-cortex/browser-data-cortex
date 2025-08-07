#!/usr/bin/env tsx

// Comprehensive real server test that validates ALL API endpoints
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

console.log('🎯 COMPREHENSIVE REAL SERVER TEST: All API Endpoints');
console.log('====================================================');

// Use the provided API key (or default invalid one)
const testApiKey = process.env.DC_API_KEY || 'DEFINITELY_INVALID_KEY_12345';

console.log(`Testing API key: ${testApiKey}`);
console.log(`Key length: ${testApiKey.length} characters`);

const errorLogCalls: any[][] = [];
const customErrorLog = (...args: any[]): void => {
  console.log('🔴 ERROR LOGGED:', args.join(' '));
  errorLogCalls.push(args);
};

console.log('\n🔧 Initializing DataCortex...');

// Initialize DataCortex
DataCortex.init({
  api_key: testApiKey,
  org_name: 'comprehensive-test-org',
  app_ver: '2.0.0',
  errorLog: customErrorLog,
});

console.log(`✅ DataCortex initialized. Ready: ${DataCortex.isReady()}`);

// Test all event types and API endpoints
console.log('\n📊 Testing ALL event types and API endpoints...\n');

// 1. Regular Events
console.log('1️⃣ Testing regular events...');
for (let i = 1; i <= 5; i++) {
  DataCortex.event({
    kingdom: `regular-event-${i}`,
    phylum: 'comprehensive',
    class: 'test',
    order: 'validation',
    family: 'all-endpoints',
    genus: 'regular',
    species: 'event',
    float1: i * 10.5,
    float2: i * 20.25,
    float3: i * 30.75,
    float4: i * 40.125,
  });
}
console.log('   ✅ Added 5 regular events');

// 2. Economy Events
console.log('2️⃣ Testing economy events...');
const currencies = ['gold', 'silver', 'gems', 'coins', 'credits'];
currencies.forEach((currency, index) => {
  DataCortex.economyEvent({
    spend_currency: currency,
    spend_amount: (index + 1) * 99.99,
    spend_type: `purchase-${index + 1}`,
    kingdom: `economy-event-${index + 1}`,
    phylum: 'comprehensive',
    class: 'economy',
    order: 'validation',
    family: 'all-endpoints',
    genus: 'economy',
    species: 'event',
    float1: (index + 1) * 15.5,
  });
});
console.log('   ✅ Added 5 economy events');

// 3. Message Send Events
console.log('3️⃣ Testing message send events...');
for (let i = 1; i <= 3; i++) {
  DataCortex.messageSendEvent({
    from_tag: `sender-${i}`,
    to_tag: `receiver-${i}`,
    to_list: [`recipient-${i}-1`, `recipient-${i}-2`, `recipient-${i}-3`],
    kingdom: `message-event-${i}`,
    phylum: 'comprehensive',
    class: 'message',
    order: 'validation',
    family: 'all-endpoints',
    genus: 'message',
    species: 'event',
  });
}
console.log('   ✅ Added 3 message send events');

// 4. Log Events
console.log('4️⃣ Testing log events...');
const logLevels = ['debug', 'info', 'warn', 'error', 'fatal'];
logLevels.forEach((level, index) => {
  DataCortex.logEvent({
    log_line: `Comprehensive test log message ${index + 1} - ${level} level`,
    log_level: level,
    hostname: `test-server-${index + 1}.example.com`,
    filename: `/path/to/test/file-${index + 1}.js`,
    device_tag: `test-device-${index + 1}`,
    user_tag: `test-user-${index + 1}`,
    remote_address: `192.168.1.${index + 1}`,
    repsonse_bytes: (index + 1) * 1024,
    response_ms: (index + 1) * 50.5,
  });
});
console.log('   ✅ Added 5 log events');

// 5. Simple Logs
console.log('5️⃣ Testing simple logs...');
DataCortex.log('Comprehensive test log 1', { test: 'data1' });
DataCortex.log('Comprehensive test log 2', 12345, true);
DataCortex.log('Comprehensive test log 3', ['array', 'data']);
DataCortex.log('Comprehensive test log 4 with error', new Error('Test error'));
DataCortex.log('Comprehensive test log 5', {
  complex: { nested: { data: 'value' } },
});
console.log('   ✅ Added 5 simple logs');

// 6. User Tag Management
console.log('6️⃣ Testing user tag management...');
DataCortex.addUserTag('comprehensive-test-user-123');
console.log('   ✅ Set user tag');

// 7. Edge Case Events
console.log('7️⃣ Testing edge case events...');
DataCortex.event({
  kingdom: 'a'.repeat(100), // Will be truncated
  phylum: 'edge-case',
  class: 'test',
  order: 'validation',
  family: 'truncation',
  genus: 'boundary',
  species: 'test',
  from_tag: 'b'.repeat(100), // Will be truncated to 64 chars
  float1: 999999.999999,
  float2: -999999.999999,
  float3: 0.000001,
  float4: 0,
});
console.log('   ✅ Added edge case event');

console.log('\n📦 All test data prepared. Local storage summary:');
const eventList = JSON.parse(
  (global as any).localStorage.getItem('dc.event_list') || '[]'
);
const logList = JSON.parse(
  (global as any).localStorage.getItem('dc.log_list') || '[]'
);
console.log(`   📊 Events in storage: ${eventList.length}`);
console.log(`   📝 Logs in storage: ${logList.length}`);

// Flush to trigger all server requests
console.log('\n🚀 Flushing to trigger ALL server requests...');
DataCortex.flush();

// Wait for all server responses
console.log('⏳ Waiting for all server responses (5 seconds)...');

const waitForAllServerResponses = (): Promise<void> => {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve();
    }, 5000); // Wait 5 seconds for all server responses
  });
};

waitForAllServerResponses().then(() => {
  console.log('\n📊 COMPREHENSIVE REAL SERVER TEST RESULTS:');
  console.log('==========================================');

  console.log(`Total error log calls: ${errorLogCalls.length}`);
  console.log(`Library ready status: ${DataCortex.isReady()}`);

  // Analyze results
  if (errorLogCalls.length === 0) {
    console.log('\n✅ SUCCESS: All API endpoints working correctly');
    console.log('   🎯 API key is VALID');
    console.log('   📊 All event types accepted by server');
    console.log('   📝 All log types accepted by server');
    console.log('   🔄 All API endpoints responding successfully');
    console.log('   ✨ Library remains ready for continued use');

    console.log('\n🎉 COMPREHENSIVE TEST PASSED');
    console.log('   All DataCortex API endpoints are working correctly.');
    console.log('   The provided API key has full access to all features.');

    process.exit(0);
  } else {
    console.log('\n❌ ERRORS: Server rejected some or all requests');
    console.log('   🔑 API key appears to be INVALID');
    console.log('   🚫 Server authentication failed');

    // Categorize errors
    let badApiKeyErrors = 0;
    let forbiddenErrors = 0;
    let otherErrors = 0;

    console.log('\n📋 Error Analysis:');
    errorLogCalls.forEach((call, index) => {
      const errorMessage = call.join(' ').toLowerCase();
      console.log(`   ${index + 1}. ${call[0]}`);

      if (
        errorMessage.includes('bad api key') ||
        errorMessage.includes('invalid api key')
      ) {
        badApiKeyErrors++;
      } else if (
        errorMessage.includes('403') ||
        errorMessage.includes('forbidden')
      ) {
        forbiddenErrors++;
      } else {
        otherErrors++;
      }
    });

    console.log('\n📈 Error Summary:');
    console.log(`   🔑 Bad API Key errors: ${badApiKeyErrors}`);
    console.log(`   🔒 403 Forbidden errors: ${forbiddenErrors}`);
    console.log(`   ❓ Other errors: ${otherErrors}`);

    if (forbiddenErrors > 0) {
      console.log(`   📴 Library disabled: ${!DataCortex.isReady()}`);
    }

    console.log('\n💥 COMPREHENSIVE TEST FAILED');
    console.log(
      '   The API key is invalid or there are server authentication issues.'
    );
    console.log('   This is expected when testing with invalid API keys.');
    console.log(
      '   To test with a valid key, set DC_API_KEY environment variable.'
    );

    // Exit with error code to fail the test
    process.exit(1);
  }
});

// Handle any uncaught errors
process.on('uncaughtException', (error) => {
  console.error('\n💥 Uncaught Exception:', error.message);
  console.log(
    '   This might indicate a network error or server connectivity issue.'
  );
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('\n💥 Unhandled Rejection:', reason);
  console.log(
    '   This might indicate a network error or server connectivity issue.'
  );
  process.exit(1);
});

export {};
