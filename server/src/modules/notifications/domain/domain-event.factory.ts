import {
  buildAlertEventPayloadData,
  buildNewsEventPayloadData,
} from './domain-events.types';

export function buildNewsEventPayload(data: buildNewsEventPayloadData) {
  return {
    eventId: crypto.randomUUID(),
    occuredAt: new Date().toISOString(),
    cityId: data.cityId,
    agregateId: data.newsId,
    publisherId: data.publisherId || 'system',
    title: data.title,
  };
}

export function buildAlertEventPayload(data: buildAlertEventPayloadData) {
  return {
    eventId: crypto.randomUUID(),
    occuredAt: new Date().toISOString(),
    cityId: data.cityId,
    agregateId: data.alertId,
    publisherId: data.publisherId || 'system',
    title: data.title,
    alertTypeId: data.alertTypeId,
    severity: data.severity,
    expiresAt: data.expiresAt ? data.expiresAt.toISOString() : null,
  };
}
