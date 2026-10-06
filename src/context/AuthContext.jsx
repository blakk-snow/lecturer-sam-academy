/**
 * AuthContext.jsx — Firebase Auth state for the whole app
 *
 * Provides:
 *   user        — Firebase User object, or null if signed out
 *   loading     — true while the initial auth state is being resolved
 *   signInWithGoogle() — opens the Google Sign-In popup (never rejects)
 *   signOut()   — signs the user out
 *   authError   — last sign-in failure as a user-facing message, or null
 *   clearAuthError() — dismisses authError
 */

import { createContext, useContext, useEffect, useState } from 'react';
import {
  onAuthStateChanged,
  signInWithPopup,
  signInWithRedirect,
  signOut as firebaseSignOut,
  getRedirectResult,
} from 'firebase/auth';
import { auth, googleProvider } from '../firebase';
import { migrateLocalPlannerToFirestore } from '../db/plannerMigration';
import { ensureSampleTeacherSchedule } from '../db/teacherSchedule';

const AuthContext = createContext(null);

const FRIENDLY_AUTH_ERRORS = {
  'auth/unauthorized-domain':
    'This domain is not authorised for Google sign-in. Add it in the Firebase console (Authentication → Settings → Authorized domains).',
  'auth/operation-not-allowed':
    'Google sign-in is not enabled for this app. Enable it in the Firebase console (Authentication → Sign-in method).',
  'auth/network-request-failed':
    'Network error — check your connection and try again.',
  'auth/too-many-requests':
    'Too many sign-in attempts. Wait a moment and try again.',
};

function friendlyAuthError(err) {
  if (FRIENDLY_AUTH_ERRORS[err?.code]) return FRIENDLY_AUTH_ERRORS[err.code];
  return err?.message || 'Unable to sign in right now. Please try again.';
}

export function AuthProvider({ children }) {
  const [user, setUser]       = useState(null);
  const [loading, setLoading] = useState(true);
  const [authError, setAuthError] = useState(null);

  // Surface errors from the redirect sign-in flow: after the browser returns
  // from accounts.google.com, failures (e.g. unauthorized-domain) only appear
  // here — without this call they are swallowed silently.
  useEffect(() => {
    getRedirectResult(auth).catch(err => {
      // auth/no-auth-event fires when no redirect was pending — not an error.
      if (err?.code === 'auth/no-auth-event') return;
      setAuthError(friendlyAuthError(err));
    });
  }, []);

  // Listen to Firebase auth state changes
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setUser(firebaseUser);
      setLoading(false);

      if (firebaseUser?.uid) {
        const results = await Promise.allSettled([
          migrateLocalPlannerToFirestore(firebaseUser.uid),
          ensureSampleTeacherSchedule(firebaseUser.uid),
        ]);
        for (const result of results) {
          if (result.status === 'rejected') {
            console.warn('Signed-in data initialization failed:', result.reason);
          }
        }
      }
    });
    return unsubscribe;
  }, []);

  async function signInWithGoogle() {
    setAuthError(null);
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (err) {
      const code = err?.code;
      const silentCodes = ['auth/popup-closed-by-user', 'auth/cancelled-popup-request'];
      const redirectCodes = [
        'auth/popup-blocked',
        'auth/operation-not-supported-in-this-environment',
      ];

      if (silentCodes.includes(code)) {
        return;
      }

      if (redirectCodes.includes(code)) {
        try {
          // Navigates away; result/errors arrive via getRedirectResult next load.
          await signInWithRedirect(auth, googleProvider);
        } catch (redirectErr) {
          setAuthError(friendlyAuthError(redirectErr));
        }
        return;
      }

      setAuthError(friendlyAuthError(err));
    }
  }

  async function signOut() {
    setAuthError(null);
    await firebaseSignOut(auth);
  }

  const value = {
    user,
    loading,
    signInWithGoogle,
    signOut,
    authError,
    clearAuthError: () => setAuthError(null),
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
}
