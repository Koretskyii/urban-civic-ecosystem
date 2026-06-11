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
    currentCreationRequest: '/city/creation-requests/me/current',
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
  admin: {
    cityCreationRequests: '/admin/city-creation-requests',
    cityCreationRequestDetail: (id: string): string =>
      `/admin/city-creation-requests/${id}`,
    approveCityCreationRequest: (id: string): string =>
      `/admin/city-creation-requests/${id}/approve`,
    rejectCityCreationRequest: (id: string): string =>
      `/admin/city-creation-requests/${id}/reject`,
    cities: '/admin/cities',
    cityDetail: (id: string): string => `/admin/cities/${id}`,
    users: '/admin/users',
    userSystemRole: (id: string): string => `/admin/users/${id}/system-role`,
    blockUser: (id: string): string => `/admin/users/${id}/block`,
    unblockUser: (id: string): string => `/admin/users/${id}/unblock`,
  },
  departments: {
    all: (cityId: string): string => `/city/${cityId}/departments`,
    detail: (cityId: string, departmentId: string): string =>
      `/city/${cityId}/departments/${departmentId}`,
  },
  surveys: {
    all: (cityId: string): string => `/city/${cityId}/surveys`,
    detail: (cityId: string, surveyId: string): string =>
      `/city/${cityId}/surveys/${surveyId}`,
    close: (cityId: string, surveyId: string): string =>
      `/city/${cityId}/surveys/${surveyId}/close`,
    vote: (cityId: string, surveyId: string): string =>
      `/city/${cityId}/surveys/${surveyId}/vote`,
  },
} as const;
