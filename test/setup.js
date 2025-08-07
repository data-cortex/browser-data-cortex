import { JSDOM } from 'jsdom';
import './crypto-shim.js';

// Create a comprehensive browser environment
const dom = new JSDOM('<!DOCTYPE html><html><body></body></html>', {
  url: 'https://example.com',
  pretendToBeVisual: true,
  resources: 'usable',
});

// Set up all the globals that the DataCortex library expects
global.window = dom.window;
global.document = dom.window.document;
global.XMLHttpRequest = dom.window.XMLHttpRequest;
global.localStorage = dom.window.localStorage;
global.setTimeout = dom.window.setTimeout;
global.clearTimeout = dom.window.clearTimeout;
global.setInterval = dom.window.setInterval;
global.clearInterval = dom.window.clearInterval;

// Handle navigator carefully since it might be read-only
if (!global.navigator) {
  global.navigator = dom.window.navigator;
} else {
  // Copy properties from JSDOM navigator to existing navigator
  Object.assign(global.navigator, dom.window.navigator);
}

// Crypto is now handled by crypto-shim.js

// Mock user agent for device detection
Object.defineProperty(global.navigator, 'userAgent', {
  value:
    'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  writable: true,
  configurable: true,
});
