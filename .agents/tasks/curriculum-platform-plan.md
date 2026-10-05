# Implementation Plan — Number Academy Curriculum Platform

## Exploration findings

**Codebase state**
- React 19 + Vite 7 + Tailwind v4 PWA; ESM project (`"type":"module"`); no test framework.
- `npm run build` is the sole verification command. `node --check <file>` verifies generated JS syntax.
- Dexie DB is at version(3). BottomNav has exactly 5 tabs (Home, Planner, Curriculum, Progress, Profile) — all slots occupied. AI Assistant must live at `/ai-assistant` reachable via Curriculum drawer CTA, not a nav tab.
- `src/data/curriculumData.js` already exports `mathematics.B7` (full 4-strand dataset) and `science.B7` (partial, 3-strand). These must be preserved/merged.
- `src/pages/Curriculum.jsx` renders StandardCard components that get `standard` prop only — will need `strand` and `subStrand` props added.
- `src/pages/PlannerLesson.jsx` has a `currDetails` computed value (strand, subStrand, contentStandard, resolvedIndicators) ready for AI context. Step renders are in `renderSlide()` switch.

**Critical edge cases discovered in the markdown files**
1. `CREATIVE_ARTS_AND_DESIGN_Basic{7,8,9}_Full.md` and `CCP_MATHEMATICS_JHS_2023_Basic{7,8,9}_Full.md` are **stub files** (1.2 KB each, 0 strands declared in header table, no body content). Parser must return `[]` for these gracefully.
2. Indicator descriptions appear two ways: (a) paragraph on the line after `#### Indicator CODE`, (b) inline on the same `####` line after the code.
3. The `*(printed in the curriculum as "...")* ` parenthetical in `#### Indicator` headings must be stripped.
4. Exemplars / Core competencies blocks below indicators must be ignored.
5. Some `#### Indicator` headings (Social Studies) have a slight variant: `B7/JHS1 1.1.2.1` with a space (no slash) — use the bolded `**...**` code in the NOTES section as authoritative ID if needed, otherwise use whatever appears in the `####` heading after stripping parens.
6. French and Ghanaian Language content has non-ASCII characters — preserve as-is (Node `fs.readFileSync` with `'utf8'` handles this).
7. Mathematics B8/B9 are CCP_MATHEMATICS stubs → parser produces empty arrays → `curriculumMap.mathematics.B8` = `[]`. This is expected; the Curriculum browser already handles missing class data gracefully (disabled class pill).

**File mapping decision**: For Science B7, use `CCP_SCIENCE_JHS_2023_Basic7_Full.md` (72 KB, populated) rather than the original `NaCCA_Science_Curriculum_Basic7_Full.md` — it has the same code format and more indicators. The existing `science.B7` in curriculumData.js will be replaced by the parsed output from this file (it has more strands: 5 vs 3).

**FEAT decomposition decision**: The five tasks decompose into 5 independent or loosely-chained FEATs. FEAT-001 and FEAT-002 are fully independent of each other (different files). FEAT-003 depends on FEAT-001 (subjects array) and FEAT-002 (ai.js). FEAT-004 depends on FEAT-002 only. FEAT-005 depends on FEATs 001-004.

---

## Implementation Plan

- [ ] 1. **Write the curriculum parser script** (`scripts/parse-curriculum.mjs`)
      Parse all 9 non-math, non-empty subject families from their `.md` files using a line-by-line state machine. Hardcode the existing mathematics B7 data inline (copy verbatim from curriculumData.js). Output a valid ESM file to `src/data/curriculumData.js` with `subjects` (10 entries), `classes`, and `curriculumMap`. Stub files produce empty arrays — handled gracefully.
      Files: `scripts/parse-curriculum.mjs`, `src/data/curriculumData.js`
      Verify:
      ```
      node c:\Users\KING\number-academy\scripts\parse-curriculum.mjs
      node --check c:\Users\KING\number-academy\src\data\curriculumData.js
      npm run build
      ```

