import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useLiveQuery } from 'dexie-react-hooks';
import { ArrowLeft, Plus, X } from 'lucide-react';
import { db } from '../db/database';
import { upsertWeekPlan, addWeekTopic, removeWeekTopic } from '../db/planner';
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

  // Modal state
  const [addTopicForWeek, setAddTopicForWeek] = useState(null); // weekNumber

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
      // upsertWeekPlan returns the id (new) or updated count for existing
      // For a new plan we need to get the id after creation
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
      await addWeekTopic(planId, topicData);
    }
    setAddTopicForWeek(null);
  }

  async function handleRemoveTopic(topicId) {
    await removeWeekTopic(topicId);
  }

  function lookupTopicLabel(topic) {
    if (!topic.contentStandardId || !subject) return null;
    const strands = (curriculumMap[subject.curriculumSubjectId] ?? {})[subject.curriculumClassId] ?? [];
    for (const strand of strands) {
      for (const ss of strand.subStrands) {
        const cs = ss.contentStandards.find(c => c.id === topic.contentStandardId);
        if (cs) return cs.code;
      }
    }
    return topic.contentStandardId;
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
                    return (
                      <li key={topic.id} className="flex items-start gap-2 text-sm">
                        <span className="flex-1 text-ink">
                          {label && (
                            <span className="font-mono text-xs font-bold text-accent mr-1">{label}</span>
                          )}
                          {topic.notes ? (
                            <span className="text-ink-soft">{topic.notes}</span>
                          ) : null}
                          {!label && !topic.notes && (
                            <span className="text-ink-soft italic">No description</span>
                          )}
                        </span>
                        <button
                          onClick={() => handleRemoveTopic(topic.id)}
                          className="shrink-0 text-ink-soft hover:text-red-500 p-0.5 rounded"
                          aria-label="Remove topic"
                        >
                          <X size={14} />
                        </button>
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
    </div>
  );
}
