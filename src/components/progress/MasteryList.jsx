import { ProgressBar } from "../ui/ProgressBar";
import { masteryStatus } from "../../utils/mastery";

export function MasteryList({ items }) {
  return (
    <ul className="space-y-4">
      {items.map((item) => (
        <li key={item.sectionId}>
          <ProgressBar
            value={item.mastery}
            label={`${item.title} · ${item.status ?? masteryStatus(item.mastery)}`}
          />
        </li>
      ))}
    </ul>
  );
}
