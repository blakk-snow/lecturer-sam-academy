# Implementation Plan — Lesson Planner CRUD

## Context

- **Stack:** React 19 + Vite + Tailwind v4 + Dexie 4 (IndexedDB) + React Router v7 + dexie-react-hooks
- **Build:** `npm run build` — `vite build`
- **Dev server:** `npm run dev`
- **No test runner** — verification is via `npm run build` (zero TypeScript/lint errors from Vite) plus manual smoke-test in browser
- **Design tokens:** `bg-card`, `border-line`, `text-ink`, `text-ink-soft`, `text-accent`, `bg-paper`, `rounded-xl`, `rounded-2xl`
- **Existing UI primitives:** `Button` (variant: primary/secondary/ghost), `Card`
- **Routing:** React Router v7 `<Routes>` in `src/App.jsx`, nested under `<AppShell>`
- **Nav:** `AppShell.jsx` (desktop top nav) + `BottomNav.jsx` (mobile, 5-col grid)
- **Curriculum data shape:** `curriculumMap[subjectId][classId]` → array of strands → subStrands → contentStandards → indicators

---

## Steps

- [ ] 1. **Extend the Dexie schema to version 2** — add planner tables while keeping v1 intact.
      File: `src/db/database.js`
      Add `db.version(2).stores({...})` with tables: `terms`, `classGroups`, `subjects`, `weekPlans`, `weekTopics`.
      Verify: `npm run build` — zero errors.

- [ ] 2. **Create `src/db/planner.js`** — all CRUD helper functions for the planner feature.
      Export: `createTerm`, `updateTerm`, `deleteTerm`, `getTerms`,
              `addClassGroup`, `removeClassGroup`, `getClassGroups`,
              `addSubject`, `updateSubject`, `removeSubject`, `getSubjects`,
              `upsertWeekPlan`, `getWeekPlans`,
              `addWeekTopic`, `updateWeekTopic`, `removeWeekTopic`, `getWeekTopics`.
      All functions use `db` from `./database.js`.
      Verify: `npm run build` — zero errors.

- [ ] 3. **Create `src/components/planner/TermForm.jsx`** — reusable form for creating/editing a term.
      Named export `TermForm`. Props: `{ initialValues, onSubmit, onCancel }`.
      Fields: name (text), year (text, e.g. "2026/2027"), termNumber (select 1–3), startDate (date), endDate (date).
      Uses `Button` from `../../components/ui/Button`.
      Verify: `npm run build` — zero errors.

- [ ] 4. **Create `src/components/planner/AddTopicModal.jsx`** — curriculum picker modal.
      Named export `AddTopicModal`. Props: `{ subjectName, curriculumSubjectId, curriculumClassId, onAdd, onClose }`.
      When `curriculumSubjectId` and `curriculumClassId` are set and data exists in `curriculumMap`:
        - Shows strand → sub-strand → content standard hierarchy (accordion style, matching Curriculum.jsx pattern)
        - Teacher selects one contentStandard + one or more indicators + optional free-text notes field
        - "Add Topic" button calls `onAdd({ strandId, subStrandId, contentStandardId, indicatorIds, notes })`
      When no curriculum data (free-text subject): shows only a notes textarea + "Add" button.
      Modal overlay: `fixed inset-0 z-50 bg-black/50 flex items-center justify-center`.
      Panel: `bg-card rounded-xl p-5 max-w-sm w-full mx-4 max-h-[80vh] overflow-y-auto`.
      Verify: `npm run build` — zero errors.

- [ ] 5. **Create `src/pages/Planner.jsx`** — terms list at `/planner`.
      Default export `Planner`.
      Uses `useLiveQuery` from `dexie-react-hooks` to list all terms sorted by `createdAt desc`.
      Shows empty state ("No terms yet. Create your first term to get started.") when no terms.
      Each term card: name, year, term number badge, date range, chevron-right link to `/planner/:termId`.
      Floating "+ New Term" button (or inline when empty) opens an inline modal with `TermForm`.
      On submit: calls `createTerm` then closes modal.
      Term card has edit (pencil) and delete (trash) icon buttons; delete shows confirm dialog via `window.confirm`.
      Verify: `npm run build` — zero errors.

- [ ] 6. **Create `src/pages/PlannerTerm.jsx`** — term detail at `/planner/:termId`.
      Default export `PlannerTerm`.
      Uses `useParams` to get `termId`.
      Uses `useLiveQuery` to load the term, its classGroups, and subjects per classGroup.
      Layout: term name + dates as header; then one section per classGroup showing its subjects as cards.
      "+ Add Class" button: inline modal with a select (Basic 1–9) + submit.
      On each classGroup row: a delete (trash) icon.
      Each subject card: subject name, class level badge, link/button to `/planner/:termId/:subjectId`.
      "+ Add Subject" button per classGroup: inline modal with subject name input (free text) + optional dropdowns to link to `curriculumSubjectId` and `curriculumClassId` from `curriculumMap` (shows "Link to curriculum (optional)").
      Subject card has delete icon.
      Verify: `npm run build` — zero errors.

- [ ] 7. **Create `src/pages/PlannerSubject.jsx`** — 16-week plan at `/planner/:termId/:subjectId`.
      Default export `PlannerSubject`.
      Uses `useParams` for `termId` + `subjectId`.
      Uses `useLiveQuery` to load subject, its weekPlans (keyed by weekNumber), and weekTopics per weekPlan.
      Shows a list of 16 week rows (Week 1 … Week 16).
      Each row shows:
        - Week number + type badge (teaching/revision/exam/vacation) — type is editable via an inline select
        - Status badge for teaching weeks (planned/taught/skipped)
        - Topics listed beneath: each topic shows contentStandard code + short description (or free-text note)
        - "+ Add Topic" button: opens `AddTopicModal`
        - Topic rows have a remove (×) button
      Saving week type/status calls `upsertWeekPlan`.
      Adding a topic calls `addWeekTopic` (creates weekPlan if needed first via `upsertWeekPlan`).
      Removing a topic calls `removeWeekTopic`.
      List view (not grid): each week is a `<section>` card with `border border-line rounded-xl bg-card`.
      Verify: `npm run build` — zero errors.

- [ ] 8. **Update `src/App.jsx`** — add three planner routes.
      Import `Planner`, `PlannerTerm`, `PlannerSubject` (lazy or direct).
      Add inside the `<AppShell>` route:
        ```
        <Route path="/planner" element={<Planner />} />
        <Route path="/planner/:termId" element={<PlannerTerm />} />
        <Route path="/planner/:termId/:subjectId" element={<PlannerSubject />} />
        ```
      Verify: `npm run build` — zero errors.

- [ ] 9. **Update `src/components/layout/BottomNav.jsx`** — replace "Course" with "Planner".
      Change the `{ to: "/course", label: "Course", icon: BookOpen }` item to
      `{ to: "/planner", label: "Planner", icon: CalendarDays }`.
      Import `CalendarDays` from `lucide-react` (remove `BookOpen` import if unused).
      Verify: `npm run build` — zero errors.

- [ ] 10. **Update `src/components/layout/AppShell.jsx`** — add "Planner" to desktop nav.
       Replace `{ to: "/course", label: "Course" }` entry in the `links` array with
       `{ to: "/planner", label: "Planner" }`.
       (The Course route still exists in App.jsx; this just swaps the prominent nav link.)
       Verify: `npm run build` — zero errors.

- [ ] 11. **Final build check** — run full production build and confirm zero errors.
       Command: `npm run build`
       Expected: "built in Xms" with no errors in output.
