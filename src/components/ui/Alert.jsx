const tones = {
  info: "border-accent/30 bg-accent/8 text-ink",
  good: "border-good/30 bg-good/10 text-ink",
  warn: "border-warn/30 bg-warn/10 text-ink",
  bad: "border-bad/30 bg-bad/10 text-ink",
};

export function Alert({ tone = "info", title, children }) {
  return (
    <div className={`rounded-xl border px-4 py-3 ${tones[tone]}`} role="status">
      {title ? <p className="font-semibold">{title}</p> : null}
      <div className="mt-1 text-sm leading-relaxed">{children}</div>
    </div>
  );
}
