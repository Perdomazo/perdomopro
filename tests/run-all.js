import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const TESTS_ROOT = __dirname;

function findTestFiles(dir) {
  const files = [];
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory() && entry.name !== 'helpers') {
      files.push(...findTestFiles(fullPath));
    } else if (entry.isFile() && entry.name.endsWith('.test.js')) {
      files.push(fullPath);
    }
  }
  return files.sort();
}

console.log('='.repeat(70));
console.log('PerdomoPro E2E Test Suite Runner (Node.js Test Runner / Node v24)');
console.log('='.repeat(70));

const testFiles = findTestFiles(TESTS_ROOT);
let totalPassed = 0;
let totalFailed = 0;
const failureDetails = [];

for (const file of testFiles) {
  const relPath = path.relative(path.resolve(TESTS_ROOT, '..'), file);
  process.stdout.write(`• Running ${relPath} ... `);
  
  const result = spawnSync(process.execPath, ['--test', '--test-reporter=spec', file], {
    encoding: 'utf8',
  });

  const passMatch = result.stdout.match(/ℹ pass (\d+)/);
  const failMatch = result.stdout.match(/ℹ fail (\d+)/);
  const passed = passMatch ? parseInt(passMatch[1], 10) : 0;
  const failed = failMatch ? parseInt(failMatch[1], 10) : 0;

  totalPassed += passed;
  totalFailed += failed;

  if (failed === 0) {
    console.log(`\x1b[32mPASS\x1b[0m (${passed} passed)`);
  } else {
    console.log(`\x1b[31mFAIL\x1b[0m (${passed} passed, ${failed} failed)`);
    failureDetails.push({ file: relPath, stdout: result.stdout, stderr: result.stderr });
  }
}

console.log('-'.repeat(70));
console.log(`Summary: Total Tests: ${totalPassed + totalFailed} | Passed: ${totalPassed} | Failed: ${totalFailed}`);
console.log('='.repeat(70));

if (failureDetails.length > 0) {
  console.log('\nFailing Test Details:');
  for (const failure of failureDetails) {
    console.log(`\n--- ${failure.file} ---`);
    console.log(failure.stdout);
  }
  process.exit(1);
} else {
  console.log('\nAll E2E test suites passed successfully!');
  process.exit(0);
}
