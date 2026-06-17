export const AUTH_PROVIDERS = {
  LOCAL: 'local',
  GOOGLE: 'google',
} as const;

export type AuthProvider = (typeof AUTH_PROVIDERS)[keyof typeof AUTH_PROVIDERS];

export const AUTH_SUCCESS_MESSAGES = {
  LOGGED_OUT: 'Вийшли з акаунта',
} as const;

const cookieDomain = process.env.COOKIE_DOMAIN || undefined;

export const SESSION_MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

export const REFRESH_COOKIE_OPTIONS = {
  httpOnly: true,
  secure: true,
  sameSite: 'strict' as const,
  path: '/auth/refresh',
  maxAge: SESSION_MAX_AGE_MS,
  ...(cookieDomain && { domain: cookieDomain }),
};

export const ACCESS_COOKIE_OPTIONS = {
  httpOnly: false, // JS must read this on the client
  secure: true,
  sameSite: 'lax' as const,
  path: '/',
  maxAge: SESSION_MAX_AGE_MS,
  ...(cookieDomain && { domain: cookieDomain }),
};

export const REFRESH_CLEAR_OPTIONS = {
  httpOnly: true,
  secure: true,
  sameSite: 'strict' as const,
  path: '/auth/refresh',
  ...(cookieDomain && { domain: cookieDomain }),
};

export const ACCESS_CLEAR_OPTIONS = {
  httpOnly: false,
  secure: true,
  sameSite: 'lax' as const,
  path: '/',
  ...(cookieDomain && { domain: cookieDomain }),
};
