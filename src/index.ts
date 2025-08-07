import {
  STRING_PROP_LIST,
  LONG_STRING_PROP_LIST,
  NUMBER_PROP_LIST,
  OTHER_PROP_LIST,
  LOG_NUMBER_PROP_LIST,
  LOG_STRING_PROP_MAP,
  LOG_OTHER_PROP_LIST,
} from './constants';

const EVENT_SEND_COUNT = 10;
const LOG_SEND_COUNT = 10;
const DELAY_MS: number = 2 * 1000;
const API_BASE_URL = 'https://api.data-cortex.com';

export interface InitOptions {
  api_key: string;
  org_name: string;
  app_ver?: string;
  base_url?: string;
  device_tag?: string;
  add_error_handler?: boolean;
  errorLog?: (...args: unknown[]) => void;
}
export interface EventProps {
  kingdom?: string;
  phylum?: string;
  class?: string;
  order?: string;
  family?: string;
  genus?: string;
  species?: string;
  float1?: number;
  float2?: number;
  float3?: number;
  float4?: number;
  group_tag?: string;
  event_index?: number;
  event_datetime?: string;
}
export interface EconomyEventProps extends EventProps {
  spend_currency: string;
  spend_amount: number;
  spend_type?: string;
}
export interface MessageSendEventProps extends EventProps {
  network?: string;
  channel?: string;
  from_tag: string;
  to_tag?: string;
  to_list?: string[];
}
export interface LogEventProps {
  log_line?: string;
  hostname?: string;
  filename?: string;
  log_level?: string;
  device_tag?: string;
  user_tag?: string;
  remote_address?: string;
  event_datetime?: string;
  repsonse_bytes?: number;
  response_ms?: number;
  [key: string]: unknown;
}
interface InternalEvent extends EventProps {
  event_index?: number;
  event_datetime?: string;
  type?: string;
  spend_currency?: string;
  spend_amount?: number;
  spend_type?: string;
  network?: string;
  channel?: string;
  from_tag?: string;
  to_tag?: string;
  to_list?: string[];
  session_key?: string;
  [key: string]: unknown;
}

interface DefaultBundle {
  os?: string;
  os_ver?: string;
  browser?: string;
  browser_ver?: string;
  device_type?: string;
  device_family?: string;
  api_key?: string;
  app_ver?: string;
  device_tag?: string;
  user_tag?: string;
  events?: InternalEvent[];
  [key: string]: unknown;
}

interface RequestOptions {
  url: string;
  method: string;
  body?: Record<string, unknown> | FormData;
  headers?: Record<string, string>;
  timeout?: number;
}

type RequestCallback = (
  err: string | null,
  status?: number,
  body?: string
) => void;

const EVENT_PROP_LIST: readonly string[] = [
  ...STRING_PROP_LIST,
  ...LONG_STRING_PROP_LIST,
  ...NUMBER_PROP_LIST,
  ...OTHER_PROP_LIST,
];
const LOG_PROP_LIST: readonly string[] = [
  ...LOG_NUMBER_PROP_LIST,
  ...Object.keys(LOG_STRING_PROP_MAP),
  ...LOG_OTHER_PROP_LIST,
];

let g_apiBaseUrl: string = API_BASE_URL;

let g_isReady = false;
let g_isSending = false;
let g_timeout: ReturnType<typeof setTimeout> | null = null;

let g_apiKey: string | null = null;
let g_orgName: string | null = null;
let g_appVer = '0';

let g_userTag: string | null = null;
let g_eventList: InternalEvent[] = [];
let g_hasSendInstall = false;
let g_lastDAUTime = 0;
let g_sessionKey: string | null = null;
let g_deviceTag: string | null = null;
let g_nextIndex = 0;

let g_logTimeout: ReturnType<typeof setTimeout> | null = null;
let g_isLogSending = false;
let g_logDelayCount = 0;

let g_activeRequests = 0;
let g_flushPromise: Promise<void> | null = null;
let g_flushResolve: (() => void) | null = null;

let g_delayCount = 0;

const g_defaultBundle: DefaultBundle = {};

let g_logList: LogEventProps[] = [];

let g_errorLog: (...args: unknown[]) => void = function (...args: unknown[]) {
  // eslint-disable-next-line no-console
  console.error('Data Cortex Error:', ...args);
};

