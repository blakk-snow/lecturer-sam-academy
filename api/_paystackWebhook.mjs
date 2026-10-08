/**
 * _paystackWebhook.mjs — shared Paystack charge.success handler
 *
 * Used by both api/paystack-webhook.js (Vercel) and server.js (dev) so the
 * money path lives in one place and can be tested locally against the real
 * signature algorithm.
 *
 * Two independent checks, by design:
 *
 *  1. `x-paystack-signature` — HMAC-SHA512 of the RAW request body, keyed
 *     with PAYSTACK_SECRET_KEY. This is only trustworthy when the exact
 *     bytes Paystack sent are available. Vercel pre-parses JSON bodies for
 *     Node functions, so `JSON.stringify(req.body)` may not reproduce them
 *     (whitespace, key order, unicode escapes, number formatting). A
 *     re-serialised match is therefore treated as *inconclusive*, not as
 *     proof, and never as a reason to reject a real payment on its own.
 *
 *  2. `GET /transaction/verify/{reference}` — Paystack's own authoritative
 *     confirmation that the reference exists on THIS account, is
 *     `success`, and carries the expected amount and currency. A forger
 *     cannot produce one, so this is what actually gates entitlement.
 *
 * Entitlement is granted only when (2) succeeds. (1) is used to reject
 * obvious tampering early when the raw bytes are available.
 *
 * Writes:
 *   /payments/{reference}  → audit + idempotency record (client access denied
 *                            by firestore.rules' default-deny)
 *   /users/{uid}/usage     → { plan: 'pro', proExpiresAt } (renewal-aware)
 */

import crypto from 'crypto';
import { initFirebaseAdmin, PRO_AMOUNT_PESAWA } from './_aiGate.mjs';

const PRO_DURATION_MS = 30 * 24 * 60 * 60 * 1000; // 30 days
const PAYSTACK_API = 'https://api.paystack.co';
const EXPECTED_CURRENCY = 'GHS';

/**
 * Recover the raw body, tracking whether it is byte-exact.
 * @param {string|Buffer|object|null|undefined} body
 * @returns {{ raw: string|null, exact: boolean }}
 */
export function resolveRawBody(body) {
  if (typeof body === 'string') return { raw: body, exact: true };
  if (Buffer.isBuffer(body)) return { raw: body.toString('utf8'), exact: true };
  if (body && typeof body === 'object') return { raw: JSON.stringify(body), exact: false };
  return { raw: null, exact: false };
}

/**
 * Constant-time HMAC-SHA512 check of a Paystack signature.
 * @returns {{ ok: boolean, basis: 'raw'|'reserialised'|'unavailable' }}
 */
export function verifySignature(raw, exact, signature, secret) {
  if (!raw || !signature || !secret) return { ok: false, basis: 'unavailable' };
  const expected = crypto.createHmac('sha512', secret).update(raw, 'utf8').digest('hex');
  const a = Buffer.from(expected, 'utf8');
  const b = Buffer.from(String(signature).trim().toLowerCase(), 'utf8');
  const basis = exact ? 'raw' : 'reserialised';
  if (a.length !== b.length) return { ok: false, basis };
  return { ok: crypto.timingSafeEqual(a, b), basis };
}

/**
 * Ask Paystack to confirm the transaction — the authoritative check.
 * @returns {Promise<{ ok: boolean, status?: number, data?: object, error?: string, unreachable?: boolean }>}
 */
export async function verifyTransaction(reference, secret) {
  let res;
  try {
    res = await fetch(`${PAYSTACK_API}/transaction/verify/${encodeURIComponent(reference)}`, {
      headers: { Authorization: `Bearer ${secret}` },
    });
  } catch (err) {
    return { ok: false, unreachable: true, error: err.message };
  }

  const payload = await res.json().catch(() => ({}));
  if (!res.ok) {
    return { ok: false, status: res.status, error: payload.message ?? `Paystack responded ${res.status}` };
  }
  return { ok: true, data: payload.data ?? {} };
}

/**
 * Grant or renew Pro for a uid, recording the payment for idempotency.
 *
 * The read-modify-write happens inside one Firestore transaction, so two
 * concurrent redeliveries of the same reference cannot both extend the plan.
 * @returns {Promise<{ applied: boolean, proExpiresAt?: number }>}
 */
async function applyProPlan(app, { uid, email, reference, amount, currency }) {
  const db = app.firestore();
  const usageRef = db.doc(`users/${uid}/usage`);
  const paymentRef = db.doc(`payments/${reference}`);
  const now = Date.now();

  return db.runTransaction(async tx => {
    const [paymentSnap, usageSnap] = await Promise.all([tx.get(paymentRef), tx.get(usageRef)]);

    if (paymentSnap.exists && paymentSnap.data().status === 'applied') {
      return { applied: false };
    }

    const usage = usageSnap.exists ? usageSnap.data() : {};

    // Renewal: stack 30 days on top of an unexpired Pro period.
    const stillPro = usage.plan === 'pro' && usage.proExpiresAt > now;
    const proExpiresAt = (stillPro ? usage.proExpiresAt : now) + PRO_DURATION_MS;

    tx.set(usageRef, { plan: 'pro', proExpiresAt, updatedAt: now }, { merge: true });
    tx.set(paymentRef, {
      reference,
      uid,
      email: email ?? null,
      amount,
      currency,
      plan: 'pro-monthly',
      status: 'applied',
      proExpiresAt,
      processedAt: now,
    }, { merge: true });

    return { applied: true, proExpiresAt };
  });
}

/**
 * Process one webhook delivery.
 *
 * @param {object} opts
 * @param {string|Buffer|object} opts.body - req.body (string/Buffer = raw)
 * @param {string} [opts.signature] - the x-paystack-signature header
 * @returns {Promise<{ status: number, body: object }>}
 */
