// Neutral analytics payload: the backend stays chart.js-agnostic and the
// client maps each ChartData into a chart.js config via an adapter.
export const CHART_KINDS = [
  'line',
  'bar',
  'horizontal-bar',
  'doughnut',
  'stacked-bar',
] as const;

export type ChartKind = (typeof CHART_KINDS)[number];

export interface ChartSeries {
  label: string;
  data: number[];
}

export interface ChartData {
  id: string;
  kind: ChartKind;
  title: string;
  labels: string[];
  series: ChartSeries[];
  meta?: {
    unit?: string;
    total?: number;
  };
}

export interface KpiCard {
  id: string;
  label: string;
  value: number;
  unit?: string;
}

export interface AnalyticsSection {
  kpis: KpiCard[];
  charts: ChartData[];
}
