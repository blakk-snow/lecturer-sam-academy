/**
 * api/paystack-webhook.js — activates the Pro plan on successful charges
 *
 * Paystack sends POST /api/paystack-webhook with an x-paystack-signature
 * header (HMAC-SHA512 of the raw body with PAYSTACK_SECRET_KEY).
 *
 * NOTE: Vercel pre-parses JSON bodies; the signature is computed over
 * JSON.stringify(req.body), which matches Paystack's compact payloads.
 * Verify in Paystack's test dashboard before going live.
 */

import crypto from 'crypto';
import { initFirebaseAdmin, PRO_AMOUNT_PESAWA } from './_aiGate.mjs';

export const config = { runtime: 'nodejs' };

const PRO_DURATION_MS = 30 * 24 * 60 * 60 * 1000; // 30 days

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  const secret = process.env.PAYSTACK_SECRET_KEY;
  if (!secret) {
    res.status(500).json({ error: 'PAYSTACK_SECRET_KEY is not configured' });
    return;
  }

  // Verify the webhook signature.
  const raw = typeof req.body === 'string' ? req.body : JSON.stringify(req.body ?? {});
  const signature = req.headers['x-paystack-signature'];
  const expected = crypto.createHmac('sha512', secret).update(raw).digest('hex');
  if (!signature || signature !== expected) {
    console.error('[paystack-webhook] signature mismatch');
    res.status(401).json({ error: 'Invalid signature' });
    return;
  }

  const event = typeof req.body === 'string' ? JSON.parse(raw) : req.body;
  if (event.event !== 'charge.success') {
    res.status(200).json({ received: true, ignored: event.event });
    return;
  }

  const email = event.data?.customer?.email;
  const amount = event.data?.amount;
  if (!email) {
    res.status(200).json({ received: true, ignored: 'no-email' });
    return;
  }

  const app = await initFirebaseAdmin();
  if (!app) {
    console.error('[paystack-webhook] Firebase Admin unavailable — cannot activate plan');
    res.status(500).json({ error: 'Firebase Admin unavailable' });
    return;
  }

  try {
    const user = await app.auth().getUserByEmail(email);
    const usageRef = app.firestore().doc(`users/${user.uid}/usage`);
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
    res.status(500).json({ error: 'Could not activate the plan', detail: err.message });
    return;
  }

  res.status(200).json({ received: true });
}
