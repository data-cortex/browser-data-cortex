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

### Modern Build System

The library provides an optimized UMD build that works universally:

- **UMD Build** (`dist/browser-data-cortex.min.js`): Universal module for browsers, works with script tags, ES modules, and CommonJS

#### Using with Modern Bundlers

```javascript
// ES Module import (recommended for bundlers like Webpack, Vite, etc.)
import DataCortex from 'browser-data-cortex';

// CommonJS require (Node.js style)
const DataCortex = require('browser-data-cortex');
```

#### Using with Script Tags

```html
<!-- UMD build for global usage -->
<script src="path/to/browser-data-cortex.min.js"></script>
<script>
  window.DataCortex.init({
    /* options */
  });
</script>

<!-- ES Module import -->
<script type="module">
  import DataCortex from 'path/to/browser-data-cortex.min.js';
  DataCortex.init({
    /* options */
  });
</script>
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
  apiKey: '<your_api_key>',
  orgName: '<your_org_name>',
  appVer: '<your_app_ver>',
  errorLog: function (...args) {
    // Custom error handling - could send to your own logging service
    console.warn('Custom DC Error:', ...args);
  },
};
window.DataCortex.init(opts);
```

Options:

- apiKey: (required) Your DC API key.
- orgName: (required) Your DC org name.
- appVer: (optional) Your app's version number.
- addErrorHandler: (optional) Add a JS error handler and report JS errors. (default: false)
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

## Development

### Building the Library

The library uses Rollup with modern plugins for building:

```bash
# Build both UMD and ES module versions
npm run build

# Build and watch for changes
npm run build:watch
```

### Running Tests

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage
```

### Code Quality

```bash
# Lint the code
npm run lint

# Fix linting issues automatically
npm run lint:fix

# Format code with Prettier
npm run pretty
```

The project uses:

- **ESLint 9.x** with modern flat configuration
- **Prettier** for code formatting
- **Security plugins** for vulnerability detection
- **Import validation** for module consistency

See [LINTING.md](./LINTING.md) for detailed ESLint configuration information.

The build system uses:

- **Rollup 4.x** for bundling
- **Babel** with `@babel/preset-env` for transpilation
- **Terser** for minification
- **Modern browser targets** (> 1%, last 2 versions, not dead)
- **UMD format** for universal compatibility
