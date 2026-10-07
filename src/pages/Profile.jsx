import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { CloudUpload, Loader2, LogIn, LogOut, Mail } from "lucide-react";
import { Button } from "../components/ui/Button";
import { Card } from "../components/ui/Card";
import { useStudent } from "../context/StudentContext";
import { useAuth } from "../context/AuthContext";
import { useUsage, FREE_MONTHLY_LIMIT, PRO_PRICE_GHS } from "../hooks/useUsage";
import { openProCheckout, paymentsConfigured } from "../services/payments";
import { EmailAuthForm } from "../components/auth/EmailAuthForm";

/** Teacher account section — the main sign-in surface on mobile, where the
 *  desktop header (and its auth controls) is hidden. */
function AccountCard() {
  const { user, loading, signInWithGoogle, signOut } = useAuth();
  const { plan, used, remaining, proExpiresAt } = useUsage();
  const [signingIn, setSigningIn] = useState(false);
  const [showEmailForm, setShowEmailForm] = useState(false);
  const [payNotice, setPayNotice] = useState(null);

  async function handleSignIn() {
    setSigningIn(true);
    try {
      await signInWithGoogle();
    } finally {
      setSigningIn(false);
    }
  }

  function handleUpgrade() {
    if (!user?.email) return;
    setPayNotice(null);
    openProCheckout({
      email: user.email,
      name: user.displayName ?? undefined,
      onSuccess: () => setPayNotice('Payment received — your Pro plan activates within a minute.'),
      onClose: () => setPayNotice('Payment window closed. Your plan was not changed.'),
    });
  }

  return (
    <Card>
      <div className="space-y-4">
        <div>
          <h2 className="font-serif text-xl">Teacher account</h2>
          <p className="mt-2 text-sm text-ink-soft">
            {user
              ? "Your lesson plans and notes are synced to this account across devices."
              : "Optional: sign in to sync your lesson planner across devices and use the AI assistant. Student progress always stays on this device."}
          </p>
        </div>

        {loading ? (
          <div className="flex items-center gap-2 text-sm text-ink-soft">
            <Loader2 size={16} className="animate-spin" />
            Checking sign-in state…
          </div>
        ) : user ? (
          <div className="space-y-4">
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

            {/* Plan + quota */}
            <div className="rounded-xl border border-line bg-paper p-4 space-y-3">
              <div className="flex items-center justify-between gap-3 flex-wrap">
                <div>
                  <p className="text-sm font-semibold text-ink">
                    {plan === "pro" ? "Pro plan" : "Free plan"}
                  </p>
                  {plan === "pro" ? (
                    <p className="text-xs text-ink-soft">
                      Unlimited AI generations{proExpiresAt ? ` until ${new Date(proExpiresAt).toLocaleDateString()}` : ""}.
                    </p>
                  ) : (
                    <p className="text-xs text-ink-soft">
                      {remaining} of {FREE_MONTHLY_LIMIT} AI generations left this month.
                    </p>
                  )}
                </div>
                {plan !== "pro" && (
                  <Button onClick={handleUpgrade} className="text-sm px-4 py-2 min-h-0">
                    Upgrade to Pro — GH₵{PRO_PRICE_GHS}/month
                  </Button>
                )}
              </div>
              {payNotice && (
                <p className="text-xs text-ink-soft" role="status">{payNotice}</p>
              )}
              {plan !== "pro" && !paymentsConfigured() && (
                <p className="text-xs text-ink-soft/70">Payments are being set up — check back soon.</p>
              )}
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            <Button onClick={handleSignIn} disabled={signingIn} className="w-full">
              {signingIn ? (
                <Loader2 size={16} className="animate-spin" />
              ) : (
                <CloudUpload size={16} />
              )}
              {signingIn ? "Signing in…" : "Sign in with Google"}
            </Button>

            {!showEmailForm ? (
              <button
                onClick={() => setShowEmailForm(true)}
                className="flex w-full items-center justify-center gap-2 text-sm text-ink-soft hover:text-accent"
              >
                <Mail size={15} /> Use email instead
              </button>
            ) : (
              <EmailAuthForm onDone={() => setShowEmailForm(false)} />
            )}
          </div>
        )}

        <p className="text-xs text-ink-soft/70">
          <Link to="/terms" className="text-accent hover:underline">Terms</Link> ·{" "}
          <Link to="/privacy" className="text-accent hover:underline">Privacy Policy</Link>
        </p>
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
