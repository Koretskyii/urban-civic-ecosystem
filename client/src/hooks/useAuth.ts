import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';
import { authApi } from '@/api/endpoints';
import { queryKeys } from '@/api/queryKeys';
import { useAuthStore } from '@/store';
import type {
  LoginRequest,
  RegisterRequest,
  ChangePasswordRequest,
} from '@/types/auth.types';

export function useCurrentUser() {
  const token = useAuthStore((s) => s.token);
  const setUser = useAuthStore((s) => s.setUser);

  const query = useQuery({
    queryKey: queryKeys.auth.me(),
    queryFn: () => authApi.getMe(),
    enabled: Boolean(token),
    retry: false,
  });

  useEffect(() => {
    if (query.data && token) {
      setUser(query.data, token);
    }
  }, [query.data, setUser, token]);

  return query;
}

export function useLogin() {
  const { setUser } = useAuthStore.getState();

  return useMutation({
    mutationFn: (data: LoginRequest) => authApi.login(data),
    onSuccess: (data) => {
      setUser(data.user, data.accessToken);
    },
  });
}

export function useRegister() {
  const { setUser } = useAuthStore.getState();

  return useMutation({
    mutationFn: (data: RegisterRequest) => authApi.register(data),
    onSuccess: (data) => {
      setUser(data.user, data.accessToken);
    },
  });
}

export function useLogout() {
  const queryClient = useQueryClient();
  const { logout } = useAuthStore.getState();

  return useMutation({
    mutationFn: () => authApi.logout(),
    onSuccess: () => {
      logout();
      queryClient.clear();
    },
  });
}

export function useChangePassword() {
  return useMutation({
    mutationFn: (data: ChangePasswordRequest) => authApi.changePassword(data),
  });
}
