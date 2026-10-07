import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, ArrowRight, BookOpen, CheckCircle2, CloudUpload, GraduationCap, Loader2, Smartphone, Sparkles } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { db } from '../db/database';
import { Button } from '../components/ui/Button';

/**
 * Onboarding.jsx — first-run Welcome → About → Sign in, shown outside the
 * app shell (no tabs, no chat, no planner). Completing it writes the
 * `onboarded` settings flag; the route stays available afterwards as the
 * "Welcome tour" replay from Settings.
 */

const STEPS = [
  { id: 'welcome', label: 'Welcome' },
  { id: 'about', label: 'About' },
  { id: 'signin', label: 'Sign in' },
];

const ABOUT_POINTS = [
  {
    icon: BookOpen,
    title: 'Everything NaCCA, in one place',
    text: 'The full Common Core Programme for Basic 7–9 — all 10 subjects — with textbooks, lesson notes, practice questions and BECE-style past papers.',
  },
  {
    icon: Smartphone,
    title: 'Works offline, installs like an app',
    text: 'Content is stored on your device, so lessons, plans and practice keep working without internet. Add it to your home screen for one-tap access.',
  },
  {
    icon: CloudUpload,
    title: 'Your data stays yours',
    text: 'Student progress never leaves the device. Signing in with Google only syncs your teacher planner and timetable across your own devices.',
  },
  {
    icon: Sparkles,
    title: 'An assistant that knows the curriculum',
    text: 'Ask the AI assistant anything about a content standard or indicator — it can also draft lesson plans with your teaching method and research topics with cited sources.',
  },
];

async function completeOnboarding() {
  await db.settings.put({ id: 'onboarded', done: true, completedAt: Date.now() });
}

export default function Onboarding() {
  const navigate = useNavigate();
  const { user, loading: authLoading, signInWithGoogle, authError } = useAuth();
  const [step, setStep] = useState(0);
  const [signingIn, setSigningIn] = useState(false);

  async function handleSignIn() {
    setSigningIn(true);
    try {
      await signInWithGoogle();
    } finally {
      setSigningIn(false);
    }
  }

  async function finish() {
    await completeOnboarding();
    navigate('/');
  }

  const current = STEPS[step];

  return (
    <div className="min-h-dvh bg-paper text-ink flex flex-col">
      {/* Progress */}
      <div className="mx-auto w-full max-w-md px-6 pt-10">
        <div className="flex items-center justify-center gap-2">
          {STEPS.map((s, i) => (
            <div
              key={s.id}
              className={`h-1.5 rounded-full transition-all ${
                i <= step ? 'bg-accent' : 'bg-line'
              } ${i === step ? 'w-8' : 'w-4'}`}
            />
          ))}
        </div>
      </div>

      <main className="flex-1 mx-auto w-full max-w-md px-6 flex flex-col justify-center py-10">
        {current.id === 'welcome' && (
          <div className="text-center space-y-6">
            <div className="mx-auto w-20 h-20 rounded-3xl bg-accent flex items-center justify-center">
              <GraduationCap size={40} className="text-white" />
            </div>
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-accent">Lecturer Sam Academy</p>
              <h1 className="mt-3 font-serif text-4xl leading-tight">Better Teachers Build Brighter Futures</h1>
              <p className="mt-4 text-lg leading-relaxed text-ink-soft">
                Plan your lessons, explore the national curriculum, and teach with confidence — built for Ghanaian JHS teachers and students on the NaCCA Common Core Programme.
              </p>
            </div>
            <Button className="w-full" onClick={() => setStep(1)}>
              Get started
            </Button>
          </div>
        )}

        {current.id === 'about' && (
          <div className="space-y-4">
            <h2 className="font-serif text-3xl">About the app</h2>
            <div className="space-y-3">
              {ABOUT_POINTS.map(point => {
                const Icon = point.icon;
                return (
                  <div key={point.title} className="flex gap-3 rounded-2xl border border-line bg-card p-4">
                    <div className="shrink-0 inline-flex rounded-lg bg-accent/10 p-2 h-fit">
                      <Icon size={18} className="text-accent" />
                    </div>
                    <div>
                      <p className="font-semibold text-ink">{point.title}</p>
                      <p className="mt-1 text-sm leading-relaxed text-ink-soft">{point.text}</p>
                    </div>
                  </div>
                );
              })}
            </div>
            <Button className="w-full" onClick={() => setStep(2)}>
              Continue
            </Button>
          </div>
        )}

        {current.id === 'signin' && (
          <div className="text-center space-y-6">
            <div>
              <h2 className="font-serif text-3xl">Sign in (optional)</h2>
              <p className="mt-3 text-ink-soft leading-relaxed">
                Sign in with Google to sync your lesson planner and timetable across devices. Everything else works without an account.
              </p>
            </div>

            {authError && (
              <div className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700 text-left" role="alert">
                {authError}
              </div>
            )}

            {authLoading ? (
              <div className="flex items-center justify-center gap-2 text-sm text-ink-soft">
                <Loader2 size={16} className="animate-spin" /> Checking sign-in state…
              </div>
            ) : user ? (
              <div className="flex items-center justify-center gap-3">
                <CheckCircle2 size={20} className="text-green-600" />
                <p className="text-ink font-medium">Signed in as {user.displayName ?? user.email}</p>
              </div>
            ) : (
              <Button onClick={handleSignIn} disabled={signingIn} className="w-full">
                {signingIn ? <Loader2 size={16} className="animate-spin" /> : <CloudUpload size={16} />}
                {signingIn ? 'Signing in…' : 'Sign in with Google'}
              </Button>
            )}

            <Button variant="secondary" className="w-full" onClick={finish}>
              {user ? 'Enter the app' : 'Continue without an account'}
            </Button>
          </div>
        )}
      </main>

      {/* Back row */}
      <footer className="mx-auto w-full max-w-md px-6 pb-10">
        {step > 0 && (
          <button
            onClick={() => setStep(s => Math.max(0, s - 1))}
            className="flex items-center gap-1.5 text-sm text-ink-soft hover:text-ink"
          >
            <ArrowLeft size={15} /> Back
          </button>
        )}
        {step === STEPS.length - 1 && !user && (
          <button onClick={finish} className="flex items-center gap-1.5 text-sm text-accent ml-auto">
            Skip for now <ArrowRight size={15} />
          </button>
        )}
      </footer>
    </div>
  );
}
