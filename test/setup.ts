import { JSDOM } from 'jsdom';
import './crypto-shim.js';

// Create a comprehensive browser environment
const dom = new JSDOM('<!DOCTYPE html><html><body></body></html>', {
  url: 'https://example.com',
  pretendToBeVisual: true,
  resources: 'usable',
});

// Set up all the globals that the DataCortex library expects
(global as any).window = dom.window;
(global as any).document = dom.window.document;
(global as any).XMLHttpRequest = dom.window.XMLHttpRequest;
(global as any).localStorage = dom.window.localStorage;
(global as any).setTimeout = dom.window.setTimeout;
(global as any).clearTimeout = dom.window.clearTimeout;
(global as any).setInterval = dom.window.setInterval;
(global as any).clearInterval = dom.window.clearInterval;

// Handle navigator carefully since it might be read-only
if (!(global as any).navigator) {
  (global as any).navigator = dom.window.navigator;
} else {
  // Copy properties from JSDOM navigator to existing navigator
  Object.assign((global as any).navigator, dom.window.navigator);
}

// Crypto is now handled by crypto-shim.js

// Mock user agent for device detection
Object.defineProperty((global as any).navigator, 'userAgent', {
  value:
    'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  writable: true,
  configurable: true,
});

export {};
