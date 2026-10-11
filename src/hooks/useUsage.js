/**
 * useUsage.js — live snapshot of the signed-in user's plan and AI quota
 *
 * Mirrors the server-side usage doc at /users/{uid}/usage/current:
 *   { plan: 'free'|'pro', aiMonth: 'YYYY-MM', aiCount, proExpiresAt }
 */

import { useEffect, useState } from 'react';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from '../context/AuthContext';

export const FREE_MONTHLY_LIMIT = 10;
export const PRO_PRICE_GHS = 50;

// Usage lives in a single-doc subcollection — a Firestore document reference
// must have an even number of path segments, so /users/{uid}/usage alone is
// invalid and throws "Invalid document reference".
const USAGE_DOC_ID = 'current';

const monthKey = () => {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
};

export function useUsage() {
  const { user } = useAuth();
  const [usage, setUsage] = useState(null);

  useEffect(() => {
    if (!user?.uid) { setUsage(null); return undefined; }
    return onSnapshot(
      doc(db, 'users', user.uid, 'usage', USAGE_DOC_ID),
      snapshot => setUsage(snapshot.exists() ? snapshot.data() : null),
      () => setUsage(null),
    );
  }, [user?.uid]);

  const isPro = usage?.plan === 'pro' && (!usage?.proExpiresAt || usage.proExpiresAt > Date.now());
  const plan = isPro ? 'pro' : 'free';
  const used = usage?.aiMonth === monthKey() ? (usage.aiCount ?? 0) : 0;
  const limit = plan === 'pro' ? Infinity : FREE_MONTHLY_LIMIT;
  const remaining = plan === 'pro' ? Infinity : Math.max(0, FREE_MONTHLY_LIMIT - used);

  return {
    signedIn: Boolean(user?.uid),
    usage,
    plan,
    used,
    limit,
    remaining,
    proExpiresAt: usage?.proExpiresAt ?? null,
    outOfQuota: plan === 'free' && remaining <= 0,
  };
}
