#!/usr/bin/env tsx

// Comprehensive boundary parameter tests for all event types
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

console.log(
  '🎯 BOUNDARY PARAMETER TESTS: Max/Min Parameters for All Event Types'
);
console.log(
  '===================================================================='
);

// Use the provided API key (or default invalid one)
const testApiKey = process.env.DC_API_KEY || 'DEFINITELY_INVALID_KEY_12345';

console.log(`Testing API key: ${testApiKey}`);
console.log(`Key length: ${testApiKey.length} characters`);

// Test runner
interface TestResult {
  name: string;
  passed: boolean;
  error?: string;
}

class BoundaryTestRunner {
  private results: TestResult[] = [];

  test(name: string, testFn: () => void): void {
    try {
      testFn();
      this.results.push({ name, passed: true });
      console.log(`✅ ${name}`);
    } catch (error: any) {
      this.results.push({ name, passed: false, error: error.message });
      console.log(`❌ ${name}: ${error.message}`);
    }
  }

  getResults(): { passed: number; failed: number; total: number } {
    const passed = this.results.filter(r => r.passed).length;
    const failed = this.results.filter(r => !r.passed).length;
    return { passed, failed, total: this.results.length };
  }

  printSummary(): void {
    const { passed, failed, total } = this.getResults();
    console.log(`\n📊 Test Results: ${passed}/${total} passed, ${failed} failed`);
    
    if (failed > 0) {
      console.log('\n❌ Failed tests:');
      this.results.filter(r => !r.passed).forEach(r => {
        console.log(`   - ${r.name}: ${r.error}`);
      });
      process.exit(1);
    } else {
      console.log('\n🎉 All boundary parameter tests passed!');
    }
  }
}

const runner = new BoundaryTestRunner();

// Helper functions
function assert(condition: any, message: string): void {
  if (!condition) {
    throw new Error(message);
  }
}

function assertEqual(actual: any, expected: any, message?: string): void {
  if (actual !== expected) {
    throw new Error(message || `Expected ${expected}, got ${actual}`);
  }
}

// Initialize DataCortex
console.log('\n🔧 Initializing DataCortex...');
DataCortex.init({
  api_key: testApiKey,
  org_name: 'boundary-test-org',
  app_ver: '1.0.0',
});

console.log(`✅ DataCortex initialized. Ready: ${DataCortex.isReady()}`);

// Test 1: Minimum Required Parameters
runner.test('Minimum required parameters for regular event', () => {
  const result = DataCortex.event({
    kingdom: 'min',
    phylum: 'test',
    class: 'boundary',
    order: 'minimal',
    family: 'params',
    genus: 'regular',
    species: 'event',
    network: 'test-net',
    channel: 'test-ch',
  });
  
  assertEqual(result, undefined, 'Event should return undefined');
  
  // Check localStorage
  const eventList = JSON.parse((global as any).localStorage.getItem('dc.event_list') || '[]');
  assert(eventList.length > 0, 'Event should be stored');
  
  const lastEvent = eventList[eventList.length - 1];
  assertEqual(lastEvent.kingdom, 'min', 'Kingdom should be stored correctly');
});

runner.test('Minimum required parameters for economy event', () => {
  const result = DataCortex.economyEvent({
    spend_currency: 'gold',
    spend_amount: 1.0,
    kingdom: 'min',
    phylum: 'economy',
    class: 'boundary',
    order: 'minimal',
    family: 'params',
    genus: 'economy',
    species: 'event',
    network: 'test-net',
    channel: 'test-ch',
  });
  
  assertEqual(result, undefined, 'Economy event should return undefined');
  
  const eventList = JSON.parse((global as any).localStorage.getItem('dc.event_list') || '[]');
  const lastEvent = eventList[eventList.length - 1];
  assertEqual(lastEvent.type, 'economy', 'Should be economy event');
  assertEqual(lastEvent.spend_currency, 'gold', 'Currency should be stored');
});

runner.test('Minimum required parameters for message send event', () => {
  const result = DataCortex.messageSendEvent({
    from_tag: 'sender',
    to_tag: 'receiver',
    kingdom: 'min',
    phylum: 'message',
    class: 'boundary',
    order: 'minimal',
    family: 'params',
    genus: 'message',
    species: 'event',
    network: 'test-net',
    channel: 'test-ch',
  });
  
  assertEqual(result, undefined, 'Message event should return undefined');
  
  const eventList = JSON.parse((global as any).localStorage.getItem('dc.event_list') || '[]');
  const lastEvent = eventList[eventList.length - 1];
  assertEqual(lastEvent.type, 'message_send', 'Should be message_send event');
  assertEqual(lastEvent.from_tag, 'sender', 'From tag should be stored');
});

runner.test('Minimum required parameters for log event', () => {
  const result = DataCortex.logEvent({
    log_line: 'Minimum log message for boundary testing',
  });
  
  assertEqual(result, undefined, 'Log event should return undefined');
  
  const logList = JSON.parse((global as any).localStorage.getItem('dc.log_list') || '[]');
  assert(logList.length > 0, 'Log should be stored');
  
  const lastLog = logList[logList.length - 1];
  assertEqual(lastLog.log_line, 'Minimum log message for boundary testing', 'Log line should be stored');
});

