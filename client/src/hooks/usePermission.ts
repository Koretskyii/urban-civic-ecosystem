import { useRBAC } from '@/hooks/useRBAC';
import type { PermissionKey } from '@/types/rbac.types';

interface UsePermissionOptions {
  cityId: string;
  enabled?: boolean;
}

/**
 * Single permission check
 * Usage: usePermission('news:create', { cityId: '123' })
 */
export const usePermission = (
  permission: PermissionKey,
  { cityId, enabled = true }: UsePermissionOptions,
) => {
  const { hasPermission, isLoading, error } = useRBAC({ cityId, enabled });
  return {
    can: hasPermission(permission),
    isLoading,
    error,
  };
};

/**
 * Multiple permission check (OR logic - has any)
 * Usage: useAnyPermission(['news:create', 'news:manage'], { cityId: '123' })
 */
export const useAnyPermission = (
  permissions: PermissionKey[],
  { cityId, enabled = true }: UsePermissionOptions,
) => {
  const { hasPermission, isLoading, error } = useRBAC({ cityId, enabled });
  return {
    can: hasPermission(permissions),
    isLoading,
    error,
  };
};

/**
 * All permissions check (AND logic - has all)
 * Usage: useAllPermissions(['post:create', 'post:manage'], { cityId: '123' })
 */
export const useAllPermissions = (
  permissions: PermissionKey[],
  { cityId, enabled = true }: UsePermissionOptions,
) => {
  const { hasAllPermissions, isLoading, error } = useRBAC({ cityId, enabled });
  return {
    can: hasAllPermissions(permissions),
    isLoading,
    error,
  };
};

/**
 * Admin check (has :manage permission)
 * Usage: useCanManage('news', { cityId: '123' })
 */
export const useCanManage = (
  resource: string,
  { cityId, enabled = true }: UsePermissionOptions,
) => {
  const permission = `${resource}:manage` as PermissionKey;
  const { hasPermission, isLoading, error } = useRBAC({ cityId, enabled });
  return {
    can: hasPermission(permission),
    isLoading,
    error,
  };
};
