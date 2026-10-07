/**
 * analytics.js — safe wrapper for Firebase Analytics product events
 *
 * All calls are no-ops when analytics is unavailable (unsupported browser,
 * blocked, or still initialising).
 */

import { logEvent } from 'firebase/analytics';
import { analytics } from '../firebase';

export function track(eventName, params) {
  try {
    if (analytics) logEvent(analytics, eventName, params ?? {});
  } catch {
    // Analytics must never break product flows.
  }
}
