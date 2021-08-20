import fs from 'fs/promises';
import { resolve } from 'path';

import yaml from 'js-yaml';
import fetch from 'node-fetch';

import * as Utils from './utils.js';

//////////////////////////////
// Tests
//////////////////////////////
export async function runAllTests(url, fileOrDir, depth = 0) {
  const dir = await Utils.isDir(fileOrDir);
  const name = Utils.nameFromPath(fileOrDir);

  if (dir) {
    // Don't print the initial dir. 
    if (depth !== 0) {
      Utils.info('  '.repeat(depth) + `-- ${name} --`);
    }
    const entries = await fs.opendir(fileOrDir);

    const dirs = [];

    let firstFile = true;

    // Loop over the files in the dir
    for await (const fileObj of entries) {
      const file = resolve(fileOrDir, fileObj.name);
      const fileIsDir = await Utils.isDir(file);

      // If this is another dir then add it to a "queue" (We do this since we want to process all the files inside BEFORE any dirs)
      if (fileIsDir) {
        dirs.push(file);
      } else {
        if (firstFile) {
          firstFile = false;
        } else {
          console.log('');
        }

        // Run the test files!
        await runTests(url, file, depth + 1);
      }
    }

    // Finally, go over the dirs and check them out
    for (const dir of dirs) {
      await runAllTests(url, dir, depth + 1);
    }
  } else {
    // Run the test file!
    await runTests(url, fileOrDir, depth + 1);
  }
}

export async function runTests(url, file, depth = 1) {
  if (!Utils.isTestFile(file)) return;

  const name = Utils.nameFromPath(file);

  Utils.info('  '.repeat(depth++) + `Testing ${name}`);

  const fileContent = await fs.readFile(file, 'utf8');
  const tests = yaml.load(fileContent).requests;

  // Run all the tests in the file
  for (const testName of Object.keys(tests)) {
    await runTestCase(testName, url, tests[testName], depth);
  }
}

export async function runTestCase(testName, url, testCase, depth) {
  // Request
  const headers = testCase.headers ? Utils.buildHeaders(testCase.headers) : {};
  
  if (testCase.cookies) {
    headers.cookie = Utils.buildCookies(testCase.cookies);
  }

  const options = {
    method: testCase.method ?? 'GET',
    headers,
    body: testCase.body && testCase.method !== 'GET' && testCase.method !== 'HEAD' ? testCase.body : undefined
  };

  const expect = testCase.expect;

  // Do request and test
  await fetch(url + testCase.path, options)
    .then(async (res) => {
      // Status Code
      if (expect.status && res.status !== expect.status) {
        Utils.fail(testName, `Expected status code ${expect.status} but got ${res.status}`, depth);
        return;
      }

      // Body
      if (expect.body) {
        const body = await res.text();

        if (body !== expect.body) {
          Utils.fail(testName, `Expected body '${expect.body}' but got '${body}'`, depth);
          return;
        }
      }

      // Headers
      if (expect.headers) {
        for (const header of expect.headers) {
          const parts = header.split(':', 2);
          const headerName = parts[0].toLowerCase().trim();
          const headerValue = parts.length === 2 ? parts[1].trim() : undefined;

          const resHeader = res.headers.get(headerName);
          if (resHeader) {
            if (parts.length === 2 && headerValue !== resHeader) {
              Utils.fail(testName, `Expected header '${parts[0]}' to be '${headerValue}' but got '${resHeader}'`, depth)
              return;
            } 
          } else {
            Utils.fail(testName, `Expected header '${parts[0]}' but did not get it`, depth);
            return;
          }
        }
      }

      // Cookies
      if (expect.cookies) {
        // Build a cookie object from the response header
        const rawCookies = res.headers.get('set-cookie') ? res.headers.get('set-cookie').split(';') : [];
        const cookies = {};
        for (const rawCookie of rawCookies) {
          const parts = rawCookie.split('=', 2);
          cookies[parts[0]] = parts[1];
        }

        // Go through expected cookies
        for (const expectedCookie of expect.cookies) {
          const parts = expectedCookie.split(':', 2);
          const cookieName = parts[0].trim();
          const cookieValue = parts[1].trim();

          // Fail if the expected cookie does not exist
          if (!cookies[cookieName]) {
            Utils.fail(testName, `Expected cookie '${cookieName}' but did not get it`, depth);
            return;
          }

          if (cookies[cookieName] !== cookieValue) {
            Utils.fail(testName, `Expected cookie '${cookieName}' to be '${cookieValue}' but got '${cookies[cookieName]}'`, depth);
            return;
          }
        }
      }

      // It passed!
      Utils.pass(testName, depth);
    })
    .catch(err => {
      Utils.fail(testName, `HTTP Request failed! ${err.message}`, depth);
    })
}