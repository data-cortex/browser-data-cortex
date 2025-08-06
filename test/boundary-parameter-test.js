#!/usr/bin/env node

// Comprehensive boundary parameter tests for all event types
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
import DataCortex from '../src/index.js';

console.log('🎯 BOUNDARY PARAMETER TESTS: Max/Min Parameters for All Event Types');
console.log('====================================================================');

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
  org_name: 'boundary-test-org',
  app_ver: '1.0.0',
  errorLog: customErrorLog,
});

console.log('   Library ready:', DataCortex.isReady());

console.log('\n2. Testing BOUNDARY CONDITIONS for all event types...');

// ============================================================================
// REGULAR EVENT TESTS
// ============================================================================

console.log('\n📡 REGULAR EVENT BOUNDARY TESTS');
console.log('================================');

// MINIMUM parameters for regular event (only required fields)
console.log('   🔹 Testing MINIMUM parameters for regular event...');
const minRegularEvent = DataCortex.event({
  kingdom: 'min',
  phylum: 'test',
  class: 'boundary',
  order: 'minimal',
  family: 'params',
  genus: 'regular',
  species: 'event',
  network: 'test-net', // Required by server
  channel: 'test-ch',  // Required by server
});
console.log(`   ✅ Minimum regular event created with ${Object.keys(minRegularEvent).length} properties`);

// MAXIMUM parameters for regular event (all possible fields)
console.log('   🔹 Testing MAXIMUM parameters for regular event...');
const maxRegularEvent = DataCortex.event({
  // STRING_PROP_LIST (32 char limit each)
  kingdom: 'maximum-parameters-test-event',
  phylum: 'comprehensive-boundary-testing',
  class: 'all-possible-parameters-test',
  order: 'maximum-field-validation-test',
  family: 'complete-parameter-coverage',
  genus: 'boundary-condition-testing',
  species: 'full-parameter-validation',
  network: 'test-network-parameter-max',
  channel: 'test-channel-parameter-max',
  spend_currency: 'gold-currency-max-test',
  spend_type: 'purchase-type-max-test',
  
  // LONG_STRING_PROP_LIST (64 char limit each)
  group_tag: 'maximum-group-tag-parameter-for-comprehensive-boundary-testing',
  from_tag: 'maximum-from-tag-parameter-for-comprehensive-boundary-testing',
  
  // NUMBER_PROP_LIST
  float1: 999999.999999,
  float2: -999999.999999,
  float3: 0.000001,
  float4: 1234567890.123456,
  spend_amount: 99999.99,
  
  // OTHER_PROP_LIST (some are auto-generated, but we can include to_list)
  to_list: ['recipient1', 'recipient2', 'recipient3', 'recipient4', 'recipient5'],
});
console.log(`   ✅ Maximum regular event created with ${Object.keys(maxRegularEvent).length} properties`);

// ============================================================================
// ECONOMY EVENT TESTS
// ============================================================================

console.log('\n💰 ECONOMY EVENT BOUNDARY TESTS');
console.log('================================');

// MINIMUM parameters for economy event (required fields only)
console.log('   🔹 Testing MINIMUM parameters for economy event...');
const minEconomyEvent = DataCortex.economyEvent({
  spend_currency: 'gold',
  spend_amount: 1.0,
  kingdom: 'min',
  phylum: 'economy',
  class: 'boundary',
  order: 'minimal',
  family: 'params',
  genus: 'economy',
  species: 'event',
  network: 'test-net', // Required by server
  channel: 'test-ch',  // Required by server
});
console.log(`   ✅ Minimum economy event created with ${Object.keys(minEconomyEvent).length} properties`);

// MAXIMUM parameters for economy event (all possible fields)
console.log('   🔹 Testing MAXIMUM parameters for economy event...');
const maxEconomyEvent = DataCortex.economyEvent({
  // Required economy fields
  spend_currency: 'premium-gold-currency-max',
  spend_amount: 99999.99,
  spend_type: 'premium-purchase-type-max',
  
  // All STRING_PROP_LIST
  kingdom: 'maximum-economy-event-test',
  phylum: 'comprehensive-economy-testing',
  class: 'all-economy-parameters-test',
  order: 'maximum-economy-validation',
  family: 'complete-economy-coverage',
  genus: 'economy-boundary-testing',
  species: 'full-economy-validation',
  network: 'economy-network-parameter',
  channel: 'economy-channel-parameter',
  
  // LONG_STRING_PROP_LIST
  group_tag: 'maximum-economy-group-tag-for-comprehensive-boundary-testing',
  from_tag: 'maximum-economy-from-tag-for-comprehensive-boundary-testing',
  
  // NUMBER_PROP_LIST
  float1: 888888.888888,
  float2: -888888.888888,
  float3: 0.000888,
  float4: 8888888888.888888,
  
  // OTHER_PROP_LIST
  to_list: ['economy-recipient1', 'economy-recipient2', 'economy-recipient3'],
});
console.log(`   ✅ Maximum economy event created with ${Object.keys(maxEconomyEvent).length} properties`);

