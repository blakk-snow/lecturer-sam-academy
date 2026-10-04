export const MASTERY_BANDS = [
  { min: 0, max: 49, status: "Needs Support" },
  { min: 50, max: 69, status: "Developing" },
  { min: 70, max: 84, status: "Secure" },
  { min: 85, max: 100, status: "Mastered" },
];

export function masteryStatus(score) {
  const value = Math.max(0, Math.min(100, Number(score) || 0));
  const band = MASTERY_BANDS.find((item) => value >= item.min && value <= item.max);
  return band?.status ?? "Needs Support";
}

export function clampPercentage(value) {
  if (!Number.isFinite(value)) return 0;
  return Math.max(0, Math.min(100, Math.round(value)));
}
