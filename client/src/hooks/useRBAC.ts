import { useQuery } from '@tanstack/react-query';
import { useCallback, useMemo } from 'react';
import { rbacApi } from '@/api/endpoints';
import { queryKeys } from '@/api/queryKeys';
import { RBAC_CACHE_TTL } from '@/constants/rbac.const';
import type { PermissionKey } from '@/types/rbac.types';

interface UseRBACOptions {
  cityId: string;
  enabled?: boolean;
}

export const useRBAC = ({ cityId, enabled = true }: UseRBACOptions) => {
  const { data, error, isLoading, refetch } = useQuery({
    queryKey: queryKeys.rbac.permissions(cityId),
    queryFn: () => rbacApi.getUserPermissions(cityId),
    enabled: enabled && Boolean(cityId),
    staleTime: RBAC_CACHE_TTL,
    gcTime: RBAC_CACHE_TTL,
    retry: 1,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
  });

  const permissions = useMemo(
    () => (data?.permissions ?? []) as PermissionKey[],
    [data],
  );

  const hasPermission = useCallback(
    (permission: PermissionKey | PermissionKey[]): boolean => {
      const required = Array.isArray(permission) ? permission : [permission];
      return required.some((p) => permissions.includes(p));
    },
    [permissions],
  );

  const hasAllPermissions = useCallback(
    (requiredPermissions: PermissionKey[]): boolean => {
      return requiredPermissions.every((p) => permissions.includes(p));
    },
    [permissions],
  );

  return useMemo(
    () => ({
      permissions,
      role: data?.role ?? null,
      hasPermission,
      hasAllPermissions,
      isLoading,
      error,
      refetch,
    }),
    [
      permissions,
      data?.role,
      hasPermission,
      hasAllPermissions,
      isLoading,
      error,
      refetch,
    ],
  );
};
