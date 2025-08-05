// Import setup first to establish browser environment
import './setup.js';

import { test, describe, beforeEach, mock } from 'node:test';
import assert from 'node:assert';

// Import the module after setting up globals
import DataCortex from '../src/index.js';

describe('DataCortex Library Tests', () => {
  beforeEach(() => {
    // Clear localStorage
    global.localStorage.clear();

    // Mock setTimeout to prevent infinite loops
    global.window.setTimeout = mock.fn((fn, delay) => {
      // Don't actually execute the timeout to avoid loops
      return 1;
    });

    global.window.setInterval = mock.fn((fn, delay) => {
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
        global.localStorage.getItem('dc.user_tag'),
        '"user123"'
      );

      DataCortex.addUserTag(null);
      assert.strictEqual(global.localStorage.getItem('dc.user_tag'), null);
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

      assert.strictEqual(result.type, 'event');
      assert.strictEqual(result.kingdom, 'test-kingdom');
      assert.strictEqual(result.float1, 123.45);
      assert.strictEqual(typeof result.event_index, 'number');
      assert.strictEqual(typeof result.event_datetime, 'string');
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

      assert.strictEqual(result.kingdom.length, 32);
    });

    test('should handle number conversion', () => {
      const result = DataCortex.event({
        float1: '123.45',
        float2: 'invalid',
        float3: Infinity,
      });

      assert.strictEqual(result.float1, 123.45);
      assert.strictEqual(result.float2, undefined);
      assert.strictEqual(result.float3, undefined);
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

      assert.strictEqual(result.type, 'economy');
      assert.strictEqual(result.spend_currency, 'USD');
      assert.strictEqual(result.spend_amount, 9.99);
      assert.strictEqual(result.spend_type, 'purchase');
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

      assert.strictEqual(result.type, 'message_send');
      assert.strictEqual(result.from_tag, 'user1');
      assert.deepStrictEqual(result.to_list, ['user2']);
    });

    test('should track message send event with to_list', () => {
      const eventData = {
        from_tag: 'user1',
        to_list: ['user2', 'user3'],
        kingdom: 'message',
      };

      const result = DataCortex.messageSendEvent(eventData);

      assert.strictEqual(result.type, 'message_send');
      assert.deepStrictEqual(result.to_list, ['user2', 'user3']);
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
      DataCortex.log('test message');

      // Check that log was stored
      const logList = JSON.parse(
        global.localStorage.getItem('dc.log_list') || '[]'
      );
      assert.strictEqual(logList.length, 1);
      assert.strictEqual(logList[0].log_line, 'test message');
    });

    test('should log multiple arguments', () => {
      DataCortex.log('message', 123, { key: 'value' });

      const logList = JSON.parse(
        global.localStorage.getItem('dc.log_list') || '[]'
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

      assert.strictEqual(result.log_line, 'test log message');
      assert.strictEqual(result.log_level, 'info');
      assert.strictEqual(result.hostname, 'example.com');
      assert.strictEqual(typeof result.event_datetime, 'string');
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

      assert.strictEqual(result.hostname.length, 64);
      assert.strictEqual(result.log_line.length, 1000); // log_line has higher limit
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
        global.localStorage.getItem('dc.event_list') || '[]'
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

      const userTag = JSON.parse(global.localStorage.getItem('dc.user_tag'));
      assert.strictEqual(userTag, 'user123');
    });

    test('should restore state from localStorage on init', () => {
      // Pre-populate localStorage
      global.localStorage.setItem('dc.user_tag', '"restored-user"');
      global.localStorage.setItem(
        'dc.event_list',
        '[{"kingdom":"restored","event_index":5}]'
      );
      global.localStorage.setItem('dc.next_index', '6');

      DataCortex.init({
        api_key: 'test-key',
        org_name: 'test-org',
      });

      // Add new event to test index continuation
      const result = DataCortex.event({ kingdom: 'new' });
      assert.strictEqual(result.event_index, 6);
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

      assert.strictEqual(result.kingdom, undefined);
      assert.strictEqual(result.phylum, undefined);
      assert.strictEqual(result.class, undefined);
      assert.strictEqual(result.float1, 0);
    });

    test('should handle crypto fallback', () => {
      const originalCrypto = global.crypto;
      delete global.crypto;
      delete global.window.crypto;

      DataCortex.init({
        api_key: 'test-key',
        org_name: 'test-org',
      });

      const deviceTag = DataCortex.getDeviceTag();
      assert.strictEqual(typeof deviceTag, 'string');
      assert.strictEqual(deviceTag.length, 32);

      global.crypto = originalCrypto;
      global.window.crypto = originalCrypto;
    });
  });
});
