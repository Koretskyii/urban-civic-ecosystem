export const API_ROUTES = {
    auth: {
        register: '/auth/register',
        login: '/auth/login',
        refresh: '/auth/refresh',
        logout: '/auth/logout',
        profile: '/auth/profile',
    },
} as const;