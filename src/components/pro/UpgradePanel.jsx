/**
 * UpgradePanel.jsx — WhatsApp upgrade + Pro access-code redemption
 *
 * The upgrade surface for the manual payment flow: a prefilled WhatsApp chat
 * link to the admin, and the code entry that activates Pro once the code
 * arrives. Shared by the Profile account card and the /pro portal.
 */

import { useState } from 'react';
import { KeyRound, Loader2, MessageCircle } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useUsage, PRO_PRICE_GHS } from '../../hooks/useUsage';
import { proWhatsAppLink, redeemProCode } from '../../services/pro';
import { Button } from '../ui/Button';

export function UpgradePanel() {
  const { user, loading } = useAuth();
  const { plan, proExpiresAt } = useUsage();
  const [code, setCode] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);
  const [notice, setNotice] = useState(null);

  if (plan === 'pro') {
    return (
      <div className="rounded-xl border border-line bg-paper p-4">
        <p className="text-sm font-semibold text-ink">Pro plan active</p>
        <p className="mt-1 text-xs text-ink-soft">
          Unlimited AI generations and all print-ready downloads
          {proExpiresAt ? ` until ${new Date(proExpiresAt).toLocaleDateString()}.` : '.'}
        </p>
      </div>
    );
  }

  async function handleRedeem(event) {
    event.preventDefault();
    const clean = code.trim();
    if (!clean) return;
    setBusy(true);
    setError(null);
    setNotice(null);
    try {
      const result = await redeemProCode(clean);
      setNotice(`Pro activated — unlimited access until ${new Date(result.proExpiresAt).toLocaleDateString()}!`);
      setCode('');
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-3">
      <a
        href={proWhatsAppLink({ email: user?.email })}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-accent px-5 py-3 text-base font-semibold text-white shadow-sm transition hover:bg-accent-hover"
      >
        <MessageCircle size={18} />
        Upgrade via WhatsApp — GH₵{PRO_PRICE_GHS}/month
      </a>

      {!loading && !user && (
        <p className="text-xs text-ink-soft">Sign in first so your Pro plan attaches to your account.</p>
      )}

      <div className="flex items-center gap-3">
        <span className="h-px flex-1 bg-line" />
        <span className="text-[11px] uppercase tracking-wide text-ink-soft/70">have a code?</span>
        <span className="h-px flex-1 bg-line" />
      </div>

      <form onSubmit={handleRedeem} className="flex gap-2">
        <input
          value={code}
          onChange={e => setCode(e.target.value.toUpperCase())}
          placeholder="LSA-XXXX-XXXX"
          className="min-h-12 flex-1 rounded-xl border border-line bg-paper px-4 text-sm font-mono tracking-wide"
          aria-label="Pro access code"
          autoComplete="off"
          spellCheck={false}
        />
        <Button type="submit" disabled={busy || !code.trim()} className="shrink-0 text-sm px-4 py-2 min-h-0">
          {busy ? <Loader2 size={16} className="animate-spin" /> : <KeyRound size={16} />}
          Redeem
        </Button>
      </form>

      {notice && <p className="text-xs text-ink" role="status">{notice}</p>}
      {error && <p className="text-xs text-red-600" role="alert">{error}</p>}

      <p className="text-xs leading-relaxed text-ink-soft/70">
        1. Tap the WhatsApp button and pay via mobile money. 2. We send your access code in the chat.
        3. Enter it above — Pro activates instantly.
      </p>
    </div>
  );
}
