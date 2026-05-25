import { ApiError } from '@/api';

export const isForbiddenError = (error: unknown): boolean =>
  error instanceof ApiError && error.status === 403;
