import { JSDOM } from 'jsdom';
import './crypto-shim';

// Set up a minimal browser environment with proper URL
const dom = new JSDOM('<!DOCTYPE html><html><body></body></html>', {
  url: 'https://localhost',
  pretendToBeVisual: true,
  resources: 'usable',
});

// Set up globals
(global as any).window = dom.window;
(global as any).document = dom.window.document;

// Create a simple localStorage mock that properly handles JSON
const localStorageMock = {
  store: {} as Record<string, string>,
  getItem(key: string): string | null {
    return this.store[key] || null;
  },
  setItem(key: string, value: string): void {
    this.store[key] = String(value);
  },
  removeItem(key: string): void {
    delete this.store[key];
  },
  clear(): void {
    this.store = {};
  },
  // Add support for accessing like an object (which the library does)
  get length(): number {
    return Object.keys(this.store).length;
  },
};

// Make it behave like a real localStorage with property access
const localStorageProxy = new Proxy(localStorageMock, {
  get(target: typeof localStorageMock, prop: string | symbol): any {
    if (prop in target) {
      return (target as any)[prop];
    }
    return target.getItem(prop as string);
  },
  set(
    target: typeof localStorageMock,
    prop: string | symbol,
    value: any
  ): boolean {
    if (prop in target) {
      (target as any)[prop] = value;
    } else {
      target.setItem(prop as string, value);
    }
    return true;
  },
  has(target: typeof localStorageMock, prop: string | symbol): boolean {
    return prop in target || target.getItem(prop as string) !== null;
  },
  deleteProperty(
    target: typeof localStorageMock,
    prop: string | symbol
  ): boolean {
    target.removeItem(prop as string);
    return true;
  },
});

(global as any).localStorage = localStorageProxy;

// Use defineProperty to override the window.localStorage getter
Object.defineProperty((global as any).window, 'localStorage', {
  value: localStorageProxy,
  writable: true,
  configurable: true,
});
(global as any).XMLHttpRequest = dom.window.XMLHttpRequest;

// Add fetch to global environment (using a simple implementation for testing)
(global as any).fetch =
  dom.window.fetch ||
  function (url: string, options?: any): Promise<any> {
    return Promise.resolve({
      status: 200,
      text: () => Promise.resolve('{}'),
    });
  };

// Mock navigator
const navigatorMock = {
  userAgent:
    'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
};

Object.defineProperty(global, 'navigator', {
  value: navigatorMock,
  writable: true,
  configurable: true,
});

// Crypto is now handled by crypto-shim.js

// Mock timers to prevent infinite loops
let timeoutId = 1;
let intervalId = 1;
const timeouts = new Map<number, any>();
const intervals = new Map<number, any>();

(global as any).setTimeout = (global as any).window.setTimeout = (
  fn: Function,
  delay: number
): number => {
  const id = timeoutId++;
  // Don't actually execute to prevent loops during testing
  return id;
};

(global as any).clearTimeout = (global as any).window.clearTimeout = (
  id: number
): void => {
  timeouts.delete(id);
};

(global as any).setInterval = (global as any).window.setInterval = (
  fn: Function,
  delay: number
): number => {
  const id = intervalId++;
  // Don't actually execute to prevent loops during testing
  return id;
};

(global as any).clearInterval = (global as any).window.clearInterval = (
  id: number
): void => {
  intervals.delete(id);
};

import DataCortex from '../dist/browser-data-cortex.min.js';

interface TestCase {
  name: string;
  fn: () => void | Promise<void>;
}

class TestRunner {
  private tests: TestCase[] = [];
  private passed = 0;
  private failed = 0;

  test(name: string, fn: () => void | Promise<void>): void {
    this.tests.push({ name, fn });
  }

