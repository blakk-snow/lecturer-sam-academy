import { useState } from "react";
import { NavLink, Outlet } from "react-router-dom";
import { LogIn, LogOut, Loader2 } from "lucide-react";
import { BottomNav } from "./BottomNav";
import { ChatLauncher } from "../chat/ChatLauncher";
import { useAuth } from "../../context/AuthContext";

const links = [
  { to: "/", label: "Home", end: true },
  { to: "/planner", label: "Planner" },
  { to: "/timetable", label: "Timetable" },
  { to: "/curriculum", label: "Curriculum" },
  { to: "/scheme", label: "Scheme" },
  { to: "/practice", label: "Practice" },
  { to: "/dashboard", label: "Progress" },
  { to: "/profile", label: "Profile" },
];

// ── User menu (avatar + sign-out) ─────────────────────────────────────────────

function UserMenu({ user, onSignOut }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(o => !o)}
        className="flex items-center gap-2 rounded-full focus:outline-none focus:ring-2 focus:ring-accent"
        aria-label="Account menu"
        aria-expanded={open}
      >
        {user.photoURL ? (
          <img
            src={user.photoURL}
            alt={user.displayName ?? 'User avatar'}
            className="w-8 h-8 rounded-full border border-line"
            referrerPolicy="no-referrer"
          />
        ) : (
          <div className="w-8 h-8 rounded-full bg-accent/20 text-accent text-sm font-semibold flex items-center justify-center">
            {(user.displayName ?? user.email ?? '?')[0].toUpperCase()}
          </div>
        )}
        <span className="hidden lg:block text-sm text-ink max-w-[120px] truncate">
          {user.displayName ?? user.email}
        </span>
      </button>

      {open && (
        <>
          {/* Backdrop */}
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} aria-hidden="true" />
          {/* Dropdown */}
          <div className="absolute right-0 top-10 z-50 w-56 rounded-xl bg-card border border-line shadow-lg py-1 text-sm">
            <div className="px-4 py-2.5 border-b border-line">
              <p className="font-medium text-ink truncate">{user.displayName}</p>
              <p className="text-xs text-ink-soft truncate">{user.email}</p>
            </div>
            <button
              onClick={() => { setOpen(false); onSignOut(); }}
              className="w-full flex items-center gap-2 px-4 py-2.5 text-ink-soft hover:text-ink hover:bg-paper transition-colors"
            >
              <LogOut size={15} />
              Sign out
            </button>
          </div>
        </>
      )}
    </div>
  );
}

// ── Sign-in button ────────────────────────────────────────────────────────────

function SignInButton({ onSignIn, loading }) {
  return (
    <button
      onClick={onSignIn}
      disabled={loading}
      className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-line text-sm text-ink-soft hover:text-ink hover:bg-paper transition-colors disabled:opacity-50"
    >
      {loading
        ? <Loader2 size={15} className="animate-spin" />
        : <LogIn size={15} />
      }
      {loading ? 'Signing in…' : 'Sign in'}
    </button>
  );
}

// ── AppShell ──────────────────────────────────────────────────────────────────

export function AppShell() {
  const { user, loading, signInWithGoogle, signOut, authError, clearAuthError } = useAuth();
  const [signingIn, setSigningIn] = useState(false);

  async function handleSignIn() {
    setSigningIn(true);
    try {
      await signInWithGoogle();
    } finally {
      setSigningIn(false);
    }
  }

  return (
    <div className="min-h-dvh bg-paper text-ink">
      <header className="hidden border-b border-line bg-card md:block print:hidden">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-4">
          <NavLink to="/" className="font-serif text-lg tracking-wide">
            Lecturer Sam Academy
          </NavLink>
          <nav className="flex gap-3 text-xs font-medium lg:gap-5 lg:text-sm" aria-label="Desktop navigation">
            {links.map((link) => (
              <NavLink
                key={link.to}
                to={link.to}
                end={link.end}
                className={({ isActive }) =>
                  isActive ? "text-accent" : "text-ink-soft hover:text-ink"
                }
              >
                {link.label}
              </NavLink>
            ))}
          </nav>

          {/* Auth controls */}
          <div className="flex items-center">
            {loading ? (
              <Loader2 size={18} className="animate-spin text-ink-soft" />
            ) : user ? (
              <UserMenu user={user} onSignOut={signOut} />
            ) : (
              <SignInButton onSignIn={handleSignIn} loading={signingIn} />
            )}
          </div>
        </div>
      </header>
      {authError && (
        <div className="mx-auto max-w-5xl px-4 pt-3 md:px-6" role="alert">
          <div className="flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
            <span className="flex-1">{authError}</span>
            <button
              onClick={clearAuthError}
              className="shrink-0 text-red-400 hover:text-red-600"
              aria-label="Dismiss sign-in error"
            >
              ✕
            </button>
          </div>
        </div>
      )}
      <main className="mx-auto w-full max-w-5xl px-4 pb-24 pt-6 md:px-6 md:pb-12">
        <Outlet />
      </main>
      <BottomNav />
      <ChatLauncher />
    </div>
  );
}