// Test 2: Maximum Parameters
runner.test('Maximum parameters for regular event', () => {
  const result = DataCortex.event({
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

    // LONG_STRING_PROP_LIST (64 char limit each)
    from_tag: 'maximum-from-tag-parameter-for-comprehensive-boundary-testing',

    // NUMBER_PROP_LIST
    float1: 999999.999999,
    float2: -999999.999999,
    float3: 0.000001,
    float4: 1234567890.123456,
  });
  
  assertEqual(result, undefined, 'Event should return undefined');
  
  const eventList = JSON.parse((global as any).localStorage.getItem('dc.event_list') || '[]');
  const lastEvent = eventList[eventList.length - 1];
  
  // The kingdom string is 29 characters, so it shouldn't be truncated
  const originalKingdom = 'maximum-parameters-test-event';
  assertEqual(lastEvent.kingdom.length, originalKingdom.length, 'Kingdom should not be truncated if under 32 chars');
  assertEqual(lastEvent.kingdom, originalKingdom, 'Kingdom should match original string');
  
  // The from_tag string is 61 characters, so it shouldn't be truncated (limit is 64)
  const originalFromTag = 'maximum-from-tag-parameter-for-comprehensive-boundary-testing';
  assertEqual(lastEvent.from_tag.length, originalFromTag.length, 'From tag should not be truncated if under 64 chars');
  assertEqual(lastEvent.from_tag, originalFromTag, 'From tag should match original string');
  assertEqual(lastEvent.float1, 999999.999999, 'Float1 should be preserved');
});

// Test 3: String Truncation
runner.test('String property truncation limits', () => {
  const veryLongString = 'x'.repeat(200);
  
  const result = DataCortex.event({
    kingdom: veryLongString, // 32 char limit
    phylum: 'test',
    class: 'test',
    order: 'test',
    family: 'test',
    genus: 'test',
    species: 'test',
    from_tag: veryLongString, // 64 char limit
  });
  
  assertEqual(result, undefined, 'Event should return undefined');
  
  const eventList = JSON.parse((global as any).localStorage.getItem('dc.event_list') || '[]');
  const lastEvent = eventList[eventList.length - 1];
  
  assertEqual(lastEvent.kingdom.length, 32, 'Kingdom should be truncated to 32 chars');
  assertEqual(lastEvent.from_tag.length, 64, 'From tag should be truncated to 64 chars');
  assertEqual(lastEvent.kingdom, 'x'.repeat(32), 'Truncated string should match expected');
});

// Test 4: Log Property Truncation
runner.test('Log property truncation limits', () => {
  const longString = 'y'.repeat(200);
  
  const result = DataCortex.logEvent({
    hostname: longString, // 64 char limit
    filename: longString, // 256 char limit
    log_level: longString, // 64 char limit
    device_tag: longString, // 62 char limit
    user_tag: longString, // 62 char limit
    remote_address: longString, // 64 char limit
    log_line: longString, // 65535 char limit (should preserve 200 chars)
  });
  
  assertEqual(result, undefined, 'Log event should return undefined');
  
  const logList = JSON.parse((global as any).localStorage.getItem('dc.log_list') || '[]');
  const lastLog = logList[logList.length - 1];
  
  assertEqual(lastLog.hostname.length, 64, 'Hostname should be truncated to 64 chars');
  assertEqual(lastLog.filename.length, 200, 'Filename should preserve length (under 256 limit)');
  assertEqual(lastLog.log_level.length, 64, 'Log level should be truncated to 64 chars');
  assertEqual(lastLog.device_tag.length, 62, 'Device tag should be truncated to 62 chars');
  assertEqual(lastLog.user_tag.length, 62, 'User tag should be truncated to 62 chars');
  assertEqual(lastLog.remote_address.length, 64, 'Remote address should be truncated to 64 chars');
  assertEqual(lastLog.log_line.length, 200, 'Log line should preserve length (under 65535 limit)');
});

// Test 5: Number Validation
runner.test('Number property validation', () => {
  const result = DataCortex.event({
    kingdom: 'test',
    phylum: 'test',
    class: 'test',
    order: 'test',
    family: 'test',
    genus: 'test',
    species: 'test',
    float1: 123.456789,
    float2: -987.654321,
    float3: 0,
    float4: 999999999.999999,
  });
  
  assertEqual(result, undefined, 'Event should return undefined');
  
  const eventList = JSON.parse((global as any).localStorage.getItem('dc.event_list') || '[]');
  const lastEvent = eventList[eventList.length - 1];
  
  assertEqual(lastEvent.float1, 123.456789, 'Float1 should be preserved');
  assertEqual(lastEvent.float2, -987.654321, 'Float2 should be preserved');
  assertEqual(lastEvent.float3, 0, 'Float3 zero should be preserved');
  assertEqual(lastEvent.float4, 999999999.999999, 'Float4 should be preserved');
});

// Run all tests and print summary
console.log('\n🏁 Running boundary parameter tests...\n');
runner.printSummary();

// Ensure the process exits
process.exit(0);

export {};
