export type InAppNotificationType =
  | 'NEWS_CREATED'
  | 'NEWS_UPDATED'
  | 'NEWS_DELETED'
  | 'ALERT_CREATED'
  | 'ALERT_UPDATED'
  | 'ALERT_DELETED'
  | 'CITY_REQUEST_CREATED'
  | 'CITY_REQUEST_ASSIGNED'
  | 'CITY_REQUEST_STATUS_UPDATED'
  | 'CITY_REQUEST_REPORT_CREATED'
  | 'CITY_REQUEST_MESSAGE_CREATED'
  | 'SURVEY_CREATED'
  | 'SURVEY_CLOSED';

export interface InAppNotificationCity {
  id: string;
  name: string;
  region: string;
}

export interface InAppNotification {
  id: string;
  userId: string;
  cityId: string;
  city?: InAppNotificationCity | null;
  type: InAppNotificationType;
  eventId?: string | null;
  title: string;
  body?: string | null;
  link?: string | null;
  payload?: Record<string, unknown> | null;
  isRead: boolean;
  readAt?: string | null;
  createdAt: string;
}

export interface NotificationsListResponse {
  items: InAppNotification[];
  nextCursor: string | null;
}

export interface NotificationsUnreadCountResponse {
  count: number;
}
