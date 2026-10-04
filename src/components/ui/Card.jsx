export function Card({ children, className = "" }) {
  return (
    <section
      className={`rounded-2xl border border-line bg-card p-5 shadow-[0_1px_0_rgba(18,38,58,0.04)] ${className}`}
    >
      {children}
    </section>
  );
}
