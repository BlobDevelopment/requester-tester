import fs from 'fs/promises';
import { sep, resolve } from 'path';

import chalk from 'chalk';
import yaml from 'js-yaml';

export const tests = { passed: 0, failed: 0};

//////////////////////////////
// Logging
//////////////////////////////
export function info(msg) {
  console.log(msg);
}

export function error(msg) {
  console.error(chalk.red('[ERROR] ' + msg));
  process.exit(1);
}

export function pass(test, depth = 1) {
  console.log('  '.repeat(depth) + `[${chalk.green('+')}} ${test}`);

  tests.passed = tests.passed + 1;
}

export function fail(test, msg, depth = 1) {
  console.log('  '.repeat(depth) + `[${chalk.red('-')}} ${test}`);
  console.log('  '.repeat(depth + 1) + chalk.red(msg));

  tests.failed = tests.failed + 1;
}

//////////////////////////////
// Main util methods
//////////////////////////////
export async function isDir(file) {
  const stat = await fs.lstat(file)
    .catch(err => {
      error(err);
    });

  
  return stat.isDirectory();
}

export async function isTestFile(file) {
  // Make sure it's a YAML file
  if (!file.endsWith('.yml') && !file.endsWith('.yaml')) {
    return false;
  }

  // Make sure it isn't a dir
  return !isDir(file);
}

export function nameFromPath(path) {
  return path.substring(path.lastIndexOf(sep) + 1);
}

export function buildHeaders(headers) {
  let obj = {};
  for (const header of headers) {
    const keyValue = header.split(':', 2);

    obj[keyValue[0]] = keyValue[1];
  }
  return obj;
}

export function buildCookies(cookies) {
  let obj = '';
  for (const cookie of cookies) {
    const keyValue = cookie.split(':', 2);

    obj += `${keyValue[0]}=${keyValue[1].trim()}; `;
  }
  return obj.trim();
}

//////////////////////////////
// Validations
//////////////////////////////
export async function validateFile(file) {
  const fileContent = await fs.readFile(file, 'utf8');
  const doc = yaml.load(fileContent);

  if (doc.requests === undefined || doc.requests === null) {
    error(`${file} is missing the top-level 'requests' node!`);
  }

  const tests = Object.keys(doc.requests);
  if (tests === 0) {
    return;
  }

  for (const testName of tests) {
    const test = doc.requests[testName];

    if (test.path === undefined || test.path === null) {
      error(`${file} is missing 'path' in the ${testName} test!`);
    }

    if (test.expect === undefined || test.expect === null) {
      error(`${file} is missing 'expect' in the ${testName} test!`);
    }

    const expectations = Object.keys(test.expect);

    if (expectations === 0) {
      error(`${file} is missing expectations in the ${testName} test!`);
    }
  }
}

export async function validateConfigs(fileOrDir) {
  const dir = await isDir(fileOrDir);

  if (dir) {
    const entries = await fs.opendir(fileOrDir);

    for await (const fileObj of entries) {
      const file = resolve(fileOrDir, fileObj.name);
      const fileIsDir = await isDir(file);

      if (fileIsDir) {
        validateConfigs(file);
      } else {
        await validateFile(file);
      }
    }
  } else {
    validateFile(fileOrDir);
  }
}