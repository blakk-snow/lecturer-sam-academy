# Lecturer Sam Academy

An installable, offline-capable learning and teaching app for Ghanaian JHS teachers and students, aligned with the NaCCA Common Core Programme (Basic 7–9).

## Features

- **Course Library:** A curriculum-driven browser — subject → class → strand → content standard → indicator — where each indicator with uploaded content opens lesson notes, practice questions, and a generated quiz. The original interactive "Number & Algebra" course (worked examples, classify activities, mastery quizzes) remains available from the library.
- **Textbooks:** The bundled NaCCA Learner's Books, Workbooks and Answer Books (English and Mathematics, Basic 7–9) are browsable chapter-by-chapter with their figures, curriculum-alignment codes, and cross-links to the indicator pages that they teach.
- **NaCCA curriculum browser:** Strands, sub-strands, content standards, and indicators for all 10 subjects across Basic 7–9, including Mathematics B8/B9.
- **BECE question bank:** All 66 bundled BECE-style science mock papers (~2,600 multiple-choice questions with answer keys) parsed into a structured bank with an interactive practice runner on the Practice page.
- **Sample lesson plans:** Bundled Week-5 lesson notes (Maths and Science, Basic 7 and 8) that can be loaded into a planner lesson note in one tap.
- **AI assistant:** A floating chat panel on every page (and a full-page view) with a greeting and action chips — create a timetable, create a lesson plan (guided flow that builds real planner rows), browse sample lesson plans, or research a topic online. Research mode searches the web (OpenRouter web plugin with educational-domain filters) and cites sources. Teacher and student personas; answers are grounded in the embedded curriculum.
- **Teacher timetable:** A weekly grid editor per class (`/timetable`). The assistant can generate the initial timetable and save it; edits sync to Firestore when signed in and to the device always.
- **Teacher lesson planner:** Terms, class groups, subjects, weekly plans, and curriculum-linked topics, with AI-assisted lesson notes and auto-save.
- **Teaching-method lesson plans:** The teacher's own method — EOPT/dictation, correction, objectives, media, reading time, discussion and assignment (mental-maths variant for Mathematics) — is built into the AI generator. One tap on any library indicator or textbook chapter ("Plan this lesson") starts a guided flow that creates the planner rows and generates the full 7-step plan, grounded in the curriculum text, the app's own notes and the textbook chapter that teaches the indicator.
- **Scheme of Learning browser:** The 2026/2027 Mathematics and Science scheme for Basic 7 and 8 across all three terms, with weekly indicators, resources, and source errata.
- **Offline-first storage and account sync:** Dexie/IndexedDB when signed out, Firebase Firestore when signed in (Google **or email/password**, with password reset). Local planner data migrates to a new account when appropriate; lesson-note, week-plan, and topic edits use revision checks to detect concurrent changes.
- **Accounts, plans and AI quota:** a free plan with 10 AI generations per calendar month, and Pro (GH₵50/month, Paystack — card, MTN MoMo, Vodafone Cash) for unlimited generations. Quota is enforced server-side, so it cannot be bypassed from the browser. Plan status and remaining generations are shown on the Profile page and in the chat panel.
- **Installable PWA:** The app shell and bundled resources work offline after the first visit.

## Course content uploads

Uploaded markdown is compiled by `scripts/parse-course-content.mjs` into the Course Library. Two file kinds are supported:

**Lesson notes** — `src/data/courses-data/<subject>/<class>/notes/<indicator-code>.md`. The filename is the NaCCA indicator code; `## Objectives`, `## Explanation`, `## Worked Example`, and `## Practice` sections become the note.

```md
---
title: Add and subtract up to four-digit numbers
---

# Add and subtract up to four-digit numbers

## Objectives
- Add numbers up to four digits
- Subtract numbers up to four digits

## Explanation
Free markdown prose…

## Worked Example
Step-by-step example…

## Practice
Optional practice pointers.
```

**Practice questions** — `src/data/courses-data/<subject>/<class>/questions/<indicator-code>.md`, with `### Q1` blocks (`type: mcq | trueFalse | fillBlank`, `question:`, `- [x]` marks the correct option, `explanation:`, `difficulty:`). See `src/data/courses-data/README.md` for the full convention.

Any other `.md` file (for example the BECE mock packs) is indexed as metadata only.

