# Number Academy — Project Analysis

## Summary

Number & Algebra Academy is a well-structured, pedagogically-driven mathematics learning PWA aimed at secondary-level students studying Number and Algebra. The project is a v0.1 milestone: exactly one unit, one section (three lessons), and one quiz are content-complete, all focused on the meta-topic of *mathematical errors and misconceptions*. The codebase is clean, architecturally coherent, and ships meaningful features (misconception-mapped feedback, mastery bands, IndexedDB persistence, offline-first PWA) despite being early-stage. The primary gap is that Units 2–6 are declared but entirely empty; the app is effectively a proof-of-concept waiting for content.

---

## 1. Project Purpose and Concept

The app teaches Number and Algebra concepts "one concept at a time" through a structured Learn → Practise → Apply → Master flow. Its pedagogical hook is **misconception-aware feedback**: wrong answers aren't just marked incorrect — the system maps each wrong option to a named misconception and returns targeted instructional text to the student.

The first-milestone goal (stated in `README.md`) is:
> *A student can open the site, create a local nickname, complete Unit 1 Section 1 (three lessons), practise with misconception feedback, take the section quiz, and see progress persist after refresh.*

That goal is fully met by the current codebase.

**Target audience:** Secondary school students, likely in a West African curriculum context (references to `WAEC`-style question language, and content framing around "errors and misconceptions" which is common in mathematics teacher education). The app is explicitly free and requires no account.

---

## 2. Tech Stack

| Layer | Choice |
|---|---|
| Framework | React 19 (`react`, `react-dom`) |
| Routing | React Router v7 (`react-router-dom`) |
| Styling | Tailwind CSS v4 (`@tailwindcss/vite` plugin) |
| Build | Vite 7 + `@vitejs/plugin-react` |
| Persistence | Dexie 4 (IndexedDB wrapper) + `dexie-react-hooks` for live queries |
| PWA | `vite-plugin-pwa` (Workbox, auto-update) |
| Icons | `lucide-react` |
| Language | JavaScript (no TypeScript) |

All dependencies are current as of mid-2025. The stack is lean — no state management library (Redux, Zustand, etc.), no component library (MUI, Shadcn, etc.), no testing framework.

---

## 3. Architecture Overview

```
src/
├── App.jsx                  — Route table
├── main.jsx                 — Root render, providers, SW registration
├── index.css                — Tailwind + CSS custom properties (design tokens)
├── context/
│   └── StudentContext.jsx   — Single global context (student identity + settings)
├── data/                    — Static, bundled course content (plain JS objects)
├── db/                      — Dexie database layer (IndexedDB reads/writes)
├── hooks/                   — Composed data hooks (read-only aggregates)
├── utils/                   — Pure functions (scoring, mastery, validation)
├── components/
│   ├── layout/              — AppShell, BottomNav, LessonChrome
│   ├── lesson/              — LessonRenderer, ClassifyActivity, WorkedExample
│   ├── quiz/                — QuestionCard
│   ├── course/              — UnitCard, SectionList
│   ├── progress/            — MasteryList
│   └── ui/                  — Button, Card, Alert, ProgressBar (primitive components)
└── pages/                   — Route-level components (one per page)
```

**Key architectural decisions:**

- **Content is static data, not fetched.** Everything in `src/data/` is bundled JS — lessons, questions, units, misconceptions. No API. This works for an offline-first app at this content volume.
- **Persistence is in `src/db/`**, strictly separated from UI. DB functions are async and called directly from components/hooks — there is no abstraction layer beyond the module boundary.
- **One global context** (`StudentContext`) holds only identity and settings. All other state (lesson progress, quiz results) flows through `useLiveQuery` hooks that read directly from Dexie, giving the UI reactive, always-fresh data without manual subscriptions.
- **Pages are thin.** Route components pull hooks and hand data down to presentational components. Business logic lives in `hooks/` and `utils/`.

---

## 4. Data Model

### Static content (in `src/data/`)

**Course** (`course.js`)
```js
{ id, title, tagline, headline, description }
```

**Unit** (`units.js`)
```js
{ id, number, title, shortDescription, available: bool, sections: Section[] }
```

**Section** (nested inside Unit)
```js
{ id, title, available: bool }
// No lessons array here — lessons look up their sectionId
```

