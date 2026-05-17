import type { PermissionKey } from '@/types/rbac.types';
import { useRBAC } from './useRBAC';

interface UsePermissionsOptions {
  cityId: string;
  enabled?: boolean;
}

export const usePermissions = ({
  cityId,
  enabled = true,
}: UsePermissionsOptions) => {
  const rbac = useRBAC({ cityId, enabled });

  return {
    ...rbac,
    permissions: rbac.permissions as PermissionKey[],
  };
};
