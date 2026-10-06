import { useState } from 'react';
import { AlertTriangle, BookOpen, CalendarDays } from 'lucide-react';
import scheme from '../data/schemeOfLearning.json';

const CLASSES = ['Basic 7', 'Basic 8'];
const SUBJECTS = ['Mathematics', 'Science'];
const TERMS = [1, 2, 3];

function getRows(grade, subject, term) {
  return scheme.weekGrids.find(grid =>
    grid.grade === grade && grid.subject === subject && grid.term === term
  )?.rows ?? [];
}

function SourceErrata() {
  return (
    <details className="rounded-2xl border border-warn/30 bg-warn/5">
      <summary className="cursor-pointer px-4 py-3 font-medium text-ink">
        Source notes and flagged discrepancies
      </summary>
      <div className="space-y-5 border-t border-warn/20 px-4 py-4">
        <ul className="list-disc space-y-1 pl-5 text-sm leading-relaxed text-ink-soft">
          {scheme.errata.sourceNotes.map(note => <li key={note}>{note}</li>)}
        </ul>

        <div>
          <h3 className="mb-2 text-sm font-semibold">Indicator codes the source says are missing</h3>
          <div className="space-y-2">
            {scheme.errata.missingIndicators.map(([code, subject, location, note]) => (
              <p key={code} className="rounded-lg bg-card px-3 py-2 text-sm text-ink">
                <span className="font-mono font-semibold">{code}</span>
                <span className="text-ink-soft"> · {subject}, {location} — {note}</span>
              </p>
            ))}
          </div>
        </div>

        <div>
          <h3 className="mb-2 text-sm font-semibold">Printing corrections recorded in the source</h3>
          <div className="space-y-2">
            {scheme.errata.correctedPrintingErrors.map(([printed, corrected, location]) => (
              <p key={printed} className="rounded-lg bg-card px-3 py-2 text-sm text-ink">
                <span className="font-mono">{printed}</span>
                <span className="text-ink-soft"> → </span>
                <span className="font-mono font-semibold">{corrected}</span>
                <span className="text-ink-soft"> · {location}</span>
              </p>
            ))}
          </div>
        </div>

        <div>
          <h3 className="mb-2 text-sm font-semibold">Resource-column issues</h3>
          <div className="space-y-2">
            {scheme.errata.resourceIssues.map(([location, note]) => (
              <p key={location} className="rounded-lg bg-card px-3 py-2 text-sm leading-relaxed text-ink">
                <span className="font-semibold">{location}: </span>{note}
              </p>
            ))}
          </div>
        </div>
      </div>
    </details>
  );
}

