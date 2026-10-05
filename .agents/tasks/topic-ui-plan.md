# Implementation Plan — Lesson Planner Topic UI Improvements

## Context (discovered during exploration)

- **Build:** `npm run build` (Vite). No test runner — verification is a clean build.
- **`addWeekTopic`** stores `topicData` spread directly into the DB record. `indicatorIds` is passed as a plain array from `AddTopicModal` today (`selectedIndicatorIds` state), so existing rows may be stored as a plain JS array. The plan spec says to stringify on save and parse on read — plan step 1 confirms the storage shape and handles both forms defensively.
- **`curriculumMap`** shape confirmed: `curriculumMap[subjectId][classId]` → array of `{ id, code, title, subStrands: [{ id, code, title, contentStandards: [{ id, code, description, indicators: [{ id, code, description }] }] }] }`.
- **`updateWeekTopic(id, changes)`** already exists in `planner.js` — no DB changes needed.
- **Lucide-react** is already a dependency; `ChevronDown` / `ChevronUp` are available.
- No steering files or AGENTS.md found; no special contribution rules apply.

---

## Plan

- [ ] 1. Add `lookupIndicatorCodes` helper and richer summary row in `PlannerSubject.jsx`

  Add a `lookupIndicatorCodes(topic)` helper function directly below the existing `lookupTopicLabel` helper. It walks `curriculumMap[subject.curriculumSubjectId][subject.curriculumClassId]` the same way `lookupTopicLabel` does, finds the content standard, then maps `topic.indicatorIds` (parsing from JSON string if `typeof indicatorIds === 'string'`) to their `code` values and returns them joined with `', '`.

  Replace the existing sparse `<li>` render block (currently: bold monospace label + raw notes span) with the richer summary row:
  - Content standard code: `<span className="font-mono text-xs font-bold text-accent mr-1">`
  - Indicator codes: `<span className="text-xs text-ink-soft font-mono">` — comma-separated, only if any
  - Notes truncated: `{topic.notes?.slice(0, 60)}{topic.notes?.length > 60 ? '…' : ''}`
  - Resources truncated: same 60-char rule, only rendered if `topic.resources` is present
  - Keep the existing `×` delete button unchanged for now (it will be moved in step 3).

  Files: `src/pages/PlannerSubject.jsx`

  Verify: `npm run build` from `c:\Users\KING\number-academy` — zero errors.

---

- [ ] 2. Add expandable accordion detail panel in `PlannerSubject.jsx`

  This step depends on step 1 (the richer summary row structure is the base for the collapsed state).

  **State:** Add `const [expandedTopicId, setExpandedTopicId] = useState(null)` at the page level, alongside existing modal state.

  **Import:** Add `ChevronDown, ChevronUp` to the lucide-react import line.

  **Collapsed row changes:**
  - Wrap the `<li>` content in a clickable `<button>` (full width, `flex items-center justify-between gap-2 w-full text-left`) that calls `setExpandedTopicId(id => id === topic.id ? null : topic.id)`.
  - Show `<ChevronDown size={14} className="shrink-0 text-ink-soft" />` when collapsed, `<ChevronUp size={14} className="shrink-0 text-ink-soft" />` when expanded.
  - Remove the `×` delete button from the collapsed row (it moves into the detail panel in step 3).

  **Detail panel** — rendered as a sibling element below the `<li>` when `expandedTopicId === topic.id`:

  ```jsx
  <div className="bg-paper rounded-xl p-3 mt-2 space-y-2 text-sm">
    {/* Strand */}
    <div>
      <p className="text-xs text-ink-soft uppercase tracking-wide">Strand</p>
      <p className="text-ink text-sm">{strand.title}</p>
    </div>
    {/* Sub-strand */}
    <div>
      <p className="text-xs text-ink-soft uppercase tracking-wide">Sub-Strand</p>
      <p className="text-ink text-sm">
        <span className="font-mono text-accent mr-1">{subStrand.code}</span>
        {subStrand.title}
      </p>
    </div>
    {/* Content Standard */}
    <div>
      <p className="text-xs text-ink-soft uppercase tracking-wide">Content Standard</p>
      <p className="text-ink text-sm">
        <span className="font-mono font-bold text-accent mr-1">{contentStandard.code}</span>
        {contentStandard.description}
      </p>
    </div>
    {/* Indicators */}
    {resolvedIndicators.length > 0 && (
      <div>
        <p className="text-xs text-ink-soft uppercase tracking-wide mb-1">Indicators</p>
        <ul className="space-y-1">
          {resolvedIndicators.map(ind => (
            <li key={ind.id} className="flex gap-2">
              <span className="font-mono font-bold text-accent text-xs shrink-0">{ind.code}</span>
              <span className="text-ink-soft text-xs">{ind.description}</span>
            </li>
          ))}
        </ul>
      </div>
    )}
    {/* Resources */}
    {topic.resources && (
      <div>
        <p className="text-xs text-ink-soft uppercase tracking-wide">Resources</p>
        <p className="text-ink text-sm">{topic.resources}</p>
      </div>
    )}
    {/* Notes */}
    {topic.notes && (
      <div>
        <p className="text-xs text-ink-soft uppercase tracking-wide">Notes</p>
        <p className="text-ink text-sm">{topic.notes}</p>
      </div>
    )}
    {/* Actions */}
    <div className="flex items-center gap-3 pt-1">
      <button className="text-sm text-accent hover:text-accent/80 font-medium">Edit</button>
      <button
        onClick={() => handleRemoveTopic(topic.id)}
        className="text-sm text-red-500 hover:text-red-600 font-medium"
      >
        Delete
      </button>
    </div>
  </div>
  ```

  Add a `lookupTopicDetail(topic)` helper (or inline the logic) that, given a topic, returns `{ strand, subStrand, contentStandard, resolvedIndicators }` by walking `curriculumMap`. Parse `indicatorIds` from JSON string if needed (same defensive check as step 1). Returns `null` if `contentStandardId` is not set.

  Files: `src/pages/PlannerSubject.jsx`

  Verify: `npm run build` — zero errors.

