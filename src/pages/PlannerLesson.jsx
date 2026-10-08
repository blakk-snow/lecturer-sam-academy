import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, ChevronLeft, ChevronRight, Sparkles, Loader2, Download } from 'lucide-react';
import {
  useSubject, useWeekPlans, useWeekTopicsForSubject, useLessonNote,
  useTerm, useClassGroups, usePlannerActions,
} from '../hooks/usePlanner';
import { generateLessonPlan, generateAssessment, generateMethodLessonPlan, extractMethodSections } from '../services/ai';
import { getMethodForSubject, methodSectionsToFields } from '../data/teachingMethods';
import { useUsage, FREE_MONTHLY_LIMIT } from '../hooks/useUsage';
import { findSamplePlans } from '../data/sampleLessonPlans';
import { Markdown } from '../components/chat/Markdown';
import { PrintLessonPlan } from '../components/lesson/PrintLessonPlan';

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
  const { signedIn, outOfQuota } = useUsage();
  // AI needs an account and the free tier is metered. Say so on the button
  // rather than letting the request fail with a proxy error afterwards.
  const blocked = !signedIn || outOfQuota;
  const isDisabled = disabled || blocked;
  const tip = tooltip ?? (blocked
    ? (!signedIn
      ? 'Sign in to use AI generation — it needs a free account.'
      : `You have used all ${FREE_MONTHLY_LIMIT} free AI generations this month. Upgrade to Pro on your Profile page.`)
    : undefined);

  return (
    <div className="relative group">
      <button
        type="button"
        onClick={onClick}
        disabled={isDisabled || loading}
        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium border transition-colors ${
          isDisabled
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
      {isDisabled && tip && (
        <div className="absolute bottom-full left-0 mb-1.5 w-52 rounded-lg bg-ink text-white text-xs px-2.5 py-1.5 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity z-10 leading-snug">
          {tip}
        </div>
      )}
    </div>
  );
}

/**
 * Visible version of the AIButton tooltip — tooltips are hover-only, so mobile
 * users (most of them) would never see why generation is unavailable.
 */
