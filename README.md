# Lecturer Sam Academy

An interactive web app for Ghanaian JHS teachers and students, built on the NaCCA Common Core Programme curriculum.

## What it does

- **Student learning** — lessons, worked examples, practice questions, and section quizzes for Number and Algebra (Basic 7–9)
- **Lesson planner** — teachers build a term plan by class level and subject, populate weekly topics from the curriculum, and generate AI-assisted lesson notes
- **AI assistant** — generates lesson plans, classroom activities, formative assessments, and indicator explanations aligned to NaCCA; supports free-form curriculum chat
- **Curriculum browser** — structured view of all strands, sub-strands, content standards, and indicators for Mathematics and Career Technology (B7–B9)
- **Progress tracking** — per-student mastery state persists locally across sessions; installable as a PWA for offline use

---

## Architecture

```
src/
├── pages/            # Route-level views (Home, Dashboard, Course, Lesson,
│                     # Practice, Quiz, Results, Curriculum, Planner,
│                     # PlannerTerm, PlannerSubject, PlannerLesson,
│                     # AIAssistant, Profile)
├── components/
│   ├── layout/       # AppShell, BottomNav, LessonChrome
│   ├── course/       # SectionList, UnitCard
│   ├── lesson/       # LessonRenderer, WorkedExample, ClassifyActivity
│   ├── planner/      # AddTopicModal, TermForm
│   ├── progress/     # MasteryList
│   ├── quiz/         # QuestionCard
│   └── ui/           # Alert, Button, Card, ProgressBar (shared primitives)
├── context/
│   └── StudentContext.jsx   # Active student + settings, live-queried from Dexie
├── db/               # Dexie (IndexedDB) layer
│   ├── database.js   # Schema (students, progress, attempts, quizResults,
│   │                 # misconceptions, settings, terms, classGroups,
│   │                 # subjects, weekPlans, weekTopics, lessonNotes)
│   ├── attempts.js
│   ├── planner.js
│   ├── progress.js
│   └── settings.js
├── hooks/            # useCourse, useLesson, useProgress, useQuiz
├── services/
│   └── ai.js         # Client-side AI service — POSTs to /api/generate
├── data/
│   ├── course.js          # Bundled course content
│   └── curriculum/        # NaCCA curriculum markdown files (B7–B9,
│                          # Mathematics + Career Technology)
└── utils/

server.js             # Lightweight Node.js AI proxy (no Express)
api/generate.js       # Serverless-function variant for deployment
scripts/
└── parse-curriculum.mjs   # Parses curriculum markdown → structured data
```

### Data flow

```
Browser (React + Vite)
  │
  ├─ Local state & persistence ──► IndexedDB via Dexie
  │                                 (students, progress, planner, quiz results)
  │
  └─ AI requests ──► POST /api/generate
                          │
                    ┌─────┴──────┐
                    │  Dev        │  Production
                    │  server.js  │  api/generate.js
                    │  :3001      │  (serverless)
                    └─────┬──────┘
                          │
                    OpenRouter API
                    (gpt-4o-mini by default)
```

### Key design decisions

- **No backend database** — all student data lives in the browser's IndexedDB. Teachers and students own their data; no account creation required.
- **API key proxy** — the OpenRouter key is kept server-side in `.env` and never sent to the browser. The client only talks to `/api/generate`.
- **PWA** — `vite-plugin-pwa` produces a service worker so the app shell and bundled course content work offline after the first visit.
- **Curriculum as markdown** — NaCCA curriculum documents are stored as structured markdown and parsed at build time, making them easy to update without touching application code.

---

## Getting started

### Prerequisites

- Node.js 18+
- An [OpenRouter](https://openrouter.ai/keys) API key (free tier works)

### Install

```bash
npm install
```

### Configure

```bash
cp .env.example .env
# Edit .env and add your OPENROUTER_API_KEY
```

### Run (development)

Open two terminals:

```bash
# Terminal 1 — AI proxy
node server.js

# Terminal 2 — Vite dev server
npm run dev
```

The app is served at `http://localhost:5173`. AI requests are proxied through `http://localhost:3001`.

### Build

```bash
npm run build   # outputs to dist/
npm run preview # preview the production build locally
```

---

## Environment variables

| Variable            | Required | Default               | Description                                      |
|---------------------|----------|-----------------------|--------------------------------------------------|
| `OPENROUTER_API_KEY`| Yes      | —                     | Your OpenRouter API key                          |
| `SITE_URL`          | No       | `http://localhost:5173` | Sent as `HTTP-Referer` to OpenRouter           |
| `SITE_NAME`         | No       | `Lecturer Sam Academy` | Display name sent to OpenRouter                  |
| `SERVER_PORT`       | No       | `3001`                | Port for the dev proxy server                    |

---

## Tech stack

| Layer         | Library / Tool                        |
|---------------|---------------------------------------|
| UI framework  | React 19 + Vite 7                     |
| Routing       | React Router v7                       |
| Styling       | Tailwind CSS v4                       |
| Icons         | Lucide React                          |
| Local storage | Dexie (IndexedDB wrapper)             |
| AI            | OpenRouter → gpt-4o-mini (via proxy)  |
| PWA           | vite-plugin-pwa                       |
| Server        | Node.js built-ins only (no Express)   |
