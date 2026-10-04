import { units } from "../data/units";
import { UnitCard } from "../components/course/UnitCard";
import { useProgress } from "../hooks/useProgress";
import { lessons } from "../data/lessons";

export default function Course() {
  const { byLesson } = useProgress();
  const unitProgress = Object.fromEntries(
    units.map((unit) => {
      const unitLessons = lessons.filter((lesson) => lesson.unitId === unit.id);
      if (!unitLessons.length) return [unit.id, 0];
      const done = unitLessons.filter((lesson) => byLesson[lesson.id]?.status === "completed").length;
      return [unit.id, Math.round((done / unitLessons.length) * 100)];
    }),
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-serif text-3xl">Course</h1>
        <p className="mt-2 max-w-2xl text-ink-soft">
          Six units. This first release opens Unit 1, Section 1 — Meanings of Error and Misconceptions.
        </p>
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        {units.map((unit) => (
          <UnitCard key={unit.id} unit={unit} progress={unitProgress[unit.id]} />
        ))}
      </div>
    </div>
  );
}