  async run(): Promise<void> {
    console.log('Running DataCortex Tests...\n');

    for (const test of this.tests) {
      try {
        // Clear localStorage before each test
        localStorageProxy.clear();

        await test.fn();
        console.log(`✓ ${test.name}`);
        this.passed++;
      } catch (error: any) {
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
function assert(condition: any, message?: string): void {
  if (!condition) {
    throw new Error(message || 'Assertion failed');
  }
}

function assertEqual(actual: any, expected: any, message?: string): void {
  if (actual !== expected) {
    throw new Error(message || `Expected ${expected}, got ${actual}`);
  }
}

function assertThrows(fn: () => void, expectedMessage?: string): void {
  try {
    fn();
    throw new Error('Expected function to throw');
  } catch (error: any) {
    if (expectedMessage && !error.message.includes(expectedMessage)) {
      throw new Error(
        `Expected error message to contain "${expectedMessage}", got "${error.message}"`
      );
    }
  }
}

// Test cases
runner.test('should initialize with required parameters', () => {
  const opts = {
    api_key: process.env.DC_API_KEY,
    org_name: 'test-org',
    app_ver: '1.0.0',
  };

  DataCortex.init(opts);
  assertEqual(DataCortex.isReady(), true);
});

runner.test('should generate device tag', () => {
  const opts = {
    api_key: process.env.DC_API_KEY,
    org_name: 'test-org',
  };

  DataCortex.init(opts);
  const deviceTag = DataCortex.getDeviceTag();
  assertEqual(typeof deviceTag, 'string');
  assertEqual(deviceTag.length, 32);
});

runner.test('should add and manage user tags', () => {
  DataCortex.init({
    api_key: process.env.DC_API_KEY,
    org_name: 'test-org',
  });

  DataCortex.addUserTag('user123');
  assertEqual((global as any).localStorage.getItem('dc.user_tag'), '"user123"');

  DataCortex.addUserTag(null);
  assertEqual((global as any).localStorage.getItem('dc.user_tag'), null);
});

runner.test('should track basic event', () => {
  DataCortex.init({
    api_key: process.env.DC_API_KEY,
    org_name: 'test-org',
  });

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
  assertEqual(result, undefined);

  // Check that event was stored in localStorage
  const eventList = JSON.parse(
    (global as any).localStorage.getItem('dc.event_list') || '[]'
  );
  assert(eventList.length > 0, 'Event should be stored');

  const lastEvent = eventList[eventList.length - 1];
  assertEqual(lastEvent.type, 'event');
  assertEqual(lastEvent.kingdom, 'test-kingdom');
  assertEqual(lastEvent.float1, 123.45);
  assertEqual(typeof lastEvent.event_index, 'number');
  assertEqual(typeof lastEvent.event_datetime, 'string');
});

runner.test('should throw error for invalid event props', () => {
  DataCortex.init({
    api_key: process.env.DC_API_KEY,
    org_name: 'test-org',
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
    api_key: process.env.DC_API_KEY,
    org_name: 'test-org',
  });

  const longString = 'a'.repeat(50);
  const result = DataCortex.event({
    kingdom: longString,
  });

  // event() now returns void
  assertEqual(result, undefined);

  // Check that event was stored with truncated string
  const eventList = JSON.parse(
    (global as any).localStorage.getItem('dc.event_list') || '[]'
  );
  const lastEvent = eventList[eventList.length - 1];
  assertEqual(lastEvent.kingdom.length, 32);
});

runner.test('should handle number conversion', () => {
  DataCortex.init({
    api_key: process.env.DC_API_KEY,
    org_name: 'test-org',
  });

  const result = DataCortex.event({
    float1: '123.45',
    float2: 'invalid',
    float3: Infinity,
  });

  // event() now returns void
  assertEqual(result, undefined);

  // Check that event was stored with converted numbers
  const eventList = JSON.parse(
    (global as any).localStorage.getItem('dc.event_list') || '[]'
  );
  const lastEvent = eventList[eventList.length - 1];
  assertEqual(lastEvent.float1, 123.45);
  assertEqual(lastEvent.float2, undefined);
  assertEqual(lastEvent.float3, undefined);
});

// Run all tests
runner.run().catch(console.error);

export {
  runner,
  assert,
  assertEqual,
  assertThrows,
  DataCortex,
  localStorageProxy,
};
