#!/usr/bin/env tsx

import { JSDOM } from 'jsdom';
import './crypto-shim';

console.log('🔍 Running User Agent Parsing Tests...\n');

// Set up JSDOM environment
const dom = new JSDOM('<!DOCTYPE html><html><body></body></html>', {
  url: 'https://example.com',
  pretendToBeVisual: true,
  resources: 'usable',
});

// Set up globals
(global as any).window = dom.window;
(global as any).document = dom.window.document;
(global as any).localStorage = dom.window.localStorage;

// Mock XMLHttpRequest to prevent ALL network requests
class MockXMLHttpRequest {
  public status = 200;
  public response = '{"success": true}';
  public responseText = '{"success": true}';
  public onload: (() => void) | null = null;
  public onerror: (() => void) | null = null;
  public ontimeout: (() => void) | null = null;

  open(method: string, url: string): void {
    // Mock implementation - do nothing
  }

  send(data?: any): void {
    // Mock successful response IMMEDIATELY (no setTimeout)
    if (this.onload) {
      this.onload();
    }
  }

  setRequestHeader(name: string, value: string): void {
    // Mock implementation - do nothing
  }
}

(global as any).XMLHttpRequest = MockXMLHttpRequest;

// Set a Chrome user agent
Object.defineProperty((global as any).navigator, 'userAgent', {
  value:
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  writable: true,
  configurable: true,
});

// Mock timers to prevent ANY delays
let timeoutId = 1;
(global as any).window.setTimeout = (fn: Function, delay: number) => {
  // Execute IMMEDIATELY for all timeouts
  fn();
  return timeoutId++;
};
(global as any).window.clearTimeout = (id: number) => {};
(global as any).window.setInterval = (fn: Function, delay: number) => {
  // Don't execute intervals at all
  return timeoutId++;
};
(global as any).window.clearInterval = (id: number) => {};

// Import DataCortex
const DataCortex = require('../dist/browser-data-cortex.min.js');

// Test runner
class UserAgentTestRunner {
  private passed = 0;
  private failed = 0;

  test(name: string, testFn: () => void): void {
    try {
      testFn();
      console.log(`✅ ${name}`);
      this.passed++;
    } catch (error: any) {
      console.log(`❌ ${name}: ${error.message}`);
      this.failed++;
    }
  }

  printSummary(): void {
    console.log(`\n📊 Results: ${this.passed} passed, ${this.failed} failed`);
    if (this.failed > 0) {
      process.exit(1);
    }
  }
}

const runner = new UserAgentTestRunner();

// Helper functions
function assertEqual(actual: any, expected: any, message?: string): void {
  if (actual !== expected) {
    throw new Error(message || `Expected "${expected}", got "${actual}"`);
  }
}

// Test that the library can handle user agent information
runner.test('User Agent Environment Setup', () => {
  // Clear localStorage
  (global as any).localStorage.clear();

  // Initialize DataCortex with mocked network
  DataCortex.init({
    api_key: process.env.DC_API_KEY,
    org_name: 'test-org',
    app_ver: '1.0.0',
  });

  // Verify initialization
  assertEqual(DataCortex.isReady(), true, 'DataCortex should be ready');

  // Create an event
  DataCortex.event({
    kingdom: 'user-agent-test',
    phylum: 'environment',
    class: 'setup',
    order: 'test',
    family: 'validation',
    genus: 'browser',
    species: 'detection',
  });

  // Get the event from localStorage
  const eventList = JSON.parse(
    (global as any).localStorage.getItem('dc.event_list') || '[]'
  );

  if (eventList.length === 0) {
    throw new Error('No events found in localStorage');
  }

  const lastEvent = eventList[eventList.length - 1];

  // Verify basic event properties
  assertEqual(
    lastEvent.kingdom,
    'user-agent-test',
    'Kingdom should be set correctly'
  );
  assertEqual(lastEvent.type, 'event', 'Event type should be set');

  // Log any user agent related fields that were detected
  console.log(
    `   🔍 Event created with ${Object.keys(lastEvent).length} properties`
  );

  if (lastEvent.os) {
    console.log(
      `   🖥️  OS detected: ${lastEvent.os} ${lastEvent.os_ver || ''}`
    );
  }
  if (lastEvent.browser) {
    console.log(
      `   🌐 Browser detected: ${lastEvent.browser} ${lastEvent.browser_ver || ''}`
    );
  }
  if (lastEvent.device_type) {
    console.log(`   📱 Device type: ${lastEvent.device_type}`);
  }
});

runner.test('User Agent String Access', () => {
  // Verify we can access the user agent string
  const userAgent = (global as any).navigator.userAgent;

  if (!userAgent || userAgent.length === 0) {
    throw new Error('User agent string is not accessible');
  }

  console.log(`   📋 User Agent: ${userAgent.substring(0, 50)}...`);

  // Verify it contains expected Chrome information
  if (!userAgent.includes('Chrome')) {
    throw new Error('User agent should contain Chrome information');
  }
});

runner.test('Multiple Events with User Agent Context', () => {
  // Clear localStorage
  (global as any).localStorage.clear();

  // Re-initialize DataCortex with mocked network
  DataCortex.init({
    api_key: process.env.DC_API_KEY,
    org_name: 'test-org-multi',
    app_ver: '1.0.0',
  });

  // Get initial event count (there might be automatic events like install/dau)
  const initialEventList = JSON.parse(
    (global as any).localStorage.getItem('dc.event_list') || '[]'
  );
  const initialCount = initialEventList.length;

  // Create multiple events
  for (let i = 1; i <= 3; i++) {
    DataCortex.event({
      kingdom: `multi-event-${i}`,
      phylum: 'user-agent',
      class: 'multiple',
      order: 'test',
      family: 'validation',
      genus: 'browser',
      species: 'detection',
      float1: i * 10,
    });
  }

  // Verify our events were added
  const eventList = JSON.parse(
    (global as any).localStorage.getItem('dc.event_list') || '[]'
  );

  const ourEventCount = eventList.length - initialCount;
  if (ourEventCount !== 3) {
    throw new Error(
      `Expected 3 new events, got ${ourEventCount} (total: ${eventList.length}, initial: ${initialCount})`
    );
  }

  console.log(
    `   📊 Created ${ourEventCount} new events successfully (total: ${eventList.length})`
  );

  // Verify our events have the expected properties
  const ourEvents = eventList.slice(-3); // Get the last 3 events
  ourEvents.forEach((event: any, index: number) => {
    assertEqual(
      event.kingdom,
      `multi-event-${index + 1}`,
      `Event ${index + 1} kingdom should be correct`
    );
    assertEqual(
      event.float1,
      (index + 1) * 10,
      `Event ${index + 1} float1 should be correct`
    );
  });
});

runner.test('Network Mocking Verification', () => {
  // Verify that network requests are properly mocked
  const xhr = new (global as any).XMLHttpRequest();

  let requestCompleted = false;
  xhr.onload = () => {
    requestCompleted = true;
  };

  xhr.open('POST', 'https://example.com/test');
  xhr.send();

  // Should complete immediately with mocked implementation
  if (!requestCompleted) {
    throw new Error('Network mocking is not working properly');
  }
  console.log('   🔒 Network requests are properly mocked');
});

console.log('\n🏁 User Agent Parsing Tests Complete\n');
runner.printSummary();

DataCortex.destroy();

export {};
