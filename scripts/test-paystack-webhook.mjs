/**
 * scripts/test-paystack-webhook.mjs — local unit test for the webhook handler
 *
 * Simulates Paystack webhook deliveries with an HMAC-SHA512 signature computed
 * over the exact raw body bytes (the way Paystack signs them), including the
 * PHP-style "\/" and non-ASCII escapes Paystack's encoder emits — the case a
 * JSON re-serialisation approach would silently reject.
 *
 * Run: node scripts/test-paystack-webhook.mjs
 * No network or Firebase access needed (uses a locally generated secret and a
 * non-charge event so Firebase Admin is never initialised).
 */

import crypto from 'crypto';
import assert from 'node:assert/strict';
import { POST } from '../api/paystack-webhook.js';

const SECRET = 'sk_test_' + crypto.randomBytes(24).toString('hex');
process.env.PAYSTACK_SECRET_KEY = SECRET;

function sign(raw) {
  return crypto.createHmac('sha512', SECRET).update(raw).digest('hex');
}

function webhookRequest(raw, signature) {
  const headers = { 'content-type': 'application/json' };
  if (signature !== undefined) headers['x-paystack-signature'] = signature;
  return new Request('http://localhost/api/paystack-webhook', {
    method: 'POST',
    body: raw,
    headers,
  });
}

// Paystack (PHP json_encode) escapes forward slashes and non-ASCII chars.
const rawEvent =
  '{"event":"invoice.create","data":{"url":"https:\\/\\/api.paystack.co\\/v1\\/invoice","name":"Adjo\\u1eb9"}}';

let passed = 0;
async function check(name, fn) {
  await fn();
  passed += 1;
  console.log(`  ✓ ${name}`);
}

await (async () => {
  console.log('paystack-webhook unit tests');

  await check('valid signature over raw bytes (PHP-escaped body) → 200', async () => {
    const res = await POST(webhookRequest(rawEvent, sign(rawEvent)));
    assert.equal(res.status, 200);
    const json = await res.json();
    assert.deepEqual(json, { received: true, ignored: 'invoice.create' });
  });

  await check('old JSON.stringify round-trip would have failed this signature', () => {
    // Demonstrates why the raw-body read is required: re-serialising the
    // parsed body changes the bytes Paystack signed.
    const reSerialised = JSON.stringify(JSON.parse(rawEvent));
    const oldApproach = crypto.createHmac('sha512', SECRET).update(reSerialised).digest('hex');
    assert.notEqual(oldApproach, sign(rawEvent));
  });

  await check('tampered body → 401', async () => {
    const res = await POST(webhookRequest(rawEvent + ' ', sign(rawEvent)));
    assert.equal(res.status, 401);
  });

  await check('missing signature → 401', async () => {
    const res = await POST(webhookRequest(rawEvent));
    assert.equal(res.status, 401);
  });

  await check('malformed JSON with valid signature → 400', async () => {
    const raw = '{not json';
    const res = await POST(webhookRequest(raw, sign(raw)));
    assert.equal(res.status, 400);
  });

  console.log(`\n${passed} checks passed`);
})().catch(err => {
  console.error('\nFAILED:', err.message);
  process.exit(1);
});