function _errorLog(...args: unknown[]): void {
  g_errorLog(...args);
}

function _getStoredItem<T>(name: string): T | undefined {
  let ret: T | undefined;
  if (name in window.localStorage) {
    const json = window.localStorage[name];
    try {
      ret = JSON.parse(json);
    } catch {
      // _errorLog("Failed to parse:",name,"json:",json);
    }
  }
  return ret;
}
function _setStoredItem(name: string, value: unknown): void {
  const json = JSON.stringify(value);
  window.localStorage[name] = json;
}
function _clearStoredItem(name: string): void {
  delete window.localStorage[name];
}

function _loadDeviceTag(): string {
  let text = _getStoredItem<string>('dc.device_tag') ?? null;
  if (!text) {
    text = _generateRandomString();
    _setStoredItem('dc.device_tag', text);
  }
  return text;
}
function _generateRandomString(): string {
  let text = '';
  const array: Uint32Array = new Uint32Array(8);
  window.crypto.getRandomValues(array);
  for (const value of array) {
    text += value.toString(36);
  }
  text = text.slice(0, 32);
  return text;
}

export function init(opts: InitOptions): void {
  const baseUrl =
    opts.base_url ??
    _getStoredItem<string | false>('dc.base_url') ??
    API_BASE_URL;
  g_apiBaseUrl = typeof baseUrl === 'string' ? baseUrl : API_BASE_URL;

  g_apiKey = opts.api_key;
  g_orgName = opts.org_name;
  g_appVer = opts.app_ver ?? '0';
  g_userTag = _getStoredItem<string>('dc.user_tag') ?? null;

  // Set custom error logging function if provided
  if (opts.errorLog && typeof opts.errorLog === 'function') {
    g_errorLog = opts.errorLog;
  }

  g_eventList = _getStoredItem<InternalEvent[]>('dc.event_list') ?? [];
  g_nextIndex = _getStoredItem<number>('dc.next_index') ?? 0;
  for (const e of g_eventList) {
    if (e.event_index && e.event_index >= g_nextIndex) {
      g_nextIndex = e.event_index + 1;
    }
  }

  g_logList = _getStoredItem<LogEventProps[]>('dc.log_list') ?? [];

  g_lastDAUTime = _getStoredItem<number>('dc.last_dau_time') ?? 0;
  g_hasSendInstall =
    (_getStoredItem<boolean>('dc.has_sent_install') ?? false) ||
    Boolean(g_lastDAUTime);
  if (opts.device_tag) {
    g_deviceTag = opts.device_tag;
    _setStoredItem('dc.device_tag', opts.device_tag);
  } else {
    g_deviceTag = _loadDeviceTag();
  }
  g_sessionKey ??= _generateRandomString();

  _maybeSendInstall();
  _maybeAddDau();
  window.setInterval(_maybeAddDau, 12 * 60 * 60 * 1000);

  _setupDefaultBundle();
  g_isReady = true;
  _sendEventsLater();

  if (opts.add_error_handler ?? false) {
    window.addEventListener('error', _onError);
  }
}
function _onError(e: unknown): void {
  log('Javascript Error:', e);
}

