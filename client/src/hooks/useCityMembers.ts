'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { cityMembersApi } from '@/api/endpoints';
import { queryKeys } from '@/api/queryKeys';
import type { RoleKey } from '@/types';

export function useCityMembers(
  cityId: string,
  options?: { enabled?: boolean },
) {
  const enabled = options?.enabled ?? true;

  return useQuery({
    queryKey: queryKeys.cityMembers.list(cityId),
    queryFn: () => cityMembersApi.getMembers(cityId),
    enabled: Boolean(cityId && enabled),
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
