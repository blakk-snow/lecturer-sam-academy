import { useState, useCallback, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronDown, ChevronUp, GraduationCap, X, Copy, Check, Loader2, ArrowRight } from 'lucide-react';
import { generateLessonPlan, generateActivities, generateAssessment, explainIndicator } from '../services/ai';
import { Markdown } from '../components/chat/Markdown';

// curriculumData is loaded lazily — it's ~600 KB and only needed on this page.
const curriculumDataPromise = import('../data/curriculumData');

// ── AI action definitions ─────────────────────────────────────────────────────

const AI_ACTIONS = [
  { key: 'lesson',     label: '✨ Generate Lesson',      icon: '✨' },
  { key: 'activities', label: '📋 Activities',           icon: '📋' },
  { key: 'assessment', label: '📝 Assessment',           icon: '📝' },
  { key: 'explain',    label: '💡 Explain',              icon: '💡' },
];

const ACTION_TITLES = {
  lesson:     '✨ Generated Lesson Plan',
  activities: '📋 Classroom Activities',
  assessment: '📝 Assessment',
  explain:    '💡 Indicator Explained',
};

// ── AI Drawer (slide-up modal) ────────────────────────────────────────────────

function AIDrawer({ open, onClose, context, action, onPlanToPlanner }) {
  const [loading, setLoading]   = useState(false);
  const [result, setResult]     = useState(null);
  const [error, setError]       = useState(null);
  const [copied, setCopied]     = useState(false);
  const prevActionRef           = useRef(null);

  // Trigger generation when drawer opens or action changes
  useEffect(() => {
    if (!open || !action || !context) return;
    const key = `${action}::${context.indicatorId}`;
    if (prevActionRef.current === key) return;
    prevActionRef.current = key;

    setResult(null);
    setError(null);
    setLoading(true);

    const params = {
      level:           context.level,
      subject:         context.subject,
      strand:          context.strand,
      subStrand:       context.subStrand,
      contentStandard: `${context.standardCode} — ${context.standardDesc}`,
      indicator:       `${context.indicatorCode} — ${context.indicatorDesc}`,
    };

    const fn = {
      lesson:     generateLessonPlan,
      activities: generateActivities,
      assessment: generateAssessment,
      explain:    explainIndicator,
    }[action];

    fn(params)
      .then(text => { setResult(text); setLoading(false); })
      .catch(err => { setError(err.message); setLoading(false); });
  }, [open, action, context]);

  // Reset when drawer closes
  useEffect(() => {
    if (!open) {
      prevActionRef.current = null;
    }
  }, [open]);

  async function handleCopy() {
    if (!result) return;
    try {
      await navigator.clipboard.writeText(result);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // clipboard may not be available
    }
  }

  if (!open) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Drawer */}
      <div
        role="dialog"
        aria-modal="true"
        aria-label={ACTION_TITLES[action]}
        className="fixed inset-x-0 bottom-0 z-50 max-h-[85dvh] flex flex-col bg-card rounded-t-2xl shadow-2xl"
      >
        {/* Handle */}
        <div className="flex justify-center pt-3 pb-1 shrink-0">
          <div className="w-10 h-1 rounded-full bg-line" />
        </div>

        {/* Header */}
        <div className="flex items-center justify-between px-4 pb-3 border-b border-line shrink-0">
          <h2 className="font-semibold text-ink text-base">
            {ACTION_TITLES[action] || 'AI Assistant'}
          </h2>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-ink-soft hover:text-ink hover:bg-paper"
            aria-label="Close"
          >
            <X size={18} />
          </button>
        </div>

        {/* Context chip */}
        {context && (
          <div className="px-4 pt-3 shrink-0">
            <div className="rounded-xl bg-accent/5 border border-accent/20 px-3 py-2 text-xs text-accent space-y-0.5">
              <p className="font-mono font-semibold">{context.indicatorCode}</p>
              <p className="text-ink-soft leading-snug line-clamp-2">{context.indicatorDesc}</p>
            </div>
          </div>
        )}

        {/* Scrollable content */}
        <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4 min-h-0">
          {loading && (
            <div className="flex flex-col items-center justify-center gap-3 py-16">
              <Loader2 size={32} className="text-accent animate-spin" />
              <p className="text-sm text-ink-soft">Generating with AI…</p>
            </div>
          )}

          {error && !loading && (
            <div className="rounded-xl bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
              <p className="font-semibold mb-1">Generation failed</p>
              <p>{error}</p>
              {import.meta.env.DEV && (
                <p className="mt-2 text-xs text-red-500">
                  Make sure the AI proxy is running: <code className="font-mono">node server.js</code>
                </p>
              )}
            </div>
          )}

          {result && !loading && (
            <div className="rounded-xl bg-paper border border-line p-4">
              <Markdown text={result} />
            </div>
          )}
        </div>

        {/* Footer actions */}
        {result && !loading && (
          <div className="shrink-0 border-t border-line px-4 py-3 flex items-center gap-2 flex-wrap">
            <button
              onClick={handleCopy}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-line text-sm text-ink hover:bg-paper transition"
            >
              {copied ? <Check size={15} className="text-green-600" /> : <Copy size={15} />}
              {copied ? 'Copied!' : 'Copy'}
            </button>

            {action === 'lesson' && onPlanToPlanner && (
              <button
                onClick={onPlanToPlanner}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-accent text-white text-sm font-medium hover:bg-accent/90 transition"
              >
                Plan in Planner
                <ArrowRight size={15} />
              </button>
            )}

            <button
              onClick={onClose}
              className="ml-auto px-3 py-2 rounded-xl border border-line text-sm text-ink-soft hover:text-ink hover:bg-paper transition"
            >
              Close
            </button>
          </div>
        )}
      </div>
    </>
  );
}

