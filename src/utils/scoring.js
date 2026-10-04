export function scoreAttempts(results) {
  if (!results.length) return { correct: 0, total: 0, percentage: 0 };
  const correct = results.filter((item) => item.correct).length;
  const total = results.length;
  return {
    correct,
    total,
    percentage: Math.round((correct / total) * 100),
  };
}

export function combineMastery(parts) {
  const usable = parts.filter((value) => Number.isFinite(value));
  if (!usable.length) return 0;
  return Math.round(usable.reduce((sum, value) => sum + value, 0) / usable.length);
}
