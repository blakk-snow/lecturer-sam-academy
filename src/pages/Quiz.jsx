import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { QuestionCard } from "../components/quiz/QuestionCard";
import { Button } from "../components/ui/Button";
import { ProgressBar } from "../components/ui/ProgressBar";
import { useQuiz } from "../hooks/useQuiz";
import { saveQuizResult } from "../db/attempts";
import { completeLesson, touchLesson } from "../db/progress";
import { getLessonsBySection } from "../data/lessons";
import { scoreAttempts } from "../utils/scoring";

export default function Quiz() {
  const { quizId } = useParams();
  const navigate = useNavigate();
  const { quiz, questions } = useQuiz(quizId);
  const [index, setIndex] = useState(0);
  const [results, setResults] = useState({});
  const [locked, setLocked] = useState(false);

  if (!quiz) {
    return <p>That quiz was not found.</p>;
  }

  const question = questions[index];
  const answered = results[question?.id] !== undefined;

  async function finish(nextResults) {
    const scored = scoreAttempts(Object.values(nextResults).map((correct) => ({ correct })));
    const resultId = await saveQuizResult({
      quizId: quiz.id,
      score: scored.correct,
      percentage: scored.percentage,
    });
    const sectionLessons = getLessonsBySection(quiz.sectionId);
    const last = sectionLessons[sectionLessons.length - 1];
    if (last) {
      await completeLesson(last.id, scored.percentage);
    }
    await touchLesson(last?.id ?? sectionLessons[0]?.id, {
      status: "completed",
      mastery: scored.percentage,
      percentage: scored.percentage,
    });
    navigate(`/results/${resultId}`);
  }

  function onResolved(result) {
    setResults((current) => ({ ...current, [result.questionId]: result.correct }));
    setLocked(true);
  }

  async function goNext() {
    if (index < questions.length - 1) {
      setIndex((value) => value + 1);
      setLocked(false);
      return;
    }
    await finish({ ...results });
  }

  return (
    <div className="space-y-5">
      <div>
        <p className="text-sm uppercase tracking-wide text-accent">Mastery check</p>
        <h1 className="font-serif text-3xl">{quiz.title}</h1>
      </div>
      <ProgressBar value={((index + (answered ? 1 : 0)) / questions.length) * 100} label={`Question ${index + 1} of ${questions.length}`} />
      {question ? (
        <div className="rounded-2xl border border-line bg-card p-5">
          <QuestionCard key={question.id} question={question} onResolved={onResolved} />
        </div>
      ) : null}
      <Button className="w-full" disabled={!locked} onClick={goNext}>
        {index === questions.length - 1 ? "See results" : "Next question"}
      </Button>
    </div>
  );
}
