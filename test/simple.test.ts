// Import setup first to establish browser environment
import './setup.js';

import { test, describe, beforeEach, mock } from 'node:test';
import assert from 'node:assert';

// Import the module after setting up globals
import '../dist/browser-data-cortex.min.js';
const DataCortex = (global as any).DataCortex;

describe('DataCortex Library Tests', () => {
  beforeEach(() => {
    // Clear localStorage
    (global as any).localStorage.clear();

    // Mock setTimeout to prevent infinite loops
    (global as any).window.setTimeout = mock.fn((fn: Function, delay: number) => {
      // Don't actually execute the timeout to avoid loops
      return 1;
    });

    (global as any).window.setInterval = mock.fn((fn: Function, delay: number) => {
      // Don't actually execute the interval
      return 1;
    });
  });

  describe('Basic Functionality', () => {
    test('should initialize with required parameters', () => {
      const opts = {
        api_key: process.env.DC_API_KEY || 'test-key',
        org_name: 'test-org',
        app_ver: '1.0.0',
      };

      DataCortex.init(opts);
      assert.strictEqual(DataCortex.isReady(), true);
    });

    test('should generate device tag', () => {
      const opts = {
        api_key: 'test-key',
        org_name: 'test-org',
      };

      DataCortex.init(opts);
      const deviceTag = DataCortex.getDeviceTag();
      assert.strictEqual(typeof deviceTag, 'string');
      assert.strictEqual(deviceTag.length, 32);
    });

    test('should add and manage user tags', () => {
      DataCortex.init({
        api_key: 'test-key',
        org_name: 'test-org',
      });

      DataCortex.addUserTag('user123');
      assert.strictEqual(
        (global as any).localStorage.getItem('dc.user_tag'),
        '"user123"'
      );

      DataCortex.addUserTag(null);
      assert.strictEqual((global as any).localStorage.getItem('dc.user_tag'), null);
    });
  });

  describe('Event Tracking', () => {
    beforeEach(() => {
      DataCortex.init({
        api_key: 'test-key',
        org_name: 'test-org',
      });
    });

    test('should track basic event', () => {
      const eventData = {
        kingdom: 'test-kingdom',
        phylum: 'test-phylum',
        class: 'test-class',
        order: 'test-order',
        family: 'test-family',
        genus: 'test-genus',
        species: 'test-species',
        float1: 123.45,
      };

      const result = DataCortex.event(eventData);

      // event() now returns void
      assert.strictEqual(result, undefined);

      // Check that event was stored in localStorage
      const eventList = JSON.parse(
        (global as any).localStorage.getItem('dc.event_list') || '[]'
      );
      assert.strictEqual(eventList.length >= 1, true);
      const lastEvent = eventList[eventList.length - 1];
      assert.strictEqual(lastEvent.type, 'event');
      assert.strictEqual(lastEvent.kingdom, 'test-kingdom');
      assert.strictEqual(lastEvent.float1, 123.45);
      assert.strictEqual(typeof lastEvent.event_index, 'number');
      assert.strictEqual(typeof lastEvent.event_datetime, 'string');
    });

    test('should throw error for invalid event props', () => {
      assert.throws(() => {
        DataCortex.event(null);
      }, /props must be an object/);

      assert.throws(() => {
        DataCortex.event('invalid');
      }, /props must be an object/);
    });

    test('should truncate string properties to 32 characters', () => {
      const longString = 'a'.repeat(50);
      const result = DataCortex.event({
        kingdom: longString,
      });

      // event() now returns void
      assert.strictEqual(result, undefined);

      // Check that event was stored with truncated string
      const eventList = JSON.parse(
        (global as any).localStorage.getItem('dc.event_list') || '[]'
      );
      const lastEvent = eventList[eventList.length - 1];
      assert.strictEqual(lastEvent.kingdom.length, 32);
    });

    test('should handle number conversion', () => {
      const result = DataCortex.event({
        float1: '123.45',
        float2: 'invalid',
        float3: Infinity,
      });

      // event() now returns void
      assert.strictEqual(result, undefined);

      // Check that event was stored with converted numbers
      const eventList = JSON.parse(
        (global as any).localStorage.getItem('dc.event_list') || '[]'
      );
      const lastEvent = eventList[eventList.length - 1];
      assert.strictEqual(lastEvent.float1, 123.45);
      assert.strictEqual(lastEvent.float2, undefined);
      assert.strictEqual(lastEvent.float3, undefined);
    });
  });

  describe('Economy Event Tracking', () => {
    beforeEach(() => {
      DataCortex.init({
        api_key: 'test-key',
        org_name: 'test-org',
      });
    });

    test('should track economy event', () => {
      const eventData = {
        spend_currency: 'USD',
        spend_amount: 9.99,
        spend_type: 'purchase',
        kingdom: 'economy',
        phylum: 'purchase',
      };

      const result = DataCortex.economyEvent(eventData);

      // economyEvent() now returns void
      assert.strictEqual(result, undefined);

      // Check that event was stored in localStorage
      const eventList = JSON.parse(
        (global as any).localStorage.getItem('dc.event_list') || '[]'
      );
      const lastEvent = eventList[eventList.length - 1];
      assert.strictEqual(lastEvent.type, 'economy');
      assert.strictEqual(lastEvent.spend_currency, 'USD');
      assert.strictEqual(lastEvent.spend_amount, 9.99);
      assert.strictEqual(lastEvent.spend_type, 'purchase');
    });

    test('should throw error for missing spend_currency', () => {
      assert.throws(() => {
        DataCortex.economyEvent({
          spend_amount: 9.99,
        });
      }, /spend_currency is required/);
    });

    test('should throw error for missing spend_amount', () => {
      assert.throws(() => {
        DataCortex.economyEvent({
          spend_currency: 'USD',
        });
      }, /spend_amount is required/);
    });

    test('should throw error for invalid spend_amount', () => {
      assert.throws(() => {
        DataCortex.economyEvent({
          spend_currency: 'USD',
          spend_amount: 'invalid',
        });
      }, /spend_amount is required/);
    });
  });

  describe('Message Send Event Tracking', () => {
    beforeEach(() => {
      DataCortex.init({
        api_key: 'test-key',
        org_name: 'test-org',
      });
    });

    test('should track message send event with to_tag', () => {
      const eventData = {
        from_tag: 'user1',
        to_tag: 'user2',
        kingdom: 'message',
      };

      const result = DataCortex.messageSendEvent(eventData);

      // messageSendEvent() now returns void
      assert.strictEqual(result, undefined);

      // Check that event was stored in localStorage
      const eventList = JSON.parse(
        (global as any).localStorage.getItem('dc.event_list') || '[]'
      );
      const lastEvent = eventList[eventList.length - 1];
      assert.strictEqual(lastEvent.type, 'message_send');
      assert.strictEqual(lastEvent.from_tag, 'user1');
      assert.deepStrictEqual(lastEvent.to_list, ['user2']);
    });

    test('should track message send event with to_list', () => {
      const eventData = {
        from_tag: 'user1',
        to_list: ['user2', 'user3'],
        kingdom: 'message',
      };

      const result = DataCortex.messageSendEvent(eventData);

      // messageSendEvent() now returns void
      assert.strictEqual(result, undefined);

      // Check that event was stored in localStorage
      const eventList = JSON.parse(
        (global as any).localStorage.getItem('dc.event_list') || '[]'
      );
      const lastEvent = eventList[eventList.length - 1];
      assert.strictEqual(lastEvent.type, 'message_send');
      assert.deepStrictEqual(lastEvent.to_list, ['user2', 'user3']);
    });

    test('should throw error for missing from_tag', () => {
      assert.throws(() => {
        DataCortex.messageSendEvent({
          to_tag: 'user2',
        });
      }, /from_tag is required/);
    });

    test('should throw error for missing to_tag and to_list', () => {
      assert.throws(() => {
        DataCortex.messageSendEvent({
          from_tag: 'user1',
        });
      }, /to_tag or to_list is required/);
    });
  });

  describe('Logging', () => {
    beforeEach(() => {
      DataCortex.init({
        api_key: 'test-key',
        org_name: 'test-org',
      });
    });

    test('should log simple message', () => {
      const result = DataCortex.log('test message');

      // log() now returns void
      assert.strictEqual(result, undefined);

      // Check that log was stored
      const logList = JSON.parse(
        (global as any).localStorage.getItem('dc.log_list') || '[]'
      );
      assert.strictEqual(logList.length >= 1, true);
      const lastLog = logList[logList.length - 1];
      assert.strictEqual(lastLog.log_line, 'test message');
    });

    test('should log multiple arguments', () => {
      DataCortex.log('message', 123, { key: 'value' });

      const logList = JSON.parse(
        (global as any).localStorage.getItem('dc.log_list') || '[]'
      );
      assert.strictEqual(logList[0].log_line, 'message 123 {"key":"value"}');
    });

    test('should throw error for no arguments', () => {
      assert.throws(() => {
        DataCortex.log();
      }, /log must have arguments/);
    });
  });

  describe('Log Event Tracking', () => {
    beforeEach(() => {
      DataCortex.init({
        api_key: 'test-key',
        org_name: 'test-org',
      });
    });

    test('should track log event', () => {
      const logData = {
        log_line: 'test log message',
        log_level: 'info',
        hostname: 'example.com',
      };

      const result = DataCortex.logEvent(logData);

      // logEvent() now returns void
      assert.strictEqual(result, undefined);

      // Check that log was stored in localStorage
      const logList = JSON.parse(
        (global as any).localStorage.getItem('dc.log_list') || '[]'
      );
      const lastLog = logList[logList.length - 1];
      assert.strictEqual(lastLog.log_line, 'test log message');
      assert.strictEqual(lastLog.log_level, 'info');
      assert.strictEqual(lastLog.hostname, 'example.com');
      assert.strictEqual(typeof lastLog.event_datetime, 'string');
    });

    test('should throw error for invalid props', () => {
      assert.throws(() => {
        DataCortex.logEvent(null);
      }, /props must be an object/);
    });

    test('should truncate string properties according to limits', () => {
      const longString = 'a'.repeat(1000);
      const result = DataCortex.logEvent({
        hostname: longString,
        log_line: longString,
      });

      // logEvent() now returns void
      assert.strictEqual(result, undefined);

      // Check that log was stored with truncated properties
      const logList = JSON.parse(
        (global as any).localStorage.getItem('dc.log_list') || '[]'
      );
      const lastLog = logList[logList.length - 1];
      assert.strictEqual(lastLog.hostname.length, 64);
      assert.strictEqual(lastLog.log_line.length, 1000); // log_line has higher limit
    });
  });

  describe('Local Storage Integration', () => {
    test('should persist events in localStorage', () => {
      DataCortex.init({
        api_key: 'test-key',
        org_name: 'test-org',
      });

      DataCortex.event({ kingdom: 'test' });

      const eventList = JSON.parse(
        (global as any).localStorage.getItem('dc.event_list') || '[]'
      );
      assert.strictEqual(eventList.length, 1);
      assert.strictEqual(eventList[0].kingdom, 'test');
    });

    test('should persist user tag in localStorage', () => {
      DataCortex.init({
        api_key: 'test-key',
        org_name: 'test-org',
      });

      DataCortex.addUserTag('user123');

      const userTag = JSON.parse((global as any).localStorage.getItem('dc.user_tag'));
      assert.strictEqual(userTag, 'user123');
    });

    test('should restore state from localStorage on init', () => {
      // Pre-populate localStorage
      (global as any).localStorage.setItem('dc.user_tag', '"restored-user"');
      (global as any).localStorage.setItem(
        'dc.event_list',
        '[{"kingdom":"restored","event_index":5}]'
      );
      (global as any).localStorage.setItem('dc.next_index', '6');

      DataCortex.init({
        api_key: 'test-key',
        org_name: 'test-org',
      });

      // Add new event to test index continuation
      const result = DataCortex.event({ kingdom: 'new' });

      // event() now returns void
      assert.strictEqual(result, undefined);

      // Check that event was stored with correct index
      const eventList = JSON.parse(
        (global as any).localStorage.getItem('dc.event_list') || '[]'
      );
      const lastEvent = eventList[eventList.length - 1];
      assert.strictEqual(lastEvent.event_index, 6);
    });
  });

  describe('Edge Cases', () => {
    beforeEach(() => {
      DataCortex.init({
        api_key: 'test-key',
        org_name: 'test-org',
      });
    });

    test('should handle empty string properties', () => {
      const result = DataCortex.event({
        kingdom: '',
        phylum: null,
        class: undefined,
        float1: 0,
      });

      // event() now returns void
      assert.strictEqual(result, undefined);

      // Check that event was stored with proper handling of empty values
      const eventList = JSON.parse(
        (global as any).localStorage.getItem('dc.event_list') || '[]'
      );
      const lastEvent = eventList[eventList.length - 1];
      assert.strictEqual(lastEvent.kingdom, undefined);
      assert.strictEqual(lastEvent.phylum, undefined);
      assert.strictEqual(lastEvent.class, undefined);
      assert.strictEqual(lastEvent.float1, 0);
    });

    test('should handle crypto fallback', () => {
      const originalCrypto = (global as any).crypto;
      delete (global as any).crypto;
      delete (global as any).window.crypto;

      DataCortex.init({
        api_key: 'test-key',
        org_name: 'test-org',
      });

      const deviceTag = DataCortex.getDeviceTag();
      assert.strictEqual(typeof deviceTag, 'string');
      assert.strictEqual(deviceTag.length, 32);

      (global as any).crypto = originalCrypto;
      (global as any).window.crypto = originalCrypto;
    });
  });
});

export {};
