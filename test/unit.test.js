import { JSDOM } from 'jsdom';

// Set up a minimal browser environment with proper URL
const dom = new JSDOM('<!DOCTYPE html><html><body></body></html>', {
  url: 'https://localhost',
  pretendToBeVisual: true,
  resources: 'usable'
});

// Set up globals
global.window = dom.window;
global.document = dom.window.document;

// Create a simple localStorage mock that properly handles JSON
const localStorageMock = {
  store: {},
  getItem(key) {
    return this.store[key] || null;
  },
  setItem(key, value) {
    this.store[key] = String(value);
  },
  removeItem(key) {
    delete this.store[key];
  },
  clear() {
    this.store = {};
  },
  // Add support for accessing like an object (which the library does)
  get length() {
    return Object.keys(this.store).length;
  }
};

// Make it behave like a real localStorage with property access
const localStorageProxy = new Proxy(localStorageMock, {
  get(target, prop) {
    if (prop in target) {
      return target[prop];
    }
    return target.getItem(prop);
  },
  set(target, prop, value) {
    if (prop in target) {
      target[prop] = value;
    } else {
      target.setItem(prop, value);
    }
    return true;
  },
  has(target, prop) {
    return prop in target || target.getItem(prop) !== null;
  },
  deleteProperty(target, prop) {
    target.removeItem(prop);
    return true;
  }
});

global.localStorage = localStorageProxy;

// Use defineProperty to override the window.localStorage getter
Object.defineProperty(global.window, 'localStorage', {
  value: localStorageProxy,
  writable: true,
  configurable: true
});
global.XMLHttpRequest = dom.window.XMLHttpRequest;

// Mock navigator
const navigatorMock = {
  userAgent: 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
};

Object.defineProperty(global, 'navigator', {
  value: navigatorMock,
  writable: true,
  configurable: true
});

// Mock crypto
const cryptoMock = {
  getRandomValues: (array) => {
    for (let i = 0; i < array.length; i++) {
      array[i] = Math.floor(Math.random() * 0xFFFFFFFF);
    }
    return array;
  }
};

Object.defineProperty(global, 'crypto', {
  value: cryptoMock,
  writable: true,
  configurable: true
});

Object.defineProperty(global.window, 'crypto', {
  value: cryptoMock,
  writable: true,
  configurable: true
});

// Mock timers to prevent infinite loops
let timeoutId = 1;
let intervalId = 1;
const timeouts = new Map();
const intervals = new Map();

global.setTimeout = global.window.setTimeout = (fn, delay) => {
  const id = timeoutId++;
  // Don't actually execute to prevent loops during testing
  return id;
};

global.clearTimeout = global.window.clearTimeout = (id) => {
  timeouts.delete(id);
};

global.setInterval = global.window.setInterval = (fn, delay) => {
  const id = intervalId++;
  // Don't actually execute to prevent loops during testing
  return id;
};

global.clearInterval = global.window.clearInterval = (id) => {
  intervals.delete(id);
};

// Now import the DataCortex module
import DataCortex from '../src/index.js';

// Simple test runner
class TestRunner {
  constructor() {
    this.tests = [];
    this.passed = 0;
    this.failed = 0;
  }

  test(name, fn) {
    this.tests.push({ name, fn });
  }

  async run() {
    console.log('Running DataCortex Tests...\n');
    
    for (const test of this.tests) {
      try {
        // Clear localStorage before each test
        localStorageProxy.clear();
        
        await test.fn();
        console.log(`✓ ${test.name}`);
        this.passed++;
      } catch (error) {
        console.log(`✗ ${test.name}`);
        console.log(`  Error: ${error.message}`);
        this.failed++;
      }
    }
    
    console.log(`\nResults: ${this.passed} passed, ${this.failed} failed`);
    
    if (this.failed > 0) {
      process.exit(1);
    }
  }
}

const runner = new TestRunner();

// Helper function for assertions
function assert(condition, message) {
  if (!condition) {
    throw new Error(message || 'Assertion failed');
  }
}

