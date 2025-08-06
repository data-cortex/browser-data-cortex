// Debug script to test real server requests
import './setup.js';

// Fix the timer issue by using the same approach as unit tests
global.setTimeout = global.window.setTimeout = (fn, delay) => {
  // Don't actually execute the timeout to avoid loops during testing
  return 1;
};

global.clearTimeout = global.window.clearTimeout = (id) => {
  // Do nothing
};

import DataCortex from '../src/index.js';

console.log('=== DEBUG: Testing Real Server Requests ===');

const errorLogCalls = [];
const customErrorLog = (...args) => {
  console.log('🔴 ERROR LOG CALLED:', args);
  errorLogCalls.push(args);
};

// Test with obviously invalid API key
console.log('1. Testing with invalid API key...');
DataCortex.init({
  api_key: 'definitely-invalid-key-12345',
  org_name: 'test-org',
  app_ver: '1.0.0',
  errorLog: customErrorLog,
});

console.log('2. Library ready status:', DataCortex.isReady());

// Add an event
console.log('3. Adding test event...');
DataCortex.event({
  kingdom: 'debug-test',
  phylum: 'test',
  class: 'test',
  order: 'test',
  family: 'test',
  genus: 'test',
  species: 'test',
});

console.log('4. Calling flush...');
DataCortex.flush();

console.log('5. Checking immediate results...');
console.log('   - Error log calls so far:', errorLogCalls.length);
console.log('   - Library ready:', DataCortex.isReady());

// Since we mocked setTimeout, the real HTTP requests won't happen
// Let's check if we can see any XHR activity by temporarily restoring setTimeout
console.log('6. Attempting to restore real setTimeout for HTTP requests...');

// Restore real setTimeout for HTTP requests
const originalSetTimeout = setTimeout;
global.setTimeout = global.window.setTimeout = originalSetTimeout;

// Try flush again
console.log('7. Calling flush with real setTimeout...');
DataCortex.flush();

// Wait for real HTTP request
originalSetTimeout(() => {
  console.log('8. After waiting for HTTP request:');
  console.log('   - Error log calls:', errorLogCalls.length);
  console.log('   - Library ready:', DataCortex.isReady());
  
  if (errorLogCalls.length > 0) {
    console.log('   - Error details:', errorLogCalls);
  } else {
    console.log('   - No errors logged - this indicates the problem!');
  }
  
  process.exit(0);
}, 3000);
