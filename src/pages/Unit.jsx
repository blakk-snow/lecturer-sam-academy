import { Link, useParams } from "react-router-dom";
import { getUnit } from "../data/units";
import { SectionList } from "../components/course/SectionList";
import { useProgress } from "../hooks/useProgress";
import { lessons } from "../data/lessons";
import { ProgressBar } from "../components/ui/ProgressBar";

export default function Unit() {
  const { unitId } = useParams();
  const unit = getUnit(unitId);
  const { byLesson } = useProgress();

  if (!unit) {
    return <p>That unit was not found.</p>;
  }

  const unitLessons = lessons.filter((lesson) => lesson.unitId === unit.id);
  const done = unitLessons.filter((lesson) => byLesson[lesson.id]?.status === "completed").length;
  const percent = unitLessons.length ? Math.round((done / unitLessons.length) * 100) : 0;

  return (
    <div className="space-y-6">
      <Link to="/course" className="text-sm font-semibold text-accent">
        ← Course
      </Link>
      <div>
        <p className="text-sm uppercase tracking-wide text-accent">Unit {unit.number}</p>
        <h1 className="font-serif text-3xl">{unit.title}</h1>
        <p className="mt-2 text-ink-soft">{unit.shortDescription}</p>
      </div>
      <ProgressBar value={percent} label="Unit progress" />
      <div>
        <h2 className="mb-3 font-serif text-xl">Course objectives</h2>
        <SectionList unit={unit} byLesson={byLesson} />
      </div>
    </div>
  );
}
