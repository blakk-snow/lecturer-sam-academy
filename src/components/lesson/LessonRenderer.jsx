import { useEffect, useMemo, useState } from "react";
import { getQuestion, getQuestions } from "../../data/questions";
import { completeLesson, touchLesson } from "../../db/progress";
import { ClassifyActivity } from "./ClassifyActivity";
import { WorkedExample } from "./WorkedExample";
import { QuestionCard } from "../quiz/QuestionCard";
import { Button } from "../ui/Button";
import { Card } from "../ui/Card";

function buildStages(lesson) {
  const stages = [
    {
      id: "objectives",
      title: "Learning objectives",
      render: () => (
        <ul className="space-y-2">
          {lesson.objectives.map((item) => (
            <li key={item} className="flex gap-2">
              <span className="text-accent">✓</span>
              <span>{item}</span>
            </li>
          ))}
        </ul>
      ),
    },
  ];

  lesson.sections.forEach((block, index) => {
    stages.push({
      id: `${block.type}-${index}`,
      title: block.title,
      block,
    });
  });

  return stages;
}

export function LessonRenderer({ lesson, onOpenQuiz }) {
  const stages = useMemo(() => buildStages(lesson), [lesson]);
  const [index, setIndex] = useState(0);
  const [practiceResults, setPracticeResults] = useState({});
  const [reflections, setReflections] = useState("");
  const stage = stages[index];
  const progress = Math.round(((index + 1) / stages.length) * 100);

  useEffect(() => {
    touchLesson(lesson.id);
  }, [lesson.id]);

  useEffect(() => {
    setIndex(0);
    setPracticeResults({});
    setReflections("");
  }, [lesson.id]);

  async function goNext() {
    if (index < stages.length - 1) {
      setIndex((value) => value + 1);
      return;
    }
    const values = Object.values(practiceResults);
    const percentage = values.length
      ? Math.round((values.filter(Boolean).length / values.length) * 100)
      : 80;
    await completeLesson(lesson.id, percentage);
    if (lesson.quizId) {
      onOpenQuiz(lesson.quizId);
    }
  }

  function renderBlock(block) {
    if (!block) return null;
    if (block.type === "think-back") {
      return (
        <div className="space-y-3">
          <p className="leading-relaxed">{block.prompt}</p>
          <ul className="space-y-2">
            {block.options.map((option) => (
              <li key={option}>
                <label className="flex min-h-12 items-start gap-3 rounded-xl border border-line bg-paper/70 px-4 py-3">
                  <input type="radio" name={`${lesson.id}-think`} />
                  <span>{option}</span>
                </label>
              </li>
            ))}
          </ul>
          <p className="text-sm leading-relaxed text-ink-soft">{block.note}</p>
        </div>
      );
    }
    if (block.type === "observe") {
      return <ClassifyActivity items={block.items} intro={block.intro} />;
    }
    if (block.type === "explanation") {
      return <p className="leading-relaxed">{block.content}</p>;
    }
    if (block.type === "example") {
      return <WorkedExample question={block.question} steps={block.steps} />;
    }
    if (block.type === "try") {
      const question = getQuestion(block.questionId);
      return (
        <QuestionCard
          key={question.id}
          question={question}
          onResolved={(result) =>
            setPracticeResults((current) => ({ ...current, [result.questionId]: result.correct }))
          }
        />
      );
    }
    if (block.type === "practise") {
      const items = getQuestions(block.questionIds);
      return (
        <div className="space-y-6">
          {items.map((question) => (
            <div key={question.id} className="border-t border-line pt-4 first:border-t-0 first:pt-0">
              <QuestionCard
                question={question}
                onResolved={(result) =>
                  setPracticeResults((current) => ({
                    ...current,
                    [result.questionId]: result.correct,
                  }))
                }
              />
            </div>
          ))}
        </div>
      );
    }
    if (block.type === "reflect") {
      return (
        <label className="block space-y-2">
          <span className="leading-relaxed">{block.prompt}</span>
          <textarea
            className="min-h-28 w-full rounded-xl border border-line bg-card p-3"
            value={reflections}
            onChange={(event) => setReflections(event.target.value)}
          />
        </label>
      );
    }
    return null;
  }

  const last = index === stages.length - 1;

  return (
    <div className="space-y-5">
      <Card>
        <p className="mb-1 text-xs uppercase tracking-wide text-accent">{stage.title}</p>
        {stage.render ? stage.render() : renderBlock(stage.block)}
      </Card>
      <div className="flex gap-3">
        <Button
          variant="secondary"
          disabled={index === 0}
          onClick={() => setIndex((value) => Math.max(0, value - 1))}
        >
          Back
        </Button>
        <Button className="flex-1" onClick={goNext}>
          {last && lesson.quizId
            ? "Master it — start quiz"
            : last
              ? "Complete lesson"
              : "Continue"}
        </Button>
      </div>
      <p className="sr-only">Lesson stage {index + 1} of {stages.length}, {progress} percent</p>
    </div>
  );
}