---

- [ ] 3. Add Resources field to `AddTopicModal.jsx`

  This step is independent of steps 1 and 2 but must be completed before step 4 (which wires the modal for editing).

  Add a `resources` state: `const [resources, setResources] = useState('')`.

  Add a Resources textarea below the Notes textarea, following the same pattern:

  ```jsx
  <p className="text-xs text-ink-soft uppercase font-semibold tracking-wide mb-2">
    Resources (optional)
  </p>
  <textarea
    value={resources}
    onChange={e => setResources(e.target.value)}
    rows={2}
    placeholder="Links, textbook pages, materials…"
    className="border border-line rounded-xl bg-paper px-3 py-2 w-full text-ink text-sm focus:outline-none focus:border-accent resize-none mb-4"
  />
  ```

  Include `resources` in the object passed to `onAdd` in `handleAdd`.

  Files: `src/components/planner/AddTopicModal.jsx`

  Verify: `npm run build` — zero errors.

---

- [ ] 4. Add `initialData` / edit-mode support to `AddTopicModal.jsx`

  This step depends on step 3 (the `resources` field must exist before pre-filling it).

  **New props:**
  - `initialData` (optional): `{ strandId, subStrandId, contentStandardId, indicatorIds, notes, resources }` — when provided, the modal opens in edit mode.
  - `onUpdate` (optional): called with the same shape as `onAdd` — used instead of `onAdd` when in edit mode.

  **State initialization:** Change all `useState` initialisers to seed from `initialData` when present:

  ```js
  const parseIds = raw =>
    Array.isArray(raw) ? raw : (typeof raw === 'string' ? JSON.parse(raw || '[]') : []);

  const [activeStrandId, setActiveStrandId] = useState(
    initialData?.strandId ?? strands[0]?.id ?? null
  );
  const [activeSubStrandId, setActiveSubStrandId] = useState(
    initialData?.subStrandId ?? null
  );
  const [activeStandardId, setActiveStandardId] = useState(
    initialData?.contentStandardId ?? null
  );
  const [selectedIndicatorIds, setSelectedIndicatorIds] = useState(
    parseIds(initialData?.indicatorIds)
  );
  const [notes, setNotes] = useState(initialData?.notes ?? '');
  const [resources, setResources] = useState(initialData?.resources ?? '');
  ```

  **`handleAdd` → `handleSubmit`:** Rename `handleAdd` to `handleSubmit`. Inside, call `onUpdate(payload)` when `onUpdate` is provided, else `onAdd(payload)`.

  **Button label:** `{onUpdate ? 'Update Topic' : (hasCurriculum ? 'Add Topic' : 'Add Note')}`.

  **Header title:** `{onUpdate ? 'Edit Topic' : 'Add Topic'}{subjectName ? \` — ${subjectName}\` : ''}`.

  Files: `src/components/planner/AddTopicModal.jsx`

  Verify: `npm run build` — zero errors.

---

- [ ] 5. Wire Edit button in `PlannerSubject.jsx` to open `AddTopicModal` pre-filled

  This step depends on steps 2, 3, and 4.

  **New state:** `const [editingTopic, setEditingTopic] = useState(null)` at page level.

  **Import:** Add `updateWeekTopic` to the import from `../db/planner`.

  **Edit handler:**

  ```js
  async function handleUpdateTopic(topicData) {
    if (!editingTopic) return;
    await updateWeekTopic(editingTopic.id, {
      strandId: topicData.strandId,
      subStrandId: topicData.subStrandId,
      contentStandardId: topicData.contentStandardId,
      indicatorIds: JSON.stringify(topicData.indicatorIds ?? []),
      notes: topicData.notes,
      resources: topicData.resources,
    });
    setEditingTopic(null);
    setExpandedTopicId(null);
  }
  ```

  **Edit button** in the detail panel (from step 2): replace the placeholder `<button>Edit</button>` with:

  ```jsx
  <button
    onClick={() => setEditingTopic(topic)}
    className="text-sm text-accent hover:text-accent/80 font-medium"
  >
    Edit
  </button>
  ```

  **Modal rendering:** Add a second `AddTopicModal` render (or unify into one conditional block) for edit mode:

  ```jsx
  {editingTopic !== null && (
    <AddTopicModal
      subjectName={subject.name}
      curriculumSubjectId={subject.curriculumSubjectId}
      curriculumClassId={subject.curriculumClassId}
      initialData={editingTopic}
      onUpdate={(topicData) => handleUpdateTopic(topicData)}
      onClose={() => setEditingTopic(null)}
    />
  )}
  ```

  Files: `src/pages/PlannerSubject.jsx`

  Verify: `npm run build` from `c:\Users\KING\number-academy` — zero errors. This is the final verification for the whole feature set.

---

## Dependency order

```
Step 1 (richer summary)
Step 2 (accordion) — depends on step 1
Step 3 (resources field in modal) — independent
Step 4 (edit-mode modal) — depends on step 3
Step 5 (wire edit) — depends on steps 2 + 4
```

Steps 1 and 3 can be implemented in either order. All other ordering constraints are as noted above.
