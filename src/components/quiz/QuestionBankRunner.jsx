/**
 * QuestionBankRunner.jsx — BECE mock-paper practice over the parsed bank
 *
 * Pick a class → pick a paper → answer the 40 MCQs with instant feedback
 * and a final score. Attempts are recorded in Dexie (attempts table).
 */

import { useEffect, useMemo, useState } from 'react';
import { ArrowLeft, Check, ChevronRight, Loader2, RotateCcw, X } from 'lucide-react';
import { bankManifest, loadPapers } from '../../data/questionBank';
import { Markdown } from '../chat/Markdown';
import { recordAttempt } from '../../db/attempts';

const OPTION_KEYS = ['A', 'B', 'C', 'D'];

export function QuestionBankRunner() {
  const [classId, setClassId] = useState('B7');
  const [papers, setPapers] = useState(undefined);
  const [paperId, setPaperId] = useState(null);
  const [qIndex, setQIndex] = useState(0);
  const [picked, setPicked] = useState({});   // question number → key
  const [finished, setFinished] = useState(false);

  useEffect(() => {
    setPapers(undefined);
    setPaperId(null);
    setQIndex(0);
    setPicked({});
    setFinished(false);
    loadPapers('science', classId).then(setPapers).catch(() => setPapers([]));
  }, [classId]);

  const paper = useMemo(
    () => papers?.find(p => p.id === paperId) ?? null,
    [papers, paperId],
  );
  const mcqs = paper?.mcqs ?? [];
  const current = mcqs[qIndex] ?? null;

  async function pick(key) {
    if (!current || picked[current.number]) return;
    const correct = current.answer === key;
    setPicked(prev => ({ ...prev, [current.number]: key }));
    recordAttempt({
      questionId: `${paper.id}-q${current.number}`,
      answer: key,
      correct,
      score: correct ? 1 : 0,
      topicId: paper.id,
    }).catch(() => {});
  }

  const score = mcqs.filter(q => picked[q.number] === q.answer).length;
  const answered = Object.keys(picked).length;

  function startPaper(id) {
    setPaperId(id);
    setQIndex(0);
    setPicked({});
    setFinished(false);
  }

  // ── Paper picker ─────────────────────────────────────────────────────────────
  if (!paper) {
    return (
      <div className="space-y-4">
        <div className="flex gap-2 flex-wrap">
          {bankManifest.map(m => (
            <button
              key={m.classId}
              onClick={() => setClassId(m.classId)}
              className={`rounded-full px-4 py-1.5 text-sm font-medium border transition ${
                classId === m.classId ? 'bg-accent text-white border-accent' : 'border-line bg-card text-ink hover:border-accent'
              }`}
            >
              {m.label} · {m.paperCount} papers
            </button>
          ))}
        </div>

        {papers === undefined ? (
          <div className="flex items-center gap-2 text-sm text-ink-soft py-8 justify-center">
            <Loader2 size={16} className="animate-spin" /> Loading question bank…
          </div>
        ) : (
          <ul className="space-y-2">
            {papers.map(p => (
              <li key={p.id}>
                <button
                  onClick={() => startPaper(p.id)}
                  className="w-full text-left rounded-xl border border-line bg-card px-4 py-3 hover:border-accent transition"
                >
                  <span className="text-sm font-medium text-ink block">{p.title}</span>
                  <span className="text-xs text-ink-soft">{p.classLevel} · {p.mcqCount} MCQs · {p.theoryCount} theory questions</span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    );
  }

  // ── Finished screen ──────────────────────────────────────────────────────────
  if (finished) {
    const pct = Math.round((score / mcqs.length) * 100);
    return (
      <div className="space-y-4">
        <div className="rounded-2xl border border-line bg-card p-6 text-center">
          <p className="text-xs uppercase tracking-widest text-ink-soft">{paper.title}</p>
          <p className="mt-3 text-4xl font-bold text-ink">{score} / {mcqs.length}</p>
          <p className={`mt-1 text-sm font-medium ${pct >= 50 ? 'text-green-600' : 'text-amber-700'}`}>
            {pct}% {pct >= 50 ? '— well done!' : '— keep practising!'}
          </p>
          <div className="mt-5 flex justify-center gap-3">
            <button
              onClick={() => startPaper(paper.id)}
              className="flex items-center gap-1.5 rounded-xl border border-line px-4 py-2 text-sm font-medium hover:bg-paper"
            >
              <RotateCcw size={15} /> Retry
            </button>
            <button
              onClick={() => setPaperId(null)}
              className="flex items-center gap-1.5 rounded-xl bg-accent text-white px-4 py-2 text-sm font-medium hover:bg-accent/90"
            >
              <ArrowLeft size={15} /> All papers
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ── Question view ────────────────────────────────────────────────────────────
  const pickedKey = current ? picked[current.number] : null;
  const reveal = pickedKey != null;

  return (
    <div className="space-y-4">
      {/* Progress header */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <button
          onClick={() => setPaperId(null)}
          className="flex items-center gap-1 text-sm text-ink-soft hover:text-ink"
        >
          <ArrowLeft size={15} /> Papers
        </button>
        <span className="text-sm text-ink-soft">
          Question {qIndex + 1} of {mcqs.length} · {answered} answered
        </span>
      </div>
      <div className="h-1.5 rounded-full bg-paper overflow-hidden">
        <div className="h-full bg-accent transition-all" style={{ width: `${((qIndex + 1) / mcqs.length) * 100}%` }} />
      </div>

      {/* Question */}
      <div className="rounded-2xl border border-line bg-card p-5">
        <p className="text-xs uppercase tracking-wide text-ink-soft mb-2">
          {paper.title.slice(0, 60)}{paper.title.length > 60 ? '…' : ''}
        </p>
        <div className="text-sm font-medium text-ink">
          <span className="font-bold mr-1.5">{current.number}.</span>
          <Markdown text={current.question} />
        </div>

        <div className="mt-4 space-y-2">
          {current.options.map(opt => {
            const isPicked = pickedKey === opt.key;
            const isCorrect = current.answer === opt.key;
            const showCorrect = reveal && isCorrect;
            const showWrong = reveal && isPicked && !isCorrect;
            return (
              <button
                key={opt.key}
                onClick={() => pick(opt.key)}
                disabled={reveal}
                className={`w-full flex items-start gap-2.5 rounded-xl border px-4 py-3 text-left text-sm transition disabled:cursor-default ${
                  showCorrect
                    ? 'border-green-500 bg-green-50 text-green-900'
                    : showWrong
                      ? 'border-red-400 bg-red-50 text-red-900'
                      : isPicked
                        ? 'border-accent bg-accent/5 text-ink'
                        : 'border-line bg-paper text-ink hover:border-accent'
                }`}
              >
                <span className="font-bold shrink-0">{opt.key}.</span>
                <span className="flex-1">{opt.text}</span>
                {showCorrect && <Check size={16} className="shrink-0 text-green-600 mt-0.5" />}
                {showWrong && <X size={16} className="shrink-0 text-red-500 mt-0.5" />}
              </button>
            );
          })}
        </div>

        {reveal && (
          <p className={`mt-4 text-sm font-medium ${pickedKey === current.answer ? 'text-green-700' : 'text-red-700'}`}>
            {pickedKey === current.answer
              ? 'Correct ✓'
              : `Not quite — the answer is ${current.answer}.`}
          </p>
        )}
      </div>

      {/* Navigation */}
      <div className="flex justify-between">
        <button
          onClick={() => setQIndex(i => Math.max(0, i - 1))}
          disabled={qIndex === 0}
          className="rounded-xl border border-line px-4 py-2 text-sm font-medium disabled:opacity-40"
        >
          Previous
        </button>
        {qIndex < mcqs.length - 1 ? (
          <button
            onClick={() => setQIndex(i => i + 1)}
            className="flex items-center gap-1 rounded-xl bg-accent text-white px-4 py-2 text-sm font-medium hover:bg-accent/90"
          >
            Next <ChevronRight size={15} />
          </button>
        ) : (
          <button
            onClick={() => setFinished(true)}
            disabled={answered < mcqs.length}
            className="rounded-xl bg-green-600 text-white px-4 py-2 text-sm font-medium hover:bg-green-700 disabled:opacity-40"
          >
            Finish ({answered}/{mcqs.length} answered)
          </button>
        )}
      </div>
    </div>
  );
}
