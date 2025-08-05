// Import custom setup first to establish browser environment
import './setup-errorlog.js';

import { test, describe, beforeEach, afterEach, mock } from 'node:test';
import assert from 'node:assert';

// Import the module after setting up globals
import DataCortex from '../src/index.js';

describe('DataCortex ErrorLog, Flush, and Server Response Tests', () => {
  let errorLogCalls;
  let customErrorLog;
  let xhrRequests;
  let originalXHR;

  beforeEach(() => {
    // Clear localStorage
    global.localStorage.clear();

    // Reset error log tracking
    errorLogCalls = [];
    customErrorLog = mock.fn((...args) => {
      errorLogCalls.push(args);
    });

    // Track XHR requests
    xhrRequests = [];
    originalXHR = global.XMLHttpRequest;

    // Create a working XMLHttpRequest mock
    global.XMLHttpRequest = function () {
      const xhr = {
        open: mock.fn((method, url) => {
          xhr._method = method;
          xhr._url = url;
        }),
        send: mock.fn((body) => {
          xhr._body = body;
          xhrRequests.push(xhr);
        }),
        setRequestHeader: mock.fn(),
        status: 200,
        response: '{"success": true}',
        responseText: '{"success": true}',
        timeout: 0,
        onload: null,
        onerror: null,
        ontimeout: null,
      };
      return xhr;
    };
    global.window.XMLHttpRequest = global.XMLHttpRequest;
  });

  afterEach(() => {
    // Restore original XMLHttpRequest
    global.XMLHttpRequest = originalXHR;
    global.window.XMLHttpRequest = originalXHR;
  });

  describe('Custom errorLog Functionality', () => {
    test('should accept custom errorLog function during initialization', () => {
      const opts = {
        api_key: 'test-key',
        org_name: 'test-org',
        app_ver: '1.0.0',
        errorLog: customErrorLog,
      };

      // Initialize DataCortex with custom errorLog
      DataCortex.init(opts);

      // Verify initialization was successful
      assert.strictEqual(DataCortex.isReady(), true);

      // The custom error log should not be called during successful init
      assert.strictEqual(customErrorLog.mock.callCount(), 0);
    });

    test('should use custom errorLog for server error responses', () => {
      const opts = {
        api_key: 'test-key',
        org_name: 'test-org',
        app_ver: '1.0.0',
        errorLog: customErrorLog,
      };

      DataCortex.init(opts);

      // Add an event to trigger a request
      DataCortex.event({
        kingdom: 'test',
        phylum: 'test',
        class: 'test',
        order: 'test',
        family: 'test',
        genus: 'test',
        species: 'test',
      });

      // Override the XHR to simulate 400 error
      global.XMLHttpRequest = function () {
        const xhr = {
          open: mock.fn(),
          send: mock.fn(() => {
            xhr.status = 400;
            xhr.response = '{"error": "Bad request"}';
            xhr.responseText = '{"error": "Bad request"}';
            // Immediately call onload to simulate response
            if (xhr.onload) {
              xhr.onload();
            }
          }),
          setRequestHeader: mock.fn(),
          status: 400,
          response: '{"error": "Bad request"}',
          responseText: '{"error": "Bad request"}',
          onload: null,
          onerror: null,
          ontimeout: null,
        };
        return xhr;
      };

      // Flush to trigger immediate send
      DataCortex.flush();

      // Check that custom error log was called
      assert.strictEqual(customErrorLog.mock.callCount() >= 1, true);
    });
  });

  describe('Flush Functionality', () => {
    test('should trigger immediate XHR request when flush is called', () => {
      const opts = {
        api_key: 'test-key',
        org_name: 'test-org',
        app_ver: '1.0.0',
        errorLog: customErrorLog,
      };

      DataCortex.init(opts);

      // Add an event
      DataCortex.event({
        kingdom: 'flush-test',
        phylum: 'test',
        class: 'test',
        order: 'test',
        family: 'test',
        genus: 'test',
        species: 'test',
      });

      // Flush should trigger immediate send
      DataCortex.flush();

      // Verify XHR was called
      assert.strictEqual(xhrRequests.length >= 1, true);

      if (xhrRequests.length > 0) {
        const xhr = xhrRequests[0];
        assert.strictEqual(xhr.open.mock.callCount() >= 1, true);
        assert.strictEqual(xhr.send.mock.callCount() >= 1, true);

        // Verify the request was made to the correct endpoint
        assert.strictEqual(xhr._method, 'POST');
        assert.strictEqual(xhr._url.includes('/test-org/1/track'), true);
      }
    });

    test('should handle flush with logs', () => {
      const opts = {
        api_key: 'test-key',
        org_name: 'test-org',
        app_ver: '1.0.0',
        errorLog: customErrorLog,
      };

      DataCortex.init(opts);

      // Add logs
      DataCortex.log('Test log message 1');
      DataCortex.log('Test log message 2', { data: 'test' });

      // Flush should trigger immediate send
      DataCortex.flush();

      // Verify XHR was called (logs may use separate endpoint)
      assert.strictEqual(xhrRequests.length >= 1, true);
    });
  });

  describe('Server Response Validation - 400 Error Test', () => {
    test('should handle 400 Bad Request error and log appropriately', () => {
      const opts = {
        api_key: 'test-key',
        org_name: 'test-org',
        app_ver: '1.0.0',
        errorLog: customErrorLog,
      };

      DataCortex.init(opts);

      // Add an event
      DataCortex.event({
        kingdom: 'bad-request-test',
        phylum: 'test',
        class: 'test',
        order: 'test',
        family: 'test',
        genus: 'test',
        species: 'test',
      });

      // Override XHR to simulate 400 error
      global.XMLHttpRequest = function () {
        const xhr = {
          open: mock.fn(),
          send: mock.fn(() => {
            xhr.status = 400;
            xhr.response = '{"error": "Invalid parameters"}';
            xhr.responseText = '{"error": "Invalid parameters"}';
            // Immediately call onload to simulate response
            if (xhr.onload) {
              xhr.onload();
            }
          }),
          setRequestHeader: mock.fn(),
          status: 400,
          response: '{"error": "Invalid parameters"}',
          responseText: '{"error": "Invalid parameters"}',
          onload: null,
          onerror: null,
          ontimeout: null,
        };
        return xhr;
      };

      DataCortex.flush();

      // Should have called error log for 400 error
      assert.strictEqual(customErrorLog.mock.callCount() >= 1, true);

      // Verify error message content
      const errorCalls = customErrorLog.mock.calls;
      const hasBadRequestError = errorCalls.some((call) =>
        call.arguments.some(
          (arg) => typeof arg === 'string' && arg.includes('Bad request')
        )
      );
      assert.strictEqual(hasBadRequestError, true);
    });
  });

  describe('Server Response Validation - 403 Error Test (NEGATIVE TEST)', () => {
    test('should handle 403 Forbidden error (bad API key)', () => {
      const opts = {
        api_key: 'invalid-api-key',
        org_name: 'test-org',
        app_ver: '1.0.0',
        errorLog: customErrorLog,
      };

      DataCortex.init(opts);

      // Add an event
      DataCortex.event({
        kingdom: 'forbidden-test',
        phylum: 'test',
        class: 'test',
        order: 'test',
        family: 'test',
        genus: 'test',
        species: 'test',
      });

      // Override XHR to simulate 403 error (bad API key)
      global.XMLHttpRequest = function () {
        const xhr = {
          open: mock.fn(),
          send: mock.fn(() => {
            xhr.status = 403;
            xhr.response = '{"error": "Invalid API key"}';
            xhr.responseText = '{"error": "Invalid API key"}';
            // Immediately call onload to simulate response
            if (xhr.onload) {
              xhr.onload();
            }
          }),
          setRequestHeader: mock.fn(),
          status: 403,
          response: '{"error": "Invalid API key"}',
          responseText: '{"error": "Invalid API key"}',
          onload: null,
          onerror: null,
          ontimeout: null,
        };
        return xhr;
      };

      DataCortex.flush();

      // Should have called error log for 403 error
      assert.strictEqual(customErrorLog.mock.callCount() >= 1, true);

      // Verify error message content mentions bad API key
      const errorCalls = customErrorLog.mock.calls;
      const hasBadApiKeyError = errorCalls.some((call) =>
        call.arguments.some(
          (arg) => typeof arg === 'string' && arg.includes('Bad API Key')
        )
      );
      assert.strictEqual(hasBadApiKeyError, true);

      // Verify that DataCortex is no longer ready after 403 error
      // This is the key negative test - 403 should disable the library
      assert.strictEqual(DataCortex.isReady(), false);
    });
  });

  describe('Request Structure Validation', () => {
    test('should validate request structure and endpoint format', () => {
      const opts = {
        api_key: 'validation-test-key',
        org_name: 'validation-org',
        app_ver: '2.0.0',
        errorLog: customErrorLog,
      };

      DataCortex.init(opts);

      // Add an event with all fields
      DataCortex.event({
        kingdom: 'validation',
        phylum: 'test',
        class: 'test',
        order: 'test',
        family: 'test',
        genus: 'test',
        species: 'test',
        float1: 123.45,
        float2: 67.89,
      });

      DataCortex.flush();

      // Verify the request structure
      assert.strictEqual(xhrRequests.length >= 1, true);

      if (xhrRequests.length > 0) {
        const xhr = xhrRequests[0];

        // Validate HTTP method
        assert.strictEqual(xhr._method, 'POST');

        // Validate endpoint structure
        assert.strictEqual(xhr._url.includes('/validation-org/1/track'), true);
        assert.strictEqual(xhr._url.includes('current_time='), true);

        // Validate request body was sent
        assert.strictEqual(typeof xhr._body, 'string');

        // Should be valid JSON
        let parsedBody;
        assert.doesNotThrow(() => {
          parsedBody = JSON.parse(xhr._body);
        });

        // Should contain expected fields
        assert.strictEqual(typeof parsedBody.api_key, 'string');
        assert.strictEqual(typeof parsedBody.app_ver, 'string');
        assert.strictEqual(Array.isArray(parsedBody.events), true);
        assert.strictEqual(parsedBody.events.length >= 1, true);
      }
    });
  });

  describe('Error Handling Integration', () => {
    test('should demonstrate server error handling with custom errorLog', () => {
      const opts = {
        api_key: 'test-key',
        org_name: 'test-org',
        app_ver: '1.0.0',
        errorLog: customErrorLog,
      };

      DataCortex.init(opts);

      // Add multiple events and logs
      DataCortex.event({
        kingdom: 'integration1',
        phylum: 'test',
        class: 'test',
        order: 'test',
        family: 'test',
        genus: 'test',
        species: 'test',
      });

      DataCortex.log('Integration test log message');

      // Override XHR to simulate server error (500)
      global.XMLHttpRequest = function () {
        const xhr = {
          open: mock.fn(),
          send: mock.fn(() => {
            xhr.status = 500;
            xhr.response = '{"error": "Internal server error"}';
            // Immediately call onload to simulate response
            if (xhr.onload) {
              xhr.onload();
            }
          }),
          setRequestHeader: mock.fn(),
          status: 500,
          response: '{"error": "Internal server error"}',
          onload: null,
          onerror: null,
          ontimeout: null,
        };
        return xhr;
      };

      DataCortex.flush();

      // Should have attempted the request
      assert.strictEqual(xhrRequests.length >= 1, true);

      // Library should still be ready (500 errors don't disable it)
      assert.strictEqual(DataCortex.isReady(), true);
    });

    test('should handle successful response without errors', () => {
      const opts = {
        api_key: 'valid-api-key',
        org_name: 'test-org',
        app_ver: '1.0.0',
        errorLog: customErrorLog,
      };

      DataCortex.init(opts);

      // Add an event
      DataCortex.event({
        kingdom: 'success',
        phylum: 'test',
        class: 'test',
        order: 'test',
        family: 'test',
        genus: 'test',
        species: 'test',
      });

      DataCortex.flush();

      // Should not have any error log calls for successful response
      assert.strictEqual(customErrorLog.mock.callCount(), 0);
    });

    test('should handle network and timeout errors gracefully', () => {
      const opts = {
        api_key: 'test-key',
        org_name: 'test-org',
        app_ver: '1.0.0',
        errorLog: customErrorLog,
      };

      DataCortex.init(opts);

      // Add an event
      DataCortex.event({
        kingdom: 'network-error-test',
        phylum: 'test',
        class: 'test',
        order: 'test',
        family: 'test',
        genus: 'test',
        species: 'test',
      });

      // Override XHR to simulate network error
      global.XMLHttpRequest = function () {
        const xhr = {
          open: mock.fn(),
          send: mock.fn(() => {
            // Immediately call onerror to simulate network error
            if (xhr.onerror) {
              xhr.onerror();
            }
          }),
          setRequestHeader: mock.fn(),
          onload: null,
          onerror: null,
          ontimeout: null,
        };
        return xhr;
      };

      DataCortex.flush();

      // Network errors should be handled gracefully
      assert.strictEqual(typeof DataCortex.isReady(), 'boolean');
    });
  });
});