- [ ] 2. **Create Node proxy server + AI service layer** (independent of item 1)
      Create `server.js` using only Node built-ins (`http`, `https`, `fs`, `path`, `url`). Reads `.env` at startup, listens on port 3001, proxies POST `/api/generate` to OpenRouter. Add server proxy in `vite.config.js`. Create `.env.example`. Add `.env` to `.gitignore`. Create `src/services/ai.js` exporting `generateLessonPlan`, `generateActivities`, `generateAssessment`, `explainIndicator` — each builds a Ghana NaCCA-framed prompt and calls `/api/generate`.
      Files: `server.js`, `.env.example`, `.gitignore`, `vite.config.js`, `src/services/ai.js`
      Verify:
      ```
      node --check c:\Users\KING\number-academy\server.js
      node --check c:\Users\KING\number-academy\src\services\ai.js
      npm run build
      ```

- [ ] 3. **Enhance Curriculum.jsx with AI drawer** (needs items 1 + 2)
      Add `AIDrawer` slide-up component. Update `StandardCard` to accept `strand`/`subStrand` props and render 4 AI action buttons per indicator when expanded. Wire each button to the corresponding `ai.js` function. Show spinner while loading, formatted text on success, error message on failure. Copy button. After successful lesson generation, show "Plan this in Planner →" CTA that navigates to `/planner`. Pass `strand`/`subStrand` from the Curriculum loop into StandardCard.
      Files: `src/pages/Curriculum.jsx`
      Verify: `npm run build`

- [ ] 4. **Add AI generate buttons to PlannerLesson.jsx** (needs item 2 only)
      Add `aiLoading`/`aiError` state keyed by step. Add `AIButton` component (spinner-aware, disabled with tooltip when `currDetails` is null). In Starter, Main, Plenary, Evaluation, Homework steps: insert an AI button above the textarea that calls the appropriate `ai.js` function and populates the field. Error display below each textarea.
      Files: `src/pages/PlannerLesson.jsx`
      Verify: `npm run build`

- [ ] 5. **Create AIAssistant page + wire App.jsx + final build** (needs items 1–4)
      Create `src/pages/AIAssistant.jsx`: chat UI with sticky header, scrollable message thread (user bubbles right, AI bubbles left), sticky input bar at bottom, auto-scroll. System prompt identifies AI as Ghanaian JHS curriculum assistant. Add `/ai-assistant` route to `App.jsx`. Run `npm run build` and fix any errors.
      Files: `src/pages/AIAssistant.jsx`, `src/App.jsx`
      Verify: `npm run build` — must complete with zero errors.

---

## Parser design notes (item 1 detail)

The dominant structure across all non-stub files is identical:
```
# STRAND N: TITLE
## SUB-STRAND N: TITLE
### Content Standard CODE
**description text**
#### Indicator CODE  *(printed in the curriculum as "...")*
indicator description (paragraph or inline after code)
**Exemplars:** ...  ← stop capturing here
**Core competencies:** ...  ← stop capturing here
```

State machine rules:
- Detect `# ` + `STRAND` → new strand. Extract number and title after `:`.
- Detect `## ` → new sub-strand. Extract code+title after `:`. Sequential counter per strand.
- Detect `### ` → new content standard. Extract code as first whitespace-delimited token after `Content Standard ` (or whole text if pattern absent).
- `**...**` line after `###` and before first `####` → content standard description (strip `**`).
- `#### ` → new indicator. Extract code (everything up to double-space, `*(printed`, or end of first meaningful token). Strip `*(printed in the curriculum as "...")* `. Capture inline text after code as initial description.
- Plain text paragraph (no special prefix) while inside an indicator → append to indicator description until `**Exemplars**` or `**Core competencies**` or `- CC`/`- CP`/`- CI`/`- DL`/`- PL`/`- CG` line encountered.
- `---` separator → reset indicator description capture; do not close strand/sub-strand.
- Table rows (`|...|`) → skip.
- Preamble (everything before first `# STRAND`) → skip.

Serialisation: `JSON.stringify(curriculumMap, null, 2)` embedded in a template literal in the output JS file. The output file must be a valid ES module (checked by `node --check`).

---

## Artifact root

FEAT artifacts: `c:\Users\KING\number-academy\.agents\tasks\curriculum-platform\`
- `task.json`, `context.json`
- `features/FEAT-001.json` — Parser script
- `features/FEAT-002.json` — Server + AI service
- `features/FEAT-003.json` — Curriculum.jsx AI drawer
- `features/FEAT-004.json` — PlannerLesson.jsx AI buttons
- `features/FEAT-005.json` — AIAssistant page + final build

Verdict file: `c:\Users\KING\number-academy\.agents\tasks\curriculum-platform\verdict.json`