export async function processWebhook({ body, signature }) {
  const secret = process.env.PAYSTACK_SECRET_KEY;
  if (!secret) {
    return { status: 500, body: { error: 'PAYSTACK_SECRET_KEY is not configured' } };
  }

  // ── Parse ────────────────────────────────────────────────────────────────
  const { raw, exact } = resolveRawBody(body);
  let event;
  try {
    event = raw ? JSON.parse(raw) : null;
  } catch {
    return { status: 400, body: { error: 'Invalid JSON body' } };
  }
  if (!event || typeof event !== 'object') {
    return { status: 400, body: { error: 'Empty body' } };
  }

  // ── Ignore everything except successful charges ──────────────────────────
  if (event.event !== 'charge.success') {
    return { status: 200, body: { received: true, ignored: event.event ?? 'unknown-event' } };
  }

  const reference = event.data?.reference;
  if (!reference) {
    return { status: 200, body: { received: true, ignored: 'no-reference' } };
  }

  // ── Check 1: signature (fast reject when the bytes are trustworthy) ──────
  const sig = verifySignature(raw, exact, signature, secret);
  if (sig.basis === 'raw' && !sig.ok) {
    console.error(`[paystack] rejected ${reference}: signature mismatch on the raw body`);
    return { status: 401, body: { error: 'Invalid signature' } };
  }
  if (sig.basis === 'reserialised') {
    console.warn(
      `[paystack] ${reference}: raw body unavailable (platform pre-parsed JSON) — signature ` +
      `${sig.ok ? 'matched the re-serialised body; ' : 'did NOT match the re-serialised body; '}relying on the verify API.`,
    );
  }

  // ── Check 2: authoritative verification with Paystack ────────────────────
  const verified = await verifyTransaction(reference, secret);
  if (verified.unreachable) {
    console.error(`[paystack] could not reach Paystack for ${reference}:`, verified.error);
    // 500 → Paystack retries (every 3 min ×4, then hourly up to 72 h).
    return { status: 502, body: { error: 'Could not verify with Paystack', detail: verified.error } };
  }
  if (!verified.ok) {
    console.error(`[paystack] verification failed for ${reference}:`, verified.error);
    return { status: 200, body: { received: true, ignored: 'verification-failed', detail: verified.error } };
  }

  const charge = verified.data;
  if (charge.status !== 'success') {
    return { status: 200, body: { received: true, ignored: `status-${charge.status}` } };
  }
  if (charge.amount !== PRO_AMOUNT_PESAWA || charge.currency !== EXPECTED_CURRENCY) {
    console.warn(`[paystack] ${reference}: unexpected ${charge.amount} ${charge.currency} — not activating Pro`);
    return {
      status: 200,
      body: { received: true, ignored: 'unexpected-amount', amount: charge.amount, currency: charge.currency },
    };
  }

  // ── Resolve the account ──────────────────────────────────────────────────
  const app = await initFirebaseAdmin();
  if (!app) {
    console.error('[paystack] Firebase Admin unavailable — cannot activate the plan');
    return { status: 500, body: { error: 'Firebase Admin unavailable' } };
  }

  // Prefer the uid we attached to the checkout metadata; fall back to the
  // payer's email (a teacher may pay from an address that is not on the account).
  const metaUid = charge.metadata?.uid || event.data?.metadata?.uid;
  const email = charge.customer?.email ?? event.data?.customer?.email ?? null;

  // Idempotency fast path — Paystack redelivers, so never apply twice. The
  // authoritative check is inside applyProPlan's transaction, which also
  // covers two deliveries racing each other.
  const paymentRef = app.firestore().doc(`payments/${reference}`);
  const existing = await paymentRef.get();
  if (existing.exists && existing.data().status === 'applied') {
    return { status: 200, body: { received: true, alreadyApplied: reference } };
  }

  let uid = typeof metaUid === 'string' && metaUid ? metaUid : null;
  if (uid) {
    try {
      await app.auth().getUser(uid); // confirm the uid is real
    } catch {
      console.warn(`[paystack] metadata uid ${uid} not found — falling back to email`);
      uid = null;
    }
  }
  if (!uid && email) {
    try {
      uid = (await app.auth().getUserByEmail(email)).uid;
    } catch {
      uid = null;
    }
  }

  if (!uid) {
    // No account to credit. Record it so support can reconcile manually, and
    // answer 200 — a 5xx would make Paystack retry an unrecoverable case for
    // 72 hours.
    console.error(`[paystack] ${reference}: paid but no matching account (email: ${email ?? 'none'})`);
    await paymentRef.set({
      reference,
      email,
      amount: charge.amount,
      currency: charge.currency,
      plan: 'pro-monthly',
      status: 'unclaimed',
      reason: 'no-matching-firebase-user',
      processedAt: Date.now(),
    }, { merge: true });
    return { status: 200, body: { received: true, unclaimed: reference } };
  }

  try {
    const outcome = await applyProPlan(app, {
      uid,
      email,
      reference,
      amount: charge.amount,
      currency: charge.currency,
    });
    if (!outcome.applied) {
      // A concurrent redelivery already credited this reference.
      return { status: 200, body: { received: true, alreadyApplied: reference } };
    }
    console.log(
      `[paystack] Pro activated for ${uid} via ${reference} until ${new Date(outcome.proExpiresAt).toISOString()}`,
    );
  } catch (err) {
    console.error('[paystack] activation failed:', err.message);
    return { status: 500, body: { error: 'Could not activate the plan', detail: err.message } };
  }

  return { status: 200, body: { received: true, applied: reference, uid } };
}