function assertEqual(actual, expected, message) {
  if (actual !== expected) {
    throw new Error(message || `Expected ${expected}, got ${actual}`);
  }
}

function assertThrows(fn, expectedMessage) {
  try {
    fn();
    throw new Error('Expected function to throw');
  } catch (error) {
    if (expectedMessage && !error.message.includes(expectedMessage)) {
      throw new Error(`Expected error message to contain "${expectedMessage}", got "${error.message}"`);
    }
  }
}

// Test cases
runner.test('should initialize with required parameters', () => {
  const opts = {
    api_key: process.env.DC_API_KEY || 'test-key',
    org_name: 'test-org',
    app_ver: '1.0.0'
  };
  
  DataCortex.init(opts);
  assertEqual(DataCortex.isReady(), true);
});

runner.test('should generate device tag', () => {
  const opts = {
    api_key: 'test-key',
    org_name: 'test-org'
  };
  
  DataCortex.init(opts);
  const deviceTag = DataCortex.getDeviceTag();
  assertEqual(typeof deviceTag, 'string');
  assertEqual(deviceTag.length, 32);
});

runner.test('should add and manage user tags', () => {
  DataCortex.init({
    api_key: 'test-key',
    org_name: 'test-org'
  });
  
  DataCortex.addUserTag('user123');
  assertEqual(global.localStorage.getItem('dc.user_tag'), '"user123"');
  
  DataCortex.addUserTag(null);
  assertEqual(global.localStorage.getItem('dc.user_tag'), null);
});

runner.test('should track basic event', () => {
  DataCortex.init({
    api_key: 'test-key',
    org_name: 'test-org'
  });
  
  const eventData = {
    kingdom: 'test-kingdom',
    phylum: 'test-phylum',
    class: 'test-class',
    order: 'test-order',
    family: 'test-family',
    genus: 'test-genus',
    species: 'test-species',
    float1: 123.45
  };
  
  const result = DataCortex.event(eventData);
  
  assertEqual(result.type, 'event');
  assertEqual(result.kingdom, 'test-kingdom');
  assertEqual(result.float1, 123.45);
  assertEqual(typeof result.event_index, 'number');
  assertEqual(typeof result.event_datetime, 'string');
});

runner.test('should throw error for invalid event props', () => {
  DataCortex.init({
    api_key: 'test-key',
    org_name: 'test-org'
  });
  
  assertThrows(() => {
    DataCortex.event(null);
  }, 'props must be an object');
  
  assertThrows(() => {
    DataCortex.event('invalid');
  }, 'props must be an object');
});

runner.test('should truncate string properties to 32 characters', () => {
  DataCortex.init({
    api_key: 'test-key',
    org_name: 'test-org'
  });
  
  const longString = 'a'.repeat(50);
  const result = DataCortex.event({
    kingdom: longString
  });
  
  assertEqual(result.kingdom.length, 32);
});

runner.test('should handle number conversion', () => {
  DataCortex.init({
    api_key: 'test-key',
    org_name: 'test-org'
  });
  
  const result = DataCortex.event({
    float1: '123.45',
    float2: 'invalid',
    float3: Infinity
  });
  
  assertEqual(result.float1, 123.45);
  assertEqual(result.float2, undefined);
  assertEqual(result.float3, undefined);
});

runner.test('should track economy event', () => {
  DataCortex.init({
    api_key: 'test-key',
    org_name: 'test-org'
  });
  
  const eventData = {
    spend_currency: 'USD',
    spend_amount: 9.99,
    spend_type: 'purchase',
    kingdom: 'economy',
    phylum: 'purchase'
  };
  
  const result = DataCortex.economyEvent(eventData);
  
  assertEqual(result.type, 'economy');
  assertEqual(result.spend_currency, 'USD');
  assertEqual(result.spend_amount, 9.99);
  assertEqual(result.spend_type, 'purchase');
});