**Lesson** (`lessons.js`)
```js
{
  id, unitId, sectionId, title, order,
  objectives: string[],
  sections: LessonBlock[],  // the instructional sequence
  practice: questionId[],
  quizId: string | null
}
```

**LessonBlock** (polymorphic, typed by `type` field):
- `think-back` — reflective prompt with radio options
- `observe` — classify activity (error vs misconception)
- `explanation` — prose paragraph
- `example` — worked example with progressive step reveal
- `try` — single embedded question
- `practise` — set of embedded questions
- `reflect` — free-text textarea

**Question** (`questions.js`)
```js
{
  id, type: "mcq"|"trueFalse"|"numeric"|"fillBlank",
  topicId, question, answer, explanation, difficulty,
  options?: Option[],          // mcq only
  accepted?: string[],         // fillBlank alternatives
  misconceptions: { [wrongAnswerKey]: misconceptionId }
}
```

**Misconception** (`misconceptions.js`)
```js
{ id, title, feedback }
```

**Quiz** (`quizzes.js`)
```js
{ id, sectionId, unitId, title, questionIds: string[] }
```

### Persisted data (IndexedDB via Dexie — `src/db/database.js`)

| Store | Key | Notable fields |
|---|---|---|
| `students` | `id` | `name`, `createdAt`, `lastActive` |
| `progress` | `[studentId, lessonId]` | `status`, `percentage`, `mastery`, `startedAt`, `completedAt`, `lastAccessed` |
| `attempts` | `++id` | `studentId`, `questionId`, `answer`, `correct`, `score`, `timestamp` |
| `quizResults` | `++id` | `studentId`, `quizId`, `score`, `percentage`, `completedAt` |
| `misconceptions` | `[studentId, misconceptionId]` | `topicId`, `frequency`, `lastDetected` |
| `settings` | `id` | `theme`, `fontSize`, `sound`, `notifications` |

The `LOCAL_STUDENT_ID = "local-student"` constant means only a single anonymous local student is supported — no accounts, no multi-user.

---

## 5. State Management

State flows through three distinct layers:

1. **`StudentContext`** (global, `src/context/StudentContext.jsx`): Student identity and font-size preference. Powered by `useLiveQuery` on the `students` store so it re-renders when the DB row changes. Memoised with `useMemo` to avoid cascading re-renders.

2. **`useLiveQuery` hooks** (reactive DB reads): `useProgress` uses two `useLiveQuery` calls (`progress` and `quizResults` tables) and derives computed values (coursePercent, topicMastery, recentResults, continueLesson) synchronously. This is the dominant data-flow pattern — components subscribe to DB state, not to React state.

3. **Local component state** (`useState`): Used for transient UI state — quiz answer selections, lesson stage index, practice results, reflection text. `LessonRenderer` owns the multi-stage lesson navigation state.

There is no prop-drilling past one level. Context is minimal. The Dexie live-query pattern effectively acts as a lightweight reactive store.

---

## 6. Persistence Layer

**Dexie 4** wraps IndexedDB with a clean promise API. The schema is declared in `src/db/database.js` (version 1) and never migrated — suggesting the schema is intentionally stable for the milestone.

**`src/db/progress.js`** contains the most logic:
- `touchLesson()` — upserts a progress row on any lesson visit; updates `lastActive` on the student row.
- `completeLesson()` — sets `status: "completed"`, stores `mastery = percentage`.
- `sectionMastery()` — averages mastery scores across all lessons in a section.
- `courseCompletion()` — counts completed lessons out of total.
- `lastAccessedLesson()` — sorts by `lastAccessed` desc and returns first.

**`src/db/attempts.js`** records individual question attempts and increments a `frequency` counter in the `misconceptions` table when a wrong answer maps to a known misconception.

**`src/db/settings.js`** handles the single app-settings row and `upsertStudent()`.

**Important gap:** The `misconceptions` table in IndexedDB (tracking per-student misconception frequency) is written to via `recordAttempt`, but it is **never read back by any UI component**. The data is captured but silently discarded.

---

## 7. Routing and Navigation

Routes are declared in `App.jsx` using React Router v7 nested routes. `AppShell` acts as the layout wrapper via `<Outlet />`.

