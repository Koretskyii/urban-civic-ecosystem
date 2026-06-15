'use client';

import { useMemo } from 'react';
import { useCityRequestsAnalytics } from '@/hooks';
import { AnalyticsChart, KpiCards } from '@/features/analytics';
import {
  TEASER_CHART_HEIGHT,
  TEASER_KPI_LIMIT,
} from '@/features/analytics/analytics.const';

interface AnalyticsTeaserProps {
  cityId: string;
  enabled: boolean;
}

export function AnalyticsTeaser({ cityId, enabled }: AnalyticsTeaserProps) {
  const { data } = useCityRequestsAnalytics(
    cityId,
    { granularity: 'month' },
    { enabled },
  );

  const statusChart = useMemo(
    () => data?.charts.find((chart) => chart.id === 'requests.status'),
    [data],
  );

  if (!data) return null;

  return (
    <div className="flex flex-col gap-3">
      {data.kpis.length > 0 ? (
        <KpiCards kpis={data.kpis.slice(0, TEASER_KPI_LIMIT)} />
      ) : null}
      {statusChart ? (
        <AnalyticsChart chart={statusChart} height={TEASER_CHART_HEIGHT} />
      ) : null}
    </div>
  );
}
