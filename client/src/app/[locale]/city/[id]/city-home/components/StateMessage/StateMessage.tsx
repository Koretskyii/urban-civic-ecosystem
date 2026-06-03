import type { StateMessageProps } from '../../types/CityHomeView.types';

export function StateMessage({ text, tone = 'muted' }: StateMessageProps) {
  return (
    <div
      className={`rounded-lg border px-3 py-6 text-center text-sm ${
        tone === 'danger'
          ? 'border-[var(--danger)]/20 bg-[var(--danger)]/5 text-[var(--danger-dark)]'
          : 'border-black/10 bg-[var(--surface-2)] text-[var(--muted-foreground)]'
      }`}
    >
      {text}
    </div>
  );
}
