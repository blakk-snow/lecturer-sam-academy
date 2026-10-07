import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { CloudUpload, Loader2, LogIn, LogOut } from "lucide-react";
import { Button } from "../components/ui/Button";
import { Card } from "../components/ui/Card";
import { useStudent } from "../context/StudentContext";
import { useAuth } from "../context/AuthContext";

/** Teacher account section — the main sign-in surface on mobile, where the
 *  desktop header (and its auth controls) is hidden. */
function AccountCard() {
  const { user, loading, signInWithGoogle, signOut } = useAuth();
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
    <Card>
      <div className="space-y-4">
        <div>
          <h2 className="font-serif text-xl">Teacher account</h2>
          <p className="mt-2 text-sm text-ink-soft">
            {user
              ? "Your lesson plans and notes are synced to this account across devices."
              : "Optional: sign in with Google to sync your lesson planner across devices. No password to remember — student progress always stays on this device."}
          </p>
        </div>

        {loading ? (
          <div className="flex items-center gap-2 text-sm text-ink-soft">
            <Loader2 size={16} className="animate-spin" />
            Checking sign-in state…
          </div>
        ) : user ? (
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <div className="flex items-center gap-3 min-w-0">
              {user.photoURL ? (
                <img
                  src={user.photoURL}
                  alt={user.displayName ?? "User avatar"}
                  className="h-9 w-9 rounded-full border border-line"
                  referrerPolicy="no-referrer"
                />
              ) : (
                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-accent/20 text-sm font-semibold text-accent">
                  {(user.displayName ?? user.email ?? "?")[0].toUpperCase()}
                </div>
              )}
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold">{user.displayName}</p>
                <p className="truncate text-xs text-ink-soft">{user.email}</p>
              </div>
            </div>
            <Button variant="secondary" onClick={signOut}>
              <LogOut size={16} />
              Sign out
            </Button>
          </div>
        ) : (
          <Button onClick={handleSignIn} disabled={signingIn} className="w-full">
            {signingIn ? (
              <Loader2 size={16} className="animate-spin" />
            ) : (
              <CloudUpload size={16} />
            )}
            {signingIn ? "Signing in…" : "Sign in with Google"}
          </Button>
        )}
      </div>
    </Card>
  );
}

export default function Profile() {
  const { student, settings, saveProfile } = useStudent();
  const navigate = useNavigate();
  const [name, setName] = useState(student?.name ?? "");
  const [fontSize, setFontSize] = useState(settings.fontSize ?? "md");

  useEffect(() => {
    if (student?.name) setName(student.name);
  }, [student]);

  useEffect(() => {
    if (settings?.fontSize) setFontSize(settings.fontSize);
  }, [settings]);

  async function onSubmit(event) {
    event.preventDefault();
    if (!name.trim()) return;
    await saveProfile(name, fontSize);
    navigate("/dashboard");
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-serif text-3xl">Student profile</h1>
        <p className="mt-2 max-w-xl text-ink-soft">
          Use a name or nickname. Student progress stays on this device — no account needed.
        </p>
      </div>
      <Card>
        <form className="space-y-5" onSubmit={onSubmit}>
          <label className="block space-y-2">
            <span className="font-semibold">Name or nickname</span>
            <input
              className="min-h-12 w-full rounded-xl border border-line bg-paper px-4"
              value={name}
              onChange={(event) => setName(event.target.value)}
              autoComplete="nickname"
              required
            />
          </label>
          <fieldset>
            <legend className="mb-2 font-semibold">Text size</legend>
            <div className="flex gap-2">
              {[
                ["sm", "Small"],
                ["md", "Medium"],
                ["lg", "Large"],
              ].map(([value, label]) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => setFontSize(value)}
                  className={`min-h-11 flex-1 rounded-xl border ${
                    fontSize === value
                      ? "border-accent bg-accent text-white"
                      : "border-line bg-paper"
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </fieldset>
          <Button type="submit" className="w-full">
            {student ? "Save profile" : "Enter the course"}
          </Button>
        </form>
      </Card>
      <AccountCard />
      <p className="text-center">
        <Link to="/help" className="text-sm text-accent hover:underline">
          How to use this app →
        </Link>
      </p>
    </div>
  );
}
