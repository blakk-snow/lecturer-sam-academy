# Lecturer Sam Academy — Improvement Report

**Date:** Investigation of current codebase  
**Scope:** Code quality, performance, security, UX/accessibility, data layer, PWA, error handling, missing features

---

## Summary

The app is well-architected and largely clean. The primary concerns are:
1. A **critical duplicate Dexie version block** that will corrupt production databases for some users.
2. A **600 KB+ curriculumData.js** bundled synchronously — the single biggest performance risk.
3. **No request-body size limit** on the AI proxy (`server.js`), making it trivially abusable.
4. A **persona mismatch** (`StudentContext`, "Student profile" heading) that contradicts the teacher-focused product.
5. An **unused `@openrouter/sdk` dependency** adding dead weight.
6. No **code-splitting / lazy loading** — all 16 route-level pages load in one chunk.

---

## Critical

### C1 — Duplicate `db.version(3)` in `src/db/database.js`

**File:** `src/db/database.js` (lines 26–32)

Two consecutive `db.version(3).stores({...})` calls define the same version with identical schemas. Dexie processes version upgrades sequentially; the second definition silently overwrites the first but, more dangerously, in some versions of Dexie 4 this raises a runtime error or triggers an unhandled promise rejection that leaves the database in an unupgraded state. Any user who already has version 2 data and hits the race will end up with no `lessonNotes` table.

**Fix:** Remove the second block entirely — lines 30–33:
```js
// DELETE this duplicate block:
db.version(3).stores({
  lessonNotes: '++id, topicId, ...',
});
```
Only one `db.version(3)` definition should exist.

---

## High

### H1 — `curriculumData.js` (~600 KB) is synchronously imported into two routes

**Files:** `src/pages/Curriculum.jsx` (line 6), `src/pages/PlannerLesson.jsx` (line 8)

`curriculumData.js` is 613 KB on disk (unminified JS). It is statically imported at the top of both page modules, so the parser evaluates it as part of the initial JavaScript parse. On a low-end Android device with a slow CPU this adds noticeable startup jank even though the user may never visit the Curriculum page.

**Fix (two options, pick one):**
- **Option A — Vite dynamic import:** Change the import to `const { curriculumMap, subjects, classes } = await import('../data/curriculumData.js')` inside a `useEffect` or with `React.lazy` + a data-loading wrapper. This code-splits the file into its own chunk so it only loads when the Curriculum or PlannerLesson page is visited.
- **Option B — JSON + fetch:** Convert `curriculumData.js` to `curriculumData.json`, place it in `/public`, and `fetch('/curriculumData.json')` on first use. The browser can cache the file separately from the JS bundle.

Either approach also benefits from pairing `React.lazy` with `<Suspense>` for the Curriculum and PlannerLesson routes in `App.jsx`.

### H2 — No request-body size cap on the AI proxy (`server.js`)

**File:** `server.js`, `readBody` function (lines 55–61)

`readBody` concatenates all incoming chunks without any size limit. A single malicious or accidental large POST would hold the server's memory until the connection closes (or Node OOMs). There is also no maximum message count or per-message length validation on the forwarded `messages` array.

**Fix:**
```js
function readBody(req, maxBytes = 64 * 1024) { // 64 KB cap
  return new Promise((resolve, reject) => {
    let data = '';
    let size = 0;
    req.on('data', chunk => {
      size += chunk.length;
      if (size > maxBytes) {
        req.destroy();
        return reject(new Error('Request body too large'));
      }
      data += chunk;
    });
    req.on('end', () => resolve(data));
    req.on('error', reject);
  });
}
```
Add a corresponding `413` response in the `catch` block. Also add a `messages.length <= 50` guard after the array check.

### H3 — `api/generate.js` uses a wildcard CORS origin (`*`)

**File:** `api/generate.js` (lines 8–10)

`Access-Control-Allow-Origin: *` means any web origin can POST to the serverless function (cross-site). Because the function reads the API key from the environment, not from the caller, this is safe against key leakage — but it allows any site to make AI calls billed to your OpenRouter account.

**Fix:** Restrict the header to your production domain:
```js
const allowed = process.env.ALLOWED_ORIGIN || 'https://lecturer-sam-academy.vercel.app';
res.setHeader('Access-Control-Allow-Origin', allowed);
```
`server.js` has the same wildcard on line 53 — apply the same fix there.

