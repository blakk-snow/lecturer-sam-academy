import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useLiveQuery } from 'dexie-react-hooks';
import { ArrowLeft, ChevronLeft, ChevronRight, Sparkles, Loader2 } from 'lucide-react';
import { db } from '../db/database';
import { upsertLessonNote } from '../db/planner';
import { generateLessonPlan, generateAssessment } from '../services/ai';

// curriculumData is loaded lazily — it's ~600 KB and only needed on this page.
const curriculumDataPromise = import('../data/curriculumData');

// ── Constants ──────────────────────────────────────────────────────────────────

const STATUSES = ['draft', 'ready', 'delivered'];
const STATUS_LABELS = { draft: 'Draft', ready: 'Ready', delivered: 'Delivered' };
const STATUS_STYLES = {
  draft: 'bg-ink-soft/20 text-ink-soft',
  ready: 'bg-accent/10 text-accent',
  delivered: 'bg-green-100 text-green-700',
};

// Step definitions — step 0 is the curriculum overview (read-only)
const STEPS = [
  { key: 'overview',     label: 'Overview',     icon: '📋' },
  { key: 'starter',      label: 'Starter',      icon: '🔥' },
  { key: 'mainLearning', label: 'Main',         icon: '📚' },
  { key: 'plenary',      label: 'Plenary',      icon: '💡' },
  { key: 'resource',     label: 'Resource',     icon: '🎬' },
  { key: 'evaluation',   label: 'Evaluation',   icon: '✅' },
  { key: 'homework',     label: 'Homework',     icon: '🏠' },
];

// ── AI Generate Button ─────────────────────────────────────────────────────────