runner.test('should throw error for missing spend_currency', () => {
  DataCortex.init({
    api_key: 'test-key',
    org_name: 'test-org'
  });
  
  assertThrows(() => {
    DataCortex.economyEvent({
      spend_amount: 9.99
    });
  }, 'spend_currency is required');
});

runner.test('should throw error for missing spend_amount', () => {
  DataCortex.init({
    api_key: 'test-key',
    org_name: 'test-org'
  });
  
  assertThrows(() => {
    DataCortex.economyEvent({
      spend_currency: 'USD'
    });
  }, 'spend_amount is required');
});

runner.test('should track message send event with to_tag', () => {
  DataCortex.init({
    api_key: 'test-key',
    org_name: 'test-org'
  });
  
  const eventData = {
    from_tag: 'user1',
    to_tag: 'user2',
    kingdom: 'message'
  };
  
  const result = DataCortex.messageSendEvent(eventData);
  
  assertEqual(result.type, 'message_send');
  assertEqual(result.from_tag, 'user1');
  assert(Array.isArray(result.to_list));
  assertEqual(result.to_list[0], 'user2');
});

runner.test('should track message send event with to_list', () => {
  DataCortex.init({
    api_key: 'test-key',
    org_name: 'test-org'
  });
  
  const eventData = {
    from_tag: 'user1',
    to_list: ['user2', 'user3'],
    kingdom: 'message'
  };
  
  const result = DataCortex.messageSendEvent(eventData);
  
  assertEqual(result.type, 'message_send');
  assertEqual(result.to_list.length, 2);
  assertEqual(result.to_list[0], 'user2');
  assertEqual(result.to_list[1], 'user3');
});

runner.test('should throw error for missing from_tag', () => {
  DataCortex.init({
    api_key: 'test-key',
    org_name: 'test-org'
  });
  
  assertThrows(() => {
    DataCortex.messageSendEvent({
      to_tag: 'user2'
    });
  }, 'from_tag is required');
});

runner.test('should log simple message', () => {
  DataCortex.init({
    api_key: 'test-key',
    org_name: 'test-org'
  });
  
  DataCortex.log('test message');
  
  // Check that log was stored
  const logList = JSON.parse(global.localStorage.getItem('dc.log_list') || '[]');
  assertEqual(logList.length, 1);
  assertEqual(logList[0].log_line, 'test message');
});

runner.test('should log multiple arguments', () => {
  DataCortex.init({
    api_key: 'test-key',
    org_name: 'test-org'
  });
  
  DataCortex.log('message', 123, { key: 'value' });
  
  const logList = JSON.parse(global.localStorage.getItem('dc.log_list') || '[]');
  assertEqual(logList[0].log_line, 'message 123 {"key":"value"}');
});

runner.test('should throw error for no log arguments', () => {
  DataCortex.init({
    api_key: 'test-key',
    org_name: 'test-org'
  });
  
  assertThrows(() => {
    DataCortex.log();
  }, 'log must have arguments');
});

runner.test('should track log event', () => {
  DataCortex.init({
    api_key: 'test-key',
    org_name: 'test-org'
  });
  
  const logData = {
    log_line: 'test log message',
    log_level: 'info',
    hostname: 'example.com'
  };
  
  const result = DataCortex.logEvent(logData);
  
  assertEqual(result.log_line, 'test log message');
  assertEqual(result.log_level, 'info');
  assertEqual(result.hostname, 'example.com');
  assertEqual(typeof result.event_datetime, 'string');
});

runner.test('should truncate log string properties according to limits', () => {
  DataCortex.init({
    api_key: 'test-key',
    org_name: 'test-org'
  });
  
  const longString = 'a'.repeat(1000);
  const result = DataCortex.logEvent({
    hostname: longString,
    log_line: longString
  });
  
  assertEqual(result.hostname.length, 64);
  assertEqual(result.log_line.length, 1000); // log_line has higher limit
});

