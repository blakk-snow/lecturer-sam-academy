import { useState } from 'react';
import { X } from 'lucide-react';
import { curriculumMap } from '../../data/curriculumData';
import { Button } from '../../components/ui/Button';

export function AddTopicModal({ subjectName, curriculumSubjectId, curriculumClassId, onAdd, onClose }) {
  const strands = (curriculumMap[curriculumSubjectId] ?? {})[curriculumClassId] ?? [];
  const hasCurriculum = strands.length > 0;

  // Step 1: strand
  const [activeStrandId, setActiveStrandId] = useState(strands[0]?.id ?? null);
  // Step 2: sub-strand
  const [activeSubStrandId, setActiveSubStrandId] = useState(null);
  // Step 3: content standard + indicators
  const [activeStandardId, setActiveStandardId] = useState(null);
  const [selectedIndicatorIds, setSelectedIndicatorIds] = useState([]);
  // Notes
  const [notes, setNotes] = useState('');

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
    setActiveSubStrandId(ssId);
    setActiveStandardId(null);
    setSelectedIndicatorIds([]);
  }

  function selectStrandTab(strandId) {
    setActiveStrandId(strandId);
    setActiveSubStrandId(null);
    setActiveStandardId(null);
    setSelectedIndicatorIds([]);
  }

  function selectStandard(csId) {
    setActiveStandardId(csId);
    setSelectedIndicatorIds([]);
  }

  function handleAdd() {
    if (hasCurriculum) {
      onAdd({
        strandId: activeStrandId,
        subStrandId: activeSubStrandId,
        contentStandardId: activeStandardId,
        indicatorIds: selectedIndicatorIds,
        notes,
      });
    } else {
      onAdd({
        strandId: null,
        subStrandId: null,
        contentStandardId: null,
        indicatorIds: [],
        notes,
      });
    }
  }

  const canAdd = hasCurriculum ? Boolean(activeStandardId) : notes.trim().length > 0;

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center">
      <div className="bg-card rounded-xl p-5 max-w-sm w-full mx-4 max-h-[80vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold text-ink">
            Add Topic{subjectName ? ` — ${subjectName}` : ''}
          </h2>
          <button
            onClick={onClose}
            className="text-ink-soft hover:text-ink p-1 rounded-lg"
            aria-label="Close"
          >
            <X size={20} />
          </button>
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
        ) : null}

        {/* Notes */}
        <p className="text-xs text-ink-soft uppercase font-semibold tracking-wide mb-2">
          {hasCurriculum ? 'Notes (optional)' : 'Note'}
        </p>
        <textarea
          value={notes}
          onChange={e => setNotes(e.target.value)}
          rows={3}
          placeholder="Add a note or description..."
          className="border border-line rounded-xl bg-paper px-3 py-2 w-full text-ink text-sm focus:outline-none focus:border-accent resize-none mb-4"
        />

        <Button
          variant="primary"
          className="w-full"
          onClick={handleAdd}
          disabled={!canAdd}
        >
          {hasCurriculum ? 'Add Topic' : 'Add Note'}
        </Button>
      </div>
    </div>
  );
}