export function isReady(): boolean {
  return g_isReady;
}
export function getDeviceTag(): string | null {
  return g_deviceTag;
}
export function addUserTag(userTag: string | null): void {
  g_userTag = userTag ? String(userTag) : null;
  if (g_userTag) {
    _setStoredItem('dc.user_tag', g_userTag);
  } else {
    _clearStoredItem('dc.user_tag');
  }
}
export function event(props: EventProps): void {
  if (typeof props !== 'object' || (props as unknown) === null) {
    throw new Error('props must be an object');
  }
  const e = Object.assign({} as InternalEvent, props, { type: 'event' });
  _internalEventAdd(e);
}
export function economyEvent(props: EconomyEventProps): void {
  if (typeof props !== 'object' || (props as unknown) === null) {
    throw new Error('props must be an object');
  }
  if (!props.spend_currency) {
    throw new Error('spend_currency is required');
  }
  if (typeof props.spend_amount !== 'number') {
    throw new Error('spend_amount is required');
  }

  const e = Object.assign({} as InternalEvent, props, { type: 'economy' });
  _internalEventAdd(e);
}
export function messageSendEvent(props: MessageSendEventProps): void {
  if (typeof props !== 'object' || (props as unknown) === null) {
    throw new Error('props must be an object');
  }
  if (!props.from_tag) {
    throw new Error('from_tag is required');
  }
  if (!props.to_tag && !props.to_list) {
    throw new Error('to_tag or to_list is required');
  }
  if (props.to_list && !Array.isArray(props.to_list)) {
    throw new Error('to_list must be an array.');
  }
  props.to_list ??= [];
  if (props.to_tag) {
    props.to_list.push(props.to_tag);
  }
  if (props.to_list.length === 0) {
    throw new Error('must have at least 1 in to_list or a to_tag');
  }

  const e = Object.assign({} as InternalEvent, props, { type: 'message_send' });
  _internalEventAdd(e);
}
export function logEvent(props: LogEventProps): void {
  if (typeof props !== 'object' || (props as unknown) === null) {
    throw new Error('props must be an object.');
  }
  props.event_datetime ??= new Date().toISOString();

  for (const p in LOG_STRING_PROP_MAP) {
    if (p in props) {
      const max_len = LOG_STRING_PROP_MAP[p];
      const val = props[p];
      if (val !== undefined && val !== null) {
        props[p] = String(val).slice(0, max_len);
      } else {
        props[p] = undefined;
      }
    }
  }
  for (const p of LOG_NUMBER_PROP_LIST) {
    if (p in props) {
      let val = props[p];
      if (typeof val !== 'number') {
        val = parseFloat(String(val));
      }
      if (typeof val === 'number' && isFinite(val)) {
        props[p] = val;
      } else {
        props[p] = undefined;
      }
    }
  }

  const e: LogEventProps = {};
  for (const key of LOG_PROP_LIST) {
    if (key in props) {
      e[key] = props[key];
    }
  }
  g_logList.push(e);
  _setStoredItem('dc.log_list', g_logList);
  _sendLogsLater(0);
}
export function log(...args: unknown[]): void {
  if (args.length === 0) {
    throw new Error('log must have arguments');
  }
  let log_line = '';
  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    if (i > 0) {
      log_line += ' ';
    }

    if (_isError(arg)) {
      log_line += `${arg.message} ${arg.stack}`;
    } else if (typeof arg === 'object') {
      try {
        log_line += JSON.stringify(arg);
      } catch {
        log_line += String(arg);
      }
    } else {
      log_line += String(arg);
    }
  }
  logEvent({ log_line });
}
function _maybeSendInstall(): void {
  if (!g_hasSendInstall) {
    g_hasSendInstall = true;
    _setStoredItem('dc.has_sent_install', true);

    _internalEventAdd({
      type: 'install',
      kingdom: 'organic',
      phylum: 'organic',
      class: 'organic',
      order: 'organic',
      family: 'organic',
      genus: 'organic',
      species: 'organic',
    });
  }
}
function _maybeAddDau(): void {
  const delta = Date.now() - g_lastDAUTime;
  if (delta > 24 * 60 * 60 * 1000) {
    _internalEventAdd({ type: 'dau' });
    g_lastDAUTime = Date.now();
    _setStoredItem('dc.last_dau_time', g_lastDAUTime);
  }
}
function _cleanupString(val: unknown, max_len: number): string | undefined {
  let ret: string | undefined;
  if (typeof val === 'string') {
    ret = val;
  } else if (val !== null && val !== undefined) {
    ret = String(val);
  }
  if (ret && ret.length > 0) {
    ret = ret.slice(0, max_len);
  }
  return ret;
}
function _internalEventAdd(e: InternalEvent): void {
  e.event_index = g_nextIndex++;
  e.event_datetime ??= new Date().toISOString();

  if (g_sessionKey) {
    e.group_tag = g_sessionKey;
  }
  for (const p of STRING_PROP_LIST) {
    if (p in e) {
      const val = e[p];
      e[p] = _cleanupString(val, 32);
    }
  }
  for (const p of LONG_STRING_PROP_LIST) {
    if (p in e) {
      const val = e[p];
      e[p] = _cleanupString(val, 64);
    }
  }
  for (const p of NUMBER_PROP_LIST) {
    if (p in e) {
      let val = e[p];
      if (typeof val !== 'number') {
        val = parseFloat(String(val));
      }
      if (typeof val === 'number' && isFinite(val)) {
        e[p] = val;
      } else {
        e[p] = undefined;
      }
    }
  }

  for (const key in e) {
    if (!EVENT_PROP_LIST.includes(key)) {
      e[key] = undefined;
    }
  }
  g_eventList.push(e);
  _setStoredItem('dc.event_list', g_eventList);
  _sendEventsLater();
}
function _sendEventsLater(delay?: number): void {
  if (!g_timeout && g_isReady && !g_isSending) {
    g_timeout = setTimeout(() => {
      g_timeout = null;
      _sendEvents();
    }, delay ?? 0);
  }
}
function _sendEvents(): void {
  if (g_isReady && !g_isSending && g_eventList.length > 0) {
    g_isSending = true;

    const bundle = Object.assign({}, g_defaultBundle, {
      api_key: g_apiKey,
      app_ver: g_appVer,
      device_tag: g_deviceTag,
    }) as DefaultBundle & { events: InternalEvent[] };
    if (g_userTag) {
      bundle.user_tag = g_userTag;
    }
    bundle.events = [];
    let first_event: InternalEvent | undefined;
    for (const e of g_eventList) {
      if (!first_event) {
        first_event = e;
        bundle.events.push(e);
      } else if (first_event.session_key === e.session_key) {
        bundle.events.push(e);
      }
    }
    bundle.events.splice(EVENT_SEND_COUNT);

    const current_time = encodeURIComponent(new Date().toISOString());
    const url = `${g_apiBaseUrl}/${g_orgName}/1/track?current_time=${current_time}`;
    const opts: RequestOptions = {
      url,
      method: 'POST',
      body: bundle,
    };
    _request(opts, (err, status, body) => {
      let remove = true;
      if (err === 'status') {
        if (status === 400) {
          _errorLog('Bad request, please check parameters, error:', body);
        } else if (status === 403) {
          _errorLog('Bad API Key, error:', body);
          g_isReady = false;
        } else if (status === 409) {
          // Dup send?
        } else {
          remove = false;
          g_delayCount++;
        }
      } else if (err) {
        remove = false;
        g_delayCount++;
      } else {
        g_delayCount = 0;
      }
      if (remove) {
        _removeEvents(bundle.events);
      }

      g_isSending = false;
      if (g_eventList.length > 0) {
        _sendEventsLater(g_delayCount * DELAY_MS);
      }
    });
  }
}
function _request(args: RequestOptions, done: RequestCallback): void {
  g_activeRequests++;
  let done_once = false;
  function request_done(...args: Parameters<RequestCallback>): void {
    if (!done_once) {
      done_once = true;
      done(...args);
      g_activeRequests--;
      _checkFlushDone();
    }
  }

  const { method } = args;

  const default_headers: Record<string, string> = {
    Accept: 'application/json',
  };
  const { body: requestBody } = args;
  let body: string | FormData | null = null;
  if (requestBody instanceof FormData) {
    body = requestBody;
  } else if (requestBody) {
    body = JSON.stringify(requestBody);
    default_headers['Content-Type'] = 'text/plain';
  }
  const headers = Object.assign({}, default_headers, args.headers);

  const { url } = args;

  const fetchOptions: RequestInit = {
    method,
    headers,
    body,
  };
  let timeoutId: ReturnType<typeof setTimeout> | undefined;
  if (args.timeout) {
    const controller = new AbortController();
    fetchOptions.signal = controller.signal;

    timeoutId = setTimeout(() => {
      controller.abort();
    }, args.timeout);
  }

  fetch(url, fetchOptions)
    .then(async (response) => {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }

      const { status } = response;
      let responseBody = '';

      try {
        responseBody = await response.text();
      } catch {
        // If we can't read the response body, continue with empty string
      }

      let err: string | null = null;
      if (status < 200 || status > 599) {
        err = 'wierd_status';
      } else if (status >= 300) {
        err = 'status';
      }

      request_done(err, status, responseBody);
    })
    .catch((error) => {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }

      if (error.name === 'AbortError') {
        request_done('timeout');
      } else {
        request_done('fetch_error');
      }
    });
}
function _removeEvents(event_list: InternalEvent[]): void {
  g_eventList = g_eventList.filter((e) => {
    return !event_list.some((e2) => {
      return e.event_index === e2.event_index;
    });
  });
  _setStoredItem('dc.event_list', g_eventList);
  _setStoredItem('dc.next_index', g_nextIndex);
}
function _setupDefaultBundle(): void {
  function regexGet(haystack: string, regex: RegExp, def: string): string {
    let ret: string = def;
    const matches: RegExpMatchArray | null = haystack.match(regex);
    if (matches && matches.length > 1 && matches[1] !== undefined) {
      ret = matches[1];
    }
    return ret;
  }

  const ua = navigator.userAgent;

  let os = 'unknown';
  let os_ver = 'unknown';
  if (ua.includes('Win')) {
    os = 'windows';
    os_ver = regexGet(ua, /Windows NT ([^ ;)]*)/, 'unknown');
  } else if (ua.includes('iPhone OS')) {
    os = 'ios';
    os_ver = regexGet(ua, /iPhone OS ([^ ;)]*)/, 'unknown');
    os_ver = os_ver.replace(/_/g, '.');
  } else if (ua.includes('iPad')) {
    os = 'ios';
    os_ver = regexGet(ua, /CPU OS ([^ ;)]*)/, 'unknown');
    os_ver = os_ver.replace(/_/g, '.');
  } else if (ua.includes('Mac OS X')) {
    os = 'mac';
    os_ver = regexGet(ua, /Mac OS X ([^ ;)]*)/, 'unknown');
    os_ver = os_ver.replace(/_/g, '.');
    os_ver = os_ver.replace(/\.0$/, '');
  } else if (ua.includes('Android')) {
    os = 'android';
    os_ver = regexGet(ua, /Android ([^ ;)]*)/, 'unknown');
    os_ver = os_ver.replace(/_/g, '.');
  } else if (ua.includes('X11')) {
    os = 'unix';
  } else if (ua.includes('Linux')) {
    os = 'linux';
  }

  let browser = 'unknown';
  let browser_ver = 'unknown';
  if (ua.includes('Edg/')) {
    browser = 'edge';
    browser_ver = regexGet(ua, /Edg\/([^ ;)]*)/, 'unknown');
  } else if (ua.includes('Edge')) {
    browser = 'edge';
    browser_ver = regexGet(ua, /Edge\/([^ ;)]*)/, 'unknown');
  } else if (ua.includes('Chrome')) {
    browser = 'chrome';
    browser_ver = regexGet(ua, /Chrome\/([^ ;)]*)/, 'unknown');
  } else if (ua.includes('CriOS')) {
    browser = 'chrome';
    browser_ver = regexGet(ua, /CriOS\/([^ ;)]*)/, 'unknown');
  } else if (ua.includes('Firefox')) {
    browser = 'firefox';
    browser_ver = regexGet(ua, /Firefox\/([^ ;)]*)/, 'unknown');
  } else if (ua.includes('Android')) {
    browser = 'android';
    browser_ver = regexGet(ua, /Version\/([^ ;)]*)/, 'unknown');
  } else if (ua.includes('Safari')) {
    browser = 'safari';
    browser_ver = regexGet(ua, /Version\/([^ ;)]*)/, 'unknown');
  } else if (ua.includes('Trident')) {
    browser = 'ie';
    browser_ver = regexGet(ua, /rv:([^ ;)]*)/, 'unknown');
  } else if (ua.includes('MSIE')) {
    browser = 'ie';
    browser_ver = regexGet(ua, /MSIE ([^ ;)]*)/, 'unknown');
  } else if (ua.includes('MessengerForiOS')) {
    browser = 'fbmessenger';
    browser_ver = regexGet(ua, /FBAV\/([^ ;)]*)/, 'unknown');
  } else if (ua.includes('FB_IAB/MESSENGER')) {
    browser = 'fbmessenger';
    browser_ver = regexGet(ua, /FBAV\/([^ ;)]*)/, 'unknown');
  }

  let device_type = 'desktop';
  if (ua.includes('iPod')) {
    device_type = 'ipod';
  } else if (ua.includes('iPhone')) {
    device_type = 'iphone';
  } else if (ua.includes('iPad')) {
    device_type = 'ipad';
  } else if (ua.includes('Android')) {
    if (!ua.includes('Mobile')) {
      device_type = 'android_tablet';
    } else {
      device_type = 'android';
    }
  } else if (ua.includes('Mobile')) {
    device_type = 'mobile';
  }

  g_defaultBundle.os = os;
  g_defaultBundle.os_ver = os_ver;
  g_defaultBundle.browser = browser;
  g_defaultBundle.browser_ver = browser_ver;
  g_defaultBundle.device_type = device_type;
  g_defaultBundle.device_family = device_type;
}
function _removeLogs(events: LogEventProps[]): void {
  g_logList.splice(0, events.length);
  _setStoredItem('dc.log_list', g_logList);
}

