# Implementation Plan — Curriculum Data Expansion & Dashboard Rewrite

## Confirmed: No changes needed to AppShell.jsx

`src/components/layout/AppShell.jsx` already includes `{ to: '/curriculum', label: 'Curriculum' }` in
the desktop `links` array and renders it through `links.map(...)` exactly like every other nav item.
The desktop nav renders via `className="flex gap-5 text-sm font-medium"` on the `<nav>` element —
the link is visibly present on desktop. No edits required.

---

## File inventory — what is real vs. stub

Before parsing, note that **three subjects have empty stub markdown files** (0 strands in the header
table). The coder must NOT emit empty objects for them; use `{}` as the class value so that
`Curriculum.jsx`'s `Boolean(subjectData[cls.id])` returns `false` and the class pill shows as
disabled. The stubs are:

| Subject | Files that are stubs (0 strands, empty CONTENTS table) |
|---|---|
| mathematics | CCP_MATHEMATICS_JHS_2023_Basic7/8/9_Full.md — ALL THREE are stubs |
| creative_arts | CREATIVE_ARTS_AND_DESIGN_Basic7/8/9_Full.md — ALL THREE are stubs |

**For mathematics**, the existing `curriculumData.js` already contains a full, hand-authored B7 data
set that must be preserved. B8 and B9 have no markdown content. Emit the existing B7 data verbatim,
and emit B8/B9 as `{}`.

**For science**, use the `CCP_SCIENCE_JHS_2023_Basic*_Full.md` files — they are fully populated
(5 strands, 20+ sub-strands each). Do NOT use `NaCCA_Science_Curriculum_Basic*_Full.md` (these are
an older version and would create duplicate data).

---

## Task A — Rewrite `src/data/curriculumData.js`

### Step A-1 — Write a Node.js parser script (temporary, not committed)

**What:** Create a one-shot Node.js script at `scripts/parseCurriculum.mjs` that reads all 30 markdown
files and writes the new `curriculumData.js`. Running the script is the implementation mechanism; the
coder edits the output by hand only to fix edge cases the script cannot handle.

**Why a script:** The 30 files total ~1 MB of markdown. Writing them by hand would be error-prone.
A script is deterministic and auditable. The script is temporary scaffolding; it is not shipped.

**Files to create:** `scripts/parseCurriculum.mjs`

**Parser logic — exact rules the script must implement:**

1. **File mapping** — the script maps subject id → `[B7file, B8file, B9file]`:
   ```
   mathematics   → CCP_MATHEMATICS_JHS_2023_Basic{7,8,9}_Full.md   (all stubs → emit preserved B7, {} for B8/B9)
   science       → CCP_SCIENCE_JHS_2023_Basic{7,8,9}_Full.md
   english       → ENGLISH_LANGUAGE_Basic{7,8,9}_Full.md
   computing     → COMPUTING_Basic{7,8,9}_Full.md
   creative_arts → CREATIVE_ARTS_AND_DESIGN_Basic{7,8,9}_Full.md   (all stubs → emit {} for all three)
   social_studies→ Social_Studies_Basic{7,8,9}_Full.md
   rme           → Religious_and_Moral_Education_Basic{7,8,9}_Full.md
   career_tech   → Career_Technology_k_9_3rd_Aug_08_2021_Basic{7,8,9}_Full.md
   french        → FRENCH_LANGUAGE_Basic{7,8,9}_Full.md
   ghanaian_language → GHANAIAN_LANGUAGE_Basic{7,8,9}_Full.md
   ```

2. **Strand detection** — a line matching `/^# STRAND \d+:/i` starts a new strand. Strip the `STRAND N:` prefix; keep only the title text. Assign `id: 'strand-N'`, `code: 'N'`.

3. **Sub-strand detection** — a line matching `/^## SUB-STRAND \d+:/i` starts a new sub-strand. Strip the `SUB-STRAND N:` prefix; keep only the title text. Assign `id: 'ss-{strandCode}-{ssCode}'`, `code: '{strandCode}.{ssCode}'`.

