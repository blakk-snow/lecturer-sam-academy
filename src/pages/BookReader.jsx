import { useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, BookOpen, ChevronLeft, ChevronRight, Loader2, PenLine } from 'lucide-react';
import { loadBook } from '../data/courseLibrary/bookIndex';
import { resolveBookBodyImages } from '../data/courseLibrary/bookImages';
import { Markdown } from '../components/chat/Markdown';
import { Button } from '../components/ui/Button';
import { useChat } from '../context/ChatContext';

const safeCode = (code) => (code ?? '').replaceAll('/', '_');
const isIndicator = (code) => (code ?? '').split('.').length >= 5;

/**
 * BookReader.jsx — chapter-by-chapter reader for the bundled NaCCA textbooks
 * (Learner's Books, Workbooks, Answer Books).
 */
export default function BookReader() {
  const { subjectId, classId, bookId } = useParams();
  const { openPanel, startLessonPlanFlow } = useChat();
  const [book, setBook] = useState(undefined);
  const [chapterIndex, setChapterIndex] = useState(0);
  const [body, setBody] = useState('');

  function planFromChapter() {
    const codes = chapter?.codes ?? [];
    if (!codes.length) return;
    startLessonPlanFlow({ subjectId, classId, indicatorCodes: codes });
    openPanel();
  }

  useEffect(() => {
    setBook(undefined);
    setChapterIndex(0);
    setBody('');
    loadBook(bookId).then(b => setBook(b ?? null));
  }, [bookId]);

  const chapter = book?.chapters?.[chapterIndex] ?? null;

  // Resolve figure references to bundled asset URLs for the current chapter.
  useEffect(() => {
    if (!chapter) { setBody(''); return; }
    let cancelled = false;
    setBody('');
    resolveBookBodyImages(chapter.body).then(resolved => {
      if (!cancelled) setBody(resolved);
    });
    return () => { cancelled = true; };
  }, [chapter]);

  const subjectLabel = useMemo(() => ({ english: 'English Language', mathematics: 'Mathematics', science: 'Science' }[subjectId] ?? subjectId), [subjectId]);

  if (book === undefined) {
    return (
      <div className="flex items-center gap-2 text-sm text-ink-soft py-16 justify-center">
        <Loader2 size={16} className="animate-spin" /> Loading book…
      </div>
    );
  }

  if (book === null) {
    return (
      <div className="py-12 text-center space-y-3">
        <p className="text-ink-soft">Book not found.</p>
        <Link to="/course" className="text-sm text-accent">← Back to the Course Library</Link>
      </div>
    );
  }

  return (
    <div className="space-y-4 pb-24">
      <Link to="/course" className="flex items-center gap-1 text-sm text-ink-soft hover:text-ink">
        <ArrowLeft size={15} /> Course Library
      </Link>

      {/* Book header */}
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div>
          <p className="text-xs uppercase tracking-wide text-ink-soft">{book.kindLabel}</p>
          <h1 className="font-serif text-2xl">{subjectLabel} — {book.classId}</h1>
          <p className="mt-1 text-sm text-ink-soft">{book.chapterCount} chapters</p>
        </div>
        <div className="inline-flex rounded-lg bg-accent/10 p-2">
          <BookOpen size={20} className="text-accent" />
        </div>
      </div>

      {/* Chapter navigation */}
      <div className="flex items-center gap-2">
        <button
          onClick={() => setChapterIndex(i => Math.max(0, i - 1))}
          disabled={chapterIndex === 0}
          className="p-2 rounded-xl border border-line text-ink hover:bg-paper disabled:opacity-40"
          aria-label="Previous chapter"
        >
          <ChevronLeft size={16} />
        </button>
        <select
          value={chapterIndex}
          onChange={e => setChapterIndex(Number(e.target.value))}
          className="flex-1 min-w-0 rounded-xl border border-line bg-paper px-3 py-2 text-sm text-ink focus:outline-none focus:border-accent"
          aria-label="Chapter"
        >
          {book.chapters.map((c, i) => (
            <option key={c.id} value={i}>Chapter {c.number}: {c.title}</option>
          ))}
        </select>
        <button
          onClick={() => setChapterIndex(i => Math.min(book.chapters.length - 1, i + 1))}
          disabled={chapterIndex >= book.chapters.length - 1}
          className="p-2 rounded-xl border border-line text-ink hover:bg-paper disabled:opacity-40"
          aria-label="Next chapter"
        >
          <ChevronRight size={16} />
        </button>
      </div>

      {chapter && (
        <>
          {/* Curriculum alignment */}
          <div className="rounded-xl border border-accent/30 bg-accent/5 p-4 space-y-2">
            <div className="flex items-start justify-between gap-3 flex-wrap">
              <p className="text-xs font-semibold text-accent uppercase tracking-widest">Curriculum alignment</p>
              {chapter.codes.length > 0 && (
                <Button onClick={planFromChapter} variant="secondary" className="text-xs px-3 py-1.5 min-h-0">
                  <PenLine size={14} /> Plan a lesson from this chapter
                </Button>
              )}
            </div>
            {chapter.strand && <p className="text-sm text-ink-soft">Strand: {chapter.strand}</p>}
            {chapter.codes.length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {chapter.codes.map(code => (
                  isIndicator(code) ? (
                    <Link
                      key={code}
                      to={`/library/${subjectId}/${classId}/${safeCode(code)}`}
                      className="rounded-full border border-accent/40 px-2.5 py-1 text-xs font-mono font-bold text-accent hover:bg-accent/10"
                    >
                      {code}
                    </Link>
                  ) : (
                    <span key={code} className="rounded-full border border-line px-2.5 py-1 text-xs font-mono text-ink-soft">
                      {code}
                    </span>
                  )
                ))}
              </div>
            )}
          </div>

          {/* Chapter body */}
          <article className="rounded-2xl border border-line bg-card p-5 md:p-8 space-y-3">
            {body ? <Markdown text={body} /> : (
              <div className="flex items-center gap-2 text-sm text-ink-soft py-8 justify-center">
                <Loader2 size={16} className="animate-spin" /> Rendering chapter…
              </div>
            )}
          </article>

          {/* Bottom nav */}
          <div className="flex justify-between">
            <button
              onClick={() => setChapterIndex(i => Math.max(0, i - 1))}
              disabled={chapterIndex === 0}
              className="flex items-center gap-1 rounded-xl border border-line px-4 py-2 text-sm font-medium disabled:opacity-40"
            >
              <ChevronLeft size={15} /> Previous chapter
            </button>
            {chapterIndex < book.chapters.length - 1 ? (
              <button
                onClick={() => setChapterIndex(i => i + 1)}
                className="flex items-center gap-1 rounded-xl bg-accent text-white px-4 py-2 text-sm font-medium hover:bg-accent/90"
              >
                Next chapter <ChevronRight size={15} />
              </button>
            ) : null}
          </div>
        </>
      )}
    </div>
  );
}
