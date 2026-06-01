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
