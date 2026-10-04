import { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useLiveQuery } from 'dexie-react-hooks';
import { ArrowLeft } from 'lucide-react';
import { db } from '../db/database';
import { upsertLessonNote } from '../db/planner';
import { curriculumMap } from '../data/curriculumData';

const STATUSES = ['draft', 'ready', 'delivered'];
const STATUS_LABELS = { draft: 'Draft', ready: 'Ready', delivered: 'Delivered' };
const STATUS_STYLES = {
  draft: 'bg-ink-soft/20 text-ink-soft',
  ready: 'bg-accent/10 text-accent',
  delivered: 'bg-green-100 text-green-700',
};

export default function PlannerLesson() {
  const { termId, subjectId, topicId } = useParams();
  const navigate = useNavigate();
  const numericTopicId = Number(topicId);

  // ── Data loading (chained useLiveQuery) ────────────────────────────────────
  const topic = useLiveQuery(() => db.weekTopics.get(numericTopicId), [numericTopicId]);
  const weekPlan = useLiveQuery(
    () => topic?.weekPlanId != null ? db.weekPlans.get(topic.weekPlanId) : undefined,
    [topic?.weekPlanId]
  );
  const subject = useLiveQuery(
    () => weekPlan?.subjectId != null ? db.subjects.get(weekPlan.subjectId) : undefined,
    [weekPlan?.subjectId]
  );
  const classGroup = useLiveQuery(
    () => subject?.classGroupId != null ? db.classGroups.get(subject.classGroupId) : undefined,
    [subject?.classGroupId]
  );
  const term = useLiveQuery(
    () => classGroup?.termId != null ? db.terms.get(classGroup.termId) : undefined,
    [classGroup?.termId]
  );
  const lessonNote = useLiveQuery(
    () => db.lessonNotes.where('topicId').equals(numericTopicId).first(),
    [numericTopicId]
  );

  // ── Form state ─────────────────────────────────────────────────────────────
  const [form, setForm] = useState({
    day: '',
    date: '',
    starter: '',
    mainLearning: '',
    plenary: '',
    resourceUrl: '',
    resourceType: 'none',
    evaluation: '',
    homework: '',
    status: 'draft',
  });
  const [saveState, setSaveState] = useState('idle'); // 'idle' | 'saving' | 'saved'
  const saveTimer = useRef(null);
  const initializedRef = useRef(false);

  // Initialise form from existing lessonNote once
  useEffect(() => {
    if (lessonNote && !initializedRef.current) {
      initializedRef.current = true;
      setForm({
        day: lessonNote.day ?? '',
        date: lessonNote.date ?? '',
        starter: lessonNote.starter ?? '',
        mainLearning: lessonNote.mainLearning ?? '',
        plenary: lessonNote.plenary ?? '',
        resourceUrl: lessonNote.resourceUrl ?? '',
        resourceType: lessonNote.resourceType ?? 'none',
        evaluation: lessonNote.evaluation ?? '',
        homework: lessonNote.homework ?? '',
        status: lessonNote.status ?? 'draft',
      });
    }
  }, [lessonNote]);

  // ── Save helpers ──────────────────────────────────────────────────────────
  const saveField = useCallback(async (overrides = {}) => {
    setSaveState('saving');
    const payload = { ...form, ...overrides };
    await upsertLessonNote(numericTopicId, {
      day: payload.day,
      date: payload.date,
      weekNumber: weekPlan?.weekNumber ?? null,
      starter: payload.starter,
      mainLearning: payload.mainLearning,
      plenary: payload.plenary,
      resourceUrl: payload.resourceUrl,
      resourceType: payload.resourceType === 'none' ? null : payload.resourceType,
      evaluation: payload.evaluation,
      homework: payload.homework,
      status: payload.status,
    });
    setSaveState('saved');
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => setSaveState('idle'), 2000);
  }, [form, numericTopicId, weekPlan?.weekNumber]);

  const handleBlur = useCallback(() => {
    saveField();
  }, [saveField]);

  const handleStatusCycle = useCallback(async () => {
    const currentIndex = STATUSES.indexOf(form.status);
    const nextStatus = STATUSES[(currentIndex + 1) % STATUSES.length];
    setForm(f => ({ ...f, status: nextStatus }));
    setSaveState('saving');
    await upsertLessonNote(numericTopicId, {
      day: form.day,
      date: form.date,
      weekNumber: weekPlan?.weekNumber ?? null,
      starter: form.starter,
      mainLearning: form.mainLearning,
      plenary: form.plenary,
      resourceUrl: form.resourceUrl,
      resourceType: form.resourceType === 'none' ? null : form.resourceType,
      evaluation: form.evaluation,
      homework: form.homework,
      status: nextStatus,
    });
    setSaveState('saved');
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => setSaveState('idle'), 2000);
  }, [form, numericTopicId, weekPlan?.weekNumber]);

  // ── Curriculum lookup ─────────────────────────────────────────────────────
  function getStrands() {
    if (!subject) return [];
    return (curriculumMap[subject.curriculumSubjectId] ?? {})[subject.curriculumClassId] ?? [];
  }

  function lookupTopicDetails() {
    if (!topic?.contentStandardId || !subject) return null;
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
          const resolvedIndicators = cs.indicators.filter(ind => indicatorIds.includes(ind.id));
          return { strand, subStrand: ss, contentStandard: cs, resolvedIndicators };
        }
      }
    }
    return null;
  }

  const currDetails = lookupTopicDetails();

  // ── Loading / not found ───────────────────────────────────────────────────
  if (topic === undefined || weekPlan === undefined || subject === undefined || classGroup === undefined || term === undefined) {
    return <div className="pb-24 px-4 pt-6 text-ink-soft">Loading…</div>;
  }
  if (topic === null) {
    return (
      <div className="pb-24 px-4 pt-6">
        <p className="text-ink-soft">Topic not found.</p>
        <button onClick={() => navigate(`/planner/${termId}/${subjectId}`)} className="mt-3 text-accent text-sm">← Back</button>
      </div>
    );
  }

  const textareaClass = 'w-full border border-line rounded-xl bg-paper px-3 py-2 text-sm text-ink focus:outline-none focus:border-accent resize-none';
  const sectionLabelClass = 'text-xs font-semibold text-ink-soft uppercase tracking-wide';
  const cardClass = 'border border-line rounded-xl bg-card p-5 space-y-2';

  return (
    <div className="pb-24">
      {/* Header */}
      <div className="px-4 pt-6 pb-2">
        <button
          onClick={() => navigate(`/planner/${termId}/${subjectId}`)}
          className="flex items-center gap-1 text-sm text-ink-soft hover:text-ink mb-3"
        >
          <ArrowLeft size={16} />
          Back
        </button>

        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-xs text-ink-soft mb-0.5">
              {term?.name ?? '—'} → {subject?.name ?? '—'} → Week {weekPlan?.weekNumber ?? '—'}
            </p>
            <h1 className="text-xl font-bold text-ink">Lesson Plan</h1>
          </div>
          {/* Status badge */}
          <button
            onClick={handleStatusCycle}
            className={`shrink-0 mt-1 px-3 py-1 rounded-full text-xs font-semibold transition ${STATUS_STYLES[form.status]}`}
          >
            {STATUS_LABELS[form.status]}
          </button>
        </div>

        {/* Auto-save indicator */}
        <p className="text-xs text-ink-soft mt-1 h-4">
          {saveState === 'saving' && 'Saving…'}
          {saveState === 'saved' && 'Saved'}
        </p>
      </div>

      {/* Context strip */}
      <div className="px-4 pb-3">
        <div className="flex items-center gap-2 overflow-x-auto pb-1">
          {/* Day — editable */}
          <label className="shrink-0 flex items-center gap-1 rounded-full bg-paper border border-line px-3 py-1 text-xs">
            <span className="text-ink-soft">Day:</span>
            <input
              type="text"
              value={form.day}
              onChange={e => setForm(f => ({ ...f, day: e.target.value }))}
              onBlur={handleBlur}
              placeholder="Mon"
              className="w-12 bg-transparent text-ink text-xs focus:outline-none"
              aria-label="Day"
            />
          </label>
          {/* Date — editable */}
          <label className="shrink-0 flex items-center gap-1 rounded-full bg-paper border border-line px-3 py-1 text-xs">
            <span className="text-ink-soft">Date:</span>
            <input
              type="date"
              value={form.date}
              onChange={e => setForm(f => ({ ...f, date: e.target.value }))}
              onBlur={handleBlur}
              className="bg-transparent text-ink text-xs focus:outline-none"
              aria-label="Date"
            />
          </label>
          {/* Week — read-only */}
          <span className="shrink-0 rounded-full bg-paper border border-line px-3 py-1 text-xs text-ink">
            Week {weekPlan?.weekNumber ?? '—'}
          </span>
          {/* Subject — read-only */}
          <span className="shrink-0 rounded-full bg-paper border border-line px-3 py-1 text-xs text-ink">
            {subject?.name ?? '—'}
          </span>
          {/* Class level — read-only */}
          <span className="shrink-0 rounded-full bg-paper border border-line px-3 py-1 text-xs text-ink">
            {classGroup?.classLevel ?? '—'}
          </span>
        </div>
      </div>

      <div className="px-4 space-y-4">
        {/* Starter */}
        <div className={cardClass}>
          <p className={sectionLabelClass}>Starter Activity</p>
          <textarea
            rows={3}
            value={form.starter}
            onChange={e => setForm(f => ({ ...f, starter: e.target.value }))}
            onBlur={handleBlur}
            placeholder="How will you hook learners at the start?"
            className={textareaClass}
          />
        </div>

        {/* New Learning / Main */}
        <div className={cardClass}>
          <p className={sectionLabelClass}>New Learning / Main Activity</p>
          <textarea
            rows={5}
            value={form.mainLearning}
            onChange={e => setForm(f => ({ ...f, mainLearning: e.target.value }))}
            onBlur={handleBlur}
            placeholder="What new concept or skill will you teach? How?"
            className={textareaClass}
          />
        </div>

        {/* Plenary */}
        <div className={cardClass}>
          <p className={sectionLabelClass}>Plenary</p>
          <textarea
            rows={3}
            value={form.plenary}
            onChange={e => setForm(f => ({ ...f, plenary: e.target.value }))}
            onBlur={handleBlur}
            placeholder="How will you consolidate and summarise learning?"
            className={textareaClass}
          />
        </div>

        {/* Resource */}
        <div className={cardClass}>
          <p className={sectionLabelClass}>Resource</p>
          <textarea
            rows={2}
            value={form.resourceUrl}
            onChange={e => setForm(f => ({ ...f, resourceUrl: e.target.value }))}
            onBlur={handleBlur}
            placeholder="URL, textbook reference, or description of material"
            className={textareaClass}
          />
          {/* Resource type radio */}
          <div className="flex items-center gap-4 flex-wrap pt-1">
            {['image', 'video', 'link', 'none'].map(type => (
              <label key={type} className="flex items-center gap-1 text-xs text-ink-soft cursor-pointer">
                <input
                  type="radio"
                  name="resourceType"
                  value={type}
                  checked={form.resourceType === type}
                  onChange={e => {
                    const newType = e.target.value;
                    setForm(f => ({ ...f, resourceType: newType }));
                    // Save immediately on radio change
                    upsertLessonNote(numericTopicId, {
                      day: form.day,
                      date: form.date,
                      weekNumber: weekPlan?.weekNumber ?? null,
                      starter: form.starter,
                      mainLearning: form.mainLearning,
                      plenary: form.plenary,
                      resourceUrl: form.resourceUrl,
                      resourceType: newType === 'none' ? null : newType,
                      evaluation: form.evaluation,
                      homework: form.homework,
                      status: form.status,
                    }).then(() => {
                      setSaveState('saved');
                      if (saveTimer.current) clearTimeout(saveTimer.current);
                      saveTimer.current = setTimeout(() => setSaveState('idle'), 2000);
                    });
                  }}
                  className="accent-accent"
                />
                <span className="capitalize">{type}</span>
              </label>
            ))}
          </div>
        </div>

        {/* Evaluation */}
        <div className={cardClass}>
          <p className={sectionLabelClass}>Evaluation &amp; Assessment</p>
          <textarea
            rows={3}
            value={form.evaluation}
            onChange={e => setForm(f => ({ ...f, evaluation: e.target.value }))}
            onBlur={handleBlur}
            placeholder="How will you assess understanding?"
            className={textareaClass}
          />
        </div>

        {/* Homework */}
        <div className={cardClass}>
          <p className={sectionLabelClass}>Homework</p>
          <textarea
            rows={3}
            value={form.homework}
            onChange={e => setForm(f => ({ ...f, homework: e.target.value }))}
            onBlur={handleBlur}
            placeholder="What task will learners take home?"
            className={textareaClass}
          />
        </div>

        {/* Curriculum reference — read-only */}
        {currDetails && (
          <div className="border border-line rounded-xl bg-card p-4 space-y-3">
            <p className="text-xs font-semibold text-ink-soft uppercase tracking-wide">Curriculum Reference</p>
            {/* Strand */}
            <div>
              <p className="text-xs text-ink-soft uppercase tracking-wide">Strand</p>
              <p className="text-ink text-sm">{currDetails.strand.title}</p>
            </div>
            {/* Sub-strand */}
            <div>
              <p className="text-xs text-ink-soft uppercase tracking-wide">Sub-Strand</p>
              <p className="text-ink text-sm">
                <span className="font-mono text-xs text-accent mr-1">{currDetails.subStrand.code}</span>
                {currDetails.subStrand.title}
              </p>
            </div>
            {/* Content Standard */}
            <div>
              <p className="text-xs text-ink-soft uppercase tracking-wide">Content Standard</p>
              <p className="text-ink text-sm">
                <span className="font-mono text-xs font-bold text-accent mr-1">{currDetails.contentStandard.code}</span>
                {currDetails.contentStandard.description}
              </p>
            </div>
            {/* Indicators */}
            {currDetails.resolvedIndicators.length > 0 && (
              <div>
                <p className="text-xs text-ink-soft uppercase tracking-wide mb-1">Indicators</p>
                <ul className="space-y-1">
                  {currDetails.resolvedIndicators.map(ind => (
                    <li key={ind.id} className="flex gap-2">
                      <span className="font-mono font-bold text-accent text-xs shrink-0">{ind.code}</span>
                      <span className="text-ink-soft text-xs">{ind.description}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
