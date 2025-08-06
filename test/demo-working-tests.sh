#!/bin/bash

echo "🎯 DEMONSTRATION: Real Server Tests Working Correctly"
echo "====================================================="

echo ""
echo "📋 Test 1: Invalid API Key (should FAIL)"
echo "----------------------------------------"
echo "Command: DC_API_KEY=INVALID_KEY node test/real-server-test.js"
echo ""

DC_API_KEY=INVALID_KEY node test/real-server-test.js
INVALID_EXIT_CODE=$?

echo ""
echo "Result: Exit code $INVALID_EXIT_CODE"
if [ $INVALID_EXIT_CODE -eq 1 ]; then
    echo "✅ SUCCESS: Invalid API key test failed as expected"
else
    echo "❌ PROBLEM: Invalid API key test should have failed but didn't"
fi

echo ""
echo "=================================================="
echo ""
echo "📋 Test 2: Valid API Key (should PASS)"
echo "--------------------------------------"
echo "Command: DC_API_KEY=dYlBxjMTYkXadqhnOyHnjo7iGb5bW1y0 node test/real-server-test.js"
echo ""

DC_API_KEY=dYlBxjMTYkXadqhnOyHnjo7iGb5bW1y0 node test/real-server-test.js
VALID_EXIT_CODE=$?

echo ""
echo "Result: Exit code $VALID_EXIT_CODE"
if [ $VALID_EXIT_CODE -eq 0 ]; then
    echo "✅ SUCCESS: Valid API key test passed as expected"
else
    echo "❌ PROBLEM: Valid API key test should have passed but didn't"
fi

echo ""
echo "🎉 FINAL SUMMARY"
echo "================"

if [ $INVALID_EXIT_CODE -eq 1 ] && [ $VALID_EXIT_CODE -eq 0 ]; then
    echo "✅ ALL TESTS WORKING CORRECTLY!"
    echo "   ✅ Invalid API keys cause tests to fail (negative testing works)"
    echo "   ✅ Valid API keys cause tests to pass"
    echo "   ✅ Real server integration is working"
    echo "   ✅ Custom errorLog captures server errors"
    echo "   ✅ Flush triggers immediate HTTP requests"
    echo ""
    echo "🚀 Mission Accomplished: All requested functionality validated!"
    exit 0
else
    echo "❌ TESTS NOT WORKING CORRECTLY"
    echo "   Invalid key exit code: $INVALID_EXIT_CODE (should be 1)"
    echo "   Valid key exit code: $VALID_EXIT_CODE (should be 0)"
    exit 1
fi
