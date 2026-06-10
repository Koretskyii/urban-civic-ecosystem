import { apiClient } from '../client';
import { API_ROUTES } from '../routes';
import type {
  AdminCitiesQuery,
  AdminCity,
  AdminCityCreationRequest,
  AdminCityCreationRequestsQuery,
  AdminPaginatedResponse,
  AdminUser,
  AdminUsersQuery,
  SystemRole,
  UpdateAdminCityPayload,
} from '@/types';

const toQueryString = (query?: Record<string, unknown>) => {
  const params = new URLSearchParams();

  for (const [key, value] of Object.entries(query ?? {})) {
    if (value === undefined || value === null || value === '') continue;
    params.set(key, String(value));
  }

  const queryString = params.toString();
  return queryString ? `?${queryString}` : '';
};

export const adminApi = {
  getCityCreationRequests: (query?: AdminCityCreationRequestsQuery) =>
    apiClient.get<AdminPaginatedResponse<AdminCityCreationRequest>>(
      `${API_ROUTES.admin.cityCreationRequests}${toQueryString(query)}`,
    ),

  getCityCreationRequest: (id: string) =>
    apiClient.get<AdminCityCreationRequest>(
      API_ROUTES.admin.cityCreationRequestDetail(id),
    ),

  approveCityCreationRequest: (id: string) =>
    apiClient.post(API_ROUTES.admin.approveCityCreationRequest(id), {}),

  rejectCityCreationRequest: (id: string, rejectionReason: string) =>
    apiClient.post(API_ROUTES.admin.rejectCityCreationRequest(id), {
      rejectionReason,
    }),

  getCities: (query?: AdminCitiesQuery) =>
    apiClient.get<AdminPaginatedResponse<AdminCity>>(
      `${API_ROUTES.admin.cities}${toQueryString(query)}`,
    ),

  updateCity: (id: string, data: UpdateAdminCityPayload) =>
    apiClient.patch<AdminCity>(API_ROUTES.admin.cityDetail(id), data),

  deleteCity: (id: string) =>
    apiClient.delete<Pick<AdminCity, 'id' | 'deletedAt'>>(
      API_ROUTES.admin.cityDetail(id),
    ),

  getUsers: (query?: AdminUsersQuery) =>
    apiClient.get<AdminPaginatedResponse<AdminUser>>(
      `${API_ROUTES.admin.users}${toQueryString(query)}`,
    ),

  updateUserSystemRole: (id: string, systemRole: SystemRole) =>
    apiClient.patch<AdminUser>(API_ROUTES.admin.userSystemRole(id), {
      systemRole,
    }),

  blockUser: (id: string) =>
    apiClient.patch<AdminUser>(API_ROUTES.admin.blockUser(id), {}),

  unblockUser: (id: string) =>
    apiClient.patch<AdminUser>(API_ROUTES.admin.unblockUser(id), {}),
};
