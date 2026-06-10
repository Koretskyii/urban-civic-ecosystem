export const normalizeDomain = (domain?: string | null) =>
  domain?.trim().toLowerCase() || '';
