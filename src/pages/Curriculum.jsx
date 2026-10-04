import { useState } from 'react';
import { ChevronDown, ChevronUp, GraduationCap } from 'lucide-react';
import { curriculum } from '../data/curriculumData';

function StandardCard({ standard }) {
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
            <li key={ind.id} className="px-4 py-3 flex gap-2">
              <span className="font-mono text-xs font-bold text-accent shrink-0 mt-0.5">{ind.code}</span>
              <span className="text-sm text-ink">{ind.description}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export default function Curriculum() {
  const [activeStrandId, setActiveStrandId] = useState(curriculum[0].id);
  const activeStrand = curriculum.find(s => s.id === activeStrandId);
  return (
    <div className="pb-24">
      {/* Header */}
      <div className="px-4 pt-6 pb-4">
        <div className="flex items-center gap-2 mb-1">
          <GraduationCap size={22} className="text-accent" />
          <h1 className="text-xl font-bold text-ink">Curriculum</h1>
        </div>
        <p className="text-sm text-ink-soft">Basic 7 Mathematics</p>
        <span className="mt-2 inline-block rounded-full bg-accent/10 text-accent text-xs px-3 py-1 font-medium">
          NaCCA Common Core Programme
        </span>
      </div>
      {/* Strand tabs */}
      <div className="flex gap-2 px-4 pb-4 overflow-x-auto scrollbar-none">
        {curriculum.map(strand => (
          <button
            key={strand.id}
            onClick={() => setActiveStrandId(strand.id)}
            className={`shrink-0 rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${
              strand.id === activeStrandId
                ? 'bg-accent text-white'
                : 'bg-card border border-line text-ink-soft'
            }`}
          >
            {strand.title}
          </button>
        ))}
      </div>
      {/* Sub-strands and standards */}
      <div className="px-4 space-y-6">
        {activeStrand.subStrands.map(ss => (
          <section key={ss.id}>
            <h2 className="text-xs font-semibold text-ink-soft uppercase tracking-wide mb-3">
              {ss.code} · {ss.title}
            </h2>
            <div className="space-y-2">
              {ss.contentStandards.map(std => (
                <StandardCard key={std.id} standard={std} />
              ))}
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}