| Path | Component | Notes |
|---|---|---|
| `/` | `Home` | Landing page |
| `/dashboard` | `Dashboard` | Progress overview; redirects to `/profile` if no student |
| `/progress` | redirect → `/dashboard` | Alias |
| `/course` | `Course` | Unit grid |
| `/course/:unitId` | `Unit` | Sections list |
| `/lesson/:lessonId` | `Lesson` | Multi-stage lesson player |
| `/practice` | `Practice` | Free practice for u1-s1 questions |
| `/quiz/:quizId` | `Quiz` | Sequential quiz runner |
| `/results/:resultId` | `Results` | Quiz score display |
| `/profile` | `Profile` | Name + font size settings |

**Navigation UX:**
- Desktop: horizontal nav bar in `AppShell` header (hidden on mobile with `md:block`).
- Mobile: fixed bottom nav (`BottomNav`) with 5 items and Lucide icons (hidden on desktop with `md:hidden`).
- Within lessons: `LessonChrome` provides prev/next arrows and a progress bar.
- Lesson-to-quiz transition: `LessonRenderer` calls `onOpenQuiz(quizId)` on the final lesson stage, which triggers `navigate` in `Lesson.jsx`.

---

## 8. Feature Inventory

| Feature | Status | Location |
|---|---|---|
| Landing / marketing page | ✅ | `pages/Home.jsx` |
| Student profile (nickname + font size) | ✅ | `pages/Profile.jsx`, `context/StudentContext.jsx` |
| Course browser (6 units, cards) | ✅ (partial content) | `pages/Course.jsx`, `components/course/UnitCard.jsx` |
| Unit detail with section list | ✅ | `pages/Unit.jsx`, `components/course/SectionList.jsx` |
| Multi-stage lesson player | ✅ | `pages/Lesson.jsx`, `components/lesson/LessonRenderer.jsx` |
| Think-back reflective prompt | ✅ | `LessonRenderer` → `think-back` block |
| Classify activity (error/misconception) | ✅ | `components/lesson/ClassifyActivity.jsx` |
| Explanation blocks | ✅ | `LessonRenderer` → `explanation` block |
| Progressive worked example | ✅ | `components/lesson/WorkedExample.jsx` |
| Embedded practice questions (try/practise) | ✅ | `LessonRenderer` → `try`/`practise` blocks |
| Free-text reflection | ✅ | `LessonRenderer` → `reflect` block |
| MCQ questions | ✅ | `components/quiz/QuestionCard.jsx` |
| True/False questions | ✅ | `QuestionCard` |
| Numeric input questions | ✅ | `QuestionCard` |
| Fill-in-the-blank questions | ✅ | `QuestionCard` |
| Misconception-mapped feedback | ✅ | `QuestionCard`, `utils/validation.js`, `data/misconceptions.js` |
| Retry after wrong answer | ✅ | `QuestionCard` |
| Sequential quiz runner | ✅ | `pages/Quiz.jsx` |
| Quiz results screen | ✅ | `pages/Results.jsx` |
| Progress dashboard | ✅ | `pages/Dashboard.jsx` |
| Course-wide progress bar | ✅ | `useProgress` → `coursePercent` |
| Per-section mastery tracking | ✅ | `useProgress` → `topicMastery`, `MasteryList` |
| Mastery bands (4 levels) | ✅ | `utils/mastery.js` |
| Recent quiz results list | ✅ | Dashboard |
| "Continue learning" card | ✅ | Dashboard |
| Free practice page | ✅ | `pages/Practice.jsx` |
| IndexedDB persistence (progress survives refresh) | ✅ | `src/db/` |
| PWA / installable offline app | ✅ | `vite.config.js` (vite-plugin-pwa) |
| Misconception frequency tracking | ⚠️ Written, never read | `db/attempts.js` → `misconceptions` table |
| Theme switching (light/dark) | ❌ Setting exists, never used | `db/settings.js` |
| Sound toggle | ❌ Setting exists, never used | `db/settings.js` |
| Notifications | ❌ Setting exists, never used | `db/settings.js` |
| Units 2–6 content | ❌ Declared, empty | `data/units.js` |
| Sections u1-s2 through u1-s6 | ❌ Declared as unavailable | `data/units.js` |
| Test suite | ❌ None | — |

