'use strict';

const EVENT_SEND_COUNT = 10;
const LOG_SEND_COUNT = 10;
const DELAY_MS = 2*1000;

const STRING_PROP_LIST = [
  'kingdom',
  'phylum',
  'class',
  'order',
  'family',
  'genus',
  'species',
  'group_tag',
  'spend_currency',
  'spend_type',
];

const NUMBER_PROP_LIST = [
  'float1',
  'float2',
  'float3',
  'float4',
  'spend_amount',
];

const OTHER_PROP_LIST = [
  'type',
  'event_index',
  'event_datetime',
];

const EVENT_PROP_LIST = _union(
  STRING_PROP_LIST,
  NUMBER_PROP_LIST,
  OTHER_PROP_LIST);

const API_BASE_URL = "https://api.data-cortex.com";

let g_apiBaseUrl = API_BASE_URL;

let g_isReady = false;
let g_isSending = false;
let g_timeout = false;

let g_apiKey = false;
let g_orgName = false;
let g_appVer = "0";

let g_userTag = false;
let g_eventList = [];
let g_lastDAUTime = 0;
let g_sessionKey = false;
let g_deviceTag = false;
let g_nextIndex = 0;

let g_delayCount = 0;

const g_defaultBundle = {};

let g_logList = [];

function _errorLog(...args) {
  console.error("Data Cortex Error:",...args);
}

function init(opts,done) {
  if (!done) {
    done = function() {};
  }
  g_apiBaseUrl = opts.base_url || _getStoredItem('dc.base_url',false) || API_BASE_URL;

  g_apiKey = opts.api_key;
  g_orgName = opts.org_name;
  g_appVer = opts.app_ver || "0";
  g_userTag = _getStoredItem('dc.user_tag',false);

  g_eventList = _getStoredItem('dc.event_list',[]);
  g_nextIndex = _getStoredItem('dc.next_index',0);
  g_eventList.forEach((e) => {
    if (e.event_index >= g_nextIndex) {
      g_nextIndex = e.event_index + 1;
    }
  });

  g_logList = _getStoredItem('dc.log_list',[]);

  g_lastDAUTime = _getStoredItem('dc.last_dau_time',0);
  g_deviceTag = _getDeviceTag();
  if (!g_sessionKey) {
    g_sessionKey = _generateRandomString();
  }
  _maybeAddDau();
  window.setInterval(_maybeAddDau,12*60*60*1000);

  _setupDefaultBundle();
  g_isReady = true;
  _sendEventsLater();
  done();
}
function isReady() {
  return g_isReady;
}

function addUserTag(userTag) {
  if (userTag && typeof userTag != 'string') {
    userTag = userTag.toString();
  }
  g_userTag = userTag;
  _setStoredItem('dc.user_tag',g_userTag);
}

function event(props) {
  if (!props || typeof props !== 'object') {
    throw new Error('props must be an object');
  }
  props.type = "event";
  _internalEventAdd(props);
}

function economyEvent(props) {
  if (!props || typeof props != 'object') {
    throw new Error('props must be an object');
  }
  if (!props.spend_currency) {
    throw new Error('spend_currency is required');
  }
  if (typeof props.spend_amount != 'number') {
    throw new Error('spend_amount is required');
  }

  props.type = "economy";
  _internalEventAdd(props);
}

function _getStoredItem(name,def) {
  let ret;
  if (name in window.localStorage) {
    const json = window.localStorage[name];
    try {
      ret = JSON.parse(json);
    } catch(e) {
      _errorLog("Failed to parse:",name,"json:",json);
    }
  }

  if (ret === undefined) {
   if (typeof def == 'function') {
      ret = def();
    } else {
      ret = def;
    }
  }
  return ret;
}
function _setStoredItem(name,value) {
  const json = JSON.stringify(value);
  window.localStorage[name] = json;
}

