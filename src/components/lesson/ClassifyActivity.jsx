import { useState } from "react";
import { Button } from "../ui/Button";
import { Alert } from "../ui/Alert";

export function ClassifyActivity({ items, intro }) {
  const [choices, setChoices] = useState({});
  const [checked, setChecked] = useState(false);

  const allAnswered = items.every((item) => choices[item.id]);
  const correctCount = items.filter((item) => choices[item.id] === item.answer).length;

  return (
    <div className="space-y-4">
      {intro ? <p className="leading-relaxed text-ink-soft">{intro}</p> : null}
      <ul className="space-y-4">
        {items.map((item) => {
          const choice = choices[item.id];
          const isCorrect = checked && choice === item.answer;
          const isWrong = checked && choice && choice !== item.answer;
          return (
            <li key={item.id} className="rounded-xl border border-line bg-paper/70 p-4">
              <p className="mb-3 leading-relaxed">{item.statement}</p>
              <div className="flex flex-wrap gap-2">
                {["error", "misconception"].map((option) => (
                  <button
                    key={option}
                    type="button"
                    onClick={() => {
                      setChecked(false);
                      setChoices((current) => ({ ...current, [item.id]: option }));
                    }}
                    className={`min-h-11 rounded-lg border px-4 text-sm font-semibold capitalize ${
                      choice === option
                        ? "border-accent bg-accent text-white"
                        : "border-line bg-card text-ink"
                    }`}
                  >
                    {option}
                  </button>
                ))}
              </div>
              {isCorrect ? (
                <p className="mt-2 text-sm text-good">That classification fits.</p>
              ) : null}
              {isWrong ? (
                <p className="mt-2 text-sm text-bad">
                  Look again — this is better read as a {item.answer}.
                </p>
              ) : null}
            </li>
          );
        })}
      </ul>
      <Button disabled={!allAnswered} onClick={() => setChecked(true)}>
        Check classifications
      </Button>
      {checked ? (
        <Alert tone={correctCount === items.length ? "good" : "warn"} title="Your reading">
          {correctCount} of {items.length} classified in a way that matches the lesson.
        </Alert>
      ) : null}
    </div>
  );
}
