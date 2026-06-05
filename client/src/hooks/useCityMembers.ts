'use client';

import {
  useInfiniteQuery,
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query';
import { cityMembersApi } from '@/api/endpoints';
import { queryKeys } from '@/api/queryKeys';
import type { CityMembersListQuery, RoleKey } from '@/types';

export function useCityMembers(
  cityId: string,
  query?: CityMembersListQuery,
  options?: { enabled?: boolean },
) {
  const enabled = options?.enabled ?? true;

  return useQuery({
    queryKey: queryKeys.cityMembers.list(cityId, query),
    queryFn: () => cityMembersApi.getMembers(cityId, query),
    enabled: Boolean(cityId && enabled),
    placeholderData: (previousData) => previousData,
  });
}

export function useInfiniteCityMembers(
  cityId: string,
  query?: CityMembersListQuery,
  options?: { enabled?: boolean },
) {
  const enabled = options?.enabled ?? true;
  const baseQuery = { limit: 50, ...query };

  return useInfiniteQuery({
    queryKey: queryKeys.cityMembers.list(cityId, baseQuery),
    queryFn: ({ pageParam }) =>
      cityMembersApi.getMembers(cityId, {
        ...baseQuery,
        page: pageParam,
      }),
    initialPageParam: 1,
    getNextPageParam: (lastPage) => lastPage.nextPage ?? undefined,
    enabled: Boolean(cityId && enabled),
    placeholderData: (previousData) => previousData,
  });
}

export function useUpdateCityMemberRole() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      cityId,
      userId,
      role,
    }: {
      cityId: string;
      userId: string;
      role: RoleKey;
    }) => cityMembersApi.updateMemberRole(cityId, userId, role),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.cityMembers.all(variables.cityId),
      });
      queryClient.invalidateQueries({
        queryKey: queryKeys.rbac.permissions(variables.cityId),
      });
    },
  });
}

export function useUpdateCityMemberBlockStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      cityId,
      userId,
      isBlocked,
    }: {
      cityId: string;
      userId: string;
      isBlocked: boolean;
    }) => cityMembersApi.updateMemberBlockStatus(cityId, userId, isBlocked),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.cityMembers.all(variables.cityId),
      });
      queryClient.invalidateQueries({
        queryKey: queryKeys.rbac.permissions(variables.cityId),
      });
    },
  });
}
