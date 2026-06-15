import type {
  AlertListQuery,
  GetCityRequestsQuery,
  NewsListQuery,
  CityMembersListQuery,
  SurveyListQuery,
} from '@/types';
import {
  CITY_ALERTS_DEFAULT_FILTER_FIELDS,
  CITY_NEWS_DEFAULT_FILTER_FIELDS,
  CITY_MEMBERS_DEFAULT_FILTER_FIELDS,
  CITY_REQUESTS_DEFAULT_FILTER_FIELDS,
} from './api.constants';

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
    currentCreationRequest: () =>
      [...queryKeys.cities.all(), 'creation-requests', 'current'] as const,
  },

  cityRequests: {
    all: (cityId: string) => ['city-requests', cityId] as const,
    list: (cityId: string, query?: GetCityRequestsQuery) =>
      [
        'city-requests',
        cityId,
        'list',
        query?.scope ?? CITY_REQUESTS_DEFAULT_FILTER_FIELDS.scope,
        query?.status ?? CITY_REQUESTS_DEFAULT_FILTER_FIELDS.status,
        query?.departmentId ?? CITY_REQUESTS_DEFAULT_FILTER_FIELDS.departmentId,
        query?.priority ?? CITY_REQUESTS_DEFAULT_FILTER_FIELDS.priority,
        query?.search ?? CITY_REQUESTS_DEFAULT_FILTER_FIELDS.search,
        query?.limit ?? CITY_REQUESTS_DEFAULT_FILTER_FIELDS.limit,
        query?.sortBy ?? CITY_REQUESTS_DEFAULT_FILTER_FIELDS.sortBy,
        query?.sortOrder ?? CITY_REQUESTS_DEFAULT_FILTER_FIELDS.sortOrder,
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
    list: (cityId: string, filters?: CityMembersListQuery) =>
      [
        'city-members',
        cityId,
        'list',
        filters?.search ?? CITY_MEMBERS_DEFAULT_FILTER_FIELDS.search,
        filters?.role ?? CITY_MEMBERS_DEFAULT_FILTER_FIELDS.role,
        filters?.limit ?? CITY_MEMBERS_DEFAULT_FILTER_FIELDS.limit,
        filters?.page ?? CITY_MEMBERS_DEFAULT_FILTER_FIELDS.page,
        filters?.sortBy ?? CITY_MEMBERS_DEFAULT_FILTER_FIELDS.sortBy,
        filters?.sortOrder ?? CITY_MEMBERS_DEFAULT_FILTER_FIELDS.sortOrder,
      ] as const,
  },

  surveys: {
    all: (cityId: string) => ['surveys', cityId] as const,
    list: (cityId: string, query?: SurveyListQuery) =>
      [
        'surveys',
        cityId,
        'list',
        query?.includeDeleted ?? false,
        query?.status ?? 'all',
        query?.search ?? '',
        query?.limit ?? 40,
        query?.sortBy ?? 'createdAt',
        query?.sortOrder ?? 'desc',
      ] as const,
    detail: (cityId: string, surveyId: string) =>
      ['surveys', cityId, 'detail', surveyId] as const,
  },

  news: {
    all: (cityId: string) => ['news', cityId] as const,
    list: (cityId: string, filters?: NewsListQuery) =>
      [
        'news',
        cityId,
        'list',
        filters?.includeDeleted ??
          CITY_NEWS_DEFAULT_FILTER_FIELDS.includeDeleted,
        filters?.search ?? CITY_NEWS_DEFAULT_FILTER_FIELDS.search,
        filters?.limit ?? CITY_NEWS_DEFAULT_FILTER_FIELDS.limit,
        filters?.sortBy ?? CITY_NEWS_DEFAULT_FILTER_FIELDS.sortBy,
        filters?.sortOrder ?? CITY_NEWS_DEFAULT_FILTER_FIELDS.sortOrder,
      ] as const,
    detail: (cityId: string, newsId: string) =>
      ['news', cityId, 'detail', newsId] as const,
  },

  alerts: {
    all: (cityId: string) => ['alerts', cityId] as const,
    list: (cityId: string, filters?: AlertListQuery) =>
      [
        'alerts',
        cityId,
        'list',
        filters?.includeDeleted ??
          CITY_ALERTS_DEFAULT_FILTER_FIELDS.includeDeleted,
        filters?.onlyActive ?? CITY_ALERTS_DEFAULT_FILTER_FIELDS.onlyActive,
        filters?.severity ?? CITY_ALERTS_DEFAULT_FILTER_FIELDS.severity,
        filters?.alertTypeId ?? CITY_ALERTS_DEFAULT_FILTER_FIELDS.alertTypeId,
        filters?.search ?? CITY_ALERTS_DEFAULT_FILTER_FIELDS.search,
        filters?.limit ?? CITY_ALERTS_DEFAULT_FILTER_FIELDS.limit,
        filters?.sortBy ?? CITY_ALERTS_DEFAULT_FILTER_FIELDS.sortBy,
        filters?.sortOrder ?? CITY_ALERTS_DEFAULT_FILTER_FIELDS.sortOrder,
      ] as const,
    detail: (cityId: string, alertId: string) =>
      ['alerts', cityId, 'detail', alertId] as const,
    types: (cityId: string) => ['alerts', cityId, 'types'] as const,
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

  admin: {
    all: ['admin'] as const,
    cityCreationRequests: (query?: unknown) =>
      [...queryKeys.admin.all, 'city-creation-requests', query] as const,
    cityCreationRequest: (id: string) =>
      [...queryKeys.admin.all, 'city-creation-requests', id] as const,
    cities: (query?: unknown) =>
      [...queryKeys.admin.all, 'cities', query] as const,
    users: (query?: unknown) =>
      [...queryKeys.admin.all, 'users', query] as const,
  },

  analytics: {
    all: ['analytics'] as const,
    cityRequests: (cityId: string, query?: unknown) =>
      [...queryKeys.analytics.all, 'city', cityId, 'requests', query] as const,
    cityRequestsGeo: (cityId: string) =>
      [...queryKeys.analytics.all, 'city', cityId, 'requests', 'geo'] as const,
    citySurveys: (cityId: string, query?: unknown) =>
      [...queryKeys.analytics.all, 'city', cityId, 'surveys', query] as const,
    cityAlerts: (cityId: string, query?: unknown) =>
      [...queryKeys.analytics.all, 'city', cityId, 'alerts', query] as const,
    systemOverview: (query?: unknown) =>
      [...queryKeys.analytics.all, 'system', 'overview', query] as const,
  },
} as const;
