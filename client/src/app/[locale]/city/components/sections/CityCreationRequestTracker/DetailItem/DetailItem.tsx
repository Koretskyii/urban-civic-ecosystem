export function DetailItem({
  label,
  value,
}: {
  label: string;
  value?: string | null;
}) {
  return (
    <div className="rounded-md border border-black/10 px-3 py-2">
      <dt className="text-xs font-semibold uppercase text-[var(--primary-light)]">
        {label}
      </dt>
      <dd className="mt-1 break-words text-[var(--primary)]">{value || '-'}</dd>
    </div>
  );
}
