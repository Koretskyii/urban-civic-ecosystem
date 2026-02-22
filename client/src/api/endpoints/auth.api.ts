import { apiClient } from '@/api/client';
import { API_ROUTES } from '@/api/routes';
import { AuthResponse, LoginRequest, RegisterRequest } from '@/types/auth.types';

export const authApi = {
    register: (data: RegisterRequest) =>
        apiClient.post<AuthResponse>(API_ROUTES.auth.register, data),

    login: (data: LoginRequest) =>
        apiClient.post<AuthResponse>(API_ROUTES.auth.login, data),

    refresh: () =>
        apiClient.post<{ accessToken: string }>(API_ROUTES.auth.refresh, {}),

    logout: () =>
        apiClient.post(API_ROUTES.auth.logout, {}),

    getProfile: () =>
        apiClient.get<AuthResponse['user']>(API_ROUTES.auth.profile),
};