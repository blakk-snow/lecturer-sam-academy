/**
 * ProPortal.jsx — the Pro plan hub (/pro)
 *
 * Lists the Pro-gated features with their live lock/unlock state and hosts
 * the WhatsApp upgrade + access-code redemption. Linked from the Profile
 * account card, the chat quota messages, and locked print-ready books.
 */

import { Link } from 'react-router-dom';
import { Bot, BookOpen, Check, Globe, Lock, Printer, Sparkles } from 'lucide-react';
import { useUsage, FREE_MONTHLY_LIMIT, PRO_PRICE_GHS } from '../hooks/useUsage';
import { UpgradePanel } from '../components/pro/UpgradePanel';

function FeatureCard({ icon: Icon, title, description, unlocked, freeLabel }) {
  return (
    <div className="rounded-2xl border border-line bg-card p-5">
      <div className="flex items-start gap-3">
        <div className="inline-flex shrink-0 rounded-lg bg-accent/10 p-2.5">
          <Icon size={20} className="text-accent" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center justify-between gap-2">
            <p className="font-semibold text-ink">{title}</p>
            <span
              className={`inline-flex shrink-0 items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-semibold ${
                unlocked ? 'bg-good/10 text-ink' : 'bg-paper border border-line text-ink-soft'
              }`}
            >
              {unlocked ? <Check size={11} /> : <Lock size={11} />}
              {unlocked ? 'Unlocked' : freeLabel}
            </span>
          </div>
          <p className="mt-1 text-sm text-ink-soft">{description}</p>
        </div>
      </div>
    </div>
  );
}

export default function ProPortal() {
  const { plan, proExpiresAt, used, limit } = useUsage();
  const isPro = plan === 'pro';

  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <h1 className="font-serif text-3xl">Lecturer Sam Academy Pro</h1>
        <p className="mt-2 max-w-2xl text-ink-soft">
          {isPro
            ? `Your Pro plan is active${proExpiresAt ? ` until ${new Date(proExpiresAt).toLocaleDateString()}` : ''}.`
            : `Everything you need to teach a full term — unlimited AI and print-ready workbooks for GH₵${PRO_PRICE_GHS}/month.`}
        </p>
      </div>

      {/* Features */}
      <div className="grid gap-3 sm:grid-cols-2">
        <FeatureCard
          icon={Bot}
          title="AI Assistant"
          description="Unlimited lesson plans, notes and answers from the curriculum-aware assistant."
          unlocked={isPro}
          freeLabel={`${limit - used} left this month`}
        />
        <FeatureCard
          icon={Globe}
          title="Research mode"
          description="Web-search-backed answers on any topic, in the same chat."
          unlocked={isPro}
          freeLabel={`${limit - used} left this month`}
        />
        <FeatureCard
          icon={Sparkles}
          title="Planner AI generation"
          description="Generate lesson-plan sections and teaching methods inside the Planner."
          unlocked={isPro}
          freeLabel={`${limit - used} left this month`}
        />
        <FeatureCard
          icon={Printer}
          title="Print-ready workbooks"
          description="All Maths and English Learner's Books (Basic 7–9), formatted for printing."
          unlocked={isPro}
          freeLabel="Locked"
        />
      </div>

      {isPro ? (
        <Link
          to="/course"
          className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-accent px-5 py-3 text-base font-semibold text-white shadow-sm transition hover:bg-accent-hover"
        >
          <BookOpen size={18} /> Open your print-ready books
        </Link>
      ) : (
        <div className="rounded-2xl border border-line bg-card p-5">
          <h2 className="font-serif text-xl">Upgrade</h2>
          <p className="mt-1 text-sm text-ink-soft">
            Free plan: {FREE_MONTHLY_LIMIT} AI generations per month. Pro: unlimited, plus print-ready downloads.
          </p>
          <div className="mt-4">
            <UpgradePanel />
          </div>
        </div>
      )}

      {/* How it works */}
      <div className="rounded-2xl border border-line bg-card p-5">
        <h2 className="font-serif text-xl">How the WhatsApp upgrade works</h2>
        <ol className="mt-3 space-y-2 text-sm text-ink-soft list-decimal list-inside">
          <li>Tap <strong className="text-ink">Upgrade via WhatsApp</strong> — it opens a chat with our admin, with your account email prefilled.</li>
          <li>Pay GH₵{PRO_PRICE_GHS} by mobile money and confirm in the chat.</li>
          <li>We reply with your one-time access code.</li>
          <li>Enter the code above (or in Profile) — Pro activates instantly and lasts 30 days.</li>
        </ol>
      </div>
    </div>
  );
}