4. **Content Standard detection** — a line matching `/^### Content Standard ([B7B8B9\/JHS\d.]+)/i`. The code is the capture group. The description is the text of the immediately following `**...**` bold line (strip `**` wrappers). Normalise the code (see rule 7). Assign `id` equal to the normalised code.

5. **Indicator detection** — a line matching `/^#### Indicator ([B7B8B9\/JHS\d.]+)/i`. The code is the capture group. The description is the remainder of that same line after the code (strip the italicised print-variant note if present), or the text on the very next non-blank, non-bold line. Normalise the code (see rule 7). Assign `id` equal to the normalised code.

6. **Competency tag stripping** — remove trailing `(CC)`, `(CP)`, `(CI)`, `(CL)`, `(PL)`, `(PSED)`, `(CG)`, `(GSTE)` tags and any leading `**Core competencies:**` line from descriptions.

7. **Code normalisation** — apply these substitutions in order:
   - `B7/JHS1.` → `B7.`
   - `B8/JHS2.` → `B8.`
   - `B9/JHS3.` → `B9.`
   - `JHS1.` → `B7.`
   - `JHS2.` → `B8.`
   - `JHS3.` → `B9.`
   - Collapse any internal whitespace in the code (some codes have a stray space, e.g. `B7.4.2. 2.1`).

8. **Stub detection** — if the file's CONTENTS table shows `0` for Strands (line `| **Strands** | 0 |`), skip the file and emit `{}` for that class.

9. **ID uniqueness** — if the same code appears twice in one file (documented in the NOTES section for Computing B7, Ghanaian Language B7), append `_b` to the second occurrence's id to prevent React key conflicts.

10. **Output shape** — emit a `.js` ESM file with `export const subjects`, `export const classes`, `export const curriculumMap`. The mathematics key must use the preserved B7 data (copied verbatim from the current `curriculumData.js`) and `{}` for B8/B9.

**Verify script builds correctly:**
```
node scripts/parseCurriculum.mjs
```
Expected: script exits 0, prints a summary line per subject like
`mathematics  B7: 4 strands (PRESERVED)  B8: stub  B9: stub`
`science      B7: 5 strands  B8: 5 strands  B9: 5 strands`
etc.
The output file `src/data/curriculumData.js` is written.

---

### Step A-2 — Review and patch the generated `curriculumData.js`

**What:** After running the script, manually inspect the output for the following known edge cases and
fix them if the script missed them. All fixes are direct edits to `src/data/curriculumData.js`.

**Edge cases to check:**

1. **English Language B7** — The CONTENTS table lists `SUB-STRAND 1: PRODUCTION AND` (title truncated
   in the table). The actual heading in the file body is the full title. Confirm the sub-strand title
   is taken from the body `## SUB-STRAND` heading, not the CONTENTS table.

2. **French Language** — Strand 3 heading is printed inconsistently between the NOTES and the body
   (`L'HYGIÈNE ET L'ALIMENTATION` vs `L'ALIMENTATION LA SANTE`). Use whichever heading the body `# STRAND` line contains.

3. **Ghanaian Language B7** — The code `B7/JHS1.5.1.1` appears twice for two different content
   standards. Confirm the second one gets id `B7.5.1.1_b`.

4. **Computing B7** — Indicator codes `B7/JHS1.2.1.1.3`, `B7/JHS1.2.1.1.4`, `B7/JHS1.2.2.1.2`,
   `B7/JHS1.2.2.1.3` each appear twice. Confirm the second occurrences get `_b` suffixes.

5. **Social Studies B7** — Indicator `B7/JHS1.1.1.2.1` has a stray space printed as `B7/JHS1 1.1.2.1`.
   Confirm after normalisation it becomes `B7.1.1.2.1`.

6. **Science B7** — Indicator `B7/JHS1.5.3.1.1` is printed as `B.7. 5.3.1.1` (extra spaces and dot).
   Confirm it normalises to `B7.5.3.1.1`.

7. **All files** — Spot-check that no description contains leading/trailing `**`, `####`, or `#####`
   markdown syntax.

**Files to modify:** `src/data/curriculumData.js` (patch only failing cases)

**Verify:**
```
npm run build
```
Expected: Vite build exits 0 with no errors. The file is valid JS that Vite can tree-shake.

