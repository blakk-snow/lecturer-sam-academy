import { useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "../components/ui/Button";
import { Card } from "../components/ui/Card";
import { ProgressBar } from "../components/ui/ProgressBar";
import { MasteryList } from "../components/progress/MasteryList";
import { useProgress } from "../hooks/useProgress";
import { useStudent } from "../context/StudentContext";
import { getUnit } from "../data/units";

export default function Dashboard() {
  const { student, ready } = useStudent();
  const navigate = useNavigate();
  const { coursePercent, continueLesson, topicMastery, recentResults } = useProgress();

  useEffect(() => {
    if (ready && !student) navigate("/profile");
  }, [ready, student, navigate]);

  const unit = continueLesson ? getUnit(continueLesson.unitId) : null;

  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm text-ink-soft">Welcome back{student?.name ? `, ${student.name}` : ""}</p>
        <h1 className="font-serif text-3xl">Your progress</h1>
      </div>

      <Card>
        <p className="text-xs uppercase tracking-wide text-accent">Continue learning</p>
        <h2 className="mt-1 font-serif text-2xl">{continueLesson?.title ?? "Error versus misconception"}</h2>
        <p className="mt-1 text-sm text-ink-soft">{unit?.title}</p>
        <Link to={`/lesson/${continueLesson?.id ?? "u1-s1-l1"}`} className="mt-4 inline-block">
          <Button>Continue</Button>
        </Link>
      </Card>

      <Card>
        <ProgressBar value={coursePercent} label="Course progress" />
        <p className="mt-3 text-sm text-ink-soft">Current unit · {unit?.title ?? "Unit 1 — Number and Numeration Systems"}</p>
      </Card>

      <Card>
        <h2 className="mb-4 font-serif text-xl">Your mastery</h2>
        <MasteryList items={topicMastery} />
      </Card>

      <Card>
        <h2 className="mb-3 font-serif text-xl">Recent results</h2>
        {recentResults.length ? (
          <ul className="space-y-2 text-sm">
            {recentResults.map((item) => (
              <li key={item.id} className="flex justify-between gap-3">
                <span>{item.title}</span>
                <span className="font-semibold">{item.percentage}%</span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-ink-soft">No quizzes yet. Finish Section 1 to see a score here.</p>
        )}
      </Card>
    </div>
  );
}
