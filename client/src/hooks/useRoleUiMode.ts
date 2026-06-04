'use client';

import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useCallback, useEffect, useMemo } from 'react';

export type RoleUiMode = 'citizen' | 'manage';

const isRoleUiMode = (value: string | null): value is RoleUiMode =>
  value === 'citizen' || value === 'manage';

export function useRoleUiMode(canManage: boolean, isPermissionLoading = false) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const searchParamsString = searchParams.toString();
  const paramMode = searchParams.get('uiMode');
  const mode = useMemo<RoleUiMode>(() => {
    if (isPermissionLoading) return 'citizen';
    return isRoleUiMode(paramMode) && (paramMode !== 'manage' || canManage)
      ? paramMode
      : 'citizen';
  }, [canManage, isPermissionLoading, paramMode]);

  const replaceModeParam = useCallback(
    (nextMode: RoleUiMode) => {
      const params = new URLSearchParams(searchParamsString);
      if (nextMode === 'citizen') {
        params.delete('uiMode');
      } else {
        params.set('uiMode', nextMode);
      }
      const query = params.toString();
      router.replace(query ? `${pathname}?${query}` : pathname, {
        scroll: false,
      });
    },
    [pathname, router, searchParamsString],
  );

  const setMode = useCallback(
    (nextMode: RoleUiMode) => {
      const safeMode =
        nextMode === 'manage' && !canManage ? 'citizen' : nextMode;
      replaceModeParam(safeMode);
    },
    [canManage, replaceModeParam],
  );

  useEffect(() => {
    if (!isPermissionLoading && paramMode === 'manage' && !canManage) {
      replaceModeParam('citizen');
    }
  }, [canManage, isPermissionLoading, paramMode, replaceModeParam]);

  return { mode, setMode };
}
