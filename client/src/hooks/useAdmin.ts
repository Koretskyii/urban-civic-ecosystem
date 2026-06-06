import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { adminApi } from '@/api/endpoints';
import { queryKeys } from '@/api/queryKeys';
import type {
  AdminCitiesQuery,
  AdminCityCreationRequestsQuery,
  AdminUsersQuery,
  SystemRole,
  UpdateAdminCityPayload,
} from '@/types';

export function useAdminCityCreationRequests(
  query?: AdminCityCreationRequestsQuery,
) {
  return useQuery({
    queryKey: queryKeys.admin.cityCreationRequests(query),
    queryFn: () => adminApi.getCityCreationRequests(query),
  });
}

export function useAdminCityCreationRequest(id?: string) {
  return useQuery({
    queryKey: queryKeys.admin.cityCreationRequest(id ?? ''),
    queryFn: () => adminApi.getCityCreationRequest(id ?? ''),
    enabled: Boolean(id),
  });
}

export function useApproveCityCreationRequest() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => adminApi.approveCityCreationRequest(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.admin.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.cities.all() });
    },
  });
}

export function useRejectCityCreationRequest() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      id,
      rejectionReason,
    }: {
      id: string;
      rejectionReason: string;
    }) => adminApi.rejectCityCreationRequest(id, rejectionReason),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.admin.all });
    },
  });
}

export function useAdminCities(query?: AdminCitiesQuery) {
  return useQuery({
    queryKey: queryKeys.admin.cities(query),
    queryFn: () => adminApi.getCities(query),
  });
}

export function useUpdateAdminCity() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateAdminCityPayload }) =>
      adminApi.updateCity(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.admin.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.cities.all() });
    },
  });
}

export function useDeleteAdminCity() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => adminApi.deleteCity(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.admin.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.cities.all() });
    },
  });
}

export function useAdminUsers(query?: AdminUsersQuery) {
  return useQuery({
    queryKey: queryKeys.admin.users(query),
    queryFn: () => adminApi.getUsers(query),
  });
}

export function useUpdateUserSystemRole() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, systemRole }: { id: string; systemRole: SystemRole }) =>
      adminApi.updateUserSystemRole(id, systemRole),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.admin.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.auth.me() });
    },
  });
}