runner.test('should persist events in localStorage', () => {
  DataCortex.init({
    api_key: 'test-key',
    org_name: 'test-org'
  });
  
  const initialEventCount = JSON.parse(global.localStorage.getItem('dc.event_list') || '[]').length;
  
  DataCortex.event({ kingdom: 'test' });
  
  const eventList = JSON.parse(global.localStorage.getItem('dc.event_list') || '[]');
  assertEqual(eventList.length, initialEventCount + 1);
  
  // Find our test event
  const testEvent = eventList.find(e => e.kingdom === 'test');
  assert(testEvent, 'Test event should be found');
  assertEqual(testEvent.kingdom, 'test');
});

runner.test('should persist user tag in localStorage', () => {
  DataCortex.init({
    api_key: 'test-key',
    org_name: 'test-org'
  });
  
  DataCortex.addUserTag('user123');
  
  const userTag = JSON.parse(global.localStorage.getItem('dc.user_tag'));
  assertEqual(userTag, 'user123');
});

runner.test('should restore state from localStorage on init', () => {
  // Pre-populate localStorage
  global.localStorage.setItem('dc.user_tag', '"restored-user"');
  global.localStorage.setItem('dc.event_list', '[{"kingdom":"restored","event_index":5}]');
  global.localStorage.setItem('dc.next_index', '6');
  global.localStorage.setItem('dc.has_sent_install', 'true'); // Prevent install event
  global.localStorage.setItem('dc.last_dau_time', String(Date.now())); // Prevent DAU event
  
  DataCortex.init({
    api_key: 'test-key',
    org_name: 'test-org'
  });
  
  // Add new event to test index continuation
  const result = DataCortex.event({ kingdom: 'new' });
  assertEqual(result.event_index, 6);
});

runner.test('should handle empty string properties', () => {
  DataCortex.init({
    api_key: 'test-key',
    org_name: 'test-org'
  });
  
  const result = DataCortex.event({
    kingdom: '',
    phylum: null,
    class: undefined,
    float1: 0
  });
  
  assertEqual(result.kingdom, undefined);
  assertEqual(result.phylum, undefined);
  assertEqual(result.class, undefined);
  assertEqual(result.float1, 0);
});

runner.test('should handle crypto fallback', () => {
  const originalCrypto = global.crypto;
  const originalWindowCrypto = global.window.crypto;
  
  delete global.crypto;
  delete global.window.crypto;
  
  DataCortex.init({
    api_key: 'test-key',
    org_name: 'test-org'
  });
  
  const deviceTag = DataCortex.getDeviceTag();
  assertEqual(typeof deviceTag, 'string');
  assertEqual(deviceTag.length, 32);
  
  // Restore crypto
  global.crypto = originalCrypto;
  global.window.crypto = originalWindowCrypto;
});

runner.test('should initialize with custom device tag', () => {
  DataCortex.init({
    api_key: 'test-key',
    org_name: 'test-org',
    device_tag: 'custom-device-tag'
  });
  
  assertEqual(DataCortex.getDeviceTag(), 'custom-device-tag');
});

runner.test('should handle long string properties (64 char limit)', () => {
  DataCortex.init({
    api_key: 'test-key',
    org_name: 'test-org'
  });
  
  const longString = 'a'.repeat(100);
  const result = DataCortex.event({
    from_tag: longString  // from_tag has 64-char limit, not group_tag
  });
  
  assertEqual(result.from_tag.length, 64);
});

runner.test('should handle invalid economy event props', () => {
  DataCortex.init({
    api_key: 'test-key',
    org_name: 'test-org'
  });
  
  assertThrows(() => {
    DataCortex.economyEvent(null);
  }, 'props must be an object');
});

runner.test('should handle invalid message send event props', () => {
  DataCortex.init({
    api_key: 'test-key',
    org_name: 'test-org'
  });
  
  assertThrows(() => {
    DataCortex.messageSendEvent(null);
  }, 'props must be an object');
});

