import { ReactNode } from 'react';

export default function InfoRow({
  icon,
  label,
  value,
}: {
  icon: ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-lg border border-black/10 bg-[var(--surface-2)] px-3 py-2">
      <div className="mb-1 flex items-center gap-2 text-xs font-semibold text-[var(--muted-foreground)]">
        {icon}
        {label}
      </div>
      <p className="text-sm text-[var(--primary)]">{value}</p>
    </div>
  );
}
