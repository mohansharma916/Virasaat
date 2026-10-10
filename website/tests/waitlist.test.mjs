import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createServer } from 'node:http';
import { test } from 'node:test';
import vm from 'node:vm';
import ts from 'typescript';

const source = readFileSync(new URL('../src/lib/waitlist.ts', import.meta.url), 'utf8');
const compiled = ts.transpileModule(source, {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
}).outputText;
const exports = {};
vm.runInNewContext(compiled, {
  exports, process: { env: {} }, fetch, AbortController, setTimeout, clearTimeout, Error,
});
const { submitWaitlist } = exports;
const signup = { email: ' AUDIT@EXAMPLE.INVALID ', fullName: ' Audit Example ', country: 'India', platform: 'Google Android' };

test('failed responses never create a confirmed reservation', async (context) => {
  for (const status of [400, 429, 500, 503]) {
    await context.test(`HTTP ${status}`, async () => {
      await assert.rejects(submitWaitlist(signup, 'https://example.invalid/waitlist', async () => new Response('{}', { status })), /could not be confirmed/);
    });
  }
});

test('missing configuration and network failures remain retryable errors', async () => {
  await assert.rejects(submitWaitlist(signup), /temporarily unavailable/);
  await assert.rejects(submitWaitlist(signup, 'https://example.invalid', async () => { throw new TypeError('Network failure'); }), /connection and retry/);
});

test('a success response must contain an acknowledged, positive integer queue number', async () => {
  for (const body of [{}, { success: false, queueNumber: 72 }, { success: true }, { success: true, queueNumber: '72' }, { success: true, queueNumber: 0 }, { success: true, queueNumber: 1.5 }, { success: true, queueNumber: Number.MAX_SAFE_INTEGER + 1 }]) {
    await assert.rejects(submitWaitlist(signup, 'https://example.invalid', async () => Response.json(body)), /could not be confirmed/);
  }
  await assert.rejects(submitWaitlist(signup, 'https://example.invalid', async () => new Response('invalid JSON')), /could not connect/);
});

test('a local HTTP mock accepts normalized input; a retry only succeeds after acknowledgement', async () => {
  let attempts = 0;
  const bodies = [];
  const server = createServer((request, response) => {
    let body = '';
    request.on('data', (chunk) => { body += chunk; });
    request.on('end', () => {
      bodies.push(JSON.parse(body));
      attempts += 1;
      response.writeHead(attempts === 1 ? 503 : 201, { 'content-type': 'application/json' });
      response.end(JSON.stringify(attempts === 1 ? {} : { success: true, queueNumber: 83 }));
    });
  });
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
  try {
    const endpoint = `http://127.0.0.1:${server.address().port}/waitlist`;
    await assert.rejects(submitWaitlist(signup, endpoint), /could not be confirmed/);
    const result = await submitWaitlist(signup, endpoint);
    assert.equal(result.queueNumber, 83);
    assert.equal(result.email, 'audit@example.invalid');
    assert.equal(result.fullName, 'Audit Example');
    assert.equal(bodies[1].source, 'modal_waitlist');
    assert.equal(attempts, 2);
  } finally {
    server.closeAllConnections();
    await new Promise((resolve, reject) => server.close((error) => error ? reject(error) : resolve()));
  }
});
