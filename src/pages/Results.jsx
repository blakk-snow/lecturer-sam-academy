import { Link, useParams } from "react-router-dom";
import { useLiveQuery } from "dexie-react-hooks";
import { db } from "../db/database";
import { Button } from "../components/ui/Button";
import { Card } from "../components/ui/Card";
import { masteryStatus } from "../utils/mastery";
import { getQuiz } from "../data/quizzes";

export default function Results() {
  const { resultId } = useParams();
  const result = useLiveQuery(
    () => db.quizResults.get(Number(resultId)),
    [resultId],
  );
  const quiz = result ? getQuiz(result.quizId) : null;

  if (result === undefined) {
    return <p>Loading results…</p>;
  }
  if (!result) {
    return <p>Those results were not found.</p>;
  }

  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm uppercase tracking-wide text-accent">Quiz complete</p>
        <h1 className="font-serif text-3xl">{quiz?.title ?? "Results"}</h1>
      </div>
      <Card>
        <p className="font-serif text-5xl">{result.percentage}%</p>
        <p className="mt-2 text-lg">
          {result.score} correct · {masteryStatus(result.percentage)}
        </p>
        <p className="mt-3 text-sm leading-relaxed text-ink-soft">
          Completion is not the same as mastery. Use the dashboard to see how this section is settling, then continue or retry the ideas that still feel unstable.
        </p>
      </Card>
      <div className="flex flex-col gap-3 sm:flex-row">
        <Link to="/dashboard">
          <Button>View progress</Button>
        </Link>
        <Link to="/course/unit-1">
          <Button variant="secondary">Back to Unit 1</Button>
        </Link>
      </div>
    </div>
  );
}
