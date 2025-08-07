#!/usr/bin/env tsx

/**
 * Quick test runner - runs only essential tests without network calls
 * Designed to complete quickly and reliably
 */

import { spawn } from 'child_process';
import { join } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = join(__filename, '..');

console.log('⚡ Running quick test suite (no network calls)...\n');

function runCommand(command: string, args: string[], timeout: number = 15000): Promise<void> {
  return new Promise((resolve, reject) => {
    console.log(`🔧 Running: ${command} ${args.join(' ')}`);
    
    const child = spawn(command, args, {
      stdio: 'inherit',
      cwd: process.cwd(),
    });

    const timeoutId = setTimeout(() => {
      console.log(`⏰ Command timed out after ${timeout}ms`);
      child.kill('SIGTERM');
      reject(new Error(`Command timed out after ${timeout}ms`));
    }, timeout);

    child.on('close', (code) => {
      clearTimeout(timeoutId);
      if (code === 0) {
        resolve();
      } else {
        reject(new Error(`Command failed with exit code ${code}`));
      }
    });

    child.on('error', (error) => {
      clearTimeout(timeoutId);
      reject(error);
    });
  });
}

async function runQuickTests(): Promise<void> {
  try {
    // 1. Unit tests (no network)
    console.log('📋 Running unit tests...');
    await runCommand('npx', ['tsx', join(__dirname, 'unit.test.ts')], 10000);
    console.log('✅ Unit tests completed\n');

    // 2. Boundary tests (no network)
    console.log('🔬 Running boundary parameter tests...');
    await runCommand('npx', ['tsx', join(__dirname, 'boundary-parameter-test.ts')], 15000);
    console.log('✅ Boundary parameter tests completed\n');

    // 3. User agent tests (mocked network)
    console.log('🔍 Running user agent tests...');
    await runCommand('npx', ['tsx', join(__dirname, 'user-agent-tests.ts')], 10000);
    console.log('✅ User agent tests completed\n');

    // 4. Coverage tests (mocked network)
    console.log('📊 Running coverage tests...');
    await runCommand('npx', ['tsx', join(__dirname, 'coverage.test.ts')], 15000);
    console.log('✅ Coverage tests completed\n');

    console.log('\n🎉 All quick tests completed successfully!');
    console.log('\n📊 Quick Test Summary:');
    console.log('   ✅ Unit Tests: 7 tests');
    console.log('   ✅ Boundary Tests: 8 tests');
    console.log('   ✅ User Agent Tests: 4 tests');
    console.log('   ✅ Coverage Tests: 13 tests');
    console.log('   📈 Total: 32+ tests completed');
    console.log('\n💡 For real API testing, use: npm run test:coverage-real-api');
    
  } catch (error: any) {
    console.error('\n❌ Quick test suite failed:', error.message);
    process.exit(1);
  }
}

// Overall timeout for safety
setTimeout(() => {
  console.log('\n⏰ Quick test suite timed out');
  process.exit(1);
}, 60000); // 1 minute max

runQuickTests()
  .then(() => {
    console.log('\n✨ Quick test suite completed!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n💥 Quick test suite failed:', error.message);
    process.exit(1);
  });

export {};