---

### Step A-3 — Smoke-test the Curriculum page

**What:** Start the dev server and manually verify the Curriculum browser works end-to-end with the
new data.

**Checklist:**
- All 10 subject pills visible and clickable.
- Switching to Science → B7 shows 5 strand tabs (DIVERSITY OF MATTER, CYCLES, SYSTEMS, FORCES AND
  ENERGY, HUMANS AND THE ENVIRONMENT).
- Switching to Mathematics → B7 shows 4 strand tabs (NUMBER, ALGEBRA, GEOMETRY AND MEASUREMENT,
  HANDLING DATA) — this confirms the preserved data is intact.
- Switching to Mathematics → B8 shows the B8 class pill as **disabled** (no data). Same for B9.
- Switching to Creative Arts → any class shows all class pills as disabled.
- Switching to English Language → B7 shows 5 strand tabs.
- Subject/class combinations with data show `StandardCard` expandable rows.
- Desktop nav: the Curriculum link is visible at ≥768px viewport and navigates correctly.

**Verify:**
```
npm run dev
```
Then open http://localhost:5173/curriculum in a browser. No console errors. All checklist items pass.

---

## Task B — Rewrite `src/pages/Dashboard.jsx`

### Background — confirmed Dexie schema (from `src/db/database.js` and `src/db/planner.js`)

```
db.terms       fields: id(auto), name, year, termNumber, startDate, endDate, createdAt
db.classGroups fields: id(auto), termId, classLevel
db.subjects    fields: id(auto), classGroupId, name, curriculumSubjectId, curriculumClassId
db.weekPlans   fields: id(auto), subjectId, weekNumber, weekType, status, updatedAt
db.weekTopics  fields: id(auto), weekPlanId, strandId, subStrandId, contentStandardId
```

Key business rules (from `PlannerSubject.jsx`):
- `weekType` values: `'teaching'`, `'revision'`, `'exam'`, `'vacation'`
- `status` values: `'planned'`, `'taught'`, `'skipped'`
- A week counts as **taught** when `weekType === 'teaching' && status === 'taught'`
- A week counts as a **teaching week** when `weekType === 'teaching'`
- Maximum 16 weeks per subject (the `TOTAL_WEEKS = 16` constant in PlannerSubject.jsx)
- A `weekPlan` row only exists if the teacher has interacted with that week; weeks with no row default
  to `weekType: 'teaching', status: 'planned'`

### Step B-1 — Rewrite `src/pages/Dashboard.jsx`

**What:** Replace the current student-quiz Dashboard with a teacher lesson-planning progress dashboard.
Remove all imports of `useProgress`, `useStudent`, `StudentContext`, `MasteryList`, `getUnit`, and
`Link`/`useNavigate`. The new component uses only `useLiveQuery` from `dexie-react-hooks`, `db` from
`../db/database`, `ProgressBar` from `../components/ui/ProgressBar`, and `Card` from
`../components/ui/Card`.

**Full component structure to implement:**

