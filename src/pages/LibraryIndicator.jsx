import { useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, CheckCircle2, Loader2, PenLine, RotateCcw } from 'lucide-react';
import { loadEntries } from '../data/courseLibrary';
import { Markdown } from '../components/chat/Markdown';
import { QuestionCard } from '../components/quiz/QuestionCard';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { saveQuizResult } from '../db/attempts';
import { completeLesson } from '../db/progress';
import { useChat } from '../context/ChatContext';
import { track } from '../services/analytics';

const normalizeCode = (code) => (code ?? '').replace(/\/JHS\d+/g, '').toUpperCase();
const lessonIdFor = (code) => `lib-${normalizeCode(code).toLowerCase()}`;

// ── Quiz ───────────────────────────────────────────────────────────────────────

function IndicatorQuiz({ code, questions, onRestart }) {
  const [index, setIndex] = useState(0);
  const [results, setResults] = useState(() => new Array(questions.length).fill(null));
  const [finished, setFinished] = useState(false);
  const current = questions[index];

  function handleResolved(result) {
    setResults(prev => (prev[index] != null ? prev : prev.map((v, i) => (i === index ? Boolean(result.correct) : v))));
  }

  async function finish() {
    const correct = results.filter(r => r === true).length;
    const percentage = Math.round((correct / questions.length) * 100);
    await Promise.all([
      saveQuizResult({ quizId: lessonIdFor(code), score: correct, percentage }),
      completeLesson(lessonIdFor(code), percentage),
    ]);
    track('quiz_completed', { percentage });
    setFinished(true);
  }

  if (finished) {
    const correct = results.filter(r => r === true).length;
    return (
      <div className="rounded-2xl border border-line bg-card p-6 text-center space-y-3">
        <CheckCircle2 size={36} className="mx-auto text-green-600" />
        <p className="text-3xl font-bold text-ink">{correct} / {questions.length}</p>
        <p className="text-sm text-ink-soft">
          {Math.round((correct / questions.length) * 100)}% — {correct === questions.length ? 'perfect!' : 'review the notes and try again.'}
        </p>
        <div className="flex justify-center gap-3">
          <Button variant="secondary" onClick={onRestart}>
            <RotateCcw size={15} /> Retry quiz
          </Button>
        </div>
      </div>
    );
  }

  const answered = results[index] != null;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between text-sm text-ink-soft">
        <span>Question {index + 1} of {questions.length}</span>
        <span>{results.filter(r => r != null).length} answered</span>
      </div>
      <div className="h-1.5 rounded-full bg-paper overflow-hidden">
        <div className="h-full bg-accent transition-all" style={{ width: `${((index + 1) / questions.length) * 100}%` }} />
      </div>

      <Card>
        <QuestionCard key={current.id} question={current} onResolved={handleResolved} />
      </Card>

      <div className="flex justify-between">
        <Button variant="secondary" disabled={index === 0} onClick={() => setIndex(i => i - 1)}>
          Previous
        </Button>
        {index < questions.length - 1 ? (
          <Button disabled={!answered} onClick={() => setIndex(i => i + 1)}>
            Next
          </Button>
        ) : (
          <Button disabled={!answered} onClick={finish} className="bg-green-600 hover:bg-green-700">
            Finish quiz
          </Button>
        )}
      </div>
    </div>
  );
}

// ── Page ───────────────────────────────────────────────────────────────────────