function _getDeviceTag() {
  let text = _getStoredItem('dc.device_tag',false);
  if (!text) {
    text = _generateRandomString();
    _setStoredItem('dc.device_tag',text);
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
  return text;
}
function _generateRandomString() {
  let text = "";
  const crypto = window.crypto || window.msCrypto;
  if (crypto && crypto.getRandomValues) {
    const array = new Uint32Array(8);
    crypto.getRandomValues(array);
    for (let i = 0 ; i < array.length ; i++) {
      text += array[i].toString(36);
    }
  } else {
    while (text.length < 32) {
      text += Math.random().toString(36).slice(2);
    }
  }
  text = text.slice(0,32);
  return text;
}

function _maybeAddDau() {
  const delta = Date.now() - g_lastDAUTime;
  if (delta > 24*60*60*1000) {
    _internalEventAdd({ type: "dau" });
    g_lastDAUTime = Date.now();
    _setStoredItem('dc.last_dau_time',g_lastDAUTime);
  }
}

function _internalEventAdd(props) {
  props.event_index = g_nextIndex++;
  if (!props.event_datetime) {
    props.event_datetime = (new Date()).toISOString();
  }

  if (g_sessionKey) {
    props.group_tag = g_sessionKey;
  }
  STRING_PROP_LIST.forEach((p) => {
    if (p in props) {
      let val = props[p];
      val.toString().slice(0,32);
      props[p] = val;
    }
  });
  NUMBER_PROP_LIST.forEach((p) => {
    if (p in props) {
      let val = props[p];
      if (typeof val != 'number') {
        val = parseFloat(val);
      }
      if (!isFinite(val)) {
        delete props[val];
      } else {
        props[p] = val;
      }
    }
  });
  props = _pick(props,EVENT_PROP_LIST);
  g_eventList.push(props);
  _setStoredItem('dc.event_list',g_eventList);
  _sendEventsLater();
}

function _sendEventsLater(delay = 0) {
  if (!g_timeout && g_isReady && !g_isSending) {
    g_timeout = window.setTimeout(() => {
      g_timeout = false;
      _sendEvents();
    },delay);
  }
}
function _sendEvents() {
  if (g_isReady && !g_isSending && g_eventList.length > 0) {
    g_isSending = true;

    const bundle = Object.assign({},g_defaultBundle,{
      api_key: g_apiKey,
      app_ver: g_appVer,
      device_tag: g_deviceTag,
    });
    if (g_userTag) {
      bundle.user_tag = g_userTag;
    }
    bundle.events = [];
    let first_event = false;
    g_eventList.some((e) => {
      if (!first_event) {
        first_event = e;
        bundle.events.push(e);
      } else if (first_event.session_key == e.session_key) {
        bundle.events.push(e);
      }
      return bundle.events.length < EVENT_SEND_COUNT;
    });

    const current_time = encodeURIComponent((new Date()).toISOString());
    const url = g_apiBaseUrl
      + '/' + g_orgName + '/1/track'
      + "?current_time=" + current_time;

    const opts = {
      url: url,
      method: 'POST',
      body: bundle,
    };

    _request(opts,(err,status,body) => {
      let remove = true;
      if (err == 'status') {
        if (status == 400) {
          _errorLog("Bad request, please check parameters, error:",body);
        } else if (status == 403) {
          _errorLog("Bad API Key, error:",body);
          g_isReady = false;
        } else if (status == 409) {
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

function _request(args,done) {
  function request_done(...args) {
    done(...args);
    done = () => {};
  }

  const method = args.method;

  let default_headers = {
    'Accept': 'application/json',
  };
  let body = null;
  if (args.body instanceof FormData) {
    body = args.body;
  } else if (args.body) {
    body = JSON.stringify(args.body);
    default_headers['Content-Type'] = 'text/plain';
  }
  const headers = Object.assign({},default_headers,args.headers);

  const url = args.url;
  const xhr = new XMLHttpRequest();

  if (args.timeout) {
    xhr.timeout = args.timeout;
  }

  xhr.onload = (...args) => {
    let status = (xhr.status === 1223) ? 204 : xhr.status;
    let body = false;
    let json = false;
    let err = null;

    body = xhr.response || xhr.responseText;

    if (status < 100 || status > 599) {
      err = new TypeError('Network request failed');
    } else if (status > 399) {
      err = 'status';
    }
    request_done(err,status,body);
  };

  xhr.onerror = (...args) => {
    request_done(new TypeError('Network request failed'));
  };
  xhr.ontimeout = (...args) => {
    request_done("timeout");
  }

  xhr.open(method,url,true);

  _objectEach(headers,(values,name) => {
    if (!Array.isArray(values)) {
      values = [values];
    }
    values.forEach((value) => {
      xhr.setRequestHeader(name, value);
    });
  });

  xhr.send(body);
}


function _removeEvents(event_list) {
  g_eventList = g_eventList.filter(e => {
    return !event_list.some(e2 => {
      return e.event_index == e2.event_index;
    });
  });
  _setStoredItem('dc.event_list',g_eventList);
  _setStoredItem('dc.next_index',g_nextIndex);
}

function _setupDefaultBundle() {
  function regexGet(haystack,regex,def) {
    let ret = def;
    const matches = haystack.match(regex);
    if (matches && matches.length > 1) {
      ret = matches[1];
    }
    return ret;
  }

  const ua = navigator.userAgent

  let os = "unknown";
  let os_ver = "unknown";
  if (ua.indexOf("Win") != -1) {
    os = "windows";
    os_ver = regexGet(ua,/Windows NT ([^ ;)]*)/,"unknown");
  } else if (ua.indexOf("iPhone OS") != -1) {
    os = "ios";
    os_ver = regexGet(ua,/iPhone OS ([^ ;)]*)/,"unknown");
    os_ver = os_ver.replace(/_/g,'.');
  } else if (ua.indexOf("Mac OS X") != -1) {
    os = "mac";
    os_ver = regexGet(ua,/Mac OS X ([^ ;)]*)/,"unknown");
    os_ver = os_ver.replace(/_/g,'.');
    os_ver = os_ver.replace(/\.0$/,'');
  } else if (ua.indexOf("Android") != -1) {
    os = "android";
    os_ver = regexGet(ua,/Android ([^ ;)]*)/,"unknown");
    os_ver = os_ver.replace(/_/g,'.');
  } else if (ua.indexOf("X11") != -1) {
    os = "unix";
  } else if (ua.indexOf("Linux") != -1) {
    os = "linux";
  }

  let browser = "unknown";
  let browser_ver = "unknown";
  if (ua.indexOf("Edge") !== -1) {
    browser = "edge";
    browser_ver = regexGet(ua,/Edge\/([^ ;)]*)/,"unknown");
  } else if (ua.indexOf("Chrome") !== -1) {
    browser = "chrome";
    browser_ver = regexGet(ua,/Chrome\/([^ ;)]*)/,"unknown");
  } else if (ua.indexOf("CriOS") !== -1) {
    browser = "chrome";
    browser_ver = regexGet(ua,/CriOS\/([^ ;)]*)/,"unknown");
  } else if (ua.indexOf("Firefox") !== -1) {
    browser = "firefox";
    browser_ver = regexGet(ua,/Firefox\/([^ ;)]*)/,"unknown");
  } else if (ua.indexOf("Android") !== -1) {
    browser = "android";
    browser_ver = regexGet(ua,/Version\/([^ ;)]*)/,"unknown");
  } else if (ua.indexOf("Safari") !== -1) {
    browser = "safari";
    browser_ver = regexGet(ua,/Version\/([^ ;)]*)/,"unknown");
  } else if (ua.indexOf("Trident") !== -1) {
    browser = "ie";
    browser_ver = regexGet(ua,/rv:([^ ;)]*)/,"unknown");
  } else if (ua.indexOf("MSIE") !== -1) {
    browser = "ie";
    browser_ver = regexGet(ua,/MSIE ([^ ;)]*)/,"unknown");
  } else if (ua.indexOf("MessengerForiOS") !== -1) {
    browser = "fbmessenger";
    browser_ver = regexGet(ua,/FBAV\/([^ ;)]*)/,"unknown");
  } else if (ua.indexOf("FB_IAB/MESSENGER") !== -1) {
    browser = "fbmessenger";
    browser_ver = regexGet(ua,/FBAV\/([^ ;)]*)/,"unknown");
  }

  let device_type = "desktop";
  if (ua.indexOf("iPod") != -1) {
    device_type = "ipod";
  } else if (ua.indexOf("iPhone") != -1) {
    device_type = "iphone";
  } else if (ua.indexOf("iPad") != -1 ) {
    device_type = "ipad";
  } else if (ua.indexOf("Android") != -1 ) {
    if (ua.indexOf("Mobile") != -1) {
      device_type = "android";
    } else {
      device_type = "android_tablet";
    }
  } else if (ua.indexOf("Mobile") != -1) {
    device_type = "mobile";
  }

  g_defaultBundle.os = os;
  g_defaultBundle.os_ver = os_ver;
  g_defaultBundle.browser = browser;
  g_defaultBundle.browser_ver = browser_ver;
  g_defaultBundle.device_type = device_type;
  g_defaultBundle.device_family = device_type;
}