```jsx
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db/database';
import { ProgressBar } from '../components/ui/ProgressBar';
import { Card } from '../components/ui/Card';
import { BarChart2 } from 'lucide-react';

export default function Dashboard() {
  const terms      = useLiveQuery(() => db.terms.orderBy('createdAt').toArray(), []);
  const classGroups= useLiveQuery(() => db.classGroups.toArray(), []);
  const subjects   = useLiveQuery(() => db.subjects.toArray(), []);
  const weekPlans  = useLiveQuery(() => db.weekPlans.toArray(), []);

  // Loading state
  if (terms === undefined) return <div className="pb-24 px-4 pt-6 text-ink-soft">Loading…</div>;

  // Empty state
  if (terms.length === 0) {
    return (
      <div className="pb-24 px-4 pt-6 flex flex-col items-center justify-center gap-4 py-16 text-center">
        <BarChart2 size={48} className="text-ink-soft/30" />
        <div>
          <p className="text-ink font-semibold">No terms yet</p>
          <p className="text-sm text-ink-soft mt-1">
            No terms yet. Go to Planner to set up your first term.
          </p>
        </div>
      </div>
    );
  }

  // ── Aggregation helpers ──────────────────────────────────────────
  // For a given subjectId, count total teaching weeks and taught weeks.
  // A weekPlan row only exists when the teacher has touched it. Weeks
  // 1–16 with no row default to teaching/planned.
  function getSubjectProgress(subjectId) {
    const plans = (weekPlans ?? []).filter(wp => wp.subjectId === subjectId);
    const planByWeek = {};
    plans.forEach(p => { planByWeek[p.weekNumber] = p; });

    let totalTeaching = 0;
    let totalTaught = 0;
    for (let w = 1; w <= 16; w++) {
      const plan = planByWeek[w];
      const type   = plan?.weekType ?? 'teaching';
      const status = plan?.status   ?? 'planned';
      if (type === 'teaching') {
        totalTeaching++;
        if (status === 'taught') totalTaught++;
      }
    }
    return { totalTeaching, totalTaught };
  }

  // ── Global summary ───────────────────────────────────────────────
  let globalTeaching = 0;
  let globalTaught = 0;
  (subjects ?? []).forEach(s => {
    const { totalTeaching, totalTaught } = getSubjectProgress(s.id);
    globalTeaching += totalTeaching;
    globalTaught   += totalTaught;
  });
  const globalPct = globalTeaching > 0 ? Math.round((globalTaught / globalTeaching) * 100) : 0;

  // ── Render ───────────────────────────────────────────────────────
  return (
    <div className="pb-24 space-y-6">
      {/* Page header */}
      <div className="flex items-center gap-2 pt-2">
        <BarChart2 size={22} className="text-accent" />
        <h1 className="text-xl font-bold text-ink">Progress</h1>
      </div>

      {/* Global summary cards */}
      <div className="grid grid-cols-3 gap-3">
        <Card>
          <p className="text-2xl font-bold text-ink">{globalTeaching}</p>
          <p className="text-xs text-ink-soft mt-0.5">Weeks planned</p>
        </Card>
        <Card>
          <p className="text-2xl font-bold text-accent">{globalTaught}</p>
          <p className="text-xs text-ink-soft mt-0.5">Weeks taught</p>
        </Card>
        <Card>
          <p className="text-2xl font-bold text-ink">{globalPct}%</p>
          <p className="text-xs text-ink-soft mt-0.5">Overall</p>
        </Card>
      </div>

      {/* Overall progress bar */}
      <Card>
        <ProgressBar value={globalPct} label="Overall completion" />
      </Card>

      {/* Per-term breakdown */}
      {terms.map(term => {
        const termClassGroups = (classGroups ?? []).filter(cg => cg.termId === term.id);
        // Collect all subjects under this term
        const termSubjects = (subjects ?? []).filter(s =>
          termClassGroups.some(cg => cg.id === s.classGroupId)
        );

        let termTeaching = 0;
        let termTaught = 0;
        termSubjects.forEach(s => {
          const { totalTeaching, totalTaught } = getSubjectProgress(s.id);
          termTeaching += totalTeaching;
          termTaught   += totalTaught;
        });
        const termPct = termTeaching > 0 ? Math.round((termTaught / termTeaching) * 100) : 0;

        return (
          <Card key={term.id}>
            {/* Term header */}
            <div className="flex items-center gap-2 flex-wrap mb-3">
              <span className="font-semibold text-ink">{term.name}</span>
              <span className="rounded-full bg-accent/10 text-accent text-xs px-2 py-0.5 font-medium">
                {term.year}
              </span>
              <span className="text-xs text-ink-soft">Term {term.termNumber}</span>
            </div>
            <ProgressBar value={termPct} label={`${termTaught} / ${termTeaching} weeks taught`} />

            {/* Class groups */}
            {termClassGroups.length > 0 && (
              <div className="mt-4 space-y-4">
                {termClassGroups.map(cg => {
                  const cgSubjects = termSubjects.filter(s => s.classGroupId === cg.id);
                  return (
                    <div key={cg.id}>
                      <p className="text-xs font-semibold text-ink-soft uppercase tracking-wide mb-2">
                        {cg.classLevel}
                      </p>
                      <div className="space-y-2">
                        {cgSubjects.map(subject => {
                          const { totalTeaching, totalTaught } = getSubjectProgress(subject.id);
                          const pct = totalTeaching > 0
                            ? Math.round((totalTaught / totalTeaching) * 100)
                            : 0;
                          return (
                            <div key={subject.id} className="border border-line rounded-xl bg-paper p-3">
                              <div className="flex justify-between items-center mb-1.5">
                                <span className="text-sm font-medium text-ink">{subject.name}</span>
                                <span className="text-xs text-ink-soft">
                                  {totalTaught}/{totalTeaching} wks
                                </span>
                              </div>
                              <ProgressBar value={pct} />
                            </div>
                          );
                        })}
                        {cgSubjects.length === 0 && (
                          <p className="text-sm text-ink-soft">No subjects added yet.</p>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </Card>
        );
      })}
    </div>
  );
}
```

