'use client';

import { useTranslations } from 'next-intl';
import type { AnalyticsSection } from '../analytics.types';
import { AnalyticsChart } from './AnalyticsChart';
import { KpiCards } from './KpiCards';

interface AnalyticsSectionViewProps {
  section?: AnalyticsSection;
  isLoading?: boolean;
  isError?: boolean;
}

export function AnalyticsSectionView({
  section,
  isLoading,
  isError,
}: AnalyticsSectionViewProps) {
  const t = useTranslations('analytics');

  if (isLoading) {
    return (
      <div className="py-12 text-center text-sm text-[var(--muted-foreground)]">
        {t.has('common.loading') ? t('common.loading') : 'Loading...'}
      </div>
    );
  }

  if (isError || !section) {
    return (
      <div className="py-12 text-center text-sm text-[var(--danger)]">
        {t.has('common.error') ? t('common.error') : 'Failed to load analytics'}
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-5">
      {section.kpis.length > 0 ? <KpiCards kpis={section.kpis} /> : null}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {section.charts.map((chart, index) => {
          const isLastOdd =
            section.charts.length % 2 === 1 &&
            index === section.charts.length - 1;
          return (
            <AnalyticsChart
              key={chart.id}
              chart={chart}
              className={isLastOdd ? 'lg:col-span-2' : undefined}
            />
          );
        })}
      </div>
    </div>
  );
}