export default function SchemeOfLearning() {
  const [grade, setGrade] = useState('Basic 7');
  const [subject, setSubject] = useState('Mathematics');
  const [term, setTerm] = useState(1);
  const [week, setWeek] = useState(1);
  const rows = getRows(grade, subject, term);
  const weeks = [...new Set(rows.map(row => row.week))];
  const selectedRows = rows.filter(row => row.week === week);
  const details = scheme.expandedWeeks.filter(entry =>
    entry.grade === grade &&
    entry.subject === subject &&
    entry.term === term &&
    entry.week === week
  );
  const weekRowsCount = scheme.weekGrids.reduce((total, grid) => total + grid.rows.length, 0);

  function renderContent(paragraph, index) {
    const isListItem = paragraph.style === 'List Bullet';
    const isContinuation = paragraph.style === 'Heading continuation';
    return (
      <p
        key={`${index}-${paragraph.text.slice(0, 24)}`}
        className={`text-sm leading-relaxed ${
          isListItem ? 'border-l-2 border-accent/20 pl-3 text-ink-soft' : ''
        } ${isContinuation ? 'font-medium text-ink-soft' : 'text-ink'}`}
      >
        {paragraph.text}
      </p>
    );
  }

  return (
    <div className="space-y-6">
      <header className="space-y-2">
        <p className="text-xs font-bold uppercase tracking-[0.2em] text-accent">
          {scheme.metadata.academicYear} academic year
        </p>
        <h1 className="font-serif text-3xl">Scheme of Learning</h1>
        <p className="max-w-3xl text-sm leading-relaxed text-ink-soft">
          {scheme.metadata.coverage} Choose a class, subject, term, and week to view
          the printed scheme alongside its expanded curriculum content.
        </p>
        <p className="text-xs text-ink-soft">
          {weekRowsCount} week rows across {scheme.weekGrids.length} class, subject, and term schedules · Available offline
        </p>
      </header>

      <section className="rounded-2xl border border-line bg-card p-4 sm:p-5">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <label className="space-y-1 text-xs font-medium text-ink-soft">
            <span>Class</span>
            <select
              value={grade}
              onChange={event => { setGrade(event.target.value); setWeek(1); }}
              className="w-full rounded-lg border border-line bg-paper px-3 py-2 text-sm text-ink"
            >
              {CLASSES.map(item => <option key={item} value={item}>{item}</option>)}
            </select>
          </label>
          <label className="space-y-1 text-xs font-medium text-ink-soft">
            <span>Subject</span>
            <select
              value={subject}
              onChange={event => { setSubject(event.target.value); setWeek(1); }}
              className="w-full rounded-lg border border-line bg-paper px-3 py-2 text-sm text-ink"
            >
              {SUBJECTS.map(item => <option key={item} value={item}>{item}</option>)}
            </select>
          </label>
          <label className="space-y-1 text-xs font-medium text-ink-soft">
            <span>Term</span>
            <select
              value={term}
              onChange={event => { setTerm(Number(event.target.value)); setWeek(1); }}
              className="w-full rounded-lg border border-line bg-paper px-3 py-2 text-sm text-ink"
            >
              {TERMS.map(item => <option key={item} value={item}>Term {item}</option>)}
            </select>
          </label>
          <label className="space-y-1 text-xs font-medium text-ink-soft">
            <span>Week</span>
            <select
              value={week}
              onChange={event => setWeek(Number(event.target.value))}
              className="w-full rounded-lg border border-line bg-paper px-3 py-2 text-sm text-ink"
            >
              {weeks.map(item => <option key={item} value={item}>Week {item}</option>)}
            </select>
          </label>
        </div>
      </section>

      <div className="flex items-center gap-2 text-sm text-ink-soft">
        <CalendarDays size={17} className="text-accent" />
        <span>{grade} · {subject} · Term {term} · Week {week}</span>
      </div>

      {selectedRows.map((row, index) => {
        const expanded = details[index];
        return (
          <article key={`${row.week}-${index}`} className="overflow-hidden rounded-2xl border border-line bg-card">
            <div className="border-b border-line bg-paper/70 px-4 py-3">
              <h2 className="font-serif text-xl">{expanded?.topic ?? `Week ${week}`}</h2>
              {selectedRows.length > 1 && (
                <p className="mt-1 text-xs text-ink-soft">Source row {index + 1} of {selectedRows.length} for this week</p>
              )}
            </div>
            <div className="space-y-4 p-4 sm:p-5">
              <dl className="grid gap-3 sm:grid-cols-2">
                {[
                  ['Strand', row.strand],
                  ['Sub-strand', row.subStrand],
                  ['Content standard', row.contentStandard],
                  ['Indicators', row.indicators],
                  ['Resources', row.resources],
                ].filter(([, value]) => value).map(([label, value]) => (
                  <div key={label} className="space-y-1">
                    <dt className="text-xs font-semibold uppercase tracking-wide text-ink-soft">{label}</dt>
                    <dd className="text-sm leading-relaxed text-ink">{value}</dd>
                  </div>
                ))}
              </dl>

              {expanded?.content?.length > 0 && (
                <div className="space-y-2 border-t border-line pt-4">
                  <h3 className="flex items-center gap-2 text-sm font-semibold">
                    <BookOpen size={16} className="text-accent" />
                    Expanded curriculum details
                  </h3>
                  {expanded.content.map(renderContent)}
                </div>
              )}
            </div>
          </article>
        );
      })}

      <div className="flex gap-3 rounded-xl border border-warn/30 bg-warn/5 px-4 py-3 text-sm leading-relaxed text-ink">
        <AlertTriangle size={18} className="mt-0.5 shrink-0 text-warn" />
        <p>{scheme.metadata.notice}</p>
      </div>

      <SourceErrata />

      <footer className="border-t border-line pt-4 text-xs leading-relaxed text-ink-soft">
        Source: {scheme.metadata.source}
      </footer>
    </div>
  );
}
