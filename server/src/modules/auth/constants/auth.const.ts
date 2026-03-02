export const AUTH_PROVIDERS = {
  LOCAL: 'local',
  GOOGLE: 'google',
} as const;

export type AuthProvider = (typeof AUTH_PROVIDERS)[keyof typeof AUTH_PROVIDERS];
