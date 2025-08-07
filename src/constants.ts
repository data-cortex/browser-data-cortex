export const STRING_PROP_LIST: readonly string[] = [
  'kingdom',
  'phylum',
  'class',
  'order',
  'family',
  'genus',
  'species',
  'spend_currency',
  'spend_type',
  'network',
  'channel',
];
export const LONG_STRING_PROP_LIST: readonly string[] = [
  'group_tag',
  'from_tag',
];
export const NUMBER_PROP_LIST: readonly string[] = [
  'float1',
  'float2',
  'float3',
  'float4',
  'spend_amount',
];
export const OTHER_PROP_LIST: readonly string[] = [
  'type',
  'event_index',
  'event_datetime',
  'to_list',
];
export const LOG_NUMBER_PROP_LIST: readonly string[] = [
  'repsonse_bytes',
  'response_ms',
];
export const LOG_STRING_PROP_MAP: Record<string, number> = {
  hostname: 64,
  filename: 256,
  log_level: 64,
  device_tag: 62,
  user_tag: 62,
  remote_address: 64,
  log_line: 65535,
};
export const LOG_OTHER_PROP_LIST: readonly string[] = ['event_datetime'];
