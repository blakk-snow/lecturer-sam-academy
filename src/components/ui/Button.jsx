export function Button({
  children,
  variant = "primary",
  className = "",
  type = "button",
  ...props
}) {
  const styles = {
    primary:
      "bg-accent text-white hover:bg-accent-hover shadow-sm",
    secondary:
      "bg-card text-ink border border-line hover:bg-paper",
    ghost: "bg-transparent text-accent hover:bg-accent/10",
  };

  return (
    <button
      type={type}
      className={`inline-flex min-h-12 items-center justify-center gap-2 rounded-xl px-5 py-3 text-base font-semibold transition disabled:cursor-not-allowed disabled:opacity-50 ${styles[variant]} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}
