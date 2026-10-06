import { Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { units } from "../data/units";
import { UnitCard } from "../components/course/UnitCard";
import { useProgress } from "../hooks/useProgress";
import { lessons } from "../data/lessons";
import { courseUploads } from "../data/courseUploads";

/**
 * LegacyCourse.jsx — the original hand-authored "Number & Algebra" course
 * (units → sections → interactive lessons). Kept intact and reachable from
 * the new curriculum-driven Course Library.
 */
export default function LegacyCourse() {
  const { byLesson } = useProgress();
  const unitProgress = Object.fromEntries(
    units.map((unit) => {
      const unitLessons = lessons.filter((lesson) => lesson.unitId === unit.id);
      if (!unitLessons.length) return [unit.id, 0];
      const done = unitLessons.filter((lesson) => byLesson[lesson.id]?.status === "completed").length;
      return [unit.id, Math.round((done / unitLessons.length) * 100)];
    }),
  );

  const subjects = [...new Set(courseUploads.map((item) => item.subject))];
  const classes = [...new Set(courseUploads.map((item) => item.classLevel))];
  const featuredUploads = courseUploads.slice(0, 5);

  return (
    <div className="space-y-6">
      <div>
        <Link to="/course" className="flex items-center gap-1 text-sm text-ink-soft hover:text-ink">
          <ArrowLeft size={15} /> Back to Course Library
        </Link>
        <h1 className="mt-3 font-serif text-3xl">Course</h1>
        <p className="mt-2 max-w-2xl text-ink-soft">
          Six units. This first release opens Unit 1, Section 1 — Meanings of Error and Misconceptions.
        </p>
      </div>

      <section className="rounded-2xl border border-success/30 bg-success/8 p-4 shadow-sm">
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-success">Curriculum uploads</p>
            <h2 className="mt-1 text-xl font-semibold text-ink">Uploaded markdown packs ready for the course engine</h2>
          </div>
          <div className="rounded-full bg-success/12 px-3 py-1 text-sm font-medium text-success">
            {courseUploads.length} files indexed
          </div>
        </div>

        <div className="mt-4 grid gap-3 md:grid-cols-3">
          <div className="rounded-xl border border-success/20 bg-white/60 p-3">
            <p className="text-xs uppercase tracking-[0.18em] text-ink-soft">Subjects</p>
            <p className="mt-2 text-2xl font-bold text-ink">{subjects.length}</p>
          </div>
          <div className="rounded-xl border border-success/20 bg-white/60 p-3">
            <p className="text-xs uppercase tracking-[0.18em] text-ink-soft">Classes</p>
            <p className="mt-2 text-2xl font-bold text-ink">{classes.length}</p>
          </div>
          <div className="rounded-xl border border-success/20 bg-white/60 p-3">
            <p className="text-xs uppercase tracking-[0.18em] text-ink-soft">Indicators linked</p>
            <p className="mt-2 text-2xl font-bold text-ink">
              {courseUploads.reduce((total, item) => total + item.indicators.length, 0)}
            </p>
          </div>
        </div>

        <div className="mt-4 space-y-2">
          {featuredUploads.map((upload) => (
            <div key={upload.id} className="flex flex-col gap-1 rounded-xl border border-success/20 bg-white/70 px-3 py-2 md:flex-row md:items-center md:justify-between">
              <div>
                <p className="font-medium text-ink">{upload.topic}</p>
                <p className="text-sm text-ink-soft">{upload.subject} · {upload.classLevel}</p>
              </div>
              <div className="flex gap-2 text-xs text-ink-soft md:justify-end">
                <span>{upload.fileName}</span>
                <span>•</span>
                <span>{upload.questionCount} questions</span>
              </div>
            </div>
          ))}
        </div>
      </section>

      <div className="grid gap-4 md:grid-cols-2">
        {units.map((unit) => (
          <UnitCard key={unit.id} unit={unit} progress={unitProgress[unit.id]} />
        ))}
      </div>
    </div>
  );
}
