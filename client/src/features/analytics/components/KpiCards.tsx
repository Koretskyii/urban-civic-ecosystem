'use client';

import { useTranslations } from 'next-intl';
import type { KpiCard } from '../analytics.types';

interface KpiCardsProps {
  kpis: KpiCard[];
}

export function KpiCards({ kpis }: KpiCardsProps) {
  const t = useTranslations('analytics');

  const resolve = (key: string) =>
    t.has(`labels.${key}`) ? t(`labels.${key}`) : key;

  return (
    <div className="flex flex-wrap gap-3">
      {kpis.map((kpi) => (
        <div
          key={kpi.id}
          className="min-w-[130px] flex-1 rounded-xl border border-[var(--secondary)]/15 bg-[var(--surface-1)] p-4"
        >
          <p className="text-xs text-[var(--muted-foreground)]">
            {resolve(kpi.label)}
          </p>
          <p className="mt-1 text-2xl font-bold text-[var(--primary)]">
            {kpi.value.toLocaleString()}
            {kpi.unit ? (
              <span className="ml-1 text-base font-normal text-[var(--secondary-dark)]">
                {kpi.unit}
              </span>
            ) : null}
          </p>
        </div>
      ))}
    </div>
  );
}
