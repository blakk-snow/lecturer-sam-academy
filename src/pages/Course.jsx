import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { BookOpen, FileText, GraduationCap, Loader2, Target } from 'lucide-react';
import { libraryManifest, loadEntries } from '../data/courseLibrary';

// curriculumData is ~600 KB — load lazily, only needed on this page.
const curriculumPromise = import('../data/curriculumData');

const normalizeCode = (code) => (code ?? '').replace(/\/JHS\d+/g, '').toUpperCase();
const safeCode = (code) => (code ?? '').replaceAll('/', '_');

/**
 * Course.jsx — curriculum-driven Course Library
 *
 * Subject → class → strand → content standard → indicator. Indicators with
 * uploaded notes/questions link to the detail page; the original
 * hand-authored "Number & Algebra" course remains at /course/legacy.
 */
export default function Course() {
  const [curriculum, setCurriculum] = useState(null); // { subjects, map }
  const [subjectId, setSubjectId] = useState(libraryManifest[0]?.subjectId ?? null);
  const [classId, setClassId] = useState(null);
  const [entriesByCode, setEntriesByCode] = useState(undefined); // normalized code → entry

  useEffect(() => {
    curriculumPromise.then(m => setCurriculum({ subjects: m.subjects, map: m.curriculumMap }));
  }, []);

  const classesFor = useMemo(
    () => libraryManifest.filter(m => m.subjectId === subjectId).map(m => m.classId).sort(),
    [subjectId],
  );

  useEffect(() => {
    setClassId(prev => (classesFor.includes(prev) ? prev : classesFor[0] ?? null));
  }, [classesFor]);

  useEffect(() => {
    if (!subjectId || !classId) { setEntriesByCode({}); return; }
    setEntriesByCode(undefined);
    loadEntries(subjectId, classId)
      .then(list => setEntriesByCode(Object.fromEntries(list.map(e => [normalizeCode(e.code), e]))))
      .catch(() => setEntriesByCode({}));
  }, [subjectId, classId]);

  const strands = curriculum?.map?.[subjectId]?.[classId] ?? [];
  const totalEntries = libraryManifest.reduce((n, m) => n + m.entryCount, 0);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-serif text-3xl">Course Library</h1>
        <p className="mt-2 max-w-2xl text-ink-soft">
          Lesson notes and practice questions aligned to the NaCCA curriculum — {totalEntries} indicators with content.
        </p>
      </div>

      {/* Legacy course card */}
      <Link to="/course/legacy" className="block group">
        <section className="rounded-2xl border border-line bg-card p-5 transition-colors group-hover:border-accent/40">
          <div className="flex items-center gap-3">
            <div className="inline-flex rounded-lg bg-accent/10 p-2.5">
              <GraduationCap size={20} className="text-accent" />
            </div>
            <div>
              <h2 className="font-serif text-xl">Number &amp; Algebra — interactive course</h2>
              <p className="mt-1 text-sm text-ink-soft">
                The original guided course with worked examples, classify activities and mastery quizzes.
              </p>
            </div>
          </div>
        </section>
      </Link>

      {/* Subject + class pickers */}
      {curriculum && (
        <div className="space-y-3">
          <div className="flex gap-2 flex-wrap">
            {curriculum.subjects
              .filter(s => libraryManifest.some(m => m.subjectId === s.id))
              .map(s => (
                <button
                  key={s.id}
                  onClick={() => setSubjectId(s.id)}
                  className={`rounded-full px-4 py-1.5 text-sm font-medium border transition ${
                    subjectId === s.id ? 'bg-accent text-white border-accent' : 'border-line bg-card text-ink hover:border-accent'
                  }`}
                >
                  {s.label}
                </button>
              ))}
          </div>
          {classesFor.length > 0 && (
            <div className="flex gap-2 flex-wrap">
              {classesFor.map(cls => (
                <button
                  key={cls}
                  onClick={() => setClassId(cls)}
                  className={`rounded-full px-4 py-1.5 text-sm font-medium border transition ${
                    classId === cls ? 'bg-accent text-white border-accent' : 'border-line bg-card text-ink hover:border-accent'
                  }`}
                >
                  Basic {cls.slice(1)}
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Strands */}
      {entriesByCode === undefined ? (
        <div className="flex items-center gap-2 text-sm text-ink-soft py-10 justify-center">
          <Loader2 size={16} className="animate-spin" /> Loading library…
        </div>
      ) : strands.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-14 text-center gap-3">
          <BookOpen size={40} className="text-ink-soft/30" />
          <p className="text-sm text-ink-soft">
            No curriculum content for this subject and class yet.
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {strands.map(strand => (
            <section key={strand.id} className="space-y-3">
              <h2 className="font-serif text-xl text-ink">{strand.title}</h2>
              {strand.subStrands.map(ss => (
                <div key={ss.id} className="space-y-2">
                  <p className="text-sm font-semibold text-ink-soft">
                    <span className="font-mono text-accent">{ss.code}</span> {ss.title}
                  </p>
                  <div className="space-y-2">
                    {ss.contentStandards.map(cs => (
                      <div key={cs.id} className="rounded-xl border border-line bg-card p-4">
                        <p className="text-sm text-ink">
                          <span className="font-mono text-xs font-bold text-accent mr-1.5">{cs.code}</span>
                          {cs.description}
                        </p>
                        <ul className="mt-3 space-y-1.5">
                          {cs.indicators.map(ind => {
                            const entry = entriesByCode[normalizeCode(ind.code)];
                            const noteCount = entry?.notes ? 1 : 0;
                            const questionCount = entry?.questions?.length ?? 0;
                            const hasContent = noteCount > 0 || questionCount > 0;
                            const inner = (
                              <span className={`flex items-start gap-2 rounded-lg px-3 py-2 text-sm ${
                                hasContent ? 'bg-paper hover:border-accent border border-transparent' : 'bg-paper/50 text-ink-soft'
                              }`}>
                                <span className="font-mono font-bold text-accent text-xs shrink-0 mt-0.5">{ind.code}</span>
                                <span className="flex-1">{ind.description}</span>
                                <span className="shrink-0 flex gap-2 text-xs">
                                  {noteCount > 0 && (
                                    <span className="inline-flex items-center gap-1 text-ink-soft"><FileText size={13} /> notes</span>
                                  )}
                                  {questionCount > 0 && (
                                    <span className="inline-flex items-center gap-1 text-ink-soft"><Target size={13} /> {questionCount} q</span>
                                  )}
                                </span>
                              </span>
                            );
                            return (
                              <li key={ind.id}>
                                {hasContent ? (
                                  <Link to={`/library/${subjectId}/${classId}/${safeCode(ind.code)}`}>{inner}</Link>
                                ) : (
                                  inner
                                )}
                              </li>
                            );
                          })}
                        </ul>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </section>
          ))}
        </div>
      )}
    </div>
  );
}
