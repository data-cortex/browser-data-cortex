// Import setup first to establish browser environment
import './setup.js';

import { test, describe, beforeEach, afterEach, mock } from 'node:test';
import assert from 'node:assert';

// Import the module after setting up globals
import DataCortex from '../src/index.js';

describe('DataCortex Library Tests', () => {
  let mockXHR;
  let xhrRequests = [];

  beforeEach(() => {
    // Clear localStorage
    global.localStorage.clear();

    // Reset global state
    DataCortex.init({
      api_key: process.env.DC_API_KEY || 'test-api-key',
      org_name: 'test-org',
      app_ver: '1.0.0',
    });

    // Mock XMLHttpRequest
    xhrRequests = [];
    mockXHR = mock.fn(() => {
      const xhr = {
        open: mock.fn(),
        send: mock.fn(),
        setRequestHeader: mock.fn(),
        status: 200,
        response: '{"success": true}',
        responseText: '{"success": true}',
        onload: null,
        onerror: null,
        ontimeout: null,
        timeout: 0,
      };

      // Simulate successful request by default
      setTimeout(() => {
        if (xhr.onload) {
          xhr.onload();
        }
      }, 0);

      xhrRequests.push(xhr);
      return xhr;
    });

    global.XMLHttpRequest = mockXHR;
  });

  afterEach(() => {
    // Clear any timeouts
    global.clearTimeout = global.clearTimeout || (() => {});
  });

  describe('Initialization', () => {
    test('should initialize with required parameters', () => {
      const opts = {
        api_key: 'test-key',
        org_name: 'test-org',
        app_ver: '1.0.0',
      };

      DataCortex.init(opts);
      assert.strictEqual(DataCortex.isReady(), true);
    });

    test('should initialize with optional parameters', () => {
      const opts = {
        api_key: 'test-key',
        org_name: 'test-org',
        app_ver: '1.0.0',
        base_url: 'https://custom-api.example.com',
        device_tag: 'custom-device-tag',
        add_error_handler: true,
      };

      DataCortex.init(opts);
      assert.strictEqual(DataCortex.isReady(), true);
      assert.strictEqual(DataCortex.getDeviceTag(), 'custom-device-tag');
    });

    test('should generate device tag if not provided', () => {
      const opts = {
        api_key: 'test-key',
        org_name: 'test-org',
      };

      DataCortex.init(opts);
      const deviceTag = DataCortex.getDeviceTag();
      assert.strictEqual(typeof deviceTag, 'string');
      assert.strictEqual(deviceTag.length, 32);
    });

    test('should add error handler when requested', () => {
      const originalAddEventListener = global.window.addEventListener;
      const addEventListenerMock = mock.fn();
      global.window.addEventListener = addEventListenerMock;

      DataCortex.init({
        api_key: 'test-key',
        org_name: 'test-org',
        add_error_handler: true,
      });

      assert.strictEqual(addEventListenerMock.mock.calls.length, 1);
      assert.strictEqual(
        addEventListenerMock.mock.calls[0].arguments[0],
        'error'
      );

      global.window.addEventListener = originalAddEventListener;
    });
  });

  describe('User Tag Management', () => {
    test('should add user tag', () => {
      DataCortex.addUserTag('user123');
      assert.strictEqual(
        global.localStorage.getItem('dc.user_tag'),
        '"user123"'
      );
    });

    test('should clear user tag when null', () => {
      DataCortex.addUserTag('user123');
      DataCortex.addUserTag(null);
      assert.strictEqual(global.localStorage.getItem('dc.user_tag'), null);
    });

    test('should convert user tag to string', () => {
      DataCortex.addUserTag(12345);
      assert.strictEqual(global.localStorage.getItem('dc.user_tag'), '"12345"');
    });
  });

  describe('Event Tracking', () => {
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

    test('should truncate long string properties to 64 characters', () => {
      const longString = 'a'.repeat(100);
      const result = DataCortex.event({
        group_tag: longString,
      });

      assert.strictEqual(result.group_tag.length, 64);
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

    test('should throw error for invalid props', () => {
      assert.throws(() => {
        DataCortex.economyEvent(null);
      }, /props must be an object/);
    });
  });

  describe('Message Send Event Tracking', () => {
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

    test('should combine to_tag and to_list', () => {
      const eventData = {
        from_tag: 'user1',
        to_tag: 'user2',
        to_list: ['user3', 'user4'],
        kingdom: 'message',
      };

      const result = DataCortex.messageSendEvent(eventData);

      assert.deepStrictEqual(result.to_list, ['user3', 'user4', 'user2']);
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

    test('should throw error for invalid to_list', () => {
      assert.throws(() => {
        DataCortex.messageSendEvent({
          from_tag: 'user1',
          to_list: 'invalid',
        });
      }, /to_list must be an array/);
    });

    test('should throw error for empty to_list', () => {
      assert.throws(() => {
        DataCortex.messageSendEvent({
          from_tag: 'user1',
          to_list: [],
        });
      }, /must have at least 1 in to_list or a to_tag/);
    });

    test('should throw error for invalid props', () => {
      assert.throws(() => {
        DataCortex.messageSendEvent(null);
      }, /props must be an object/);
    });
  });

  describe('Logging', () => {
    test('should log simple message', () => {
      const result = DataCortex.log('test message');

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

    test('should log error objects', () => {
      const error = new Error('test error');
      DataCortex.log('Error occurred:', error);

      const logList = JSON.parse(
        global.localStorage.getItem('dc.log_list') || '[]'
      );
      assert(logList[0].log_line.includes('Error occurred:'));
      assert(logList[0].log_line.includes(error.stack));
    });

    test('should throw error for no arguments', () => {
      assert.throws(() => {
        DataCortex.log();
      }, /log must have arguments/);
    });

    test('should handle circular references in objects', () => {
      const obj = { key: 'value' };
      obj.circular = obj;

      // Should not throw
      DataCortex.log('circular:', obj);

      const logList = JSON.parse(
        global.localStorage.getItem('dc.log_list') || '[]'
      );
      assert(logList[0].log_line.includes('circular:'));
    });
  });

  describe('Log Event Tracking', () => {
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

    test('should handle number conversion for log events', () => {
      const result = DataCortex.logEvent({
        log_line: 'test',
        repsonse_bytes: '1024',
        response_ms: 'invalid',
      });

      assert.strictEqual(result.repsonse_bytes, 1024);
      assert.strictEqual(result.response_ms, undefined);
    });
  });

  describe('Device Detection', () => {
    test('should detect browser information', () => {
      // This tests the _setupDefaultBundle function indirectly
      DataCortex.init({
        api_key: 'test-key',
        org_name: 'test-org',
      });

      // The device tag should be generated
      const deviceTag = DataCortex.getDeviceTag();
      assert.strictEqual(typeof deviceTag, 'string');
      assert.strictEqual(deviceTag.length, 32);
    });
  });

  describe('Network Requests', () => {
    test('should handle successful event sending', async () => {
      // Create an event to trigger sending
      DataCortex.event({ kingdom: 'test' });

      // Wait for async operations
      await new Promise((resolve) => setTimeout(resolve, 10));

      // Check that XHR was called
      assert(xhrRequests.length > 0);
      const xhr = xhrRequests[0];
      assert.strictEqual(xhr.open.mock.calls.length, 1);
      assert.strictEqual(xhr.send.mock.calls.length, 1);
    });

    test('should handle network errors', async () => {
      // Mock XHR to simulate error
      const errorXHR = mock.fn(() => {
        const xhr = {
          open: mock.fn(),
          send: mock.fn(),
          setRequestHeader: mock.fn(),
          status: 0,
          response: '',
          responseText: '',
          onload: null,
          onerror: null,
          ontimeout: null,
          timeout: 0,
        };

        setTimeout(() => {
          if (xhr.onerror) {
            xhr.onerror();
          }
        }, 0);

        xhrRequests.push(xhr);
        return xhr;
      });

      global.XMLHttpRequest = errorXHR;

      DataCortex.event({ kingdom: 'test' });

      await new Promise((resolve) => setTimeout(resolve, 10));

      assert(xhrRequests.length > 0);
    });

    test('should handle HTTP error status codes', async () => {
      // Mock XHR to simulate 400 error
      const errorXHR = mock.fn(() => {
        const xhr = {
          open: mock.fn(),
          send: mock.fn(),
          setRequestHeader: mock.fn(),
          status: 400,
          response: 'Bad Request',
          responseText: 'Bad Request',
          onload: null,
          onerror: null,
          ontimeout: null,
          timeout: 0,
        };

        setTimeout(() => {
          if (xhr.onload) {
            xhr.onload();
          }
        }, 0);

        xhrRequests.push(xhr);
        return xhr;
      });

      global.XMLHttpRequest = errorXHR;

      DataCortex.event({ kingdom: 'test' });

      await new Promise((resolve) => setTimeout(resolve, 10));

      assert(xhrRequests.length > 0);
    });

    test('should handle timeout errors', async () => {
      const timeoutXHR = mock.fn(() => {
        const xhr = {
          open: mock.fn(),
          send: mock.fn(),
          setRequestHeader: mock.fn(),
          status: 0,
          response: '',
          responseText: '',
          onload: null,
          onerror: null,
          ontimeout: null,
          timeout: 0,
        };

        setTimeout(() => {
          if (xhr.ontimeout) {
            xhr.ontimeout();
          }
        }, 0);

        xhrRequests.push(xhr);
        return xhr;
      });

      global.XMLHttpRequest = timeoutXHR;

      DataCortex.event({ kingdom: 'test' });

      await new Promise((resolve) => setTimeout(resolve, 10));

      assert(xhrRequests.length > 0);
    });
  });

  describe('Local Storage Integration', () => {
    test('should persist events in localStorage', () => {
      DataCortex.event({ kingdom: 'test' });

      const eventList = JSON.parse(
        global.localStorage.getItem('dc.event_list') || '[]'
      );
      assert.strictEqual(eventList.length, 1);
      assert.strictEqual(eventList[0].kingdom, 'test');
    });

    test('should persist user tag in localStorage', () => {
      DataCortex.addUserTag('user123');

      const userTag = JSON.parse(global.localStorage.getItem('dc.user_tag'));
      assert.strictEqual(userTag, 'user123');
    });

    test('should persist device tag in localStorage', () => {
      DataCortex.init({
        api_key: 'test-key',
        org_name: 'test-org',
        device_tag: 'custom-device',
      });

      const deviceTag = JSON.parse(
        global.localStorage.getItem('dc.device_tag')
      );
      assert.strictEqual(deviceTag, 'custom-device');
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

  describe('Automatic Events', () => {
    test('should send install event on first init', () => {
      // Clear install flag
      global.localStorage.removeItem('dc.has_sent_install');
      global.localStorage.removeItem('dc.last_dau_time');

      DataCortex.init({
        api_key: 'test-key',
        org_name: 'test-org',
      });

      const eventList = JSON.parse(
        global.localStorage.getItem('dc.event_list') || '[]'
      );
      const installEvent = eventList.find((e) => e.type === 'install');
      assert(installEvent);
      assert.strictEqual(installEvent.kingdom, 'organic');
    });

    test('should send DAU event daily', () => {
      // Set last DAU time to more than 24 hours ago
      const yesterday = Date.now() - 25 * 60 * 60 * 1000;
      global.localStorage.setItem('dc.last_dau_time', yesterday.toString());

      DataCortex.init({
        api_key: 'test-key',
        org_name: 'test-org',
      });

      const eventList = JSON.parse(
        global.localStorage.getItem('dc.event_list') || '[]'
      );
      const dauEvent = eventList.find((e) => e.type === 'dau');
      assert(dauEvent);
    });
  });

  describe('Error Handling', () => {
    test('should handle JavaScript errors when error handler is enabled', () => {
      const consoleSpy = mock.method(console, 'error');

      DataCortex.init({
        api_key: 'test-key',
        org_name: 'test-org',
        add_error_handler: true,
      });

      // Simulate error event
      const errorEvent = {
        message: 'Test error',
        error: new Error('Test error'),
      };

      global.window.dispatchEvent(
        new global.window.ErrorEvent('error', errorEvent)
      );

      // Check that log was created
      const logList = JSON.parse(
        global.localStorage.getItem('dc.log_list') || '[]'
      );
      const errorLog = logList.find((log) =>
        log.log_line.includes('Javascript Error')
      );
      assert(errorLog);

      consoleSpy.mock.restore();
    });
  });

  describe('Crypto Fallback', () => {
    test('should generate random string without crypto API', () => {
      const originalCrypto = global.crypto;
      delete global.crypto;

      DataCortex.init({
        api_key: 'test-key',
        org_name: 'test-org',
      });

      const deviceTag = DataCortex.getDeviceTag();
      assert.strictEqual(typeof deviceTag, 'string');
      assert.strictEqual(deviceTag.length, 32);

      global.crypto = originalCrypto;
    });
  });

  describe('Edge Cases', () => {
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

    test('should handle special status code 1223', async () => {
      const specialXHR = mock.fn(() => {
        const xhr = {
          open: mock.fn(),
          send: mock.fn(),
          setRequestHeader: mock.fn(),
          status: 1223,
          response: 'OK',
          responseText: 'OK',
          onload: null,
          onerror: null,
          ontimeout: null,
          timeout: 0,
        };

        setTimeout(() => {
          if (xhr.onload) {
            xhr.onload();
          }
        }, 0);

        xhrRequests.push(xhr);
        return xhr;
      });

      global.XMLHttpRequest = specialXHR;

      DataCortex.event({ kingdom: 'test' });

      await new Promise((resolve) => setTimeout(resolve, 10));

      assert(xhrRequests.length > 0);
    });

    test('should handle array headers in request', async () => {
      // This tests the _objectEach function with array values
      DataCortex.event({ kingdom: 'test' });

      await new Promise((resolve) => setTimeout(resolve, 10));

      assert(xhrRequests.length > 0);
    });
  });
});
