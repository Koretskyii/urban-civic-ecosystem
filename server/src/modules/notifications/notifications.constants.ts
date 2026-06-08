import type { ClassConstructor } from 'class-transformer';
import { InAppNotificationType } from '@/generated/prisma/client';
import { DOMAIN_EVENT_TYPES } from '@/modules/notifications/domain/domain-events';
import type { DomainEventType } from '@/modules/notifications/domain/domain-events.types';
import { AlertEventPayloadDto } from './dto/alert-event-payload.dto';
import { CityRequestEventPayloadDto } from './dto/city-request-event-payload.dto';
import { NewsEventPayloadDto } from './dto/news-event-payload.dto';

export const EVENT_PAYLOAD_DTO_MAP: Record<
  DomainEventType,
  ClassConstructor<object>
> = {
  [DOMAIN_EVENT_TYPES.NEWS_CREATED]: NewsEventPayloadDto,
  [DOMAIN_EVENT_TYPES.NEWS_UPDATED]: NewsEventPayloadDto,
  [DOMAIN_EVENT_TYPES.NEWS_DELETED]: NewsEventPayloadDto,
  [DOMAIN_EVENT_TYPES.ALERT_CREATED]: AlertEventPayloadDto,
  [DOMAIN_EVENT_TYPES.ALERT_UPDATED]: AlertEventPayloadDto,
  [DOMAIN_EVENT_TYPES.ALERT_DELETED]: AlertEventPayloadDto,
  [DOMAIN_EVENT_TYPES.CITY_REQUEST_CREATED]: CityRequestEventPayloadDto,
  [DOMAIN_EVENT_TYPES.CITY_REQUEST_ASSIGNED]: CityRequestEventPayloadDto,
  [DOMAIN_EVENT_TYPES.CITY_REQUEST_STATUS_UPDATED]: CityRequestEventPayloadDto,
  [DOMAIN_EVENT_TYPES.CITY_REQUEST_REPORT_CREATED]: CityRequestEventPayloadDto,
  [DOMAIN_EVENT_TYPES.CITY_REQUEST_MESSAGE_CREATED]: CityRequestEventPayloadDto,
};

export const EVENT_TYPE_TO_NOTIFICATION_TYPE: Record<
  DomainEventType,
  InAppNotificationType
> = {
  [DOMAIN_EVENT_TYPES.NEWS_CREATED]: InAppNotificationType.NEWS_CREATED,
  [DOMAIN_EVENT_TYPES.NEWS_UPDATED]: InAppNotificationType.NEWS_UPDATED,
  [DOMAIN_EVENT_TYPES.NEWS_DELETED]: InAppNotificationType.NEWS_DELETED,
  [DOMAIN_EVENT_TYPES.ALERT_CREATED]: InAppNotificationType.ALERT_CREATED,
  [DOMAIN_EVENT_TYPES.ALERT_UPDATED]: InAppNotificationType.ALERT_UPDATED,
  [DOMAIN_EVENT_TYPES.ALERT_DELETED]: InAppNotificationType.ALERT_DELETED,
  [DOMAIN_EVENT_TYPES.CITY_REQUEST_CREATED]:
    InAppNotificationType.CITY_REQUEST_CREATED,
  [DOMAIN_EVENT_TYPES.CITY_REQUEST_ASSIGNED]:
    InAppNotificationType.CITY_REQUEST_ASSIGNED,
  [DOMAIN_EVENT_TYPES.CITY_REQUEST_STATUS_UPDATED]:
    InAppNotificationType.CITY_REQUEST_STATUS_UPDATED,
  [DOMAIN_EVENT_TYPES.CITY_REQUEST_REPORT_CREATED]:
    InAppNotificationType.CITY_REQUEST_REPORT_CREATED,
  [DOMAIN_EVENT_TYPES.CITY_REQUEST_MESSAGE_CREATED]:
    InAppNotificationType.CITY_REQUEST_MESSAGE_CREATED,
};
