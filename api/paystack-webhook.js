/**
 * api/paystack-webhook.js — activates the Pro plan on successful charges
 *
 * Paystack sends POST /api/paystack-webhook with an x-paystack-signature
 * header (HMAC-SHA512 of the raw request body, keyed by PAYSTACK_SECRET_KEY).
 *
 * Uses a Web Handler (POST export) so the body is read raw with
 * request.text(). Re-serialising a pre-parsed body (JSON.stringify(req.body))
 * would NOT reproduce Paystack's exact bytes — Paystack's encoder escapes "/"
 * as "\/" and non-ASCII characters — so the signature check would silently
 * reject legitimate events.
 *
 * Verify with a real event in Paystack's test dashboard before going live.
 */

import crypto from 'crypto';
import { initFirebaseAdmin, PRO_AMOUNT_PESAWA } from './_aiGate.mjs';

export const config = { runtime: 'nodejs' };

const PRO_DURATION_MS = 30 * 24 * 60 * 60 * 1000; // 30 days

function signaturesMatch(provided, expected) {
  if (!provided) return false;
  const a = Buffer.from(provided);
  const b = Buffer.from(expected);
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}

export async function POST(request) {
  const secret = process.env.PAYSTACK_SECRET_KEY;
  if (!secret) {
    return Response.json({ error: 'PAYSTACK_SECRET_KEY is not configured' }, { status: 500 });
  }

  // Verify the webhook signature over the raw body bytes.
  const raw = await request.text();
  const signature = request.headers.get('x-paystack-signature');
  const expected = crypto.createHmac('sha512', secret).update(raw).digest('hex');
  if (!signaturesMatch(signature, expected)) {
    console.error('[paystack-webhook] signature mismatch');
    return Response.json({ error: 'Invalid signature' }, { status: 401 });
  }

  let event;
  try {
    event = JSON.parse(raw);
  } catch {
    return Response.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  if (event.event !== 'charge.success') {
    return Response.json({ received: true, ignored: event.event });
  }

  const email = event.data?.customer?.email;
  const amount = event.data?.amount;
  if (!email) {
    return Response.json({ received: true, ignored: 'no-email' });
  }

  const app = await initFirebaseAdmin();
  if (!app) {
    console.error('[paystack-webhook] Firebase Admin unavailable — cannot activate plan');
    return Response.json({ error: 'Firebase Admin unavailable' }, { status: 500 });
  }

  try {
    const user = await app.auth().getUserByEmail(email);
    // Document references need an even number of path segments (see _aiGate).
    const usageRef = app.firestore().doc(`users/${user.uid}/usage/current`);
    if (amount === PRO_AMOUNT_PESAWA) {
      await usageRef.set({
        plan: 'pro',
        proExpiresAt: Date.now() + PRO_DURATION_MS,
        updatedAt: Date.now(),
      }, { merge: true });
      console.log(`[paystack-webhook] Pro activated for ${user.uid} (${email})`);
    } else {
      console.warn(`[paystack-webhook] unexpected amount ${amount} for ${email} — ignored`);
    }
  } catch (err) {
    console.error('[paystack-webhook] activation failed:', err.message);
    return Response.json({ error: 'Could not activate the plan', detail: err.message }, { status: 500 });
  }

  return Response.json({ received: true });
}
