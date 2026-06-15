'use client';

import { useMemo } from 'react';
import { Chart } from 'react-chartjs-2';
import { useTranslations } from 'next-intl';
import type { ChartData } from '../analytics.types';
import { registerCharts } from '../lib/registerCharts';
import { toChartJs } from '../lib/toChartJs';
import { DEFAULT_CHART_HEIGHT } from '../analytics.const';

registerCharts();

interface AnalyticsChartProps {
  chart: ChartData;
  height?: number;
  className?: string;
}

export function AnalyticsChart({
  chart,
  height = DEFAULT_CHART_HEIGHT,
  className,
}: AnalyticsChartProps) {
  const t = useTranslations('analytics');

  const safe = useMemo(() => {
    const labelKey = (key: string) => `labels.${key}`;
    const enumKey = (raw: string) => `enums.${raw}`;

    const resolveSeries = (key: string) =>
      t.has(labelKey(key)) ? t(labelKey(key)) : key;
    const resolveLabel = (raw: string) =>
      t.has(enumKey(raw)) ? t(enumKey(raw)) : raw;
    const title = t.has(labelKey(chart.title))
      ? t(labelKey(chart.title))
      : chart.title;

    const { type, data, options } = toChartJs(chart, {
      resolveSeries,
      resolveLabel,
    });
    return { type, data, options, title };
  }, [chart, t]);

  const isEmpty = chart.series.every((series) =>
    series.data.every((value) => value === 0),
  );

  return (
    <div
      className={`rounded-xl border border-[var(--secondary)]/15 bg-[var(--surface-1)] p-4 ${className ?? ''}`}
    >
      <h3 className="mb-3 text-sm font-semibold text-[var(--primary)]">
        {safe.title}
      </h3>
      {isEmpty ? (
        <div
          className="flex items-center justify-center text-sm text-[var(--muted-foreground)]"
          style={{ height }}
        >
          {t.has('common.noData') ? t('common.noData') : 'No data'}
        </div>
      ) : (
        <div style={{ height }}>
          <Chart type={safe.type} data={safe.data} options={safe.options} />
        </div>
      )}
    </div>
  );
}
