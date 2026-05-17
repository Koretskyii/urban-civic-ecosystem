import { apiClient } from '@/api/client';
import { API_ROUTES } from '@/api/routes';
import type { GetPermissionsResponse } from '@/types/rbac.types';

export const rbacApi = {
  /**
   * GET /users/me/permissions?cityId=xxx
   * Returns list of permission keys for current user in specific city
   */
  getUserPermissions: (cityId: string) =>
    apiClient.get<GetPermissionsResponse>(
      `${API_ROUTES.users.permissions}?cityId=${encodeURIComponent(cityId)}`,
    ),
};
