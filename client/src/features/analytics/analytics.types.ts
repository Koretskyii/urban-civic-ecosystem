// Client mirror of the backend analytics contract
// (server: modules/analytics/dto/chart-data.dto.ts).
export type ChartKind =
  | 'line'
  | 'bar'
  | 'horizontal-bar'
  | 'doughnut'
  | 'stacked-bar';

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

export const ANALYTICS_GRANULARITIES = ['day', 'week', 'month'] as const;
export type AnalyticsGranularity = (typeof ANALYTICS_GRANULARITIES)[number];

export interface AnalyticsQuery {
  granularity?: AnalyticsGranularity;
  from?: string;
  to?: string;
}

export interface GeoPoint {
  lat: number;
  lng: number;
  weight: number;
}

export interface RequestsGeo {
  points: GeoPoint[];
}
