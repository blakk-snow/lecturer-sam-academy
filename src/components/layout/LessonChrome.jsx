import { ChevronLeft, ChevronRight } from "lucide-react";
import { Link } from "react-router-dom";
import { ProgressBar } from "../ui/ProgressBar";

export function LessonChrome({ prev, next, progress, title }) {
  return (
    <div className="mb-6 flex items-center gap-3">
      {prev ? (
        <Link
          to={`/lesson/${prev.id}`}
          className="inline-flex min-h-11 min-w-11 items-center justify-center rounded-xl border border-line bg-card text-ink"
          aria-label={`Previous: ${prev.title}`}
        >
          <ChevronLeft size={20} />
        </Link>
      ) : (
        <span className="inline-flex min-h-11 min-w-11 items-center justify-center rounded-xl border border-transparent text-line">
          <ChevronLeft size={20} />
        </span>
      )}
      <div className="min-w-0 flex-1">
        <p className="truncate text-xs uppercase tracking-wide text-ink-soft">{title}</p>
        <ProgressBar value={progress} />
      </div>
      {next ? (
        <Link
          to={`/lesson/${next.id}`}
          className="inline-flex min-h-11 min-w-11 items-center justify-center rounded-xl border border-line bg-card text-ink"
          aria-label={`Next: ${next.title}`}
        >
          <ChevronRight size={20} />
        </Link>
      ) : (
        <span className="inline-flex min-h-11 min-w-11 items-center justify-center rounded-xl border border-transparent text-line">
          <ChevronRight size={20} />
        </span>
      )}
    </div>
  );
}