**Textbooks** — `src/data/courses-data/textbooks-and-references/md/*.md` are split into chapters and compiled into lazy-loaded book modules, cross-linked to indicators by the curriculum codes each chapter teaches.

```bash
npm run parse:course-data     # refresh courseUploads.js, courseLibrary/ and the book index
npm run check:course-data     # validate against the embedded curriculum (also writes)
```

Validation covers: filename/frontmatter class agreement, duplicate ids, indicator codes that must exist in the embedded curriculum, and malformed question blocks (reported with file and question number).

## AI assistant

AI calls go through the server-side `/api/generate` proxy; the OpenRouter key is never exposed to the browser. The proxy forwards all client parameters and streams responses (SSE). Research mode adds OpenRouter's web plugin with an educational-domain allowlist; answers come back with source citations.

**AI requires an account.** Every request carries the signed-in user's Firebase ID token and is metered against the monthly quota, because each call costs real money (a research query runs about $0.02). Signed-out calls are rejected by the proxy with `401` and the chat panel prompts the user to sign in; exhausted free quota returns `402` with an upgrade prompt. Onboarding makes sign-up one tap, and the free tier still allows 10 generations a month. See [Accounts, plans and AI quota](#accounts-plans-and-ai-quota).

## Architecture

```
src/
├── pages/                 # Route views: library, learning, planner, timetable,
│                          # curriculum, scheme, AI assistant, results, profile
├── components/
│   ├── chat/              # ChatPanel, launcher, guided flows, Markdown renderer
│   ├── course|lesson|quiz # Legacy interactive course + question bank runner
│   ├── planner|progress|layout|ui
├── context/               # Auth, Student, and shared Chat contexts
├── db/                    # Dexie tables + Firestore layers + migration
├── hooks/                 # useCourse, usePlanner, useTeacherSchedule, …
├── services/              # ai.js (chat/research/generators), curriculumSearch.js
└── data/
    ├── curriculum/        # NaCCA source markdown + maths B8/B9 JSON
    ├── curriculumData.js  # Generated curriculum structure (10 subjects × B7–9)
    ├── courses-data/      # Landing zone: <subject>/<class>/{notes,questions}/
    ├── courseLibrary/     # Generated per-class content modules + manifest
    ├── questionBank/      # Generated BECE question-bank modules + manifest
    ├── sampleLessonPlans.js # Generated bundled lesson notes
    ├── schemeOfLearning.json # Imported Maths/Science scheme + source errata
    └── courseUploads.js   # Generated upload metadata index

scripts/
├── parse-curriculum.mjs         # Builds curriculumData.js (incl. maths B8/B9)
├── parse-course-content.mjs     # Builds courseUploads.js + courseLibrary/
├── parse-question-bank.mjs      # Builds questionBank/ from the BECE papers
├── parse-sample-lesson-plans.mjs# Builds sampleLessonPlans.js
└── seed-course-notes.mjs        # One-time converter for the enriched notes

server.js                 # Local dev proxy: AI pass-through + Paystack webhook
api/generate.js           # Serverless AI proxy for deployment (Vercel)
api/_aiGate.mjs           # Shared Firebase auth + monthly AI quota gate
api/paystack-webhook.js   # Paystack webhook entry point (Vercel)
api/_paystackWebhook.mjs  # Shared charge.success verification + Pro activation
firestore.rules           # Per-user Firestore isolation; usage/payments are server-written
```

### Storage and sync

- Student profile, progress, attempts, quiz results, chat threads, timetable cache, and signed-out planner work live in IndexedDB through Dexie.
- Signed-in planner data and teacher schedules live under `/users/{uid}/...` in Firestore; the security rules restrict access to the authenticated owner.
- On sign-in, local planner data is copied to Firestore only when the account has no planner terms yet, and the sample teacher schedule is created only if absent.
- Planner hooks select the storage path based on authentication state; lesson-note, week-plan, and topic writes carry revisions to detect stale edits.

## Accounts, plans and AI quota

AI is a paid upstream cost, so it is metered server-side. Signed-out visitors can use the whole app except AI generation.

| Plan | Price | AI generations | Sync |
|---|---|---|---|
| Free | — | 10 per calendar month | Planner + timetable to Firestore |
| Pro | GH₵50 / month | Unlimited while `proExpiresAt` is in the future | Same, plus full textbook access |

**Where the state lives** — one Firestore doc per user, written only by the Admin SDK:

