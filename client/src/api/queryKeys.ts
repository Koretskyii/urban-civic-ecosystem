import type { AlertSeverity, GetCityRequestsQuery } from '@/types';

export const queryKeys = {
  auth: {
    register: () => ['auth', 'register'] as const,
    login: () => ['auth', 'login'] as const,
    refresh: () => ['auth', 'refresh'] as const,
    logout: () => ['auth', 'logout'] as const,
    profile: () => ['auth', 'profile'] as const,
    me: () => ['auth', 'me'] as const,
  },

  rbac: {
    all: ['rbac'] as const,
    permissions: (cityId: string) =>
      [...queryKeys.rbac.all, 'permissions', cityId] as const,
  },

  cities: {
    all: () => ['cities'] as const,
    detail: (id: string) => ['cities', id] as const,
  },

  cityRequests: {
    all: (cityId: string) => ['city-requests', cityId] as const,
    list: (cityId: string, query?: GetCityRequestsQuery) =>
      [
        'city-requests',
        cityId,
        'list',
        query?.scope ?? 'all',
        query?.status ?? 'all-statuses',
        query?.departmentId ?? 'all-departments',
      ] as const,
    detail: (cityId: string, requestId: string) =>
      ['city-requests', cityId, 'detail', requestId] as const,
    departments: (cityId: string) =>
      ['city-requests', cityId, 'departments'] as const,
    messages: (cityId: string, requestId: string) =>
      ['city-requests', cityId, 'messages', requestId] as const,
  },

  cityMembers: {
    all: (cityId: string) => ['city-members', cityId] as const,
    list: (cityId: string) => ['city-members', cityId, 'list'] as const,
  },

  projects: {
    all: (cityId: string) => ['projects', cityId] as const,
    detail: (id: string) => ['projects', 'detail', id] as const,
  },

  communities: {
    all: (cityId: string) => ['communities', cityId] as const,
    detail: (id: string) => ['communities', 'detail', id] as const,
    posts: (communityId: string) =>
      ['communities', communityId, 'posts'] as const,
  },

  surveys: {
    all: (cityId: string) => ['surveys', cityId] as const,
    detail: (id: string) => ['surveys', 'detail', id] as const,
  },

  crowdfunding: {
    all: (cityId: string) => ['crowdfunding', cityId] as const,
    detail: (id: string) => ['crowdfunding', 'detail', id] as const,
  },

  news: {
    all: (cityId: string) => ['news', cityId] as const,
    list: (
      cityId: string,
      filters?: { includeDeleted?: boolean; search?: string },
    ) =>
      [
        'news',
        cityId,
        'list',
        filters?.includeDeleted ?? false,
        filters?.search ?? '',
      ] as const,
    detail: (cityId: string, newsId: string) =>
      ['news', cityId, 'detail', newsId] as const,
  },

  alerts: {
    all: (cityId: string) => ['alerts', cityId] as const,
    list: (
      cityId: string,
      filters?: {
        includeDeleted?: boolean;
        search?: string;
        severity?: AlertSeverity;
        onlyActive?: boolean;
      },
    ) =>
      [
        'alerts',
        cityId,
        'list',
        filters?.includeDeleted ?? false,
        filters?.onlyActive ?? true,
        filters?.severity ?? '',
        filters?.search ?? '',
      ] as const,
    detail: (cityId: string, alertId: string) =>
      ['alerts', cityId, 'detail', alertId] as const,
    types: (cityId: string) => ['alerts', cityId, 'types'] as const,
  },

  posts: {
    all: (cityId: string) => ['posts', cityId] as const,
  },

  chats: {
    all: (cityId: string) => ['chats', cityId] as const,
    messages: (chatId: string) => ['chats', chatId, 'messages'] as const,
  },

  notifications: {
    all: ['notifications'] as const,
    list: (cityId?: string, onlyUnread?: boolean) =>
      ['notifications', 'list', cityId ?? 'all', onlyUnread ?? false] as const,
    unreadCount: (cityId?: string) =>
      ['notifications', 'unread-count', cityId ?? 'all'] as const,
  },
} as const;
