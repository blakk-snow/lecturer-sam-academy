import { Link } from "react-router-dom";
import { ProgressBar } from "../ui/ProgressBar";
import { Button } from "../ui/Button";

export function UnitCard({ unit, progress = 0 }) {
  const locked = !unit.available;
  return (
    <article className="flex h-full flex-col rounded-2xl border border-line bg-card p-5">
      <p className="font-serif text-3xl text-accent">{String(unit.number).padStart(2, "0")}</p>
      <h2 className="mt-2 font-serif text-xl">{unit.title}</h2>
      <p className="mt-2 flex-1 text-sm leading-relaxed text-ink-soft">{unit.shortDescription}</p>
      <p className="mt-3 text-sm text-ink-soft">
        {unit.sections.length ? `${unit.sections.length} topics` : "Coming after Unit 1"}
      </p>
      <div className="mt-3">
        <ProgressBar value={locked ? 0 : progress} />
      </div>
      <div className="mt-4">
        {locked ? (
          <Button className="w-full" disabled>
            Coming soon
          </Button>
        ) : (
          <Link to={`/course/${unit.id}`} className="block">
            <Button className="w-full">Continue</Button>
          </Link>
        )}
      </div>
    </article>
  );
}
