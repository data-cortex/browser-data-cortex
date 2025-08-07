
import { JSDOM } from 'jsdom';
import './crypto-shim.js';

const userAgent = process.argv[2];
const expectedJson = process.argv[3];
const expected = JSON.parse(expectedJson);

// Set up complete browser environment
const dom = new JSDOM('<!DOCTYPE html><html><body></body></html>', {
  url: 'https://localhost',
  pretendToBeVisual: true,
  resources: 'usable',
});

global.window = dom.window;
global.document = dom.window.document;

// Manually set the userAgent
Object.defineProperty(dom.window.navigator, 'userAgent', {
  value: userAgent,
  writable: true,
  configurable: true
});

Object.defineProperty(global, 'navigator', {
  value: dom.window.navigator,
  writable: true,
  configurable: true
});

// Set up localStorage mock
const localStorageMock = {
  store: {},
  getItem(key) { return this.store[key] || null; },
  setItem(key, value) { this.store[key] = String(value); },
  removeItem(key) { delete this.store[key]; },
  clear() { this.store = {}; },
  get length() { return Object.keys(this.store).length; }
};

global.localStorage = localStorageMock;
Object.defineProperty(global.window, 'localStorage', {
  value: localStorageMock,
  writable: true,
  configurable: true,
});

// Mock timers
let timeoutId = 1;
const timeouts = new Map();
global.setTimeout = function (fn, delay) {
  const id = timeoutId++;
  timeouts.set(id, { fn, delay });
  return id;
};
global.clearTimeout = function (id) { timeouts.delete(id); };

// Mock fetch to capture data
let capturedData = null;
global.fetch = async (url, options) => {
  if (options && options.body) {
    try {
      capturedData = JSON.parse(options.body);
    } catch (e) {
      capturedData = options.body;
    }
  }
  return Promise.resolve({
    ok: true,
    status: 200,
    json: () => Promise.resolve({ success: true })
  });
};

// Import and initialize DataCortex
import '../dist/browser-data-cortex.min.js';
const DataCortex = global.DataCortex;

console.log('DEBUG: navigator.userAgent =', navigator.userAgent);
console.log('DEBUG: DataCortex available =', typeof DataCortex);

DataCortex.init({
  api_key: 'test-key-1234567890123456789012345678',
  org_name: 'test-org'
});

console.log('DEBUG: DataCortex ready =', DataCortex.isReady());

// Create a test event and flush
DataCortex.event({
  kingdom: 'test',
  phylum: 'ua_parsing'
});

DataCortex.flush();

// Wait for async operations
await new Promise(resolve => setTimeout(resolve, 100));

console.log('DEBUG: capturedData =', capturedData ? 'captured' : 'null');

// Extract results
const results = {
  os: capturedData?.os || 'unknown',
  os_ver: capturedData?.os_ver || 'unknown',
  browser: capturedData?.browser || 'unknown',
  browser_ver: capturedData?.browser_ver || 'unknown',
  device_type: capturedData?.device_type || 'unknown',
  device_family: capturedData?.device_family || 'unknown'
};

// Output results for parent process
console.log('RESULTS:', JSON.stringify({
  userAgent,
  expected,
  actual: results,
  capturedData: capturedData ? 'yes' : 'no'
}));

// Check if results match
let allMatch = true;
for (const [key, expectedValue] of Object.entries(expected)) {
  if (results[key] !== expectedValue) {
    console.error('MISMATCH: ' + key + ' Expected: ' + expectedValue + ', Actual: ' + results[key]);
    allMatch = false;
  }
}

process.exit(allMatch ? 0 : 1);
