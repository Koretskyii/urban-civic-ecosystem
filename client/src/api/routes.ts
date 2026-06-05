export const API_ROUTES = {
  auth: {
    register: '/auth/register',
    login: '/auth/login',
    refresh: '/auth/refresh',
    logout: '/auth/logout',
    me: '/auth/me',
    profile: '/auth/profile',
    changePassword: '/auth/change-password',
  },
  users: {
    permissions: '/users/me/permissions',
  },
  city: {
    getAll: '/city',
    getById: (id: string): string => `/city/${id}`,
    join: (id: string): string => `/city/${id}/join`,
    generateDomainToken: '/city/domain/generate-token',
    verifyDomain: '/city/domain/verify',
    initializeCity: '/city/initialize',
  },
  cityMembers: {
    all: (cityId: string): string => `/city/${cityId}/members`,
    role: (cityId: string, userId: string): string =>
      `/city/${cityId}/members/${userId}/role`,
    block: (cityId: string, userId: string): string =>
      `/city/${cityId}/members/${userId}/block`,
    unblock: (cityId: string, userId: string): string =>
      `/city/${cityId}/members/${userId}/unblock`,
  },
  alerts: {
    all: (cityId: string): string => `/city/${cityId}/alerts`,
    detail: (cityId: string, alertId: string): string =>
      `/city/${cityId}/alerts/${alertId}`,
    types: (cityId: string): string => `/city/${cityId}/alerts/types`,
  },
  news: {
    all: (cityId: string): string => `/city/${cityId}/news`,
    detail: (cityId: string, newsId: string): string =>
      `/city/${cityId}/news/${newsId}`,
  },
  posts: {
    all: (cityId: string): string => `/city/${cityId}/posts`,
  },
  community: {
    detail: (cityId: string): string => `/city/${cityId}/community`,
  },
  cityRequests: {
    all: (cityId: string): string => `/city/${cityId}/requests`,
    detail: (cityId: string, requestId: string): string =>
      `/city/${cityId}/requests/${requestId}`,
    assign: (cityId: string, requestId: string): string =>
      `/city/${cityId}/requests/${requestId}/assign`,
    status: (cityId: string, requestId: string): string =>
      `/city/${cityId}/requests/${requestId}/status`,
    reports: (cityId: string, requestId: string): string =>
      `/city/${cityId}/requests/${requestId}/reports`,
    messages: (cityId: string, requestId: string): string =>
      `/city/${cityId}/requests/${requestId}/messages`,
  },
  notifications: {
    list: '/notifications',
    unreadCount: '/notifications/unread-count',
    markRead: (id: string): string => `/notifications/${id}/read`,
    markAllRead: '/notifications/read-all',
    stream: '/notifications/stream',
  },
  departments: {
    all: (cityId: string): string => `/city/${cityId}/departments`,
    detail: (cityId: string, departmentId: string): string =>
      `/city/${cityId}/departments/${departmentId}`,
  },
} as const;
