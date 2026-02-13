import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/api/apiClient';
import { queryKeys } from '@/api/queryKeys';
import { useAuthStore } from '@/store';
import type { AuthResponse } from '@/types/auth.types';

export function useCurrentUser() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);

  return useQuery({
    queryKey: queryKeys.auth.me(),
    queryFn: () => apiClient.get<AuthResponse['user']>('/auth/me'),
    enabled: isAuthenticated,
  });
}

export function useLogin() {}

export function useRegister() {}

export function useLogout() {}
