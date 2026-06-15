import {
  AlertSeverity,
  CityCreationRequestStatus,
  RequestStatus,
} from '@/generated/prisma/enums';

export const ANALYTICS_CACHE_TTL_MS = 10 * 60 * 1000;

export const TOP_SURVEYS = 10;
export const TOP_CITIES = 10;
export const TOP_REGIONS = 12;

// Geo heatmap: round coordinates to ~100m buckets and weight by count.
export const GEO_ROUND_DECIMALS = 3;
export const SECONDS_PER_DAY = 86_400;

export const STATUS_ORDER: RequestStatus[] = [
  RequestStatus.OPEN,
  RequestStatus.IN_PROGRESS,
  RequestStatus.RESOLVED,
  RequestStatus.REJECTED,
];

export const SEVERITY_ORDER: AlertSeverity[] = [
  AlertSeverity.CRITICAL,
  AlertSeverity.HIGH,
  AlertSeverity.MEDIUM,
  AlertSeverity.LOW,
];

export const CITY_FUNNEL_ORDER: CityCreationRequestStatus[] = [
  CityCreationRequestStatus.PENDING,
  CityCreationRequestStatus.APPROVED,
  CityCreationRequestStatus.REJECTED,
];
