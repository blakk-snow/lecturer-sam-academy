import { useState } from "react";
import { misconceptions } from "../../data/misconceptions";
import { recordAttempt } from "../../db/attempts";
import { checkQuestion } from "../../utils/validation";
import { Alert } from "../ui/Alert";
import { Button } from "../ui/Button";

export function QuestionCard({ question, onResolved }) {
  const [response, setResponse] = useState(question.type === "trueFalse" ? null : "");
  const [result, setResult] = useState(null);

  async function submit() {
    const checked = checkQuestion(question, response);
    const misconception = checked.misconceptionId
      ? misconceptions[checked.misconceptionId]
      : null;
    await recordAttempt({
      questionId: question.id,
      answer: response,
      correct: checked.correct,
      score: checked.correct ? 1 : 0,
      misconceptionId: checked.misconceptionId,
      topicId: question.topicId,
    });
    setResult({ ...checked, misconception });
    onResolved?.({ ...checked, misconception, answer: response, questionId: question.id });
  }

  function retry() {
    setResult(null);
    setResponse(question.type === "trueFalse" ? null : "");
  }

  const disabled =
    response === null ||
    response === undefined ||
    (typeof response === "string" && response.trim() === "");

  return (
    <div className="space-y-4">
      <p className="text-lg font-medium leading-relaxed">{question.question}</p>

      {question.type === "mcq" ? (
        <ul className="space-y-2">
          {question.options.map((option) => (
            <li key={option.id}>
              <label className="flex min-h-12 cursor-pointer items-center gap-3 rounded-xl border border-line bg-paper/70 px-4 py-3">
                <input
                  type="radio"
                  name={question.id}
                  value={option.id}
                  checked={response === option.id}
                  onChange={() => setResponse(option.id)}
                  disabled={Boolean(result)}
                />
                <span>{option.text}</span>
              </label>
            </li>
          ))}
        </ul>
      ) : null}

      {question.type === "trueFalse" ? (
        <div className="flex gap-2">
          {[true, false].map((value) => (
            <button
              key={String(value)}
              type="button"
              disabled={Boolean(result)}
              onClick={() => setResponse(value)}
              className={`min-h-12 flex-1 rounded-xl border font-semibold ${
                response === value
                  ? "border-accent bg-accent text-white"
                  : "border-line bg-card"
              }`}
            >
              {value ? "True" : "False"}
            </button>
          ))}
        </div>
      ) : null}

      {question.type === "numeric" || question.type === "fillBlank" ? (
        <input
          className="min-h-12 w-full rounded-xl border border-line bg-card px-4"
          inputMode={question.type === "numeric" ? "decimal" : "text"}
          value={response}
          disabled={Boolean(result)}
          onChange={(event) => setResponse(event.target.value)}
          aria-label="Your answer"
        />
      ) : null}

      {!result ? (
        <Button disabled={disabled} onClick={submit}>
          Check answer
        </Button>
      ) : (
        <div className="space-y-3">
          <Alert
            tone={result.correct ? "good" : "bad"}
            title={result.correct ? "Correct" : "Not yet"}
          >
            {result.correct
              ? question.explanation
              : result.misconception?.feedback ??
                "That answer does not match the idea in this lesson. Read the explanation and try again."}
          </Alert>
          {!result.correct ? (
            <p className="text-sm leading-relaxed text-ink-soft">{question.explanation}</p>
          ) : null}
          {!result.correct ? (
            <Button variant="secondary" onClick={retry}>
              Try again
            </Button>
          ) : null}
        </div>
      )}
    </div>
  );
}