```
/users/{uid}/usage → { plan: 'free'|'pro', aiMonth: 'YYYY-MM', aiCount, proExpiresAt, updatedAt }
/payments/{reference} → audit + idempotency record for each Paystack charge
```

`firestore.rules` lets a user *read* their own `usage` doc and denies all client writes, so nobody can raise their own plan or reset their counter. `/payments/*` is denied to clients entirely.

**Request path** — `src/services/ai.js` attaches the signed-in user's Firebase ID token to every `/api/generate` call. `api/_aiGate.mjs` verifies it, then increments the counter inside a Firestore transaction *before* OpenRouter is called, and answers:

- `401 auth-required` → the UI shows "Sign in to use the assistant".
- `402 quota-exceeded` → the UI shows the monthly limit message and an upgrade prompt.

In development, `server.js` skips enforcement when `FIREBASE_SERVICE_ACCOUNT` is absent (it logs a warning) so local work stays friction-free. In a production runtime — detected via `VERCEL=1` or `NODE_ENV=production` — the gate fails **closed** with `503` instead, so a missing or malformed key can never turn the proxy into an open, unmetered endpoint that spends the OpenRouter balance.

**Payment path** — `src/services/payments.js` opens Paystack Inline with the signed-in user's email and uid in the transaction metadata; `api/_paystackWebhook.mjs` confirms the charge and sets `plan: 'pro'` for 30 days (renewals stack onto an unexpired period). See [Deployment & production](#deployment--production) for the verification model and setup steps.

## Getting started

### Prerequisites

