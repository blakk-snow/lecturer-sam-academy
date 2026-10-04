import { useState } from "react";
import { Button } from "../ui/Button";

export function WorkedExample({ question, steps }) {
  const [visible, setVisible] = useState(0);
  return (
    <div className="space-y-4">
      <p className="font-medium leading-relaxed">{question}</p>
      <ol className="space-y-3">
        {steps.slice(0, visible).map((step, index) => (
          <li key={step} className="rounded-xl border border-line bg-paper/80 p-4">
            <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-accent">
              Step {index + 1}
            </p>
            <p className="leading-relaxed">{step}</p>
          </li>
        ))}
      </ol>
      {visible < steps.length ? (
        <Button onClick={() => setVisible((count) => count + 1)}>
          Reveal step {visible + 1}
        </Button>
      ) : (
        <p className="text-sm text-ink-soft">All steps are visible. Continue when you are ready.</p>
      )}
    </div>
  );
}
