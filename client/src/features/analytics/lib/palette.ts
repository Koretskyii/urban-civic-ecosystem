// Canvas can't read CSS variables — these hex values mirror globals.css tokens.
export const CHART_PALETTE = [
  '#3f88c5', // secondary
  '#316b50', // success
  '#ffba08', // warning
  '#d00000', // danger
  '#0c263d', // primary
  '#6ba3d6', // secondary-light
  '#4a8a6c', // success-light
  '#9b0000', // danger-dark
] as const;

export const REQUEST_STATUS_COLORS: Record<string, string> = {
  OPEN: '#3f88c5',
  IN_PROGRESS: '#ffba08',
  RESOLVED: '#316b50',
  REJECTED: '#d00000',
};

export const ALERT_SEVERITY_COLORS: Record<string, string> = {
  CRITICAL: '#d00000',
  HIGH: '#e04040',
  MEDIUM: '#ffba08',
  LOW: '#3f88c5',
};

export const colorAt = (index: number): string =>
  CHART_PALETTE[index % CHART_PALETTE.length];
