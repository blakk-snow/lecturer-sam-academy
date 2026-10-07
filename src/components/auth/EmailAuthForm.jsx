/**
 * EmailAuthForm.jsx — sign-in / create-account / reset-password with email
 *
 * Shared by the onboarding and the Profile account card. Uses AuthContext's
 * email methods and its shared friendly error banner.
 */

import { useState } from 'react';
import { Loader2, Mail } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { Button } from '../ui/Button';

const inputClass =
  'w-full rounded-xl border border-line bg-paper px-3.5 py-2.5 text-sm text-ink placeholder:text-ink-soft/60 focus:outline-none focus:border-accent';

export function EmailAuthForm({ onDone }) {
  const { signInWithEmail, signUpWithEmail, resetPassword, authError, clearAuthError } = useAuth();
  const [mode, setMode] = useState('signin'); // 'signin' | 'signup'
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [busy, setBusy] = useState(false);
  const [resetSent, setResetSent] = useState(false);

  async function submit(event) {
    event.preventDefault();
    if (!email.trim() || !password.trim()) return;
    setBusy(true);
    clearAuthError();
    const ok = mode === 'signup'
      ? await signUpWithEmail(email, password, name)
      : await signInWithEmail(email, password);
    setBusy(false);
    if (ok) onDone?.();
  }

  async function handleReset() {
    if (!email.trim()) return;
    setBusy(true);
    clearAuthError();
    const ok = await resetPassword(email);
    setBusy(false);
    if (ok) setResetSent(true);
  }

  if (resetSent) {
    return (
      <div className="rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-800">
        Password-reset email sent to <span className="font-medium">{email}</span>. Check your inbox and follow the link.
      </div>
    );
  }

  return (
    <form onSubmit={submit} className="space-y-3 text-left">
      {/* Mode toggle */}
      <div className="flex rounded-lg border border-line bg-paper p-0.5" role="group" aria-label="Email auth mode">
        {[['signin', 'Sign in'], ['signup', 'Create account']].map(([value, label]) => (
          <button
            key={value}
            type="button"
            onClick={() => { setMode(value); clearAuthError(); }}
            aria-pressed={mode === value}
            className={`flex-1 rounded-md px-2.5 py-1.5 text-xs font-medium transition ${
              mode === value ? 'bg-accent text-white' : 'text-ink-soft hover:text-ink'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {mode === 'signup' && (
        <input
          type="text"
          value={name}
          onChange={e => setName(e.target.value)}
          placeholder="Full name"
          autoComplete="name"
          className={inputClass}
          aria-label="Full name"
        />
      )}

      <input
        type="email"
        value={email}
        onChange={e => setEmail(e.target.value)}
        placeholder="Email address"
        autoComplete="email"
        required
        className={inputClass}
        aria-label="Email address"
      />

      <input
        type="password"
        value={password}
        onChange={e => setPassword(e.target.value)}
        placeholder={mode === 'signup' ? 'Choose a password (6+ characters)' : 'Password'}
        autoComplete={mode === 'signup' ? 'new-password' : 'current-password'}
        required
        minLength={6}
        className={inputClass}
        aria-label="Password"
      />

      <Button type="submit" disabled={busy} className="w-full">
        {busy ? <Loader2 size={16} className="animate-spin" /> : <Mail size={16} />}
        {busy ? 'Please wait…' : mode === 'signup' ? 'Create account' : 'Sign in'}
      </Button>

      {mode === 'signin' && (
        <button
          type="button"
          onClick={handleReset}
          disabled={busy || !email.trim()}
          className="text-xs text-ink-soft hover:text-accent disabled:opacity-50"
        >
          Forgot your password? Get a reset link
        </button>
      )}

      {authError && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700" role="alert">
          {authError}
        </div>
      )}
    </form>
  );
}
