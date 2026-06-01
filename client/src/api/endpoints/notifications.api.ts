import { apiClient } from '@/api/client';
import { API_ROUTES } from '@/api/routes';
import type {
  NotificationsListResponse,
  NotificationsUnreadCountResponse,
} from '@/types';

function buildQuery(params: Record<string, string | undefined>) {
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== '') {
      search.set(key, value);
    }
  }
  const query = search.toString();
  return query ? `?${query}` : '';
}

export const notificationsApi = {
  list(params?: {
    cityId?: string;
    onlyUnread?: boolean;
    cursor?: string;
    limit?: number;
  }) {
    const query = buildQuery({
      cityId: params?.cityId,
      onlyUnread:
        typeof params?.onlyUnread === 'boolean'
          ? String(params.onlyUnread)
          : undefined,
      cursor: params?.cursor,
      limit: params?.limit ? String(params.limit) : undefined,
    });

    return apiClient.get<NotificationsListResponse>(
      `${API_ROUTES.notifications.list}${query}`,
    );
  },

  unreadCount(cityId?: string) {
    const query = buildQuery({ cityId });
    return apiClient.get<NotificationsUnreadCountResponse>(
      `${API_ROUTES.notifications.unreadCount}${query}`,
    );
  },

  markRead(id: string) {
    return apiClient.patch<{ updated: boolean }>(
      API_ROUTES.notifications.markRead(id),
      {},
    );
  },

  markAllRead(cityId?: string) {
    const query = buildQuery({ cityId });
    return apiClient.patch<{ updated: number }>(
      `${API_ROUTES.notifications.markAllRead}${query}`,
      {},
    );
  },
};
