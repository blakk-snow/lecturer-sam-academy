import { useState } from 'react';
import { X } from 'lucide-react';
import { classes as curriculumClasses, curriculumMap, subjects as curriculumSubjects } from '../../data/curriculumData';
import { Button } from '../../components/ui/Button';

export function AddTopicModal({
  subjectName,
  curriculumSubjectId,
  curriculumClassId,
  plannerClassId,
  className,
  onAdd,
  onClose,
  initialData,
  onUpdate,
}) {
  const [selectedCurriculumSubjectId, setSelectedCurriculumSubjectId] = useState(
    initialData?.curriculumSubjectId ?? curriculumSubjectId ?? '',
  );
  const [selectedCurriculumClassId, setSelectedCurriculumClassId] = useState(
    plannerClassId ?? initialData?.curriculumClassId ?? curriculumClassId ?? '',
  );
  const availableClasses = curriculumClasses.filter(cl =>
    (!plannerClassId || cl.id === plannerClassId) &&
    (curriculumMap[selectedCurriculumSubjectId] ?? {})[cl.id]?.length > 0,
  );
  const subjectHasCurriculum = subjectId => curriculumClasses.some(cl =>
    (!plannerClassId || cl.id === plannerClassId) &&
    (curriculumMap[subjectId] ?? {})[cl.id]?.length > 0,
  );
  const strands = (curriculumMap[selectedCurriculumSubjectId] ?? {})[selectedCurriculumClassId] ?? [];
  const hasCurriculum = strands.length > 0;
  const inputClass = 'border border-line rounded-xl bg-paper px-3 py-2 w-full text-ink text-sm focus:outline-none focus:border-accent';

  const parseIds = (raw) =>
    Array.isArray(raw) ? raw : (typeof raw === 'string' ? JSON.parse(raw || '[]') : []);

  // Step 1: strand
  const [activeStrandId, setActiveStrandId] = useState(
    initialData?.strandId ?? strands[0]?.id ?? null
  );
  // Step 2: sub-strand
  const [activeSubStrandId, setActiveSubStrandId] = useState(
    initialData?.subStrandId ?? null
  );
  // Step 3: content standard + indicators
  const [activeStandardId, setActiveStandardId] = useState(
    initialData?.contentStandardId ?? null
  );
  const [selectedIndicatorIds, setSelectedIndicatorIds] = useState(
    parseIds(initialData?.indicatorIds)
  );
  // Notes
  const [notes, setNotes] = useState(initialData?.notes ?? '');
  // Resources
  const [resources, setResources] = useState(initialData?.resources ?? '');

  const activeStrand = strands.find(s => s.id === activeStrandId);
  const activeSubStrand = activeStrand?.subStrands.find(ss => ss.id === activeSubStrandId);
  const activeStandard = activeSubStrand?.contentStandards.find(cs => cs.id === activeStandardId);

  function toggleIndicator(indicatorId) {
    setSelectedIndicatorIds(prev =>
      prev.includes(indicatorId)
        ? prev.filter(id => id !== indicatorId)
        : [...prev, indicatorId]
    );
  }

  function selectSubStrand(ssId) {
    // When toggling a sub-strand closed (ssId is null), keep the existing
    // standard and indicators so they are not silently discarded in edit mode.
    if (ssId === null) {
      setActiveSubStrandId(null);
      return;
    }
    // Switching to a different sub-strand — reset dependent state
    if (ssId !== activeSubStrandId) {
      setActiveStandardId(null);
      setSelectedIndicatorIds([]);
    }
    setActiveSubStrandId(ssId);
  }

  function selectStrandTab(strandId) {
    setActiveStrandId(strandId);
    setActiveSubStrandId(null);
    setActiveStandardId(null);
    setSelectedIndicatorIds([]);
  }

  function handleCurriculumSubjectChange(nextSubjectId) {
    setSelectedCurriculumSubjectId(nextSubjectId);
    const nextClassId = curriculumClasses.find(cl =>
      (!plannerClassId || cl.id === plannerClassId) &&
      (curriculumMap[nextSubjectId] ?? {})[cl.id]?.length > 0,
    )?.id ?? '';
    setSelectedCurriculumClassId(nextClassId);
    setActiveStrandId((curriculumMap[nextSubjectId] ?? {})[nextClassId]?.[0]?.id ?? null);
    setActiveSubStrandId(null);
    setActiveStandardId(null);
    setSelectedIndicatorIds([]);
  }

  function handleCurriculumClassChange(nextClassId) {
    const nextStrands = (curriculumMap[selectedCurriculumSubjectId] ?? {})[nextClassId] ?? [];
    setSelectedCurriculumClassId(nextClassId);
    setActiveStrandId(nextStrands[0]?.id ?? null);
    setActiveSubStrandId(null);
    setActiveStandardId(null);
    setSelectedIndicatorIds([]);
  }

  function selectStandard(csId) {
    setActiveStandardId(csId);
    setSelectedIndicatorIds([]);
  }

  function handleSubmit() {
    const payload = {
      curriculumSubjectId: selectedCurriculumSubjectId || null,
      curriculumClassId: selectedCurriculumClassId || null,
      strandId: hasCurriculum ? activeStrandId : null,
      subStrandId: hasCurriculum ? activeSubStrandId : null,
      contentStandardId: hasCurriculum ? activeStandardId : null,
      indicatorIds: hasCurriculum ? selectedIndicatorIds : [],
      notes,
      resources,
    };

    if (onUpdate) {
      onUpdate(payload);
    } else {
      onAdd(payload);
    }
  }

  const canSubmit = hasCurriculum
    ? Boolean(activeStandardId)
    : Boolean(notes.trim() || resources.trim());

  const isEditMode = Boolean(onUpdate);

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center">
      <div className="bg-card rounded-xl p-5 max-w-lg w-full mx-4 max-h-[85vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold text-ink">
            {isEditMode ? 'Edit Topic' : 'Add Topic'}
            {subjectName ? ` — ${subjectName}` : ''}
          </h2>
          <button
            onClick={onClose}
            className="text-ink-soft hover:text-ink p-1 rounded-lg"
            aria-label="Close"
          >
            <X size={20} />
          </button>
        </div>

        <div className="mb-5 space-y-3 rounded-xl border border-line bg-paper p-3">
          <p className="text-xs font-semibold uppercase tracking-wide text-ink-soft">
            Link this topic to the NaCCA curriculum
          </p>
          <label className="block text-sm text-ink-soft">
            Curriculum subject
            <select
              value={selectedCurriculumSubjectId}
              onChange={event => handleCurriculumSubjectChange(event.target.value)}
              className={`${inputClass} mt-1`}
            >
              <option value="">Select a curriculum subject</option>
              {curriculumSubjects.map(item => (
                <option
                  key={item.id}
                  value={item.id}
                  disabled={!subjectHasCurriculum(item.id)}
                >
                  {item.label}{subjectHasCurriculum(item.id) ? '' : ' — curriculum data unavailable'}
                </option>
              ))}
            </select>
          </label>
          {selectedCurriculumSubjectId && (
            <label className="block text-sm text-ink-soft">
              Curriculum class
              <select
                value={selectedCurriculumClassId}
                onChange={event => handleCurriculumClassChange(event.target.value)}
                className={`${inputClass} mt-1`}
              >
                <option value="">Select a curriculum class</option>
                {selectedCurriculumClassId && !availableClasses.some(item => item.id === selectedCurriculumClassId) && (
                  <option value={selectedCurriculumClassId} disabled>
                    {curriculumClasses.find(item => item.id === selectedCurriculumClassId)?.label ?? selectedCurriculumClassId}
                    {' — no curriculum data for this class'}
                  </option>
                )}
                {availableClasses.map(item => (
                  <option key={item.id} value={item.id}>{item.label}</option>
                ))}
              </select>
            </label>
          )}
          {className && (
            <p className="text-xs text-ink-soft">
              Planner class: {className}. Choose the matching NaCCA class above.
            </p>
          )}
        </div>

        {hasCurriculum ? (
          <>
            {/* Step 1: Strand pills */}
            <p className="text-xs text-ink-soft uppercase font-semibold tracking-wide mb-2">Strand</p>
            <div className="flex gap-2 flex-wrap mb-4">
              {strands.map(strand => (
                <button
                  key={strand.id}
                  onClick={() => selectStrandTab(strand.id)}
                  className={`rounded-full px-3 py-1 text-sm font-medium transition-colors ${
                    strand.id === activeStrandId
                      ? 'bg-accent text-white'
                      : 'bg-paper border border-line text-ink-soft hover:text-ink'
                  }`}
                >
                  {strand.title}
                </button>
              ))}
            </div>

            {/* Step 2: Sub-strand accordion */}
            {activeStrand && (
              <>
                <p className="text-xs text-ink-soft uppercase font-semibold tracking-wide mb-2">Sub-Strand</p>
                <div className="space-y-2 mb-4">
                  {activeStrand.subStrands.map(ss => (
                    <div key={ss.id} className="border border-line rounded-xl overflow-hidden">
                      <button
                        onClick={() => selectSubStrand(ss.id === activeSubStrandId ? null : ss.id)}
                        className={`w-full text-left px-3 py-2 text-sm font-medium transition-colors ${
                          ss.id === activeSubStrandId
                            ? 'bg-accent/10 text-accent'
                            : 'bg-paper text-ink hover:bg-card'
                        }`}
                      >
                        <span className="font-mono text-xs mr-2 text-ink-soft">{ss.code}</span>
                        {ss.title}
                      </button>

                      {/* Step 3: Content standards when sub-strand is open */}
                      {ss.id === activeSubStrandId && (
                        <div className="border-t border-line divide-y divide-line">
                          {ss.contentStandards.map(cs => (
                            <div key={cs.id}>
                              <button
                                onClick={() => selectStandard(cs.id === activeStandardId ? null : cs.id)}
                                className={`w-full text-left px-3 py-2 text-sm transition-colors ${
                                  cs.id === activeStandardId
                                    ? 'bg-accent/10 text-accent'
                                    : 'text-ink hover:bg-paper'
                                }`}
                              >
                                <span className="font-mono text-xs font-bold text-accent mr-2">{cs.code}</span>
                                {cs.description}
                              </button>

                              {/* Indicators when standard is selected */}
                              {cs.id === activeStandardId && cs.indicators.length > 0 && (
                                <ul className="border-t border-line bg-paper px-3 py-2 space-y-1">
                                  <p className="text-xs text-ink-soft mb-1">Select indicators (optional):</p>
                                  {cs.indicators.map(ind => (
                                    <li key={ind.id} className="flex items-start gap-2">
                                      <input
                                        type="checkbox"
                                        id={`ind-${ind.id}`}
                                        checked={selectedIndicatorIds.includes(ind.id)}
                                        onChange={() => toggleIndicator(ind.id)}
                                        className="mt-0.5 shrink-0 accent-accent"
                                      />
                                      <label htmlFor={`ind-${ind.id}`} className="text-xs text-ink cursor-pointer">
                                        <span className="font-mono font-bold text-accent mr-1">{ind.code}</span>
                                        {ind.description}
                                      </label>
                                    </li>
                                  ))}
                                </ul>
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </>
            )}
          </>
        ) : (
          <p className="mb-4 rounded-xl border border-line bg-paper p-3 text-sm text-ink-soft">
            Choose a curriculum subject and class to browse strands, sub-strands, content standards, and indicators.
            {selectedCurriculumSubjectId && selectedCurriculumClassId && !hasCurriculum
              ? ` The embedded curriculum has no entries for this subject and class${className ? ` (${className})` : ''}. Choose an available subject or add notes without a curriculum link.`
              : ''}
          </p>
        )}

        {/* Notes */}
        <p className="text-xs text-ink-soft uppercase font-semibold tracking-wide mb-2">
          {hasCurriculum ? 'Notes (optional)' : 'Notes'}
        </p>
        <textarea
          value={notes}
          onChange={e => setNotes(e.target.value)}
          rows={3}
          placeholder="Add a note or description..."
          className={`${inputClass} resize-none mb-4`}
        />

        {/* Resources */}
        <p className="text-xs text-ink-soft uppercase font-semibold tracking-wide mb-2">
          Resources (optional)
        </p>
        <textarea
          value={resources}
          onChange={e => setResources(e.target.value)}
          rows={2}
          placeholder="Links, textbook pages, materials…"
          className={`${inputClass} resize-none mb-4`}
        />

        <Button
          variant="primary"
          className="w-full"
          onClick={handleSubmit}
          disabled={!canSubmit}
        >
          {isEditMode ? 'Update Topic' : (hasCurriculum ? 'Add Topic' : 'Add Note')}
        </Button>
      </div>
    </div>
  );
}
