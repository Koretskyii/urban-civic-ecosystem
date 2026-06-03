import type { AlertSeverity } from '@/types';

export const ALERT_SEVERITY_OPTIONS: AlertSeverity[] = [
  'CRITICAL',
  'HIGH',
  'MEDIUM',
  'LOW',
];

export const ALERT_SEVERITY_FILTER_ALL = 'ALL' as const;

export const ALERT_DEFAULT_SEVERITY: AlertSeverity = 'MEDIUM';

export const ALERT_SEVERITY_BADGE_VARIANT: Record<
  AlertSeverity,
  'default' | 'secondary' | 'success' | 'warning' | 'danger'
> = {
  CRITICAL: 'danger',
  HIGH: 'warning',
  MEDIUM: 'secondary',
  LOW: 'success',
};

export const ALERT_TYPE_TRANSLATION_KEYS: Record<string, string> = {
  POWER_OUTAGE: 'alerts.types.POWER_OUTAGE',
  WATER_SUPPLY: 'alerts.types.WATER_SUPPLY',
  GAS_SUPPLY: 'alerts.types.GAS_SUPPLY',
  ROAD_ACCIDENT: 'alerts.types.ROAD_ACCIDENT',
  EMERGENCY: 'alerts.types.EMERGENCY',
  WEATHER: 'alerts.types.WEATHER',
  TECHNICAL_WORKS: 'alerts.types.TECHNICAL_WORKS',
  OTHER: 'alerts.types.OTHER',
};

export const SEVERITY_VARIANT: Record<
  AlertSeverity,
  'default' | 'secondary' | 'success' | 'warning' | 'danger'
> = {
  CRITICAL: 'danger',
  HIGH: 'warning',
  MEDIUM: 'secondary',
  LOW: 'success',
};

export const SEVERITY_ACCENT: Record<AlertSeverity, string> = {
  CRITICAL: 'border-[var(--danger)] bg-[rgba(208,0,0,0.06)]',
  HIGH: 'border-[var(--warning)] bg-[rgba(255,186,8,0.12)]',
  MEDIUM: 'border-[var(--secondary)] bg-[rgba(63,136,197,0.08)]',
  LOW: 'border-[var(--success)] bg-[rgba(49,107,80,0.08)]',
};
