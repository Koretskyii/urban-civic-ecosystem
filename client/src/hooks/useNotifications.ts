import { useEffect } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { notificationsApi } from '@/api/endpoints';
import { queryKeys } from '@/api/queryKeys';
import { API_BASE_URL } from '@/config';
import { useAuthStore } from '@/store';

export function useNotificationsList(cityId?: string, onlyUnread?: boolean) {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const token = useAuthStore((s) => s.token);

  return useQuery({
    queryKey: queryKeys.notifications.list(cityId, onlyUnread),
    queryFn: () => notificationsApi.list({ cityId, onlyUnread, limit: 20 }),
    enabled: isAuthenticated && Boolean(token),
  });
}

export function useUnreadNotificationsCount(cityId?: string) {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const token = useAuthStore((s) => s.token);

  return useQuery({
    queryKey: queryKeys.notifications.unreadCount(cityId),
    queryFn: () => notificationsApi.unreadCount(cityId),
    enabled: isAuthenticated && Boolean(token),
  });
}

export function useMarkNotificationRead(cityId?: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (notificationId: string) =>
      notificationsApi.markRead(notificationId),
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: queryKeys.notifications.unreadCount(cityId),
      });
      void queryClient.invalidateQueries({
        queryKey: queryKeys.notifications.list(cityId, false),
      });
      void queryClient.invalidateQueries({
        queryKey: queryKeys.notifications.list(cityId, true),
      });
    },
  });
}

export function useMarkAllNotificationsRead(cityId?: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => notificationsApi.markAllRead(cityId),
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: queryKeys.notifications.unreadCount(cityId),
      });
      void queryClient.invalidateQueries({
        queryKey: queryKeys.notifications.list(cityId, false),
      });
      void queryClient.invalidateQueries({
        queryKey: queryKeys.notifications.list(cityId, true),
      });
    },
  });
}

export function useNotificationsRealtime(cityId?: string) {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!isAuthenticated) return;

    const source = new EventSource(
      new URL('/notifications/stream', API_BASE_URL),
      {
        withCredentials: true,
      },
    );

    source.onmessage = () => {
      void queryClient.invalidateQueries({
        queryKey: queryKeys.notifications.unreadCount(cityId),
      });
      void queryClient.invalidateQueries({
        queryKey: queryKeys.notifications.list(cityId, false),
      });
    };

    source.onerror = () => {
      void queryClient.invalidateQueries({
        queryKey: queryKeys.notifications.unreadCount(cityId),
      });
    };

    return () => {
      source.close();
    };
  }, [cityId, isAuthenticated, queryClient]);
}