### H4 — No code-splitting: all 16 pages load synchronously

**File:** `src/App.jsx`

There is no `React.lazy()` or `import()` anywhere in the codebase. Vite will produce a single JS chunk containing all pages (Course, Unit, Lesson, Practice, Quiz, Results, Dashboard, Profile, Planner, PlannerTerm, PlannerSubject, PlannerLesson, Curriculum, AIAssistant…). Most teachers will only use Planner + Curriculum, yet they download the full bundle including the student lesson/quiz engine.

**Fix:** Wrap each `import` in `App.jsx` with `React.lazy`:
```js
import { Suspense, lazy } from 'react';
const Curriculum  = lazy(() => import('./pages/Curriculum'));
const PlannerLesson = lazy(() => import('./pages/PlannerLesson'));
// …etc for all pages
```
Wrap the `<Routes>` tree in `<Suspense fallback={<div>Loading…</div>}>`. Vite automatically creates per-page chunks.

### H5 — Unused dependency: `@openrouter/sdk`

**File:** `package.json` (dependencies)

`@openrouter/sdk` is listed as a production dependency but is never imported anywhere in the source tree. The app talks to OpenRouter via raw `fetch` in `server.js` and `api/generate.js`. The SDK adds unnecessary install weight and is a supply-chain risk.

**Fix:**
```bash
npm uninstall @openrouter/sdk
```

---

## Medium

### M1 — Persona mismatch: "Student profile" copy in a teacher-focused product

**Files:** `src/pages/Profile.jsx` (heading line 31, button text line 73), `src/context/StudentContext.jsx` (all exports), `src/pages/Dashboard.jsx` (welcome text)

The app's homepage, README, and system prompts consistently address *teachers*. But `Profile.jsx` renders `<h1>Student profile</h1>`, the button says "Enter the course", and `StudentContext` / `useStudent` / `LOCAL_STUDENT_ID` / `db.students` all use student terminology. The Dashboard says "Your progress" with "Continue learning" — both student-facing frames.

This is a leftover from the original "Number Cademy" student-learning app that was renamed. The teacher/student dual audience should be resolved:
- If the app is teacher-only, rename `StudentContext` → `ProfileContext`, update `"Student profile"` → `"My Profile"`, and drop the `db.students` / `db.progress` / `db.attempts` tables that serve no teacher workflow.
- If the app genuinely serves both audiences, the Profile page needs to surface role selection.

### M2 — `curriculumData.js` README states only "Mathematics and Career Technology"

**File:** `README.md` (Curriculum browser bullet)

The data file (`curriculumData.js`) is auto-generated from curriculum markdown and appears to include Mathematics, Science, English, Social Studies, Computing, RME, Career Tech, and French — confirmed by the subjects array at the top of the file. The README claim "Mathematics and Career Technology (B7–B9)" is out of date. This misleads contributors and teachers evaluating the platform.

**Fix:** Update the README to list all available subjects, or add a note like "currently includes [N] subjects — see `src/data/curriculumData.js`."

### M3 — `AIDrawer` in `Curriculum.jsx` has no `aria-live` region for loading/error states

**File:** `src/pages/Curriculum.jsx`, `AIDrawer` component

The drawer has `role="dialog"` and `aria-modal="true"`, which is correct. But the loading spinner and error state inside it are rendered without an `aria-live` region, so screen-reader users won't hear "Generating…" or error text announced when it appears.

**Fix:**
```jsx
<div aria-live="polite" aria-atomic="true">
  {loading && <span className="sr-only">Generating AI content, please wait.</span>}
  {error && <span className="sr-only">Error: {error}</span>}
</div>
```
The same applies to the `ThinkingBubble` in `AIAssistant.jsx`.

### M4 — AI error message in `Curriculum.jsx` instructs users to run `node server.js` — wrong for production

**File:** `src/pages/Curriculum.jsx` (line ~190), `src/pages/AIAssistant.jsx` (line ~254), `src/pages/PlannerLesson.jsx` (AIError component)

Error messages say: *"Make sure the AI server is running: `node server.js`"*. In production (Vercel), there is no `server.js` — the serverless function handles requests. This message will confuse teachers who didn't set up a dev environment.

**Fix:** Detect the environment:
```js
const devHint = import.meta.env.DEV
  ? 'Make sure the AI proxy is running: node server.js'
  : 'The AI service is temporarily unavailable. Please try again.';
```
Inject `devHint` into error UI, or simply remove the `node server.js` instruction from production error copy.