function log() {
  if (!arguments || arguments.length == 0) {
    throw new Error('log must have arguments');
  }
  let log_line = "";
  for (let i = 0 ; i < arguments.length ; i++) {
    const arg = arguments[i];
    if (i > 0) {
      log_line += " ";
    }

    if (_isError(arg)) {
      log_line += arg.stack;
    } else if (typeof arg == 'object') {
      try {
        log_line += JSON.stringify(arg);
      } catch(e) {
        log_line += arg;
      }
    } else {
      log_line += arg;
    }
  }
  logEvent({ log_line });
}

const LOG_NUMBER_PROP_LIST = [
  'repsonse_bytes',
  'response_ms',
];

const LOG_STRING_PROP_MAP = {
  'hostname': 64,
  'filename': 256,
  'log_level': 64,
  'device_tag': 62,
  'user_tag': 62,
  'remote_address': 64,
  'log_line': 65535,
};

const LOG_OTHER_PROP_LIST = [
  'event_datetime',
];

const LOG_PROP_LIST = _union(
  LOG_NUMBER_PROP_LIST,
  Object.keys(LOG_STRING_PROP_MAP),
  LOG_OTHER_PROP_LIST,
);

function logEvent(props) {
  if (!props || typeof props !== 'object') {
    throw new Error('props must be an object.');
  }

  if (!props.event_datetime) {
    props.event_datetime = (new Date()).toISOString();
  }

  _objectEach(LOG_STRING_PROP_MAP,(max_len,p) => {
    if (p in props) {
      let val = props[p];
      val.toString().slice(0,max_len);
      props[p] = val;
    }
  });
  LOG_NUMBER_PROP_LIST.forEach(p => {
    if (p in props) {
      let val = props[p];
      if (typeof val !== 'number') {
        val = parseFloat(val);
      }
      if (!isFinite(val)) {
        delete props[val];
      } else {
        props[p] = val;
      }
    }
  });
  props = _pick(props,LOG_PROP_LIST);
  g_logList.push(props);
  _setStoredItem('dc.log_list',g_logList);
  _sendLogsLater();
}

