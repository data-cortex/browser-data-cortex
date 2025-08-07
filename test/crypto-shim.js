/**
 * Crypto API shim for Node.js test environment
 * 
 * This module provides crypto.getRandomValues for testing.
 * Only modern browsers with native crypto.getRandomValues are supported.
 */

/**
 * Mock implementation of crypto.getRandomValues
 * @param {Uint8Array|Uint16Array|Uint32Array} array - The array to fill with random values
 * @returns {Uint8Array|Uint16Array|Uint32Array} The same array filled with random values
 */
function getRandomValues(array) {
  for (let i = 0; i < array.length; i++) {
    array[i] = Math.floor(Math.random() * 0xffffffff);
  }
  return array;
}

// Create the crypto mock object
const cryptoMock = {
  getRandomValues,
};

/**
 * Set up crypto shim on global and window objects
 */
export function setupCryptoShim() {
  // Set up global.crypto
  try {
    global.crypto = cryptoMock;
  } catch (e) {
    Object.defineProperty(global, 'crypto', {
      value: cryptoMock,
      writable: true,
      configurable: true,
    });
  }

  // Set up window.crypto if window exists
  if (typeof global.window !== 'undefined') {
    try {
      global.window.crypto = cryptoMock;
    } catch (e) {
      Object.defineProperty(global.window, 'crypto', {
        value: cryptoMock,
        writable: true,
        configurable: true,
      });
    }
  }
}

// Auto-setup when module is imported
setupCryptoShim();

export { cryptoMock, getRandomValues };
