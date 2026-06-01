import type { AlertSeverity } from '@/types';

export const ALERT_SEVERITY_OPTIONS: AlertSeverity[] = [
  'CRITICAL',
  'HIGH',
  'MEDIUM',
  'LOW',
];

export const ALERT_SEVERITY_FILTER_ALL = 'ALL' as const;

export const ALERT_DEFAULT_SEVERITY: AlertSeverity = 'MEDIUM';

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
