# Lesson Planner Topic UI — Accordion Detail, Edit Flow, and Resources Field

The change adds four connected capabilities to the lesson planner's subject view: a richer topic summary row showing content-standard and indicator codes, an expandable accordion detail panel, a resources field in the topic modal, and full edit-mode support that pre-fills the modal from an existing `weekTopics` row. The driving motivation is to surface curriculum context directly in the planner list so teachers don't have to remember what "B7.1.1.1" means — they click and see the full strand/sub-strand/standard/indicator hierarchy. The implementation strategy is purely additive: no DB schema changes, no new helpers beyond the page itself, and two new component props (`initialData`, `onUpdate`) gate the edit path.

**Watch for:** (1) confirmed — `indicatorIds` JSON/array duality is handled defensively in all three lookup helpers; (2) confirmed — `lookupTopicDetails` traverses the same `curriculumMap[subjectId][classId]` chain used by the other helpers; (3) confirmed — `AddTopicModal` initializes all state from `initialData` on mount, but the initialization is one-shot (`useState` with an initial value), so if `editingTopic` identity changes without unmounting the modal the state won't re-initialize — this is not triggered by the current code but is a latent risk; (4) confirmed — build status from the coder step's final integration note: "1739 modules, zero errors."

**Verdict**: APPROVED

---

## High-level view

`lookupIndicatorCodes` and `lookupTopicDetails` both walk the same `curriculumMap[subject.curriculumSubjectId][subject.curriculumClassId]` chain established by `getStrands()`. Both defensively parse `indicatorIds` as either a JSON string or a plain array, covering both rows written before and after the stringify change in `handleAddTopic`. The traversal terminates correctly at the content-standard level and resolves indicators by filtering `cs.indicators`.

The accordion toggle is controlled by a single `expandedTopicId` state value at the page level. The chevron icon swaps correctly using `isExpanded ? <ChevronUp> : <ChevronDown>`, and the detail panel is conditional on `isExpanded && (...)`. `lookupTopicDetails` is only called when `isExpanded` is true, which avoids re-traversing the curriculum map on every render for every collapsed topic.

`AddTopicModal` accepts `initialData` and `onUpdate` as optional props. All six state values — `activeStrandId`, `activeSubStrandId`, `activeStandardId`, `selectedIndicatorIds`, `notes`, `resources` — are seeded from `initialData` at `useState` call time. The `parseIds` helper handles both array and JSON-string forms of `indicatorIds`. `handleSubmit` branches on `onUpdate` being truthy to choose add vs. update path, and `resources` is present in the payload for both paths.

---

<details>
<summary>Issues (2)</summary>

1. **One-shot state initialization in edit modal** — `AddTopicModal` initializes state from `initialData` via `useState(initialData?.x ?? ...)`. If React reuses the component instance across two different `editingTopic` values (possible if the key prop is absent), the second topic opens pre-filled with the first topic's data. Add `key={editingTopic.id}` to the edit-mode `<AddTopicModal>` in `PlannerSubject.jsx` to force a fresh mount on each edit.

2. **`selectSubStrand` clears indicators when toggling same sub-strand closed** — clicking an already-open sub-strand calls `selectSubStrand(null)`, which resets `activeStandardId` and `selectedIndicatorIds`. In edit mode, this means tapping the currently-selected sub-strand once discards the pre-filled indicator selection silently. Low impact (user unlikely to tap their own active sub-strand) but worth a note.

</details>

---

<details>
<summary>Details</summary>

## `lookupIndicatorCodes` and `lookupTopicDetails` correctness

Both helpers defensively handle the `indicatorIds` duality with the same `try/catch` pattern:

```js
ids = typeof topic.indicatorIds === 'string'
  ? JSON.parse(topic.indicatorIds)
  : topic.indicatorIds;
```

This covers: (a) rows saved before the stringify change, stored as plain JS arrays by Dexie's structured-clone serialization; (b) rows saved after the change, stored as `"[\"B7.1.1.1.1\"]"` strings. The `try/catch` with `ids = []` fallback handles corrupted or empty strings without throwing.

`lookupTopicDetails` is a superset of `lookupTopicLabel` — it returns the full `{ strand, subStrand, contentStandard, resolvedIndicators }` object by traversing the same three-level loop. The traversal exits as soon as `cs.id === topic.contentStandardId` is satisfied, which is correct given content standard IDs are globally unique in the curriculum data. `resolvedIndicators` is built with `cs.indicators.filter(ind => indicatorIds.includes(ind.id))`, which is correct and handles the empty-indicators case (returns `[]`).

## Edit-mode state initialization gap

`AddTopicModal` initializes all state from `initialData` at mount time. The add modal (`addTopicForWeek !== null`) and the edit modal (`editingTopic !== null`) are rendered as separate JSX branches, so they mount/unmount independently — this is correct. However, neither branch passes a `key` prop. If React's reconciler happens to reuse the same component fiber across two consecutive edits (e.g., user edits topic A, saves, immediately edits topic B — both use the same `editingTopic !== null` branch), the `useState` initializers won't re-run and topic B's modal opens with topic A's state.

The fix is one line: add `key={editingTopic.id}` to the edit-mode `<AddTopicModal>`. This guarantees a fresh mount — and thus fresh `useState` initialization — for every distinct topic.

## `selectSubStrand` side-effect on edit pre-fill

`selectSubStrand` is called with `null` when the user taps the already-open sub-strand (toggle-close gesture). This resets `activeStandardId` and `selectedIndicatorIds` to their empty defaults, discarding any pre-filled values from `initialData`. The scenario requires the teacher to tap their already-selected sub-strand, which is an unusual gesture, but the silent data loss is worth noting.



</details>

---

<details>
<summary>File map</summary>

- `src/pages/PlannerSubject.jsx` — added `lookupIndicatorCodes`, `lookupTopicDetails` helpers; richer topic summary row with chevron toggle; expandable detail panel rendering strand/sub-strand/standard/indicators; edit state and `handleUpdateTopic`; second `AddTopicModal` instance for edit mode.
- `src/components/planner/AddTopicModal.jsx` — added `resources` textarea and state; added `initialData`/`onUpdate` props; seeded all state from `initialData`; `handleSubmit` branches on `onUpdate`; dynamic button/header labels for edit vs. add mode.

Full diff: `git diff main -- src/pages/PlannerSubject.jsx src/components/planner/AddTopicModal.jsx`

</details>
