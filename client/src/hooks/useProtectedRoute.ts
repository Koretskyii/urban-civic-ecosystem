/**
 * Protected Route Hook
 * Checks permissions and redirects to /forbidden on 403
 * Use in page layout or route components
 */

'use client';

import { useEffect } from 'react';
import { useRouter } from '@/i18n/navigation';
import { useRBAC } from '@/hooks/useRBAC';
import type { PermissionKey } from '@/types/rbac.types';

interface UseProtectedRouteOptions {
  cityId: string;
  requiredPermissions: PermissionKey | PermissionKey[];
  redirectTo?: string;
  enabled?: boolean;
}

export const useProtectedRoute = ({
  cityId,
  requiredPermissions,
  redirectTo = '/forbidden',
  enabled = true,
}: UseProtectedRouteOptions) => {
  const router = useRouter();
  const { hasPermission, isLoading, error } = useRBAC({ cityId, enabled });
  const hasAccess = hasPermission(requiredPermissions);

  useEffect(() => {
    if (isLoading || hasAccess) return;

    if (error || !hasAccess) {
      router.replace(redirectTo);
    }
  }, [error, hasAccess, isLoading, redirectTo, router]);

  return { isLoading, hasAccess };
};