function AIButton({ label, loading, disabled, onClick, tooltip }) {
  return (
    <div className="relative group">
      <button
        type="button"
        onClick={onClick}
        disabled={disabled || loading}
        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium border transition-colors ${
          disabled
            ? 'border-line text-ink-soft/40 bg-paper cursor-not-allowed'
            : loading
            ? 'border-accent/30 text-accent bg-accent/5 cursor-wait'
            : 'border-accent/40 text-accent bg-accent/5 hover:bg-accent/10 hover:border-accent'
        }`}
      >
        {loading
          ? <Loader2 size={13} className="animate-spin shrink-0" />
          : <Sparkles size={13} className="shrink-0" />
        }
        {loading ? 'Generating…' : label}
      </button>
      {disabled && tooltip && (
        <div className="absolute bottom-full left-0 mb-1.5 w-52 rounded-lg bg-ink text-white text-xs px-2.5 py-1.5 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity z-10 leading-snug">
          {tooltip}
        </div>
      )}
    </div>
  );
}

// ── AI Error Toast ─────────────────────────────────────────────────────────────

function AIError({ message, onDismiss }) {
  if (!message) return null;
  return (
    <div className="rounded-xl bg-red-50 border border-red-200 px-3 py-2 text-xs text-red-700 flex items-start gap-2">
      <span className="flex-1">{message}</span>
      <button onClick={onDismiss} className="shrink-0 text-red-400 hover:text-red-600 mt-0.5">✕</button>
    </div>
  );
}

// ── Component ──────────────────────────────────────────────────────────────────

export default function PlannerLesson() {
  const { termId, subjectId, topicId } = useParams();
  const navigate = useNavigate();
  const numericTopicId = Number(topicId);

  // ── Data loading ────────────────────────────────────────────────────────────
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

  // ── Lazy curriculum data ─────────────────────────────────────────────────────
  const [curriculumMap, setCurriculumMap] = useState(null);
  useEffect(() => {
    curriculumDataPromise.then(mod => setCurriculumMap(mod.curriculumMap));
  }, []);

  // ── Stepper state ───────────────────────────────────────────────────────────
  const [step, setStep] = useState(0);

  // ── Form state ──────────────────────────────────────────────────────────────
  const [form, setForm] = useState({
    day: '', date: '',
    starter: '', mainLearning: '', plenary: '',
    resourceUrl: '', resourceType: 'none',
    evaluation: '', homework: '',
    status: 'draft',
  });
  const [saveState, setSaveState] = useState('idle');
  const saveTimer = useRef(null);
  const initializedRef = useRef(false);

  // ── AI state ────────────────────────────────────────────────────────────────
  // keyed by step key: { loading: bool, error: string|null }
  const [aiState, setAiState] = useState({});

  function setAiLoading(stepKey, loading) {
    setAiState(prev => ({ ...prev, [stepKey]: { ...prev[stepKey], loading, error: loading ? null : prev[stepKey]?.error } }));
  }
  function setAiError(stepKey, error) {
    setAiState(prev => ({ ...prev, [stepKey]: { loading: false, error } }));
  }
  function clearAiError(stepKey) {
    setAiState(prev => ({ ...prev, [stepKey]: { ...prev[stepKey], error: null } }));
  }

  useEffect(() => {
    if (lessonNote && !initializedRef.current) {
      initializedRef.current = true;
      setForm({
        day:          lessonNote.day          ?? '',
        date:         lessonNote.date         ?? '',
        starter:      lessonNote.starter      ?? '',
        mainLearning: lessonNote.mainLearning ?? '',
        plenary:      lessonNote.plenary      ?? '',
        resourceUrl:  lessonNote.resourceUrl  ?? '',
        resourceType: lessonNote.resourceType ?? 'none',
        evaluation:   lessonNote.evaluation   ?? '',
        homework:     lessonNote.homework     ?? '',
        status:       lessonNote.status       ?? 'draft',
      });
    }
  }, [lessonNote]);

  // ── Save ────────────────────────────────────────────────────────────────────
  const buildPayload = useCallback((overrides = {}) => {
    const f = { ...form, ...overrides };
    return {
      day: f.day, date: f.date,
      weekNumber: weekPlan?.weekNumber ?? null,
      starter: f.starter, mainLearning: f.mainLearning, plenary: f.plenary,
      resourceUrl: f.resourceUrl,
      resourceType: f.resourceType === 'none' ? null : f.resourceType,
      evaluation: f.evaluation, homework: f.homework,
      status: f.status,
    };
  }, [form, weekPlan?.weekNumber]);

  const save = useCallback(async (overrides = {}) => {
    setSaveState('saving');
    await upsertLessonNote(numericTopicId, buildPayload(overrides));
    setSaveState('saved');
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => setSaveState('idle'), 2000);
  }, [buildPayload, numericTopicId]);

  const handleBlur  = useCallback(() => save(), [save]);

  const handleStatusCycle = useCallback(async () => {
    const next = STATUSES[(STATUSES.indexOf(form.status) + 1) % STATUSES.length];
    setForm(f => ({ ...f, status: next }));
    await save({ status: next });
  }, [form.status, save]);

  const handleRadioChange = useCallback(async (newType) => {
    setForm(f => ({ ...f, resourceType: newType }));
    await save({ resourceType: newType });
  }, [save]);

  // ── AI generation ───────────────────────────────────────────────────────────

  /**
   * Build AI params from currDetails (if available) plus fallback subject info.
   */
  const buildAiParams = useCallback(() => {
    if (!currDetails) return null;
    return {
      level:           classGroup?.classLevel ?? '',
      subject:         subject?.name ?? '',
      strand:          currDetails.strand.title,
      subStrand:       currDetails.subStrand.title,
      contentStandard: `${currDetails.contentStandard.code} — ${currDetails.contentStandard.description}`,
      indicator:       currDetails.resolvedIndicators.length > 0
        ? currDetails.resolvedIndicators.map(i => `${i.code} — ${i.description}`).join('; ')
        : currDetails.contentStandard.description,
    };
  }, [currDetails, classGroup?.classLevel, subject?.name]);

  /**
   * Extract a named section from a full lesson plan response.
   * Falls back to the whole text if the section isn't found.
   */
  function extractSection(text, sectionName) {
    const aliases = {
      starter:      ['STARTER ACTIVITY', 'STARTER'],
      mainLearning: ['MAIN LEARNING', 'MAIN ACTIVITY', 'MAIN TEACHING'],
      plenary:      ['PLENARY'],
      evaluation:   ['EVALUATION', 'ASSESSMENT', 'FORMATIVE ASSESSMENT'],
      homework:     ['HOMEWORK', 'TAKE-HOME', 'HOME ACTIVITY'],
    };
    const keys = aliases[sectionName] || [sectionName.toUpperCase()];
    for (const key of keys) {
      // Match **KEY** or KEY: at start of a line, capture until next ** section or end
      const re = new RegExp(`\\*\\*${key}[^*]*\\*\\*[:\\s]*([\\s\\S]*?)(?=\\n\\*\\*[A-Z]|$)`, 'i');
      const m = text.match(re);
      if (m) return m[1].trim();
    }
    return text; // fallback: whole text
  }

  const handleAIGenerate = useCallback(async (stepKey) => {
    const params = buildAiParams();
    if (!params) return;

    setAiLoading(stepKey, true);
    try {
      if (stepKey === 'evaluation') {
        // Use dedicated assessment generator
        const text = await generateAssessment(params);
        setForm(f => ({ ...f, evaluation: text }));
        await save({ evaluation: text });
      } else {
        // Generate full lesson plan and extract the relevant section
        const fullPlan = await generateLessonPlan(params);
        const section = extractSection(fullPlan, stepKey);
        setForm(f => ({ ...f, [stepKey]: section }));
        await save({ [stepKey]: section });
      }
      setAiLoading(stepKey, false);
    } catch (err) {
      setAiError(stepKey, err.message || 'AI generation failed. Please try again.');
    }
  }, [buildAiParams, save]);

  // Save when leaving a step
  const goTo = useCallback((next) => {
    save();
    setStep(next);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [save]);

  // ── Curriculum lookup ───────────────────────────────────────────────────────
  const currDetails = useMemo(() => {
    if (!curriculumMap || !topic?.contentStandardId || !subject) return null;
    let indicatorIds;
    try {
      indicatorIds = typeof topic.indicatorIds === 'string'
        ? JSON.parse(topic.indicatorIds)
        : (topic.indicatorIds ?? []);
    } catch { indicatorIds = []; }
    const strands = (curriculumMap[subject.curriculumSubjectId] ?? {})[subject.curriculumClassId] ?? [];
    for (const strand of strands) {
      for (const ss of strand.subStrands) {
        const cs = ss.contentStandards.find(c => c.id === topic.contentStandardId);
        if (cs) {
          return { strand, subStrand: ss, contentStandard: cs,
            resolvedIndicators: cs.indicators.filter(i => indicatorIds.includes(i.id)) };
        }
      }
    }
    return null;
  }, [curriculumMap, topic, subject]);

  // ── Guards ──────────────────────────────────────────────────────────────────
  if ([topic, weekPlan, subject, classGroup, term].some(v => v === undefined)) {
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

  // ── Shared classes ──────────────────────────────────────────────────────────
  const textareaClass = 'w-full border border-line rounded-xl bg-paper px-4 py-3 text-sm text-ink focus:outline-none focus:border-accent resize-none leading-relaxed';
  const labelClass    = 'text-xs font-semibold text-ink-soft uppercase tracking-widest mb-2 block';

  const totalSteps = STEPS.length;

  // ── Slide content ──────────────────────────────────────────────────────────
  function renderSlide() {
    const current = STEPS[step];

    // Step 0 — Curriculum overview
    if (current.key === 'overview') {
      return (
        <div className="space-y-4">
          {/* Context row */}
          <div className="flex flex-wrap gap-2">
            {[
              subject?.name,
              classGroup?.classLevel,
              `Week ${weekPlan?.weekNumber ?? '—'}`,
              term?.name,
            ].filter(Boolean).map(label => (
              <span key={label} className="rounded-full bg-paper border border-line px-3 py-1 text-xs text-ink">
                {label}
              </span>
            ))}
          </div>

          {/* Day + Date editable pills */}
          <div className="flex gap-2 flex-wrap">
            <label className="flex items-center gap-1 rounded-full bg-paper border border-line px-3 py-1 text-xs">
              <span className="text-ink-soft">Day</span>
              <input
                type="text"
                value={form.day}
                onChange={e => setForm(f => ({ ...f, day: e.target.value }))}
                onBlur={handleBlur}
                placeholder="Mon"
                className="w-12 bg-transparent text-ink text-xs focus:outline-none"
              />
            </label>
            <label className="flex items-center gap-1 rounded-full bg-paper border border-line px-3 py-1 text-xs">
              <span className="text-ink-soft">Date</span>
              <input
                type="date"
                value={form.date}
                onChange={e => setForm(f => ({ ...f, date: e.target.value }))}
                onBlur={handleBlur}
                className="bg-transparent text-ink text-xs focus:outline-none"
              />
            </label>
          </div>

          {/* Curriculum reference */}
          {currDetails ? (
            <div className="border border-accent/30 rounded-xl bg-accent/5 p-4 space-y-4">
              <p className="text-xs font-semibold text-accent uppercase tracking-widest">Curriculum Reference</p>

              <div className="grid sm:grid-cols-2 gap-3">
                <div>
                  <p className="text-xs text-ink-soft uppercase tracking-wide mb-0.5">Strand</p>
                  <p className="text-sm font-medium text-ink">{currDetails.strand.title}</p>
                </div>
                <div>
                  <p className="text-xs text-ink-soft uppercase tracking-wide mb-0.5">Sub-Strand</p>
                  <p className="text-sm text-ink">
                    <span className="font-mono text-xs text-accent mr-1">{currDetails.subStrand.code}</span>
                    {currDetails.subStrand.title}
                  </p>
                </div>
              </div>

              <div>
                <p className="text-xs text-ink-soft uppercase tracking-wide mb-0.5">Content Standard</p>
                <p className="text-sm text-ink">
                  <span className="font-mono text-xs font-bold text-accent mr-1">{currDetails.contentStandard.code}</span>
                  {currDetails.contentStandard.description}
                </p>
              </div>

              {currDetails.resolvedIndicators.length > 0 && (
                <div>
                  <p className="text-xs text-ink-soft uppercase tracking-wide mb-1.5">Indicators</p>
                  <ul className="space-y-2">
                    {currDetails.resolvedIndicators.map(ind => (
                      <li key={ind.id} className="flex gap-2 items-start">
                        <span className="font-mono font-bold text-accent text-xs shrink-0 mt-0.5">{ind.code}</span>
                        <span className="text-ink text-xs leading-relaxed">{ind.description}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          ) : (
            <div className="border border-line rounded-xl bg-paper p-4 text-sm text-ink-soft">
              No curriculum link — this subject was added without linking to the NaCCA curriculum.
            </div>
          )}
        </div>
      );
    }

    // Step 1 — Starter
    if (current.key === 'starter') {
      return (
        <div className="space-y-3">
          <p className="text-sm text-ink-soft leading-relaxed">
            How will you engage learners at the start of the lesson? Think of a hook, puzzle, question, or quick activity that activates prior knowledge.
          </p>
          <div className="flex items-center gap-2">
            <AIButton
              label="Generate Starter"
              loading={aiState.starter?.loading}
              disabled={!currDetails}
              tooltip="Link this topic to a curriculum indicator first"
              onClick={() => handleAIGenerate('starter')}
            />
          </div>
          <AIError message={aiState.starter?.error} onDismiss={() => clearAiError('starter')} />
          <textarea
            rows={8}
            value={form.starter}
            onChange={e => setForm(f => ({ ...f, starter: e.target.value }))}
            onBlur={handleBlur}
            placeholder="Describe your starter activity…"
            className={textareaClass}
            autoFocus
          />
        </div>
      );
    }

    // Step 2 — Main
    if (current.key === 'mainLearning') {
      return (
        <div className="space-y-3">
          <p className="text-sm text-ink-soft leading-relaxed">
            What new concept or skill will you introduce? Describe your teaching approach, key questions, and how learners will engage with the content.
          </p>
          <div className="flex items-center gap-2">
            <AIButton
              label="Generate Main Activity"
              loading={aiState.mainLearning?.loading}
              disabled={!currDetails}
              tooltip="Link this topic to a curriculum indicator first"
              onClick={() => handleAIGenerate('mainLearning')}
            />
          </div>
          <AIError message={aiState.mainLearning?.error} onDismiss={() => clearAiError('mainLearning')} />
          <textarea
            rows={10}
            value={form.mainLearning}
            onChange={e => setForm(f => ({ ...f, mainLearning: e.target.value }))}
            onBlur={handleBlur}
            placeholder="Describe the main teaching and learning activity…"
            className={textareaClass}
            autoFocus
          />
        </div>
      );
    }

    // Step 3 — Plenary
    if (current.key === 'plenary') {
      return (
        <div className="space-y-3">
          <p className="text-sm text-ink-soft leading-relaxed">
            How will you bring the lesson to a close? Summarise key learning, check for understanding, and connect to what comes next.
          </p>
          <div className="flex items-center gap-2">
            <AIButton
              label="Generate Plenary"
              loading={aiState.plenary?.loading}
              disabled={!currDetails}
              tooltip="Link this topic to a curriculum indicator first"
              onClick={() => handleAIGenerate('plenary')}
            />
          </div>
          <AIError message={aiState.plenary?.error} onDismiss={() => clearAiError('plenary')} />
          <textarea
            rows={8}
            value={form.plenary}
            onChange={e => setForm(f => ({ ...f, plenary: e.target.value }))}
            onBlur={handleBlur}
            placeholder="Describe your plenary / closing activity…"
            className={textareaClass}
            autoFocus
          />
        </div>
      );
    }

    // Step 4 — Resource
    if (current.key === 'resource') {
      return (
        <div className="space-y-4">
          <p className="text-sm text-ink-soft leading-relaxed">
            Add a URL, textbook reference, or description of any materials, images, or videos you will use.
          </p>
          <div>
            <span className={labelClass}>Resource Reference</span>
            <textarea
              rows={4}
              value={form.resourceUrl}
              onChange={e => setForm(f => ({ ...f, resourceUrl: e.target.value }))}
              onBlur={handleBlur}
              placeholder="Paste a URL or describe the resource…"
              className={textareaClass}
              autoFocus
            />
          </div>
          <div>
            <span className={labelClass}>Resource Type</span>
            <div className="flex gap-3 flex-wrap">
              {['image', 'video', 'link', 'none'].map(type => (
                <label
                  key={type}
                  className={`flex items-center gap-2 px-4 py-2 rounded-xl border cursor-pointer text-sm transition-colors ${
                    form.resourceType === type
                      ? 'border-accent bg-accent/10 text-accent font-medium'
                      : 'border-line bg-paper text-ink-soft hover:text-ink'
                  }`}
                >
                  <input
                    type="radio"
                    name="resourceType"
                    value={type}
                    checked={form.resourceType === type}
                    onChange={() => handleRadioChange(type)}
                    className="sr-only"
                  />
                  <span className="capitalize">{type === 'none' ? 'None' : type}</span>
                </label>
              ))}
            </div>
          </div>
        </div>
      );
    }

    // Step 5 — Evaluation
    if (current.key === 'evaluation') {
      return (
        <div className="space-y-3">
          <p className="text-sm text-ink-soft leading-relaxed">
            How will you know learners have understood? Describe any formative assessment strategies, questions you will ask, or activities you will use to gauge understanding.
          </p>
          <div className="flex items-center gap-2">
            <AIButton
              label="Generate Assessment"
              loading={aiState.evaluation?.loading}
              disabled={!currDetails}
              tooltip="Link this topic to a curriculum indicator first"
              onClick={() => handleAIGenerate('evaluation')}
            />
          </div>
          <AIError message={aiState.evaluation?.error} onDismiss={() => clearAiError('evaluation')} />
          <textarea
            rows={8}
            value={form.evaluation}
            onChange={e => setForm(f => ({ ...f, evaluation: e.target.value }))}
            onBlur={handleBlur}
            placeholder="Describe your evaluation / assessment approach…"
            className={textareaClass}
            autoFocus
          />
        </div>
      );
    }

    // Step 6 — Homework
    if (current.key === 'homework') {
      return (
        <div className="space-y-3">
          <p className="text-sm text-ink-soft leading-relaxed">
            What task will learners take home to practise or extend their learning?
          </p>
          <div className="flex items-center gap-2">
            <AIButton
              label="Generate Homework"
              loading={aiState.homework?.loading}
              disabled={!currDetails}
              tooltip="Link this topic to a curriculum indicator first"
              onClick={() => handleAIGenerate('homework')}
            />
          </div>
          <AIError message={aiState.homework?.error} onDismiss={() => clearAiError('homework')} />
          <textarea
            rows={8}
            value={form.homework}
            onChange={e => setForm(f => ({ ...f, homework: e.target.value }))}
            onBlur={handleBlur}
            placeholder="Describe the homework task…"
            className={textareaClass}
            autoFocus
          />
        </div>
      );
    }

    return null;
  }

  const currentStep = STEPS[step];
  const isFirst = step === 0;
  const isLast  = step === totalSteps - 1;

  return (
    <div className="pb-24 flex flex-col min-h-dvh">

      {/* ── Fixed top bar ─────────────────────────────────────────────────── */}
      <div className="sticky top-0 z-10 bg-card border-b border-line px-4 pt-4 pb-3 md:px-6">
        {/* Back + breadcrumb row */}
        <div className="flex items-center justify-between mb-3">
          <button
            onClick={() => navigate(`/planner/${termId}/${subjectId}`)}
            className="flex items-center gap-1 text-sm text-ink-soft hover:text-ink"
          >
            <ArrowLeft size={16} />
            Back
          </button>
          {/* Status badge */}
          <button
            onClick={handleStatusCycle}
            className={`px-3 py-1 rounded-full text-xs font-semibold transition ${STATUS_STYLES[form.status]}`}
          >
            {STATUS_LABELS[form.status]}
          </button>
        </div>

        {/* Progress bar */}
        <div className="flex items-center gap-1 mb-2">
          {STEPS.map((s, i) => (
            <button
              key={s.key}
              onClick={() => goTo(i)}
              aria-label={s.label}
              className={`h-1.5 flex-1 rounded-full transition-all ${
                i === step
                  ? 'bg-accent'
                  : i < step
                  ? 'bg-accent/40'
                  : 'bg-line'
              }`}
            />
          ))}
        </div>

        {/* Step label */}
        <div className="flex items-center justify-between">
          <p className="text-xs text-ink-soft">
            Step {step + 1} of {totalSteps}
          </p>
          <p className="text-xs text-ink-soft">
            {saveState === 'saving' && 'Saving…'}
            {saveState === 'saved'  && 'Saved ✓'}
          </p>
        </div>
      </div>

      {/* ── Slide ─────────────────────────────────────────────────────────── */}
      <div className="flex-1 px-4 pt-6 pb-4 md:px-6">
        {/* Step heading */}
        <div className="mb-5">
          <span className="text-2xl mb-1 block">{currentStep.icon}</span>
          <h1 className="text-2xl font-bold text-ink font-serif">{currentStep.label}</h1>
        </div>

        {/* Slide content */}
        {renderSlide()}
      </div>

      {/* ── Navigation bar ─────────────────────────────────────────────────── */}
      <div className="sticky bottom-16 md:bottom-0 bg-card border-t border-line px-4 py-3 md:px-6">
        <div className="flex items-center justify-between gap-3 max-w-5xl mx-auto">
          <button
            onClick={() => goTo(step - 1)}
            disabled={isFirst}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-xl border text-sm font-medium transition ${
              isFirst
                ? 'border-line text-ink-soft/40 cursor-not-allowed'
                : 'border-line text-ink hover:bg-paper'
            }`}
          >
            <ChevronLeft size={16} />
            {step === 1 ? 'Overview' : 'Previous'}
          </button>

          {/* Step dots */}
          <div className="flex gap-1.5">
            {STEPS.map((_, i) => (
              <button
                key={i}
                onClick={() => goTo(i)}
                className={`rounded-full transition-all ${
                  i === step ? 'w-5 h-2 bg-accent' : 'w-2 h-2 bg-line hover:bg-accent/40'
                }`}
                aria-label={`Go to step ${i + 1}`}
              />
            ))}
          </div>

          <button
            onClick={() => isLast ? save() : goTo(step + 1)}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-medium transition ${
              isLast
                ? 'bg-green-600 text-white hover:bg-green-700'
                : 'bg-accent text-white hover:bg-accent/90'
            }`}
          >
            {isLast ? 'Finish' : STEPS[step + 1]?.label}
            {!isLast && <ChevronRight size={16} />}
          </button>
        </div>
      </div>

    </div>
  );
}
