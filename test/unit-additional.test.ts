import { runner, assert, assertEqual, assertThrows, DataCortex, localStorageProxy } from './unit.test.js';

runner.test('should track economy event', () => {
  DataCortex.init({
    api_key: 'test-key',
    org_name: 'test-org',
  });

  const eventData = {
    spend_currency: 'USD',
    spend_amount: 9.99,
    spend_type: 'purchase',
    kingdom: 'economy',
    phylum: 'purchase',
  };

  const result = DataCortex.economyEvent(eventData);

  // economyEvent() now returns void
  assertEqual(result, undefined);

  // Check that event was stored in localStorage
  const eventList = JSON.parse(
    (global as any).localStorage.getItem('dc.event_list') || '[]'
  );
  const lastEvent = eventList[eventList.length - 1];
  assertEqual(lastEvent.type, 'economy');
  assertEqual(lastEvent.spend_currency, 'USD');
  assertEqual(lastEvent.spend_amount, 9.99);
  assertEqual(lastEvent.spend_type, 'purchase');
});

runner.test('should throw error for missing spend_currency', () => {
  DataCortex.init({
    api_key: 'test-key',
    org_name: 'test-org',
  });

  assertThrows(() => {
    DataCortex.economyEvent({
      spend_amount: 9.99,
    });
  }, 'spend_currency is required');
});

runner.test('should throw error for missing spend_amount', () => {
  DataCortex.init({
    api_key: 'test-key',
    org_name: 'test-org',
  });

  assertThrows(() => {
    DataCortex.economyEvent({
      spend_currency: 'USD',
    });
  }, 'spend_amount is required');
});

runner.test('should track message send event with to_tag', () => {
  DataCortex.init({
    api_key: 'test-key',
    org_name: 'test-org',
  });

  const eventData = {
    from_tag: 'user1',
    to_tag: 'user2',
    kingdom: 'message',
  };

  const result = DataCortex.messageSendEvent(eventData);

  // messageSendEvent() now returns void
  assertEqual(result, undefined);

  // Check that event was stored in localStorage
  const eventList = JSON.parse(
    (global as any).localStorage.getItem('dc.event_list') || '[]'
  );
  const lastEvent = eventList[eventList.length - 1];
  assertEqual(lastEvent.type, 'message_send');
  assertEqual(lastEvent.from_tag, 'user1');
  assert(Array.isArray(lastEvent.to_list));
  assertEqual(lastEvent.to_list[0], 'user2');
});

runner.test('should track message send event with to_list', () => {
  DataCortex.init({
    api_key: 'test-key',
    org_name: 'test-org',
  });

  const eventData = {
    from_tag: 'user1',
    to_list: ['user2', 'user3'],
    kingdom: 'message',
  };

  const result = DataCortex.messageSendEvent(eventData);

  // messageSendEvent() now returns void
  assertEqual(result, undefined);

  // Check that event was stored in localStorage
  const eventList = JSON.parse(
    (global as any).localStorage.getItem('dc.event_list') || '[]'
  );
  const lastEvent = eventList[eventList.length - 1];
  assertEqual(lastEvent.type, 'message_send');
  assertEqual(lastEvent.to_list.length, 2);
  assertEqual(lastEvent.to_list[0], 'user2');
  assertEqual(lastEvent.to_list[1], 'user3');
});

runner.test('should throw error for missing from_tag', () => {
  DataCortex.init({
    api_key: 'test-key',
    org_name: 'test-org',
  });

  assertThrows(() => {
    DataCortex.messageSendEvent({
      to_tag: 'user2',
    });
  }, 'from_tag is required');
});

runner.test('should log simple message', () => {
  DataCortex.init({
    api_key: 'test-key',
    org_name: 'test-org',
  });

  DataCortex.log('test message');

  // Check that log was stored
  const logList = JSON.parse(
    (global as any).localStorage.getItem('dc.log_list') || '[]'
  );
  assertEqual(logList.length, 1);
  assertEqual(logList[0].log_line, 'test message');
});

runner.test('should log multiple arguments', () => {
  DataCortex.init({
    api_key: 'test-key',
    org_name: 'test-org',
  });

  DataCortex.log('message', 123, { key: 'value' });

  const logList = JSON.parse(
    (global as any).localStorage.getItem('dc.log_list') || '[]'
  );
  assertEqual(logList[0].log_line, 'message 123 {"key":"value"}');
});

runner.test('should throw error for no log arguments', () => {
  DataCortex.init({
    api_key: 'test-key',
    org_name: 'test-org',
  });

  assertThrows(() => {
    DataCortex.log();
  }, 'log must have arguments');
});

runner.test('should track log event', () => {
  DataCortex.init({
    api_key: 'test-key',
    org_name: 'test-org',
  });

  const logData = {
    log_line: 'test log message',
    log_level: 'info',
    hostname: 'example.com',
  };

  const result = DataCortex.logEvent(logData);

  // logEvent() now returns void
  assertEqual(result, undefined);

  // Check that log was stored in localStorage
  const logList = JSON.parse(
    (global as any).localStorage.getItem('dc.log_list') || '[]'
  );
  const lastLog = logList[logList.length - 1];
  assertEqual(lastLog.log_line, 'test log message');
  assertEqual(lastLog.log_level, 'info');
  assertEqual(lastLog.hostname, 'example.com');
  assertEqual(typeof lastLog.event_datetime, 'string');
});

export {};
