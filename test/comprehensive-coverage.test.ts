#!/usr/bin/env tsx

/**
 * Comprehensive coverage test that combines all test types
 * Uses Node.js native test runner with --experimental-test-coverage
 * Includes both mocked and real API tests for maximum coverage
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

// Use real XMLHttpRequest for some tests, mocked for others
let useRealNetwork = false;

class MockXMLHttpRequest {
  public status = 200;
  public response = '{"success": true}';
  public responseText = '{"success": true}';
  public onload: (() => void) | null = null;
  public onerror: (() => void) | null = null;
  public ontimeout: (() => void) | null = null;

  open(method: string, url: string): void {
    // Mock implementation
  }

  send(data?: any): void {
    // Mock successful response immediately
    if (this.onload) {
      this.onload();
    }
  }

  setRequestHeader(name: string, value: string): void {
    // Mock implementation
  }
}

// Switch between real and mocked network
function setNetworkMode(real: boolean): void {
  useRealNetwork = real;
  if (real) {
    (global as any).XMLHttpRequest = dom.window.XMLHttpRequest;
  } else {
    (global as any).XMLHttpRequest = MockXMLHttpRequest;
  }
}

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
  for (const id of activeTimeouts) {
    originalClearTimeout(id);
  }
  activeTimeouts.clear();

  for (const id of activeIntervals) {
    originalClearInterval(id);
  }
  activeIntervals.clear();
}

// Import DataCortex
const DataCortex = require('../dist/browser-data-cortex.min.js');

describe('Comprehensive DataCortex Coverage Tests', () => {
  let errorLogCalls: any[][] = [];
  let customErrorLog: (...args: any[]) => void;

  beforeEach(() => {
    // Clear localStorage before each test
    (global as any).localStorage.clear();

    // Reset error log tracking
    errorLogCalls = [];
    customErrorLog = (...args: any[]) => {
      errorLogCalls.push(args);
    };
  });

  afterEach(async () => {
    // Clean up timers and wait briefly for any pending operations
    if (useRealNetwork) {
      if (DataCortex && DataCortex.flush) {
        await DataCortex.flush();
      }
    }
    if (DataCortex && DataCortex.destroy) {
      DataCortex.destroy();
    }
    cleanupTimers();
  });

  describe('Unit Tests Coverage', () => {
    beforeEach(() => {
      setNetworkMode(false); // Use mocked network for unit tests
    });

    test('should initialize with required parameters', () => {
      DataCortex.init({
        api_key: process.env.DC_API_KEY,
        org_name: 'unit-test-org',
        errorLog: customErrorLog,
      });

      assert.strictEqual(DataCortex.isReady(), true);
    });

    test('should generate consistent device tags', () => {
      DataCortex.init({
        api_key: process.env.DC_API_KEY,
        org_name: 'device-test-org',
      });

      const deviceTag1 = DataCortex.getDeviceTag();
      const deviceTag2 = DataCortex.getDeviceTag();

      assert.strictEqual(typeof deviceTag1, 'string');
      assert.ok(deviceTag1.length > 0);
      assert.strictEqual(deviceTag1, deviceTag2);
    });

    test('should manage user tags', () => {
      DataCortex.init({
        api_key: process.env.DC_API_KEY,
        org_name: 'user-tag-org',
      });

      DataCortex.addUserTag('test-user-123');
      assert.strictEqual(
        (global as any).localStorage.getItem('dc.user_tag'),
        '"test-user-123"'
      );

      DataCortex.addUserTag(null);
      assert.strictEqual(
        (global as any).localStorage.getItem('dc.user_tag'),
        null
      );
    });

    test('should track basic events', () => {
      DataCortex.init({
        api_key: process.env.DC_API_KEY,
        org_name: 'event-org',
      });

      DataCortex.event({
        kingdom: 'unit-test',
        phylum: 'coverage',
        class: 'basic',
        order: 'event',
        family: 'tracking',
        genus: 'test',
        species: 'unit',
      });

      const eventList = JSON.parse(
        (global as any).localStorage.getItem('dc.event_list') || '[]'
      );
      assert.ok(eventList.length > 0);

      const lastEvent = eventList[eventList.length - 1];
      assert.strictEqual(lastEvent.kingdom, 'unit-test');
      assert.strictEqual(lastEvent.type, 'event');
    });

    test('should validate event parameters', () => {
      DataCortex.init({
        api_key: process.env.DC_API_KEY,
        org_name: 'validation-org',
      });

      assert.throws(() => DataCortex.event(null));
      assert.throws(() => DataCortex.event('invalid'));
      assert.throws(() => DataCortex.event(123));
    });

    test('should truncate long strings', () => {
      DataCortex.init({
        api_key: process.env.DC_API_KEY,
        org_name: 'truncation-org',
      });

      const longString = 'a'.repeat(100);
      DataCortex.event({
        kingdom: longString,
        from_tag: longString,
      });

      const eventList = JSON.parse(
        (global as any).localStorage.getItem('dc.event_list') || '[]'
      );
      const lastEvent = eventList[eventList.length - 1];
      assert.strictEqual(lastEvent.kingdom.length, 32);
      assert.strictEqual(lastEvent.from_tag.length, 64);
    });

    test('should handle number conversion', () => {
      DataCortex.init({
        api_key: process.env.DC_API_KEY,
        org_name: 'number-org',
      });

      DataCortex.event({
        kingdom: 'number-test',
        float1: '123.45',
        float2: 'invalid',
        float3: Infinity,
        float4: NaN,
      });

      const eventList = JSON.parse(
        (global as any).localStorage.getItem('dc.event_list') || '[]'
      );
      const numberEvent = eventList[eventList.length - 1];
      assert.strictEqual(numberEvent.float1, 123.45);
      assert.strictEqual(numberEvent.float2, undefined);
      assert.strictEqual(numberEvent.float3, undefined);
      assert.strictEqual(numberEvent.float4, undefined);
    });
  });

  describe('Boundary Parameter Tests Coverage', () => {
    beforeEach(() => {
      setNetworkMode(false); // Use mocked network
      DataCortex.init({
        api_key: process.env.DC_API_KEY,
        org_name: 'boundary-org',
        errorLog: customErrorLog,
      });
    });

    test('should handle minimum required parameters', () => {
      DataCortex.event({
        kingdom: 'min-test',
      });

      const eventList = JSON.parse(
        (global as any).localStorage.getItem('dc.event_list') || '[]'
      );
      assert.ok(eventList.length > 0);
    });

    test('should handle maximum parameters', () => {
      DataCortex.event({
        kingdom: 'max-test',
        phylum: 'comprehensive',
        class: 'maximum',
        order: 'parameters',
        family: 'test',
        genus: 'boundary',
        species: 'max',
        network: 'test-network',
        channel: 'test-channel',
        from_tag: 'sender',
        group_tag: 'group',
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
      assert.strictEqual(lastEvent.kingdom, 'max-test');
      assert.strictEqual(lastEvent.float1, 123.45);
    });

    test('should handle economy events', () => {
      DataCortex.economyEvent({
        spend_currency: 'USD',
        spend_amount: 99.99,
        spend_type: 'test-purchase',
        kingdom: 'economy-test',
      });

      const eventList = JSON.parse(
        (global as any).localStorage.getItem('dc.event_list') || '[]'
      );
      const economyEvent = eventList[eventList.length - 1];
      assert.strictEqual(economyEvent.type, 'economy');
      assert.strictEqual(economyEvent.spend_currency, 'USD');
      assert.strictEqual(economyEvent.spend_amount, 99.99);
    });

    test('should handle message send events', () => {
      DataCortex.messageSendEvent({
        from_tag: 'sender',
        to_tag: 'receiver',
        kingdom: 'message-test',
      });

      const eventList = JSON.parse(
        (global as any).localStorage.getItem('dc.event_list') || '[]'
      );
      const messageEvents = eventList.filter(
        (e: any) => e.type === 'message_send'
      );
      assert.ok(messageEvents.length > 0);
    });

    test('should handle logging', () => {
      DataCortex.log('Test log message', 123, { test: true });

      const logList = JSON.parse(
        (global as any).localStorage.getItem('dc.log_list') || '[]'
      );
      assert.ok(logList.length > 0);
      assert.ok(logList[0].log_line.includes('Test log message'));
    });

    test('should handle log events', () => {
      DataCortex.logEvent({
        log_line: 'Test log event',
        log_level: 'info',
        hostname: 'test-server',
      });

      const logList = JSON.parse(
        (global as any).localStorage.getItem('dc.log_list') || '[]'
      );
      assert.ok(logList.length > 0);
      assert.strictEqual(logList[0].log_line, 'Test log event');
    });
  });

  describe('User Agent Tests Coverage', () => {
    beforeEach(() => {
      setNetworkMode(false); // Use mocked network
    });

    test('should detect user agent information', () => {
      DataCortex.init({
        api_key: process.env.DC_API_KEY,
        org_name: 'user-agent-org',
      });

      DataCortex.event({
        kingdom: 'user-agent-test',
        phylum: 'detection',
      });

      const eventList = JSON.parse(
        (global as any).localStorage.getItem('dc.event_list') || '[]'
      );
      const lastEvent = eventList[eventList.length - 1];

      // Should have user agent related fields
      assert.ok(Object.keys(lastEvent).length > 5);
    });

    test('should access user agent string', () => {
      const userAgent = (global as any).navigator.userAgent;
      assert.ok(userAgent && userAgent.length > 0);
      assert.ok(userAgent.includes('Chrome'));
    });
  });

  describe('Real API Integration Coverage', () => {
    beforeEach(() => {
      setNetworkMode(true); // Use real network for these tests
    });

    test('should handle real API calls', async () => {
      DataCortex.init({
        api_key: process.env.DC_API_KEY,
        org_name: 'real-api-org',
        errorLog: customErrorLog,
      });

      DataCortex.event({
        kingdom: 'real-api-test',
        phylum: 'integration',
        class: 'coverage',
        order: 'comprehensive',
        family: 'real',
        genus: 'api',
        species: 'test',
      });

      await DataCortex.flush();

      // Should have made real API calls
      // With valid API keys, isReady() should be true
      // With invalid API keys, isReady() will be false but that's expected
      const isReady = DataCortex.isReady();
      const apiKey = process.env.DC_API_KEY;

      // If we're using a test key that starts with 'test-', expect it to fail
      if (apiKey && apiKey.startsWith('test-')) {
        assert.strictEqual(
          isReady,
          false,
          'Test API keys should result in isReady() being false'
        );
      } else {
        // For real API keys, we expect success
        assert.strictEqual(
          isReady,
          true,
          'Real API keys should result in isReady() being true'
        );
      }
    });

    test('should handle API errors gracefully', async () => {
      DataCortex.init({
        api_key: 'definitely-invalid-key-for-testing',
        org_name: 'error-test-org',
        errorLog: customErrorLog,
      });

      DataCortex.event({
        kingdom: 'error-test',
        phylum: 'api',
        class: 'error',
        order: 'handling',
      });

      await DataCortex.flush();

      // Should remain ready even with API errors
      assert.strictEqual(DataCortex.isReady(), false);
    });
  });

  describe('Edge Cases and Cleanup Coverage', () => {
    beforeEach(() => {
      setNetworkMode(false); // Use mocked network
    });

    test('should handle edge case values', () => {
      DataCortex.init({
        api_key: process.env.DC_API_KEY,
        org_name: 'edge-org',
      });

      DataCortex.event({
        kingdom: '',
        phylum: null,
        class: undefined,
        float1: 0,
        float2: Number.MAX_SAFE_INTEGER,
        float3: Number.MIN_SAFE_INTEGER,
        float4: Number.EPSILON,
      });

      const eventList = JSON.parse(
        (global as any).localStorage.getItem('dc.event_list') || '[]'
      );
      assert.ok(eventList.length > 0);
    });

    test('should clean up resources properly with destroy()', () => {
      const initialIntervals = activeIntervals.size;

      DataCortex.init({
        api_key: process.env.DC_API_KEY,
        org_name: 'cleanup-org',
      });

      // Verify DAU interval was created
      assert.strictEqual(
        activeIntervals.size,
        initialIntervals + 1,
        'DAU interval should be created during init'
      );

      DataCortex.event({ kingdom: 'cleanup-test' });
      DataCortex.flush();

      // Call destroy() to clean up the DAU interval
      DataCortex.destroy();

      // Verify the DAU interval was cleaned up
      assert.strictEqual(
        activeIntervals.size,
        initialIntervals,
        'DAU interval should be cleaned up after destroy()'
      );
    });

    test('should handle localStorage integration', () => {
      DataCortex.init({
        api_key: process.env.DC_API_KEY,
        org_name: 'storage-org',
      });

      DataCortex.addUserTag('storage-user');
      DataCortex.event({ kingdom: 'storage-event' });
      DataCortex.log('Storage log');

      const userTag = (global as any).localStorage.getItem('dc.user_tag');
      const eventList = (global as any).localStorage.getItem('dc.event_list');
      const logList = (global as any).localStorage.getItem('dc.log_list');

      assert.ok(userTag !== null);
      assert.ok(eventList !== null);
      assert.ok(logList !== null);
    });
  });
});

export {};
