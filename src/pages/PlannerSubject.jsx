import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useLiveQuery } from 'dexie-react-hooks';
import { ArrowLeft, Plus, ChevronDown, ChevronUp } from 'lucide-react';
import { db } from '../db/database';
import { upsertWeekPlan, addWeekTopic, removeWeekTopic, updateWeekTopic } from '../db/planner';
import { AddTopicModal } from '../components/planner/AddTopicModal';
import { curriculumMap } from '../data/curriculumData';

const WEEK_TYPES = [
  { value: 'teaching', label: 'Teaching' },
  { value: 'revision', label: 'Revision' },
  { value: 'exam', label: 'Exam' },
  { value: 'vacation', label: 'Vacation' },
];

const STATUSES = [
  { value: 'planned', label: 'Planned' },
  { value: 'taught', label: 'Taught' },
  { value: 'skipped', label: 'Skipped' },
];

const TOTAL_WEEKS = 16;

export default function PlannerSubject() {
  const { termId, subjectId } = useParams();
  const navigate = useNavigate();
  const numericSubjectId = Number(subjectId);

  const subject = useLiveQuery(() => db.subjects.get(numericSubjectId), [numericSubjectId]);

  const weekPlans = useLiveQuery(
    () => db.weekPlans.where('subjectId').equals(numericSubjectId).toArray(),
    [numericSubjectId]
  );

  const weekTopics = useLiveQuery(
    () => {
      if (!weekPlans?.length) return Promise.resolve([]);
      const planIds = weekPlans.map(wp => wp.id);
      return db.weekTopics.where('weekPlanId').anyOf(planIds).toArray();
    },
    [weekPlans]
  );

  // Modal / expand state
  const [addTopicForWeek, setAddTopicForWeek] = useState(null); // weekNumber
  const [expandedTopicId, setExpandedTopicId] = useState(null);
  const [editingTopic, setEditingTopic] = useState(null);

  // Build lookup maps
  const weekPlanByWeekNumber = {};
  (weekPlans ?? []).forEach(wp => { weekPlanByWeekNumber[wp.weekNumber] = wp; });

  const topicsByPlanId = {};
  (weekTopics ?? []).forEach(topic => {
    if (!topicsByPlanId[topic.weekPlanId]) topicsByPlanId[topic.weekPlanId] = [];
    topicsByPlanId[topic.weekPlanId].push(topic);
  });

  async function handleWeekTypeChange(weekNum, value) {
    const existing = weekPlanByWeekNumber[weekNum];
    await upsertWeekPlan(numericSubjectId, weekNum, {
      weekType: value,
      status: existing?.status ?? 'planned',
    });
  }

  async function handleStatusChange(weekNum, value) {
    const existing = weekPlanByWeekNumber[weekNum];
    await upsertWeekPlan(numericSubjectId, weekNum, {
      weekType: existing?.weekType ?? 'teaching',
      status: value,
    });
  }

  async function handleAddTopic(weekNum, topicData) {
    const existing = weekPlanByWeekNumber[weekNum];
    let planId;
    if (existing) {
      planId = existing.id;
    } else {
      await upsertWeekPlan(numericSubjectId, weekNum, {
        weekType: 'teaching',
        status: 'planned',
      });
      const newPlan = await db.weekPlans
        .where('subjectId').equals(numericSubjectId)
        .filter(wp => wp.weekNumber === weekNum)
        .first();
      planId = newPlan?.id;
    }
    if (planId != null) {
      await addWeekTopic(planId, {
        ...topicData,
        indicatorIds: JSON.stringify(topicData.indicatorIds ?? []),
      });
    }
    setAddTopicForWeek(null);
  }

  async function handleRemoveTopic(topicId) {
    await removeWeekTopic(topicId);
    setExpandedTopicId(null);
  }

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

  // ── Curriculum lookup helpers ──────────────────────────────────────────────

  function getStrands() {
    if (!subject) return [];
    return (curriculumMap[subject.curriculumSubjectId] ?? {})[subject.curriculumClassId] ?? [];
  }

  function lookupTopicLabel(topic) {
    if (!topic.contentStandardId || !subject) return null;
    const strands = getStrands();
    for (const strand of strands) {
      for (const ss of strand.subStrands) {
        const cs = ss.contentStandards.find(c => c.id === topic.contentStandardId);
        if (cs) return cs.code;
      }
    }
    return topic.contentStandardId;
  }

  function lookupIndicatorCodes(topic) {
    if (!topic.indicatorIds || !subject) return [];
    let ids;
    try {
      ids = typeof topic.indicatorIds === 'string'
        ? JSON.parse(topic.indicatorIds)
        : topic.indicatorIds;
    } catch { ids = []; }
    if (!Array.isArray(ids) || ids.length === 0) return [];
    const strands = getStrands();
    const codes = [];
    for (const strand of strands) {
      for (const ss of strand.subStrands) {
        for (const cs of ss.contentStandards) {
          for (const ind of cs.indicators) {
            if (ids.includes(ind.id)) codes.push(ind.code);
          }
        }
      }
    }
    return codes;
  }

  function lookupTopicDetails(topic) {
    if (!topic.contentStandardId || !subject) return null;
    let indicatorIds;
    try {
      indicatorIds = typeof topic.indicatorIds === 'string'
        ? JSON.parse(topic.indicatorIds)
        : (topic.indicatorIds ?? []);
    } catch { indicatorIds = []; }

    const strands = getStrands();
    for (const strand of strands) {
      for (const ss of strand.subStrands) {
        const cs = ss.contentStandards.find(c => c.id === topic.contentStandardId);
        if (cs) {
          const resolvedIndicators = cs.indicators.filter(ind =>
            indicatorIds.includes(ind.id)
          );
          return { strand, subStrand: ss, contentStandard: cs, resolvedIndicators };
        }
      }
    }
    return null;
  }

  const selectClass = 'border border-line rounded-xl bg-paper px-2 py-1 text-sm text-ink focus:outline-none focus:border-accent';

  if (subject === undefined) {
    return <div className="pb-24 px-4 pt-6 text-ink-soft">Loading…</div>;
  }

  if (subject === null) {
    return (
      <div className="pb-24 px-4 pt-6">
        <p className="text-ink-soft">Subject not found.</p>
        <button onClick={() => navigate(`/planner/${termId}`)} className="mt-3 text-accent text-sm">
          ← Back
        </button>
      </div>
    );
  }

  return (
    <div className="pb-24">
      {/* Header */}
      <div className="px-4 pt-6 pb-4">
        <button
          onClick={() => navigate(`/planner/${termId}`)}
          className="flex items-center gap-1 text-sm text-ink-soft hover:text-ink mb-3"
        >
          <ArrowLeft size={16} />
          Back to Term
        </button>
        <h1 className="text-xl font-bold text-ink">{subject.name}</h1>
        <p className="text-sm text-ink-soft mt-0.5">Weekly lesson plan — {TOTAL_WEEKS} weeks</p>
      </div>

      {/* Week rows */}
      <div className="px-4 space-y-3">
        {Array.from({ length: TOTAL_WEEKS }, (_, i) => i + 1).map(weekNum => {
          const plan = weekPlanByWeekNumber[weekNum];
          const weekType = plan?.weekType ?? 'teaching';
          const status = plan?.status ?? 'planned';
          const topics = plan ? (topicsByPlanId[plan.id] ?? []) : [];

          return (
            <section
              key={weekNum}
              className="border border-line rounded-xl bg-card mb-3 p-4"
            >
              {/* Week header row */}
              <div className="flex items-center justify-between gap-2 flex-wrap mb-2">
                <span className="font-semibold text-ink shrink-0">Week {weekNum}</span>
                <div className="flex items-center gap-2 flex-wrap">
                  {/* Week type select */}
                  <select
                    value={weekType}
                    onChange={e => handleWeekTypeChange(weekNum, e.target.value)}
                    className={selectClass}
                    aria-label={`Week ${weekNum} type`}
                  >
                    {WEEK_TYPES.map(t => (
                      <option key={t.value} value={t.value}>{t.label}</option>
                    ))}
                  </select>

                  {/* Status select — only for teaching weeks */}
                  {weekType === 'teaching' && (
                    <select
                      value={status}
                      onChange={e => handleStatusChange(weekNum, e.target.value)}
                      className={selectClass}
                      aria-label={`Week ${weekNum} status`}
                    >
                      {STATUSES.map(s => (
                        <option key={s.value} value={s.value}>{s.label}</option>
                      ))}
                    </select>
                  )}
                </div>
              </div>

              {/* Topics list */}
              {topics.length > 0 && (
                <ul className="space-y-1 mb-3">
                  {topics.map(topic => {
                    const label = lookupTopicLabel(topic);
                    const indicatorCodes = lookupIndicatorCodes(topic);
                    const isExpanded = expandedTopicId === topic.id;
                    const details = isExpanded ? lookupTopicDetails(topic) : null;

                    return (
                      <li key={topic.id}>
                        {/* Summary row — clickable toggle */}
                        <button
                          onClick={() =>
                            setExpandedTopicId(id => id === topic.id ? null : topic.id)
                          }
                          className="flex items-center justify-between gap-2 w-full text-left text-sm py-1"
                        >
                          <span className="flex-1 min-w-0">
                            {label && (
                              <span className="font-mono text-xs font-bold text-accent mr-1">{label}</span>
                            )}
                            {indicatorCodes.length > 0 && (
                              <span className="text-xs text-ink-soft font-mono mr-1">
                                {indicatorCodes.join(', ')}
                              </span>
                            )}
                            {topic.notes && (
                              <span className="text-ink-soft">
                                {topic.notes.length > 60
                                  ? topic.notes.slice(0, 60) + '…'
                                  : topic.notes}
                              </span>
                            )}
                            {topic.resources && (
                              <span className="text-ink-soft ml-1">
                                {topic.resources.length > 60
                                  ? topic.resources.slice(0, 60) + '…'
                                  : topic.resources}
                              </span>
                            )}
                            {!label && !topic.notes && !topic.resources && (
                              <span className="text-ink-soft italic">No description</span>
                            )}
                          </span>
                          {isExpanded
                            ? <ChevronUp size={14} className="shrink-0 text-ink-soft" />
                            : <ChevronDown size={14} className="shrink-0 text-ink-soft" />
                          }
                        </button>

                        {/* Expanded detail panel */}
                        {isExpanded && (
                          <div className="bg-paper rounded-xl p-3 mt-2 space-y-2 text-sm">
                            {details ? (
                              <>
                                {/* Strand */}
                                <div>
                                  <p className="text-xs text-ink-soft uppercase tracking-wide">Strand</p>
                                  <p className="text-ink text-sm">{details.strand.title}</p>
                                </div>
                                {/* Sub-strand */}
                                <div>
                                  <p className="text-xs text-ink-soft uppercase tracking-wide">Sub-Strand</p>
                                  <p className="text-ink text-sm">
                                    <span className="font-mono text-xs text-accent mr-1">{details.subStrand.code}</span>
                                    {details.subStrand.title}
                                  </p>
                                </div>
                                {/* Content Standard */}
                                <div>
                                  <p className="text-xs text-ink-soft uppercase tracking-wide">Content Standard</p>
                                  <p className="text-ink text-sm">
                                    <span className="font-mono text-xs font-bold text-accent mr-1">{details.contentStandard.code}</span>
                                    {details.contentStandard.description}
                                  </p>
                                </div>
                                {/* Indicators */}
                                {details.resolvedIndicators.length > 0 && (
                                  <div>
                                    <p className="text-xs text-ink-soft uppercase tracking-wide mb-1">Indicators</p>
                                    <ul className="space-y-1">
                                      {details.resolvedIndicators.map(ind => (
                                        <li key={ind.id} className="flex gap-2">
                                          <span className="font-mono font-bold text-accent text-xs shrink-0">{ind.code}</span>
                                          <span className="text-ink-soft text-xs">{ind.description}</span>
                                        </li>
                                      ))}
                                    </ul>
                                  </div>
                                )}
                              </>
                            ) : null}

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
                              <button
                                onClick={() => setEditingTopic(topic)}
                                className="text-sm text-accent hover:text-accent/80 font-medium"
                              >
                                Edit
                              </button>
                              <button
                                onClick={() => handleRemoveTopic(topic.id)}
                                className="text-sm text-red-500 hover:text-red-600 font-medium"
                              >
                                Delete
                              </button>
                            </div>
                          </div>
                        )}
                      </li>
                    );
                  })}
                </ul>
              )}

              {/* Add topic button */}
              <button
                onClick={() => setAddTopicForWeek(weekNum)}
                className="flex items-center gap-1 text-sm text-accent hover:text-accent/80 font-medium"
              >
                <Plus size={15} />
                Add Topic
              </button>
            </section>
          );
        })}
      </div>

      {/* Add topic modal */}
      {addTopicForWeek !== null && (
        <AddTopicModal
          subjectName={subject.name}
          curriculumSubjectId={subject.curriculumSubjectId}
          curriculumClassId={subject.curriculumClassId}
          onAdd={(topicData) => handleAddTopic(addTopicForWeek, topicData)}
          onClose={() => setAddTopicForWeek(null)}
        />
      )}

      {/* Edit topic modal */}
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
    </div>
  );
}
