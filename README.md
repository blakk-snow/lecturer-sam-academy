# Lecturer Sam Academy

An installable, offline-capable learning and teaching app for Ghanaian JHS teachers and students, aligned with the NaCCA Common Core Programme (Basic 7–9).

## Features

- **Course Library:** A curriculum-driven browser — subject → class → strand → content standard → indicator — where each indicator with uploaded content opens lesson notes, practice questions, and a generated quiz. The original interactive "Number & Algebra" course (worked examples, classify activities, mastery quizzes) remains available from the library.
- **NaCCA curriculum browser:** Strands, sub-strands, content standards, and indicators for all 10 subjects across Basic 7–9, including Mathematics B8/B9.
- **BECE question bank:** All 66 bundled BECE-style science mock papers (~2,600 multiple-choice questions with answer keys) parsed into a structured bank with an interactive practice runner on the Practice page.
- **Sample lesson plans:** Bundled Week-5 lesson notes (Maths and Science, Basic 7 and 8) that can be loaded into a planner lesson note in one tap.
- **AI assistant:** A floating chat panel on every page (and a full-page view) with a greeting and action chips — create a timetable, create a lesson plan (guided flow that builds real planner rows), browse sample lesson plans, or research a topic online. Research mode searches the web (OpenRouter web plugin with educational-domain filters) and cites sources. Teacher and student personas; answers are grounded in the embedded curriculum.
- **Teacher timetable:** A weekly grid editor per class (`/timetable`). The assistant can generate the initial timetable and save it; edits sync to Firestore when signed in and to the device always.
- **Teacher lesson planner:** Terms, class groups, subjects, weekly plans, and curriculum-linked topics, with AI-assisted lesson notes and auto-save.
- **Scheme of Learning browser:** The 2026/2027 Mathematics and Science scheme for Basic 7 and 8 across all three terms, with weekly indicators, resources, and source errata.
- **Offline-first storage and account sync:** Dexie/IndexedDB when signed out, Firebase Firestore when signed in (Google Sign-In). Local planner data migrates to a new account when appropriate; lesson-note, week-plan, and topic edits use revision checks to detect concurrent changes.
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

```bash
npm run parse:course-data     # refresh courseUploads.js and the courseLibrary modules
npm run check:course-data     # validate against the embedded curriculum (also writes)
```

Validation covers: filename/frontmatter class agreement, duplicate ids, indicator codes that must exist in the embedded curriculum, and malformed question blocks (reported with file and question number).

## AI assistant

AI calls go through the server-side `/api/generate` proxy; the OpenRouter key is never exposed to the browser. The proxy forwards all client parameters and streams responses (SSE). Research mode adds OpenRouter's web plugin with an educational-domain allowlist; answers come back with source citations.

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

server.js                 # Dependency-free local AI proxy (streaming pass-through)
api/generate.js           # Serverless AI proxy for deployment (Vercel)
firestore.rules           # Per-user Firestore isolation
```

### Storage and sync

- Student profile, progress, attempts, quiz results, chat threads, timetable cache, and signed-out planner work live in IndexedDB through Dexie.
- Signed-in planner data and teacher schedules live under `/users/{uid}/...` in Firestore; the security rules restrict access to the authenticated owner.
- On sign-in, local planner data is copied to Firestore only when the account has no planner terms yet, and the sample teacher schedule is created only if absent.
- Planner hooks select the storage path based on authentication state; lesson-note, week-plan, and topic writes carry revisions to detect stale edits.

## Getting started

### Prerequisites

- Node.js 18+
- An [OpenRouter](https://openrouter.ai/keys) API key for AI features
- Firebase project configuration for Google Sign-In and cloud planner sync

### Install dependencies

```bash
npm install
```

### Configure environment

```bash
cp .env.example .env
# Set OPENROUTER_API_KEY and the Firebase variables used by src/firebase.js.
```

Google Sign-In requires the deployed/local domain to be authorized in Firebase Authentication. Without Firebase configuration, the app's local-first features work and planner data stays on the device.

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

The production output is written to `dist/`.

## Environment variables

| Variable | Required | Default | Description |
|---|---:|---|---|
| `OPENROUTER_API_KEY` | For AI | — | Server-side OpenRouter API key |
| `SITE_URL` | No | `http://localhost:5173` | Referer sent to OpenRouter |
| `SITE_NAME` | No | `Lecturer Sam Academy` | App name sent to OpenRouter |
| `SERVER_PORT` | No | `3001` | Local AI proxy port |
| `VITE_FIREBASE_API_KEY` | For Firebase | — | Firebase web app API key |
| `VITE_FIREBASE_AUTH_DOMAIN` | For Firebase | — | Firebase Authentication domain |
| `VITE_FIREBASE_PROJECT_ID` | For Firebase | — | Firebase project ID |
| `VITE_FIREBASE_STORAGE_BUCKET` | As configured | — | Firebase storage bucket |
| `VITE_FIREBASE_MESSAGING_SENDER_ID` | As configured | — | Firebase messaging sender ID |
| `VITE_FIREBASE_APP_ID` | For Firebase | — | Firebase web app ID |

## Tech stack

| Area | Technology |
|---|---|
| UI | React 19, Vite 7, React Router v7 |
| Styling | Tailwind CSS v4 |
| Icons | Lucide React |
| Markdown / math | react-markdown, remark-gfm, remark-math, KaTeX |
| Local database | Dexie / IndexedDB |
| Cloud auth and planner sync | Firebase Authentication and Cloud Firestore |
| AI | OpenRouter (chat, structured generation, web search) via server proxy |
| PWA | `vite-plugin-pwa` |
| Local AI proxy | Node.js built-ins |
