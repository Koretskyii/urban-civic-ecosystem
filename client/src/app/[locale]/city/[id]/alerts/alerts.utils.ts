import type { Alert, AlertSeverity } from '@/types';

const SEVERITY_RANK: Record<AlertSeverity, number> = {
  CRITICAL: 4,
  HIGH: 3,
  MEDIUM: 2,
  LOW: 1,
};

export const addDaysToDateTimeInput = (value: string, days: number) => {
  const baseDate = value ? new Date(value) : new Date();
  baseDate.setDate(baseDate.getDate() + days);
  return baseDate.toISOString().slice(0, 16);
};

export const toDateTimeLocalInputValue = (value?: string | null) => {
  return value ? new Date(value).toISOString().slice(0, 16) : '';
};

export const sortAlertsByPriority = (alerts: Alert[]) => {
  return [...alerts].sort((a, b) => {
    const bySeverity = SEVERITY_RANK[b.severity] - SEVERITY_RANK[a.severity];
    if (bySeverity !== 0) {
      return bySeverity;
    }
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  });
};
