#!/usr/bin/env node
import chalk from 'chalk';

import * as Utils from './utils.js';
import { runAllTests } from './test.js';

// CLI
if (process.argv.length !== 4) {
  Utils.error('Usage: requester-tester <url> <file/dir>');
}

const url = process.argv[2];
const fileOrDir = process.argv[3];

await Utils.validateConfigs(fileOrDir);

// Expected output:
/*
Running tests...

  Testing auth...
    Testing login...
      [+] success
      [+] no-email
      [-] no-password

Failed! 3 Tests Ran, 2 Passed and 1 Failed
exit code 1
*/

Utils.info('Running tests...');

await runAllTests(url, fileOrDir);

const { passed, failed } = Utils.tests;

const total = passed + failed;

const msg = `${total} Tests ran, ${passed} passed and ${failed} failed!`
if (failed > 0) {
  console.error(chalk.red(`\nFailed! ${msg}`));
  process.exit(1);
} else {
  Utils.info(`\nPassed! ${msg}`);
}