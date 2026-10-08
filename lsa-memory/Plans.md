##### **Production-hardening phase (auth + quotas + email login + payments + deploy)**

H1 — AI proxy authentication \& quota enforcement (the critical one)

Add firebase-admin; a shared gate module (api/\_aiGate.mjs) used by both proxies.

services/ai.js attaches the Firebase ID token (Authorization: Bearer) to every /api/generate call and maps structured errors: 401 auth-required (→ "Sign in to use the assistant") and 402 quota-exceeded (→ upgrade prompt).

Quota model: /users/{uid}/usage doc — { plan: 'free'|'pro', aiMonth: 'YYYY-MM', aiCount }. Server verifies the token, reads usage, and increments via transaction before calling OpenRouter. Free = 10 AI generations/month; Pro = unlimited (GH₵50/month). Pro users bypass the counter.

server.js (dev): enforces when FIREBASE\_SERVICE\_ACCOUNT is present; without it, warns and stays unauthenticated so your local workflow keeps working. api/generate.js (Vercel): always enforces.

firestore.rules: usage doc readable by its owner only (all writes go through the Admin SDK).

H2 — Email/password sign-in

AuthContext: signUpWithEmail(email, password, name), signInWithEmail(email, password), resetPassword(email) with friendly error mapping (email-already-in-use, invalid-credential, weak-password, invalid-email).

UI: the Onboarding sign-in step gains Google / Email tabs (sign-in, create-account toggle, forgot-password); the Profile Teacher-account card gets the same forms. README documents enabling the Email/Password provider in Firebase.

H3 — Entitlements UI \& sign-in gating

New useUsage() hook: live snapshot of the usage doc when signed in → { plan, used, limit, remaining }.

AI entry points (ChatPanel, PlannerLesson buttons): signed out → "Sign in to use AI"; free plan exhausted → "Monthly limit reached — Go Pro" linking to the account section.

Profile: plan status line ("Free plan — 7 of 10 used this month") + Upgrade button.

H4 — Paystack payments (built now, keys later)

api/paystack-webhook.js (Vercel): verifies x-paystack-signature (HMAC SHA-512), handles charge.success → sets plan: 'pro' + 30-day expiry in the usage doc.

services/payments.js + Profile UI: Paystack Inline checkout for GH₵50/month (amount 5000 pesewas, GHS), using the signed-in user's email. Works in Paystack test mode via PAYSTACK\_PUBLIC\_KEY/PAYSTACK\_SECRET\_KEY env vars; without keys the button shows "Payments coming soon".

Manual plan setting remains possible via the Firestore console for early customers.

H5 — Legal pages, support, analytics, deployment

/terms and /privacy pages (draft text aligned with the Ghana Data Protection Act 2012 basics), linked from the onboarding sign-in step, Settings, and the Profile account card.

WhatsApp support link (prefilled message) in the Help page and Settings.

Basic Firebase Analytics events (sign\_up, ai\_generation, quiz\_completed).

