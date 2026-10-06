A look at the project structure and key files to give you an overview.

The README gives a good picture. Let me look a bit deeper at the actual source tree (which has evolved past the README) and the recent work artifacts.

One more quick check on the generated curriculum data and recent git history, then I'll summarize.

Here's an overview of the project.

## What it is

**Lecturer Sam Academy** is an installable web app (PWA) for Ghanaian Junior High School teachers and students, built around the NaCCA Common Core Programme curriculum (Basic 7–9). It started as "Number Academy" (a Number & Algebra learning app — the original spec is preserved in `NUMBER ACADEMY.md`) and has grown into a broader teaching platform. It's your own project at an early stage (v0.1.0, ~15 commits over the past few days).

## The four feature areas

1. **Student learning** — a Course → Unit → Lesson flow with worked examples and interactive activities, plus Practice, Quizzes, and Results pages. Content is bundled in `src/data/` (lessons, questions, quizzes, misconceptions).
2. **Curriculum browser** — a structured view of NaCCA strands/sub-strands/indicators. Source material lives as 49 markdown files in `src/data/curriculum/` covering far more subjects than the README mentions: Mathematics, Science, Computing, English, French, Ghanaian Language, Career Technology, and Creative Arts (B7–B9). A build script (`scripts/parse-curriculum.mjs`) compiles these into a ~600 KB `curriculumData.js`.
3. **Lesson planner** — teachers build term plans by class and subject, populate weekly topics from the curriculum, and generate AI-assisted lesson notes with auto-save (`Planner → Term → Subject → Lesson` routes).
4. **AI assistant** — lesson plans, activities, assessments, and free-form curriculum chat, powered by OpenRouter (gpt-4o-mini by default).

## Architecture

