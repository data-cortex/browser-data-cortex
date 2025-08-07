#!/usr/bin/env tsx

/**
 * Comprehensive test runner for browser-data-cortex
 *
 * This script runs all tests in sequence and provides coverage analysis:
 * 1. Unit tests (37 tests) - Core functionality testing
 * 2. Boundary parameter tests - Min/max parameter validation
 * 3. Real server tests - API key validation against live server
 * 4. Comprehensive server tests - All API endpoints validation
 * 5. Coverage analysis - Code coverage report
 *
 * Usage: yarn test
 */

import { spawn } from 'child_process';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

console.log('🧪 Running comprehensive test suite with coverage...\n');

// Function to run a command and return a promise
function runCommand(command: string, args: string[], options: any = {}): Promise<void> {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, {
      stdio: 'inherit',
      ...options,
    });

    child.on('close', (code) => {
      if (code === 0) {
        resolve();
      } else {
        reject(new Error(`Command failed with exit code ${code}`));
      }
    });

    child.on('error', (error) => {
      reject(error);
    });
  });
}

// Function to run a command and capture output
function runCommandWithOutput(command: string, args: string[], options: any = {}): Promise<{code: number | null, stdout: string, stderr: string}> {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, {
      stdio: ['inherit', 'pipe', 'pipe'],
      ...options,
    });

    let stdout = '';
    let stderr = '';

    child.stdout?.on('data', (data) => {
      stdout += data.toString();
    });

    child.stderr?.on('data', (data) => {
      stderr += data.toString();
    });

    child.on('close', (code) => {
      resolve({ code, stdout, stderr });
    });

    child.on('error', (error) => {
      reject(error);
    });
  });
}

async function runAllTests(): Promise<void> {
  try {
    // 1. Run unit tests
    console.log('📋 Running unit tests...');
    await runCommand('tsx', [join(__dirname, 'unit.test.ts')]);
    console.log('✅ Unit tests completed\n');

    // 2. Run boundary parameter tests
    console.log('🔬 Running boundary parameter tests...');
    await runCommand('tsx', [join(__dirname, 'boundary-parameter-test.ts')]);
    console.log('✅ Boundary parameter tests completed\n');

    // 3. Run real server tests
    console.log('🌐 Running real server tests...');
    await runCommand('tsx', [join(__dirname, 'real-server-test.ts')]);
    console.log('✅ Real server tests completed\n');

    // 4. Run user agent parsing tests
    console.log('🔍 Running user agent parsing tests...');
    await runCommand('tsx', [join(__dirname, 'user-agent-tests.ts')]);
    console.log('✅ User agent parsing tests completed\n');

    // 5. Run comprehensive real server tests
    console.log('🎯 Running comprehensive real server tests...');
    await runCommand('tsx', [
      join(__dirname, 'comprehensive-real-server-test.ts'),
    ]);
    console.log('✅ Comprehensive real server tests completed\n');

    // 6. Generate coverage report
    console.log('📊 Generating coverage report...');
    const coverageResult = await runCommandWithOutput('node', [
      '--experimental-test-coverage',
      join(__dirname, 'coverage.test.js'),
    ]);

    // Extract and display coverage information
    const output = coverageResult.stdout + coverageResult.stderr;
    const coverageStart = output.indexOf('start of coverage report');
    const coverageEnd = output.indexOf('end of coverage report');

    if (coverageStart !== -1 && coverageEnd !== -1) {
      const coverageReport = output.substring(
        coverageStart,
        coverageEnd + 'end of coverage report'.length
      );
      console.log('\n' + coverageReport);
    } else {
      // Fallback: show test summary
      const testSummary = output.match(
        /# tests \d+[\s\S]*?# duration_ms [\d.]+/
      );
      if (testSummary) {
        console.log('\n📈 Test Summary:');
        console.log(testSummary[0]);
      }
    }

    console.log('\n🎉 All tests completed successfully!');
  } catch (error: any) {
    console.error('\n❌ Test suite failed:', error.message);
    process.exit(1);
  }
}

runAllTests();
