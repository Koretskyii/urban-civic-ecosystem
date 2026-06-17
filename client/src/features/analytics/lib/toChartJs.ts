import type {
  ChartData as ChartJsData,
  ChartOptions,
  ChartType,
} from 'chart.js';
import type { ChartData, ChartKind } from '../analytics.types';
import {
  ALERT_SEVERITY_COLORS,
  colorAt,
  REQUEST_STATUS_COLORS,
} from './palette';
import {
  CHART_BORDER_WIDTH,
  CHART_LABEL_MAX_LENGTH,
  LINE_FILL_ALPHA,
  LINE_POINT_RADIUS,
  LINE_TENSION,
} from '../analytics.const';

export interface ToChartJsResult {
  type: ChartType;
  data: ChartJsData;
  options: ChartOptions;
}

interface AdapterOptions {
  resolveLabel?: (raw: string) => string;
  resolveSeries?: (key: string) => string;
}

const identity = (value: string) => value;

const truncate = (value: string, max: number) =>
  value.length > max ? `${value.slice(0, max)}…` : value;

// Charts whose categories carry a fixed semantic color.
const SEMANTIC_COLORS: Record<string, Record<string, string>> = {
  'requests.status': REQUEST_STATUS_COLORS,
  'alerts.severity': ALERT_SEVERITY_COLORS,
};

const baseType = (kind: ChartKind): ChartType => {
  switch (kind) {
    case 'doughnut':
      return 'doughnut';
    case 'line':
      return 'line';
    default:
      return 'bar';
  }
};

const colorForCategory = (chartId: string, rawLabel: string, index: number) =>
  SEMANTIC_COLORS[chartId]?.[rawLabel] ?? colorAt(index);

// Converts the neutral ChartData into a react-chartjs-2 config — all chart.js
// specifics (axis flipping, stacking, coloring) live here.
export const toChartJs = (
  chart: ChartData,
  options: AdapterOptions = {},
): ToChartJsResult => {
  const resolveLabel = options.resolveLabel ?? identity;
  const resolveSeries = options.resolveSeries ?? identity;

  const labels = chart.labels.map((raw) =>
    truncate(resolveLabel(raw), CHART_LABEL_MAX_LENGTH),
  );
  const isCategoryColored = chart.kind === 'doughnut';

  const datasets = chart.series.map((series, seriesIndex) => {
    if (isCategoryColored) {
      const colors = chart.labels.map((raw, i) =>
        colorForCategory(chart.id, raw, i),
      );
      return {
        label: resolveSeries(series.label),
        data: series.data,
        backgroundColor: colors,
        borderColor: '#ffffff',
        borderWidth: CHART_BORDER_WIDTH,
      };
    }

    const color = colorAt(seriesIndex);
    return {
      label: resolveSeries(series.label),
      data: series.data,
      backgroundColor:
        chart.kind === 'line' ? `${color}${LINE_FILL_ALPHA}` : color,
      borderColor: color,
      borderWidth: CHART_BORDER_WIDTH,
      fill: chart.kind === 'line',
      tension: LINE_TENSION,
      pointRadius: LINE_POINT_RADIUS,
    };
  });

  const isHorizontal = chart.kind === 'horizontal-bar';
  const isStacked = chart.kind === 'stacked-bar';

  const commonOptions: ChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: chart.kind === 'doughnut' || chart.series.length > 1,
        position: chart.kind === 'doughnut' ? 'right' : 'top',
      },
    },
  };

  if (chart.kind === 'doughnut') {
    return {
      type: 'doughnut',
      data: { labels, datasets },
      options: commonOptions,
    };
  }

  return {
    type: baseType(chart.kind),
    data: { labels, datasets },
    options: {
      ...commonOptions,
      indexAxis: isHorizontal ? 'y' : 'x',
      scales: {
        x: { stacked: isStacked, beginAtZero: true },
        y: { stacked: isStacked, beginAtZero: true },
      },
    },
  };
};