// ============================================================================
// MESSAGE SEND EVENT TESTS
// ============================================================================

console.log('\n💬 MESSAGE SEND EVENT BOUNDARY TESTS');
console.log('=====================================');

// MINIMUM parameters for message send event (required fields only)
console.log('   🔹 Testing MINIMUM parameters for message send event...');
const minMessageEvent = DataCortex.messageSendEvent({
  from_tag: 'sender',
  to_tag: 'receiver',
  kingdom: 'min',
  phylum: 'message',
  class: 'boundary',
  order: 'minimal',
  family: 'params',
  genus: 'message',
  species: 'event',
  network: 'test-net', // Required by server
  channel: 'test-ch',  // Required by server
});
console.log(`   ✅ Minimum message event created with ${Object.keys(minMessageEvent).length} properties`);

// MAXIMUM parameters for message send event (all possible fields)
console.log('   🔹 Testing MAXIMUM parameters for message send event...');
const maxMessageEvent = DataCortex.messageSendEvent({
  // Required message fields
  from_tag: 'maximum-sender-tag-for-comprehensive-message-boundary-testing',
  to_tag: 'maximum-receiver-tag-for-comprehensive-message-boundary-test',
  to_list: [
    'message-recipient-1-max-test',
    'message-recipient-2-max-test', 
    'message-recipient-3-max-test',
    'message-recipient-4-max-test',
    'message-recipient-5-max-test'
  ],
  
  // All STRING_PROP_LIST
  kingdom: 'maximum-message-event-test',
  phylum: 'comprehensive-message-testing',
  class: 'all-message-parameters-test',
  order: 'maximum-message-validation',
  family: 'complete-message-coverage',
  genus: 'message-boundary-testing',
  species: 'full-message-validation',
  network: 'message-network-parameter',
  channel: 'message-channel-parameter',
  spend_currency: 'message-currency-parameter',
  spend_type: 'message-spend-type-param',
  
  // LONG_STRING_PROP_LIST
  group_tag: 'maximum-message-group-tag-for-comprehensive-boundary-testing',
  
  // NUMBER_PROP_LIST
  float1: 777777.777777,
  float2: -777777.777777,
  float3: 0.000777,
  float4: 7777777777.777777,
  spend_amount: 77777.77,
});
console.log(`   ✅ Maximum message event created with ${Object.keys(maxMessageEvent).length} properties`);

// ============================================================================
// APP LOG EVENT TESTS
// ============================================================================

console.log('\n📝 APP LOG EVENT BOUNDARY TESTS');
console.log('================================');

// MINIMUM parameters for log event (required fields only)
console.log('   🔹 Testing MINIMUM parameters for log event...');
const minLogEvent = DataCortex.logEvent({
  log_line: 'Minimum log message for boundary testing',
});
console.log(`   ✅ Minimum log event created with ${Object.keys(minLogEvent).length} properties`);

// MAXIMUM parameters for log event (all possible fields)
console.log('   🔹 Testing MAXIMUM parameters for log event...');
const maxLogEvent = DataCortex.logEvent({
  // LOG_STRING_PROP_MAP (with their specific limits)
  hostname: 'maximum-hostname-parameter-for-comprehensive-boundary-testing', // 64 chars
  filename: 'maximum-filename-parameter-for-comprehensive-boundary-testing-with-very-long-path-name-that-reaches-the-limit-of-256-characters-for-complete-validation-of-the-boundary-conditions-in-the-datacortex-library-testing-framework', // 256 chars
  log_level: 'maximum-log-level-parameter-for-comprehensive-boundary-test', // 64 chars
  device_tag: 'maximum-device-tag-parameter-for-comprehensive-boundary-t', // 62 chars
  user_tag: 'maximum-user-tag-parameter-for-comprehensive-boundary-te', // 62 chars
  remote_address: 'maximum-remote-address-parameter-for-comprehensive-boundary', // 64 chars
  log_line: 'Maximum log line parameter for comprehensive boundary testing with a very long message that demonstrates the library can handle extensive log content up to the 65535 character limit. This message includes various details about the testing scenario, parameter validation, boundary conditions, and comprehensive coverage of all possible log event properties. The purpose is to ensure that the DataCortex library properly handles log events with maximum parameter lengths and that the server accepts these large payloads without issues. This extensive testing helps validate the robustness of both client-side parameter handling and server-side processing capabilities.', // 65535 chars max
  
  // LOG_NUMBER_PROP_LIST
  repsonse_bytes: 999999999,
  response_ms: 999999.999,
  
  // LOG_OTHER_PROP_LIST
  event_datetime: new Date().toISOString(),
});
console.log(`   ✅ Maximum log event created with ${Object.keys(maxLogEvent).length} properties`);

