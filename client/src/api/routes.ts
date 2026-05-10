export const API_ROUTES = {
  auth: {
    register: '/auth/register',
    login: '/auth/login',
    refresh: '/auth/refresh',
    logout: '/auth/logout',
    profile: '/auth/profile',
    changePassword: '/auth/change-password',
  },
  city: {
    getAll: '/city',
    getById: (id: string): string => `/city/${id}`,
    generateDomainToken: '/city/domain/generate-token',
    verifyDomain: '/city/domain/verify',
    initializeCity: '/city/initialize',
  },
  alerts: {
    all: (cityId: string): string => `/city/${cityId}/alerts`,
  },
  news: {
    all: (cityId: string): string => `/city/${cityId}/news`,
  },
  posts: {
    all: (cityId: string): string => `/city/${cityId}/posts`,
  },
  community: {
    detail: (cityId: string): string => `/city/${cityId}/community`,
  },
} as const;
