import { webcrypto } from 'crypto';

// Polyfill crypto for Node.js environment
if (!global.crypto) {
  global.crypto = webcrypto as Crypto;
}

// Ensure crypto.subtle is available
if (!global.crypto.subtle) {
  global.crypto.subtle = webcrypto.subtle;
}

// Add crypto to window if it exists
if (typeof window !== 'undefined' && !window.crypto) {
  (window as any).crypto = global.crypto;
}

export {};
