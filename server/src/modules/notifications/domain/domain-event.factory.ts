import {
  type BuildCityRequestEventPayloadData,
  type buildAlertEventPayloadData,
  type buildNewsEventPayloadData,
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

export function buildCityRequestEventPayload(
  data: BuildCityRequestEventPayloadData,
) {
  return {
    eventId: crypto.randomUUID(),
    occurredAt: new Date().toISOString(),
    cityId: data.cityId,
    aggregateId: data.requestId,
    actorId: data.actorId,
    requesterId: data.requesterId,
    title: data.title ?? data.requestTitle,
    requestId: data.requestId,
    requestTitle: data.requestTitle,
    status: data.status ?? null,
    departmentId: data.departmentId ?? null,
    departmentName: data.departmentName ?? null,
    reportId: data.reportId ?? null,
    reportType: data.reportType ?? null,
    messageId: data.messageId ?? null,
    messagePreview: data.messagePreview ?? null,
  };
}
