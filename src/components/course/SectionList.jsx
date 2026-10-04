import { Check, Circle, ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";
import { getLessonsBySection } from "../../data/lessons";
import { ProgressBar } from "../ui/ProgressBar";

export function SectionList({ unit, byLesson }) {
  return (
    <ol className="space-y-3">
      {unit.sections.map((section) => {
        const sectionLessons = getLessonsBySection(section.id);
        const completed = sectionLessons.filter((lesson) => byLesson[lesson.id]?.status === "completed").length;
        const percent = sectionLessons.length
          ? Math.round((completed / sectionLessons.length) * 100)
          : 0;
        const firstIncomplete =
          sectionLessons.find((lesson) => byLesson[lesson.id]?.status !== "completed") ??
          sectionLessons[0];
        const Icon = percent === 100 ? Check : percent > 0 ? ArrowRight : Circle;
        const body = (
          <div className="rounded-2xl border border-line bg-card p-4">
            <div className="flex items-start gap-3">
              <Icon className={section.available ? "text-accent" : "text-line"} size={20} />
              <div className="min-w-0 flex-1">
                <p className="font-semibold">{section.title}</p>
                <p className="text-sm text-ink-soft">
                  {section.available
                    ? `${sectionLessons.length} lessons · ${percent}% complete`
                    : "Available after Section 1"}
                </p>
                {section.available ? <div className="mt-2"><ProgressBar value={percent} /></div> : null}
              </div>
            </div>
          </div>
        );
        if (!section.available || !firstIncomplete) {
          return <li key={section.id}>{body}</li>;
        }
        return (
          <li key={section.id}>
            <Link to={`/lesson/${firstIncomplete.id}`} className="block">
              {body}
            </Link>
          </li>
        );
      })}
    </ol>
  );
}
