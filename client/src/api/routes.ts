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
    generateDomainToken: '/city/domain/generate-token',
    verifyDomain: '/city/domain/verify',
  },
} as const;
