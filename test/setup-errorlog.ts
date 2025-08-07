import { JSDOM } from 'jsdom';
import './crypto-shim.js';

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
});

(global as any).localStorage = localStorageProxy;

// Mock XMLHttpRequest for testing
(global as any).XMLHttpRequest = dom.window.XMLHttpRequest;

// Mock navigator
(global as any).navigator = {
  userAgent:
    'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
};

export {};
