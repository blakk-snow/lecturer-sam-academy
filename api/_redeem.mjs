/**
 * _redeem.mjs — shared Pro access-code redemption logic
 *
 * Manual WhatsApp payment flow: the admin generates one-time codes with
 * scripts/pro-token.mjs (stored in the proTokens/ collection) and sends a code
 * to the paying user over WhatsApp. This module verifies a code and activates
 * the Pro plan on the user's usage doc.
 *
 * Used by both server.js (dev) and api/redeem-token.js (Vercel), mirroring
 * _aiGate.mjs. Codes are validated server-side only — the client can never
 * read the proTokens collection (see firestore.rules).
 */

import { initFirebaseAdmin } from './_aiGate.mjs';

export const PRO_TOKEN_COLLECTION = 'proTokens';

export function normalizeTokenCode(raw) {
  return String(raw ?? '').trim().toUpperCase();
}

/**
 * Redeem a Pro access code for the caller of `authHeader`.
 *
 * @param {string} authHeader - "Bearer <Firebase ID token>" or undefined
 * @param {string} rawCode - the code the admin sent the user
 * @returns {Promise<{ status: number, body: object }>}
 */
export async function redeemProToken(authHeader, rawCode) {
  const code = normalizeTokenCode(rawCode);
  if (!/^[A-Z0-9][A-Z0-9-]{4,63}$/.test(code)) {
    return {
      status: 400,
      body: { error: { code: 'invalid-code-format', message: 'Enter the code exactly as it was sent to you.' } },
    };
  }

  const app = await initFirebaseAdmin();
  if (!app) {
    return {
      status: 503,
      body: { error: { code: 'unavailable', message: 'Upgrades are not configured on this server yet.' } },
    };
  }

  const token = (authHeader ?? '').replace(/^Bearer\s+/i, '').trim();
  if (!token) {
    return {
      status: 401,
      body: { error: { code: 'auth-required', message: 'Sign in to redeem your Pro code.' } },
    };
  }

  let uid;
  try {
    const decoded = await app.auth().verifyIdToken(token);
    uid = decoded.uid;
  } catch {
    return {
      status: 401,
      body: { error: { code: 'auth-required', message: 'Your session has expired. Sign in again.' } },
    };
  }

  const db = app.firestore();
  const tokenRef = db.doc(`${PRO_TOKEN_COLLECTION}/${code}`);
  // Document references need an even number of path segments (see _aiGate).
  const usageRef = db.doc(`users/${uid}/usage/current`);

  try {
    const result = await db.runTransaction(async tx => {
      const tokenSnap = await tx.get(tokenRef);
      if (!tokenSnap.exists) {
        return { ok: false, status: 404, code: 'invalid-code', message: 'That code was not recognised. Check it and try again.' };
      }
      const data = tokenSnap.data() ?? {};
      if (data.usedBy) {
        return { ok: false, status: 409, code: 'code-used', message: 'That code has already been used.' };
      }

      const usageSnap = await tx.get(usageRef);
      const usage = usageSnap.exists ? usageSnap.data() : {};
      const durationDays = Number.isFinite(data.durationDays) && data.durationDays > 0 ? data.durationDays : 30;
      // Stack on top of an existing Pro plan instead of overwriting it.
      const base = Math.max(Date.now(), usage.proExpiresAt ?? 0);
      const proExpiresAt = base + durationDays * 24 * 60 * 60 * 1000;

      tx.update(tokenRef, { usedBy: uid, usedAt: Date.now() });
      tx.set(usageRef, {
        plan: 'pro',
        proExpiresAt,
        updatedAt: Date.now(),
      }, { merge: true });

      return { ok: true, proExpiresAt };
    });

    if (!result.ok) {
      return { status: result.status, body: { error: { code: result.code, message: result.message } } };
    }
    return { status: 200, body: { plan: 'pro', proExpiresAt: result.proExpiresAt } };
  } catch (err) {
    console.error('[redeem-token] redemption failed:', err.message);
    return {
      status: 500,
      body: { error: { code: 'redeem-failed', message: 'Could not activate your Pro plan. Please contact support.' } },
    };
  }
}
