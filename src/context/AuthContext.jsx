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
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  sendPasswordResetEmail,
  updateProfile,
} from 'firebase/auth';
import { auth, googleProvider } from '../firebase';
import { migrateLocalPlannerToFirestore } from '../db/plannerMigration';
import { ensureSampleTeacherSchedule } from '../db/teacherSchedule';
import { track } from '../services/analytics';

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
  'auth/email-already-in-use':
    'An account already exists with that email. Sign in instead, or reset the password.',
  'auth/invalid-credential':
    'Incorrect email or password. Please try again.',
  'auth/invalid-email':
    'That email address does not look right. Check it and try again.',
  'auth/user-not-found':
    'No account was found with that email. Create an account first.',
  'auth/weak-password':
    'That password is too weak. Use at least 6 characters.',
  'auth/missing-password':
    'Please enter your password.',
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
    let previousUid = null;
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser?.uid && !previousUid) {
        track('login', { method: firebaseUser.providerData?.[0]?.providerId ?? 'unknown' });
      }
      previousUid = firebaseUser?.uid ?? null;
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
      const result = await signInWithPopup(auth, googleProvider);
      // A first-time Google account is a registration, not just a login.
      if (result?._tokenResponse?.isNewUser) {
        track('sign_up', { method: 'google' });
      }
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

  /**
   * Create an account with email + password.
   * @returns {boolean} true when the account was created
   */
  async function signUpWithEmail(email, password, name) {
    setAuthError(null);
    try {
      const credential = await createUserWithEmailAndPassword(auth, email.trim(), password);
      const trimmedName = (name ?? '').trim();
      if (trimmedName) {
        await updateProfile(credential.user, { displayName: trimmedName });
      }
      track('sign_up', { method: 'email' });
      return true;
    } catch (err) {
      setAuthError(friendlyAuthError(err));
      return false;
    }
  }

  /** Sign in with email + password. @returns {boolean} */
  async function signInWithEmail(email, password) {
    setAuthError(null);
    try {
      await signInWithEmailAndPassword(auth, email.trim(), password);
      return true;
    } catch (err) {
      setAuthError(friendlyAuthError(err));
      return false;
    }
  }

  /** Send a password-reset email. @returns {boolean} */
  async function resetPassword(email) {
    setAuthError(null);
    try {
      await sendPasswordResetEmail(auth, email.trim());
      return true;
    } catch (err) {
      setAuthError(friendlyAuthError(err));
      return false;
    }
  }

  const value = {
    user,
    loading,
    signInWithGoogle,
    signInWithEmail,
    signUpWithEmail,
    resetPassword,
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
