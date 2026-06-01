export type InAppNotificationType =
  | 'NEWS_CREATED'
  | 'NEWS_UPDATED'
  | 'NEWS_DELETED'
  | 'ALERT_CREATED'
  | 'ALERT_UPDATED'
  | 'ALERT_DELETED';

export interface InAppNotification {
  id: string;
  userId: string;
  cityId: string;
  type: InAppNotificationType;
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
