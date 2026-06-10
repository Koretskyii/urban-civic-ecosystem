interface SpinnerProps {
  label?: string;
  className?: string;
}

export function Spinner({ label, className }: SpinnerProps) {
  return (
    <div
      className={`flex flex-col items-center justify-center gap-3 py-12 text-sm text-[var(--muted-foreground)] ${className ?? ''}`}
      role="status"
      aria-live="polite"
    >
      <span className="h-7 w-7 animate-spin rounded-full border-2 border-[var(--primary)]/30 border-t-[var(--primary)]" />
      {label ? <span>{label}</span> : null}
    </div>
  );
}
