# Lecturer Sam Academy

An installable, offline-capable learning and teaching app for Ghanaian JHS teachers and students, aligned with the NaCCA Common Core Programme (Basic 7–9).

## Features

- **Student learning:** A course → unit → lesson flow with worked examples and interactive activities, plus practice, quizzes, results, and locally saved progress. The original Number & Algebra course remains available alongside the newer course-upload index.
- **NaCCA curriculum browser:** Browse strands, sub-strands, content standards, and indicators for the curriculum subjects and classes embedded in the app.
- **Scheme of Learning browser:** Browse the 2026/2027 Mathematics and Science scheme for Basic 7 and Basic 8 across all three terms, including weekly indicators, resources, expanded curriculum wording, examples, and competencies. It is bundled for offline use; source errata are shown in the app.
- **Teacher lesson planner:** Build terms, class groups, subjects, weekly plans, and curriculum-linked topics. Generate and save lesson notes with AI assistance.
- **Offline-first planner storage and account sync:** Planner records use Dexie/IndexedDB when signed out and Firebase Firestore when signed in. Google Sign-In enables per-user cloud sync; local planner data is migrated to a new account when appropriate. Lesson-note, week-plan, and topic edits use revision checks to detect concurrent changes rather than silently overwriting newer work.
- **Teacher/student AI modes:** The assistant supports practical NaCCA-focused teacher guidance and a scaffolded, age-appropriate student tutor mode with Basic 7–9 context. Teacher mode can answer “What am I teaching tomorrow?” from the current sample timetable and schedule data. The full 2026/2027 Mathematics and Science scheme is separately browsable from the Scheme page; the source document does not provide a daily timetable or school-specific term dates.
- **Teacher schedule persistence:** When a teacher signs in, the sample timetable and scheme-of-learning are initialized once in the private Firestore path `/users/{uid}/teacher_schedules/sample`. The assistant reads the signed-in teacher’s schedule, keeps a local IndexedDB cache for offline access, and falls back to the bundled sample while the cloud copy is unavailable. The current sample is copied per account; schedule editing/import is not implemented yet.
- **Markdown course uploads:** Markdown materials under `src/data/courses-data/` are indexed into a generated metadata module. The Course page summarizes the indexed packs, class levels, subjects, and curriculum-code coverage.
- **Installable PWA:** The app shell and bundled resources are available offline after the first visit.

## Course content uploads

Place Markdown lesson or assessment files under `src/data/courses-data/`. The parser scans nested folders, excluding `README.md` and the `curriculum/` source-material folder. Files without frontmatter are indexed using their filename and content.

For new materials, frontmatter is recommended:

```md
---
title: Agricultural Tools
class: Basic 7
subject: Integrated Science
indicators: B7.1.2.2.1
---

# Agricultural Tools

## Objectives
- Identify common farm tools

## Explanation
...

## Practice
1. Which tool is used to clear weeds?
```

Refresh the generated `src/data/courseUploads.js` index after adding or editing content:

```bash
npm run parse:course-data
```

Validate class metadata, headings, duplicate IDs, and explicitly declared curriculum codes against the embedded NaCCA curriculum:

```bash
npm run check:course-data
```

Legacy files may produce warnings when curriculum codes found in their content do not match the embedded curriculum. Explicitly declared frontmatter codes that do not match are errors. The current index is metadata only: the uploaded Markdown is not yet rendered as interactive lessons or imported into the quiz/practice flows.

## AI assistant behavior

AI calls go through the server-side `/api/generate` proxy; the OpenRouter key is not exposed to the browser. Teacher mode uses a Ghanaian JHS curriculum-specialist prompt and has a local schedule response for tomorrow questions. That response currently uses sample Basic 7/8 timetable and Week 5 scheme data in `src/data/ai/teacherSchedule.js`; it is a prototype, not a personalized school timetable. Student mode asks the assistant to explain in smaller steps and adapt to the selected class level.

## Architecture

```
src/
├── pages/                 # Route-level views: student learning, curriculum,
│                          # planner, AI assistant, results, and profile
├── components/            # Shared layout, course, planner, quiz, and UI pieces
├── context/               # Student profile/settings and Firebase auth contexts
├── db/                    # Dexie and Firestore planner data layers + migration
├── hooks/                 # Course/progress and auth-aware planner hooks
├── services/ai.js         # Client AI service and teacher schedule response
└── data/
    ├── curriculum/        # NaCCA source markdown
    ├── curriculumData.js  # Generated curriculum structure
    ├── schemeOfLearning.json # Imported Mathematics/Science scheme and source errata
    ├── courses-data/      # Markdown course/assessment uploads
    └── courseUploads.js   # Generated upload metadata index

scripts/
├── parse-curriculum.mjs      # Builds curriculumData.js
└── parse-course-content.mjs  # Builds/validates courseUploads.js

server.js                 # Dependency-free local AI proxy
api/generate.js           # Serverless AI proxy for deployment
firestore.rules           # Per-user Firestore isolation
```

### Storage and sync

- Student profile, progress, attempts, quiz results, and signed-out planner work are stored locally in IndexedDB through Dexie.
- Signed-in planner data is stored under `/users/{uid}/...` in Firestore; the security rules restrict access to the authenticated owner.
- On sign-in, local planner data is copied to Firestore only when the account has no planner terms yet. This avoids overwriting an existing cloud planner with local data.
- The sample teacher schedule is created transactionally only when that teacher’s `teacher_schedules/sample` document does not exist. It is owner-private under the existing `/users/{uid}/...` Firestore rules and is cached locally after a successful Firestore snapshot.
- Planner hooks select the storage path based on authentication state. Lesson-note, week-plan, and topic writes carry revisions to detect stale edits; lesson notes provide actions to load the latest version or explicitly overwrite it.

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

The Firebase web-app configuration is read by the app from the `VITE_FIREBASE_*` environment variables. Google Sign-In also requires the deployed/local domain to be authorized in Firebase Authentication. Without Firebase configuration, use the app's local-first features and keep planner data on the device.

### Run locally

Open two terminals:

```bash
# Terminal 1 — AI proxy
node server.js

# Terminal 2 — Vite development server
npm run dev
```

The app is served at `http://localhost:5173`; Vite proxies AI requests to the local server on port 3001.

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

Check `.env.example` and `src/firebase.js` for the exact Firebase configuration fields used by this checkout.

## Tech stack

| Area | Technology |
|---|---|
| UI | React 19, Vite 7, React Router v7 |
| Styling | Tailwind CSS v4 |
| Icons | Lucide React |
| Local database | Dexie / IndexedDB |
| Cloud auth and planner sync | Firebase Authentication and Cloud Firestore |
| AI | OpenRouter via server proxy |
| PWA | `vite-plugin-pwa` |
| Local AI proxy | Node.js built-ins |
