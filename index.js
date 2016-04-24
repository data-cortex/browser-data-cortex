'use strict';

import _ from 'lodash';

const EVENT_SEND_COUNT = 10;
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
];

const EVENT_PROP_LIST = _.union(TAXONOMY_PROP_LIST,
  NUMBER_PROP_LIST,OTHER_PROP_LIST);

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

function _errorLog(...args) {
  console.error("Data Cortex Error:",...args);
}

function init(opts,done) {
  if (!done) {
    done = function() {};
  }
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
    array.forEach((e) => {
      text += e.toString(36);
    });
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
  if (g_lastDAUTime > 24*60*60*1000) {
    _internalEventAdd({ type: "dau" });
    g_lastDAUTime = Date.now();
    _setStoredItem('dc.last_dau_time',g_lastDAUTime);
  }
}

function _internalEventAdd(props) {
  props.event_index = g_nextIndex++;

  if (g_sessionKey) {
    props.group_tag = g_sessionKey;
  }
  _.each(STRING_PROPERTY_LIST,(p) => {
    if (p in props) {
      let val = props[p];
      val.toString().slice(0,32);
      props[p] = val;
    }
  });
  _.each(NUMBER_PROPERTY_LIST,(p) => {
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
  props = _.pick(props,EVENT_PROP_LIST);
  g_eventList.push(props);
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

    const bundle = _.extend({},g_defaultBundle,{
      api_key: g_apiKey,
      app_ver: g_appVer,
    });
    if (g_userTag) {
      bundle.user_tag = g_userTag;
    }
    bundle.events = [];
    let first_event = false;
    _.some((e) => {
      if (!first_event) {
        first_event = e;
        bundle.events.push(e);
      } else if (first_event.session_key == e.session_key) {
        bundle.events.push(e);
      });
      return bundle.events.length < EVENT_SEND_COUNT;
    });

    const url = 'https://api.data-cortex.com/' + g_orgName + '/1/track'

    const opts = {
      url: url,
      method: 'POST',
      body: bundle,
    };

    _request(bundle,(err,status,body) => {
      let remove = true;
      if (err == 'status') {
        if (status == 400) {
          errorLog("Bad request, please check parameters, error:",body);
        } else if (status == 403) {
          errorLog("Bad API Key, error:",body);
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
    default_headers['Content-Type'] = 'application/json';
  }
  const headers = _.extend({},default_headers,args.headers);

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

  _.each(headers,(values,name) => {
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
  g_eventList = _.filter(g_eventList,(e) => {
    return !_.some(event_list,(e2) => {
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
  if (ua.indexOf("Chrome") != -1) {
    browser = "chrome";
    browser_ver = regexGet(ua,/Chrome\/([^ ;)]*)/,"unknown");
  } else if (ua.indexOf("CriOS") != -1) {
    browser = "chrome";
    browser_ver = regexGet(ua,/CriOS\/([^ ;)]*)/,"unknown");
  } else if (ua.indexOf("Firefox") != -1) {
    browser = "firefox";
    browser_ver = regexGet(ua,/Firefox\/([^ ;)]*)/,"unknown");
  } else if (ua.indexOf("Android") != -1) {
    browser = "android";
    browser_ver = regexGet(ua,/Version\/([^ ;)]*)/,"unknown");
  } else if (ua.indexOf("Safari") != -1) {
    browser = "safari";
    browser_ver = regexGet(ua,/Version\/([^ ;)]*)/,"unknown");
  } else if (ua.indexOf("Trident") != -1) {
    browser = "ie";
    browser_ver = regexGet(ua,/rv:([^ ;)]*)/,"unknown");
  } else if (ua.indexOf("MSIE") != -1) {
    browser = "ie";
    browser_ver = regexGet(ua,/MSIE ([^ ;)]*)/,"unknown");
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
  }

  g_defaultBundle.os = os;
  g_defaultBundle.os_ver = os_ver;
  g_defaultBundle.browser = browser;
  g_defaultBundle.browser_ver = browser_ver;
  g_defaultBundle.device_type = device_type;
}

export default {
  init,
  isReady,
  addUserTag,
  event,
  economyEvent,
};
