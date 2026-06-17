export const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || 'https://localhost:3001';

export const APP_ENV =
  process.env.NEXT_PUBLIC_APP_ENV ?? process.env.NODE_ENV ?? 'development';

export const IS_PRODUCTION = APP_ENV === 'production';
