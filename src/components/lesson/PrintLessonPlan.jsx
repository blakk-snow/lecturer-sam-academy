/**
 * PrintLessonPlan.jsx — printable A4-style rendering of a lesson note
 *
 * Shown only when printing (`hidden print:block`); the browser's print
 * dialog saves it as a PDF. Layout mirrors the app's lesson-plan overview:
 * header, context grid, curriculum reference, then the teaching-method
 * steps (or the classic note fields when no method plan exists).
 */

import { Markdown } from '../chat/Markdown';

function SectionCard({ title, children }) {
  return (
    <section className="rounded-xl border border-line bg-card p-4 mb-3 break-inside-avoid">
      <p className="text-[11px] font-semibold uppercase tracking-widest text-ink-soft mb-2">{title}</p>
      {children}
    </section>
  );
}

function Field({ label, children }) {
  return (
    <div className="mb-2 break-inside-avoid">
      <p className="text-[10px] uppercase tracking-wide text-ink-soft">{label}</p>
      <div className="text-sm text-ink leading-relaxed">{children}</div>
    </div>
  );
}

export function PrintLessonPlan({
  subjectName,
  classLevel,
  termName,
  weekNumber,
  day,
  date,
  statusLabel,
  currDetails,
  sections,
  starter,
  mainLearning,
  plenary,
  resourceUrl,
  evaluation,
  homework,
}) {
  const hasSections = (sections ?? []).some(s => (s.content ?? '').trim());

  return (
    <div className="print-lesson-plan text-ink">
      {/* Title */}
      <div className="mb-4">
        <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-accent">
          Lecturer Sam Academy
        </p>
        <h1 className="font-serif text-2xl font-bold mt-1">Lesson Plan</h1>
      </div>

      {/* Context grid */}
      <section className="grid grid-cols-3 gap-x-4 mb-3 border border-line rounded-xl bg-card p-4 break-inside-avoid">
        {[
          ['Subject', subjectName ?? '—'],
          ['Class', classLevel ?? '—'],
          ['Term', termName ?? '—'],
          ['Week', weekNumber ?? '—'],
          ['Day', day || '—'],
          ['Date', date || '—'],
          ['Status', statusLabel ?? 'Draft'],
        ].map(([label, value]) => (
          <div key={label} className="mb-1.5">
            <p className="text-[10px] uppercase tracking-wide text-ink-soft">{label}</p>
            <p className="text-sm font-medium text-ink">{value}</p>
          </div>
        ))}
      </section>

      {/* Curriculum reference */}
      {currDetails && (
        <SectionCard title="Curriculum Reference">
          <Field label="Strand">{currDetails.strand.title}</Field>
          <Field label="Sub-Strand">
            <span className="font-mono text-xs text-accent mr-1">{currDetails.subStrand.code}</span>
            {currDetails.subStrand.title}
          </Field>
          <Field label="Content Standard">
            <span className="font-mono text-xs font-bold text-accent mr-1">{currDetails.contentStandard.code}</span>
            {currDetails.contentStandard.description}
          </Field>
          {currDetails.resolvedIndicators.length > 0 && (
            <div className="mb-2">
              <p className="text-[10px] uppercase tracking-wide text-ink-soft">Indicators</p>
              <ul className="space-y-1">
                {currDetails.resolvedIndicators.map(ind => (
                  <li key={ind.id} className="flex gap-2 items-start">
                    <span className="font-mono font-bold text-accent text-xs shrink-0 mt-0.5">{ind.code}</span>
                    <span className="text-sm text-ink leading-relaxed">{ind.description}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </SectionCard>
      )}

      {/* Teaching-method plan */}
      {hasSections ? (
        <SectionCard title="Lesson Development — Teaching Method">
          <ol className="space-y-3">
            {sections.map((section, i) => (
              <li key={section.key} className="break-inside-avoid">
                <p className="text-sm font-semibold text-ink">
                  <span className="text-accent font-bold mr-1.5">{i + 1}.</span>
                  {section.label}
                </p>
                {section.content ? (
                  <div className="mt-1 pl-5">
                    <Markdown text={section.content} />
                  </div>
                ) : (
                  <p className="mt-1 pl-5 text-sm text-ink-soft italic">—</p>
                )}
              </li>
            ))}
          </ol>
        </SectionCard>
      ) : (
        <>
          {starter && <SectionCard title="Starter"><Markdown text={starter} /></SectionCard>}
          {mainLearning && <SectionCard title="Main Learning"><Markdown text={mainLearning} /></SectionCard>}
          {plenary && <SectionCard title="Plenary"><Markdown text={plenary} /></SectionCard>}
          {resourceUrl && <SectionCard title="Resources"><p className="text-sm text-ink">{resourceUrl}</p></SectionCard>}
          {evaluation && <SectionCard title="Evaluation"><Markdown text={evaluation} /></SectionCard>}
          {homework && <SectionCard title="Homework"><Markdown text={homework} /></SectionCard>}
        </>
      )}

      {/* Footer */}
      <p className="text-[10px] text-ink-soft mt-6 pt-3 border-t border-line">
        Generated with Lecturer Sam Academy — NaCCA Common Core Programme ·{' '}
        {new Date().toLocaleDateString(undefined, { day: 'numeric', month: 'long', year: 'numeric' })}
      </p>
    </div>
  );
}
