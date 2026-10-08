/**
 * test-ai-gate.mjs — regression tests for the AI auth + quota gate
 *
 * Run: npm run test:gate      (Node 18+ built-in test runner, no new deps)
 *
 * The gate is what stops a stranger from spending the OpenRouter balance, so
 * the behaviour that matters most is what happens when it CANNOT verify
 * anything — a missing or malformed FIREBASE_SERVICE_ACCOUNT. That must fail
 * closed on a production runtime and fail open only for `node server.js`.
 *
 * Token verification and the Firestore counter are not exercised here: they
 * need a real service-account key and a live project.
 */

import { test, afterEach } from 'node:test';
import assert from 'node:assert/strict';

import { enforcementRequired, gateAiRequest, FREE_MONTHLY_LIMIT } from '../api/_aiGate.mjs';

const ENV_KEYS = ['VERCEL', 'NODE_ENV', 'FIREBASE_SERVICE_ACCOUNT'];
const saved = {};

function setEnv(vars) {
  for (const key of ENV_KEYS) {
    saved[key] = process.env[key];
    delete process.env[key];
  }
  Object.assign(process.env, vars);
}

afterEach(() => {
  for (const key of ENV_KEYS) {
    if (saved[key] === undefined) delete process.env[key];
    else process.env[key] = saved[key];
  }
});

test('the free plan allows a known number of generations per month', () => {
  assert.equal(FREE_MONTHLY_LIMIT, 10);
});

// ── Which runtime requires enforcement ─────────────────────────────────────────

test('Vercel requires enforcement', () => {
  setEnv({ VERCEL: '1' });
  assert.equal(enforcementRequired(), true);
});

test('NODE_ENV=production requires enforcement', () => {
  setEnv({ NODE_ENV: 'production' });
  assert.equal(enforcementRequired(), true);
});

test('plain local node does not require enforcement', () => {
  setEnv({});
  assert.equal(enforcementRequired(), false);
});

// ── Behaviour when Firebase Admin cannot be initialised ────────────────────────

test('a production runtime with no service account fails CLOSED', async () => {
  setEnv({ VERCEL: '1' });
  const result = await gateAiRequest('Bearer some-token');
  assert.equal(result.status, 503);
  assert.equal(result.body.error.code, 'service-unavailable');
});

test('a malformed service account also fails closed in production', async () => {
  setEnv({ VERCEL: '1', FIREBASE_SERVICE_ACCOUNT: '{not valid json' });
  const result = await gateAiRequest(undefined);
  assert.equal(result.status, 503);
});

test('a production runtime never serves unauthenticated AI', async () => {
  setEnv({ NODE_ENV: 'production' });
  const result = await gateAiRequest(undefined);
  assert.notEqual(result.status, 200);
});

test('local development without a service account still works', async () => {
  setEnv({});
  const result = await gateAiRequest(undefined);
  assert.equal(result.status, 200);
  assert.equal(result.uid, null);
});
