import { Link } from "react-router-dom";
import { questions } from "../data/questions";
import { QuestionCard } from "../components/quiz/QuestionCard";
import { Card } from "../components/ui/Card";

export default function Practice() {
  const items = questions.filter((question) => question.topicId === "u1-s1");

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-serif text-3xl">Practice</h1>
        <p className="mt-2 text-ink-soft">
          Independent practice for Unit 1, Section 1. Feedback names likely mix-ups when it can.
        </p>
        <p className="mt-2 text-sm">
          Prefer the guided path? <Link className="font-semibold text-accent" to="/lesson/u1-s1-l1">Open the first lesson</Link>.
        </p>
      </div>
      {items.map((question, index) => (
        <Card key={question.id}>
          <p className="mb-3 text-xs uppercase tracking-wide text-ink-soft">Question {index + 1}</p>
          <QuestionCard question={question} />
        </Card>
      ))}
    </div>
  );
}
