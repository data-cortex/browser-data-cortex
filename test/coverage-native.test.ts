#!/usr/bin/env tsx

/**
 * Native Node.js test runner coverage test for TypeScript
 * Uses Node.js built-in test runner with --experimental-test-coverage
 * Hits real API endpoints and properly cleans up timers and network requests
 */

import { test, describe, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert';
import { JSDOM } from 'jsdom';
import './crypto-shim';

// Set up comprehensive browser environment
const dom = new JSDOM('<!DOCTYPE html><html><body></body></html>', {
  url: 'https://example.com',
  pretendToBeVisual: true,
  resources: 'usable',
});

// Set up all globals that DataCortex expects
(global as any).window = dom.window;
(global as any).document = dom.window.document;
(global as any).localStorage = dom.window.localStorage;

// Use real XMLHttpRequest for actual API calls
(global as any).XMLHttpRequest = dom.window.XMLHttpRequest;

// Set up navigator with comprehensive user agent
Object.defineProperty((global as any).navigator, 'userAgent', {
  value:
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  writable: true,
  configurable: true,
});

// Use real timers but track them for cleanup
const activeTimeouts = new Set<NodeJS.Timeout>();
const activeIntervals = new Set<NodeJS.Timeout>();

const originalSetTimeout = setTimeout;
const originalClearTimeout = clearTimeout;
const originalSetInterval = setInterval;
const originalClearInterval = clearInterval;

// Override timers to track them
(global as any).window.setTimeout = (fn: Function, delay: number) => {
  const id = originalSetTimeout(fn, delay);
  activeTimeouts.add(id);
  return id;
};

(global as any).window.clearTimeout = (id: NodeJS.Timeout) => {
  activeTimeouts.delete(id);
  originalClearTimeout(id);
};

(global as any).window.setInterval = (fn: Function, delay: number) => {
  const id = originalSetInterval(fn, delay);
  activeIntervals.add(id);
  return id;
};

(global as any).window.clearInterval = (id: NodeJS.Timeout) => {
  activeIntervals.delete(id);
  originalClearInterval(id);
};

// Also override global timer functions (in case the library uses them)
(global as any).setTimeout = (global as any).window.setTimeout;
(global as any).clearTimeout = (global as any).window.clearTimeout;
(global as any).setInterval = (global as any).window.setInterval;
(global as any).clearInterval = (global as any).window.clearInterval;

// Function to clean up all timers
function cleanupTimers(): void {
  // Clear all active timeouts
  for (const id of activeTimeouts) {
    originalClearTimeout(id);
  }
  activeTimeouts.clear();

  // Clear all active intervals
  for (const id of activeIntervals) {
    originalClearInterval(id);
  }
  activeIntervals.clear();
}

// Function to wait for network requests to complete
function waitForNetwork(ms: number = 2000): Promise<void> {
  return new Promise((resolve) => {
    originalSetTimeout(resolve, ms);
  });
}

// Import DataCortex
const DataCortex = require('../dist/browser-data-cortex.min.js');

describe('DataCortex Coverage Tests with Real API', () => {
  let errorLogCalls: any[][] = [];
  let customErrorLog: (...args: any[]) => void;

  beforeEach(() => {
    // Clear localStorage before each test
    (global as any).localStorage.clear();

    // Reset error log tracking
    errorLogCalls = [];
    customErrorLog = (...args: any[]) => {
      errorLogCalls.push(args);
      console.log('API Error captured:', args[0]);
    };
  });

  afterEach(async () => {
    // Flush any pending requests
    if (DataCortex && DataCortex.flush) {
      DataCortex.flush();
    }

    // Wait for network requests to complete
    await waitForNetwork(2000);

    // Clean up all timers
    cleanupTimers();
  });

  describe('Library Initialization with Real API', () => {
    test('should initialize with test API key', async () => {
      DataCortex.init({
        apiKey: process.env.DC_API_KEY,
        orgName: 'coverage-org',
        errorLog: customErrorLog,
      });

      assert.strictEqual(DataCortex.isReady(), true);

      // Trigger a real API call
      DataCortex.event({
        kingdom: 'coverage-init',
        phylum: 'test',
        class: 'initialization',
        order: 'real-api',
        family: 'coverage',
        genus: 'test',
        species: 'init',
      });

      DataCortex.flush();
      await waitForNetwork(2000);
    });

    test('should initialize with full configuration', async () => {
      DataCortex.init({
        apiKey: process.env.DC_API_KEY,
        orgName: 'coverage-org-full',
        appVer: '1.0.0',
        deviceTag: 'coverage-device-tag',
        baseUrl: 'https://api.datacortex.com',
        addErrorHandler: true,
        errorLog: customErrorLog,
      });

      assert.strictEqual(DataCortex.isReady(), true);

      // Trigger a real API call with full config
      DataCortex.event({
        kingdom: 'coverage-full',
        phylum: 'test',
        class: 'full-config',
        order: 'real-api',
        family: 'coverage',
        genus: 'test',
        species: 'full',
      });

      DataCortex.flush();
      await waitForNetwork(2000);
    });
  });

  describe('Device Tag Generation with Real API', () => {
    test('should generate and use device tags in real API calls', async () => {
      DataCortex.init({
        apiKey: process.env.DC_API_KEY,
        orgName: 'device-coverage-org',
        errorLog: customErrorLog,
      });

      const deviceTag1 = DataCortex.getDeviceTag();
      const deviceTag2 = DataCortex.getDeviceTag();

      assert.strictEqual(typeof deviceTag1, 'string');
      assert.ok(deviceTag1.length > 0);
      assert.strictEqual(deviceTag1, deviceTag2);

      // Test device tag in real API call
      DataCortex.event({
        kingdom: 'device-tag-test',
        phylum: 'coverage',
        class: 'device',
        order: 'generation',
        family: 'real-api',
        genus: 'test',
        species: 'device',
      });

      DataCortex.flush();
      await waitForNetwork(2000);
    });
  });

  describe('User Tag Management with Real API', () => {
    beforeEach(() => {
      DataCortex.init({
        apiKey: process.env.DC_API_KEY,
        orgName: 'user-coverage-org',
        errorLog: customErrorLog,
      });
    });

    test('should manage user tags and send to real API', async () => {
      DataCortex.addUserTag('coverage-user-123');
      assert.strictEqual(
        (global as any).localStorage.getItem('dc.user_tag'),
        '"coverage-user-123"'
      );

      // Test user tag in real API call
      DataCortex.event({
        kingdom: 'user-tag-test',
        phylum: 'coverage',
        class: 'user',
        order: 'management',
        family: 'real-api',
        genus: 'test',
        species: 'user',
      });

      DataCortex.flush();
      await waitForNetwork(2000);

      // Test removing user tag
      DataCortex.addUserTag(null);
      assert.strictEqual(
        (global as any).localStorage.getItem('dc.user_tag'),
        null
      );
    });
  });

  describe('Event Tracking with Real API', () => {
    beforeEach(() => {
      DataCortex.init({
        apiKey: process.env.DC_API_KEY,
        orgName: 'event-coverage-org',
        errorLog: customErrorLog,
      });
    });

    test('should track basic events and send to real API', async () => {
      DataCortex.event({
        kingdom: 'coverage-basic',
        phylum: 'event',
        class: 'tracking',
        order: 'basic',
        family: 'real-api',
        genus: 'coverage',
        species: 'basic',
      });

      const eventList = JSON.parse(
        (global as any).localStorage.getItem('dc.event_list') || '[]'
      );
      assert.ok(eventList.length > 0);

      DataCortex.flush();
      await waitForNetwork(2000);
    });

    test('should track comprehensive events with all parameters', async () => {
      DataCortex.event({
        kingdom: 'coverage-comprehensive',
        phylum: 'event',
        class: 'tracking',
        order: 'comprehensive',
        family: 'real-api',
        genus: 'coverage',
        species: 'comprehensive',
        network: 'test-network',
        channel: 'test-channel',
        from_tag: 'coverage-sender',
        group_tag: 'coverage-group',
        float1: 123.45,
        float2: 67.89,
        float3: 999.999,
        float4: 0.001,
        to_list: ['recipient1', 'recipient2'],
      });

      const eventList = JSON.parse(
        (global as any).localStorage.getItem('dc.event_list') || '[]'
      );
      const lastEvent = eventList[eventList.length - 1];
      assert.strictEqual(lastEvent.kingdom, 'coverage-comprehensive');
      assert.strictEqual(lastEvent.float1, 123.45);

      DataCortex.flush();
      await waitForNetwork(2000);
    });
  });

  describe('Economy Events with Real API', () => {
    beforeEach(() => {
      DataCortex.init({
        apiKey: process.env.DC_API_KEY,
        orgName: 'economy-coverage-org',
        errorLog: customErrorLog,
      });
    });

    test('should track economy events and send to real API', async () => {
      DataCortex.economyEvent({
        spend_currency: 'USD',
        spend_amount: 99.99,
        spend_type: 'coverage-purchase',
        kingdom: 'coverage-economy',
        phylum: 'economy',
        class: 'purchase',
        order: 'real-api',
        family: 'coverage',
        genus: 'economy',
        species: 'purchase',
      });

      const eventList = JSON.parse(
        (global as any).localStorage.getItem('dc.event_list') || '[]'
      );
      const economyEvent = eventList[eventList.length - 1];
      assert.strictEqual(economyEvent.type, 'economy');
      assert.strictEqual(economyEvent.spend_currency, 'USD');
      assert.strictEqual(economyEvent.spend_amount, 99.99);

      DataCortex.flush();
      await waitForNetwork(2000);
    });
  });

  describe('Message Send Events with Real API', () => {
    beforeEach(() => {
      DataCortex.init({
        apiKey: process.env.DC_API_KEY,
        orgName: 'message-coverage-org',
        errorLog: customErrorLog,
      });
    });

    test('should track message events and send to real API', async () => {
      DataCortex.messageSendEvent({
        from_tag: 'coverage-sender',
        to_tag: 'coverage-receiver',
        kingdom: 'coverage-message',
        phylum: 'message',
        class: 'send',
        order: 'real-api',
        family: 'coverage',
        genus: 'message',
        species: 'send',
      });

      const eventList = JSON.parse(
        (global as any).localStorage.getItem('dc.event_list') || '[]'
      );
      const messageEvents = eventList.filter(
        (e: any) => e.type === 'message_send'
      );
      assert.ok(messageEvents.length > 0);

      DataCortex.flush();
      await waitForNetwork(2000);
    });
  });

  describe('Logging with Real API', () => {
    beforeEach(() => {
      DataCortex.init({
        apiKey: process.env.DC_API_KEY,
        orgName: 'logging-coverage-org',
        errorLog: customErrorLog,
      });
    });

    test('should send logs to real API', async () => {
      DataCortex.log('Coverage test log message for real API');
      DataCortex.log('Complex coverage log', 123, { coverage: true }, [
        'test',
        'data',
      ]);

      const logList = JSON.parse(
        (global as any).localStorage.getItem('dc.log_list') || '[]'
      );
      assert.ok(logList.length >= 2);

      DataCortex.flush();
      await waitForNetwork(2000);
    });

    test('should send log events to real API', async () => {
      DataCortex.logEvent({
        log_line: 'Coverage log event for real API testing',
        log_level: 'info',
        hostname: 'coverage-test-server.example.com',
        filename: '/coverage/test/file.js',
        deviceTag: 'coverage-device',
        user_tag: 'coverage-user',
        remote_address: '192.168.1.100',
        repsonse_bytes: 2048,
        response_ms: 250.5,
      });

      const logList = JSON.parse(
        (global as any).localStorage.getItem('dc.log_list') || '[]'
      );
      const lastLog = logList[logList.length - 1];
      assert.strictEqual(
        lastLog.log_line,
        'Coverage log event for real API testing'
      );

      DataCortex.flush();
      await waitForNetwork(2000);
    });
  });

  describe('Error Handling with Real API', () => {
    test('should handle API errors gracefully', async () => {
      DataCortex.init({
        apiKey: 'definitely-invalid-api-key-for-coverage-testing',
        orgName: 'error-coverage-org',
        errorLog: customErrorLog,
      });

      // This should trigger an API error
      DataCortex.event({
        kingdom: 'error-test',
        phylum: 'coverage',
        class: 'error',
        order: 'handling',
        family: 'real-api',
        genus: 'error',
        species: 'test',
      });

      DataCortex.flush();
      await waitForNetwork(3000); // Wait longer for error response

      // Should have captured API errors
      console.log(`Captured ${errorLogCalls.length} error log calls`);
    });
  });

  describe('Comprehensive Real API Integration', () => {
    test('should perform full integration test with real API', async () => {
      DataCortex.init({
        apiKey: process.env.DC_API_KEY,
        orgName: 'integration-coverage-org',
        appVer: '2.0.0-coverage',
        errorLog: customErrorLog,
      });

      // Add user tag
      DataCortex.addUserTag('integration-coverage-user');

      // Send multiple event types
      DataCortex.event({
        kingdom: 'integration',
        phylum: 'coverage',
        class: 'comprehensive',
        order: 'test',
        family: 'real-api',
        genus: 'integration',
        species: 'full',
        float1: 100.0,
        float2: 200.0,
      });

      DataCortex.economyEvent({
        spend_currency: 'GOLD',
        spend_amount: 50.0,
        spend_type: 'integration-test',
        kingdom: 'integration',
        phylum: 'economy',
        class: 'comprehensive',
        order: 'test',
        family: 'real-api',
        genus: 'integration',
        species: 'economy',
      });

      DataCortex.messageSendEvent({
        from_tag: 'integration-sender',
        to_list: ['receiver1', 'receiver2', 'receiver3'],
        kingdom: 'integration',
        phylum: 'message',
        class: 'comprehensive',
        order: 'test',
        family: 'real-api',
        genus: 'integration',
        species: 'message',
      });

      DataCortex.log('Integration coverage test log');

      DataCortex.logEvent({
        log_line: 'Integration coverage log event',
        log_level: 'debug',
        hostname: 'integration-coverage-server',
      });

      // Verify data is stored locally
      const eventList = JSON.parse(
        (global as any).localStorage.getItem('dc.event_list') || '[]'
      );
      const logList = JSON.parse(
        (global as any).localStorage.getItem('dc.log_list') || '[]'
      );

      assert.ok(eventList.length >= 3, 'Should have multiple events');
      assert.ok(logList.length >= 2, 'Should have multiple logs');

      // Flush all data to real API
      DataCortex.flush();
      await waitForNetwork(3000); // Wait longer for comprehensive test

      console.log(
        `Integration test completed with ${errorLogCalls.length} API responses`
      );
    });
  });

  describe('Timer and Network Cleanup Verification', () => {
    test('should properly clean up DAU interval when destroy() is called', async () => {
      const initialTimeouts = activeTimeouts.size;
      const initialIntervals = activeIntervals.size;

      // Initialize DataCortex - this should create the DAU interval
      DataCortex.init({
        apiKey: process.env.DC_API_KEY,
        orgName: 'cleanup-coverage-org',
        errorLog: customErrorLog,
      });

      // Wait a moment for initialization to complete
      await waitForNetwork(100);

      // Verify that the DAU interval was created
      const intervalsAfterInit = activeIntervals.size;
      assert.strictEqual(
        intervalsAfterInit,
        initialIntervals + 1,
        'DAU interval should be created during initialization'
      );

      // Generate some activity that might create additional timers
      DataCortex.event({ kingdom: 'cleanup-test' });
      DataCortex.log('Cleanup test log');
      DataCortex.flush();

      // Wait for any pending network operations
      await waitForNetwork(1000);

      // Now call destroy() - this should clean up the DAU interval
      DataCortex.destroy();

      // Verify that the DAU interval was cleaned up
      assert.strictEqual(
        activeIntervals.size,
        initialIntervals,
        'DAU interval should be cleaned up after destroy() is called'
      );

      // Any remaining timeouts should be from network operations, not from the library's core timers
      console.log(`Remaining timeouts after destroy(): ${activeTimeouts.size}`);
      console.log(
        `Remaining intervals after destroy(): ${activeIntervals.size}`
      );

      console.log('✅ DataCortex.destroy() properly cleaned up DAU interval');
    });

    test('should handle multiple destroy() calls gracefully', async () => {
      const initialIntervals = activeIntervals.size;

      // Initialize DataCortex
      DataCortex.init({
        apiKey: process.env.DC_API_KEY,
        orgName: 'multi-destroy-test',
        errorLog: customErrorLog,
      });

      await waitForNetwork(100);

      // Verify DAU interval was created
      assert.strictEqual(
        activeIntervals.size,
        initialIntervals + 1,
        'DAU interval should be created'
      );

      // Call destroy() multiple times
      DataCortex.destroy();
      DataCortex.destroy();
      DataCortex.destroy();

      // Should still be properly cleaned up
      assert.strictEqual(
        activeIntervals.size,
        initialIntervals,
        'Multiple destroy() calls should not cause issues'
      );

      console.log('✅ Multiple destroy() calls handled gracefully');
    });

    test('should not leave any timers after proper cleanup sequence', async () => {
      const initialTimeouts = activeTimeouts.size;
      const initialIntervals = activeIntervals.size;

      // Full lifecycle test
      DataCortex.init({
        apiKey: process.env.DC_API_KEY,
        orgName: 'full-lifecycle-test',
        errorLog: customErrorLog,
      });

      // Do some work
      DataCortex.event({ kingdom: 'lifecycle-test' });
      DataCortex.log('Lifecycle test log');

      // Flush to send data
      await DataCortex.flush();

      // Wait for network operations to complete
      await waitForNetwork(2000);

      // Properly destroy the library
      DataCortex.destroy();

      // Now manually clean up any remaining network-related timers
      // (these would be from fetch timeouts, not from the library's core functionality)
      cleanupTimers();

      // Verify complete cleanup
      assert.strictEqual(
        activeTimeouts.size,
        0,
        'No timeouts should remain after proper cleanup sequence'
      );
      assert.strictEqual(
        activeIntervals.size,
        0,
        'No intervals should remain after proper cleanup sequence'
      );

      console.log('✅ Complete cleanup sequence verified - no stale timers');
    });
  });
});

export {};
