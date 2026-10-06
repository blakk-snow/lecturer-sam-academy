import { useState } from "react";
import { Link } from "react-router-dom";
import { questions } from "../data/questions";
import { QuestionCard } from "../components/quiz/QuestionCard";
import { QuestionBankRunner } from "../components/quiz/QuestionBankRunner";
import { Card } from "../components/ui/Card";

const TABS = [
  { id: "course", label: "Course Practice" },
  { id: "bank", label: "BECE Question Bank" },
];

export default function Practice() {
  const [tab, setTab] = useState("course");
  const items = questions.filter((question) => question.topicId === "u1-s1");

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-serif text-3xl">Practice</h1>
        <p className="mt-2 text-ink-soft">
          Course exercises, plus the full BECE-style question bank parsed from the bundled mock papers.
        </p>
      </div>

      {/* Tabs */}
      <div className="flex rounded-xl border border-line bg-card p-1" role="tablist" aria-label="Practice mode">
        {TABS.map(t => (
          <button
            key={t.id}
            role="tab"
            aria-selected={tab === t.id}
            onClick={() => setTab(t.id)}
            className={`flex-1 rounded-lg px-3 py-2 text-sm font-medium transition ${
              tab === t.id ? "bg-accent text-white" : "text-ink-soft hover:text-ink"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === "course" ? (
        <>
          <p className="text-sm">
            Independent practice for Unit 1, Section 1. Feedback names likely mix-ups when it can.
            Prefer the guided path?{" "}
            <Link className="font-semibold text-accent" to="/lesson/u1-s1-l1">Open the first lesson</Link>.
          </p>
          {items.map((question, index) => (
            <Card key={question.id}>
              <p className="mb-3 text-xs uppercase tracking-wide text-ink-soft">Question {index + 1}</p>
              <QuestionCard question={question} />
            </Card>
          ))}
        </>
      ) : (
        <QuestionBankRunner />
      )}
    </div>
  );
}