runner.test('should throw error for invalid to_list in message send event', () => {
  DataCortex.init({
    api_key: 'test-key',
    org_name: 'test-org'
  });
  
  assertThrows(() => {
    DataCortex.messageSendEvent({
      from_tag: 'user1',
      to_list: 'invalid'
    });
  }, 'to_list must be an array');
});

runner.test('should throw error for empty to_list in message send event', () => {
  DataCortex.init({
    api_key: 'test-key',
    org_name: 'test-org'
  });
  
  assertThrows(() => {
    DataCortex.messageSendEvent({
      from_tag: 'user1',
      to_list: []
    });
  }, 'must have at least 1 in to_list or a to_tag');
});

runner.test('should combine to_tag and to_list in message send event', () => {
  DataCortex.init({
    api_key: 'test-key',
    org_name: 'test-org'
  });
  
  const eventData = {
    from_tag: 'user1',
    to_tag: 'user2',
    to_list: ['user3', 'user4'],
    kingdom: 'message'
  };
  
  const result = DataCortex.messageSendEvent(eventData);
  
  assertEqual(result.type, 'message_send');
  assertEqual(result.to_list.length, 3);
  assert(result.to_list.includes('user2'));
  assert(result.to_list.includes('user3'));
  assert(result.to_list.includes('user4'));
});

runner.test('should throw error for invalid logEvent props', () => {
  DataCortex.init({
    api_key: 'test-key',
    org_name: 'test-org'
  });
  
  assertThrows(() => {
    DataCortex.logEvent(null);
  }, 'props must be an object');
});

runner.test('should handle log with error objects', () => {
  DataCortex.init({
    api_key: 'test-key',
    org_name: 'test-org'
  });
  
  const error = new Error('test error');
  DataCortex.log('Error occurred:', error);
  
  const logList = JSON.parse(global.localStorage.getItem('dc.log_list') || '[]');
  assert(logList[0].log_line.includes('Error occurred:'));
  assert(logList[0].log_line.includes(error.stack));
});

runner.test('should handle circular references in log objects', () => {
  DataCortex.init({
    api_key: 'test-key',
    org_name: 'test-org'
  });
  
  const obj = { key: 'value' };
  obj.circular = obj;
  
  // Should not throw
  DataCortex.log('circular:', obj);
  
  const logList = JSON.parse(global.localStorage.getItem('dc.log_list') || '[]');
  assert(logList[0].log_line.includes('circular:'));
});

runner.test('should handle number conversion in log events', () => {
  DataCortex.init({
    api_key: 'test-key',
    org_name: 'test-org'
  });
  
  const result = DataCortex.logEvent({
    log_line: 'test',
    repsonse_bytes: '1024',
    response_ms: 'invalid'
  });
  
  assertEqual(result.repsonse_bytes, 1024);
  assertEqual(result.response_ms, undefined);
});

runner.test('should initialize with custom base URL', () => {
  DataCortex.init({
    api_key: 'test-key',
    org_name: 'test-org',
    base_url: 'https://custom-api.example.com'
  });
  
  assertEqual(DataCortex.isReady(), true);
});

runner.test('should convert user tag to string', () => {
  DataCortex.init({
    api_key: 'test-key',
    org_name: 'test-org'
  });
  
  DataCortex.addUserTag(12345);
  assertEqual(global.localStorage.getItem('dc.user_tag'), '"12345"');
});

runner.test('should handle automatic install event', () => {
  // Clear install flag to trigger install event
  global.localStorage.removeItem('dc.has_sent_install');
  global.localStorage.removeItem('dc.last_dau_time');
  
  DataCortex.init({
    api_key: 'test-key',
    org_name: 'test-org'
  });
  
  const eventList = JSON.parse(global.localStorage.getItem('dc.event_list') || '[]');
  const installEvent = eventList.find(e => e.type === 'install');
  assert(installEvent, 'Install event should be created');
  assertEqual(installEvent.kingdom, 'organic');
});

// Run all tests
runner.run().catch(console.error);