**Files to modify:** `src/pages/Dashboard.jsx` — full replacement.

**Verify:**
```
npm run build
```
Expected: build exits 0. No TypeScript/ESLint errors (project uses plain JS). The old imports
(`useProgress`, `useStudent`, `MasteryList`, `getUnit`) are fully removed.

---

### Step B-2 — Smoke-test the Dashboard page

**What:** Start the dev server and verify the dashboard renders correctly in both empty and populated
states.

**Checklist:**
- Navigate to `/dashboard` with no planner data → shows the empty state message
  "No terms yet. Go to Planner to set up your first term."
- Create a term via `/planner`, add a class group and one or two subjects.
- Navigate back to `/dashboard` → summary cards appear, term card appears with the correct class
  level and subject rows.
- Mark some weeks as Taught in `/planner/:termId/:subjectId` → progress bars on the dashboard update
  reactively (Dexie live query).
- Desktop: the "Progress" nav link is visible and routes to `/dashboard`.
- Mobile: bottom nav also routes correctly.

**Verify:**
```
npm run dev
```
Open http://localhost:5173/dashboard. All checklist items pass.

---

## Build verification (final)

Run a clean production build after both tasks are complete:

```
npm run build
```

Expected output:
- Vite exits 0.
- No unresolved import warnings.
- `dist/` folder is produced.
- Bundle size for the data chunk may be large (the new `curriculumData.js` will be 200–400 KB of JS
  objects) — this is expected and acceptable for a local PWA app.

---

## Implementation order

1. **A-1** — write and run `scripts/parseCurriculum.mjs`; confirm per-subject strand counts in
   console output.
2. **A-2** — patch the generated `curriculumData.js` for edge cases; run `npm run build` to verify.
3. **A-3** — smoke-test Curriculum page in the dev server.
4. **B-1** — replace `Dashboard.jsx`; run `npm run build`.
5. **B-2** — smoke-test Dashboard page.
6. Final `npm run build` — confirm clean exit.

Steps 1–3 must complete before steps 4–6 begin because Dashboard.jsx imports nothing from
curriculumData.js, so they are technically independent — but running the build after the data file
change first ensures there are no JS syntax errors in the large generated file before adding more
changes.

---

## Assumptions and decisions

- **No test framework exists** in this project (no vitest/jest in package.json). All verification is
  via `npm run build` (Vite) and manual smoke-testing in the dev server.
- **Parser is a Node script, not a Vite plugin**, because it runs once to produce a static JS file
  rather than dynamically at bundle time. This keeps the bundle size predictable and the Vite config
  unchanged.
- **Dashboard removes the student-learning UI entirely.** The current Dashboard mixes student quiz
  progress with teacher planning in a way that the app's current role (teacher tool) makes
  contradictory. The student-progress hooks (`useProgress`, `useStudent`) still exist for other pages
  and are untouched.
- **classLevel display** — the Dashboard uses `cg.classLevel` (the raw id like `'B7'`) rather than
  looking up a label, because `CLASS_LEVELS` is defined inline in `PlannerTerm.jsx` and is not
  exported. If the implementer wants a friendly label, they can inline the same `CLASS_LEVELS` array
  from PlannerTerm.jsx into the Dashboard or extract it to a shared constant file.
