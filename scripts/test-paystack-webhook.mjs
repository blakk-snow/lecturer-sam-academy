/**
 * test-paystack-webhook.mjs — regression tests for the Pro-plan money path
 *
 * Run: npm run test:webhook     (Node 18+ built-in test runner, no new deps)
 *
 * Covers the two things that are easy to get silently wrong:
 *   1. HMAC-SHA512 signature verification, including the "Vercel pre-parsed
 *      the JSON body" case where the raw bytes are unrecoverable.
 *   2. The rule that entitlement is granted by Paystack's verify API, so a
 *      signature-representation mismatch can never block a real payment and a
 *      forged webhook can never grant one.
 *
 * Firebase Admin is not exercised (it needs a real service account); those
 * branches assert the documented fallback instead.
 */

import { test, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import crypto from 'node:crypto';

import {
  resolveRawBody,
  verifySignature,
  verifyTransaction,
  processWebhook,
} from '../api/_paystackWebhook.mjs';
import { PRO_AMOUNT_PESAWA } from '../api/_aiGate.mjs';

const SECRET = 'sk_test_dummy_secret_key';
const REFERENCE = 'lsa-1730000000000-123456';

const chargeSuccess = overrides => ({
  event: 'charge.success',
  data: {
    reference: REFERENCE,
    amount: PRO_AMOUNT_PESAWA,
    currency: 'GHS',
    status: 'success',
    customer: { email: 'teacher@example.com' },
    metadata: { uid: 'firebase-uid-1' },
    ...overrides,
  },
});

const sign = body => crypto.createHmac('sha512', SECRET).update(body, 'utf8').digest('hex');

/** Paystack's verify endpoint responds with { status, message, data }. */
function stubVerify(data, { ok = true, status = 200, throws = false } = {}) {
  const original = globalThis.fetch;
  globalThis.fetch = async () => {
    if (throws) throw new Error('network down');
    return { ok, status, json: async () => ({ status: ok, message: 'Verification successful', data }) };
  };
  return () => { globalThis.fetch = original; };
}

beforeEach(() => { process.env.PAYSTACK_SECRET_KEY = SECRET; });
afterEach(() => { delete process.env.PAYSTACK_SECRET_KEY; });

// ── Raw-body resolution ────────────────────────────────────────────────────────

test('resolveRawBody keeps strings and Buffers byte-exact', () => {
  assert.deepEqual(resolveRawBody('{"a":1}'), { raw: '{"a":1}', exact: true });
  assert.deepEqual(resolveRawBody(Buffer.from('{"a":1}')), { raw: '{"a":1}', exact: true });
});

test('resolveRawBody flags a pre-parsed object as not byte-exact', () => {
  assert.deepEqual(resolveRawBody({ a: 1 }), { raw: '{"a":1}', exact: false });
  assert.deepEqual(resolveRawBody(undefined), { raw: null, exact: false });
});

// ── Signature verification ─────────────────────────────────────────────────────

test('a correct HMAC-SHA512 over the raw body verifies', () => {
  const raw = JSON.stringify(chargeSuccess());
  const result = verifySignature(raw, true, sign(raw), SECRET);
  assert.equal(result.ok, true);
  assert.equal(result.basis, 'raw');
});

test('a tampered body fails verification', () => {
  const raw = JSON.stringify(chargeSuccess());
  const result = verifySignature(`${raw} `, true, sign(raw), SECRET);
  assert.equal(result.ok, false);
  assert.equal(result.basis, 'raw');
});

test('a forged signature of the wrong length is rejected without throwing', () => {
  const raw = JSON.stringify(chargeSuccess());
  assert.equal(verifySignature(raw, true, 'deadbeef', SECRET).ok, false);
  assert.equal(verifySignature(raw, true, undefined, SECRET).basis, 'unavailable');
});

test('signature case is normalised before comparison', () => {
  const raw = JSON.stringify(chargeSuccess());
  assert.equal(verifySignature(raw, true, sign(raw).toUpperCase(), SECRET).ok, true);
});

// ── Paystack verify API ────────────────────────────────────────────────────────

test('verifyTransaction returns the confirmed transaction', async () => {
  const restore = stubVerify({ status: 'success', amount: PRO_AMOUNT_PESAWA, currency: 'GHS' });
  const result = await verifyTransaction(REFERENCE, SECRET);
  restore();
  assert.equal(result.ok, true);
  assert.equal(result.data.status, 'success');
});

test('verifyTransaction reports an unreachable API so the caller can retry', async () => {
  const restore = stubVerify(null, { throws: true });
  const result = await verifyTransaction(REFERENCE, SECRET);
  restore();
  assert.equal(result.ok, false);
  assert.equal(result.unreachable, true);
});

// ── Webhook handling ───────────────────────────────────────────────────────────

test('a missing secret key is a server misconfiguration, not a silent pass', async () => {
  delete process.env.PAYSTACK_SECRET_KEY;
  const result = await processWebhook({ body: JSON.stringify(chargeSuccess()), signature: 'x' });
  assert.equal(result.status, 500);
});

test('invalid JSON is rejected', async () => {
  const result = await processWebhook({ body: 'not json{', signature: 'x' });
  assert.equal(result.status, 400);
});

test('events other than charge.success are acknowledged and ignored', async () => {
  const body = JSON.stringify({ event: 'transfer.success', data: { reference: REFERENCE } });
  const result = await processWebhook({ body, signature: sign(body) });
  assert.equal(result.status, 200);
  assert.equal(result.body.ignored, 'transfer.success');
});

test('a bad signature over the raw body is rejected before any API call', async () => {
  const body = JSON.stringify(chargeSuccess());
  let called = false;
  const original = globalThis.fetch;
  globalThis.fetch = async () => { called = true; throw new Error('should not be called'); };
  const result = await processWebhook({ body, signature: sign(`${body}tampered`) });
  globalThis.fetch = original;
  assert.equal(result.status, 401);
  assert.equal(called, false);
});

test('a transaction Paystack does not confirm as success is ignored', async () => {
  const restore = stubVerify({ status: 'failed', amount: PRO_AMOUNT_PESAWA, currency: 'GHS' });
  const body = JSON.stringify(chargeSuccess());
  const result = await processWebhook({ body, signature: sign(body) });
  restore();
  assert.equal(result.status, 200);
  assert.equal(result.body.ignored, 'status-failed');
});

test('the wrong amount does not activate Pro', async () => {
  const restore = stubVerify({ status: 'success', amount: 100, currency: 'GHS' });
  const body = JSON.stringify(chargeSuccess());
  const result = await processWebhook({ body, signature: sign(body) });
  restore();
  assert.equal(result.status, 200);
  assert.equal(result.body.ignored, 'unexpected-amount');
});

test('the wrong currency does not activate Pro', async () => {
  const restore = stubVerify({ status: 'success', amount: PRO_AMOUNT_PESAWA, currency: 'NGN' });
  const body = JSON.stringify(chargeSuccess());
  const result = await processWebhook({ body, signature: sign(body) });
  restore();
  assert.equal(result.status, 200);
  assert.equal(result.body.ignored, 'unexpected-amount');
});

test('an unreachable verify API answers 502 so Paystack retries', async () => {
  const restore = stubVerify(null, { throws: true });
  const body = JSON.stringify(chargeSuccess());
  const result = await processWebhook({ body, signature: sign(body) });
  restore();
  assert.equal(result.status, 502);
});

// The Vercel case: req.body arrives pre-parsed, so the exact signed bytes are
// unrecoverable. A real, Paystack-confirmed charge must still go through.
test('a pre-parsed body with an unmatched signature still reaches entitlement', async () => {
  const restore = stubVerify({ status: 'success', amount: PRO_AMOUNT_PESAWA, currency: 'GHS' });
  const parsed = chargeSuccess();
  // No signature at all — the platform could not give us the bytes.
  const result = await processWebhook({ body: parsed, signature: undefined });
  restore();
  // Stops at Firebase Admin (no service account in tests), not at the signature.
  assert.equal(result.status, 500);
  assert.match(result.body.error, /Firebase Admin/);
});

test('a pre-parsed body whose re-serialisation happens to match is accepted too', async () => {
  const restore = stubVerify({ status: 'success', amount: PRO_AMOUNT_PESAWA, currency: 'GHS' });
  const parsed = chargeSuccess();
  const result = await processWebhook({
    body: parsed,
    signature: sign(JSON.stringify(parsed)),
  });
  restore();
  assert.equal(result.status, 500);
  assert.match(result.body.error, /Firebase Admin/);
});

test('entitlement requires Firebase Admin to be configured', async () => {
  const restore = stubVerify({ status: 'success', amount: PRO_AMOUNT_PESAWA, currency: 'GHS' });
  const body = JSON.stringify(chargeSuccess());
  const result = await processWebhook({ body, signature: sign(body) });
  restore();
  assert.equal(result.status, 500);
  assert.match(result.body.error, /Firebase Admin/);
});
