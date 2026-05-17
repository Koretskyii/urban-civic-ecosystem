'use client';

import type { ReactNode } from 'react';
import { useRBAC } from '@/hooks/useRBAC';
import type { PermissionKey } from '@/types/rbac.types';

interface PermissionGateProps {
  children: ReactNode;
  permission?: PermissionKey | PermissionKey[];
  has?: PermissionKey | PermissionKey[];
  cityId: string;
  fallback?: ReactNode;
  enabled?: boolean;
}

export const PermissionGate = ({
  children,
  permission,
  has,
  cityId,
  fallback = null,
  enabled = true,
}: PermissionGateProps) => {
  const { hasPermission, isLoading } = useRBAC({ cityId, enabled });
  const required = has ?? permission;

  if (isLoading) {
    return <>{fallback}</>;
  }

  if (!required) return <>{children}</>;

  return hasPermission(required) ? <>{children}</> : <>{fallback}</>;
};
