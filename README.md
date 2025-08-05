# browser-data-cortex

Data Cortex Browser SDK

## Installation

browser-data-cortex is available through npm/yarn.

```bash
yarn add browser-data-cortex
```

OR you can use an NPM CDN:

```html
<script src="https://cdn.jsdelivr.net/npm/browser-data-cortex@0.0.16/dist/browser-data-cortex.min.js"></script>
```

## Usage

This module provides a global object once loaded at: `window.DataCortex`.
It also can be imported/required:

```javascript
import DataCortex from 'browser-data-cortex';
```

## Initializing the library

Generally you initialize the library as soon as possible once the library is loaded.

```javascript
const opts = {
  api_key: '<your_api_key>',
  org_name: '<your_org_name>',
  app_ver: '<your_app_ver>',
  errorLog: function (...args) {
    // Custom error handling - could send to your own logging service
    console.warn('Custom DC Error:', ...args);
  },
};
window.DataCortex.init(opts);
```

Options:

- api_key: (required) Your DC API key.
- org_name: (required) Your DC org name.
- app_ver: (optional) Your app's version number.
- add_error_handler: (optional) Add a JS error handler and report JS errors. (default: false)
- errorLog: (optional) Custom error logging function. Defaults to console.error with "Data Cortex Error:" prefix.

## Installation and DAU tracking

The library automatically sends an install record once per browser. It tracks
installs through localStorage.

The library also automatically sends dau records daily, also tracked in
localStorage.

## User tracking

If you have a user ID or other identifier you track users by, add this to
Data Cortex to aggregate the user's usage across multiple devices and platforms.

```javascript
window.DataCortex.addUserTag('<your_user_tag>');
```

## Event Tracking

Event tracking is the bulk of the ways you'll use the Data Cortex SDK. Please
refer to your tracking specification for the parameters to use in each event.

```javascript
window.DataCortex.event({
  kingdom: '<kingdom>',
  phylum: '<phylum>',
  class: '<class>',
  order: '<order>',
  family: '<family>',
  genus: '<genus>',
  species: '<species>',
  float1: 123,
  float2: 1.5,
  float3: 100000,
  float4: 0.0,
});
```

## Economy tracking

Economy tracking is very similar to event tracking but adds a few extra
required elements. Specifically `spend_amount` and `spend_currency`. It also
adds an optional `spend_type`.

```javascript
window.DataCortex.economyEvent({
  spend_currency: '<currency_name>',
  spend_amount: 123.456,
  spend_type: '<spend_type>',
  kingdom: '<kingdom>',
  phylum: '<phylum>',
  class: '<class>',
  order: '<order>',
  family: '<family>',
  genus: '<genus>',
  species: '<species>',
  float1: 123,
  float2: 1.5,
  float3: 100000,
  float4: 0.0,
});
```

## Logging

DC also provides application logging. It consumes all it's arguments, stringifies
them and logs them to the backend.

```javascript
window.DataCortex.log('fancy log message');
window.DataCortex.log(
  'this works like console.log!',
  obj,
  my_int,
  my_float,
  my_string
);
```

## Manual Flush

By default, events and logs are sent to the server automatically with a small delay for batching.
If you need to send them immediately (for example, before a page unload), you can call flush():

```javascript
window.DataCortex.flush();
```
