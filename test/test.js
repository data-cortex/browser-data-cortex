
const TESTS = [
  { id: "throw1", event: null, result: "throw" },
  { id: "throw2", event: undefined, result: "throw" },
  { id: "event_pass_empty", event: {}, result: {} },
  { id: "event_pass_float1", event: { float1: "foo" }, result: {} },
  { id: "event_pass_float2", event: { float1: 1 }, result: { float1: 1 } },
  { id: "event_pass_float3", event: { float1: undefined }, result: {} },
  { id: "event_pass_float4", event: { float1: null }, result: {} },
  { id: "event_pass_string1", event: { kingdom: "foo" }, result: { kingdom: "foo" } },
  { id: "event_pass_string2", event: { kingdom: 1 }, result: { kingdom: "1" } },
  { id: "event_pass_string3", event: { kingdom: undefined }, result: {} },
  { id: "event_pass_string4", event: { kingdom: null }, result: {} },
  { id: "throw4", economy: undefined, result: "throw" },
  { id: "throw4", economy: null, result: "throw" },
];

const EQUAL_PROPS = [
  "kingdom",
  "phylum",
  "class",
  "order",
  "family",
  "genus",
  "species",
  "float1",
  "float2",
  "float3",
  "float4",
  "spend_amount",
  "spend_type",
  "spend_currency",
];

let g_count;
let g_passCount;
let g_failCount;

window.onload = _onLoad;
function _onLoad() {
  const opts = {
    api_key: "dYlBxjMTYkXadqhnOyHnjo7iGb5bW1y0",
    org_name: "test",
  };
  DataCortex.init(opts);

  runAll();
}

function runAll() {
  log("");
  log("-------------------------------------");
  log("RUNALL: START");

  g_count = 0;
  g_passCount = 0;
  g_failCount = 0;
  TESTS.forEach(runTest);

  log("");
  log("-------------------------------------");
  log(`RUN_ALL: DONE: Tests: ${g_count}, pass: ${g_passCount}, fail: ${g_failCount}`);
  log("-------------------------------------");
  log("");
}
window.runAll = runAll;


function runTest(test) {
  const { id, result } = test;

  log("-----");
  log(`Test: ${id}: START`);

  g_count++;

  let actual;
  try {
    if ('event' in test) {
      log("  event:",test.event);
      actual = DataCortex.event(test.event);
    } else if ('economy' in test) {
      log("  economy:",test.economy);
      actual = DataCortex.economyEvent(test.economy);
    } else {
      log("  unknown ?!?!");
      actual = "unknown";
    }
    log("  result:",actual);
  } catch (e) {
    log("  throw:",e);
    actual = "throw";
  }

  if (_testEqual(result,actual)) {
    g_passCount++;
    log(`Test: ${id}: PASS:`,result);
  } else {
    g_failCount++;
    log(`Test: ${id}: FAIL: expect:`,result,"got:",actual);
  }
}

function _testEqual(a,b) {
  let ret = false;
  if (a === b) {
    ret = true;
  } else if (typeof a === 'object' && typeof b === 'object') {
    ret = EQUAL_PROPS.every(prop => a[prop] === b[prop]);
  }
  return ret;
}

function log() {
  let s = ""
  for( let i = 0; i < arguments.length ; i++) {
    const a = arguments[i];
    if (i > 0) {
      s += " ";
    }
    if (typeof a === 'object') {
      if (a instanceof Error) {
        s += a.message;
      } else {
        s += JSON.stringify(a);
      }
    } else {
      s += a;
    }
  }
  console.log(s);
  return s;
}