### M5 — `PlannerLesson.jsx` uses `// eslint-disable-next-line react-hooks/exhaustive-deps` to suppress stale-closure warnings

**File:** `src/pages/PlannerLesson.jsx` (lines near `buildAiParams`, `handleAIGenerate`)

Two `useCallback` hooks suppress the exhaustive-deps lint rule. `buildAiParams` references `currDetails` which is computed inline (not memoised) — the suppressed warning is legitimate because the dep would change every render. The fix is to either `useMemo` the `currDetails` calculation, or accept the `useCallback` without memoisation (remove `useCallback` since it provides no benefit if `currDetails` is unstable).

**Fix:**
```js
// Replace inline IIFE with useMemo:
const currDetails = useMemo(() => {
  if (!topic?.contentStandardId || !subject) return null;
  // …existing logic…
}, [topic, subject]);
```
Then remove the eslint-disable comments; the hooks will have stable deps.

### M6 — `BottomNav` and `AppShell` both use `aria-label="Primary"` on separate `<nav>` elements

**File:** `src/components/layout/AppShell.jsx` (line 21), `src/components/layout/BottomNav.jsx` (line 16)

Two landmark `<nav>` elements share the same accessible name "Primary". Screen readers will announce two identical "Primary navigation" landmarks, which is confusing. One should be distinguished.

**Fix:**
- `AppShell.jsx`: `aria-label="Desktop navigation"` (only visible on md+)
- `BottomNav.jsx`: `aria-label="Mobile navigation"` (only visible below md)

### M7 — No `<title>` or `<meta name="description">` updates on route changes

**File:** `src/App.jsx`, `index.html`

The page title is "Lecturer Sam Academy" for all routes. Screen reader users and multi-tab power-users (teachers) rely on the title to identify the current page. This is also a minor SEO factor for the Vercel deployment.

**Fix:** Use a tiny helper or `react-helmet-async` to update `document.title` on each route. Example pattern used in the pages:
```js
// In Curriculum.jsx
useEffect(() => { document.title = 'Curriculum — Lecturer Sam Academy'; }, []);
```

---

## Low

### L1 — `src/data/course.js` still uses the old branding internally

**File:** `src/data/course.js`

```js
id: "number-algebra",
title: "Number & Algebra Academy",
tagline: "Learn. Practise. Apply. Master.",
headline: "Master Number and Algebra one concept at a time.",
```

The `id`, `title`, `headline` all reference the old "Number Cademy" product. If the Course/Lesson pages are still active (they are routed in `App.jsx`), users hitting `/course` will see "Number & Algebra Academy", not "Lecturer Sam Academy". Either update the copy or deprecate those routes.

### L2 — Old "Number Academy" branding remains in `.agents/` task files

**Files:** `.agents/tasks/project-analysis.md` (heading), `.agents/tasks/planner/task.json` (description), `.agents/tasks/curriculum-platform/` (task and feature files)

These are agent workflow artifacts, not user-facing, but they refer to "Number Academy" throughout. Not a runtime issue, but worth noting for team clarity.

### L3 — Service worker `maximumFileSizeToCacheInBytes` is set to 4 MB

**File:** `vite.config.js` (line 57)

The default Workbox limit is 2 MB. This was raised to 4 MB, presumably to accommodate `curriculumData.js`. If H1 is fixed (lazy/dynamic import), the 4 MB limit can revert to 2 MB and the curriculum data can be excluded from the service worker's pre-cache entirely (fetched and cached at runtime on first Curriculum visit).

### L4 — PWA manifest uses the same icon file for both `"any"` and `"maskable"` purposes

**File:** `vite.config.js` (lines 47–56)

The `icon-512.png` asset is declared twice — once with `purpose: "any"` and once with `purpose: "maskable"`. A maskable icon requires a safe zone (padding) around the content so OS-level circle/squircle crops don't clip the logo. Using the same file for both purposes means the maskable version will likely be cropped badly on Android. Create a separate `icon-512-maskable.png` with appropriate padding, or use the Maskable.app tool to generate it.

### L5 — `Profile.jsx` input field is missing a `type="text"` attribute

**File:** `src/pages/Profile.jsx` (the name input, line ~37)

The `<input>` for name/nickname has no explicit `type`, which defaults to `type="text"` — harmless, but explicit `type="text"` is clearer for future maintainers and some accessibility linting tools flag the omission.

