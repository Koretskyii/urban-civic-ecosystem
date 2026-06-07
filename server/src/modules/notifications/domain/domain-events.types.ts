import { DOMAIN_EVENT_TYPES } from './domain-events';

export type DomainEventType =
  (typeof DOMAIN_EVENT_TYPES)[keyof typeof DOMAIN_EVENT_TYPES];

type BaseEventPayload = {
  eventId: string;
  occuredAt: string; // ISO date string
  cityId: string;
  aggregateId: string;
  publisherId: string;
  title: string;
};

export type NewsEventPayload = BaseEventPayload;
export type AlertEventPayload = BaseEventPayload & {
  alertTypeId: string;
  severity: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
  expiresAt: string | null; // ISO date string
};

export interface buildAlertEventPayloadData {
  cityId: string;
  alertId: string;
  publisherId: string | null;
  title: string;
  alertTypeId: string;
  severity: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
  expiresAt: Date | null;
}

export interface buildNewsEventPayloadData {
  cityId: string;
  newsId: string;
  publisherId: string | null;
  title: string;
}

export type CityRequestEventPayload = {
  eventId: string;
  occurredAt: string;
  cityId: string;
  aggregateId: string;
  actorId: string;
  requesterId: string;
  title: string;
  requestId: string;
  requestTitle: string;
  status?: string | null;
  departmentId?: string | null;
  departmentName?: string | null;
  reportId?: string | null;
  reportType?: string | null;
  messageId?: string | null;
  messagePreview?: string | null;
};

export interface BuildCityRequestEventPayloadData {
  cityId: string;
  requestId: string;
  requesterId: string;
  actorId: string;
  requestTitle: string;
  title?: string;
  status?: string | null;
  departmentId?: string | null;
  departmentName?: string | null;
  reportId?: string | null;
  reportType?: string | null;
  messageId?: string | null;
  messagePreview?: string | null;
}
