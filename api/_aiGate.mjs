/**
 * _aiGate.mjs — shared Firebase auth + quota gate for the AI proxies
 *
 * Used by both server.js (dev) and api/generate.js (Vercel) so the
 * enforcement logic lives in one place. Verifies the Firebase ID token and
 * enforces the monthly AI-generation quota per user:
 *
 *   /users/{uid}/usage → { plan: 'free' | 'pro', aiMonth: 'YYYY-MM',
 *                          aiCount, proExpiresAt, updatedAt }
 *
 * Free plan: 10 AI generations per calendar month.
 * Pro plan:  unlimited while proExpiresAt is in the future.
 *
 * Without a FIREBASE_SERVICE_ACCOUNT the gate is disabled (dev convenience);
 * production must always set it.
 */

export const FREE_MONTHLY_LIMIT = 10;
export const PRO_AMOUNT_PESAWA = 5000; // GH₵50.00

let adminApp = null;
let adminModule = null;

async function getAdmin() {
  if (adminModule === undefined) {
    try {
      adminModule = await import('firebase-admin');
    } catch {
      adminModule = null;
    }
  }
  return adminModule;
}

export function adminInitialized() {
  return adminApp !== null;
}

/** Lazily initialise Firebase Admin from FIREBASE_SERVICE_ACCOUNT (JSON). */
export async function initFirebaseAdmin() {
  if (adminApp) return adminApp;
  const admin = await getAdmin();
  if (!admin) return null;

  const raw = process.env.FIREBASE_SERVICE_ACCOUNT;
  if (!raw) {
    console.warn('[ai-gate] FIREBASE_SERVICE_ACCOUNT not set — auth/quota enforcement is DISABLED.');
    return null;
  }
  try {
    const serviceAccount = JSON.parse(raw);
    adminApp = admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
    });
    console.log('[ai-gate] Firebase Admin initialised — auth/quota enforcement ON.');
  } catch (err) {
    console.error('[ai-gate] Could not parse FIREBASE_SERVICE_ACCOUNT:', err.message);
    return null;
  }
  return adminApp;
}

/**
 * Authorise an AI request and consume one quota unit.
 *
 * @param {string} authHeader - "Bearer <Firebase ID token>" or undefined
 * @returns {Promise<{ status: number, uid?: string, body?: object }>}
 *   status 200 → allowed (call OpenRouter)
 *   status 401 → auth-required
 *   status 402 → quota-exceeded
 */
export async function gateAiRequest(authHeader) {
  const app = await initFirebaseAdmin();
  if (!app) {
    // Dev fallback: no service account configured — allow unauthenticated.
    return { status: 200, uid: null };
  }

  const token = (authHeader ?? '').replace(/^Bearer\s+/i, '').trim();
  if (!token) {
    return {
      status: 401,
      body: { error: { code: 'auth-required', message: 'Sign in to use the assistant.' } },
    };
  }

  let decoded;
  try {
    decoded = await app.auth().verifyIdToken(token);
  } catch {
    return {
      status: 401,
      body: { error: { code: 'auth-required', message: 'Your session has expired. Sign in again.' } },
    };
  }

  const uid = decoded.uid;
  const month = new Date().toISOString().slice(0, 7);
  const usageRef = app.firestore().doc(`users/${uid}/usage`);

  const result = await app.firestore().runTransaction(async transaction => {
    const snapshot = await transaction.get(usageRef);
    const usage = snapshot.exists ? snapshot.data() : {};

    const isPro = usage.plan === 'pro' && (!usage.proExpiresAt || usage.proExpiresAt > Date.now());
    if (isPro) return { allowed: true };

    const count = usage.aiMonth === month ? (usage.aiCount ?? 0) : 0;
    if (count >= FREE_MONTHLY_LIMIT) {
      return { allowed: false, used: count };
    }
    transaction.set(usageRef, {
      plan: 'free',
      aiMonth: month,
      aiCount: count + 1,
      updatedAt: Date.now(),
    }, { merge: true });
    return { allowed: true, used: count + 1 };
  });

  if (!result.allowed) {
    return {
      status: 402,
      body: {
        error: {
          code: 'quota-exceeded',
          message: `Your free plan includes ${FREE_MONTHLY_LIMIT} AI generations per month and you've used them all. Upgrade to Pro (GH₵50/month) for unlimited generations.`,
          limit: FREE_MONTHLY_LIMIT,
        },
      },
    };
  }
  return { status: 200, uid };
}