### L6 — `Dashboard.jsx` hardcodes a lesson fallback that will never exist for teachers

**File:** `src/pages/Dashboard.jsx` (lines 35, 37)

```jsx
<h2>…{continueLesson?.title ?? "Error versus misconception"}</h2>
…to={`/lesson/${continueLesson?.id ?? "u1-s1-l1"}`}
```

When no lesson progress exists, it links to `"Error versus misconception"` / `/lesson/u1-s1-l1` — a specific lesson from the old Number Cademy content that may not exist in all environments. Teachers who haven't interacted with the learning module will see a broken link.

**Fix:** If no `continueLesson`, show a prompt to use the Planner instead of falling back to a hardcoded lesson.

### L7 — `PlannerLesson` bottom nav sits above the device's bottom-safe area only on iOS

**File:** `src/pages/PlannerLesson.jsx` (line ~615)

The sticky bottom nav bar uses `bottom-16 md:bottom-0` to clear the BottomNav. This is the right idea, but the BottomNav itself uses `pb-[calc(0.75rem+env(safe-area-inset-bottom,0px))]` (on the input bar in AIAssistant) only inconsistently. On iOS PWA mode the navigation bar clips content if the page doesn't account for the safe area inset.

**Fix:** Add `pb-[env(safe-area-inset-bottom,0px)]` to the PlannerLesson sticky nav bar as well.

### L8 — No `<meta name="apple-mobile-web-app-title">` or splash screen

**File:** `index.html`

The app is a PWA targeting Ghanaian teachers who are likely to "Add to Home Screen" on iOS Safari. Without `apple-mobile-web-app-title`, iOS uses the full `<title>` value, which may be truncated. No splash screen meta tags are set, so the app will show a blank white screen on iOS launch.

**Fix:**
```html
<meta name="apple-mobile-web-app-capable" content="yes" />
<meta name="apple-mobile-web-app-status-bar-style" content="default" />
<meta name="apple-mobile-web-app-title" content="Lecturer Sam" />
```

---

## Missing Features (given the app's purpose)

### F1 — No export / print of lesson plans

Teachers need to share lesson plans with department heads or print them for lesson observation. There is no export functionality anywhere in PlannerLesson. A `window.print()` call with a print-specific CSS class on the lesson note content would meet 80% of the need.

### F2 — No data export / backup

All data is in IndexedDB. A teacher who changes device or reinstalls the browser loses all their term plans and lesson notes. A simple "Export all data as JSON" and "Import from JSON" feature in the Profile page would address this.

### F3 — No offline-capable AI fallback

When offline, the AI features silently fail with a fetch error. For a tool aimed at Ghanaian classrooms (variable connectivity), the app should detect `navigator.onLine === false` before calling the AI service and show a clear "You are offline — AI features require internet" message rather than a generic server error. Pre-fetched/cached AI responses for the most common indicators would be a further enhancement.

### F4 — No indication of AI response source / model

The teacher has no way to know which model generated a lesson plan, or when it was generated. A small metadata chip on AI-generated content ("Generated by gpt-4o-mini") would help teachers calibrate trust in the output.

### F5 — Curriculum browser covers all subjects but the Planner only links by `curriculumSubjectId` + `curriculumClassId`

The Planner assumes a 1:1 mapping from the teacher's subject name to a curriculum subject ID. If a teacher names their subject "Maths" instead of "Mathematics", the curriculum lookup in `PlannerLesson` returns `null` for `currDetails`, disabling all AI generation. There is no UI in PlannerTerm/PlannerSubject to re-link a subject after creation.

**Fix:** Surface an "Edit curriculum link" button on the subject row in PlannerTerm that re-opens the curriculum subject/class pickers.

---

## Verification Notes

- **C1** can be verified by clearing IndexedDB in DevTools, refreshing the app, and confirming `lessonNotes` appears in the Dexie database inspector with no console errors.
- **H1** (bundle size) can measured with `npm run build` and inspecting the Vite output — `curriculumData.js` should appear as a separate, lazily-loaded chunk rather than inline in the main bundle.
- **H2** (body limit) can be tested by POSTing a 100 KB payload to `POST /api/generate` and confirming a `413` response.
- **H5** (unused dep) can be confirmed by `npm ls @openrouter/sdk` returning nothing after removal.
