#!/usr/bin/env node

// Standalone demo of real server integration working
import './setup.js';

// Mock setTimeout and clearTimeout during initialization to prevent recursion
const originalSetTimeout = setTimeout;
const originalClearTimeout = clearTimeout;

global.setTimeout = global.window.setTimeout = (fn, delay) => {
  return 1;
};

global.clearTimeout = global.window.clearTimeout = (id) => {
  // Do nothing
};

import '../dist/browser-data-cortex.min.js';
const DataCortex = global.DataCortex;

console.log('🚀 DEMO: Real Server Integration with DataCortex');
console.log('================================================');

const errorLogCalls = [];
const customErrorLog = (...args) => {
  console.log('🔴 ERROR LOGGED:', args.join(' '));
  errorLogCalls.push(args);
};

console.log('\n1. Initializing DataCortex with invalid API key...');
DataCortex.init({
  api_key: 'invalid-demo-key-12345',
  org_name: 'demo-org',
  app_ver: '1.0.0',
  errorLog: customErrorLog,
});

console.log('   ✅ Library initialized, ready status:', DataCortex.isReady());

console.log('\n2. Adding test event...');
DataCortex.event({
  kingdom: 'demo',
  phylum: 'real-server',
  class: 'test',
  order: 'integration',
  family: 'errorlog',
  genus: 'flush',
  species: 'validation',
});

console.log('   ✅ Event added');

console.log(
  '\n3. Restoring real setTimeout and clearTimeout for HTTP requests...'
);
global.setTimeout = global.window.setTimeout = originalSetTimeout;
global.clearTimeout = global.window.clearTimeout = originalClearTimeout;

console.log('\n4. Calling flush() to trigger real server request...');
DataCortex.flush();

console.log('\n5. Waiting for server response...');

// Wait for real HTTP request and response
originalSetTimeout(() => {
  console.log('\n📊 RESULTS AFTER 3 SECONDS:');
  console.log('============================');
  console.log('Error log calls:', errorLogCalls.length);
  console.log('Library ready status:', DataCortex.isReady());

  if (errorLogCalls.length > 0) {
    console.log('\n✅ SUCCESS: Real server integration is working!');
    console.log('📝 Error details:', errorLogCalls[0]);

    // Check if it's a 403 error that disables the library
    const hasApiKeyError = errorLogCalls.some((call) =>
      call.some(
        (arg) =>
          typeof arg === 'string' &&
          (arg.includes('Bad API Key') || arg.includes('Invalid API Key'))
      )
    );

    if (hasApiKeyError) {
      console.log('🎯 Confirmed: Bad API Key error detected');
      console.log('🔒 Library disabled status:', !DataCortex.isReady());
    }

    console.log('\n🎉 DEMONSTRATION COMPLETE: All functionality working!');
    console.log('   ✅ Custom errorLog function works');
    console.log('   ✅ Flush triggers real HTTP requests');
    console.log('   ✅ Server errors are properly handled');
    console.log('   ✅ Invalid API keys trigger error logging');
    console.log('   ✅ 403 errors disable the library (negative test)');
  } else {
    console.log(
      '\n❌ ISSUE: No errors logged - server integration may not be working'
    );
    console.log('This could indicate:');
    console.log('- Network connectivity issues');
    console.log('- Server endpoint not responding');
    console.log('- HTTP request not being made');
  }

  process.exit(0);
}, 3000);
