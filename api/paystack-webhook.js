/**
 * api/paystack-webhook.js — Vercel entry point for Paystack webhooks
 *
 * Thin wrapper: all of the verification and entitlement logic lives in
 * ./_paystackWebhook.mjs so it is shared with server.js (dev) and can be
 * tested locally against real HMAC-SHA512 signatures.
 *
 * Configure the callback URL in Paystack → Settings → API Keys & Webhooks:
 *   https://<your-domain>/api/paystack-webhook
 * (test and live dashboards have separate webhook URLs and secret keys.)
 */

import { processWebhook } from './_paystackWebhook.mjs';

export const config = { maxDuration: 30 };

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  const result = await processWebhook({
    // On Vercel's Node runtime req.body is already parsed, so the signature
    // is treated as inconclusive there and the verify API decides. Passing
    // whatever we get keeps the raw-body path working on platforms that do
    // hand over a string or Buffer.
    body: req.body,
    signature: req.headers['x-paystack-signature'],
  });

  res.status(result.status).json(result.body);
}