- **Frontend:** React 19 + Vite 7, React Router v7, Tailwind CSS v4, Lucide icons. All 15 route pages are lazy-loaded ([App.jsx](src/App.jsx)).
- **Local persistence:** Dexie/IndexedDB (`src/db/`) for students, progress, attempts, quiz results, and planner data — no backend database for student data.
- **Cloud (newly added):** Firebase Google Sign-In + Firestore sync for planner data, with per-user isolation enforced in `firestore.rules`. The last two commits added this; `AuthContext` and `plannerFirestore.js` are the new seams.
- **AI proxy:** `server.js` is a dependency-free Node proxy (dev, port 3001) that keeps the OpenRouter key server-side; `api/generate.js` is the Vercel serverless equivalent (there's a `vercel.json`, so production targets Vercel).
- **Offline:** `vite-plugin-pwa` service worker caches the app shell and content.

## Repo state worth knowing

- `.agents/tasks/` holds the planning/review artifacts from the build (planner plan, curriculum dashboard plan, topic-UI review, and an **improvement report**). The report flagged things like a duplicate Dexie version block and the 600 KB curriculum data being bundled eagerly — commit `0a84fd8` says the C1/H1–H4/M4/L1 fixes were applied.
- Two files are untracked: that improvement report and the original `NUMBER ACADEMY.md` spec. `Chat.md` looks like saved research/conversation notes from early architecture decisions.
- The **README is slightly stale** relative to the code: it describes only Math + Career Tech curriculum (there are now 8 subjects), and its "no account creation required" positioning now coexists with the new Firebase sign-in for planner sync. Also, `.env` (with real keys) sits in the repo directory — it is gitignored per `.gitignore`, but worth double-checking nothing sensitive has been committed historically.

In short: a clean, well-organized React PWA with an offline-first local data layer, recently extended with cloud sync and auth, and a lightweight server-side AI proxy — moving from a student math-drill app toward a full teacher planning platform.


# TASK
1. Inspect the authentication feature. 
2. I want to extend the Student learning - course - feature. I will upload all the questions and notes (in .md files) - based on the exact nacca curriculum embedded in the app.
3. Suggest any other improvements in the AI chatbot - making it highly relevant to the user (teacher/student)

Look into the src/courses-data folder



I'll inspect the auth feature, the course data structures, the `src/courses-data` folder you mentioned, and the AI assistant internals.

No `src/courses-data` folder exists yet — I'll note that and look at the current course data model to see where uploads would fit. Now the course data and AI service:

One last check on how the sign-in button handles errors:

I've inspected all three areas. Here's what I found and what I recommend.

---

## 1. Authentication — works, but has real gaps

**How it works today:** Firebase Auth with Google Sign-In (popup), wrapped in `AuthProvider` in [main.jsx](src/main.jsx). The context ([AuthContext.jsx](src/context/AuthContext.jsx)) is clean and minimal — `user`, `loading`, `signInWithGoogle()`, `signOut()`. Its only purpose is planner sync: [usePlanner.js](src/hooks/usePlanner.js) routes reads/writes to Firestore when signed in and to Dexie (IndexedDB) when signed out. Firestore rules correctly isolate each user to `/users/{uid}/**` and deny everything else.

**Problems found, in priority order:**

1. **PlannerSubject is effectively broken for signed-in users.** `useSubject()` is an unfinished stub — for authenticated users it always returns `undefined` (the body at `src/hooks/usePlanner.js:157-188` is dead code ending in `setFsData(undefined)`). Likewise `useWeekPlans()` returns `undefined` when signed in (`src/hooks/usePlanner.js:207`). So a teacher who signs in loses the subject detail page — the feature they signed in *for*. The comment in the code admits the fix ("store cgId on the subject doc… store a flat shadow doc at `/users/{uid}/subjectMeta/{subjectId}`") but it was never wired.
2. **No local → cloud migration.** A teacher who built terms offline (Dexie), then signs in, sees an empty planner — their data didn't upload, and nothing merges back on sign-out. Data silently "disappears" depending on auth state. This will feel like data loss to users.
3. **Sign-in errors are unhandled.** `Planner.jsx:63` calls `signInWithGoogle` directly on click with no `catch`, and `AppShell`'s handler has `try/finally` but no `catch`. A common failure like `auth/unauthorized-domain` (domain not added in the Firebase console) becomes an unhandled promise rejection with zero user feedback. Popup-only sign-in also fails in some in-app browsers — a `signInWithRedirect` fallback is the standard fix for this audience (low-end Androids).
4. **Mobile users have almost no sign-in entry point.** The auth controls live in the desktop header, which is `hidden md:block`. On mobile, the only sign-in surface is the small nudge on the Planner page. The `Profile` page never mentions accounts at all — it still says "No email or password is required," which now coexists awkwardly with Google sign-in (this is the persona mismatch the improvement report flagged).

**Bottom line:** the auth foundation (context, rules, dual-path data layer) is solid, but the Firestore read path for the planner was left half-finished. I'd fix items 1–3 before adding any new auth-dependent features.

---

## 2. Extending the Course feature with your .md uploads

First, a correction: **`src/courses-data/` doesn't exist yet** — the course data currently lives in `src/data/` (`units.js`, `lessons.js`, `questions.js`, `quizzes.js`, `misconceptions.js`). That's good news: we can design the folder and its conventions from scratch, keyed to the curriculum.

**Current state of the course feature:** it's a single hardcoded course ("Number & Algebra") with 6 units, and only *one* section (`u1-s1`, "Error and Misconceptions") is `available: true` — everything else is locked/empty. Content is keyed by hand-invented ids (`u1-s1`), while the embedded curriculum tree (`curriculumData.js`, 10 subjects × B7–B9 → strand → sub-strand → content standard → **indicator**, with codes like `B7.1.1.1.1`) is a completely separate system. The two don't reference each other at all.

**My recommendation — make the NaCCA indicator code the single join key**, and propose this structure for your uploads:

```
src/courses-data/
  mathematics/
    B7/
      notes/
        B7.1.1.1.1.md      ← lesson notes, one file per indicator
        B7.1.1.1.2.md
      questions/
        B7.1.1.1.1.md      ← practice questions for that indicator
    B8/ ...
  science/
    B7/ ...
```

The filename **is** the indicator code — that guarantees alignment with the embedded curriculum and makes validation trivial. Inside each file, a fixed convention the parser can rely on:

```markdown
---
indicator: B7.1.1.1.1
title: Classify materials into solids, liquids and gases
---

## Objectives
- ...

## Explanation
Free markdown prose...

## Worked Example
...

## Practice
### Q1
type: mcq
question: ...
- [ ] option a
- [x] option b        ← correct answer marked
explanation: ...
difficulty: easy
```

Then a build script (`scripts/parse-courses.mjs`, mirroring the existing `parse-curriculum.mjs`) compiles the folder into generated data modules. This gives you:

- **A curriculum-driven Course UI** — instead of hardcoded `units.js` with manual `available` flags, the units/sections list is derived from the curriculum tree, and a section lights up automatically when its `notes`/`questions` files exist. Uploading content *is* the act of publishing it.
- **Parser validation** — every file must match a real indicator in `curriculumData.js`; orphans and malformed questions are reported at build time, not discovered by students.
- **Per-subject/per-class code splitting** — generate one chunk per subject-class so we don't repeat the 600 KB single-bundle mistake the improvement report flagged with `curriculumData.js`.

One decision for you before you start uploading: the existing lesson format is richer than plain markdown (it has "think back", "observe", interactive classify activities). We can either (a) map your md headings onto those block types, or (b) start with plain notes + questions and add interactivity later. I'd start with (b) — get all content in and usable, then enrich.

When you upload the files, just drop them in and I'll write the parser and rewire the Course/Practice/Quiz pages to the new data source.

---

## 3. AI chatbot — making it genuinely relevant to the person asking

Right now `curriculumChat()` ([services/ai.js](src/services/ai.js)) sends the same generic teacher-system-prompt and raw history for everyone. The app *already holds* everything needed to personalize — it just never sends it. Ranked by impact:

1. **Ground answers in the embedded curriculum (biggest win).** The full NaCCA tree is already in the app, but the model never sees it — it answers from memory and can hallucinate indicator text. When a message contains a curriculum code (regex on `B7-9.\d+\.…`) or matches an indicator/sub-strand description, look it up in `curriculumData.js` and inject the real text into the prompt ("Here is the exact curriculum entry: …answer based on this"). This is cheap RAG with zero infrastructure, and it makes every answer verifiably aligned.
2. **Two personas: Teacher mode and Student mode.** A visible toggle (or inferred from where chat was opened). Student mode: simpler language, step-by-step scaffolding, Ghanaian-context examples, "quiz me" behavior — and crucially it knows *who* the student is: inject their class level from `StudentContext` and their mastery/misconception state from Dexie, so it can say "you've struggled with place value — let's start there." Teacher mode: today's behavior, plus awareness of their planner (current term/subjects/week) when relevant.
3. **Contextual entry points.** Add "Ask AI about this" buttons on the Curriculum browser rows, planner topics, and lesson pages that deep-link into the chat with the indicator pre-loaded. Relevance is much easier when the user arrives with context instead of typing from scratch.
4. **After your content upload lands: retrieve from your own notes.** With question 2 done, the bot can ground answers in the exact lesson notes and questions in the app ("according to the notes in this course…") — the teacher's own materials become the source of truth, and the bot can even be asked to generate *more questions in the same style*.
5. **Structured output for generated assessments.** Ask for JSON (OpenRouter supports `response_format`) and validate client-side, so an AI-generated quiz can be imported straight into the Practice/Quiz flow with one tap instead of copy-pasting markdown.
6. **Streaming + real markdown.** Lesson-plan answers are long; stream them (OpenRouter `stream: true`, pass through in `server.js`). And replace the regex `AiText` renderer with `react-markdown` + `remark-gfm` — plus KaTeX, which matters a lot for a math app (currently `x²` and fractions render as plain text).
7. **Smaller polish:** persist conversations to Dexie (currently lost on navigation), truncate old history to control token cost, allow a stronger model for lesson-plan generation while keeping `gpt-4o-mini` for chat, and in student mode add a Socratic option that guides rather than dumps answers.

---

**Suggested order of work:** fix the three auth bugs first (small, protects existing users), then set up the `src/courses-data/` convention + parser so your uploads have a landing zone, then the chatbot grounding/persona work (items 1–2 give most of the value). Want me to start with the auth fixes, or draft the parser and folder conventions first so you can begin uploading?



OK. Start with the auth bugs.


I'll fix the three auth bugs. Let me set up a task list and read the remaining planner files to understand all the seams before editing.

Now the planner pages and DB schema:

This is a bigger seam than the stub alone — `PlannerSubject` reads/writes Dexie directly, ignoring auth entirely. Let me read the remaining planner pages and settings helpers.

I now have the full picture — the seam is bigger than the two stubs: **PlannerTerm, PlannerSubject and PlannerLesson all bypass the auth-aware hooks and talk to Dexie directly**, so signed-in users read stale local data and write to the wrong place. Let me verify the two remaining pieces (Planner.jsx wiring, AddTopicModal purity), then start implementing.

All seams confirmed. Now implementing — starting with the data layer (Dexie helper, Firestore layer, migration module), then the hooks, pages, and auth context.

`serverTimestamp` is still used by `upsertWeekPlan`/`upsertLessonNote`, so that import stays. Now the migration module:

I used `doc()` without importing it — fixing:

Data layer done. Now the full `usePlanner.js` rewrite — replacing the two broken stubs and adding the topic/note hooks the pages need:

Now rewiring the pages. **PlannerTerm.jsx** first:

Now **PlannerSubject.jsx** — the biggest rewiring:

Continuing the PlannerSubject data-loading block:

Now the handlers:

Now **PlannerLesson.jsx** — replacing the five-step Dexie lookup chain with the auth-aware hooks: