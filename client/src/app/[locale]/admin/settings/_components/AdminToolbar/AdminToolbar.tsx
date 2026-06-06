import type { ReactNode } from 'react';
import { useTranslations } from 'next-intl';

export function AdminToolbar({
  title,
  total,
  children,
}: {
  title: string;
  total?: number;
  children: ReactNode;
}) {
  const t = useTranslations();

  return (
    <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
      <div>
        <h2 className="text-xl font-semibold text-[var(--primary)]">{title}</h2>
        <p className="text-sm text-[var(--muted-foreground)]">
          {t('platformAdmin.total', { count: total ?? 0 })}
        </p>
      </div>
      <div className="flex flex-col gap-2 md:flex-row">{children}</div>
    </div>
  );
}
