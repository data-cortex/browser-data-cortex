import './setup.js';
import DataCortex from '../src/index.js';

DataCortex.init({
  api_key: 'test-key',
  org_name: 'test-org',
  app_ver: '1.0.0',
});

const longString = 'a'.repeat(100);
console.log('Long string length:', longString.length);

const eventWithLongGroupTag = DataCortex.event({
  kingdom: 'test',
  phylum: 'test',
  class: 'test',
  order: 'test',
  family: 'test',
  genus: 'test',
  species: 'test',
  network: 'test',
  channel: 'test',
  group_tag: longString,
});

console.log(
  'Event group_tag length:',
  eventWithLongGroupTag.group_tag
    ? eventWithLongGroupTag.group_tag.length
    : 'undefined'
);
console.log('Event group_tag value:', eventWithLongGroupTag.group_tag);
console.log('Event keys:', Object.keys(eventWithLongGroupTag));
