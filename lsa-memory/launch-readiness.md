---
name: launch-readiness
description: Production-hardening state of Lecturer Sam Academy verified and
  completed 2026-10-08 — AI gate, Paystack money path, tests, deployment docs,
  and what still blocks charging anyone
metadata:
  node_type: memory
  type: project
---

Verified against the code on 2026-10-08 (commit `e511c61` on `arena/d53a8402-lecturer-sam-academy`), not taken from the README or from [[planned-work-oct-2026]].

**The monetization advice in [[monetization-plan]] was turned into a build.** Its two flagged risks were the trigger: `.zcode/plans/plan-sess_955fc181-….md` (same session id as that memory note) is a five-part production-hardening plan — H1 proxy auth + quota, H2 email/password sign-in, H3 entitlements UI, H4 Paystack, H5 legal/support/analytics/deploy. All five were already implemented in the working tree when this session started, so "no decisions made yet" in [[monetization-plan]] is stale: Teacher Pro at GH₵50/month via Paystack is the chosen path, free tier is 10 AI generations per calendar month.

**Two real bugs found and fixed this session (commit `e511c61`):**
1. `gateAiRequest` returned 200 whenever Firebase Admin could not be initialised, so a missing or malformed `FIREBASE_SERVICE_ACCOUNT` on Vercel silently restored the open, unmetered proxy that H1 existed to prevent. It now fails **closed** with 503 when `VERCEL=1` or `NODE_ENV=production`, keeping the friction-free fallback only for `node server.js` (`enforcementRequired()` in `api/_aiGate.mjs`).
2. The Paystack webhook granted Pro on `HMAC(JSON.stringify(req.body))`. Paystack signs the **raw** body, and Vercel pre-parses JSON for Node functions, so the exact bytes are usually unrecoverable there — the check risked rejecting genuine payments while being the only gate on entitlement. Logic moved to `api/_paystackWebhook.mjs`: the signature is a constant-time fast reject when raw bytes are available and inconclusive when they are not, and activation is gated on Paystack's own `/transaction/verify/{reference}` (authoritative — a forger cannot produce a successful charge on the account). Added `/payments/{reference}` idempotency checked inside the Firestore transaction (racing redeliveries cannot double-credit), renewal-aware expiry stacking, currency/status checks, the Firebase uid in the checkout metadata so the right account is credited even if the payment email differs, and 200 for unclaimable charges so Paystack stops retrying an unrecoverable case (it retries every 3 min ×4, then hourly for 72 h).

**Testing is now possible without keys:** `npm test` runs 27 assertions over both money paths using Node's built-in test runner (`scripts/test-ai-gate.mjs`, `scripts/test-paystack-webhook.mjs`) — no new dependencies, passes in CI. `server.js` also serves `/api/paystack-webhook` in dev, where the raw body IS available, so the strict signature path can be exercised with an openssl-signed curl (recipe in the README). Verified live: forged signature → 401, valid signature with an unverifiable reference → 502, no secret key → 500.

**Other changes:** `api/generate.js` config corrected from the invalid `runtime: 'nodejs'` to `maxDuration: 60` (Vercel accepts `nodejs22.x`-style values or nothing; 10 s default would cut off streaming lesson-plan generation). `sign_up` analytics event added — `track()` was already wired for `login`, `ai_generation` (ChatContext) and `quiz_completed` (LibraryIndicator only; the legacy `Quiz.jsx` and `QuestionBankRunner.jsx` do not track). README gained "Accounts, plans and AI quota" and "Deployment & production" (Firebase/Vercel/Paystack steps, the verification model, pre-launch checklist, open risks) and its env-var table now covers `FIREBASE_SERVICE_ACCOUNT`, `PAYSTACK_SECRET_KEY`, `VITE_PAYSTACK_PUBLIC_KEY`, `ALLOWED_ORIGIN`; `.env.example` matches.

**Verified repo health:** `npm run build` ✓ (~11 s, PWA precache 190 entries / 18.25 MB); `check:course-data` 266 files, 197 indicator entries, 19 books / 262 chapters / 345 codes, 0 errors / 315 benign warnings; `check:question-bank` 66 papers, 2,640 MCQs, no issues.

**Still blocking a paid launch:**
- **Textbook copyright is unresolved.** `src/data/courses-data/textbooks-and-references/COPYRIGHT.md` is a *draft notice* for Beacon Educational Consult with `[contact details to be inserted by the publisher]` still in it. A notice is not a licence — charging for access to a publisher's books needs written permission. Safe to monetise today: the app's own teaching-method plans, AI output, and NaCCA curriculum text.
- **Nothing is configured yet.** No `.env`; Firebase production project, authorized domains, `firebase deploy --only firestore:rules`, Paystack test keys and the test webhook URL are all still to do. Manual Pro grants via the Firestore console remain the fallback for early customers.
- **Paystack checkout is untested against real test keys** — the webhook signature path is proven locally, but the Inline dialog → webhook → activation round trip has not been run end to end (needs `VITE_PAYSTACK_PUBLIC_KEY` + a tunnel).
- Content gaps unchanged: notes only for Mathematics (115) and Science (82) at B7/B8; B9 and the other eight subjects empty; Science textbook conversions absent; `creativeArts` still parses to 0 strands.
- 18 MB precache and 500–690 KB book chunks are heavy on metered mobile data.

**Fixed in the follow-up commit (was listed as open above):** the WhatsApp support link is now build-time config — `VITE_SUPPORT_WHATSAPP` feeds `src/utils/whatsapp.js`, which normalises the Ghanaian forms people actually type (`+233 (0) 241 234 567`, `00233…`, `0241234567`) to `233241234567`, and `navGroups.js` omits the entry entirely when no usable number is set. A naive strip-non-digits leaves the trunk zero in and produces a silently dead wa.me link, so the normaliser has its own tests. Signed-out and out-of-quota users are now blocked at the UI instead of at the proxy: the chat composer and its action chips are disabled with an inline sign-in/upgrade prompt, and `PlannerLesson`'s six `AIButton`s are disabled with a visible `AIGateNotice` (the existing tooltips are hover-only, which is useless on the touch devices most teachers use). `npm test` is now 36 assertions across three suites.

**Repo caution:** git history was squashed — only `3cf71fa "Rettoling changes"` and later commits exist, so every hash cited in [[project-overview]] and [[planned-work-oct-2026]] (`6c6b072`, `3b9c0c2`, `30ed97e`, `584d35e`, `02342ac`, `8064a5a`, `96aaaf4`, …) no longer resolves. Trust the code, not those references. Both older notes also predate the hardening build and need a refresh.