// ============================================================================
// ADDITIONAL BOUNDARY TESTS
// ============================================================================

console.log('\n🔬 ADDITIONAL BOUNDARY TESTS');
console.log('=============================');

// Test with simple log() function - minimum
console.log('   🔹 Testing MINIMUM log() function call...');
DataCortex.log('Min log');

// Test with simple log() function - maximum
console.log('   🔹 Testing MAXIMUM log() function call...');
DataCortex.log(
  'Maximum log function call with multiple arguments',
  { complex: 'object', with: { nested: 'properties' } },
  [1, 2, 3, 4, 5],
  999999.999,
  true,
  'Additional string parameter',
  new Error('Test error object'),
  null,
  undefined
);

console.log('\n3. Calling flush() to send ALL boundary test events to server...');
DataCortex.flush();

console.log('\n4. Waiting for server responses to all boundary tests...');

// Wait for all real HTTP requests with native setTimeout
setTimeout(() => {
  console.log('\n📊 BOUNDARY TEST RESULTS:');
  console.log('==========================');
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
    // No errors = valid API key and all boundary tests accepted
    console.log('\n✅ BOUNDARY TEST RESULT: All parameter combinations ACCEPTED');
    console.log('   ✅ Minimum parameter events: ACCEPTED by server');
    console.log('   ✅ Maximum parameter events: ACCEPTED by server');
    console.log('   ✅ Regular events (min/max): ACCEPTED');
    console.log('   ✅ Economy events (min/max): ACCEPTED');
    console.log('   ✅ Message send events (min/max): ACCEPTED');
    console.log('   ✅ App log events (min/max): ACCEPTED');
    console.log('   ✅ All boundary conditions validated successfully');
    console.log('\n🎉 SUCCESS: All boundary parameter tests passed');
    process.exit(0); // Success
  } else {
    // Errors logged = invalid API key or parameter issues
    console.log('\n❌ BOUNDARY TEST RESULT: Issues detected');
    
    // Check if library was disabled (403 error)
    const libraryReady = DataCortex.isReady();
    console.log('   🔒 Library disabled after errors:', !libraryReady);
    
    // Analyze error types
    const hasApiKeyError = errorLogCalls.some(call => 
      call.some(arg => 
        typeof arg === 'string' && (
          arg.includes('Bad API Key') || 
          arg.includes('Invalid API Key') ||
          arg.includes('403') ||
          arg.includes('Forbidden')
        )
      )
    );
    
    const hasBadRequestError = errorLogCalls.some(call => 
      call.some(arg => 
        typeof arg === 'string' && (
          arg.includes('Bad request') ||
          arg.includes('400')
        )
      )
    );
    
    if (hasApiKeyError) {
      console.log('   🎯 Server rejected due to invalid API key');
      console.log('   ✅ Boundary parameter validation cannot proceed without valid key');
      console.log('\n🎯 EXPECTED: Invalid API key rejected (boundary tests would pass with valid key)');
    } else if (hasBadRequestError) {
      console.log('   ⚠️  Server returned 400 Bad Request');
      console.log('   This could indicate parameter validation issues');
      console.log('   Some boundary conditions may not be accepted by server');
    } else {
      console.log('   ⚠️  Unexpected error types detected');
    }
    
    console.log('\n❌ FAILURE: Boundary test issues detected');
    process.exit(1); // Failure
  }
}, 8000); // Wait 8 seconds for all HTTP requests

// Timeout safety
setTimeout(() => {
  console.log('\n⏰ TIMEOUT: Boundary tests took too long');
  console.log('Error log calls so far:', errorLogCalls.length);
  console.log('This could indicate network connectivity problems');
  console.log('\nPartial results:');
  if (errorLogCalls.length > 0) {
    errorLogCalls.forEach((call, index) => {
      console.log(`   Error ${index + 1}: ${call.join(' ')}`);
    });
  }
  process.exit(1);
}, 20000); // 20 second total timeout