// ── StandardCard (with AI buttons per indicator) ──────────────────────────────

function StandardCard({ standard, strand, subStrand, classLabel, subjectLabel, onAIAction }) {
  const [open, setOpen] = useState(false);
  const indicatorCount = standard.indicators.length;

  return (
    <div className="border border-line rounded-xl bg-card overflow-hidden">
      <button
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-start gap-3 p-4 text-left"
        aria-expanded={open}
      >
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-mono text-sm font-semibold text-accent">{standard.code}</span>
            {indicatorCount > 0 && (
              <span className="rounded-full bg-accent/10 text-accent text-xs px-2 py-0.5 font-medium">
                {indicatorCount} indicator{indicatorCount !== 1 ? 's' : ''}
              </span>
            )}
          </div>
          <p className="mt-1 text-sm text-ink leading-snug">{standard.description}</p>
        </div>
        <div className="shrink-0 mt-0.5 text-ink-soft">
          {open ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
        </div>
      </button>

      {open && indicatorCount > 0 && (
        <ul className="border-t border-line divide-y divide-line">
          {standard.indicators.map(ind => (
            <li key={ind.id} className="px-4 py-3 space-y-2">
              {/* Indicator header */}
              <div className="flex gap-2 items-start">
                <span className="font-mono text-xs font-bold text-accent shrink-0 mt-0.5">{ind.code}</span>
                <span className="text-sm text-ink leading-relaxed">{ind.description}</span>
              </div>

              {/* AI action buttons */}
              <div className="flex flex-wrap gap-1.5 pt-0.5">
                {AI_ACTIONS.map(act => (
                  <button
                    key={act.key}
                    onClick={() => onAIAction({
                      action: act.key,
                      level:           classLabel,
                      subject:         subjectLabel,
                      strand:          strand.title,
                      subStrand:       subStrand.title,
                      standardCode:    standard.code,
                      standardDesc:    standard.description,
                      indicatorId:     ind.id,
                      indicatorCode:   ind.code,
                      indicatorDesc:   ind.description,
                    })}
                    className="px-2.5 py-1 rounded-lg bg-paper border border-line text-xs text-ink-soft hover:text-accent hover:border-accent hover:bg-accent/5 transition-colors"
                  >
                    {act.label}
                  </button>
                ))}
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

// ── Main Curriculum page ──────────────────────────────────────────────────────

export default function Curriculum() {
  const navigate = useNavigate();

  // ── Load curriculum data lazily ──────────────────────────────────────────
  const [currData, setCurrData] = useState(null);
  useEffect(() => {
    curriculumDataPromise.then(mod => setCurrData(mod));
  }, []);

  const curriculumMap = currData?.curriculumMap ?? {};
  const subjects      = currData?.subjects      ?? [];
  const classes       = currData?.classes       ?? [];

  const [activeSubjectId, setActiveSubjectId] = useState('mathematics');
  const [activeClassId,   setActiveClassId]   = useState('B7');
  const [activeStrandId,  setActiveStrandId]  = useState(null);

  // AI drawer state
  const [drawerOpen,    setDrawerOpen]    = useState(false);
  const [drawerAction,  setDrawerAction]  = useState(null);
  const [drawerContext, setDrawerContext] = useState(null);

  function handleSubjectChange(subjectId) {
    setActiveSubjectId(subjectId);
    const subjectData = curriculumMap[subjectId] || {};
    const firstAvailableClass = classes.find(c => subjectData[c.id]?.length > 0);
    const newClassId = firstAvailableClass ? firstAvailableClass.id : 'B7';
    setActiveClassId(newClassId);
    setActiveStrandId(null);
  }

  function handleClassChange(classId) {
    setActiveClassId(classId);
    setActiveStrandId(null);
  }

  const handleAIAction = useCallback((ctx) => {
    const { action, ...context } = ctx;
    setDrawerAction(action);
    setDrawerContext(context);
    setDrawerOpen(true);
  }, []);

  const strands = (curriculumMap[activeSubjectId] || {})[activeClassId] || [];

  const resolvedStrandId = activeStrandId && strands.find(s => s.id === activeStrandId)
    ? activeStrandId
    : (strands[0]?.id ?? null);

  const activeStrand  = strands.find(s => s.id === resolvedStrandId);
  const activeSubject = subjects.find(s => s.id === activeSubjectId);
  const activeClass   = classes.find(c => c.id === activeClassId);
  const subjectData   = curriculumMap[activeSubjectId] || {};

  if (!currData) {
    return (
      <div className="flex items-center justify-center min-h-[60dvh]">
        <div className="w-6 h-6 rounded-full border-2 border-accent border-t-transparent animate-spin" />
      </div>
    );
  }

  return (
    <div className="pb-24">
      {/* ── Header ───────────────────────────────────────────────────────── */}
      <div className="px-4 pt-6 pb-4">
        <div className="flex items-center gap-2 mb-1">
          <GraduationCap size={22} className="text-accent" />
          <h1 className="text-xl font-bold text-ink">Curriculum</h1>
        </div>
        <p className="text-sm text-ink-soft">
          {activeClass?.label} · {activeSubject?.label}
        </p>
        <span className="mt-2 inline-block rounded-full bg-accent/10 text-accent text-xs px-3 py-1 font-medium">
          NaCCA Common Core Programme
        </span>
      </div>

      {/* ── Subject pills ─────────────────────────────────────────────────── */}
      <div className="flex gap-2 px-4 pb-3 overflow-x-auto scrollbar-none">
        {subjects.map(subject => (
          <button
            key={subject.id}
            onClick={() => handleSubjectChange(subject.id)}
            className={`shrink-0 rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${
              subject.id === activeSubjectId
                ? 'bg-accent text-white'
                : 'bg-card border border-line text-ink-soft hover:text-ink'
            }`}
          >
            {subject.label}
          </button>
        ))}
      </div>

      {/* ── Class pills ───────────────────────────────────────────────────── */}
      <div className="flex gap-2 px-4 pb-4 overflow-x-auto scrollbar-none">
        {classes.map(cls => {
          const available = (subjectData[cls.id]?.length ?? 0) > 0;
          const isActive  = cls.id === activeClassId;
          return (
            <button
              key={cls.id}
              onClick={() => available && handleClassChange(cls.id)}
              disabled={!available}
              className={`shrink-0 rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${
                isActive
                  ? 'bg-accent/20 text-accent border border-accent'
                  : available
                  ? 'bg-card border border-line text-ink-soft hover:text-ink'
                  : 'bg-card border border-line text-ink-soft/40 cursor-not-allowed'
              }`}
            >
              {cls.label}
            </button>
          );
        })}
      </div>

      {strands.length === 0 ? (
        <div className="px-4 py-12 text-center">
          <p className="text-ink-soft">No curriculum data available for this combination.</p>
        </div>
      ) : (
        <>
          {/* ── Strand tabs ─────────────────────────────────────────────── */}
          <div className="flex gap-2 px-4 pb-4 overflow-x-auto scrollbar-none">
            {strands.map(strand => (
              <button
                key={strand.id}
                onClick={() => setActiveStrandId(strand.id)}
                className={`shrink-0 rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${
                  strand.id === resolvedStrandId
                    ? 'bg-accent text-white'
                    : 'bg-card border border-line text-ink-soft hover:text-ink'
                }`}
              >
                {strand.title}
              </button>
            ))}
          </div>

          {/* ── Sub-strands and standards ────────────────────────────────── */}
          {activeStrand && (
            <div className="px-4 space-y-6">
              {activeStrand.subStrands.map(ss => (
                <section key={ss.id}>
                  <h2 className="text-xs font-semibold text-ink-soft uppercase tracking-wide mb-3">
                    {ss.code} · {ss.title}
                  </h2>
                  <div className="space-y-2">
                    {ss.contentStandards.map(std => (
                      <StandardCard
                        key={std.id}
                        standard={std}
                        strand={activeStrand}
                        subStrand={ss}
                        classLabel={activeClass?.label ?? activeClassId}
                        subjectLabel={activeSubject?.label ?? activeSubjectId}
                        onAIAction={handleAIAction}
                      />
                    ))}
                  </div>
                </section>
              ))}
            </div>
          )}
        </>
      )}

      {/* ── AI Drawer ─────────────────────────────────────────────────────── */}
      <AIDrawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        context={drawerContext}
        action={drawerAction}
        onPlanToPlanner={() => {
          setDrawerOpen(false);
          navigate('/planner');
        }}
      />

      {/* ── AI Assistant entry point ───────────────────────────────────────── */}
      <div className="fixed bottom-20 right-4 z-30 md:bottom-6">
        <button
          onClick={() => navigate('/ai-assistant')}
          className="flex items-center gap-2 bg-accent text-white rounded-full px-4 py-2.5 shadow-lg text-sm font-medium hover:bg-accent/90 transition-all active:scale-95"
          aria-label="Open AI Curriculum Assistant"
        >
          <span className="text-base leading-none">✨</span>
          AI Assistant
        </button>
      </div>
    </div>
  );
}