function AIGateNotice() {
  const { signedIn, outOfQuota } = useUsage();
  if (signedIn && !outOfQuota) return null;

  return (
    <div className="mb-5 rounded-xl border border-line bg-card px-3.5 py-2.5 text-xs leading-relaxed text-ink-soft">
      {!signedIn ? (
        <>
          <Sparkles size={12} className="inline mr-1.5 -mt-0.5 text-accent" />
          AI generation needs a free account.{' '}
          <Link to="/profile" className="font-medium text-accent hover:underline">Sign in</Link>{' '}
          to generate this lesson plan — everything you type yourself saves without one.
        </>
      ) : (
        <>
          <Sparkles size={12} className="inline mr-1.5 -mt-0.5 text-accent" />
          You have used all {FREE_MONTHLY_LIMIT} free AI generations this month.{' '}
          <Link to="/profile" className="font-medium text-accent hover:underline">Upgrade to Pro</Link>{' '}
          for unlimited generations — the counter resets on the 1st.
        </>
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

  // ── Data loading (auth-aware: Firestore when signed in, Dexie otherwise) ──
  const subject = useSubject(termId, subjectId);
  const cgId = subject?.classGroupId;
  const weekPlans = useWeekPlans(termId, cgId, subjectId);
  const weekTopics = useWeekTopicsForSubject(termId, cgId, subjectId, weekPlans);
  const classGroups = useClassGroups(termId);
  const term = useTerm(termId);
  const lessonNote = useLessonNote(topicId);
  const actions = usePlannerActions();

  // Resolve the topic and its week plan from the merged live lists.
  // A Firestore topic's weekPlanId equals its week-plan doc id; a Dexie
  // topic's weekPlanId equals the numeric plan id — both match wp.id.
  const topic = (weekPlans === undefined || weekTopics === undefined)
    ? undefined
    : (weekTopics.find(t => String(t.id) === String(topicId)) ?? null);
  const weekPlan = (topic == null)
    ? topic
    : (weekPlans ?? []).find(wp => String(wp.id) === String(topic.weekPlanId)) ?? null;
  const classGroup = (classGroups === undefined || cgId == null)
    ? (classGroups === undefined ? undefined : null)
    : classGroups.find(cg => String(cg.id) === String(cgId)) ?? null;

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
    methodId: null,
    sections: [],
  });
  const [saveState, setSaveState] = useState('idle');
  const [saveError, setSaveError] = useState(null);
  const [isDirty, setIsDirty] = useState(false);
  const [conflict, setConflict] = useState(null);
  const saveTimer = useRef(null);
  const initializedRef = useRef(false);
  const revisionRef = useRef(undefined);
  const editSequenceRef = useRef(0);
  const saveInProgressRef = useRef(false);

  // ── Curriculum lookup ───────────────────────────────────────────────────────
  const currDetails = useMemo(() => {
    if (!curriculumMap || !topic?.contentStandardId || !subject) return null;
    let indicatorIds;
    try {
      indicatorIds = typeof topic.indicatorIds === 'string'
        ? JSON.parse(topic.indicatorIds)
        : (topic.indicatorIds ?? []);
    } catch { indicatorIds = []; }
    const curriculumSubjectId = topic.curriculumSubjectId ?? subject.curriculumSubjectId;
    const curriculumClassId = topic.curriculumClassId ?? subject.curriculumClassId;
    const strands = (curriculumMap[curriculumSubjectId] ?? {})[curriculumClassId] ?? [];
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

  const noteToForm = useCallback(note => ({
    day:          note?.day          ?? '',
    date:         note?.date         ?? '',
    starter:      note?.starter      ?? '',
    mainLearning: note?.mainLearning ?? '',
    plenary:      note?.plenary      ?? '',
    resourceUrl:  note?.resourceUrl  ?? '',
    resourceType: note?.resourceType ?? 'none',
    evaluation:   note?.evaluation   ?? '',
    homework:     note?.homework     ?? '',
    status:       note?.status       ?? 'draft',
    methodId:     note?.methodId     ?? null,
    sections:     note?.sections     ?? [],
  }), []);

  const updateForm = useCallback((field, value) => {
    editSequenceRef.current += 1;
    setIsDirty(true);
    setForm(current => ({ ...current, [field]: value }));
  }, []);

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
    if (lessonNote === undefined) return;
    const incoming = lessonNote ?? null;
    if (!initializedRef.current) {
      initializedRef.current = true;
      revisionRef.current = incoming?.revision ?? null;
      setForm(noteToForm(incoming));
      return;
    }
    if ((incoming?.revision ?? null) === revisionRef.current || saveInProgressRef.current) return;
    if (isDirty) {
      setConflict({ record: incoming });
      return;
    }
    revisionRef.current = incoming?.revision ?? null;
    setForm(noteToForm(incoming));
  }, [isDirty, lessonNote, noteToForm]);

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
      methodId: f.methodId ?? null,
      sections: f.sections ?? [],
    };
  }, [form, weekPlan?.weekNumber]);

  const save = useCallback(async (overrides = {}, allowConflict = false) => {
    if (topicId == null) return;
    if (conflict && !allowConflict) return;
    if (!isDirty && Object.keys(overrides).length === 0) return;
    const sequenceAtSave = editSequenceRef.current;
    setSaveState('saving');
    setSaveError(null);
    saveInProgressRef.current = true;
    try {
      const saved = await actions.upsertLessonNote(
        topicId,
        buildPayload(overrides),
        revisionRef.current,
      );
      revisionRef.current = saved?.revision ?? revisionRef.current;
      setConflict(null);
      if (editSequenceRef.current === sequenceAtSave) setIsDirty(false);
      setSaveState('saved');
      if (saveTimer.current) clearTimeout(saveTimer.current);
      saveTimer.current = setTimeout(() => setSaveState('idle'), 2000);
    } catch (err) {
      if (err?.code === 'planner/conflict') {
        setConflict({ record: err.currentRecord ?? null });
        setSaveState('conflict');
      } else {
        setSaveError(err?.message ?? 'Could not save this lesson note.');
        setSaveState('error');
      }
    } finally {
      saveInProgressRef.current = false;
    }
  }, [actions, buildPayload, conflict, isDirty, topicId]);

  const handleBlur  = useCallback(() => save(), [save]);

  const handleStatusCycle = useCallback(async () => {
    const next = STATUSES[(STATUSES.indexOf(form.status) + 1) % STATUSES.length];
    updateForm('status', next);
    await save({ status: next });
  }, [form.status, save, updateForm]);

  const handleRadioChange = useCallback(async (newType) => {
    updateForm('resourceType', newType);
    await save({ resourceType: newType });
  }, [save, updateForm]);

  const reloadAfterConflict = useCallback(() => {
    const record = conflict?.record ?? null;
    revisionRef.current = record?.revision ?? null;
    setForm(noteToForm(record));
    setIsDirty(false);
    setConflict(null);
    setSaveError(null);
    setSaveState('idle');
  }, [conflict, noteToForm]);

  const overwriteAfterConflict = useCallback(async () => {
    revisionRef.current = conflict?.record?.revision ?? null;
    setConflict(null);
    await save({}, true);
  }, [conflict, save]);

  // ── Sample lesson plans ──────────────────────────────────────────────────────
  // Bundled Week-5 notes matched by curriculum subject + class level.
  const samplePlans = useMemo(() => (
    subject && classGroup
      ? findSamplePlans(subject.curriculumSubjectId, classGroup.classLevel)
      : []
  ), [subject, classGroup]);

  const handleLoadSamplePlan = useCallback(async (plan) => {
    const overrides = {
      starter: plan.starter,
      mainLearning: plan.mainLearning,
      plenary: plan.plenary,
      evaluation: plan.evaluation,
      homework: plan.homework,
      resourceUrl: plan.resources ?? '',
      resourceType: plan.resources ? 'link' : 'none',
      status: 'draft',
      methodId: null,
      sections: [],
    };
    Object.entries(overrides).forEach(([key, value]) => updateForm(key, value));
    await save(overrides);
  }, [save, updateForm]);

  // ── Teaching-method plan generation ──────────────────────────────────────────
  const handleGenerateMethodPlan = useCallback(async () => {
    const params = buildAiParams();
    if (!params) return;
    setAiLoading('method', true);
    try {
      const method = getMethodForSubject(subject?.curriculumSubjectId);
      const indicatorCodes = currDetails?.resolvedIndicators?.map(i => i.id) ?? [];
      const text = await generateMethodLessonPlan({
        ...params,
        subjectId: subject?.curriculumSubjectId,
        classId: subject?.curriculumClassId,
        indicatorCodes,
        method,
      });
      const sections = extractMethodSections(text, method);
      const classic = methodSectionsToFields(sections);
      const overrides = {
        ...classic,
        status: 'draft',
        methodId: method.id,
        sections,
      };
      Object.entries(overrides).forEach(([key, value]) => updateForm(key, value));
      await save(overrides);
      setStep(0);
    } catch (err) {
      setAiError('method', err.message || 'AI generation failed. Please try again.');
    } finally {
      setAiLoading('method', false);
    }
  }, [buildAiParams, currDetails, save, subject, updateForm]);

  // ── AI generation ───────────────────────────────────────────────────────────

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
        updateForm('evaluation', text);
        await save({ evaluation: text });
      } else {
        // Generate full lesson plan and extract the relevant section
        const fullPlan = await generateLessonPlan(params);
        const section = extractSection(fullPlan, stepKey);
        updateForm(stepKey, section);
        await save({ [stepKey]: section });
      }
      setAiLoading(stepKey, false);
    } catch (err) {
      setAiError(stepKey, err.message || 'AI generation failed. Please try again.');
    }
  }, [buildAiParams, save, updateForm]);

  // Save when leaving a step
  const goTo = useCallback((next) => {
    save();
    setStep(next);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [save]);

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
                onChange={e => updateForm('day', e.target.value)}
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
                onChange={e => updateForm('date', e.target.value)}
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

          {/* Bundled sample lesson plans matching this subject + class */}
          {samplePlans.length > 0 && (
            <div className="border border-line rounded-xl bg-card p-4 space-y-3">
              <p className="text-xs font-semibold text-ink-soft uppercase tracking-widest">
                Bundled sample lesson plans
              </p>
              {samplePlans.map(plan => (
                <div key={plan.id} className="flex items-center justify-between gap-3 flex-wrap">
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-ink">{plan.title}</p>
                    {plan.contentStandard && (
                      <p className="text-xs text-ink-soft font-mono">{plan.contentStandard}</p>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={() => handleLoadSamplePlan(plan)}
                    className="shrink-0 rounded-xl border border-accent/40 text-accent text-xs font-medium px-3 py-1.5 hover:bg-accent/10 transition"
                  >
                    Load into this note
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Teaching-method plan (EOPT/reading method) */}
          <div className="border border-line rounded-xl bg-card p-4 space-y-3">
            <div className="flex items-center justify-between gap-3 flex-wrap">
              <p className="text-xs font-semibold text-ink-soft uppercase tracking-widest">
                Teaching-method lesson plan
              </p>
              <AIButton
                label={form.sections?.length > 0 ? 'Regenerate with method' : 'Generate with method'}
                loading={aiState.method?.loading}
                disabled={!currDetails}
                tooltip="Link this topic to a curriculum indicator first"
                onClick={handleGenerateMethodPlan}
              />
            </div>
            <AIError message={aiState.method?.error} onDismiss={() => clearAiError('method')} />
            {form.sections?.length > 0 ? (
              <ol className="space-y-3">
                {form.sections.map((section, i) => (
                  <li key={section.key} className="rounded-lg bg-paper p-3">
                    <p className="text-sm font-semibold text-ink">
                      <span className="text-accent font-bold mr-1.5">{i + 1}.</span>
                      {section.label}
                    </p>
                    {section.content && (
                      <div className="mt-1.5 pl-5">
                        <Markdown text={section.content} />
                      </div>
                    )}
                  </li>
                ))}
              </ol>
            ) : (
              <p className="text-sm text-ink-soft">
                Generates a full plan following the teacher's method — EOPT/dictation, correction, objectives,
                media, reading time, discussion and assignment (mental-maths variant for Mathematics).
              </p>
            )}
          </div>
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
            onChange={e => updateForm('starter', e.target.value)}
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
            onChange={e => updateForm('mainLearning', e.target.value)}
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
            onChange={e => updateForm('plenary', e.target.value)}
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
              onChange={e => updateForm('resourceUrl', e.target.value)}
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
            onChange={e => updateForm('evaluation', e.target.value)}
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
            onChange={e => updateForm('homework', e.target.value)}
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
    <div className="pb-24 flex flex-col min-h-dvh print:min-h-0">

      {/* ── Fixed top bar ─────────────────────────────────────────────────── */}
      <div className="sticky top-0 z-10 bg-card border-b border-line px-4 pt-4 pb-3 md:px-6 print:hidden">
        {/* Back + breadcrumb row */}
        <div className="flex items-center justify-between mb-3">
          <button
            onClick={() => navigate(`/planner/${termId}/${subjectId}`)}
            className="flex items-center gap-1 text-sm text-ink-soft hover:text-ink"
          >
            <ArrowLeft size={16} />
            Back
          </button>
          {/* Status badge + Download PDF */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => window.print()}
              className="flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium border border-line text-ink hover:border-accent hover:text-accent transition"
              aria-label="Download lesson plan as PDF"
            >
              <Download size={13} />
              Download PDF
            </button>
            <button
              onClick={handleStatusCycle}
              className={`px-3 py-1 rounded-full text-xs font-semibold transition ${STATUS_STYLES[form.status]}`}
            >
              {STATUS_LABELS[form.status]}
            </button>
          </div>
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
            {saveState === 'conflict' && 'Changes need review'}
            {saveState === 'error' && 'Save failed'}
          </p>
        </div>
      </div>

      {conflict && (
        <div className="mx-4 mt-4 rounded-xl border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-950 md:mx-6 print:hidden">
          <p className="font-semibold">This lesson note changed on another device.</p>
          <p className="mt-1">Reload the latest version, or deliberately overwrite it with your draft.</p>
          <div className="mt-3 flex flex-wrap gap-2">
            <button
              type="button"
              onClick={reloadAfterConflict}
              className="rounded-lg border border-amber-400 bg-white px-3 py-1.5 text-xs font-medium hover:bg-amber-100"
            >
              Load latest version
            </button>
            <button
              type="button"
              onClick={overwriteAfterConflict}
              className="rounded-lg bg-amber-800 px-3 py-1.5 text-xs font-medium text-white hover:bg-amber-900"
            >
              Overwrite with my draft
            </button>
          </div>
        </div>
      )}
      {saveError && (
        <div role="alert" className="mx-4 mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800 md:mx-6 print:hidden">
          {saveError}
        </div>
      )}

      {/* ── Slide ─────────────────────────────────────────────────────────── */}
      <div className="flex-1 px-4 pt-6 pb-4 md:px-6 print:hidden">
        {/* Step heading */}
        <div className="mb-5">
          <span className="text-2xl mb-1 block">{currentStep.icon}</span>
          <h1 className="text-2xl font-bold text-ink font-serif">{currentStep.label}</h1>
        </div>

        <AIGateNotice />

        {/* Slide content */}
        {renderSlide()}
      </div>

      {/* ── Navigation bar ─────────────────────────────────────────────────── */}
      <div className="sticky bottom-16 md:bottom-0 bg-card border-t border-line px-4 py-3 md:px-6 print:hidden">
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

      {/* ── Print-only lesson plan (Download PDF) ──────────────────────────── */}
      <div className="hidden print:block print-only px-2 py-4">
        <PrintLessonPlan
          subjectName={subject?.name}
          classLevel={classGroup?.classLevel}
          termName={term?.name}
          weekNumber={weekPlan?.weekNumber}
          day={form.day}
          date={form.date}
          statusLabel={STATUS_LABELS[form.status]}
          currDetails={currDetails}
          sections={form.sections}
          starter={form.starter}
          mainLearning={form.mainLearning}
          plenary={form.plenary}
          resourceUrl={form.resourceUrl}
          evaluation={form.evaluation}
          homework={form.homework}
        />
      </div>

    </div>
  );
}
