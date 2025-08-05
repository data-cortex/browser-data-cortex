# DataCortex Test Suite

This directory contains comprehensive tests for the browser-data-cortex library using Node.js's built-in test runner and coverage tools.

## Test Files

- `coverage.test.js` - Main test suite with Node.js built-in test runner and coverage analysis
- `unit.test.js` - Custom test runner with comprehensive coverage (legacy)
- `setup.js` - Browser environment setup for Node.js test runner (legacy)
- `simple.test.js` - Simplified test approach (legacy)
- `index.test.js` - Original Node.js test runner attempt (legacy)

## Running Tests

```bash
# Run all tests (custom runner)
yarn test

# Run tests with Node.js built-in coverage
yarn test:coverage

# Generate detailed coverage report
yarn test:coverage-report

# Watch mode for development
yarn test:watch
```

## Coverage Analysis

The test suite uses Node.js's experimental built-in coverage feature (`--experimental-test-coverage`) to provide detailed code coverage analysis.

### Current Coverage Metrics

- **Lines**: 82.87%
- **Branches**: 91.13%
- **Functions**: 80.33%
- **Total Tests**: 57
- **Pass Rate**: 100%

### Coverage Features

1. **Built-in Node.js Coverage**: Uses `node --experimental-test-coverage` for native coverage analysis
2. **Detailed Reports**: Generates both console output and markdown reports
3. **Badge Generation**: Creates coverage badge data for CI/CD integration
4. **Line-by-line Analysis**: Shows exactly which lines are covered/uncovered

## Test Coverage

The test suite covers:

### Core Functionality ✅

- Library initialization with various options
- Device tag generation and management
- User tag management
- Ready state checking

### Event Tracking ✅

- Basic event tracking with all property types
- String property truncation (32 and 64 character limits)
- Number property conversion and validation
- Event indexing and timestamps
- Property validation and error handling

### Economy Events ✅

- Economy event tracking with required fields
- Validation of spend_currency and spend_amount
- Error handling for missing required fields

### Message Send Events ✅

- Message events with to_tag and to_list
- Combining to_tag and to_list arrays
- Validation of from_tag requirement
- Array validation for to_list

### Logging ✅

- Simple message logging
- Multiple argument logging
- Error object logging with stack traces
- Circular reference handling
- Log event tracking with property limits

### Local Storage Integration ✅

- Event persistence in localStorage
- User tag persistence
- State restoration on initialization
- Event index continuation

### Browser Environment Handling ✅

- Crypto API usage and fallback (including msCrypto)
- Navigator user agent detection for multiple browsers
- Custom device tag support
- Custom base URL support

### Network Request Handling ✅

- HTTP error status codes (400, 403, 409, 500)
- Network timeout handling
- Connection error handling
- Special status code handling (1223)
- Request retry logic

### Automatic Events ✅

- Install event generation on first use
- DAU (Daily Active User) event handling

### Edge Cases ✅

- Empty string property handling
- Null and undefined value handling
- Invalid parameter validation
- Error message validation
- Browser detection across different user agents

## Test Environment

The test suite uses Node.js's built-in test runner with:

1. **JSDOM Browser Simulation**: Creates mock implementations of browser APIs
2. **Comprehensive Mocking**: Mocks `window`, `localStorage`, `navigator`, `crypto`, `XMLHttpRequest`, and timer functions
3. **Clean Test Isolation**: Clears localStorage between tests
4. **Property Access Handling**: Uses Proxy objects for localStorage property access patterns

## Coverage Report Generation

The coverage system generates several outputs:

### 1. Console Coverage Report

```bash
yarn test:coverage
```

Shows real-time coverage metrics in TAP format with detailed line-by-line coverage.

### 2. Detailed Coverage Report

```bash
yarn test:coverage-report
```

Generates:

- `COVERAGE_REPORT.md` - Comprehensive markdown report
- `coverage-badge.json` - Badge data for CI/CD systems

### 3. Coverage Badge

The generated badge data can be used with services like shields.io:

```
https://img.shields.io/endpoint?url=<path-to-coverage-badge.json>
```

## Uncovered Code Analysis

The remaining uncovered lines (17.13%) primarily consist of:

1. **Network Request Retry Logic** (lines 323-384, 386-452)
   - Complex retry mechanisms that require real network conditions
   - Timer-based delay logic
   - Connection state management

2. **Browser Detection Edge Cases** (lines 677-728)
   - Rare browser/OS combinations
   - Legacy browser support code
   - Device type detection for uncommon devices

3. **Error Logging Functions** (lines 63-65, 189-190)
   - Console error output functions
   - Debug logging that's hard to test

4. **Timer-based Automatic Events** (lines 513-536)
   - Interval-based DAU checking
   - Automatic retry timers

## Testing Best Practices

The test suite follows these practices:

1. **Comprehensive Mocking**: All browser APIs are properly mocked
2. **Test Isolation**: Each test runs in a clean environment
3. **Error Path Testing**: All error conditions are validated
4. **Edge Case Coverage**: Boundary conditions and invalid inputs tested
5. **Real-world Scenarios**: Tests use actual API patterns and data flows

## Environment Variables

- `DC_API_KEY`: Optional API key for testing (defaults to 'test-key' if not provided)

## Integration with CI/CD

The coverage system is designed for easy CI/CD integration:

```yaml
# Example GitHub Actions
- name: Run Tests with Coverage
  run: yarn test:coverage-report

- name: Upload Coverage Badge
  uses: actions/upload-artifact@v3
  with:
    name: coverage-badge
    path: coverage-badge.json
```

## Future Enhancements

Potential improvements for even higher coverage:

1. **Integration Testing**: Mock network requests to test actual API calls
2. **Timer Testing**: Use fake timers to test automatic event logic
3. **Browser Matrix Testing**: Test across more browser user agent combinations
4. **Performance Testing**: Add benchmarks and memory usage tests
5. **Visual Coverage Reports**: Generate HTML coverage reports