---

## 9. UI/UX Patterns

**Design system:** Custom, hand-rolled. No external component library. A small set of primitives lives in `src/components/ui/`:
- `Button` — three variants (primary, secondary, ghost); min-height 12 (48 px) for touch targets.
- `Card` — rounded-2xl wrapper with border and subtle shadow.
- `Alert` — four tones (info, good, warn, bad) using semantic color tokens.
- `ProgressBar` — accessible with `role="progressbar"` and aria attributes.

**Color system** (`index.css`): Uses Tailwind v4's `@theme` block to define semantic CSS custom properties — `--color-ink`, `--color-paper`, `--color-card`, `--color-line`, `--color-accent`, `--color-good`, `--color-warn`, `--color-bad`. This is a clean separation: Tailwind utilities reference semantic tokens, not raw values.

**Typography:** Dual-font system — `--font-sans` (Segoe UI system stack) for body, `--font-serif` (Palatino stack) for headings and display text. This creates a calm, academic feel appropriate for an educational product.

**Responsive layout:** Single-column mobile layout. Desktop layout widens to `max-w-5xl`. Navigation adapts: bottom bar on mobile, header nav on desktop.

**Accessibility:**
- Focus ring defined globally (3 px solid accent, 2 px offset) — good.
- `ProgressBar` uses ARIA progressbar correctly.
- `LessonChrome` nav buttons have `aria-label` for screen readers.
- Bottom nav icons have `aria-hidden="true"`.
- A screen-reader-only progress announcement exists in `LessonRenderer` (`<p className="sr-only">`).
- **Gap:** `QuestionCard` radio inputs inside MCQ lists lack `aria-label` beyond the label text — generally fine, but worth verifying with screen readers.
- **Gap:** `LessonRenderer`'s think-back radio group uses a shared `name` attribute but lacks a `<fieldset>`/`<legend>` grouping.

**Font size accessibility:** Three sizes (sm=15px, md=16px, lg=18px) toggled via `data-font` on `<html>`. Elegant approach.

---

## 10. Strengths

1. **Pedagogically principled.** The app isn't just question-and-answer — it embeds misconception-aware feedback as a first-class feature. The misconception taxonomy (`data/misconceptions.js`) is thoughtfully named and the feedback text is instructional, not just corrective. This is the project's strongest differentiator.

2. **Clean architecture with clear separation.** `data/` (static content), `db/` (persistence), `utils/` (pure functions), `hooks/` (aggregates), `components/` (UI), `pages/` (routes) — each folder has a single responsibility and the boundaries are respected throughout.

3. **Reactive persistence without a state management library.** Using `useLiveQuery` from `dexie-react-hooks` throughout gives the app real-time reactive data without Redux, Context overload, or manual subscription boilerplate. It's the right tool for an offline-first single-user app.

4. **Coherent design system.** The custom CSS token layer over Tailwind v4 is well-executed. Semantic color names (`ink`, `paper`, `card`, `accent`, `good`, `bad`) make the code readable and would make theming (e.g. dark mode) straightforward.

5. **Progressive lesson structure.** The `LessonBlock` polymorphic type system (think-back → observe → explain → example → try → practise → reflect) encodes a complete instructional sequence in data. `LessonRenderer` interprets it cleanly, making new lesson content easy to author without touching component code.

6. **Good touch accessibility.** 48 px minimum tap targets are set throughout (Button, radio labels, true/false buttons).

7. **PWA setup is production-grade.** Auto-update service worker, proper manifest, icon sizes, and Workbox precaching of all static assets.

---

## 11. Weaknesses and Gaps

### Critical gaps

1. **No content beyond Unit 1, Section 1.** Units 2–6 have `available: false` and empty `sections: []`. Sections u1-s2 through u1-s6 are also locked. The app is a one-section experience.

2. **No test suite at all.** No unit tests, no integration tests, no E2E tests. `utils/scoring.js`, `utils/validation.js`, and `utils/mastery.js` are pure functions that are highly testable but untested.

3. **Misconception tracking data goes nowhere.** `recordAttempt` increments `frequency` in the `misconceptions` IndexedDB table (`db/attempts.js` lines 20–28), but no hook, page, or component ever queries this table. A student's misconception pattern accumulates silently and is never surfaced.

