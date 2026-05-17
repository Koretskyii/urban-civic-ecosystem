/**
 * ProtectedRoute Component
 * Route-level guard that redirects to /forbidden on permission denied
 * Wraps a layout or page component for automatic 403 handling
 */

'use client';

import type { ReactNode } from 'react';
import { useProtectedRoute } from '@/hooks/useProtectedRoute';
import type { PermissionKey } from '@/types/rbac.types';

interface ProtectedRouteProps {
  children: ReactNode;
  cityId: string;
  requiredPermissions: PermissionKey | PermissionKey[];
  redirectTo?: string;
  loadingComponent?: ReactNode;
  enabled?: boolean;
}

export const ProtectedRoute = ({
  children,
  cityId,
  requiredPermissions,
  redirectTo,
  loadingComponent = null,
  enabled = true,
}: ProtectedRouteProps) => {
  const { isLoading, hasAccess } = useProtectedRoute({
    cityId,
    requiredPermissions,
    redirectTo,
    enabled,
  });

  if (isLoading) {
    return <>{loadingComponent}</>;
  }

  return hasAccess ? <>{children}</> : null;
};