- Node.js 18+ (Node 22 recommended — `npm run test:webhook` uses the built-in test runner)
- An [OpenRouter](https://openrouter.ai/keys) API key for AI features
- Firebase project configuration for Google + email/password Sign-In, cloud planner sync, and AI quota enforcement
- A [Paystack](https://dashboard.paystack.com) account for the Pro plan (optional until you charge anyone)

### Install dependencies

```bash
npm install
```

### Configure environment

```bash
cp .env.example .env
# Set OPENROUTER_API_KEY and the VITE_FIREBASE_* variables used by src/firebase.js.
# Add FIREBASE_SERVICE_ACCOUNT and the PAYSTACK_* keys when you want auth,
# quota enforcement and payments to work locally too (see .env.example).
```

Sign-in requires the local/deployed domain to be authorized in Firebase → Authentication → Authorized domains, with both the Google and Email/Password providers enabled. Without Firebase configuration the local-first features all still work and planner data stays on the device. Without `FIREBASE_SERVICE_ACCOUNT`, `server.js` logs a warning and lets AI requests through unauthenticated so local development is friction-free — production fails closed instead.

### Run locally

Open two terminals:

```bash
# Terminal 1 — AI proxy
node server.js

# Terminal 2 — Vite development server
npm run dev
```

The app is served at `http://localhost:5173` (or the next free port); Vite proxies AI requests to the local server on port 3001.

### Build and preview

```bash
npm run build
npm run preview
```

The production output is written to `dist/`. Before deploying, also run the webhook regression tests:

```bash
npm run test:webhook
```

## Environment variables

| Variable | Required | Default | Description |
|---|---:|---|---|
| `OPENROUTER_API_KEY` | For AI | — | Server-side OpenRouter API key |
| `SITE_URL` | No | `http://localhost:5173` | Referer sent to OpenRouter |
| `SITE_NAME` | No | `Lecturer Sam Academy` | App name sent to OpenRouter |
| `ALLOWED_ORIGIN` | No | `SITE_URL` | CORS origin accepted by the AI proxy |
| `SERVER_PORT` | No | `3001` | Local AI proxy port |
| `FIREBASE_SERVICE_ACCOUNT` | **Production** | — | Firebase Admin key (whole JSON on one line). Enables auth + quota enforcement and Pro activation; without it the AI gate is disabled locally and payments cannot be applied |
| `PAYSTACK_SECRET_KEY` | For payments | — | Verifies webhook signatures and calls Paystack's verify API. Server-side only |
| `VITE_PAYSTACK_PUBLIC_KEY` | For payments | — | Opens the Paystack Inline checkout in the browser. Must be `VITE_`-prefixed to reach the client |
| `VITE_FIREBASE_API_KEY` | For Firebase | — | Firebase web app API key |
| `VITE_FIREBASE_AUTH_DOMAIN` | For Firebase | — | Firebase Authentication domain |
| `VITE_FIREBASE_PROJECT_ID` | For Firebase | — | Firebase project ID |
| `VITE_FIREBASE_STORAGE_BUCKET` | As configured | — | Firebase storage bucket |
| `VITE_FIREBASE_MESSAGING_SENDER_ID` | As configured | — | Firebase messaging sender ID |
| `VITE_FIREBASE_APP_ID` | For Firebase | — | Firebase web app ID |

## Deployment & production

The app deploys as a static Vite build plus two Node functions (`api/generate.js`, `api/paystack-webhook.js`). `vercel.json` rewrites every non-`/api/` path to `index.html` for the SPA router.

### 1. Firebase

1. Create a **production** project (keep it separate from any test project).
2. **Authentication → Sign-in method:** enable **Google** and **Email/Password** — many Ghanaian teachers do not have a Google account, so email is not optional in practice.
3. **Authentication → Settings → Authorized domains:** add your production domain and the Vercel preview domain. Sign-in fails silently-ish otherwise.
4. **Firestore:** create the database, then deploy the rules:
   ```bash
   firebase deploy --only firestore:rules
   ```
   `firestore.rules` allows each user to reach only their own `/users/{uid}/**`, denies all client writes to `usage`, and denies everything else (which covers `/payments/*`).
5. **Project Settings → Service accounts → Generate new private key**, then store the JSON as `FIREBASE_SERVICE_ACCOUNT` (one line) in Vercel. Never commit it, never prefix it with `VITE_`.
6. Analytics: `src/services/analytics.js` wraps Firebase Analytics in a no-op-safe `track()` (it must never break a product flow). Events fired today — `sign_up` (email or first-time Google), `login`, `ai_generation` (with the assistant mode), and `quiz_completed` (with the percentage). Add new events at their call site, not in the wrapper.

### 2. Vercel

Set every variable from the table above, then deploy. `SITE_URL` and `ALLOWED_ORIGIN` should both be your production origin (`https://your-domain.com`) — `ALLOWED_ORIGIN` is what the AI proxy's CORS header is checked against.

Build output is `dist/`; no extra build configuration is needed. The AI proxy streams SSE, so `api/generate.js` sets `maxDuration: 60`.

### 3. Paystack

1. **Settings → API Keys & Webhooks:** take the test `pk_test_`/`sk_test_` pair first.
2. Set `VITE_PAYSTACK_PUBLIC_KEY` (client) and `PAYSTACK_SECRET_KEY` (server).
3. Register the webhook callback URL: `https://your-domain.com/api/paystack-webhook`. Test and live dashboards hold **separate** webhook URLs and keys — configure both when you switch over.
4. Pro is GH₵50/month = **5000 pesewas**, currency `GHS`. Both the client (`src/services/payments.js`) and the server (`api/_aiGate.mjs` → `PRO_AMOUNT_PESAWA`) read that constant; change it in both if the price changes.
5. Until keys are set the Upgrade button reports that payments are being set up, so you can deploy the UI before the account is ready. Early customers can also be granted Pro by hand in the Firestore console (`plan: 'pro'` + `proExpiresAt`).

**How webhook authenticity is decided.** Paystack signs the **raw request body** with HMAC-SHA512. Vercel pre-parses JSON bodies for Node functions, so the exact signed bytes are usually unrecoverable there — and hashing `JSON.stringify(req.body)` instead is the single most common webhook bug (whitespace, key order, unicode escapes and number formatting all differ). So the handler uses two independent checks:

- The signature is verified with a constant-time comparison whenever the raw bytes *are* available (`server.js`, and any platform that hands over a string or Buffer). A mismatch there rejects immediately. When the body arrived pre-parsed, the signature is treated as inconclusive — it is never a reason to reject a real payment.
- Entitlement is granted only after `GET https://api.paystack.co/transaction/verify/{reference}` confirms, on **your** account, that the transaction is `success` with the expected amount and currency. A forger cannot produce that. Deliveries are idempotent via `/payments/{reference}`, so Paystack's retries (every 3 min ×4, then hourly up to 72 h) cannot double-credit.

A charge that verifies but has no matching Firebase account is recorded as `unclaimed` and answered `200` — a `5xx` would make Paystack retry an unrecoverable case for three days. Support can reconcile those from `/payments/*`.

### 4. Test before you charge anyone

```bash
npm run build    # production build + PWA precache
npm test         # 27 assertions over the AI gate and the Paystack money path
```

`npm test` runs both suites (`test:gate` and `test:webhook` individually if you prefer). They use Node's built-in test runner, so there is nothing extra to install — and they pass without any API keys, which makes them safe to run in CI.

To exercise the webhook over real HTTP, start the dev proxy with a dummy secret and post an openssl-signed payload — the local server sees the raw body, so this tests the strict path:

```bash
SECRET=sk_test_dummy
BODY='{"event":"charge.success","data":{"reference":"lsa-test-001","amount":5000,"currency":"GHS","status":"success","customer":{"email":"teacher@example.com"},"metadata":{"uid":"your-uid"}}}'
SIG=$(printf '%s' "$BODY" | openssl dgst -sha512 -hmac "$SECRET" | awk '{print $NF}')

PAYSTACK_SECRET_KEY=$SECRET node server.js &
curl -X POST localhost:3001/api/paystack-webhook \
  -H 'Content-Type: application/json' -H "x-paystack-signature: $SIG" -d "$BODY"
```

A forged signature returns `401`; a correctly signed but unverifiable reference returns `502` (Paystack will retry). Point Paystack's test webhook at an `ngrok http 3001` URL to watch a real test charge flow through end to end.

### Pre-launch checklist

- [ ] Production Firebase project; Google **and** Email/Password enabled; production + preview domains authorized
- [ ] `firebase deploy --only firestore:rules` run against production
- [ ] `FIREBASE_SERVICE_ACCOUNT` set in Vercel — the function log must say `[ai-gate] Firebase Admin initialised — auth/quota enforcement ON`, never `missing or invalid`
- [ ] `OPENROUTER_API_KEY`, `SITE_URL`, `ALLOWED_ORIGIN`, `VITE_FIREBASE_*` set
- [ ] `npm test` and `npm run build` both pass on the commit you deploy
- [ ] Signed-out AI is refused with a sign-in prompt; the 11th free generation of a month is refused with the upgrade prompt
- [ ] Paystack **test** webhook configured and a test charge activates Pro (Profile shows "Pro plan")
- [ ] A repeat delivery of the same charge does not extend `proExpiresAt` twice
- [ ] `/terms` and `/privacy` reviewed by a lawyer and the WhatsApp support number filled in (`src/components/layout/navGroups.js`)
- ] Custom HTTPS domain live, PWA installs, and the offline shell loads on a cold start
- [ ] Textbook permission resolved (see below)

### Open pre-launch risks

- **Textbook copyright.** `src/data/courses-data/textbooks-and-references/COPYRIGHT.md` is a draft notice for Beacon Educational Consult with the publisher's contact details still to be filled in. A notice is **not** a licence: charging for access to a publisher's books needs written permission. NaCCA curriculum text is public, and the app's own teaching-method plans and AI output are yours — those are safe to monetise today.
- **Content coverage.** Notes and questions exist only for Mathematics (115 notes) and Science (82 notes) at B7/B8; B9 and the other eight subjects are empty. English is covered by the nine textbooks. Creative Arts still parses to 0 strands because the curriculum sources are stubs. Science textbook conversions have not been supplied — the pipeline ingests them automatically once they land in `md/`.
- **Bundle weight.** The PWA precaches ~18 MB and the largest book chunks are 500–690 KB, which is heavy on metered mobile data. Worth trimming before a wide student rollout.

## Tech stack

| Area | Technology |
|---|---|
| UI | React 19, Vite 7, React Router v7 |
| Styling | Tailwind CSS v4 |
| Icons | Lucide React |
| Markdown / math | react-markdown, remark-gfm, remark-math, KaTeX |
| Local database | Dexie / IndexedDB |
| Cloud auth and planner sync | Firebase Authentication (Google + email/password) and Cloud Firestore |
| Server-side auth, quota and entitlements | Firebase Admin (`api/_aiGate.mjs`) |
| Payments | Paystack Inline checkout + signed webhook (`api/_paystackWebhook.mjs`) |
| AI | OpenRouter (chat, structured generation, web search) via server proxy |
| PWA | `vite-plugin-pwa` |
| Local dev proxy | Node.js built-ins, sharing the `api/` gate modules |
| Tests | Node.js built-in test runner (`npm test`) |