### Architectural issues

4. **`useProgress` hard-codes `["u1-s1"]`** for `topicMastery` calculation (`hooks/useProgress.js` line 29). When new sections are added, this array must be manually extended. It should be derived from the data.

5. **Quiz completion logic is fragile (`pages/Quiz.jsx`)**: The `finish()` function calls `completeLesson` and then redundantly calls `touchLesson` on the same lesson with the same data (lines 28–37). The double-write is harmless but confusing. More importantly, it marks only the *last lesson in the section* as complete regardless of which lessons the student actually finished — completion state is tied to quiz submission, not individual lesson traversal.

6. **`recentQuizResults` in `db/attempts.js` is unused.** The function exists but is never called; `useProgress` queries the DB directly instead.

7. **No error boundary.** If Dexie fails to open (e.g. private browsing with storage blocked), the app will crash without any user-facing message.

8. **`Practice` page is static (`pages/Practice.jsx`).** It hardcodes `topicId === "u1-s1"` and renders all 10 questions at once with no state tracking or scoring. Practice attempts are recorded to the DB via `QuestionCard` → `recordAttempt`, but the page never shows any summary or session state.

### UX gaps

9. **No lesson completion feedback.** When a student hits "Complete lesson" in `LessonRenderer`, the lesson is marked complete in the DB but there is no success animation, toast notification, or visual confirmation before moving on.

10. **No "locked unit" explanation.** `UnitCard` shows a "Coming soon" button on unavailable units, but there is no indication of when or what prerequisite is needed.

11. **The `/progress` → `/dashboard` redirect is a dead URL in the nav.** The nav uses `/dashboard` correctly, but `/progress` is a legacy alias. The alias works, but the nav item label says "Progress" while linking to `/dashboard` — slightly inconsistent.

12. **Font size setting is not applied immediately.** In `Profile.jsx`, the font-size preview buttons change local state but the CSS change (`document.documentElement.dataset.font`) only fires after a save and a full `useEffect` cycle in `StudentContext` — the profile page doesn't preview the chosen size live.

13. **The `theme` setting (`light`/`dark`) is stored but never implemented.** The Profile page doesn't expose it and no CSS handles a dark variant.

### Minor issues

14. **`Card` wraps a `<section>` element** but has no heading, which makes it a sectioning element without an accessible name. Using `<div>` would be semantically safer for purely visual grouping.

15. **`LessonRenderer`'s think-back radio group** uses `name={lesson.id + "-think"}` but renders multiple radio buttons without a `<fieldset>`/`<legend>`. Screen readers may not announce the group question clearly.

16. **No 404 / catch-all route.** Navigating to an unknown path renders nothing inside the AppShell.

---

## 12. Overall Assessment

Number Academy is a **high-quality prototype** that has nailed its first milestone. The architecture is clean and forward-looking — the data model is rich enough to support many more units without structural change, and the pedagogical design (misconception-mapped feedback, mastery bands, multi-stage lessons) is more sophisticated than most hobby educational projects.

The app is **not production-ready** primarily because of scope: one section of content, no tests, and several half-implemented features (theme, sound, notifications, misconception analytics). The technical debt is low — what's there is built well — but what's missing is substantial.

**Priority recommendations if continuing:**

| Priority | Recommendation |
|---|---|
| P0 | Add a test suite — start with `utils/` pure functions (vitest is the natural choice given Vite). |
| P0 | Surface the misconception frequency data in the UI (dashboard or profile). The DB writes are already there. |
| P1 | Fix `useProgress`'s hardcoded `["u1-s1"]` to derive from `data/units.js` / `data/lessons.js` dynamically. |
| P1 | Add a Dexie error boundary to handle private-browsing / storage-quota failures gracefully. |
| P1 | Add a catch-all `<Route path="*" element={<NotFound />} />` in `App.jsx`. |
| P2 | Implement dark mode — the token layer makes it a small CSS change + a toggle in Profile. |
| P2 | Add lesson completion feedback (simple success animation or toast). |
| P2 | Remove the redundant `touchLesson` call in `Quiz.jsx`'s `finish()` function. |
| P3 | Add more content (sections u1-s2 through u6). This is the biggest value unlock for students. |
