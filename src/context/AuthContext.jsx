/**
 * AuthContext.jsx — Firebase Auth state for the whole app
 *
 * Provides:
 *   user        — Firebase User object, or null if signed out
 *   loading     — true while the initial auth state is being resolved
 *   signInWithGoogle() — opens the Google Sign-In popup
 *   signOut()   — signs the user out
 */

import { createContext, useContext, useEffect, useState } from 'react';
import {
  onAuthStateChanged,
  signInWithPopup,
  signInWithRedirect,
  signOut as firebaseSignOut,
} from 'firebase/auth';
import { auth, googleProvider } from '../firebase';
import { migrateLocalPlannerToFirestore } from '../db/plannerMigration';
import { ensureSampleTeacherSchedule } from '../db/teacherSchedule';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser]       = useState(null);
  const [loading, setLoading] = useState(true);

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
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (err) {
      const code = err?.code;
      const silentCodes = ['auth/popup-closed-by-user', 'auth/cancelled-popup-request'];
      const redirectCodes = [
        'auth/popup-blocked',
        'auth/operation-not-supported-in-this-environment',
        'auth/unauthorized-domain',
      ];

      if (silentCodes.includes(code)) {
        return;
      }

      if (redirectCodes.includes(code)) {
        await signInWithRedirect(auth, googleProvider);
        return;
      }

      throw err;
    }
  }

  async function signOut() {
    await firebaseSignOut(auth);
  }

  return (
    <AuthContext.Provider value={{ user, loading, signInWithGoogle, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
}
