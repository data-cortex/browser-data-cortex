import { JSDOM } from 'jsdom';

// Create a comprehensive browser environment
const dom = new JSDOM('<!DOCTYPE html><html><body></body></html>', {
  url: 'https://example.com',
  pretendToBeVisual: true,
  resources: 'usable',
});

// Set up all the globals that the DataCortex library expects
global.window = dom.window;
global.document = dom.window.document;
global.localStorage = dom.window.localStorage;

// Set XMLHttpRequest from JSDOM
global.XMLHttpRequest = dom.window.XMLHttpRequest;
global.window.XMLHttpRequest = dom.window.XMLHttpRequest;

// Handle navigator carefully since it might be read-only
if (!global.navigator) {
  global.navigator = dom.window.navigator;
} else {
  // Copy properties from JSDOM navigator to existing navigator
  Object.assign(global.navigator, dom.window.navigator);
}

// Mock crypto API - handle read-only property
const mockCrypto = {
  getRandomValues: (array) => {
    for (let i = 0; i < array.length; i++) {
      array[i] = Math.floor(Math.random() * 0xffffffff);
    }
    return array;
  },
};

// Try to set global.crypto, if it fails, define it as a property
try {
  global.crypto = mockCrypto;
} catch (e) {
  Object.defineProperty(global, 'crypto', {
    value: mockCrypto,
    writable: true,
    configurable: true,
  });
}

// Set up window.crypto as well
try {
  global.window.crypto = mockCrypto;
} catch (e) {
  Object.defineProperty(global.window, 'crypto', {
    value: mockCrypto,
    writable: true,
    configurable: true,
  });
}

// Mock user agent for device detection
Object.defineProperty(global.navigator, 'userAgent', {
  value:
    'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  writable: true,
  configurable: true,
});

// Override timer functions to prevent infinite recursion
// Store original functions
const originalSetTimeout = global.window.setTimeout;
const originalClearTimeout = global.window.clearTimeout;
const originalSetInterval = global.window.setInterval;
const originalClearInterval = global.window.clearInterval;

// Create simple mock timers that don't execute
global.window.setTimeout = function (fn, delay) {
  return Math.floor(Math.random() * 1000) + 1;
};

global.window.clearTimeout = function (id) {
  // Do nothing
};

global.window.setInterval = function (fn, delay) {
  return Math.floor(Math.random() * 1000) + 1;
};

global.window.clearInterval = function (id) {
  // Do nothing
};

// Also set these on global for compatibility
global.setTimeout = global.window.setTimeout;
global.clearTimeout = global.window.clearTimeout;
global.setInterval = global.window.setInterval;
global.clearInterval = global.window.clearInterval;