README gains a "Deployment \& production" section: Firebase console steps (Email provider, production project), the full Vercel env-var table (FIREBASE\_SERVICE\_ACCOUNT, PAYSTACK\_\*, OPENROUTER\_API\_KEY, SITE\_URL=https://lecturer-sam-academy.vercel.app, ALLOWED\_ORIGIN, VITE\_\*), and the Firestore rules note. vercel.json confirmed for SPA + functions.

Verification

Build; local dev with the unauthenticated fallback; email sign-up/sign-in/reset flows in the browser; quota path exercised against the gate logic (11th generation blocked for free users); Paystack test checkout renders in test mode; terms/privacy render. Real end-to-end token verification needs a service-account key exported from Firebase — I'll document the export step for you to do in the Firebase console.



Notes

Signed-out users can no longer use AI (by design — AI now requires an account, which also feeds sign-ups; onboarding makes sign-up one tap).

Paystack amounts are in pesewas (5000 = GH₵50.00).

server.js gains its first dependency (firebase-admin) — its no-dependency property is traded for parity with production.











##### **Onboarding + regrouped navigation**

Part 1 — Onboarding (Welcome → About → Authentication)

New src/pages/Onboarding.jsx at /onboarding, rendered outside the app shell — its own route in App.jsx, no header, no tabs, no chat button, no print chrome.

Three steps with progress dots and Back/Continue:

Welcome — app name, "Better Teachers Build Brighter Futures", one line about the NaCCA CCP for Ghanaian JHS, Get started.

About — four short cards: curriculum-aligned content (10 subjects B7–9, textbooks, BECE bank, teaching-method plans); works offline \& installable; your data (student progress stays on the device; Google sign-in only syncs teacher planner/timetable); AI assistant with curriculum grounding and cited research.

Sign in — reuses AuthContext: "Sign in with Google" (existing popup + shared authError banner) or "Continue without an account".

First-run gate: a GatedApp component in App.jsx reads a Dexie settings row (onboarded); before it exists, any route (except /onboarding) redirects to the onboarding. Finishing sets the flag and enters the app at Home. Replay via a "Welcome tour" item in Settings (the route stays open once onboarded).

Part 2 — Grouped navigation (4 groups, sub-items)

New src/components/layout/navGroups.js — single source of truth:

Teacher: Planner, Timetable, Scheme

Library: Curriculum, Notes (→ Course Library /course)

Student: Courses (→ legacy course /course/legacy), Notes (→ /course), Practice

Settings: Home, Profile, Progress, Help, Welcome tour

Plus getGroupForPath(pathname) for active highlighting.

Mobile (BottomNav.jsx rewrite): four group tabs (icon + label). Tapping a group opens a slide-up sub-menu sheet listing its items; tapping an item navigates and closes. The group containing the current route is highlighted.

Desktop (AppShell.jsx): brand (→ Home) + four dropdown group menus + the existing auth controls; active group highlighted.

Home stays the landing page (reachable via the brand on desktop and the Settings group on mobile). The chat FAB is unchanged. Help-page copy gets a small update to match the new menu names.

Files

App.jsx, components/layout/BottomNav.jsx (rewrite), components/layout/AppShell.jsx, components/layout/navGroups.js (new), pages/Onboarding.jsx (new), pages/Help.jsx (copy tweak), db/settings usage in the gate (no schema change — settings table exists).



Verification

Build; browser smoke: fresh origin shows the onboarding (no chrome) → skip sign-in → lands on Home; four mobile tabs → each sub-menu opens and navigates; desktop dropdowns work; replaying "Welcome tour" from Settings; onboarding never re-appears after completion.



Notes

"Notes" appears in both Library and Student intentionally (your grouping) — both open the Course Library.

Practice is the third Student item and Progress/Home live in Settings, per your choices.













##### **Teaching-method lesson plans (EOPT/reading method)**

Turn your 7-step teaching method into the app's lesson-plan structure, with plans generated from the content already embedded (curriculum + indicator notes + textbook chapters).



Phase 1 — Method templates as data

New src/data/teachingMethods.js registry:



eopt-reading — your exact 7 steps (EOPT/dictation → correction → objectives → image/video observation → reading time → discussion/demonstration → assignment), default for all subjects.

maths-eopt — drafted maths adaptation (mental-maths drill → correction → objectives → image/diagram → demonstration \& guided practice → discussion/problem-solving → assignment).

getMethodForSubject(subjectId) picks automatically; every step has { key, label, aiHeading } so wording is editable in one file.

Phase 2 — AI generation grounded in real content

generateMethodLessonPlan(...) in services/ai.js: system prompt builds the method's exact section headings (\*\*EOPT / DICTATION\*\*, …); grounding input = the exact curriculum indicator text plus the indicator's notes from the Course Library plus the textbook chapter that teaches it (from bookIndex.chapterRefs, truncated to \~1,200 words to control tokens).

extractMethodSections(text, method) parses the response into the 7 steps (reuses the existing section-extractor pattern).

Phase 3 — Storing + rendering the method plan

Lesson notes gain methodId + sections: \[{key, label, content}] — extra fields only; Dexie and Firestore are schemaless, no migration.

PlannerLesson overview shows the full 7-step plan (markdown) when a note has sections; the existing stepper fields are also populated (steps 1–2 → starter, 5–6 → main learning, 7 → homework, 4 → resource) so the classic view keeps working. A "✨ Generate with teaching method" button sits next to the existing per-step generators.

Phase 4 — Entry points

Library indicator pages and book chapters: "✍️ Plan this lesson" buttons open the chat panel and start the existing lesson-plan flow pre-filled with subject/class/indicator (and the chapter's codes from the book reader) — skipping the strand/content-standard picking, jumping to the week step.

The flow gains a "Which teaching method?" step (chips, pre-selected by subject); its "Generate the full lesson note" step now uses the method generator, so the finished note carries your 7-step structure.

ChatContext gains a small startLessonPlanFlow(preset) API for these deep links.

Phase 5 — Docs + verification

README feature bullet; build; browser smoke: indicator-page button → flow → note renders the 7 sections; book-chapter button preselects codes; mathematics uses the maths variant.

Notes

One AI call per plan (same cost as today's generator).

Classic fields stay mapped for backward compatibility with the existing stepper and auto-save.

Your exact wording lives in teachingMethods.js — tweaking a step label updates every future plan.













##### **Course-Content Pipeline + Curriculum Library + README refresh**

Phase 1 — Parser: per-indicator content modules

Extend scripts/parse-course-content.mjs (keeps one pipeline; existing courseUploads.js metadata output stays for compatibility, with a fix).



Upload convention (documented in src/data/courses-data/README.md):



src/data/courses-data/<subject>/<class>/notes/<indicator-code>.md — filename IS the normalized code (e.g. B7.1.2.2.1.md). Frontmatter: title, optional class/subject. Headings: ## Objectives, ## Explanation, ## Worked Example, ## Practice.

.../questions/<indicator-code>.md — frontmatter title; body of ### Q1 blocks: type: mcq|trueFalse|fillBlank, question:, options - \[ ] … / - \[x] … (x = correct), explanation:, difficulty:.

Parser work:



Parse notes/questions files into generated, lazy-loaded modules src/data/courseLibrary/<subject>/<classId>.js (indicators: \[{ code, notes, questions }]) + src/data/courseLibrary/index.js manifest with loadEntries(subjectId, classId) — same pattern as questionBank/index.js.

Questions normalized to the existing questions.js shape (id: <norm-code>-q<n>, type, topicId, question, options: \[{id, text}], answer, explanation, difficulty) so QuestionCard works unchanged.

Fix the class-detection bug: B8/B9 files are indexed as "Basic 7" (detectClass fallback). Fix the regex and add a validation rule — filename class must agree with detected class (error, not silent).

Validation: every notes/questions code must exist in curriculumMap (with /JHS normalization); duplicate indicator files and malformed question blocks (missing question/answer/options) are errors with file+line; --check lists all.

Phase 2 — Course Library UI (rework /course; legacy course preserved)

Course.jsx becomes the library browser: subject chips (only subjects with content) → class chips → strands → content standards with indicator rows showing 📖 notes / 🎯 N questions badges → /library/:subjectId/:classId/:indicatorCode.

New LibraryIndicator.jsx: lazy-loads the class module; tabs — Notes (objectives, explanation, worked example via the shared Markdown component), Practice (QuestionCard list, attempts recorded), Quiz (self-contained quiz: one-at-a-time QuestionCards, score, saveQuizResult, marks progress via completeLesson with id lib-<norm-code>).

Legacy interactive course: the current units-list UI moves into a LegacyCourse.jsx rendered at /course/legacy, linked from a card in the library. All legacy routes (/course/:unitId, /lesson/:lessonId, /quiz/:quizId) and ids (u1-s1, unit-1, …) stay untouched.

Reuse: Markdown, QuestionCard, Card/Button. No changes to LessonRenderer, useQuiz, or useProgress (library progress is recorded but not mixed into the legacy course percent).

Phase 3 — Content seeding (one-time scripts/seed-course-notes.mjs)

Convert src/data/ai/MATHEMATICS\_ENRICHED\_B7\_B8.md + SCIENCE\_ENRICHED\_B7\_B8.md: parse #### Week N context, \*\*CODE\*\* — text indicator blocks, \*Exemplars:\*, \*Core competencies:\* → emit per-indicator notes files for maths/science B7+B8 (\~200 small files). Skip and report the 4 codes the source itself flags as non-existent.

Create 2 example question files (maths B7 B7.1.2.2, science B7 one indicator) demonstrating the exact format.

Run the pipeline — the library launches with \~200 indicator notes and 2 question sets.

Phase 4 — README refresh

Full rewrite of root README.md to match reality: assistant (panel, guided flows, research mode), Timetable, planner + Firebase sync, curriculum browser (10 subjects, incl. maths B8/B9), Scheme of Learning, BECE question bank, sample lesson plans, new Course Library + upload conventions, all four parser commands, updated architecture tree, env vars, tech stack. Also rewrite src/data/courses-data/README.md with the notes/questions convention.



Verification

npm run check:course-data clean (including the new class-mismatch rule), npm run parse:course-data, npm run build (courseLibrary chunks code-split), then browser smoke: library browse → indicator notes render; practice answer + feedback; quiz flow → results; legacy course card opens Unit 1; old /lesson/u1-s1-l1 route still works.

Notes

Seeded notes are lossy by design (PDF-flattened worked examples flagged in the source files) and are placeholders until real uploads replace them.

The per-indicator quiz is self-contained rather than reusing the legacy quiz registry, avoiding sync lookups that would defeat code-splitting

























##### **Lecturer Sam Academy — Assistant, Timetable \& Content Retool Plan**

Commit the pending auth bug fixes first (separate commit), then build in three phases, each independently shippable.



Phase A — Greeting chatbot platform + actions (timetable \& lesson plan)

A1. Proxy pass-through + streaming (server.js, api/generate.js)



Stop hardcoding { model, messages } — validate messages but forward all client params (plugins, web\_search\_options, stream, temperature, …).

Streaming: server.js pipes OpenRouter's SSE chunks through instead of buffering (stream: true path); api/generate.js streams orRes.body back to the client on Vercel. Non-streaming stays as the fallback.

A2. AI service layer (src/services/ai.js)



chat() gains a stream mode (fetch + ReadableStream SSE parser, on-token callback) used by the panel.

New researchChat() for Phase B (see below).

New local grounding util src/services/curriculumSearch.js: regex for indicator codes (B7.1.1.1.1, B7/JHS1.x.x.x.x) → inject the exact curriculumMap entry into the chat context (cheap zero-infra RAG). Replaces the "tomorrow" shortcut's role with real timetable-aware context (keep the shortcut).

A3. Chat UI platform (new src/context/ChatContext.jsx + src/components/chat/)



Shared chat state (messages, loading, persona) so the floating panel and full page show the same thread.

Floating assistant button in AppShell (bottom-right FAB) opening a side panel; the existing /ai-assistant page reuses the same ChatPanel full-screen. Home gets a small "Ask your assistant" card.

Greeting + action chips: "Create a timetable", "Create a lesson plan", "Research a topic online", "Ask anything" — chips start guided flows.

Guided-flow framework: chip → bot asks a fixed sequence of chip-based questions (no free-text parsing for critical params) → executes real app actions → result message with a navigate link.

Markdown: replace the regex AiText renderer (in AIAssistant.jsx and Curriculum.jsx's AI drawer) with react-markdown + remark-gfm + remark-math/rehype-katex (+ KaTeX CSS) — new deps: react-markdown, remark-gfm, remark-math, rehype-katex, katex.

Persist threads to Dexie (new v5 tables chatThreads / chatMessages) so chats survive navigation.

A4. Timetable — new page + save path (new src/pages/Timetable.jsx, route /timetable, nav entry in header + BottomNav)



Weekly grid per class (class chips Basic 7/8/9), days × periods (cells = subject text, tap-to-edit), add/remove class and period, save.

New saveTeacherSchedule(uid, schedule) in src/db/teacherSchedule.js: writes Firestore /users/{uid}/teacher\_schedules/{scheduleId} when signed in (scheduleVersion bump), always caches to Dexie — mirrors the planner's offline-first philosophy. useTeacherSchedule() extended with a save action.

"Create a timetable" chat flow: ask class(es) → subjects → periods/day → AI generates the weeklyTimetable JSON (structured output) → preview message → Save → "Open Timetable" link.

A5. "Create a lesson plan" chat flow — drives the existing auth-aware planner pipeline (usePlannerActions): pick/create term → class level → curriculum subject → strand → sub-strand → content standard → indicators → week → executes createTerm/addClassGroup/addSubject/upsertWeekPlan/addWeekTopic (indicatorIds stringified, per existing convention) → message with link to /planner/:termId/:subjectId/:topicId, where the existing AI generators + auto-save already work. Optionally pre-generate the full lesson note via generateLessonPlan + upsertLessonNote before linking.



Phase B — Research mode (web search for content standards \& indicators)

researchChat() in services/ai.js using OpenRouter's web plugin on the existing model: plugins: \[{ id: 'web', include\_domains: \[...], max\_results: 5, search\_context\_size: 'medium' }] with a curated educational domain list (nacca.gov.gh, mgb.gov.gh, khanacademy.org, bbc.co.uk/bitesize, openstax.org, …). No new API keys; works with all models via OpenRouter's fallback search engine (\~$0.02/request).

Parse OpenRouter's url\_citation annotations → render clickable source chips under the answer.

Research toggle in the chat header (Research / Assistant modes); indicator-code lookups still resolve locally first via curriculumSearch.js.

Phase C — Embed all curriculum data, sample lesson plans, question bank

C1. Question bank — new scripts/parse-question-bank.mjs parses the 66 BECE-style science papers in src/data/courses-data/complete-science-questions/ into structured questions (Section A MCQs with options, Section B theory, answer key, marking scheme). Output: per subject-class generated modules (src/data/questionBank/science/basic7.js …) + manifest index, loaded via dynamic import (source is \~3.7 MB). --check mode validates every parsed question against all 66 files, reporting unmatched ones. New "Question Bank" tab on the Practice page: pick subject → class → paper → answer MCQs with feedback and score, reusing the attempts tables.



C2. Sample lesson plans — parse src/data/lesson-plans/Week\_5\_Lesson\_Notes\_Basic\_7\_and\_8.md (4 real lesson notes: B7/B8 Maths + Science) into generated src/data/sampleLessonPlans.js, mapping each note's phases onto the existing lessonNote fields (starter/mainLearning/plenary/evaluation/homework/resources + indicator codes). Surfaces: "Load sample plan" button in PlannerLesson.jsx (matched by subject/class) and a "Browse sample plans" chat action.



C3. Curriculum gaps — extend scripts/parse-curriculum.mjs to ingest nacca\_maths\_ccp\_structured\_b8\_b9.json so curriculumMap.mathematics.B8/B9 is no longer empty; regenerate curriculumData.js. Creative Arts sources are 1.2 KB stubs — the parser will emit what exists and flag the gap for a future upload.



C4. Grounding — curriculumSearch.js also searches sample plans + question-bank metadata, so both chat modes can answer "from the notes in this app".



Verification

npm run build (PWA precache) + npm run parse:course-data / check:course-data and the new check modes after each phase.

Browser smoke tests via dev server: panel greeting + chips, timetable create/edit/save (Dexie and Firestore paths), lesson-plan flow producing real planner rows + opening a lesson, research answer with citations, question-bank practice, load-sample-plan.

Notes / risks

Web search adds \~$0.02/request (OpenRouter pricing); capped with max\_results: 5.

Vercel nodejs runtime streams fine; server.js keeps its 64 KB body cap (question-bank parsing happens client-side/offline, never through the proxy).

Timetable edit conflicts: last-write-wins via scheduleVersion bump (no revision tracking yet).

Out of scope for this round: period start/end times, timetable printing/export, teacher/student profile sync, AI-quiz import — noted as follow-ups.











PROGRESS SO FAR
H1: firebase-admin + \_aiGate.mjs + server.js + api/generate.js enforcement

H1: ai.js bearer token + 401/402 error mapping; firestore.rules usage doc

H2: AuthContext email methods + Onboarding/Profile email forms

H3: useUsage hook + AI gating UI (ChatPanel, PlannerLesson, Profile)

H4: Paystack checkout service + webhook + Profile upgrade UI

**<i>~~The last previous task -  was H4~~</i>**





H5: Terms/Privacy pages, WhatsApp support, analytics, README deployment

Build + browser verification + commit





