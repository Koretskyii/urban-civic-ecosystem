import type { CityRequestStatus, ReportType } from '@/types';

export const STATUS_OPTIONS: Array<CityRequestStatus> = [
  'OPEN',
  'IN_PROGRESS',
  'RESOLVED',
  'REJECTED',
];

export const EDITABLE_STATUS_OPTIONS: Array<CityRequestStatus> = [
  'OPEN',
  'IN_PROGRESS',
];

export const REPORT_TYPE_OPTIONS: Array<ReportType> = [
  'PROGRESS',
  'RESOLUTION',
  'REJECTION',
];

export const PRIORITY_OPTIONS = ['ALL', '0', '1', '2', '3', '4', '5'] as const;