function _isError(e: unknown): e is Error {
  return (
    typeof e === 'object' &&
    e !== null &&
    'stack' in e &&
    'message' in e &&
    typeof (e as Error).stack === 'string' &&
    typeof (e as Error).message === 'string'
  );
}
function _checkFlushDone(): void {
  if (g_flushResolve && g_activeRequests === 0) {
    g_flushResolve();
    g_flushPromise = null;
    g_flushResolve = null;
  }
}
function _sendLogsLater(delay: number): void {
  if (!g_logTimeout && g_isReady && !g_isLogSending) {
    g_logTimeout = setTimeout(() => {
      g_logTimeout = null;
      _sendLogs();
    }, delay);
  }
}
interface LogBundle extends Omit<DefaultBundle, 'events'> {
  events?: LogEventProps[];
  user_tag?: string | null;
}

function _sendLogs(): void {
  if (g_isReady && !g_isLogSending && g_logList.length > 0) {
    g_isLogSending = true;

    const bundle: LogBundle = Object.assign({}, g_defaultBundle, {
      api_key: g_apiKey,
      app_ver: g_appVer,
      device_tag: g_deviceTag,
    });
    if (g_userTag) {
      bundle.user_tag = g_userTag;
    }
    bundle.events = g_logList.slice(0, LOG_SEND_COUNT);

    const url = `${g_apiBaseUrl}/${g_orgName}/1/app_log`;

    const opts: RequestOptions = {
      url,
      method: 'POST',
      body: bundle,
    };

    _request(opts, (err, status, body) => {
      let remove = true;
      if (err === 'status') {
        if (status === 400) {
          _errorLog('Bad request, please check parameters, error:', body);
        } else if (status === 403) {
          _errorLog('Bad API Key, error:', body);
        } else if (status === 409) {
          // Dup send?
        } else {
          remove = false;
          g_logDelayCount++;
        }
      } else if (err) {
        remove = false;
        g_logDelayCount++;
      } else {
        g_logDelayCount = 0;
      }
      if (remove && bundle.events) {
        _removeLogs(bundle.events);
      }

      g_isLogSending = false;
      if (g_logList.length > 0) {
        _sendLogsLater(g_logDelayCount * DELAY_MS);
      }
    });
  }
}
export function flush(): Promise<void> {
  if (g_flushPromise) {
    return g_flushPromise;
  }

  if (!g_isReady) {
    _errorLog('DataCortex not ready. Call init() first.');
    return Promise.resolve();
  }

  if (g_timeout) {
    clearTimeout(g_timeout);
    g_timeout = null;
  }
  if (g_logTimeout) {
    clearTimeout(g_logTimeout);
    g_logTimeout = null;
  }

  if (g_eventList.length > 0 && !g_isSending) {
    _sendEvents();
  }
  if (g_logList.length > 0 && !g_isLogSending) {
    _sendLogs();
  }

  if (g_activeRequests > 0) {
    g_flushPromise = new Promise((resolve) => {
      g_flushResolve = resolve;
    });
    return g_flushPromise;
  }

  return Promise.resolve();
}
export function destroy(): void {
  if (g_timeout) {
    clearTimeout(g_timeout);
    g_timeout = null;
  }
  if (g_logTimeout) {
    clearTimeout(g_logTimeout);
    g_logTimeout = null;
  }
  g_isReady = false;
  g_isSending = false;
  g_isLogSending = false;
  g_eventList = [];
  g_logList = [];
  g_activeRequests = 0;
  if (g_flushResolve) {
    g_flushResolve();
    g_flushPromise = null;
    g_flushResolve = null;
  }
}
const DataCortex = {
  init,
  isReady,
  getDeviceTag,
  addUserTag,
  event,
  economyEvent,
  messageSendEvent,
  log,
  logEvent,
  flush,
  destroy,
};
export default DataCortex;
if (typeof window !== 'undefined') {
  (window as typeof window & { DataCortex: typeof DataCortex }).DataCortex =
    DataCortex;
}