function _removeLogs(events) {
  g_logList.splice(0,events.length);
  _setStoredItem('dc.log_list',g_logList);
}

function _isError(e) {
  return e && e.stack && e.message
    && typeof e.stack === 'string'
    && typeof e.message === 'string';
}

let g_logTimeout = false;
let g_isLogSending = false;
let g_logDelayCount = 0;

function _sendLogsLater(delay = 0) {
  if (!g_logTimeout && g_isReady && !g_isLogSending) {
    g_logTimeout = window.setTimeout(() => {
      g_logTimeout = false;
      _sendLogs();
    },delay);
  }
}
function _sendLogs() {
  if (g_isReady && !g_isLogSending && g_logList.length > 0) {
    g_isLogSending = true;

    const bundle = Object.assign({},g_defaultBundle,{
      api_key: g_apiKey,
      app_ver: g_appVer,
      device_tag: g_deviceTag,
    });
    if (g_userTag) {
      bundle.user_tag = g_userTag;
    }
    bundle.events = g_logList.slice(0,LOG_SEND_COUNT);

    const url = g_apiBaseUrl + '/' + g_orgName + '/1/app_log'

    const opts = {
      url: url,
      method: 'POST',
      body: bundle,
    };

    _request(opts,(err,status,body) => {
      let remove = true;
      if (err == 'status') {
        if (status == 400) {
          _errorLog("Bad request, please check parameters, error:",body);
        } else if (status == 403) {
          _errorLog("Bad API Key, error:",body);
        } else if (status == 409) {
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
      if (remove) {
        _removeLogs(bundle.events);
      }

      g_isLogSending = false;
      if (g_logList.length > 0) {
        _sendLogsLater(g_logDelayCount * DELAY_MS);
      }
    });
  }
}

function _objectEach(object,callback) {
  Object.keys(object).forEach(key => {
    const value = object[key];
    callback(value,key,object);
  })
}

function _pick(source,keys) {
  const dest = {};
  keys.forEach(key => {
    if (key in source) {
      dest[key] = source[key];
    }
  })
  return dest;
}

function _union() {
  const dest = [];

  for (let i = 0 ; i < arguments.length ; i++) {
    const array = arguments[i];
    Array.prototype.push.apply(dest, array);
  }

  return dest;
}

const DataCortex = {
  init,
  isReady,
  addUserTag,
  event,
  economyEvent,
  log,
  logEvent,
};
window.DataCortex = DataCortex;

export default DataCortex;
