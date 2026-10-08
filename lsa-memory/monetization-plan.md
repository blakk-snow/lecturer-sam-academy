---
name: monetization-plan
description: User wants to monetize Lecturer Sam Academy and go to production
  (intent Oct 7 2026); recommended revenue model, payments, and pre-launch risks
metadata:
  node_type: memory
  type: project
  originSessionId: sess_955fc181-627f-48c5-9382-9301259288da
---

The user asked one day after the retooling (2026-10-07) how to monetize and move to full production. No decisions made yet — this records the advisory given and the open risks, to be revisited when they choose a path.

**Recommended revenue model (in priority order):**
1. Teacher freemium subscription — free: offline planner + ~10 AI generations/month; Pro (~GH₵40–60/mo): unlimited lesson-plan generation + research, planner/timetable sync, full textbook access.
2. School licenses — annual per-school/per-GES-circuit fee, bulk teacher accounts + simple admin, billed by invoice/PO; NGOs and education programmes are natural sponsors. Seen as the biggest revenue in Ghanaian edtech.
3. BECE prep packs — one-time purchases (~GH₵20–40) of question-bank/revision packs in BECE season (April–June), aimed at parents.

**Payments:** Paystack (card + MTN MoMo/Vodafone Cash, recurring subscriptions supported) as the pragmatic first choice over Play Billing, because MoMo is how customers actually pay.

**Two risks flagged before charging anyone:**
- The AI proxy (`api/generate.js`) is UNauthenticated — anyone hitting the URL spends the OpenRouter balance; must verify Firebase tokens server-side and enforce plan/quota before monetizing.
- Textbook copyright — the converted textbooks (Beacon/Alpha Examinations) are a publisher's works; NaCCA curriculum text is public but redistributing/selling a publisher's book needs written permission. Safest to monetize only self-owned content (teaching-method plans, AI generations, NaCCA docs) unless a license is secured.

**Production checklist sketched:** Firebase production project + Vercel deploy + custom HTTPS domain; add email/password sign-in (many Ghanaian teachers don't use Google); entitlement/quota fields (`plan`, `aiCreditsUsed`) enforced in the proxy; Paystack webhook (Vercel function) for plan activation/renewal; Terms/privacy (Ghana Data Protection Act 2012); analytics + WhatsApp support line.

**Suggested sequence:** (1) harden + launch free (proxy auth + quotas, email sign-in, prod deploy, analytics, terms) to learn real usage; (2) Teacher Pro via Paystack; (3) school licenses + BECE packs.

See [[project-overview]] and [[planned-work-oct-2026]].