export default function LibraryIndicator() {
  const { subjectId, classId, indicatorCode } = useParams();
  const { openPanel, startLessonPlanFlow } = useChat();
  const [entry, setEntry] = useState(undefined); // undefined = loading, null = not found
  const [tab, setTab] = useState('notes');
  const [quizKey, setQuizKey] = useState(0);
  const [bookRefs, setBookRefs] = useState([]);

  const normalized = normalizeCode((indicatorCode ?? '').replaceAll('_', '/'));

  function planThisLesson() {
    startLessonPlanFlow({ subjectId, classId, indicatorCodes: [normalized] });
    openPanel();
  }

  useEffect(() => {
    setEntry(undefined);
    setTab('notes');
    setQuizKey(k => k + 1);
    setBookRefs([]);
    loadEntries(subjectId, classId)
      .then(list => setEntry(list.find(e => normalizeCode(e.code) === normalized) ?? null))
      .catch(() => setEntry(null));
    import('../data/courseLibrary/bookIndex').then(({ chapterRefs }) => {
      const refs = (chapterRefs[normalized] ?? [])
        .filter(r => r.subjectId === subjectId && r.classId === classId)
        .map(r => ({ ...r, safeCode: r.code?.replaceAll('/', '_') }));
      setBookRefs(refs);
    });
  }, [subjectId, classId, normalized]);

  const questions = useMemo(() => entry?.questions ?? [], [entry]);

  if (entry === undefined) {
    return (
      <div className="flex items-center gap-2 text-sm text-ink-soft py-16 justify-center">
        <Loader2 size={16} className="animate-spin" /> Loading…
      </div>
    );
  }

  if (entry === null || (!entry.notes && questions.length === 0)) {
    return (
      <div className="py-12 text-center space-y-3">
        <p className="text-ink-soft">No content has been uploaded for this indicator yet.</p>
        <Link to="/course" className="text-sm text-accent">← Back to the Course Library</Link>
      </div>
    );
  }

  const tabs = [
    entry.notes && { id: 'notes', label: 'Notes' },
    questions.length > 0 && { id: 'practice', label: 'Practice' },
    questions.length > 0 && { id: 'quiz', label: 'Quiz' },
  ].filter(Boolean);

  return (
    <div className="space-y-4 pb-24">
      <Link to="/course" className="flex items-center gap-1 text-sm text-ink-soft hover:text-ink">
        <ArrowLeft size={15} /> Course Library
      </Link>

      <div>
        <p className="font-mono text-xs font-bold text-accent">{entry.code}</p>
        <div className="flex items-start justify-between gap-3 flex-wrap">
          <h1 className="mt-1 font-serif text-2xl">{entry.notes?.title ?? entry.code}</h1>
          <Button onClick={planThisLesson} variant="secondary" className="text-sm px-3 py-2 min-h-0">
            <PenLine size={15} /> Plan this lesson
          </Button>
        </div>
        {bookRefs.length > 0 && (
          <p className="mt-2 text-sm text-ink-soft">
            Taught in{' '}
            {bookRefs.map((ref, i) => (
              <span key={ref.bookId}>
                {i > 0 && ', '}
                <Link
                  to={`/library/${subjectId}/${classId}/book/${ref.bookId}`}
                  className="text-accent hover:underline"
                >
                  {ref.bookKindLabel}, Chapter {ref.chapterNumber}
                </Link>
              </span>
            ))}.
          </p>
        )}
      </div>

      {/* Tabs */}
      <div className="flex rounded-xl border border-line bg-card p-1" role="tablist" aria-label="Content type">
        {tabs.map(t => (
          <button
            key={t.id}
            role="tab"
            aria-selected={tab === t.id}
            onClick={() => setTab(t.id)}
            className={`flex-1 rounded-lg px-3 py-2 text-sm font-medium transition ${
              tab === t.id ? 'bg-accent text-white' : 'text-ink-soft hover:text-ink'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'notes' && entry.notes && (
        <div className="space-y-4">
          {entry.notes.objectives?.length > 0 && (
            <Card>
              <p className="mb-2 text-xs uppercase tracking-wide text-ink-soft">Objectives</p>
              <ul className="list-disc pl-5 space-y-1 text-sm">
                {entry.notes.objectives.map((o, i) => <li key={i}>{o}</li>)}
              </ul>
            </Card>
          )}
          {entry.notes.explanation && (
            <Card>
              <p className="mb-2 text-xs uppercase tracking-wide text-ink-soft">Explanation</p>
              <Markdown text={entry.notes.explanation} />
            </Card>
          )}
          {entry.notes.workedExample && (
            <Card>
              <p className="mb-2 text-xs uppercase tracking-wide text-ink-soft">Worked Example</p>
              <Markdown text={entry.notes.workedExample} />
            </Card>
          )}
          {entry.notes.practice && (
            <Card>
              <p className="mb-2 text-xs uppercase tracking-wide text-ink-soft">Practice</p>
              <Markdown text={entry.notes.practice} />
            </Card>
          )}
        </div>
      )}

      {tab === 'practice' && (
        <div className="space-y-4">
          {questions.map((q, i) => (
            <Card key={q.id}>
              <p className="mb-3 text-xs uppercase tracking-wide text-ink-soft">Question {i + 1}</p>
              <QuestionCard question={q} />
            </Card>
          ))}
        </div>
      )}

      {tab === 'quiz' && (
        <IndicatorQuiz key={quizKey} code={entry.code} questions={questions} onRestart={() => setQuizKey(k => k + 1)} />
      )}
    </div>
  );
}
